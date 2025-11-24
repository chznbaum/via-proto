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
  pathSkillLevel: string,
  allExistingUrls: string[]
): string {
  return `═══════════════════════════════════════════════════════════════════════════════
🔧 RESOURCE REPLACEMENT MISSION 🔧
═══════════════════════════════════════════════════════════════════════════════

A learning resource link is broken or inaccessible and needs a working replacement.

BROKEN RESOURCE DETAILS:
- Title: "${brokenResource.title}"
- Description: "${brokenResource.description}"
- Type: ${brokenResource.type}
- Original URL: ${brokenResource.url} (BROKEN - do not reuse)
- Free Status: ${brokenResource.is_free === true ? 'FREE' : brokenResource.is_free === false ? 'PAID' : 'unknown'}

CONTEXT:
- Learning Path: "${pathTitle}" (${pathSkillLevel} level)
- Section: "${sectionTitle}"

YOUR MISSION:

Find 3-5 high-quality replacement resources that cover the same subject matter as the broken resource.

REPLACEMENT CRITERIA:

1. **Content Match**: Must teach the same topic/concepts as the broken resource
2. **Quality**: Prefer authoritative sources, official docs, or highly-rated content
3. **Accessibility**: Must be currently accessible (verify URL works)
4. **Free Status**: Match original if possible (if original was free, prioritize free)
5. **Currency**: Published or updated 2022 or later preferred
6. **Type Preference**: Same type as original (${brokenResource.type}) preferred but can substitute if higher quality
7. **Direct Link**: Must link directly to content, not landing/marketing page

IMPORTANT - AVOID DUPLICATES:
Do NOT recommend any of these URLs already in the learning path:
${allExistingUrls.slice(0, 20).join('\n')}
${allExistingUrls.length > 20 ? `... and ${allExistingUrls.length - 20} more URLs` : ''}

RESEARCH APPROACH:

Find current, high-quality resources that match the broken resource's purpose:
- Search for the specific topic/technology covered
- Look for official documentation or canonical sources
- Identify popular tutorials from reputable creators
- Find highly-rated courses or well-maintained projects
- Verify URLs are accessible and content is current

═══════════════════════════════════════════════════════════════════════════════

OUTPUT FORMAT - CRITICAL:

Return ONLY valid JSON matching this EXACT schema. NO markdown, NO explanatory text, ONLY the JSON:

{
  "candidates": [
    {
      "title": "Official React Hooks Documentation",
      "url": "https://react.dev/reference/react",
      "type": "article",
      "is_free": true,
      "description": "Comprehensive official documentation for React Hooks with interactive examples and best practices directly from the React core team.",
      "relevance_score": 9
    },
    {
      "title": "Complete React Hooks Tutorial by Web Dev Simplified",
      "url": "https://www.youtube.com/watch?v=O6P86uwfdR0",
      "type": "video",
      "is_free": true,
      "description": "Clear 2-hour video tutorial covering all React Hooks with practical examples and common use cases. 500k+ views, highly rated.",
      "relevance_score": 8
    },
    {
      "title": "React Hooks in Action (Book)",
      "url": "https://www.manning.com/books/react-hooks-in-action",
      "type": "book",
      "is_free": false,
      "description": "In-depth book exploring React Hooks patterns, best practices, and real-world applications with production-ready examples.",
      "relevance_score": 7
    }
    // 2-4 more candidates
  ]
}

REQUIRED FIELDS:
- title: Exact title of the resource (string)
- url: Full working URL starting with https:// or http:// (string)
- type: "video" | "article" | "book" | "project" | "course" | "audio" | "graphic"
- is_free: true | false | null
- description: 1-2 sentences on what it covers and why it's valuable (string)
- relevance_score: 1-10 score for how well it matches the original resource (number)

Return 3-5 candidates, ordered by relevance_score (highest first).

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

    // Step 4.5: Fetch ALL existing URLs for deduplication
    const { data: allSections } = await supabase
      .from('sections')
      .select(`
        resources (url)
      `)
      .eq('learning_path_id', pathId);

    const allExistingUrls = allSections
      ?.flatMap(s => s.resources?.map((r: any) => r.url))
      .filter(Boolean) || [];

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
          path.skill_level,
          allExistingUrls // Pass all URLs for dedup
        );

        const completion = await openrouter.chat.completions.create({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7, // Higher temperature for more flexibility in finding replacements
          response_format: { type: 'json_object' },
          // @ts-ignore - OpenRouter extension
          transforms: ['web-search'],
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
          throw new Error('No response from AI');
        }

        // Parse JSON with multiple fallback strategies
        let parsed;
        try {
          parsed = JSON.parse(responseText);
        } catch (parseError) {
          // Strategy 2: Try to strip markdown code blocks
          const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
          const match = responseText.trim().match(codeBlockPattern);
          const cleanText = match ? match[1].trim() : responseText.trim();

          try {
            parsed = JSON.parse(cleanText);
          } catch (e2) {
            // Strategy 3: Extract JSON object from text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsed = JSON.parse(jsonMatch[0]);
              } catch (e3) {
                console.error(`[replace_broken_resources] Failed to parse response for ${resource.title}. First 300 chars:`, responseText.substring(0, 300));
                throw new Error(`Invalid JSON response after all parsing strategies`);
              }
            } else {
              console.error(`[replace_broken_resources] No JSON found in response for ${resource.title}:`, responseText.substring(0, 200));
              throw new Error(`No JSON object found in response`);
            }
          }
        }

        const replacementData = ReplacementResponseSchema.parse(parsed);

        // Filter out any candidates that duplicate existing URLs
        const uniqueCandidates = replacementData.candidates.filter(
          (candidate) => !allExistingUrls.includes(candidate.url)
        );

        if (uniqueCandidates.length === 0) {
          console.warn(`[replace_broken_resources] All candidates were duplicates for ${resource.title} - skipping`);
          failedCount++;
          continue;
        }

        // Select best unique candidate
        const bestCandidate = uniqueCandidates.sort(
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
