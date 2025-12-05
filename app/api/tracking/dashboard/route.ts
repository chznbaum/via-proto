import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { ProgressDashboardQuerySchema } from '@/libs/validation/progress-schema';
import { ZodError } from 'zod';

/**
 * GET /api/tracking/dashboard
 * Get all tracked paths for the current user with progress summaries
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = ProgressDashboardQuerySchema.parse({
      status: searchParams.get('status') || 'active',
      sort: searchParams.get('sort') || 'recent',
      limit: searchParams.get('limit') || '20',
      offset: searchParams.get('offset') || '0',
    });

    // Build the query
    let query = supabase
      .from('user_path_tracking')
      .select(
        `
        id,
        status,
        started_at,
        last_activity_at,
        completed_at,
        archived_at,
        learning_path:learning_paths!inner(
          id,
          title,
          description,
          skill_level,
          total_estimated_hours,
          topic:topics(
            name,
            category:categories(name)
          ),
          unsplash_images(
            url
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id);

    // Filter by status
    if (queryParams.status !== 'all') {
      query = query.eq('status', queryParams.status);
    }

    // Apply sorting
    if (queryParams.sort === 'recent') {
      query = query.order('last_activity_at', { ascending: false });
    } else if (queryParams.sort === 'title') {
      query = query.order('learning_path(title)', { ascending: true });
    }
    // Note: progress sorting is handled after fetch

    // Apply pagination
    query = query.range(
      queryParams.offset,
      queryParams.offset + queryParams.limit - 1
    );

    const { data: trackings, count, error } = await query;

    if (error) {
      console.error('Error fetching tracked paths:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tracked paths' },
        { status: 500 }
      );
    }

    // Get progress for each tracked path
    const pathsWithProgress = await Promise.all(
      (trackings || []).map(async (tracking) => {
        // Get sections for this path
        const { data: sections } = await supabase
          .from('sections')
          .select('id')
          .eq('learning_path_id', tracking.learning_path.id);

        let totalResources = 0;
        if (sections && sections.length > 0) {
          const { count: resourceCount } = await supabase
            .from('resources')
            .select('id', { count: 'exact', head: true })
            .in(
              'section_id',
              sections.map((s) => s.id)
            );
          totalResources = resourceCount || 0;
        }

        // Get completed count for this tracking
        const { count: completedCount } = await supabase
          .from('user_resource_progress')
          .select('id', { count: 'exact', head: true })
          .eq('tracking_id', tracking.id)
          .eq('status', 'completed');

        const completed = completedCount || 0;
        const percentage =
          totalResources > 0 ? Math.round((completed / totalResources) * 100) : 0;

        return {
          tracking: {
            id: tracking.id,
            status: tracking.status,
            started_at: tracking.started_at,
            last_activity_at: tracking.last_activity_at,
            completed_at: tracking.completed_at,
            archived_at: tracking.archived_at,
          },
          path: {
            id: tracking.learning_path.id,
            title: tracking.learning_path.title,
            description: tracking.learning_path.description,
            skill_level: tracking.learning_path.skill_level,
            total_estimated_hours: tracking.learning_path.total_estimated_hours,
            topic: tracking.learning_path.topic,
            unsplash_image: tracking.learning_path.unsplash_images?.[0] || null,
          },
          progress: {
            total_resources: totalResources,
            completed,
            percentage,
          },
        };
      })
    );

    // Sort by progress if requested
    if (queryParams.sort === 'progress') {
      pathsWithProgress.sort((a, b) => b.progress.percentage - a.progress.percentage);
    }

    return NextResponse.json({
      paths: pathsWithProgress,
      total: count || 0,
      has_more: (count || 0) > queryParams.offset + queryParams.limit,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in GET /api/tracking/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
