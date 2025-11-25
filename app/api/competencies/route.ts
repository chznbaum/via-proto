import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { generateEmbedding } from '@/libs/embeddings';

/**
 * GET /api/competencies?q=react&limit=10
 * Search for competencies using hybrid semantic search
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Call the hybrid search function
    const { data: competencies, error } = await supabase.rpc(
      'search_competencies_hybrid',
      {
        search_query: query,
        query_embedding: queryEmbedding,
        result_limit: limit,
      }
    );

    if (error) {
      console.error('Error searching competencies:', error);
      return NextResponse.json(
        { error: 'Failed to search competencies' },
        { status: 500 }
      );
    }

    // Fetch category details for each competency
    const results = await Promise.all(
      (competencies || []).map(async (comp: any) => {
        let category = null;
        if (comp.category_id) {
          const { data: cat } = await supabase
            .from('categories')
            .select('name, slug, icon')
            .eq('id', comp.category_id)
            .single();
          category = cat;
        }

        return {
          id: comp.id,
          name: comp.name,
          slug: comp.slug,
          icon: comp.icon,
          description: comp.description,
          category,
          topics_count: comp.topics_count,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in GET /api/competencies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
