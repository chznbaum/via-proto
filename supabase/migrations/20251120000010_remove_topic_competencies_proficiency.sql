-- Migration: Remove proficiency_level from topic_competencies
-- Purpose: Proficiency is now tracked per user, not per topic-competency relationship
-- Date: 2025-11-20

-- Drop the constraint first
ALTER TABLE public.topic_competencies
DROP CONSTRAINT IF EXISTS valid_proficiency_level;

-- Drop the proficiency_level column
ALTER TABLE public.topic_competencies
DROP COLUMN IF EXISTS proficiency_level;

-- Update table comment
COMMENT ON TABLE public.topic_competencies IS 'Many-to-many relationship between topics and competencies. A topic can teach multiple competencies, and a competency can be taught by multiple topics. User proficiency levels are tracked separately in user_competencies.';
