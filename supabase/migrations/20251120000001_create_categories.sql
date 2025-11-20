-- Migration: Create Categories Table (Hierarchical)
-- Purpose: Hierarchical category system for organizing topics
-- Date: 2025-11-20

-- Create categories table with self-referencing parent relationship
CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
    icon text, -- Optional icon name (e.g., Heroicons name)
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- Prevent cycles: a category cannot be its own parent
    CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- Create indexes for performance
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_is_active ON public.categories(is_active);
CREATE INDEX idx_categories_display_order ON public.categories(display_order);

-- Create composite index for querying active categories by parent
CREATE INDEX idx_categories_parent_active ON public.categories(parent_id, is_active, display_order);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Categories are publicly readable by all authenticated users
CREATE POLICY "Categories are publicly readable"
    ON public.categories
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Only service role can modify categories (admin operations)
CREATE POLICY "Only service role can insert categories"
    ON public.categories
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Only service role can update categories"
    ON public.categories
    FOR UPDATE
    TO service_role
    USING (true);

CREATE POLICY "Only service role can delete categories"
    ON public.categories
    FOR DELETE
    TO service_role
    USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.categories IS 'Hierarchical category system for organizing topics. Supports unlimited depth nesting via parent_id. Example: Information & Technology > Programming > Web Development > Frontend.';
COMMENT ON COLUMN public.categories.parent_id IS 'References parent category for hierarchical structure. NULL indicates top-level category.';
COMMENT ON COLUMN public.categories.icon IS 'Optional icon identifier (e.g., Heroicons icon name) for UI display.';
COMMENT ON COLUMN public.categories.display_order IS 'Controls sort order when displaying categories at the same level.';
