import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { getUserDefaultAccount, getAccountWithRole } from '@/libs/auth';
import { PathGenerationRequestSchema } from '@/libs/validation/path-schema';
import { ZodError } from 'zod';
import { addJob } from '@/libs/jobs/queue';
import { getDefaultModelForTier } from '@/libs/models';

/**
 * POST /api/paths/initiate
 * Initiate learning path generation
 * Creates the path record and queues background job for generation
 * Client should poll /api/paths/[id]/status to track progress
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

    // 3. Get target account - either specified account_id or user's default
    let account;

    if (validatedInput.account_id) {
      // User specified an account - verify they're a member
      try {
        const accountWithRole = await getAccountWithRole(user.id, validatedInput.account_id);
        account = accountWithRole.account;
      } catch {
        return NextResponse.json(
          { error: 'You are not a member of this account' },
          { status: 403 }
        );
      }
    } else {
      // Use user's default account
      const accountData = await getUserDefaultAccount(user.id);

      if (!accountData) {
        return NextResponse.json(
          { error: 'No active account found' },
          { status: 400 }
        );
      }

      account = accountData.account;
    }

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
      if (tier === 'pro') return 10;
      if (tier === 'team') {
        const additionalSeats = Math.max(0, seatCount - 2);
        return 20 + (additionalSeats * 6);
      }
      return 1;
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

    // 6. Determine visibility based on tier
    // Free tier: ALWAYS public, Pro/Team: private by default (can override)
    const isPublic =
      account.subscription_tier === 'free'
        ? true
        : validatedInput.is_public ?? false;

    // 7. Create path record immediately with pending status
    // This enforces rate limits before generation starts
    // Note: skill_level defaults to 'beginner' and will be calculated during generation
    const { data: newPath, error: pathError } = await supabase
      .from('learning_paths')
      .insert({
        account_id: account.id,
        creator_id: user.id,
        topic_id: topic.id,
        title: `Learning ${topic.name}`, // Temporary title, will be updated
        description: `Your personalized learning path for ${topic.name}`, // Temporary
        skill_level: 'beginner', // Default, will be calculated during generation
        total_estimated_hours: 0, // Will be calculated after generation
        is_public: isPublic,
        model_used: '', // Will be set during generation
        generation_status: 'pending',
        generation_metadata: {
          goals: validatedInput.goals || null,
          model_requested: validatedInput.model_id || null,
          initiated_at: new Date().toISOString(),
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

    console.log('✅ Path record created:', {
      pathId: newPath.id,
      topic: topic.name,
      tier: account.subscription_tier,
      status: 'pending',
    });

    // 8. Queue the first job (generate_metadata) to start the generation chain
    const selectedModel = validatedInput.model_id || getDefaultModelForTier(account.subscription_tier);

    try {
      await addJob('generate_metadata', {
        pathId: newPath.id,
        topicId: topic.id,
        topicName: topic.name,
        goals: validatedInput.goals,
        modelId: selectedModel,
      });

      console.log('🎬 Job queued: generate_metadata for path', newPath.id);
    } catch (jobError) {
      console.error('Failed to queue generation job:', jobError);
      // Path was created but job failed to queue - mark as failed
      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'failed',
          generation_error: 'Failed to queue generation job',
        })
        .eq('id', newPath.id);

      return NextResponse.json(
        { error: 'Path created but generation failed to start. Please try again.' },
        { status: 500 }
      );
    }

    // 9. Return path ID - client will poll /api/paths/[id]/status
    return NextResponse.json(
      {
        pathId: newPath.id,
        topicName: topic.name,
        status: 'pending',
        message: 'Path created. Generation queued.',
        rate_limit: {
          limit,
          used: (pathsThisMonth || 0) + 1,
          remaining: limit - (pathsThisMonth || 0) - 1,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in path initiation:', error);

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
