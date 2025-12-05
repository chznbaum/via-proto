import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * GET /api/tracking/paths/[pathId]
 * Get user's tracking status and progress for a specific path
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pathId: string }> }
) {
  try {
    const { pathId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the tracking record if it exists
    const { data: tracking } = await supabase
      .from('user_path_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('learning_path_id', pathId)
      .single();

    // If not tracking, return null tracking with empty progress
    if (!tracking) {
      // Still get total resource count for the path
      const { data: sections } = await supabase
        .from('sections')
        .select('id')
        .eq('learning_path_id', pathId);

      let totalResources = 0;
      if (sections && sections.length > 0) {
        const { count } = await supabase
          .from('resources')
          .select('id', { count: 'exact', head: true })
          .in(
            'section_id',
            sections.map((s) => s.id)
          );
        totalResources = count || 0;
      }

      return NextResponse.json({
        tracking: null,
        progress: {
          total_resources: totalResources,
          completed: 0,
          in_progress: 0,
          skipped: 0,
          not_started: totalResources,
          percentage: 0,
        },
        resources: [],
      });
    }

    // Get all resource progress for this tracking (including notes)
    const { data: resourceProgress } = await supabase
      .from('user_resource_progress')
      .select('resource_id, status, started_at, completed_at, skipped_at, notes')
      .eq('tracking_id', tracking.id);

    // Get total resource count for the path
    const { data: sections } = await supabase
      .from('sections')
      .select('id')
      .eq('learning_path_id', pathId);

    let totalResources = 0;
    let resourcesWithSections: Array<{ id: string; section_id: string }> = [];
    if (sections && sections.length > 0) {
      const { data: resources, count } = await supabase
        .from('resources')
        .select('id, section_id', { count: 'exact' })
        .in(
          'section_id',
          sections.map((s) => s.id)
        );
      totalResources = count || 0;
      resourcesWithSections = resources || [];
    }

    // Calculate progress stats
    const progressMap = new Map(
      (resourceProgress || []).map((p) => [p.resource_id, p])
    );

    let completed = 0;
    let inProgress = 0;
    let skipped = 0;

    for (const progress of resourceProgress || []) {
      if (progress.status === 'completed') completed++;
      else if (progress.status === 'in_progress') inProgress++;
      else if (progress.status === 'skipped') skipped++;
    }

    const notStarted = totalResources - completed - inProgress - skipped;
    const percentage =
      totalResources > 0 ? Math.round((completed / totalResources) * 100) : 0;

    // Build resources array with section_id and notes for each
    const resources = resourcesWithSections.map((r) => {
      const progress = progressMap.get(r.id);
      return {
        resource_id: r.id,
        section_id: r.section_id,
        status: progress?.status || 'not_started',
        notes: progress?.notes || null,
      };
    });

    return NextResponse.json({
      tracking,
      progress: {
        total_resources: totalResources,
        completed,
        in_progress: inProgress,
        skipped,
        not_started: notStarted,
        percentage,
      },
      resources,
    });
  } catch (error) {
    console.error('Error in GET /api/tracking/paths/[pathId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
