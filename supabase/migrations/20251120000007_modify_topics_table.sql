-- Migration: Modify Topics Table
-- Purpose: Add category_id FK, remove deprecated columns (synonyms, tags, category text)
-- Date: 2025-11-20

-- Add category_id foreign key column
ALTER TABLE public.topics
ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for category_id
CREATE INDEX idx_topics_category_id ON public.topics(category_id);

-- Drop deprecated columns
-- Note: synonyms are now in topic_synonyms table
-- Note: tags are now in the polymorphic tags system
-- Note: category text field is replaced by category_id FK
ALTER TABLE public.topics
DROP COLUMN IF EXISTS synonyms,
DROP COLUMN IF EXISTS tags,
DROP COLUMN IF EXISTS category;

-- Update table comment
COMMENT ON TABLE public.topics IS 'Goal-oriented learning topics. Each topic maps to one or more competencies and belongs to a hierarchical category. Example: "Building web applications with Python" is a topic that teaches Python, Flask, and HTML competencies.';
COMMENT ON COLUMN public.topics.category_id IS 'References the category this topic belongs to. Categories are hierarchical and help organize topics for browsing.';
