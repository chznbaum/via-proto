-- Migration: Add granular failure statuses for learning path generation
-- Purpose: Enable step-specific failure tracking and manual retry capability
-- Date: 2025-01-23
--
-- This adds three new failure statuses that correspond to the three job steps:
-- - failed_metadata: Metadata generation (title, description, skill_level) failed
-- - failed_image: Unsplash image fetch failed (path still usable with metadata)
-- - failed_sections: Sections/resources generation failed (metadata + image preserved)
--
-- These granular statuses allow:
-- 1. Better user communication about what specifically failed
-- 2. Partial progress preservation (e.g., keep metadata even if sections fail)
-- 3. Future manual retry capability at specific step

-- Drop the existing constraint
ALTER TABLE public.learning_paths
DROP CONSTRAINT IF EXISTS valid_generation_status;

-- Add new constraint with granular failure statuses
ALTER TABLE public.learning_paths
ADD CONSTRAINT valid_generation_status
CHECK (generation_status IN (
    'pending',              -- Just created, waiting to start
    'generating_metadata',  -- Job #1: Getting title/description from AI
    'fetching_image',       -- Job #2: Getting Unsplash featured image
    'curating_resources',   -- Job #3: Generating sections/resources (the bulk)
    'completed',            -- All done, ready to view
    'failed',               -- Generic failure (deprecated, use specific failures)
    'failed_metadata',      -- Job #1 failed: metadata generation failed
    'failed_image',         -- Job #2 failed: image fetch failed (path still usable)
    'failed_sections'       -- Job #3 failed: sections/resources generation failed
));

-- Update comments
COMMENT ON COLUMN public.learning_paths.generation_status IS 'Current status of path generation. Uses multi-step job queue (generate_metadata, fetch_unsplash_image, generate_sections_resources). Granular failure statuses enable partial progress preservation and future manual retries.';
