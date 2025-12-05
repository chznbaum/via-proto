import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * GET /api/paths/[id]/status
 * Get the current generation status of a learning path
 * Used for polling during generation
 */
export async function GET(
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

    // Fetch path with minimal data for status check
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select(
        `
        id,
        title,
        generation_status,
        generation_error,
        created_at,
        topic:topics(name)
      `
      )
      .eq('id', pathId)
      .single();

    if (pathError || !path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    // Verify user has access to this path
    const { data: accountUser } = await supabase
      .from('learning_paths')
      .select('account_id')
      .eq('id', pathId)
      .single();

    if (!accountUser) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    const { data: hasAccess } = await supabase
      .from('account_users')
      .select('*')
      .eq('account_id', accountUser.account_id)
      .eq('user_id', user.id)
      .single();

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return status
    // Type assertion for topic relation (Supabase types as array but it's a single object)
    const topic = path.topic as unknown as { name: string } | null;
    return NextResponse.json({
      pathId: path.id,
      title: path.title,
      topicName: topic?.name,
      status: path.generation_status,
      error: path.generation_error,
      createdAt: path.created_at,
    });
  } catch (error) {
    console.error('Error fetching path status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
