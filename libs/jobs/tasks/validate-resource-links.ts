/**
 * Job Task: validate_resource_links
 *
 * Validates all resource links and fetches OpenGraph metadata for rich previews.
 * This is Job #4 in the path generation sequence.
 *
 * Flow:
 * 1. Update status to validating_links
 * 2. Fetch all resources for the path
 * 3. For each resource:
 *    - Fetch URL with timeout
 *    - Extract OpenGraph metadata (image, title, description)
 *    - Extract <title> tag as fallback
 *    - Extract favicon URL
 *    - Determine link status based on HTTP response
 *    - Update resource with metadata and status
 * 4. Mark path as completed
 *
 * Status codes:
 * - 200-299: active
 * - 401, 403: requires_login
 * - 404, 4xx, 5xx: broken
 * - Timeout/error: unchecked
 */

import type { Task } from 'graphile-worker';
import { createServiceClient } from '@/libs/supabase/service';
import { fetchMultipleLinkMetadata } from '@/libs/link-metadata';
import type { ValidateResourceLinksPayload } from '../types';

/**
 * Task handler for resource link validation
 */
export const validateResourceLinksTask: Task = async (payload, helpers) => {
  const { pathId } = payload as ValidateResourceLinksPayload;

  console.log(`[validate_resource_links] Starting for path ${pathId}`);

  const supabase = createServiceClient();

  try {
    // Step 1: Update status and track job start
    const { data: currentPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs')
      .eq('id', pathId)
      .single();

    const generationJobs = currentPath?.generation_jobs || {};

    await supabase
      .from('learning_paths')
      .update({
        generation_status: 'validating_links',
        generation_jobs: {
          ...generationJobs,
          validation: {
            job_id: helpers.job.id.toString(),
            started_at: new Date().toISOString(),
            attempts: helpers.job.attempts,
            status: 'pending',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[validate_resource_links] Status updated to validating_links`);

    // Step 2: Fetch all resources for this learning path
    const { data: sections } = await supabase
      .from('sections')
      .select('id')
      .eq('learning_path_id', pathId);

    if (!sections || sections.length === 0) {
      console.warn(`[validate_resource_links] No sections found for path ${pathId}`);

      // Mark as completed with note
      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'completed',
          generation_jobs: {
            ...generationJobs,
            validation: {
              ...generationJobs.validation,
              completed_at: new Date().toISOString(),
              status: 'completed',
              note: 'No resources to validate',
            },
          },
        })
        .eq('id', pathId);

      return { success: true, pathId, resourcesValidated: 0 };
    }

    const sectionIds = sections.map(s => s.id);

    const { data: resources } = await supabase
      .from('resources')
      .select('id, url')
      .in('section_id', sectionIds)
      .order('section_id')
      .order('order');

    if (!resources || resources.length === 0) {
      console.warn(`[validate_resource_links] No resources found for path ${pathId}`);

      // Mark as completed
      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'completed',
          generation_jobs: {
            ...generationJobs,
            validation: {
              ...generationJobs.validation,
              completed_at: new Date().toISOString(),
              status: 'completed',
              note: 'No resources to validate',
            },
          },
        })
        .eq('id', pathId);

      return { success: true, pathId, resourcesValidated: 0 };
    }

    console.log(`[validate_resource_links] Found ${resources.length} resources to validate`);

    // Step 3: Fetch metadata for all resources (with concurrency limit)
    const urls = resources.map(r => r.url);
    const metadataResults = await fetchMultipleLinkMetadata(urls, {
      timeout: 8000, // 8 second timeout per URL
      concurrency: 3, // Process 3 at a time to avoid overwhelming servers
    });

    console.log(`[validate_resource_links] Fetched metadata for ${metadataResults.length} resources`);

    // Step 4: Update each resource with metadata
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const metadata = metadataResults[i];

      try {
        const { error } = await supabase
          .from('resources')
          .update({
            link_status: metadata.status,
            last_checked_at: new Date().toISOString(),
            og_title: metadata.ogTitle || null,
            og_description: metadata.ogDescription || null,
            og_image_url: metadata.ogImage || null,
            page_title: metadata.title || null,
            favicon_url: metadata.faviconUrl || null,
          })
          .eq('id', resource.id);

        if (error) {
          console.error(`[validate_resource_links] Failed to update resource ${resource.id}:`, error);
          errorCount++;
        } else {
          updatedCount++;
        }
      } catch (updateError) {
        console.error(`[validate_resource_links] Error updating resource ${resource.id}:`, updateError);
        errorCount++;
      }
    }

    console.log(`[validate_resource_links] Updated ${updatedCount}/${resources.length} resources (${errorCount} errors)`);

    // Step 5: Mark path as completed and update job metadata
    const { data: finalPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
      .eq('id', pathId)
      .single();

    const updatedGenerationMetadata = {
      ...(finalPath?.generation_metadata || {}),
      completed_at: new Date().toISOString(),
    };

    await supabase
      .from('learning_paths')
      .update({
        generation_status: 'completed',
        generation_metadata: updatedGenerationMetadata,
        generation_jobs: {
          ...finalPath?.generation_jobs,
          validation: {
            ...finalPath?.generation_jobs?.validation,
            completed_at: new Date().toISOString(),
            status: 'completed',
            resources_validated: updatedCount,
            validation_errors: errorCount,
          },
        },
      })
      .eq('id', pathId);

    console.log(`[validate_resource_links] Completed! Path ${pathId} marked as completed`);

    // Summarize validation results
    const statusCounts = metadataResults.reduce((acc, meta) => {
      acc[meta.status] = (acc[meta.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`[validate_resource_links] Validation summary:`, statusCounts);

    return {
      success: true,
      pathId,
      resourcesValidated: updatedCount,
      validationErrors: errorCount,
      statusCounts,
    };
  } catch (error) {
    console.error(`[validate_resource_links] Error:`, error);

    // Update status to indicate validation failed
    // Note: This is non-critical - path is still usable without validation
    try {
      const { data: errorPath } = await supabase
        .from('learning_paths')
        .select('generation_jobs')
        .eq('id', pathId)
        .single();

      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'completed', // Still mark as completed (non-critical failure)
          generation_error: error instanceof Error ? error.message : 'Unknown error during link validation',
          generation_jobs: {
            ...errorPath?.generation_jobs,
            validation: {
              ...errorPath?.generation_jobs?.validation,
              failed_at: new Date().toISOString(),
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        })
        .eq('id', pathId);

      console.log(`[validate_resource_links] Marked as failed but path still completed`);
    } catch (recoveryError) {
      console.error(`Failed to recover from validation error:`, recoveryError);
    }

    // Don't re-throw - validation failure shouldn't block the path from being usable
    console.warn(`[validate_resource_links] Continuing despite error`);

    return {
      success: false,
      pathId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
