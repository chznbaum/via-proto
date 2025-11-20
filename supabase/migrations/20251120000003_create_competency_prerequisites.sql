-- Migration: Create Competency Prerequisites Table
-- Purpose: Define prerequisite relationships between competencies
-- Date: 2025-11-20

-- Create competency_prerequisites junction table
CREATE TABLE public.competency_prerequisites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    competency_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    prerequisite_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    is_required boolean NOT NULL DEFAULT true,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Prevent self-prerequisites
    CONSTRAINT no_self_prerequisite CHECK (competency_id != prerequisite_id),

    -- Prevent duplicate prerequisites
    CONSTRAINT unique_prerequisite UNIQUE (competency_id, prerequisite_id)
);

-- Create indexes for performance
CREATE INDEX idx_competency_prerequisites_competency ON public.competency_prerequisites(competency_id);
CREATE INDEX idx_competency_prerequisites_prerequisite ON public.competency_prerequisites(prerequisite_id);

-- Enable Row Level Security
ALTER TABLE public.competency_prerequisites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Prerequisites are publicly readable by all authenticated users
CREATE POLICY "Competency prerequisites are publicly readable"
    ON public.competency_prerequisites
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can modify prerequisites (admin operations)
CREATE POLICY "Only service role can insert prerequisites"
    ON public.competency_prerequisites
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update prerequisites"
    ON public.competency_prerequisites
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete prerequisites"
    ON public.competency_prerequisites
    FOR DELETE
    TO service_role
    USING (true);

-- Add comments
COMMENT ON TABLE public.competency_prerequisites IS 'Defines prerequisite relationships between competencies. Example: React requires JavaScript as a prerequisite.';
COMMENT ON COLUMN public.competency_prerequisites.is_required IS 'Whether this prerequisite is required (true) or recommended (false).';
COMMENT ON COLUMN public.competency_prerequisites.notes IS 'Optional notes about why this prerequisite exists or what specific aspects are needed.';
