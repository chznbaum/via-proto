-- Migration: Create User Competencies Table
-- Purpose: Track user proficiency levels for competencies
-- Date: 2025-11-20

-- Create user_competencies table
CREATE TABLE public.user_competencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    competency_id uuid NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
    proficiency_level text NOT NULL CHECK (
        proficiency_level IN ('none', 'beginner', 'intermediate', 'advanced', 'expert')
    ),
    self_assessed boolean NOT NULL DEFAULT true,
    assessed_at timestamptz DEFAULT now(),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Each user can only have one proficiency record per competency
    CONSTRAINT unique_user_competency UNIQUE (user_id, competency_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_competencies_user_id ON public.user_competencies(user_id);
CREATE INDEX idx_user_competencies_competency_id ON public.user_competencies(competency_id);
CREATE INDEX idx_user_competencies_proficiency_level ON public.user_competencies(proficiency_level);

-- Enable Row Level Security
ALTER TABLE public.user_competencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own competency assessments
CREATE POLICY "Users can view their own competency assessments"
    ON public.user_competencies
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own competency assessments"
    ON public.user_competencies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own competency assessments"
    ON public.user_competencies
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competency assessments"
    ON public.user_competencies
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_competencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_competencies_updated_at
    BEFORE UPDATE ON public.user_competencies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_competencies_updated_at();

-- Add comments
COMMENT ON TABLE public.user_competencies IS 'Tracks user proficiency levels for competencies. Used for prerequisite checking during path generation and personalized learning recommendations.';
COMMENT ON COLUMN public.user_competencies.proficiency_level IS 'User proficiency level: none (not learned), beginner, intermediate, advanced, or expert.';
COMMENT ON COLUMN public.user_competencies.self_assessed IS 'Whether this assessment was self-declared by the user (true) or system-determined (false).';
COMMENT ON COLUMN public.user_competencies.assessed_at IS 'When this proficiency level was last assessed or updated.';
COMMENT ON COLUMN public.user_competencies.notes IS 'Optional user notes about their proficiency or learning experience with this competency.';
