-- Migration 7: Create Sections Table
-- Purpose: Logical groupings within learning paths
-- Date: 2025-11-18

-- Create sections table
CREATE TABLE public.sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    "order" integer NOT NULL,
    title text NOT NULL,
    description text,
    prerequisite_level text NOT NULL DEFAULT 'required',
    notes text,
    estimated_hours numeric(6,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT unique_path_order UNIQUE (learning_path_id, "order"),
    CONSTRAINT valid_prerequisite_level CHECK (prerequisite_level IN ('required', 'recommended', 'optional')),
    CONSTRAINT valid_estimated_hours CHECK (estimated_hours >= 0),
    CONSTRAINT valid_order CHECK ("order" > 0)
);

-- Create indexes
CREATE INDEX idx_sections_path_id ON public.sections(learning_path_id);
CREATE INDEX idx_sections_order ON public.sections(learning_path_id, "order");

-- Enable Row Level Security
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read sections from public learning paths
CREATE POLICY "Sections from public paths are readable by all"
    ON public.sections
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths
            WHERE learning_paths.id = sections.learning_path_id
            AND learning_paths.is_public = true
        )
    );

-- Users can read sections from their account's learning paths
CREATE POLICY "Users can read sections from their account's paths"
    ON public.sections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths lp
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE lp.id = sections.learning_path_id
            AND au.user_id = auth.uid()
        )
    );

-- Users can insert sections for their account's learning paths
CREATE POLICY "Users can create sections for their account's paths"
    ON public.sections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.learning_paths lp
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE lp.id = sections.learning_path_id
            AND au.user_id = auth.uid()
        )
    );

-- Users can update sections from their account's learning paths
CREATE POLICY "Users can update sections from their account's paths"
    ON public.sections
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths lp
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE lp.id = sections.learning_path_id
            AND au.user_id = auth.uid()
        )
    );

-- Users can delete sections from their account's learning paths
CREATE POLICY "Users can delete sections from their account's paths"
    ON public.sections
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.learning_paths lp
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE lp.id = sections.learning_path_id
            AND au.user_id = auth.uid()
        )
    );

-- Add comment
COMMENT ON TABLE public.sections IS 'Logical groupings within learning paths. Each section has an order and contains resources. Sections cascade delete when parent learning path is deleted.';
