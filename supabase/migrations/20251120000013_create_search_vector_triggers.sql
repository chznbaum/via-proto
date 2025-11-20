-- Migration: Create trigger functions to auto-update topic search vectors
-- Purpose: Keep search_vector in sync when topics, competencies, synonyms, or tags change
-- Date: 2025-11-20

-- ============================================================
-- Main function to build the complete search vector for a topic
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_topic_search_vector()
RETURNS TRIGGER AS $$
DECLARE
    competency_names text := '';
    competency_synonyms text := '';
    topic_tags text := '';
BEGIN
    -- Get all competency names for this topic
    SELECT string_agg(c.name, ' ')
    INTO competency_names
    FROM public.topic_competencies tc
    INNER JOIN public.competencies c ON tc.competency_id = c.id
    WHERE tc.topic_id = NEW.id;

    -- Get all competency synonyms for this topic
    SELECT string_agg(cs.synonym, ' ')
    INTO competency_synonyms
    FROM public.topic_competencies tc
    INNER JOIN public.competency_synonyms cs ON tc.competency_id = cs.competency_id
    WHERE tc.topic_id = NEW.id;

    -- Get all tags for this topic
    SELECT string_agg(tag.name, ' ')
    INTO topic_tags
    FROM public.taggables tg
    INNER JOIN public.tags tag ON tg.tag_id = tag.id
    WHERE tg.taggable_id = NEW.id
      AND tg.taggable_type = 'topic'
      AND tag.is_active = true;

    -- Build weighted search vector
    -- A = topic name (highest priority)
    -- B = competency names + synonyms (high priority, treated equally)
    -- C = topic description (medium priority)
    -- D = tags (lowest priority)
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(competency_names, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(competency_synonyms, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(topic_tags, '')), 'D');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on topic insert/update
CREATE TRIGGER topic_search_vector_update
BEFORE INSERT OR UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_topic_search_vector();

COMMENT ON FUNCTION public.update_topic_search_vector IS
'Builds weighted search vector for a topic by aggregating topic name, competency names/synonyms, description, and tags';

-- ============================================================
-- Update topic search vector when topic_competencies change
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_topic_on_competency_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Touch the topic to trigger search_vector rebuild
    UPDATE public.topics
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.topic_id, OLD.topic_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER topic_competencies_change
AFTER INSERT OR UPDATE OR DELETE ON public.topic_competencies
FOR EACH ROW
EXECUTE FUNCTION public.update_topic_on_competency_change();

COMMENT ON FUNCTION public.update_topic_on_competency_change IS
'Triggers topic search_vector rebuild when competencies are added, removed, or changed';

-- ============================================================
-- Update topic search vector when competency name changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_topics_on_competency_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only rebuild if name changed
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        UPDATE public.topics
        SET updated_at = NOW()
        WHERE id IN (
            SELECT topic_id
            FROM public.topic_competencies
            WHERE competency_id = NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competency_name_change
AFTER UPDATE ON public.competencies
FOR EACH ROW
EXECUTE FUNCTION public.update_topics_on_competency_update();

COMMENT ON FUNCTION public.update_topics_on_competency_update IS
'Triggers topic search_vector rebuild when a competency name is changed';

-- ============================================================
-- Update topic search vector when competency synonyms change
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_topics_on_synonym_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.topics
    SET updated_at = NOW()
    WHERE id IN (
        SELECT topic_id
        FROM public.topic_competencies
        WHERE competency_id = COALESCE(NEW.competency_id, OLD.competency_id)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER synonym_change
AFTER INSERT OR UPDATE OR DELETE ON public.competency_synonyms
FOR EACH ROW
EXECUTE FUNCTION public.update_topics_on_synonym_change();

COMMENT ON FUNCTION public.update_topics_on_synonym_change IS
'Triggers topic search_vector rebuild when competency synonyms are added, removed, or changed';

-- ============================================================
-- Update topic search vector when tags change
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_topic_on_tag_change()
RETURNS TRIGGER AS $$
BEGIN
    IF COALESCE(NEW.taggable_type, OLD.taggable_type) = 'topic' THEN
        UPDATE public.topics
        SET updated_at = NOW()
        WHERE id = COALESCE(NEW.taggable_id, OLD.taggable_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER taggable_change
AFTER INSERT OR UPDATE OR DELETE ON public.taggables
FOR EACH ROW
EXECUTE FUNCTION public.update_topic_on_tag_change();

COMMENT ON FUNCTION public.update_topic_on_tag_change IS
'Triggers topic search_vector rebuild when tags are added, removed, or changed';

-- ============================================================
-- Backfill search vectors for existing topics
-- ============================================================
-- Touching updated_at will trigger the search_vector update
UPDATE public.topics SET updated_at = updated_at WHERE search_vector IS NULL;
