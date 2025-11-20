-- Migration: Create unsplash_images table for Unsplash API compliance
-- Purpose: Centralized storage of Unsplash images with required attribution data
-- Date: 2025-11-19

-- Create unsplash_images table
CREATE TABLE IF NOT EXISTS public.unsplash_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id text NOT NULL UNIQUE, -- Unsplash's unique photo ID
  url text NOT NULL, -- Image URL (regular size, 1080px wide)
  photographer text NOT NULL, -- Photographer name (for attribution)
  photographer_url text NOT NULL, -- Link to photographer's Unsplash profile
  download_location text NOT NULL, -- API endpoint for triggering download events
  created_at timestamptz DEFAULT now()
);

-- Add index on photo_id for lookups
CREATE INDEX idx_unsplash_images_photo_id ON public.unsplash_images(photo_id);

-- Remove old featured_image_url column from learning_paths
ALTER TABLE public.learning_paths
DROP COLUMN IF EXISTS featured_image_url;

-- Add foreign key to unsplash_images
ALTER TABLE public.learning_paths
ADD COLUMN unsplash_image_id uuid REFERENCES public.unsplash_images(id) ON DELETE SET NULL;

-- Add index for joins
CREATE INDEX idx_learning_paths_unsplash_image ON public.learning_paths(unsplash_image_id);

-- Enable RLS on unsplash_images
ALTER TABLE public.unsplash_images ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read Unsplash images (needed for public explore page)
CREATE POLICY "Allow public read access to Unsplash images"
  ON public.unsplash_images
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to insert Unsplash images (via API routes)
CREATE POLICY "Allow authenticated users to insert Unsplash images"
  ON public.unsplash_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE public.unsplash_images IS 'Stores Unsplash images with attribution data for API compliance';
COMMENT ON COLUMN public.unsplash_images.photo_id IS 'Unsplash unique photo identifier';
COMMENT ON COLUMN public.unsplash_images.download_location IS 'API endpoint to trigger download event (required by Unsplash)';
COMMENT ON COLUMN public.learning_paths.unsplash_image_id IS 'Reference to Unsplash image for featured image with attribution';
