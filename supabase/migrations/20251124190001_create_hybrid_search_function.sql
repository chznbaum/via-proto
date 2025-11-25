-- Migration: Create hybrid semantic + keyword search function
-- Purpose: Combine vector similarity, tsvector ranking, and prefix matching for optimal search
-- Date: 2025-11-24

-- Drop old function if exists (for idempotency)
DROP FUNCTION IF EXISTS public.search_topics_hybrid;

CREATE OR REPLACE FUNCTION public.search_topics_hybrid(
    search_query text,
    query_embedding vector(1536),
    result_limit integer DEFAULT 10,
    filter_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
    topic_id uuid,
    topic_name text,
    topic_slug text,
    topic_description text,
    category_id uuid,
    category_name text,
    category_slug text,
    rank double precision,
    semantic_score double precision,
    keyword_score double precision,
    prefix_score double precision,
    primary_competency_name text,
    primary_competency_slug text,
    all_competency_names text[],
    tags text[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- Weights for hybrid ranking (must sum to 1.0)
    semantic_weight CONSTANT double precision := 0.3;  -- Conceptual relevance
    keyword_weight CONSTANT double precision := 0.5;   -- Keyword relevance (weighted tsvector)
    prefix_weight CONSTANT double precision := 0.2;    -- Autocomplete boost
BEGIN
    RETURN QUERY
    SELECT
        t.id as topic_id,
        t.name as topic_name,
        t.slug as topic_slug,
        t.description as topic_description,
        t.category_id,
        cat.name as category_name,
        cat.slug as category_slug,
        -- Combined weighted rank
        (
            (COALESCE(1 - (t.embedding <=> query_embedding), 0) * semantic_weight) +
            (COALESCE(ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)), 0) * keyword_weight) +
            (CASE
                WHEN lower(t.name) = lower(search_query) THEN 1.0  -- Exact match
                WHEN lower(t.name) LIKE lower(search_query) || '%' THEN 0.5  -- Prefix match
                ELSE 0
            END * prefix_weight)
        )::double precision as rank,
        -- Individual scores for debugging/analysis
        COALESCE(1 - (t.embedding <=> query_embedding), 0)::double precision as semantic_score,
        COALESCE(ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)), 0)::double precision as keyword_score,
        (CASE
            WHEN lower(t.name) = lower(search_query) THEN 1.0
            WHEN lower(t.name) LIKE lower(search_query) || '%' THEN 0.5
            ELSE 0
        END)::double precision as prefix_score,
        -- Primary competency
        (SELECT c.name
         FROM public.topic_competencies tc
         INNER JOIN public.competencies c ON tc.competency_id = c.id
         WHERE tc.topic_id = t.id AND tc.is_primary = true
         LIMIT 1) as primary_competency_name,
        (SELECT c.slug
         FROM public.topic_competencies tc
         INNER JOIN public.competencies c ON tc.competency_id = c.id
         WHERE tc.topic_id = t.id AND tc.is_primary = true
         LIMIT 1) as primary_competency_slug,
        -- All competencies
        (SELECT array_agg(c.name ORDER BY tc.is_primary DESC, c.name)
         FROM public.topic_competencies tc
         INNER JOIN public.competencies c ON tc.competency_id = c.id
         WHERE tc.topic_id = t.id) as all_competency_names,
        -- All tags
        (SELECT array_agg(tag.name ORDER BY tag.name)
         FROM public.taggables tg
         INNER JOIN public.tags tag ON tg.tag_id = tag.id
         WHERE tg.taggable_id = t.id
           AND tg.taggable_type = 'topic'
           AND tag.is_active = true) as tags
    FROM public.topics t
    INNER JOIN public.categories cat ON t.category_id = cat.id
    WHERE
        t.is_active = true
        -- Match if ANY of the three conditions are met
        AND (
            -- Semantic match (embedding exists and is similar)
            (t.embedding IS NOT NULL AND (1 - (t.embedding <=> query_embedding)) > 0.2)
            -- Keyword match (tsvector)
            OR t.search_vector @@ websearch_to_tsquery('english', search_query)
            -- Prefix match
            OR lower(t.name) LIKE lower(search_query) || '%'
        )
        -- Category filter
        AND (filter_category_id IS NULL OR t.category_id = filter_category_id)
    -- Order by combined rank, then alphabetically for ties
    ORDER BY rank DESC, t.name
    LIMIT result_limit;
END;
$$;

-- Add detailed comment
COMMENT ON FUNCTION public.search_topics_hybrid IS
'Hybrid search combining: (1) semantic similarity via embeddings (30%), (2) keyword relevance via weighted tsvector (50%), (3) prefix/autocomplete matching (20%). Requires query_embedding vector for semantic search. Returns individual scores for analysis.';
