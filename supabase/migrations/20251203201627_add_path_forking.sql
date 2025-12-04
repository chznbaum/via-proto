-- Migration: Add remix/fork tracking to learning paths
-- Allows tracking which path a remixed path was created from

ALTER TABLE public.learning_paths
ADD COLUMN forked_from_path_id uuid REFERENCES public.learning_paths(id) ON DELETE SET NULL;

-- Index for querying paths forked from a specific source
CREATE INDEX idx_paths_forked_from ON public.learning_paths(forked_from_path_id);

COMMENT ON COLUMN public.learning_paths.forked_from_path_id IS 'Source path this was remixed from. NULL for original paths.';
