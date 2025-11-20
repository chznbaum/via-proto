-- Migration: Create Polymorphic Tags System
-- Purpose: Allow tagging of any entity (topics, learning paths, resources, etc.)
-- Date: 2025-11-20

-- Create tags table
CREATE TABLE public.tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    color text, -- Optional hex color for UI display (e.g., '#3b82f6')
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for tags
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_tags_is_active ON public.tags(is_active);
CREATE INDEX idx_tags_name ON public.tags(name);

-- Create polymorphic taggables junction table
CREATE TABLE public.taggables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    taggable_id uuid NOT NULL,
    taggable_type text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Valid taggable types
    CONSTRAINT valid_taggable_type CHECK (
        taggable_type IN ('topic', 'learning_path', 'resource', 'competency', 'category')
    ),

    -- Prevent duplicate tags on the same entity
    CONSTRAINT unique_taggable UNIQUE (tag_id, taggable_id, taggable_type)
);

-- Create indexes for taggables
CREATE INDEX idx_taggables_tag_id ON public.taggables(tag_id);
CREATE INDEX idx_taggables_taggable ON public.taggables(taggable_id, taggable_type);
CREATE INDEX idx_taggables_type ON public.taggables(taggable_type);

-- Composite index for efficient queries
CREATE INDEX idx_taggables_lookup ON public.taggables(taggable_type, taggable_id, tag_id);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taggables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Tags are publicly readable"
    ON public.tags
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Only service role can insert tags"
    ON public.tags
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update tags"
    ON public.tags
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete tags"
    ON public.tags
    FOR DELETE
    TO service_role
    USING (true);

-- RLS Policies for taggables
CREATE POLICY "Taggables are publicly readable"
    ON public.taggables
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only service role can insert taggables"
    ON public.taggables
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update taggables"
    ON public.taggables
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete taggables"
    ON public.taggables
    FOR DELETE
    TO service_role
    USING (true);

-- Create updated_at trigger for tags
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.tags IS 'Tag definitions that can be applied to any entity in the system.';
COMMENT ON TABLE public.taggables IS 'Polymorphic junction table linking tags to any entity (topics, learning paths, resources, etc.).';
COMMENT ON COLUMN public.taggables.taggable_type IS 'Type of entity being tagged (topic, learning_path, resource, competency, category).';
COMMENT ON COLUMN public.taggables.taggable_id IS 'UUID of the entity being tagged.';
COMMENT ON COLUMN public.tags.color IS 'Optional hex color code for UI display (e.g., #3b82f6 for blue).';
