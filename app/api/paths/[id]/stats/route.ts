import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * GET /api/paths/[id]/stats
 * Get public aggregate learner statistics for a path
 * This is public data (anonymized) so no auth required
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // Get stats from the denormalized table
    const { data: stats, error } = await supabase
      .from('path_learner_stats')
      .select('total_learners, active_this_month, completed_count')
      .eq('learning_path_id', pathId)
      .single();

    if (error) {
      // No stats yet (no one tracking) - return zeros
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          total_learners: 0,
          active_this_month: 0,
          completed_count: 0,
        });
      }
      console.error('Error fetching path stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      total_learners: stats.total_learners,
      active_this_month: stats.active_this_month,
      completed_count: stats.completed_count,
    });
  } catch (error) {
    console.error('Error in GET /api/paths/[id]/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
