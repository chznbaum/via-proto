import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { userHasAnyPaidPlan } from '@/libs/auth';

/**
 * POST /api/tracking/paths/[pathId]/start
 * Start tracking a learning path
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

    // Check if user has access to any paid plan
    const hasPaidAccess = await userHasAnyPaidPlan(user.id);

    if (!hasPaidAccess) {
      return NextResponse.json(
        {
          error: 'Progress tracking requires a Pro or Team subscription',
          upgrade_url: '/upgrade',
        },
        { status: 403 }
      );
    }

    // Verify the path exists and user can access it
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select('id, is_public, account_id')
      .eq('id', pathId)
      .single();

    if (pathError || !path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    // Check if user can access this path (public or in their account)
    if (!path.is_public) {
      const { data: accountUser } = await supabase
        .from('account_users')
        .select('id')
        .eq('account_id', path.account_id)
        .eq('user_id', user.id)
        .single();

      if (!accountUser) {
        return NextResponse.json(
          { error: 'You do not have access to this path' },
          { status: 403 }
        );
      }
    }

    // Check if already tracking (maybe archived)
    const { data: existing } = await supabase
      .from('user_path_tracking')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('learning_path_id', pathId)
      .single();

    if (existing) {
      if (existing.status === 'archived') {
        // Reactivate archived tracking
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
          console.error('Error reactivating tracking:', updateError);
          return NextResponse.json(
            { error: 'Failed to start tracking' },
            { status: 500 }
          );
        }

        return NextResponse.json({ tracking });
      }

      // Already tracking (active or completed)
      return NextResponse.json(
        { error: 'Already tracking this path', tracking: existing },
        { status: 409 }
      );
    }

    // Create new tracking record
    const { data: tracking, error: insertError } = await supabase
      .from('user_path_tracking')
      .insert({
        user_id: user.id,
        learning_path_id: pathId,
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating tracking:', insertError);
      return NextResponse.json(
        { error: 'Failed to start tracking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tracking }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tracking/paths/[pathId]/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
