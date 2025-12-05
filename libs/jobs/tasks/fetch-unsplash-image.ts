/**
 * Job Task: fetch_unsplash_image
 *
 * Fetches a cover image from Unsplash and attaches it to the learning path.
 * This is Job #2 in the three-step path generation sequence.
 *
 * Flow:
 * 1. Update status to fetching_image
 * 2. Call Unsplash API to get random image for topic
 * 3. Check if image already exists in database
 * 4. Insert new image if needed
 * 5. Link image to learning_paths
 * 6. Trigger Unsplash download event (required by API guidelines)
 * 7. Queue next job: generate_sections_resources
 *
 * Note: Image fetch failure is non-critical. If it fails, we still proceed
 * to sections generation. Path will be usable without an image.
 */

import { createServiceClient } from '@/libs/supabase/service';
import { fetchUnsplashImage, triggerUnsplashDownload } from '@/libs/unsplash';
import type { FetchUnsplashImagePayload, TaskWithResult } from '../types';
import { addJob } from '../queue';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';

/**
 * Task handler for Unsplash image fetching
 */
export const fetchUnsplashImageTask: TaskWithResult = async (payload, helpers) => {
  const { pathId, topicName } = payload as FetchUnsplashImagePayload;

  console.log(`[fetch_unsplash_image] Starting for path ${pathId}`);

  const supabase = createServiceClient();

  try {
    // Check if cancelled
    const { data: pathCheck } = await supabase
      .from('learning_paths')
      .select('generation_status')
      .eq('id', pathId)
      .single();

    if (pathCheck?.generation_status === 'cancelled') {
      console.log(`[fetch_unsplash_image] Path ${pathId} was cancelled, exiting`);
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
        generation_status: 'fetching_image',
        generation_jobs: {
          ...generationJobs,
          image: {
            job_id: helpers.job.id.toString(),
            started_at: new Date().toISOString(),
            attempts: helpers.job.attempts,
            status: 'pending',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[fetch_unsplash_image] Status updated to fetching_image`);

    // Step 2: Fetch Unsplash image for the topic
    console.log(`[fetch_unsplash_image] Searching Unsplash for: "${topicName}"`);

    let unsplashImage = await fetchUnsplashImage(topicName, 'landscape');

    // Step 2b: Fallback to primary competency if no image found for topic
    if (!unsplashImage) {
      console.warn(`[fetch_unsplash_image] No image found for "${topicName}", trying primary competency...`);

      // Fetch the path to get topic_id
      const { data: pathData } = await supabase
        .from('learning_paths')
        .select('topic_id')
        .eq('id', pathId)
        .single();

      if (pathData?.topic_id) {
        // Query for primary competency
        const { data: primaryComp } = await supabase
          .from('topic_competencies')
          .select(`
            competency:competencies(name)
          `)
          .eq('topic_id', pathData.topic_id)
          .eq('is_primary', true)
          .limit(1)
          .single();

        // Type assertion for competency relation (Supabase types as array but it's a single object)
        const competency = primaryComp?.competency as unknown as { name: string } | null;
        if (competency?.name) {
          const competencyName = competency.name;
          console.log(`[fetch_unsplash_image] Retrying with primary competency: "${competencyName}"`);

          unsplashImage = await fetchUnsplashImage(competencyName, 'landscape');

          if (unsplashImage) {
            console.log(`[fetch_unsplash_image] Found image using competency fallback`);
          }
        }
      }
    }

    // If still no image after fallback attempts
    if (!unsplashImage) {
      console.warn(`[fetch_unsplash_image] No image found after all attempts`);

      // Update job metadata - completed but no image found with timing
      const completedAt = new Date().toISOString();
      const { data: noImagePath } = await supabase
        .from('learning_paths')
        .select('generation_jobs, generation_metadata')
        .eq('id', pathId)
        .single();

      const startedAt = noImagePath?.generation_jobs?.image?.started_at;
      const updatedMetadata = updateJobTiming(
        noImagePath?.generation_metadata,
        'fetch_unsplash_image',
        startedAt,
        completedAt
      );
      const totalTime = calculateTotalGenerationTime(updatedMetadata);

      await supabase
        .from('learning_paths')
        .update({
          generation_jobs: {
            ...noImagePath?.generation_jobs,
            image: {
              ...noImagePath?.generation_jobs?.image,
              completed_at: completedAt,
              status: 'completed',
              note: 'No image found (tried topic and primary competency)',
            },
          },
          generation_metadata: {
            ...updatedMetadata,
            total_generation_time_ms: totalTime,
          },
        })
        .eq('id', pathId);

      console.log(`[fetch_unsplash_image] Job completed in ${formatDuration(updatedMetadata.job_timings.fetch_unsplash_image.duration_ms)}`);

      // Non-critical failure - proceed to next step without image
      // Fetch skill_level for research_resources job
      const { data: pathInfo } = await supabase
        .from('learning_paths')
        .select('skill_level')
        .eq('id', pathId)
        .single();

      await addJob('research_resources', {
        pathId,
        topicName,
        skillLevel: pathInfo?.skill_level || 'beginner',
      });
      console.log(`[fetch_unsplash_image] Completed (no image). Queued research_resources`);

      return {
        success: true,
        pathId,
        imageFound: false,
      };
    }

    console.log(`[fetch_unsplash_image] Found image by ${unsplashImage.photographer}`);

    // Step 3: Check if this photo already exists in our database
    const { data: existingImage } = await supabase
      .from('unsplash_images')
      .select('id')
      .eq('photo_id', unsplashImage.photoId)
      .single();

    let unsplashImageId: string;

    if (existingImage) {
      // Image already in database, reuse it
      unsplashImageId = existingImage.id;
      console.log(`[fetch_unsplash_image] Reusing existing image record`);
    } else {
      // Step 4: Insert new image record
      const { data: newImage, error: imageError } = await supabase
        .from('unsplash_images')
        .insert({
          photo_id: unsplashImage.photoId,
          url: unsplashImage.url,
          photographer: unsplashImage.photographer,
          photographer_username: unsplashImage.photographerUsername,
          photographer_url: unsplashImage.photographerUrl,
          download_location: unsplashImage.downloadLocation,
          alt_description: unsplashImage.altDescription,
          usage_note: unsplashImage.usageNote,
        })
        .select('id')
        .single();

      if (imageError || !newImage) {
        throw new Error(`Failed to insert image: ${imageError?.message || 'Unknown error'}`);
      }

      unsplashImageId = newImage.id;
      console.log(`[fetch_unsplash_image] Saved new image record`);

      // Step 6: Trigger download event (required by Unsplash API guidelines)
      await triggerUnsplashDownload(unsplashImage.downloadLocation);
      console.log(`[fetch_unsplash_image] Triggered Unsplash download event`);
    }

    // Step 5: Link image to learning path and update job metadata with timing
    const completedAt2 = new Date().toISOString();
    const { data: successPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
      .eq('id', pathId)
      .single();

    const startedAt2 = successPath?.generation_jobs?.image?.started_at;
    const updatedMetadata2 = updateJobTiming(
      successPath?.generation_metadata,
      'fetch_unsplash_image',
      startedAt2,
      completedAt2
    );
    const totalTime2 = calculateTotalGenerationTime(updatedMetadata2);

    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        unsplash_image_id: unsplashImageId,
        generation_status: 'fetching_image', // Keep status (next job will update)
        generation_jobs: {
          ...successPath?.generation_jobs,
          image: {
            ...successPath?.generation_jobs?.image,
            completed_at: completedAt2,
            status: 'completed',
          },
        },
        generation_metadata: {
          ...updatedMetadata2,
          total_generation_time_ms: totalTime2,
        },
      })
      .eq('id', pathId);

    console.log(`[fetch_unsplash_image] Job completed in ${formatDuration(updatedMetadata2.job_timings.fetch_unsplash_image.duration_ms)}`);

    if (updateError) {
      throw new Error(`Failed to link image to path: ${updateError.message}`);
    }

    console.log(`[fetch_unsplash_image] Linked image to learning path`);

    // Step 7: Fetch skill_level and queue next job - research_resources
    const { data: pathInfo2 } = await supabase
      .from('learning_paths')
      .select('skill_level')
      .eq('id', pathId)
      .single();

    await addJob('research_resources', {
      pathId,
      topicName,
      skillLevel: pathInfo2?.skill_level || 'beginner',
    });

    console.log(`[fetch_unsplash_image] Completed! Queued research_resources`);

    return {
      success: true,
      pathId,
      imageFound: true,
      photographer: unsplashImage.photographer,
    };
  } catch (error) {
    console.error(`[fetch_unsplash_image] Error:`, error);

    // Image fetch failure is non-critical
    // Update status with job metadata but still proceed to next job
    try {
      const { data: errorPath } = await supabase
        .from('learning_paths')
        .select('generation_jobs')
        .eq('id', pathId)
        .single();

      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'failed_image',
          generation_error: error instanceof Error ? error.message : 'Unknown error during image fetch',
          generation_jobs: {
            ...errorPath?.generation_jobs,
            image: {
              ...errorPath?.generation_jobs?.image,
              failed_at: new Date().toISOString(),
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        })
        .eq('id', pathId);

      // Still queue the next job - path is usable without image
      await addJob('generate_sections_resources', { pathId });

      console.log(`[fetch_unsplash_image] Failed but queued next job anyway`);
    } catch (recoveryError) {
      console.error(`Failed to recover from image fetch error:`, recoveryError);
    }

    // Don't re-throw - image fetch failure shouldn't block the entire path generation
    // Graphile Worker will mark this job as failed, but we've already queued the next step
    console.warn(`[fetch_unsplash_image] Continuing despite error`);
  }
};
