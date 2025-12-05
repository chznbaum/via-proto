import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * POST /api/tracking/paths/[pathId]/unarchive
 * Restore an archived tracked path to active status
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

    if (existing.status !== 'archived') {
      return NextResponse.json(
        { error: 'Path is not archived', tracking: existing },
        { status: 409 }
      );
    }

    // Restore to active
    const { data: tracking, error: updateError } = await supabase
      .from('user_path_tracking')
      .update({
        status: 'active',
        archived_at: null,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error unarchiving tracking:', updateError);
      return NextResponse.json(
        { error: 'Failed to unarchive tracking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Error in POST /api/tracking/paths/[pathId]/unarchive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
