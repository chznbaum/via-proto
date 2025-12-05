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

import { createServiceClient } from '@/libs/supabase/service';
import { fetchMultipleLinkMetadata } from '@/libs/link-metadata';
import type { ValidateResourceLinksPayload, TaskWithResult } from '../types';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';
import { addJob } from '../queue';

/**
 * Task handler for resource link validation
 */
export const validateResourceLinksTask: TaskWithResult = async (payload, helpers) => {
  const { pathId } = payload as ValidateResourceLinksPayload;

  console.log(`[validate_resource_links] Starting for path ${pathId}`);

  const supabase = createServiceClient();

  try {
    // Check if cancelled
    const { data: pathCheck } = await supabase
      .from('learning_paths')
      .select('generation_status')
      .eq('id', pathId)
      .single();

    if (pathCheck?.generation_status === 'cancelled') {
      console.log(`[validate_resource_links] Path ${pathId} was cancelled, exiting`);
      return { cancelled: true, pathId };
    }

    // Step 1: Update status to validating_links (visible to user)
    const { data: currentPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs')
      .eq('id', pathId)
      .single();

    const generationJobs = currentPath?.generation_jobs || {};

    await supabase
      .from('learning_paths')
      .update({
        generation_status: 'validating_links',  // Make status visible to user
        generation_jobs: {
          ...generationJobs,
          link_validation: {
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

      // Mark link validation as completed with note
      await supabase
        .from('learning_paths')
        .update({
          generation_jobs: {
            ...generationJobs,
            link_validation: {
              ...generationJobs.link_validation,
              completed_at: new Date().toISOString(),
              status: 'completed',
              note: 'No sections to validate',
            },
          },
        })
        .eq('id', pathId);

      return { success: true, pathId, resourcesValidated: 0 };
    }

    const sectionIds = sections.map(s => s.id);

    const { data: resources } = await supabase
      .from('resources')
      .select('id, url, section_id')
      .in('section_id', sectionIds)
      .order('section_id')
      .order('order');

    if (!resources || resources.length === 0) {
      console.warn(`[validate_resource_links] No resources found for path ${pathId}`);

      // Mark link validation as completed
      await supabase
        .from('learning_paths')
        .update({
          generation_jobs: {
            ...generationJobs,
            link_validation: {
              ...generationJobs.link_validation,
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

    // Step 5: Update job metadata with timing (don't change status - already completed)
    const completedAt = new Date().toISOString();
    const { data: finalPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
      .eq('id', pathId)
      .single();

    const startedAt = finalPath?.generation_jobs?.link_validation?.started_at;
    const updatedMetadata = updateJobTiming(
      finalPath?.generation_metadata,
      'validate_resource_links',
      startedAt,
      completedAt
    );
    const totalTime = calculateTotalGenerationTime(updatedMetadata);

    const updatedGenerationMetadata = {
      ...updatedMetadata,
      link_validation_completed_at: completedAt,
      total_generation_time_ms: totalTime,
    };

    await supabase
      .from('learning_paths')
      .update({
        generation_metadata: updatedGenerationMetadata,
        generation_jobs: {
          ...finalPath?.generation_jobs,
          link_validation: {
            ...finalPath?.generation_jobs?.link_validation,
            completed_at: completedAt,
            status: 'completed',
            resources_validated: updatedCount,
            validation_errors: errorCount,
          },
        },
      })
      .eq('id', pathId);

    console.log(`[validate_resource_links] Job completed in ${formatDuration(updatedMetadata.job_timings.validate_resource_links.duration_ms)}`);

    console.log(`[validate_resource_links] Completed! Link validation finished (background)`);

    // Summarize validation results
    const statusCounts = metadataResults.reduce((acc, meta) => {
      acc[meta.status] = (acc[meta.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`[validate_resource_links] Validation summary:`, statusCounts);

    // Step 6: Detect if this is a second run (post-improvement)
    const { data: pathMetadata } = await supabase
      .from('learning_paths')
      .select('generation_jobs')
      .eq('id', pathId)
      .single();

    const hasRunReplacement = pathMetadata?.generation_jobs?.replacement?.status === 'completed';
    const hasRunEnrichment = pathMetadata?.generation_jobs?.enrichment?.status === 'completed';
    const isSecondRun = hasRunReplacement || hasRunEnrichment;

    if (isSecondRun) {
      console.log(`[validate_resource_links] Second run detected (post-improvement) - skipping improvement checks, marking as completed`);

      // Mark path as completed (no further improvement jobs)
      await supabase
        .from('learning_paths')
        .update({ generation_status: 'completed' })
        .eq('id', pathId);

      return {
        success: true,
        pathId,
        resourcesValidated: updatedCount,
        validationErrors: errorCount,
        secondRun: true,
      };
    }

    // Step 7: Check if resource improvement is needed (first run only)
    const brokenCount = (statusCounts['broken'] || 0) + (statusCounts['requires_login'] || 0);
    const needsReplacement = brokenCount > 3;

    console.log(`[validate_resource_links] Broken/inaccessible resources: ${brokenCount}`);

    // Check if any sections have < 5 active resources (after validation)
    // Count only resources that are 'active' after link validation
    const resourcesPerSection: Record<string, { total: number; active: number }> = {};

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const metadata = metadataResults[i];
      const sectionId = resource.section_id;

      if (!resourcesPerSection[sectionId]) {
        resourcesPerSection[sectionId] = { total: 0, active: 0 };
      }

      resourcesPerSection[sectionId].total++;
      // Count 'active' and 'unchecked' as usable (unchecked = couldn't verify, but probably fine)
      if (metadata.status === 'active' || metadata.status === 'unchecked') {
        resourcesPerSection[sectionId].active++;
      }
    }

    const underResourcedSections = Object.entries(resourcesPerSection)
      .filter(([_, counts]) => counts.active < 5)
      .map(([sectionId, counts]) => ({ sectionId, active: counts.active, total: counts.total }));

    const needsEnrichment = underResourcedSections.length > 0;

    if (needsEnrichment) {
      console.log(`[validate_resource_links] Found ${underResourcedSections.length} sections with < 5 resources:`, underResourcedSections);
    }

    // Queue improvement jobs if needed
    if (needsReplacement || needsEnrichment) {
      console.log(`[validate_resource_links] Resource improvement needed - queueing jobs`);

      if (needsReplacement) {
        await addJob('replace_broken_resources', { pathId });
        console.log(`[validate_resource_links] Queued replace_broken_resources job`);
      } else if (needsEnrichment) {
        // If only enrichment needed (no broken links), queue enrichment directly
        await addJob('enrich_sections', { pathId });
        console.log(`[validate_resource_links] Queued enrich_sections job`);
      }
    } else {
      // No improvement needed - mark path as fully completed
      console.log(`[validate_resource_links] No improvements needed - marking as completed`);
      await supabase
        .from('learning_paths')
        .update({ generation_status: 'completed' })
        .eq('id', pathId);
    }

    return {
      success: true,
      pathId,
      resourcesValidated: updatedCount,
      validationErrors: errorCount,
      statusCounts,
      needsReplacement,
      needsEnrichment,
      brokenCount,
      underResourcedSections: underResourcedSections.length,
    };
  } catch (error) {
    console.error(`[validate_resource_links] Error:`, error);

    // Update job metadata to indicate link validation failed
    // Note: This is non-critical - path is still usable without link validation
    try {
      const { data: errorPath } = await supabase
        .from('learning_paths')
        .select('generation_jobs')
        .eq('id', pathId)
        .single();

      await supabase
        .from('learning_paths')
        .update({
          // Don't change generation_status - keep as 'completed'
          generation_jobs: {
            ...errorPath?.generation_jobs,
            link_validation: {
              ...errorPath?.generation_jobs?.link_validation,
              failed_at: new Date().toISOString(),
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        })
        .eq('id', pathId);

      console.log(`[validate_resource_links] Link validation failed but path remains completed and usable`);
    } catch (recoveryError) {
      console.error(`Failed to update link validation error:`, recoveryError);
    }

    // Don't re-throw - link validation failure shouldn't block the path from being usable
    console.warn(`[validate_resource_links] Path remains usable despite link validation error`);

    return {
      success: false,
      pathId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
