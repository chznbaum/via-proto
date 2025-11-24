import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * POST /api/paths/[id]/cancel
 *
 * Cancels an in-progress learning path generation.
 * Sets generation_status to 'cancelled' which triggers graceful shutdown in worker jobs.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch path with account_id
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select('account_id, creator_id, generation_status')
      .eq('id', pathId)
      .single();

    if (pathError || !path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    // Check if user is member of account
    const { data: membership, error: membershipError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', path.account_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if path is already terminal (completed, cancelled, or failed)
    const terminalStatuses = [
      'completed',
      'cancelled',
      'failed',
      'failed_metadata',
      'failed_image',
      'failed_research',
      'failed_sections',
      'failed_validation',
      'failed_link_validation',
      'failed_replacement',
      'failed_enrichment',
    ];

    if (terminalStatuses.includes(path.generation_status)) {
      return NextResponse.json(
        { error: 'Path generation has already completed or been cancelled' },
        { status: 400 }
      );
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        generation_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pathId);

    if (updateError) {
      console.error('Error cancelling path:', updateError);
      throw updateError;
    }

    console.log(`[cancel] Path ${pathId} marked as cancelled by user ${user.id}`);

    return NextResponse.json({ success: true, pathId });
  } catch (error) {
    console.error('Error cancelling path:', error);
    return NextResponse.json(
      { error: 'Failed to cancel path generation' },
      { status: 500 }
    );
  }
}
