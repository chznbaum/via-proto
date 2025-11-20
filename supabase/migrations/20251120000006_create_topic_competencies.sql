-- Migration: Create Topic Competencies Junction Table
-- Purpose: Many-to-many relationship between topics and competencies
-- Date: 2025-11-20

-- Create topic_competencies junction table
CREATE TABLE public.topic_competencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    is_primary boolean NOT NULL DEFAULT false,
    proficiency_level text,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Prevent duplicate competencies for the same topic
    CONSTRAINT unique_topic_competency UNIQUE (topic_id, competency_id),

    -- Valid proficiency levels
    CONSTRAINT valid_proficiency_level CHECK (
        proficiency_level IS NULL OR
        proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')
    )
);

-- Create indexes for performance
CREATE INDEX idx_topic_competencies_topic ON public.topic_competencies(topic_id);
CREATE INDEX idx_topic_competencies_competency ON public.topic_competencies(competency_id);
CREATE INDEX idx_topic_competencies_primary ON public.topic_competencies(is_primary);

-- Enable Row Level Security
ALTER TABLE public.topic_competencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Topic competencies are publicly readable by all authenticated users
CREATE POLICY "Topic competencies are publicly readable"
    ON public.topic_competencies
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can modify topic competencies (admin operations)
CREATE POLICY "Only service role can insert topic competencies"
    ON public.topic_competencies
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update topic competencies"
    ON public.topic_competencies
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete topic competencies"
    ON public.topic_competencies
    FOR DELETE
    TO service_role
    USING (true);

-- Add comments
COMMENT ON TABLE public.topic_competencies IS 'Many-to-many relationship between topics and competencies. A topic can teach multiple competencies, and a competency can be taught by multiple topics.';
COMMENT ON COLUMN public.topic_competencies.is_primary IS 'Whether this is the primary/main competency for the topic. Used for categorization and filtering.';
COMMENT ON COLUMN public.topic_competencies.proficiency_level IS 'Optional target proficiency level this topic aims to teach (beginner, intermediate, advanced, expert).';
