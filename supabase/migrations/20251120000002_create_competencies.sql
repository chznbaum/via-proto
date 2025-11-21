-- Migration: Create Competencies Table
-- Purpose: Store underlying skills/technologies that topics teach
-- Date: 2025-11-20

-- Create competencies table
CREATE TABLE public.competencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    icon text,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_competencies_slug ON public.competencies(slug);
CREATE INDEX idx_competencies_category_id ON public.competencies(category_id);
CREATE INDEX idx_competencies_is_active ON public.competencies(is_active);
CREATE INDEX idx_competencies_name ON public.competencies(name);

-- Enable Row Level Security
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Competencies are publicly readable by all users (authenticated and anonymous)
CREATE POLICY "Competencies are publicly readable"
    ON public.competencies
    FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

-- Only service role can modify competencies (admin operations)
CREATE POLICY "Only service role can insert competencies"
    ON public.competencies
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update competencies"
    ON public.competencies
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete competencies"
    ON public.competencies
    FOR DELETE
    TO service_role
    USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_competencies_updated_at
    BEFORE UPDATE ON public.competencies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.competencies IS 'Underlying skills and technologies that learning paths teach. Example: React, Python, Spanish. Topics are goal-oriented and map to one or more competencies.';
COMMENT ON COLUMN public.competencies.icon IS 'Iconify class name for competency icon (e.g., "simple-icons:react")';
COMMENT ON COLUMN public.competencies.category_id IS 'Optional category for organizational purposes. Helps with browsing competencies by category.';
