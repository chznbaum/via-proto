/**
 * Job Task Registry
 *
 * Exports all job task handlers for Graphile Worker.
 * Each task is registered by name and mapped to its handler function.
 *
 * COMPLETE GENERATION FLOW (5-step core + 3-step improvement):
 *
 * CORE GENERATION (Always runs):
 * 1. generate_metadata: Creates title, description, skill level
 * 2. fetch_unsplash_image: Fetches cover image
 * 3. research_resources: Web search for 30-50 candidate resources
 * 4. generate_sections_resources: Organizes resources into sections (40-60 resources)
 * 5. validate_and_finalize: Quality checks and marks completed
 * 6. validate_resource_links: Fetches OpenGraph + checks accessibility (1st run)
 *
 * RESOURCE IMPROVEMENT (Conditional - runs if needed):
 * 7. replace_broken_resources: Replaces broken/inaccessible links (if > 3 found)
 * 8. enrich_sections: Adds resources to under-resourced sections (if < 5 active per section)
 * 9. validate_resource_links: Fetches OpenGraph for new resources (2nd run, no improvement checks)
 */

import type { Task, TaskList } from 'graphile-worker';
import { generateMetadataTask } from './generate-metadata';
import { fetchUnsplashImageTask } from './fetch-unsplash-image';
import { researchResourcesTask } from './research-resources';
import { generateSectionsResourcesTask } from './generate-sections-resources';
import { validateAndFinalizeTask } from './validate-and-finalize';
import { validateResourceLinksTask } from './validate-resource-links';
import { replaceBrokenResourcesTask } from './replace-broken-resources';
import { enrichSectionsTask } from './enrich-sections';
import { notifyGenerationFailedTask } from './notify-generation-failed';

/**
 * Task list for Graphile Worker
 * Maps job names to their handler functions
 *
 * Note: Tasks return values for debugging purposes, but Graphile Worker
 * expects void returns. The cast is safe since the return values are ignored.
 */
export const tasks: TaskList = {
  generate_metadata: generateMetadataTask as Task,
  fetch_unsplash_image: fetchUnsplashImageTask as Task,
  research_resources: researchResourcesTask as Task,
  generate_sections_resources: generateSectionsResourcesTask as Task,
  validate_and_finalize: validateAndFinalizeTask as Task,
  validate_resource_links: validateResourceLinksTask as Task,
  replace_broken_resources: replaceBrokenResourcesTask as Task,
  enrich_sections: enrichSectionsTask as Task,
  notify_generation_failed: notifyGenerationFailedTask as Task,
};
