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

import type { TaskList } from 'graphile-worker';
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
 */
export const tasks: TaskList = {
  generate_metadata: generateMetadataTask,
  fetch_unsplash_image: fetchUnsplashImageTask,
  research_resources: researchResourcesTask,
  generate_sections_resources: generateSectionsResourcesTask,
  validate_and_finalize: validateAndFinalizeTask,
  validate_resource_links: validateResourceLinksTask,
  replace_broken_resources: replaceBrokenResourcesTask,
  enrich_sections: enrichSectionsTask,
  notify_generation_failed: notifyGenerationFailedTask,
};
