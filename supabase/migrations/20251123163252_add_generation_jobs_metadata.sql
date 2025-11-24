-- Add generation_jobs column to learning_paths table
-- This stores job metadata for each step of the generation process
-- Enables retry functionality and detailed job tracking

-- Add the column if it doesn't exist
ALTER TABLE learning_paths
ADD COLUMN IF NOT EXISTS generation_jobs JSONB DEFAULT '{}'::jsonb;

-- Add a comment explaining the structure
COMMENT ON COLUMN learning_paths.generation_jobs IS
'Tracks job execution metadata for each generation step. Structure:
{
  "metadata": {
    "job_id": "string",
    "started_at": "ISO8601",
    "completed_at": "ISO8601",
    "attempts": number,
    "status": "pending|completed|failed",
    "error": "string|null"
  },
  "image": { ... },
  "sections": { ... }
}';

-- Create an index for querying job statuses
CREATE INDEX IF NOT EXISTS idx_learning_paths_generation_jobs
ON learning_paths USING GIN (generation_jobs);
