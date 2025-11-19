import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { getUserDefaultAccount } from '@/libs/auth';

/**
 * GET /api/paths
 * List learning paths with filtering and sorting
 * Query params:
 * - view: 'my' | 'team' | 'public' (default: 'my')
 * - category: string (optional)
 * - skill_level: 'beginner' | 'intermediate' | 'advanced' (optional)
 * - sort: 'created_at' | 'popular' | 'time' (default: 'created_at')
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = req.nextUrl;
    const view = searchParams.get('view') || 'my';
    const category = searchParams.get('category');
    const skillLevel = searchParams.get('skill_level');
    const sort = searchParams.get('sort') || 'created_at';
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20'),
      100
    );
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's account
    const accountData = await getUserDefaultAccount(user.id);

    if (!accountData) {
      return NextResponse.json(
        { error: 'No active account found' },
        { status: 400 }
      );
    }

    const { account } = accountData;

    // Build base query
    let query = supabase
      .from('learning_paths')
      .select(
        `
        *,
        topic:topics(id, name, category, description),
        creator:profiles!creator_id(id, name, avatar_url),
        account:accounts(id, name)
      `,
        { count: 'exact' }
      );

    // Apply view filter
    if (view === 'my') {
      query = query.eq('creator_id', user.id);
    } else if (view === 'team') {
      query = query.eq('account_id', account.id);
    } else if (view === 'public') {
      query = query.eq('is_public', true);
    } else {
      return NextResponse.json(
        { error: 'Invalid view parameter' },
        { status: 400 }
      );
    }

    // Apply category filter if provided
    if (category) {
      query = query.eq('topics.category', category);
    }

    // Apply skill level filter if provided
    if (skillLevel) {
      if (!['beginner', 'intermediate', 'advanced'].includes(skillLevel)) {
        return NextResponse.json(
          { error: 'Invalid skill_level parameter' },
          { status: 400 }
        );
      }
      query = query.eq('skill_level', skillLevel);
    }

    // Apply sorting
    let sortColumn = 'created_at';
    let ascending = false;

    if (sort === 'popular') {
      sortColumn = 'view_count';
      ascending = false;
    } else if (sort === 'time') {
      sortColumn = 'total_estimated_hours';
      ascending = true; // Shortest first
    } else if (sort === 'created_at') {
      sortColumn = 'created_at';
      ascending = false; // Newest first
    } else {
      return NextResponse.json(
        { error: 'Invalid sort parameter' },
        { status: 400 }
      );
    }

    query = query.order(sortColumn, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: paths, error: pathsError, count } = await query;

    if (pathsError) {
      console.error('Error fetching paths:', pathsError);
      return NextResponse.json(
        { error: 'Failed to fetch paths' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paths: paths || [],
      pagination: {
        limit,
        offset,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/paths:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
