-- Migration: Allow anonymous users to read public data
-- Purpose: Enable unauthenticated users to view topic counts and public learning path counts on landing page
-- Date: 2025-11-19

-- Add policy for anonymous users to read active topics
CREATE POLICY "Active topics are publicly readable by anonymous users"
    ON public.topics
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Add policy for anonymous users to read public learning paths
CREATE POLICY "Public learning paths are readable by anonymous users"
    ON public.learning_paths
    FOR SELECT
    TO anon
    USING (is_public = true);

-- Add comment
COMMENT ON POLICY "Active topics are publicly readable by anonymous users" ON public.topics IS 'Allows unauthenticated users to view active topics for landing page stats and browse functionality';
COMMENT ON POLICY "Public learning paths are readable by anonymous users" ON public.learning_paths IS 'Allows unauthenticated users to view public learning paths for landing page stats and explore page';
