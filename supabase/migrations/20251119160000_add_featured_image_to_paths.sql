-- Migration: Add featured_image_url to learning_paths
-- Purpose: Store Unsplash featured images for learning paths
-- Date: 2025-11-19

-- Add featured_image_url column to learning_paths
ALTER TABLE public.learning_paths
ADD COLUMN featured_image_url text;

-- Add index for faster queries when filtering by image presence
CREATE INDEX idx_paths_has_image ON public.learning_paths((featured_image_url IS NOT NULL));

-- Add comment
COMMENT ON COLUMN public.learning_paths.featured_image_url IS 'URL to featured image from Unsplash, fetched based on the topic when the path is created';
