-- Migration: Add weighted search vector to topics table
-- Purpose: Enable full-text search across topic names, competencies, synonyms, descriptions, and tags
-- Date: 2025-11-20

-- Add search vector column to topics
ALTER TABLE public.topics
ADD COLUMN search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX idx_topics_search_vector
ON public.topics USING GIN(search_vector);

-- Add comment explaining the weighting scheme
COMMENT ON COLUMN public.topics.search_vector IS
'Weighted full-text search vector: A=topic name, B=competency names+synonyms, C=description, D=tags';
