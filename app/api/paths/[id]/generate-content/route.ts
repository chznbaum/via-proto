import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { generateLearningPath } from '@/libs/openrouter';
import { AIPathResponseSchema } from '@/libs/validation/path-schema';
import {
  getDefaultModelForTier,
  getModelConfig,
  isModelAllowedForTier,
} from '@/libs/models';
import { fetchUnsplashImage, triggerUnsplashDownload } from '@/libs/unsplash';

/**
 * POST /api/paths/[id]/generate-content
 * Generate the actual content for a pending learning path
 * Updates status throughout the generation process
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the path and verify ownership
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select('*, topic:topics(*), account:accounts(*)')
      .eq('id', pathId)
      .single();

    if (pathError || !path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    // Verify user has access to this account's paths
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', path.account_id)
      .eq('user_id', user.id)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already generating or completed
    if (path.generation_status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Path is not in pending status',
          current_status: path.generation_status,
        },
        { status: 400 }
      );
    }

    console.log('🚀 Starting generation for path:', pathId);

    // 3. Update status to generating_metadata
    await supabase
      .from('learning_paths')
      .update({ generation_status: 'generating_metadata' })
      .eq('id', pathId);

    // 4. Determine model to use
    const requestedModel = path.generation_metadata?.model_requested;
    let selectedModel: string;

    if (requestedModel) {
      const modelConfig = getModelConfig(requestedModel);
      if (
        modelConfig &&
        isModelAllowedForTier(modelConfig, path.account.subscription_tier) &&
        modelConfig.supportsWebSearch &&
        modelConfig.supportsStructuredOutput
      ) {
        selectedModel = requestedModel;
      } else {
        selectedModel = getDefaultModelForTier(path.account.subscription_tier);
      }
    } else {
      selectedModel = getDefaultModelForTier(path.account.subscription_tier);
    }

    console.log('🤖 Using model:', selectedModel);

    // 5. Update status to fetching_image
    await supabase
      .from('learning_paths')
      .update({ generation_status: 'fetching_image' })
      .eq('id', pathId);

    // 6. Fetch Unsplash image in parallel with AI generation prep
    let unsplashImageId: string | null = null;
    try {
      const unsplashImage = await fetchUnsplashImage(path.topic.name);

      if (unsplashImage) {
        const { data: existingImage } = await supabase
          .from('unsplash_images')
          .select('id')
          .eq('photo_id', unsplashImage.photoId)
          .single();

        if (existingImage) {
          unsplashImageId = existingImage.id;
        } else {
          const { data: newImage, error: imageError } = await supabase
            .from('unsplash_images')
            .insert({
              photo_id: unsplashImage.photoId,
              url: unsplashImage.url,
              photographer: unsplashImage.photographer,
              photographer_url: unsplashImage.photographerUrl,
              download_location: unsplashImage.downloadLocation,
            })
            .select('id')
            .single();

          if (!imageError && newImage) {
            unsplashImageId = newImage.id;
            await triggerUnsplashDownload(unsplashImage.downloadLocation);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to fetch Unsplash image:', error);
    }

    // 7. Update status to curating_resources
    await supabase
      .from('learning_paths')
      .update({
        generation_status: 'curating_resources',
        model_used: selectedModel,
        ...(unsplashImageId && { unsplash_image_id: unsplashImageId }),
      })
      .eq('id', pathId);

    // 8. Generate learning path using AI
    console.log('🧠 Generating path content with AI...');
    const aiResponse = await generateLearningPath({
      topic: path.topic.name,
      skillLevel: path.skill_level,
      goals: path.generation_metadata?.goals,
      model: selectedModel,
    });

    // 9. Validate AI response
    let validatedPath;
    try {
      validatedPath = AIPathResponseSchema.parse(aiResponse);
    } catch (validationError) {
      console.error('AI response validation failed:', validationError);
      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'failed',
          generation_error: 'The AI generated an invalid response. Please try again.',
        })
        .eq('id', pathId);

      return NextResponse.json(
        { error: 'AI validation failed. Please try generating again.' },
        { status: 500 }
      );
    }

    // 10. Update path with title, description, and estimated hours
    await supabase
      .from('learning_paths')
      .update({
        title: validatedPath.title,
        description: validatedPath.description,
        total_estimated_hours: validatedPath.total_estimated_hours,
      })
      .eq('id', pathId);

    console.log('📝 Updated path metadata:', {
      title: validatedPath.title,
      hours: validatedPath.total_estimated_hours,
    });

    // 11. Insert sections and resources
    for (const section of validatedPath.sections) {
      const { data: newSection, error: sectionError } = await supabase
        .from('sections')
        .insert({
          learning_path_id: pathId,
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
        await supabase
          .from('learning_paths')
          .update({
            generation_status: 'failed',
            generation_error: 'Failed to create sections',
          })
          .eq('id', pathId);
        throw new Error('Failed to create sections');
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
        await supabase
          .from('learning_paths')
          .update({
            generation_status: 'failed',
            generation_error: 'Failed to create resources',
          })
          .eq('id', pathId);
        throw new Error('Failed to create resources');
      }
    }

    console.log('✅ Sections and resources created');

    // 12. Mark as completed
    await supabase
      .from('learning_paths')
      .update({
        generation_status: 'completed',
        generation_metadata: {
          ...path.generation_metadata,
          completed_at: new Date().toISOString(),
          sections_count: validatedPath.sections.length,
          resources_count: validatedPath.sections.reduce(
            (acc, section) => acc + section.resources.length,
            0
          ),
        },
      })
      .eq('id', pathId);

    console.log('🎉 Path generation completed:', pathId);

    return NextResponse.json(
      {
        success: true,
        pathId,
        status: 'completed',
        title: validatedPath.title,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in path generation:', error);

    // Try to mark as failed with user-friendly message
    try {
      const { id: pathId } = await params;
      const supabase = await createClient();
      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'failed',
          generation_error: 'An unexpected error occurred during generation. Please try again.',
        })
        .eq('id', pathId);
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return NextResponse.json(
      { error: 'Path generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
