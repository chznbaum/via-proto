import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * POST /api/tracking/paths/[pathId]/complete
 * Mark a tracked learning path as completed
 */
export async function POST(
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

    // Find the tracking record
    const { data: existing, error: findError } = await supabase
      .from('user_path_tracking')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('learning_path_id', pathId)
      .single();

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Not tracking this path' },
        { status: 404 }
      );
    }

    if (existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Already completed', tracking: existing },
        { status: 409 }
      );
    }

    if (existing.status === 'archived') {
      return NextResponse.json(
        { error: 'Cannot complete an archived path. Unarchive it first.' },
        { status: 400 }
      );
    }

    // Mark as completed
    const { data: tracking, error: updateError } = await supabase
      .from('user_path_tracking')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error completing tracking:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete tracking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Error in POST /api/tracking/paths/[pathId]/complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
