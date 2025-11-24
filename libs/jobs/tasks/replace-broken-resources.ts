/**
 * Job Task: replace_broken_resources
 *
 * RESOURCE IMPROVEMENT STEP 1: Replace broken or inaccessible resource links
 *
 * This job is triggered when validate_resource_links finds > 3 broken/inaccessible resources.
 * It performs targeted web searches to find working replacements for each broken link.
 *
 * Flow:
 * 1. Update status to replacing_broken_resources
 * 2. Fetch all broken resources (link_status = 'broken' or 'requires_login')
 * 3. For each broken resource, search for 3-5 replacement candidates
 * 4. Select best replacement and update resource record
 * 5. Queue enrich_sections (if sections still under-resourced) OR validate_resource_links (to re-check)
 */

import type { Task } from 'graphile-worker';
import OpenAI from 'openai';
import { createServiceClient } from '@/libs/supabase/service';
import type { ReplaceBrokenResourcesPayload } from '../types';
import { addJob } from '../queue';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';
import { z } from 'zod';

/**
 * Schema for replacement candidate
 */
const ReplacementCandidateSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(['video', 'article', 'book', 'project', 'audio', 'graphic', 'course']),
  is_free: z.boolean().nullable(),
  description: z.string(),
  relevance_score: z.number().min(1).max(10), // How well it matches the original
});

const ReplacementResponseSchema = z.object({
  candidates: z.array(ReplacementCandidateSchema).min(1).max(5),
});

type ReplacementCandidate = z.infer<typeof ReplacementCandidateSchema>;

/**
 * Build prompt for finding replacement resource
 */
function buildReplacementPrompt(
  brokenResource: any,
  sectionTitle: string,
  pathTitle: string,
  pathSkillLevel: string
): string {
  return `═══════════════════════════════════════════════════════════════════════════════
⚠️  CRITICAL TASK - FIND WORKING REPLACEMENT FOR BROKEN RESOURCE  ⚠️
═══════════════════════════════════════════════════════════════════════════════

A resource link is BROKEN or INACCESSIBLE. Find a working replacement.

BROKEN RESOURCE:
- Title: "${brokenResource.title}"
- Description: "${brokenResource.description}"
- Original Type: ${brokenResource.type}
- Original URL: ${brokenResource.url} (BROKEN - do not reuse)

CONTEXT:
- Learning Path: "${pathTitle}" (${pathSkillLevel} level)
- Section: "${sectionTitle}"

YOUR MISSION:
Use web search to find 3-5 HIGH-QUALITY replacement resources that cover the same topic.

SEARCH STRATEGY:
1. Search for: "${brokenResource.title} ${pathSkillLevel} tutorial 2024"
2. Search for: "${sectionTitle} ${brokenResource.type} guide"
3. Search variations with different platforms (YouTube, GitHub, official docs, etc.)

REQUIREMENTS FOR REPLACEMENTS:
✓ Must cover THE SAME subject matter as the broken resource
✓ Must be accessible (working URL, not behind paywall if original was free)
✓ Prefer same resource type (${brokenResource.type}), but can substitute if higher quality
✓ Published or updated 2022 or later
✓ Official documentation or authoritative sources preferred
✓ Direct link to content (not landing page or search result)

FOR EACH CANDIDATE:
- **title**: Exact title from web search
- **url**: Full working URL (verify it loads)
- **type**: video | article | book | project | course | audio | graphic
- **is_free**: true | false | null
- **description**: 1-2 sentences on what it covers
- **relevance_score**: 1-10 (how well it matches original resource's topic)

CRITICAL OUTPUT REQUIREMENT:
Return ONLY valid JSON. NO explanatory text, NO markdown blocks, ONLY the JSON object.

{
  "candidates": [
    {
      "title": "...",
      "url": "https://...",
      "type": "article",
      "is_free": true,
      "description": "...",
      "relevance_score": 9
    }
  ]
}

Return 3-5 candidates, ordered by relevance_score (best first).

═══════════════════════════════════════════════════════════════════════════════`;
}

/**
 * Task handler for replacing broken resources
 */
