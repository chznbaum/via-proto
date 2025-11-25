import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';
import { generateEmbedding } from '@/libs/embeddings';
import type { SearchResponse, SearchType, TopicSearchResult } from '@/types/search';

/**
 * GET /api/search
 * Unified search API supporting topics and learning paths
 *
 * Topic Search (type=topics):
 * - Topic names (highest priority)
 * - Competency names and synonyms (high priority)
 * - Topic descriptions (medium priority)
 * - Tags (lowest priority)
 *
 * Query params:
 * - q: search query (required)
 * - type: 'topics' | 'paths' | 'all' (default: 'topics')
 * - limit: max results (default 10, max 50)
 * - category_id: filter by category UUID (optional, topics only)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = req.nextUrl;

    const query = searchParams.get('q');
    const searchType = (searchParams.get('type') || 'topics') as SearchType;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const categoryId = searchParams.get('category_id');

    // Validate search query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Validate search type
    if (!['topics', 'paths', 'all'].includes(searchType)) {
      return NextResponse.json(
        { error: 'Invalid search type. Must be: topics, paths, or all' },
        { status: 400 }
      );
    }

    // Route to appropriate search handler
    switch (searchType) {
      case 'topics':
        return await searchTopics(supabase, query.trim(), limit, categoryId);

      case 'paths':
        // TODO: Implement learning path search
        return NextResponse.json(
          { error: 'Learning path search not yet implemented' },
          { status: 501 }
        );

      case 'all':
        // TODO: Implement combined search
        return NextResponse.json(
          { error: 'Combined search not yet implemented' },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in GET /api/search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Search topics using hybrid semantic + keyword search
 * Combines vector similarity, tsvector ranking, and prefix matching
 */
async function searchTopics(
  supabase: any,
  query: string,
  limit: number,
  categoryId: string | null
) {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // Call hybrid search function
    const { data: results, error } = await supabase.rpc('search_topics_hybrid', {
      search_query: query,
      query_embedding: queryEmbedding,
      result_limit: limit,
      filter_category_id: categoryId || null,
    });

    if (error) {
      console.error('Error searching topics:', error);
      return NextResponse.json(
        { error: 'Topic search failed', details: error.message },
        { status: 500 }
      );
    }

    // Add type discriminator to results
    const typedResults: TopicSearchResult[] = (results || []).map((r: any) => ({
      type: 'topic' as const,
      ...r,
    }));

    const response: SearchResponse = {
      results: typedResults,
      query,
      type: 'topics',
      count: typedResults.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in hybrid search:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
