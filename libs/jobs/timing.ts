/**
 * Job Timing Utilities
 *
 * Tracks duration of each job in the generation pipeline.
 * Stores timing data in generation_metadata.job_timings for analytics and future UI display.
 */

/**
 * Calculate duration between two ISO timestamp strings in milliseconds
 */
export function calculateDuration(startedAt: string, completedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  return end - start;
}

/**
 * Update generation_metadata with timing information for a completed job
 *
 * @param generationMetadata - Current generation_metadata object
 * @param jobName - Name of the job (e.g., 'generate_metadata', 'research_resources')
 * @param startedAt - ISO timestamp when job started
 * @param completedAt - ISO timestamp when job completed
 * @returns Updated generation_metadata with timing info
 */
export function updateJobTiming(
  generationMetadata: any,
  jobName: string,
  startedAt: string,
  completedAt: string
) {
  const duration_ms = calculateDuration(startedAt, completedAt);

  return {
    ...generationMetadata,
    job_timings: {
      ...(generationMetadata?.job_timings || {}),
      [jobName]: {
        duration_ms,
        started_at: startedAt,
        completed_at: completedAt,
      },
    },
  };
}

/**
 * Calculate total generation time across all completed jobs
 *
 * @param generationMetadata - Current generation_metadata object
 * @returns Total time in milliseconds
 */
export function calculateTotalGenerationTime(generationMetadata: any): number {
  const timings = generationMetadata?.job_timings || {};
  return Object.values(timings).reduce((sum: number, timing: any) => {
    return sum + (timing.duration_ms || 0);
  }, 0);
}

/**
 * Format milliseconds into human-readable duration
 * Useful for logging and future UI display
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "2.5s", "45s", "1m 23s")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
