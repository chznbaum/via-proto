-- Migration: Add weighted search vector to competencies table
-- Purpose: Enable full-text search across competency names, synonyms, categories, and descriptions
-- Date: 2025-11-24

-- Add search vector column to competencies
ALTER TABLE public.competencies
ADD COLUMN search_vector tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX idx_competencies_search_vector
ON public.competencies USING GIN(search_vector);

-- Add comment explaining the weighting scheme
COMMENT ON COLUMN public.competencies.search_vector IS
'Weighted full-text search vector: A=competency name+synonym names, B=category name, C=description';
