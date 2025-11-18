-- Migration 5: Create Topics Table
-- Purpose: Pre-defined topic database with categorization
-- Date: 2025-11-18

-- Create topics table
CREATE TABLE public.topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    synonyms text[] DEFAULT '{}',
    category text NOT NULL,
    tags text[] DEFAULT '{}',
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_topics_slug ON public.topics(slug);
CREATE INDEX idx_topics_category ON public.topics(category);
CREATE INDEX idx_topics_is_active ON public.topics(is_active);
CREATE INDEX idx_topics_synonyms ON public.topics USING GIN(synonyms);

-- Enable Row Level Security
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Topics are publicly readable by all authenticated users
CREATE POLICY "Topics are publicly readable"
    ON public.topics
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Only service role can modify topics (admin operations)
CREATE POLICY "Only service role can insert topics"
    ON public.topics
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update topics"
    ON public.topics
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete topics"
    ON public.topics
    FOR DELETE
    TO service_role
    USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON public.topics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.topics IS 'Pre-defined topic database with categorization. Populated via seed data. Categories include Programming, Design, Business, Data, Marketing, etc.';
