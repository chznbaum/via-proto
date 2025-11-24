-- Migration: Add resource improvement and cancellation statuses
-- Purpose: Support resource replacement, section enrichment, and user cancellation
-- Date: 2025-11-24
--
-- New flow:
-- pending → generating_metadata → fetching_image → researching_resources →
-- curating_resources → validating → completed → validating_links →
--   [IF broken > 3 OR sections < 5 resources]:
--     replacing_broken_resources → enriching_sections → validating_links → completed
--
-- New statuses:
-- 1. validating_links: Fetching OpenGraph metadata and checking link health
-- 2. replacing_broken_resources: Researching replacements for broken/dead links
-- 3. enriching_sections: Adding resources to under-resourced sections (< 5 resources)
-- 4. cancelled: User-initiated cancellation (jobs check and exit early)

-- Drop the existing constraint
ALTER TABLE public.learning_paths
DROP CONSTRAINT IF EXISTS valid_generation_status;

-- Add updated constraint with resource improvement and cancellation statuses
ALTER TABLE public.learning_paths
ADD CONSTRAINT valid_generation_status
CHECK (generation_status IN (
    'pending',                      -- Just created, waiting to start
    'generating_metadata',          -- Job #1: Getting title/description from AI
    'fetching_image',               -- Job #2: Getting Unsplash featured image
    'researching_resources',        -- Job #3: Web search for candidate resources
    'curating_resources',           -- Job #4: Organize resources into sections
    'validating',                   -- Job #5: Final validation checks
    'completed',                    -- Path viewable (background jobs may continue)
    'validating_links',             -- Job #6: Fetch OpenGraph data and check links (NEW)
    'replacing_broken_resources',   -- Job #7: Replace broken/dead resource links (NEW)
    'enriching_sections',           -- Job #8: Add resources to under-resourced sections (NEW)
    'cancelled',                    -- User cancelled generation (NEW)
    'failed',                       -- Generic failure (deprecated, use specific failures)
    'failed_metadata',              -- Job #1 failed: metadata generation failed
    'failed_image',                 -- Job #2 failed: image fetch failed (path still usable)
    'failed_research',              -- Job #3 failed: resource research failed
    'failed_sections',              -- Job #4 failed: sections/resources generation failed
    'failed_validation',            -- Job #5 failed: validation failed
    'failed_link_validation',       -- Job #6 failed: link validation failed (NEW)
    'failed_replacement',           -- Job #7 failed: resource replacement failed (NEW)
    'failed_enrichment'             -- Job #8 failed: section enrichment failed (NEW)
));

-- Update comments
COMMENT ON COLUMN public.learning_paths.generation_status IS 'Current status of path generation. Extended 8-step job queue with resource improvement: generate_metadata → fetch_unsplash_image → research_resources → generate_sections_resources → validate_and_finalize → validate_resource_links → [conditional: replace_broken_resources + enrich_sections]. Path becomes viewable after validate_and_finalize marks as completed. User can cancel at any point via cancelled status. Background jobs check for cancellation and exit early.';
