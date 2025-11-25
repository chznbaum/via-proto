-- Migration: Create hybrid semantic + keyword search function for competencies
-- Purpose: Combine vector similarity, synonym matching, and prefix matching
-- Date: 2025-11-24

-- Drop old function if exists (for idempotency)
DROP FUNCTION IF EXISTS public.search_competencies_hybrid;

CREATE OR REPLACE FUNCTION public.search_competencies_hybrid(
    search_query text,
    query_embedding vector(1536),
    result_limit integer DEFAULT 10,
    filter_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    icon text,
    description text,
    category_id uuid,
    is_active boolean,
    rank double precision,
    semantic_score double precision,
    keyword_score double precision,
    prefix_score double precision,
    topics_count integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- Weights for hybrid ranking (must sum to 1.0)
    semantic_weight CONSTANT double precision := 0.3;  -- Conceptual relevance
    keyword_weight CONSTANT double precision := 0.5;   -- Keyword matching (tsvector)
    prefix_weight CONSTANT double precision := 0.2;    -- Autocomplete boost
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.slug,
        c.icon,
        c.description,
        c.category_id,
        c.is_active,
        -- Combined weighted rank
        (
            (COALESCE(1 - (c.embedding <=> query_embedding), 0) * semantic_weight) +
            (COALESCE(ts_rank(c.search_vector, websearch_to_tsquery('english', search_query)), 0) * keyword_weight) +
            (CASE
                WHEN lower(c.name) = lower(search_query) THEN 1.0  -- Exact match
                WHEN lower(c.name) LIKE lower(search_query) || '%' THEN 0.5  -- Prefix match
                ELSE 0
            END * prefix_weight)
        )::double precision as rank,
        -- Individual scores for debugging/analysis
        COALESCE(1 - (c.embedding <=> query_embedding), 0)::double precision as semantic_score,
        COALESCE(ts_rank(c.search_vector, websearch_to_tsquery('english', search_query)), 0)::double precision as keyword_score,
        (CASE
            WHEN lower(c.name) = lower(search_query) THEN 1.0
            WHEN lower(c.name) LIKE lower(search_query) || '%' THEN 0.5
            ELSE 0
        END)::double precision as prefix_score,
        -- Topics count
        (SELECT COUNT(*)::integer
         FROM public.topic_competencies tc
         INNER JOIN public.topics t ON tc.topic_id = t.id
         WHERE tc.competency_id = c.id AND t.is_active = true) as topics_count
    FROM public.competencies c
    WHERE
        c.is_active = true
        -- Match if ANY of the three conditions are met
        AND (
            -- Semantic match (embedding exists and is similar)
            (c.embedding IS NOT NULL AND (1 - (c.embedding <=> query_embedding)) > 0.2)
            -- Keyword match (tsvector)
            OR c.search_vector @@ websearch_to_tsquery('english', search_query)
            -- Prefix match
            OR lower(c.name) LIKE lower(search_query) || '%'
        )
        -- Category filter
        AND (filter_category_id IS NULL OR c.category_id = filter_category_id)
    -- Order by combined rank, then alphabetically for ties
    ORDER BY rank DESC, c.name
    LIMIT result_limit;
END;
$$;

-- Add detailed comment
COMMENT ON FUNCTION public.search_competencies_hybrid IS
'Hybrid search combining: (1) semantic similarity via embeddings (30%), (2) keyword relevance via weighted tsvector (50% - A=name+synonyms, B=category, C=description), (3) prefix/autocomplete matching (20%). Requires query_embedding vector for semantic search. Returns individual scores for analysis.';
