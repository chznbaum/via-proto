-- Migration: Add user attribution to resources
-- Tracks which user manually added a resource (NULL for AI-generated resources)

ALTER TABLE public.resources
ADD COLUMN added_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for querying resources added by a specific user
CREATE INDEX idx_resources_added_by_user ON public.resources(added_by_user_id);

COMMENT ON COLUMN public.resources.added_by_user_id IS 'User who manually added this resource. NULL for AI-generated resources.';
