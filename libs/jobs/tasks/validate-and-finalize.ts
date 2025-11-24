/**
 * Job Task: validate_and_finalize
 *
 * PROMPT CHAIN STEP 3: Final validation and completion
 *
 * This is the third and final step in the 3-step prompt chaining approach:
 * Step 1: Research (research_resources) - Web search for 30-50 resources ✓
 * Step 2: Curate (generate_sections_resources) - Organize into sections ✓
 * Step 3: Validate (this task) - Quality checks and mark as completed
 *
 * Flow:
 * 1. Update status to validating
 * 2. Perform quality checks on generated sections/resources
 * 3. Mark path as 'completed'
 * 4. Queue validate_resource_links for OpenGraph metadata fetch
 */

import type { Task } from 'graphile-worker';
import { createServiceClient } from '@/libs/supabase/service';
import type { ValidateAndFinalizePayload } from '../types';
import { addJob } from '../queue';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';

/**
 * Task handler for validation and finalization
 */
export const validateAndFinalizeTask: Task = async (payload, helpers) => {
  const { pathId } = payload as ValidateAndFinalizePayload;

  console.log(`[validate_and_finalize] Starting validation for path ${pathId}`);

  const supabase = createServiceClient();

  try {
    // Check if cancelled
    const { data: pathCheck } = await supabase
      .from('learning_paths')
      .select('generation_status')
      .eq('id', pathId)
      .single();

    if (pathCheck?.generation_status === 'cancelled') {
      console.log(`[validate_and_finalize] Path ${pathId} was cancelled, exiting`);
      return { cancelled: true, pathId };
    }

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
        generation_status: 'validating',
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

    console.log(`[validate_and_finalize] Status updated to validating`);

    // Step 2: Fetch path and validate it has sections
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select(`
        id,
        title,
        description,
        skill_level,
        total_estimated_hours,
        generation_metadata
      `)
      .eq('id', pathId)
      .single();

    if (pathError || !path) {
      throw new Error(`Path not found: ${pathError?.message || 'Unknown error'}`);
    }

    // Step 3: Fetch sections and resources to validate
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select(`
        id,
        order,
        title,
        estimated_hours,
        resources (
          id,
          order,
          url,
          type,
          is_free
        )
      `)
      .eq('learning_path_id', pathId)
      .order('order', { ascending: true });

    if (sectionsError) {
      throw new Error(`Failed to fetch sections: ${sectionsError.message}`);
    }

    if (!sections || sections.length < 5) {
      throw new Error(
        `Insufficient sections found. Expected 5-8, found: ${sections?.length || 0}. Curation may have failed.`
      );
    }

    console.log(`[validate_and_finalize] Found ${sections.length} sections to validate`);

    // Step 4: Run quality checks
    const totalResources = sections.reduce((sum, section) => sum + (section.resources?.length || 0), 0);

    console.log(`[validate_and_finalize] Quality checks:`);
    console.log(`  - Sections: ${sections.length} (expected: 5-8) ${sections.length >= 5 && sections.length <= 8 ? '✓' : '⚠️'}`);
    console.log(`  - Total resources: ${totalResources} (expected: 20-35) ${totalResources >= 20 && totalResources <= 40 ? '✓' : '⚠️'}`);

    // Check each section has sufficient resources
    const sectionsWithFewResources = sections.filter((s) => (s.resources?.length || 0) < 3);
    if (sectionsWithFewResources.length > 0) {
      console.warn(
        `[validate_and_finalize] ${sectionsWithFewResources.length} sections have < 3 resources:`,
        sectionsWithFewResources.map((s) => s.title)
      );
    }

    // Check resource type diversity
    const resourceTypes = sections.flatMap((s) => s.resources || []).map((r) => r.type);
    const uniqueTypes = new Set(resourceTypes);
    console.log(`  - Resource type diversity: ${uniqueTypes.size} types ${uniqueTypes.size >= 3 ? '✓' : '⚠️'}`);

    // Check free resource availability
    const freeResources = sections.flatMap((s) => s.resources || []).filter((r) => r.is_free === true);
    const freePercentage = (freeResources.length / totalResources) * 100;
    console.log(`  - Free resources: ${freeResources.length} (${freePercentage.toFixed(1)}%) ${freePercentage >= 40 ? '✓' : '⚠️'}`);

    // Step 5: All checks passed, mark as completed with timing
    const completedAt = new Date().toISOString();
    const { data: finalPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
      .eq('id', pathId)
      .single();

    const startedAt = finalPath?.generation_jobs?.validation?.started_at;
    const updatedMetadata = updateJobTiming(
      finalPath?.generation_metadata,
      'validate_and_finalize',
      startedAt,
      completedAt
    );
    const totalTime = calculateTotalGenerationTime(updatedMetadata);

    const { error: completionError } = await supabase
      .from('learning_paths')
      .update({
        generation_status: 'completed',
        generation_jobs: {
          ...finalPath?.generation_jobs,
          validation: {
            ...finalPath?.generation_jobs?.validation,
            completed_at: completedAt,
            status: 'completed',
          },
        },
        generation_metadata: {
          ...updatedMetadata,
          total_generation_time_ms: totalTime,
        },
      })
      .eq('id', pathId);

    console.log(`[validate_and_finalize] Job completed in ${formatDuration(updatedMetadata.job_timings.validate_and_finalize.duration_ms)}`);

    if (completionError) {
      throw new Error(`Failed to mark path as completed: ${completionError.message}`);
    }

    console.log(`[validate_and_finalize] Path marked as completed! ✓`);

    // Step 6: Queue OpenGraph metadata fetch (async, non-blocking)
    await addJob('validate_resource_links', { pathId });
    console.log(`[validate_and_finalize] Queued validate_resource_links for OpenGraph metadata`);

    return {
      success: true,
      pathId,
      sectionsCount: sections.length,
      resourcesCount: totalResources,
      qualityChecks: {
        sections: sections.length >= 5 && sections.length <= 8,
        resources: totalResources >= 20 && totalResources <= 40,
        diversity: uniqueTypes.size >= 3,
        freeResources: freePercentage >= 40,
      },
    };
  } catch (error) {
    console.error(`[validate_and_finalize] Error:`, error);

    // Update path with failed status and job metadata
    try {
      const { data: errorPath } = await supabase
        .from('learning_paths')
        .select('generation_jobs')
        .eq('id', pathId)
        .single();

      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'failed_validation',
          generation_error: error instanceof Error ? error.message : 'Unknown error during validation',
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
    } catch (updateError) {
      console.error(`Failed to update error status:`, updateError);
    }

    // Re-throw to trigger Graphile Worker's retry logic
    throw error;
  }
};
