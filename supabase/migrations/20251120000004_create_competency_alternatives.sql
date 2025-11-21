-- Migration: Create Competency Alternatives Table
-- Purpose: Define similar/related competencies
-- Date: 2025-11-20

-- Create competency_alternatives junction table
CREATE TABLE public.competency_alternatives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    alternative_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    relationship_type text NOT NULL DEFAULT 'similar',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Prevent self-alternatives
    CONSTRAINT no_self_alternative CHECK (competency_id != alternative_id),

    -- Prevent duplicate alternatives
    CONSTRAINT unique_alternative UNIQUE (competency_id, alternative_id),

    -- Valid relationship types
    CONSTRAINT valid_relationship_type CHECK (relationship_type IN ('similar', 'related', 'replaces'))
);

-- Create indexes for performance
CREATE INDEX idx_competency_alternatives_competency ON public.competency_alternatives(competency_id);
CREATE INDEX idx_competency_alternatives_alternative ON public.competency_alternatives(alternative_id);
CREATE INDEX idx_competency_alternatives_type ON public.competency_alternatives(relationship_type);

-- Enable Row Level Security
ALTER TABLE public.competency_alternatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Alternatives are publicly readable by all authenticated users
CREATE POLICY "Competency alternatives are publicly readable"
    ON public.competency_alternatives
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can modify alternatives (admin operations)
CREATE POLICY "Only service role can insert alternatives"
    ON public.competency_alternatives
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update alternatives"
    ON public.competency_alternatives
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete alternatives"
    ON public.competency_alternatives
    FOR DELETE
    TO service_role
    USING (true);

-- Add comments
COMMENT ON TABLE public.competency_alternatives IS 'Defines alternative or similar competencies. Example: PostgreSQL and MySQL as similar relational databases.';
COMMENT ON COLUMN public.competency_alternatives.relationship_type IS 'Type of relationship: similar (closely related or interchangeable), or related (loosely related).';
COMMENT ON COLUMN public.competency_alternatives.notes IS 'Optional notes about the relationship and when to use which alternative.';
