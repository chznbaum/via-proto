-- Migration: Rename topic_synonyms to competency_synonyms
-- Purpose: Synonyms should relate to competencies, not topics
-- Date: 2025-11-20

-- Rename the table
ALTER TABLE public.topic_synonyms RENAME TO competency_synonyms;

-- Drop the old foreign key constraint to topics
ALTER TABLE public.competency_synonyms
DROP CONSTRAINT topic_synonyms_topic_id_fkey;

-- Rename the column
ALTER TABLE public.competency_synonyms
RENAME COLUMN topic_id TO competency_id;

-- Add new foreign key constraint to competencies
ALTER TABLE public.competency_synonyms
ADD CONSTRAINT competency_synonyms_competency_id_fkey
FOREIGN KEY (competency_id) REFERENCES public.competencies(id) ON DELETE CASCADE;

-- Drop old indexes
DROP INDEX IF EXISTS idx_topic_synonyms_topic_id;
DROP INDEX IF EXISTS idx_topic_synonyms_synonym;
DROP INDEX IF EXISTS idx_topic_synonyms_synonym_gin;
DROP INDEX IF EXISTS idx_topic_synonyms_unique;

-- Create new indexes
CREATE INDEX idx_competency_synonyms_competency_id ON public.competency_synonyms(competency_id);
CREATE INDEX idx_competency_synonyms_synonym ON public.competency_synonyms(synonym);
CREATE INDEX idx_competency_synonyms_synonym_gin ON public.competency_synonyms USING gin(synonym gin_trgm_ops);
CREATE UNIQUE INDEX idx_competency_synonyms_unique ON public.competency_synonyms(competency_id, lower(synonym));

-- Update table comment
COMMENT ON TABLE public.competency_synonyms IS 'Synonym mappings for competencies to improve search. Example: React competency may have synonyms "React.js", "ReactJS", "React Framework". Competency synonyms are used when searching for topics.';

-- Note: RLS policies don't need to change as they reference the table by name,
-- and the policy logic is still appropriate (publicly readable, service role can modify)