export const replaceBrokenResourcesTask: Task = async (payload, helpers) => {
  const { pathId } = payload as ReplaceBrokenResourcesPayload;

  console.log(`[replace_broken_resources] Starting for path ${pathId}`);

  const supabase = createServiceClient();

  try {
    // Check if cancelled
    const { data: pathCheck } = await supabase
      .from('learning_paths')
      .select('generation_status')
      .eq('id', pathId)
      .single();

    if (pathCheck?.generation_status === 'cancelled') {
      console.log(`[replace_broken_resources] Path ${pathId} was cancelled, exiting`);
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
        generation_status: 'replacing_broken_resources',
        generation_jobs: {
          ...generationJobs,
          replacement: {
            job_id: helpers.job.id.toString(),
            started_at: new Date().toISOString(),
            attempts: helpers.job.attempts,
            status: 'pending',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[replace_broken_resources] Status updated to replacing_broken_resources`);

    // Step 2: Fetch path metadata
    const { data: path } = await supabase
      .from('learning_paths')
      .select('title, skill_level')
      .eq('id', pathId)
      .single();

    if (!path) {
      throw new Error('Path not found');
    }

    // Step 3: Fetch all broken/inaccessible resources
    const { data: sections } = await supabase
      .from('sections')
      .select(`
        id,
        title,
        resources (
          id,
          title,
          description,
          url,
          type,
          is_free,
          link_status,
          order
        )
      `)
      .eq('learning_path_id', pathId);

    if (!sections || sections.length === 0) {
      throw new Error('No sections found');
    }

    // Filter to only broken/inaccessible resources
    const brokenResources: Array<{ resource: any; sectionTitle: string }> = [];
    for (const section of sections) {
      if (!section.resources) continue;

      for (const resource of section.resources) {
        if (resource.link_status === 'broken' || resource.link_status === 'requires_login') {
          brokenResources.push({
            resource,
            sectionTitle: section.title,
          });
        }
      }
    }

    console.log(`[replace_broken_resources] Found ${brokenResources.length} broken resources to replace`);

    if (brokenResources.length === 0) {
      console.log(`[replace_broken_resources] No broken resources found - skipping`);

      // Mark job as completed
      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'completed',
          generation_jobs: {
            ...generationJobs,
            replacement: {
              ...generationJobs.replacement,
              completed_at: new Date().toISOString(),
              status: 'completed',
              note: 'No broken resources to replace',
            },
          },
        })
        .eq('id', pathId);

      return { success: true, pathId, replacedCount: 0 };
    }

    // Step 4: Initialize OpenRouter
    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        'X-Title': 'ViaProto',
      },
    });

    let replacedCount = 0;
    let failedCount = 0;

    // Step 5: Replace each broken resource
    for (const { resource, sectionTitle } of brokenResources) {
      try {
        console.log(`[replace_broken_resources] Searching replacement for: ${resource.title}`);

        const prompt = buildReplacementPrompt(
          resource,
          sectionTitle,
          path.title,
          path.skill_level
        );

        const completion = await openrouter.chat.completions.create({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3, // Factual, deterministic
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('No response from AI');
        }

        // Parse JSON with better error handling
        let parsed;
        try {
          parsed = JSON.parse(responseText);
        } catch (parseError) {
          // Try to extract JSON from text if AI added extra commentary
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            console.error(`[replace_broken_resources] Failed to parse response for ${resource.title}:`, responseText.substring(0, 200));
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
          }
        }

        const replacementData = ReplacementResponseSchema.parse(parsed);

        // Select best candidate (highest relevance_score)
        const bestCandidate = replacementData.candidates.sort(
          (a, b) => b.relevance_score - a.relevance_score
        )[0];

        console.log(`[replace_broken_resources] Found replacement: ${bestCandidate.title} (score: ${bestCandidate.relevance_score})`);

        // Update resource with new data
        const { error: updateError } = await supabase
          .from('resources')
          .update({
            title: bestCandidate.title,
            url: bestCandidate.url,
            type: bestCandidate.type,
            is_free: bestCandidate.is_free,
            description: bestCandidate.description,
            link_status: 'unchecked', // Will be re-validated
          })
          .eq('id', resource.id);

        if (updateError) {
          console.error(`[replace_broken_resources] Failed to update resource ${resource.id}:`, updateError);
          failedCount++;
        } else {
          replacedCount++;
        }
      } catch (error) {
        console.error(`[replace_broken_resources] Error replacing resource ${resource.id}:`, error);
        failedCount++;
      }
    }

    console.log(`[replace_broken_resources] Replaced ${replacedCount}/${brokenResources.length} resources (${failedCount} failed)`);

    // Step 6: Update job completion and timing
    const completedAt = new Date().toISOString();
    const { data: finalPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
      .eq('id', pathId)
      .single();

    const startedAt = finalPath?.generation_jobs?.replacement?.started_at;
    const updatedMetadata = updateJobTiming(
      finalPath?.generation_metadata,
      'replace_broken_resources',
      startedAt,
      completedAt
    );
    const totalTime = calculateTotalGenerationTime(updatedMetadata);

    await supabase
      .from('learning_paths')
      .update({
        generation_metadata: {
          ...updatedMetadata,
          total_generation_time_ms: totalTime,
          broken_resources_replaced: replacedCount,
        },
        generation_jobs: {
          ...finalPath?.generation_jobs,
          replacement: {
            ...finalPath?.generation_jobs?.replacement,
            completed_at: completedAt,
            status: 'completed',
            resources_replaced: replacedCount,
            replacement_failures: failedCount,
          },
        },
      })
      .eq('id', pathId);

    console.log(`[replace_broken_resources] Job completed in ${formatDuration(updatedMetadata.job_timings.replace_broken_resources.duration_ms)}`);

    // Step 7: Queue next job - check if enrichment needed or re-validate
    await addJob('enrich_sections', { pathId });
    console.log(`[replace_broken_resources] Queued enrich_sections to check for under-resourced sections`);

    return {
      success: true,
      pathId,
      replacedCount,
      failedCount,
    };
  } catch (error) {
    console.error(`[replace_broken_resources] Error:`, error);

    // Update path with failed status
    try {
      const { data: errorPath } = await supabase
        .from('learning_paths')
        .select('generation_jobs')
        .eq('id', pathId)
        .single();

      await supabase
        .from('learning_paths')
        .update({
          generation_status: 'failed_replacement',
          generation_error: error instanceof Error ? error.message : 'Unknown error during resource replacement',
          generation_jobs: {
            ...errorPath?.generation_jobs,
            replacement: {
              ...errorPath?.generation_jobs?.replacement,
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

    throw error;
  }
};
