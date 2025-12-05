import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { PathUpdateSchema } from '@/libs/validation/path-schema';
import { ZodError } from 'zod';

/**
 * GET /api/paths/[id]
 * Fetch a single learning path with all sections and resources
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // Fetch the path with all related data
    const { data: path, error } = await supabase
      .from('learning_paths')
      .select(
        `
        *,
        topic:topics(*),
        creator:profiles!creator_id(id, name, avatar_url),
        account:accounts(id, name),
        sections(
          *,
          resources(*)
        )
      `
      )
      .eq('id', pathId)
      .single();

    if (error || !path) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Increment view count (fire and forget, don't wait for response)
    supabase
      .from('learning_paths')
      .update({ view_count: (path.view_count || 0) + 1 })
      .eq('id', pathId)
      .then();

    // Sort sections and resources by order
    if (path.sections) {
      path.sections.sort((a: any, b: any) => a.order - b.order);
      path.sections.forEach((section: any) => {
        if (section.resources) {
          section.resources.sort((a: any, b: any) => a.order - b.order);
        }
      });
    }

    return NextResponse.json({ path });
  } catch (error) {
    console.error('Error in GET /api/paths/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/paths/[id]
 * Update a learning path (title, description, or visibility)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedUpdate = PathUpdateSchema.parse(body);

    // Check if the path exists and user has permission to edit
    const { data: existingPath, error: fetchError } = await supabase
      .from('learning_paths')
      .select('*, account:accounts(id)')
      .eq('id', pathId)
      .single();

    if (fetchError || !existingPath) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of the account
    const { data: membership } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', existingPath.account_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this path' },
        { status: 403 }
      );
    }

    // Update the path
    const { data: updatedPath, error: updateError } = await supabase
      .from('learning_paths')
      .update({
        ...validatedUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pathId)
      .select()
      .single();

    if (updateError || !updatedPath) {
      console.error('Error updating path:', updateError);
      return NextResponse.json(
        { error: 'Failed to update path' },
        { status: 500 }
      );
    }

    return NextResponse.json({ path: updatedPath });
  } catch (error) {
    console.error('Error in PATCH /api/paths/[id]:', error);

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

/**
 * DELETE /api/paths/[id]
 * Delete a learning path (and all its sections and resources via CASCADE)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the path exists and user has permission to delete
    const { data: existingPath, error: fetchError } = await supabase
      .from('learning_paths')
      .select('account_id')
      .eq('id', pathId)
      .single();

    if (fetchError || !existingPath) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of the account
    const { data: membership } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', existingPath.account_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this path' },
        { status: 403 }
      );
    }

    // Delete the path (CASCADE will handle sections and resources)
    const { error: deleteError } = await supabase
      .from('learning_paths')
      .delete()
      .eq('id', pathId);

    if (deleteError) {
      console.error('Error deleting path:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete path' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Path deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/paths/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
