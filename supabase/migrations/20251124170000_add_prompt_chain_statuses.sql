-- Migration: Add prompt chain statuses for 3-step resource generation
-- Purpose: Support research → curation → validation workflow
-- Date: 2025-11-24
--
-- New flow:
-- pending → generating_metadata → fetching_image → researching_resources →
-- curating_resources → validating → completed
--
-- This splits the previous 'curating_resources' step into three phases:
-- 1. researching_resources: Web search for 30-50 candidate resources
-- 2. curating_resources: Organize researched resources into sections
-- 3. validating: Final quality checks and database persistence

-- Drop the existing constraint
ALTER TABLE public.learning_paths
DROP CONSTRAINT IF EXISTS valid_generation_status;

-- Add new constraint with prompt chain statuses
ALTER TABLE public.learning_paths
ADD CONSTRAINT valid_generation_status
CHECK (generation_status IN (
    'pending',              -- Just created, waiting to start
    'generating_metadata',  -- Job #1: Getting title/description from AI
    'fetching_image',       -- Job #2: Getting Unsplash featured image
    'researching_resources',-- Job #3: Web search for candidate resources (NEW)
    'curating_resources',   -- Job #4: Organize resources into sections
    'validating',           -- Job #5: Final validation and persistence (NEW)
    'completed',            -- All done, ready to view
    'failed',               -- Generic failure (deprecated, use specific failures)
    'failed_metadata',      -- Job #1 failed: metadata generation failed
    'failed_image',         -- Job #2 failed: image fetch failed (path still usable)
    'failed_research',      -- Job #3 failed: resource research failed (NEW)
    'failed_sections',      -- Job #4 failed: sections/resources generation failed
    'failed_validation'     -- Job #5 failed: validation failed (NEW)
));

-- Update comments
COMMENT ON COLUMN public.learning_paths.generation_status IS 'Current status of path generation. Uses 5-step job queue: generate_metadata → fetch_unsplash_image → research_resources → generate_sections_resources → validate_and_finalize. Granular failure statuses enable partial progress preservation and future manual retries. Prompt chaining approach ensures high-quality, verified resource URLs.';
