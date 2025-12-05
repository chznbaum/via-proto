/**
 * Graphile Worker - Background Job Processor
 *
 * This is the main entry point for the background job worker.
 * It processes queued jobs for learning path generation.
 *
 * Jobs:
 * - generate_metadata: Creates path title, description, skill level
 * - fetch_unsplash_image: Fetches cover image from Unsplash
 * - generate_sections_resources: Generates learning content
 * - notify_generation_failed: Sends failure notifications
 *
 * Run with: npm run worker (production) or npm run worker:dev (development)
 */

// Load environment variables before imports
// Next.js does this automatically for API routes, but worker is a standalone script
import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import * as Sentry from '@sentry/node';
import { run, Runner } from 'graphile-worker';
import { tasks } from './libs/jobs/tasks';
import { addJob } from './libs/jobs/queue';

// Initialize Sentry for worker error tracking
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.NODE_ENV === 'production',
  // Tag all errors from this process as coming from the worker
  initialScope: {
    tags: { service: 'worker' },
  },
});

let runner: Runner | null = null;

async function main() {
  console.log('Starting Graphile Worker...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Start the worker
  runner = await run({
    connectionString,
    taskList: tasks,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3', 10),
    pollInterval: parseInt(process.env.WORKER_POLL_INTERVAL || '1000', 10),
    noHandleSignals: false, // Handle SIGTERM/SIGINT gracefully
  });

  console.log('Worker started successfully');

  // Set up event handlers on the runner's event emitter
  runner.events.on('job:start', ({ job }) => {
    console.log(`Job started: ${job.task_identifier} (${job.id})`);
  });

  runner.events.on('job:success', ({ job }) => {
    console.log(`Job completed: ${job.task_identifier} (${job.id})`);
  });

  runner.events.on('job:error', async ({ job, error }) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Job error: ${job.task_identifier} (${job.id})`, errorMessage);

    // Report to Sentry with job context
    Sentry.captureException(error, {
      tags: {
        job_type: job.task_identifier,
        job_id: job.id,
        attempt: job.attempts,
        max_attempts: job.max_attempts,
      },
      extra: {
        payload: job.payload,
        created_at: job.created_at,
        run_at: job.run_at,
      },
    });

    // On final failure (exhausted retries), queue notification
    if (job.attempts >= job.max_attempts) {
      console.log(`Queueing failure notification for job ${job.id}`);

      try {
        // Type the payload for accessing properties
        const payload = job.payload as Record<string, unknown> | null;
        await addJob('notify_generation_failed', {
          pathId: (payload?.pathId as string) || 'unknown',
          step: job.task_identifier,
          error: errorMessage,
          userId: (payload?.userId as string) || (payload?.creator_id as string) || 'unknown',
          topicName: (payload?.topicName as string) || 'Unknown Topic',
        });
      } catch (notifyError) {
        console.error(`Failed to queue failure notification:`, notifyError);
      }
    }
  });

  runner.events.on('job:failed', ({ job, error }) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Job permanently failed: ${job.task_identifier} (${job.id})`, errorMessage);
  });

  runner.events.on('pool:create', () => {
    console.log('Database connection pool created');
  });

  runner.events.on('pool:release', () => {
    console.log('Database connection pool released');
  });

  runner.events.on('worker:stop', ({ worker }) => {
    console.log(`Worker ${worker.workerId} stopping...`);
  });

  // Wait for worker to stop
  await runner.promise;
}

// Graceful shutdown handler
async function shutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  if (runner) {
    await runner.stop();
    console.log('Worker stopped cleanly');
  }

  // Flush any pending Sentry events before exiting
  await Sentry.close(2000);

  process.exit(0);
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the worker
main().catch(async (err) => {
  console.error('Worker crashed:', err);
  Sentry.captureException(err, {
    tags: { fatal: true },
  });
  await Sentry.close(2000);
  process.exit(1);
});
