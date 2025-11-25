-- Migration: Create trigger functions to auto-update competency search vectors
-- Purpose: Keep search_vector in sync when competencies, synonyms, or categories change
-- Date: 2025-11-24

-- ============================================================
-- Main function to build the complete search vector for a competency
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_competency_search_vector()
RETURNS TRIGGER AS $$
DECLARE
    synonym_names text := '';
    category_name text := '';
BEGIN
    -- Get all synonym names for this competency
    SELECT string_agg(cs.synonym, ' ')
    INTO synonym_names
    FROM public.competency_synonyms cs
    WHERE cs.competency_id = NEW.id;

    -- Get category name
    SELECT cat.name
    INTO category_name
    FROM public.categories cat
    WHERE cat.id = NEW.category_id;

    -- Build weighted search vector
    -- A = competency name + synonym names (highest priority)
    -- B = category name (medium priority)
    -- C = description (lowest priority)
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(synonym_names, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(category_name, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on competency insert/update
CREATE TRIGGER competency_search_vector_update
BEFORE INSERT OR UPDATE ON public.competencies
FOR EACH ROW
EXECUTE FUNCTION public.update_competency_search_vector();

COMMENT ON FUNCTION public.update_competency_search_vector IS
'Builds weighted search vector for a competency by aggregating competency name, synonym names, category name, and description';

-- ============================================================
-- Update competency search vector when synonyms change
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_competency_on_synonym_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Touch the competency to trigger search_vector rebuild
    UPDATE public.competencies
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.competency_id, OLD.competency_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competency_synonym_change
AFTER INSERT OR UPDATE OR DELETE ON public.competency_synonyms
FOR EACH ROW
EXECUTE FUNCTION public.update_competency_on_synonym_change();

COMMENT ON FUNCTION public.update_competency_on_synonym_change IS
'Triggers competency search_vector rebuild when synonyms are added, removed, or changed';

-- ============================================================
-- Update competency search vector when category name changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_competencies_on_category_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only rebuild if name changed
    IF OLD.name IS DISTINCT FROM NEW.name THEN
        UPDATE public.competencies
        SET updated_at = NOW()
        WHERE category_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_name_change_competencies
AFTER UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_competencies_on_category_update();

COMMENT ON FUNCTION public.update_competencies_on_category_update IS
'Triggers competency search_vector rebuild when a category name is changed';

-- ============================================================
-- Backfill search vectors for existing competencies
-- ============================================================
-- Touching updated_at will trigger the search_vector update
UPDATE public.competencies SET updated_at = updated_at WHERE search_vector IS NULL;
