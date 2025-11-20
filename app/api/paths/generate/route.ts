import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { getUserDefaultAccount } from '@/libs/auth';
import { generateLearningPath } from '@/libs/openrouter';
import {
  PathGenerationRequestSchema,
  AIPathResponseSchema,
} from '@/libs/validation/path-schema';
import {
  getDefaultModelForTier,
  getModelConfig,
  isModelAllowedForTier,
} from '@/libs/models';
import { fetchUnsplashImage, triggerUnsplashDownload } from '@/libs/unsplash';
import { ZodError } from 'zod';

/**
 * POST /api/paths/generate
 * Generate a new learning path using AI
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await req.json();
    const validatedInput = PathGenerationRequestSchema.parse(body);

    // 3. Get user's default account with tier information
    const accountData = await getUserDefaultAccount(user.id);

    if (!accountData) {
      return NextResponse.json(
        { error: 'No active account found' },
        { status: 400 }
      );
    }

    const { account, role } = accountData;

    // 4. Check rate limits based on subscription tier
    const currentDate = new Date();
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const { count: pathsThisMonth, error: countError } = await supabase
      .from('learning_paths')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .gte('created_at', firstDayOfMonth.toISOString());

    if (countError) {
      console.error('Error checking rate limit:', countError);
      return NextResponse.json(
        { error: 'Failed to check rate limit' },
        { status: 500 }
      );
    }

    // Rate limits by tier
    const getRateLimit = (tier: string, seatCount: number) => {
      if (tier === 'free') return 1;
      if (tier === 'pro') return 5;
      if (tier === 'team') {
        // Team: 10 base + 3 per additional seat beyond minimum 2
        const additionalSeats = Math.max(0, seatCount - 2);
        return 10 + (additionalSeats * 3);
      }
      return 1; // Default to free tier limit
    };

    const limit = getRateLimit(account.subscription_tier, account.seat_count);

    if ((pathsThisMonth || 0) >= limit) {
      return NextResponse.json(
        {
          error: 'Monthly generation limit reached',
          limit,
          used: pathsThisMonth,
          tier: account.subscription_tier,
        },
        { status: 429 }
      );
    }

    // 5. Fetch topic details
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', validatedInput.topic_id)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // 6. Determine model (user selection or default)
    let selectedModel: string;

    if (validatedInput.model_id) {
      // User chose a specific model - validate it
      const modelConfig = getModelConfig(validatedInput.model_id);

      if (!modelConfig) {
        return NextResponse.json(
          { error: 'Invalid model selected' },
          { status: 400 }
        );
      }

      // Verify user's tier allows this model
      if (!isModelAllowedForTier(modelConfig, account.subscription_tier)) {
        return NextResponse.json(
          {
            error: 'Model not available for your subscription tier',
            model: modelConfig.name,
            requiredTier: modelConfig.minimumTier,
            currentTier: account.subscription_tier,
          },
          { status: 403 }
        );
      }

      // Verify model supports required features
      if (!modelConfig.supportsWebSearch || !modelConfig.supportsStructuredOutput) {
        return NextResponse.json(
          {
            error: 'Selected model does not support required features (web search and structured output)',
            model: modelConfig.name,
          },
          { status: 400 }
        );
      }

      selectedModel = modelConfig.id;
    } else {
      // Fall back to tier-based default
      selectedModel = getDefaultModelForTier(account.subscription_tier);
    }

    // 7. Generate learning path using AI
    console.log('Generating learning path with AI...', {
      topic: topic.name,
      skillLevel: validatedInput.skill_level,
      model: selectedModel,
      userSelected: !!validatedInput.model_id,
    });

    const aiResponse = await generateLearningPath({
      topic: topic.name,
      skillLevel: validatedInput.skill_level,
      goals: validatedInput.goals,
      model: selectedModel,
    });

    // 8. Validate AI response
    const validatedPath = AIPathResponseSchema.parse(aiResponse);

    // 9. Determine visibility based on tier
    // Free tier: public by default, Pro/Team: private by default (can override)
    const isPublic =
      validatedInput.is_public !== undefined
        ? validatedInput.is_public
        : account.subscription_tier === 'free';

    // 10. Insert learning path into database
    const { data: newPath, error: pathError } = await supabase
      .from('learning_paths')
      .insert({
        account_id: account.id,
        creator_id: user.id,
        topic_id: topic.id,
        title: validatedPath.title,
        description: validatedPath.description,
        skill_level: validatedInput.skill_level,
        total_estimated_hours: validatedPath.total_estimated_hours,
        is_public: isPublic,
        model_used: selectedModel,
        generation_metadata: {
          ...(validatedInput.goals && { goals: validatedInput.goals }),
          generated_at: new Date().toISOString(),
          sections_count: validatedPath.sections.length,
          resources_count: validatedPath.sections.reduce(
            (acc, section) => acc + section.resources.length,
            0
          ),
        },
      })
      .select()
      .single();

    if (pathError || !newPath) {
      console.error('Error creating learning path:', pathError);
      return NextResponse.json(
        { error: 'Failed to create learning path' },
        { status: 500 }
      );
    }

    // 10.5. Fetch and store Unsplash featured image based on topic
    try {
      const unsplashImage = await fetchUnsplashImage(topic.name);

      if (unsplashImage) {
        // Check if this Unsplash photo already exists in our database
        const { data: existingImage } = await supabase
          .from('unsplash_images')
          .select('id')
          .eq('photo_id', unsplashImage.photoId)
          .single();

        let imageId: string;

        if (existingImage) {
          // Reuse existing image record
          imageId = existingImage.id;
        } else {
          // Insert new image record
          const { data: newImage, error: imageError } = await supabase
            .from('unsplash_images')
            .insert({
              photo_id: unsplashImage.photoId,
              url: unsplashImage.url,
              photographer: unsplashImage.photographer,
              photographer_username: unsplashImage.photographerUsername,
              photographer_url: unsplashImage.photographerUrl,
              download_location: unsplashImage.downloadLocation,
              alt_description: unsplashImage.altDescription,
              usage_note: 'Featured image for learning path',
            })
            .select('id')
            .single();

          if (imageError || !newImage) {
            throw new Error('Failed to insert Unsplash image');
          }

          imageId = newImage.id;
        }

        // Update the path with the Unsplash image reference
        await supabase
          .from('learning_paths')
          .update({ unsplash_image_id: imageId })
          .eq('id', newPath.id);

        // Trigger download event (required by Unsplash API guidelines)
        await triggerUnsplashDownload(unsplashImage.downloadLocation);

        console.log('Fetched and stored Unsplash image for topic:', topic.name);
      }
    } catch (error) {
      // Non-critical error - log but continue
      console.warn('Failed to fetch Unsplash image, continuing without:', error);
    }

    // 11. Insert sections and resources
    for (const section of validatedPath.sections) {
      const { data: newSection, error: sectionError } = await supabase
        .from('sections')
        .insert({
          learning_path_id: newPath.id,
          order: section.order,
          title: section.title,
          description: section.description,
          prerequisite_level: section.prerequisite_level,
          notes: section.notes || null,
          estimated_hours: section.estimated_hours,
        })
        .select()
        .single();

      if (sectionError || !newSection) {
        console.error('Error creating section:', sectionError);
        // Clean up: delete the path if section creation fails
        await supabase.from('learning_paths').delete().eq('id', newPath.id);
        return NextResponse.json(
          { error: 'Failed to create sections' },
          { status: 500 }
        );
      }

      // Insert resources for this section
      const resourcesData = section.resources.map((resource) => ({
        section_id: newSection.id,
        order: resource.order,
        title: resource.title,
        url: resource.url,
        type: resource.type,
        is_free: resource.is_free,
        description: resource.description,
        estimated_minutes: resource.estimated_minutes,
      }));

      const { error: resourcesError } = await supabase
        .from('resources')
        .insert(resourcesData);

      if (resourcesError) {
        console.error('Error creating resources:', resourcesError);
        // Clean up: delete the path if resource creation fails
        await supabase.from('learning_paths').delete().eq('id', newPath.id);
        return NextResponse.json(
          { error: 'Failed to create resources' },
          { status: 500 }
        );
      }
    }

    // 12. Fetch the complete path with all related data
    const { data: completePath, error: fetchError } = await supabase
      .from('learning_paths')
      .select(
        `
        *,
        topic:topics(*),
        creator:profiles!creator_id(id, name, avatar_url),
        sections(
          *,
          resources(*)
        )
      `
      )
      .eq('id', newPath.id)
      .single();

    if (fetchError || !completePath) {
      console.error('Error fetching complete path:', fetchError);
      // Path was created successfully, just return basic info
      return NextResponse.json(
        {
          path: newPath,
          message: 'Path created but failed to fetch complete data',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        path: completePath,
        rate_limit: {
          limit,
          used: (pathsThisMonth || 0) + 1,
          remaining: limit - (pathsThisMonth || 0) - 1,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in path generation:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
