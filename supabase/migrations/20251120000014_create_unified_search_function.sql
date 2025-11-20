-- Migration: Create search function for topics
-- Purpose: Search topics using weighted tsvector for fast, relevant results
-- Note: Naming allows for future search_learning_paths() function
-- Date: 2025-11-20

CREATE OR REPLACE FUNCTION public.search_topics(
    search_query text,
    result_limit integer DEFAULT 10,
    filter_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
    topic_id uuid,
    topic_name text,
    topic_slug text,
    topic_description text,
    category_id uuid,
    rank real,
    primary_competency_name text,
    primary_competency_slug text,
    all_competency_names text[],
    tags text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id as topic_id,
        t.name as topic_name,
        t.slug as topic_slug,
        t.description as topic_description,
        t.category_id,
        ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)) as rank,
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
        -- All competencies (primary first, then alphabetical)
        (SELECT array_agg(c.name ORDER BY tc.is_primary DESC, c.name)
         FROM public.topic_competencies tc
         INNER JOIN public.competencies c ON tc.competency_id = c.id
         WHERE tc.topic_id = t.id) as all_competency_names,
        -- All tags (alphabetical)
        (SELECT array_agg(tag.name ORDER BY tag.name)
         FROM public.taggables tg
         INNER JOIN public.tags tag ON tg.tag_id = tag.id
         WHERE tg.taggable_id = t.id
           AND tg.taggable_type = 'topic'
           AND tag.is_active = true) as tags
    FROM public.topics t
    WHERE
        t.is_active = true
        AND t.search_vector @@ websearch_to_tsquery('english', search_query)
        AND (filter_category_id IS NULL OR t.category_id = filter_category_id)
    ORDER BY rank DESC, t.name
    LIMIT result_limit;
END;
$$;

-- Add detailed comment
COMMENT ON FUNCTION public.search_topics IS
'Search topics using weighted tsvector (A=name, B=competencies+synonyms, C=description, D=tags). Uses websearch_to_tsquery for natural query parsing including quoted phrases and AND/OR operators.';
