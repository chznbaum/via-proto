-- Migration: Add Resource Link Metadata Fields
-- Purpose: Add fields for OpenGraph description, favicon, and login-required status
-- Date: 2025-01-23

-- Add new columns to resources table
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS og_description TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS page_title TEXT;

-- Update link_status CHECK constraint to include 'requires_login'
-- Note: link_status is a text column with CHECK constraint, not an enum

-- Drop existing constraint
ALTER TABLE public.resources
DROP CONSTRAINT IF EXISTS valid_link_status;

-- Re-create constraint with new status value
ALTER TABLE public.resources
ADD CONSTRAINT valid_link_status
CHECK (link_status IN ('active', 'broken', 'unchecked', 'requires_login'));

-- Add comment documenting the new fields
COMMENT ON COLUMN public.resources.og_description IS 'OpenGraph description meta tag content for rich link previews';
COMMENT ON COLUMN public.resources.favicon_url IS 'URL to the site favicon for fallback previews when OpenGraph data is unavailable';
COMMENT ON COLUMN public.resources.page_title IS 'HTML <title> tag content, used as fallback when OpenGraph title is unavailable';
COMMENT ON COLUMN public.resources.link_status IS 'Status of the resource link: active (200 OK), broken (4xx/5xx errors), unchecked (not yet validated), requires_login (401/403 responses)';

-- Add new generation status for link validation step
-- This allows the learning path to show "Validating links..." status
-- Note: generation_status is a text column with CHECK constraint, not an enum

-- Drop existing constraint
ALTER TABLE public.learning_paths
DROP CONSTRAINT IF EXISTS valid_generation_status;

-- Re-create constraint with new status value
ALTER TABLE public.learning_paths
ADD CONSTRAINT valid_generation_status
CHECK (generation_status IN (
  'pending',
  'generating_metadata',
  'fetching_image',
  'curating_resources',
  'validating_links',
  'completed',
  'failed',
  'failed_metadata',
  'failed_image',
  'failed_sections'
));

-- Update the table comment to reflect new metadata
COMMENT ON TABLE public.resources IS 'External learning resources with metadata (videos, articles, books, etc.). Includes OpenGraph data (image, title, description), favicon, and link validation status for rich previews and user warnings. Resources cascade delete when parent section is deleted.';
