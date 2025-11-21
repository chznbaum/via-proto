-- Migration: Create search_competencies RPC function
-- Purpose: Enable searching competencies by name and synonyms with vector search
-- Date: 2025-11-20

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create search_competencies function
CREATE OR REPLACE FUNCTION public.search_competencies(
    search_query text,
    result_limit integer DEFAULT 10,
    filter_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    name text,
    slug text,
    description text,
    category_id uuid,
    is_active boolean,
    match_type text,
    topics_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH competency_matches AS (
        -- Search in competency names
        SELECT
            c.id,
            c.name,
            c.slug,
            c.description,
            c.category_id,
            c.is_active,
            'name'::text AS match_type,
            similarity(c.name, search_query) AS rank
        FROM public.competencies c
        WHERE
            c.is_active = true
            AND c.name ILIKE '%' || search_query || '%'
            AND (filter_category_id IS NULL OR c.category_id = filter_category_id)

        UNION ALL

        -- Search in synonyms
        SELECT
            c.id,
            c.name,
            c.slug,
            c.description,
            c.category_id,
            c.is_active,
            'synonym'::text AS match_type,
            similarity(cs.synonym, search_query) AS rank
        FROM public.competencies c
        INNER JOIN public.competency_synonyms cs ON c.id = cs.competency_id
        WHERE
            c.is_active = true
            AND cs.synonym ILIKE '%' || search_query || '%'
            AND (filter_category_id IS NULL OR c.category_id = filter_category_id)
    )
    SELECT DISTINCT ON (cm.id)
        cm.id,
        cm.name,
        cm.slug,
        cm.description,
        cm.category_id,
        cm.is_active,
        cm.match_type,
        (SELECT COUNT(*) FROM public.topic_competencies tc
         INNER JOIN public.topics t ON tc.topic_id = t.id
         WHERE tc.competency_id = cm.id AND t.is_active = true)::integer as topics_count
    FROM competency_matches cm
    ORDER BY cm.id, cm.rank DESC, cm.match_type
    LIMIT result_limit;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.search_competencies IS 'Searches competencies by name and synonyms, returning matches with metadata including topic count.';
