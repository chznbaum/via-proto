import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * GET /api/user-competencies
 * Get all competency assessments for the authenticated user
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

    // Fetch user's competency assessments with competency details
    const { data: userCompetencies, error } = await supabase
      .from('user_competencies')
      .select(`
        *,
        competency:competencies(
          id,
          name,
          slug,
          icon,
          description,
          category:categories(
            name,
            slug,
            icon
          )
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user competencies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch competencies' },
        { status: 500 }
      );
    }

    return NextResponse.json({ competencies: userCompetencies || [] });
  } catch (error) {
    console.error('Error in GET /api/user-competencies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-competencies
 * Create or update a competency assessment for the authenticated user
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { competency_id, proficiency_level, notes } = body;

    // Validate input
    if (!competency_id || !proficiency_level) {
      return NextResponse.json(
        { error: 'competency_id and proficiency_level are required' },
        { status: 400 }
      );
    }

    const validProficiencyLevels = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];
    if (!validProficiencyLevels.includes(proficiency_level)) {
      return NextResponse.json(
        { error: `Invalid proficiency_level. Must be one of: ${validProficiencyLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Upsert the competency assessment
    const { data, error } = await supabase
      .from('user_competencies')
      .upsert(
        {
          user_id: user.id,
          competency_id,
          proficiency_level,
          notes: notes || null,
          self_assessed: true,
          assessed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,competency_id',
        }
      )
      .select(`
        *,
        competency:competencies(
          id,
          name,
          slug,
          icon,
          description,
          category:categories(
            name,
            slug,
            icon
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error upserting user competency:', error);
      return NextResponse.json(
        { error: 'Failed to save competency assessment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ competency: data }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/user-competencies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-competencies
 * Delete a competency assessment for the authenticated user
 */
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const competency_id = searchParams.get('competency_id');

    if (!competency_id) {
      return NextResponse.json(
        { error: 'competency_id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_competencies')
      .delete()
      .eq('user_id', user.id)
      .eq('competency_id', competency_id);

    if (error) {
      console.error('Error deleting user competency:', error);
      return NextResponse.json(
        { error: 'Failed to delete competency assessment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/user-competencies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
