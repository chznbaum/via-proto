-- Migration: Create Topic Synonyms Table
-- Purpose: Normalized synonym support for topic search
-- Date: 2025-11-18

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create topic_synonyms table
CREATE TABLE public.topic_synonyms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    synonym text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_topic_synonyms_topic_id ON public.topic_synonyms(topic_id);
CREATE INDEX idx_topic_synonyms_synonym ON public.topic_synonyms(synonym);
-- GIN index for efficient text search
CREATE INDEX idx_topic_synonyms_synonym_gin ON public.topic_synonyms USING gin(synonym gin_trgm_ops);

-- Add constraint to prevent duplicate synonyms for the same topic
CREATE UNIQUE INDEX idx_topic_synonyms_unique ON public.topic_synonyms(topic_id, lower(synonym));

-- Enable Row Level Security
ALTER TABLE public.topic_synonyms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Topic synonyms are publicly readable by all authenticated users (same as topics)
CREATE POLICY "Topic synonyms are publicly readable"
    ON public.topic_synonyms
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can modify topic synonyms (admin operations)
CREATE POLICY "Only service role can insert topic synonyms"
    ON public.topic_synonyms
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update topic synonyms"
    ON public.topic_synonyms
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete topic synonyms"
    ON public.topic_synonyms
    FOR DELETE
    TO service_role
    USING (true);

-- Add comment
COMMENT ON TABLE public.topic_synonyms IS 'Synonym mappings for topics to improve search. Example: React topic may have synonyms "React.js", "ReactJS", "React Framework"';
