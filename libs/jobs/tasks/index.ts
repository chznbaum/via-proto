/**
 * Job Task Registry
 *
 * Exports all job task handlers for Graphile Worker.
 * Each task is registered by name and mapped to its handler function.
 */

import type { TaskList } from 'graphile-worker';
import { generateMetadataTask } from './generate-metadata';
import { fetchUnsplashImageTask } from './fetch-unsplash-image';
import { generateSectionsResourcesTask } from './generate-sections-resources';
import { notifyGenerationFailedTask } from './notify-generation-failed';

/**
 * Task list for Graphile Worker
 * Maps job names to their handler functions
 */
export const tasks: TaskList = {
  generate_metadata: generateMetadataTask,
  fetch_unsplash_image: fetchUnsplashImageTask,
  generate_sections_resources: generateSectionsResourcesTask,
  notify_generation_failed: notifyGenerationFailedTask,
};
