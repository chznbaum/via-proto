-- Migration: Add generation_status to learning_paths
-- Purpose: Track the status of path generation for multi-step creation
-- Date: 2025-11-19

-- Add generation_status column
ALTER TABLE public.learning_paths
ADD COLUMN generation_status text NOT NULL DEFAULT 'completed';

-- Add generation_error column for error messages
ALTER TABLE public.learning_paths
ADD COLUMN generation_error text;

-- Add constraint for valid statuses
ALTER TABLE public.learning_paths
ADD CONSTRAINT valid_generation_status
CHECK (generation_status IN (
    'pending',              -- Just created, waiting to start
    'generating_metadata',  -- Getting title/description from AI
    'fetching_image',       -- Getting Unsplash featured image
    'curating_resources',   -- Generating sections/resources (the bulk)
    'completed',            -- All done, ready to view
    'failed'                -- Error occurred
));

-- Create index for querying by status
CREATE INDEX idx_paths_generation_status ON public.learning_paths(generation_status);

-- Add comment
COMMENT ON COLUMN public.learning_paths.generation_status IS 'Current status of the path generation process. Enables multi-step creation with real-time UI updates.';
COMMENT ON COLUMN public.learning_paths.generation_error IS 'Error message if generation failed. Only populated when generation_status = failed.';
