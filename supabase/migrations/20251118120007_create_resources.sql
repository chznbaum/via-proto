-- Migration 8: Create Resources Table
-- Purpose: External learning resources with metadata
-- Date: 2025-11-18

-- Create resources table
CREATE TABLE public.resources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
    "order" integer NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    type text NOT NULL,
    is_free boolean,
    description text,
    estimated_minutes integer,
    link_status text NOT NULL DEFAULT 'unchecked',
    last_checked_at timestamptz,
    og_image_url text,
    og_title text,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT unique_section_order UNIQUE (section_id, "order"),
    CONSTRAINT valid_type CHECK (type IN ('video', 'article', 'book', 'project', 'audio', 'graphic', 'course')),
    CONSTRAINT valid_link_status CHECK (link_status IN ('active', 'broken', 'unchecked')),
    CONSTRAINT valid_estimated_minutes CHECK (estimated_minutes >= 0 OR estimated_minutes IS NULL),
    CONSTRAINT valid_order CHECK ("order" > 0),
    CONSTRAINT valid_url_format CHECK (url ~* '^https?://')
);

-- Create indexes
CREATE INDEX idx_resources_section_id ON public.resources(section_id);
CREATE INDEX idx_resources_order ON public.resources(section_id, "order");
CREATE INDEX idx_resources_link_status ON public.resources(link_status);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read resources from public learning paths
CREATE POLICY "Resources from public paths are readable by all"
    ON public.resources
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.learning_paths lp ON lp.id = s.learning_path_id
            WHERE s.id = resources.section_id
            AND lp.is_public = true
        )
    );

-- Users can read resources from their account's learning paths
CREATE POLICY "Users can read resources from their account's paths"
    ON public.resources
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.learning_paths lp ON lp.id = s.learning_path_id
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE s.id = resources.section_id
            AND au.user_id = auth.uid()
        )
    );

-- Users can insert resources for their account's learning paths
CREATE POLICY "Users can create resources for their account's paths"
    ON public.resources
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.learning_paths lp ON lp.id = s.learning_path_id
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE s.id = resources.section_id
            AND au.user_id = auth.uid()
        )
    );

-- Users can update resources from their account's learning paths
CREATE POLICY "Users can update resources from their account's paths"
    ON public.resources
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.learning_paths lp ON lp.id = s.learning_path_id
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE s.id = resources.section_id
            AND au.user_id = auth.uid()
        )
    );

-- Users can delete resources from their account's learning paths
CREATE POLICY "Users can delete resources from their account's paths"
    ON public.resources
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.sections s
            JOIN public.learning_paths lp ON lp.id = s.learning_path_id
            JOIN public.account_users au ON au.account_id = lp.account_id
            WHERE s.id = resources.section_id
            AND au.user_id = auth.uid()
        )
    );

-- Add comment
COMMENT ON TABLE public.resources IS 'External learning resources with metadata (videos, articles, books, etc.). Includes OpenGraph data for previews and link validation status. Resources cascade delete when parent section is deleted.';
