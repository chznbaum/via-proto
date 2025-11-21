import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

/**
 * GET /api/topics
 * Search for topics (for typeahead with synonym support)
 * Query params:
 * - q: search query (searches in topic name and synonyms)
 * - limit: max results (default 10, max 50)
 * - category_id: filter by category UUID
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = req.nextUrl;
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const categoryId = searchParams.get('category_id');

    if (query) {
      // Search in both topic names and synonyms
      // Use a raw SQL query for better performance with synonym joins
      const { data: topics, error } = await supabase.rpc('search_topics', {
        search_query: query,
        result_limit: limit,
        filter_category_id: categoryId || null,
      });

      if (error) {
        console.error('Error searching topics:', error);
        return NextResponse.json(
          { error: 'Failed to search topics' },
          { status: 500 }
        );
      }

      return NextResponse.json({ topics: topics || [] });
    } else {
      // No query - return all active topics with category info
      let dbQuery = supabase
        .from('topics')
        .select(`
          *,
          category:categories(name, slug, icon)
        `)
        .eq('is_active', true)
        .order('name')
        .limit(limit);

      if (categoryId) {
        dbQuery = dbQuery.eq('category_id', categoryId);
      }

      const { data: topics, error } = await dbQuery;

      if (error) {
        console.error('Error fetching topics:', error);
        return NextResponse.json(
          { error: 'Failed to fetch topics' },
          { status: 500 }
        );
      }

      return NextResponse.json({ topics: topics || [] });
    }
  } catch (error) {
    console.error('Error in GET /api/topics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint removed - topics are now pre-populated and admin-only
// Users select from existing topics to prevent prompt injection
