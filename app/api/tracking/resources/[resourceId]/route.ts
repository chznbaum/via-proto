import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { userHasAnyPaidPlan } from '@/libs/auth';
import { UpdateResourceProgressSchema } from '@/libs/validation/progress-schema';
import { ZodError } from 'zod';

/**
 * PATCH /api/tracking/resources/[resourceId]
 * Update progress on a specific resource
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const { resourceId } = await params;
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

    // Validate input
    const body = await req.json();
    const validated = UpdateResourceProgressSchema.parse(body);

    // Get the resource and its path
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select(`
        id,
        section:sections!inner(
          id,
          learning_path_id
        )
      `)
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Type assertion for the joined data (Supabase types this as array but .single() returns object)
    const section = resource.section as unknown as { id: string; learning_path_id: string };
    const pathId = section.learning_path_id;

    // Check if user is tracking this path
    const { data: tracking, error: trackingError } = await supabase
      .from('user_path_tracking')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('learning_path_id', pathId)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json(
        { error: 'You must start tracking this path first' },
        { status: 400 }
      );
    }

    if (tracking.status === 'archived') {
      return NextResponse.json(
        { error: 'Cannot update progress on an archived path. Unarchive it first.' },
        { status: 400 }
      );
    }

    // Determine timestamps based on status
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      user_id: user.id,
      resource_id: resourceId,
      tracking_id: tracking.id,
      status: validated.status,
    };

    if (validated.notes !== undefined) {
      updateData.notes = validated.notes;
    }

    // Set appropriate timestamps based on status
    if (validated.status === 'in_progress') {
      updateData.started_at = now;
      updateData.completed_at = null;
      updateData.skipped_at = null;
    } else if (validated.status === 'completed') {
      updateData.completed_at = now;
      updateData.skipped_at = null;
      // Keep started_at if already set
    } else if (validated.status === 'skipped') {
      updateData.skipped_at = now;
      updateData.completed_at = null;
    } else if (validated.status === 'not_started') {
      updateData.started_at = null;
      updateData.completed_at = null;
      updateData.skipped_at = null;
    }

    // Upsert the progress record
    const { data: progress, error: upsertError } = await supabase
      .from('user_resource_progress')
      .upsert(updateData, {
        onConflict: 'user_id,resource_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting resource progress:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    // Note: The trigger automatically updates user_path_tracking.last_activity_at

    return NextResponse.json({ progress });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error in PATCH /api/tracking/resources/[resourceId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
