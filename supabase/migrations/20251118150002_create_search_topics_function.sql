-- Migration: Create search_topics RPC Function
-- Purpose: Efficient topic search across names and synonyms
-- Date: 2025-11-18

CREATE OR REPLACE FUNCTION public.search_topics(
    search_query text,
    result_limit integer DEFAULT 10,
    filter_category text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    category text,
    tags text[],
    description text,
    is_active boolean,
    created_at timestamptz,
    updated_at timestamptz,
    match_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH topic_matches AS (
        -- Search in topic names
        SELECT
            t.id,
            t.name,
            t.slug,
            t.category,
            t.tags,
            t.description,
            t.is_active,
            t.created_at,
            t.updated_at,
            'name'::text AS match_type,
            similarity(t.name, search_query) AS rank
        FROM public.topics t
        WHERE
            t.is_active = true
            AND t.name ILIKE '%' || search_query || '%'
            AND (filter_category IS NULL OR t.category = filter_category)

        UNION ALL

        -- Search in synonyms
        SELECT
            t.id,
            t.name,
            t.slug,
            t.category,
            t.tags,
            t.description,
            t.is_active,
            t.created_at,
            t.updated_at,
            'synonym'::text AS match_type,
            similarity(s.synonym, search_query) AS rank
        FROM public.topics t
        INNER JOIN public.topic_synonyms s ON t.id = s.topic_id
        WHERE
            t.is_active = true
            AND s.synonym ILIKE '%' || search_query || '%'
            AND (filter_category IS NULL OR t.category = filter_category)
    )
    SELECT DISTINCT ON (tm.id)
        tm.id,
        tm.name,
        tm.slug,
        tm.category,
        tm.tags,
        tm.description,
        tm.is_active,
        tm.created_at,
        tm.updated_at,
        tm.match_type
    FROM topic_matches tm
    ORDER BY tm.id, tm.rank DESC, tm.match_type
    LIMIT result_limit;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.search_topics IS 'Search topics by name or synonyms with optional category filter. Returns distinct topics ordered by relevance.';
