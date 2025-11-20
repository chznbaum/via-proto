import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { getUserDefaultAccount } from '@/libs/auth';
import { PathGenerationRequestSchema } from '@/libs/validation/path-schema';
import { ZodError } from 'zod';

/**
 * POST /api/paths/initiate
 * Initiate learning path generation
 * Creates the path record immediately (for rate limiting) and returns pathId
 * Client should then poll /api/paths/[id]/status and trigger /api/paths/[id]/generate-content
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

    const { account } = accountData;

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
        const additionalSeats = Math.max(0, seatCount - 2);
        return 10 + (additionalSeats * 3);
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
    const { data: newPath, error: pathError } = await supabase
      .from('learning_paths')
      .insert({
        account_id: account.id,
        creator_id: user.id,
        topic_id: topic.id,
        title: `Learning ${topic.name}`, // Temporary title, will be updated
        description: `Your personalized learning path for ${topic.name}`, // Temporary
        skill_level: validatedInput.skill_level,
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

    // 8. Return path ID and trigger client to start generation
    return NextResponse.json(
      {
        pathId: newPath.id,
        topicName: topic.name,
        status: 'pending',
        message: 'Path created successfully. Starting generation...',
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
