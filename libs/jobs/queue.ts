/**
 * Job Queue Utility
 *
 * Provides type-safe functions for adding jobs to the Graphile Worker queue.
 * This is the primary interface for triggering background jobs throughout the application.
 */

import { quickAddJob } from 'graphile-worker';
import type {
  JobType,
  GenerateMetadataPayload,
  FetchUnsplashImagePayload,
  ResearchResourcesPayload,
  GenerateSectionsResourcesPayload,
  ValidateAndFinalizePayload,
  ValidateResourceLinksPayload,
  ReplaceBrokenResourcesPayload,
  EnrichSectionsPayload,
  NotifyGenerationFailedPayload,
} from './types';

/**
 * Options for configuring job execution
 */
export interface JobOptions {
  /**
   * Job priority (lower number = higher priority)
   * Default: 0 (normal priority)
   */
  priority?: number;

  /**
   * Maximum number of retry attempts
   * Default: 3
   */
  maxAttempts?: number;

  /**
   * Schedule job to run at specific time
   * Default: now
   */
  runAt?: Date;

  /**
   * Unique key for job deduplication
   * If a job with this key already exists, it won't be added again
   */
  key?: string;
}

/**
 * Get database connection string from environment
 * Throws error if DATABASE_URL is not configured
 */
function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not configured. ' +
        'Job queue cannot function without database connection.'
    );
  }

  return connectionString;
}

/**
 * Add a job to the queue with type-safe payload
 *
 * This is the primary function for queueing background jobs.
 * It provides type safety for job payloads and handles connection management.
 *
 * @param type - The job type to queue
 * @param payload - Type-safe payload for the job
 * @param options - Optional job configuration
 * @throws Error if DATABASE_URL is not configured
 *
 * @example
 * ```typescript
 * // Queue metadata generation job
 * await addJob('generate_metadata', {
 *   pathId: 'uuid',
 *   topicId: 'uuid',
 *   topicName: 'React',
 *   modelId: 'anthropic/claude-sonnet-4.5',
 * });
 *
 * // Queue with custom options
 * await addJob('fetch_unsplash_image', {
 *   pathId: 'uuid',
 *   topicName: 'React',
 * }, {
 *   maxAttempts: 5,
 *   priority: 1,
 * });
 * ```
 */
export async function addJob(
  type: 'generate_metadata',
  payload: GenerateMetadataPayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: 'fetch_unsplash_image',
  payload: FetchUnsplashImagePayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: 'research_resources',
  payload: ResearchResourcesPayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: 'generate_sections_resources',
  payload: GenerateSectionsResourcesPayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: 'validate_and_finalize',
  payload: ValidateAndFinalizePayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: 'validate_resource_links',
  payload: ValidateResourceLinksPayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: 'replace_broken_resources',
  payload: ReplaceBrokenResourcesPayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: 'enrich_sections',
  payload: EnrichSectionsPayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: 'notify_generation_failed',
  payload: NotifyGenerationFailedPayload,
  options?: JobOptions
): Promise<void>;

export async function addJob(
  type: JobType,
  payload: unknown,
  options: JobOptions = {}
): Promise<void> {
  const connectionString = getConnectionString();

  try {
    await quickAddJob(
      { connectionString },
      type,
      payload,
      {
        maxAttempts: options.maxAttempts ?? 3,
        priority: options.priority,
        runAt: options.runAt,
        jobKey: options.key,
      }
    );

    console.log(`✅ Job queued: ${type}`, {
      payload: JSON.stringify(payload).substring(0, 100),
      options,
    });
  } catch (error) {
    console.error(`❌ Failed to queue job: ${type}`, error);
    throw new Error(
      `Failed to add job to queue: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Utility: Add multiple jobs in sequence
 * Useful when you need to queue a series of jobs that should execute in order
 *
 * @param jobs - Array of job configurations
 * @example
 * ```typescript
 * await addJobsInSequence([
 *   { type: 'generate_metadata', payload: {...} },
 *   { type: 'fetch_unsplash_image', payload: {...}, options: { runAt: new Date(Date.now() + 1000) } },
 * ]);
 * ```
 */
export async function addJobsInSequence(
  jobs: Array<{
    type: JobType;
    payload: any;
    options?: JobOptions;
  }>
): Promise<void> {
  for (const job of jobs) {
    await addJob(job.type as any, job.payload, job.options);
  }
}
