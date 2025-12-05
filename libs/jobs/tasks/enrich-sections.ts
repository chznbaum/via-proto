/**
 * Job Task: enrich_sections
 *
 * RESOURCE IMPROVEMENT STEP 2: Add resources to under-resourced sections
 *
 * This job is triggered when sections have < 5 active resources (after link validation).
 * It performs targeted web searches to find complementary resources that fill gaps in
 * resource types, difficulty levels, or free/paid balance.
 *
 * Flow:
 * 1. Update status to enriching_sections
 * 2. Fetch all sections and their active resources
 * 3. Identify sections with < 5 active resources
 * 4. For each under-resourced section, analyze gaps and search for 2-3 complementary resources
 * 5. Insert new resources with proper ordering
 * 6. Queue validate_resource_links to fetch OpenGraph data for new resources
 */

import OpenAI from 'openai';
import { createServiceClient } from '@/libs/supabase/service';
import type { EnrichSectionsPayload, TaskWithResult } from '../types';
import { addJob } from '../queue';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';
import { getDefaultModelForTier } from '@/libs/models';
import { z } from 'zod';

/**
 * Schema for enrichment resource
 */
const EnrichmentResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(['video', 'article', 'book', 'project', 'audio', 'graphic', 'course']),
  is_free: z.boolean().nullable(),
  description: z.string(),
  estimated_minutes: z.number().nullable(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).nullable(),
  gap_filled: z.string(), // Description of what gap this resource fills
});

const EnrichmentResponseSchema = z.object({
  resources: z.array(EnrichmentResourceSchema).min(2).max(3),
});

type EnrichmentResource = z.infer<typeof EnrichmentResourceSchema>;

/**
 * Build prompt for enriching a section with complementary resources
 */
function buildEnrichmentPrompt(
  section: { title: string; description: string; order: number },
  existingResources: Array<{ title: string; type: string; is_free: boolean | null; url: string }>,
  allExistingUrls: string[],
  pathTitle: string,
  skillLevel: string
): string {
  // Analyze existing resource composition
  const typeCount: Record<string, number> = {};
  let freeCount = 0;
  let paidCount = 0;

  existingResources.forEach((r) => {
    typeCount[r.type] = (typeCount[r.type] || 0) + 1;
    if (r.is_free === true) freeCount++;
    if (r.is_free === false) paidCount++;
  });

  const allTypes = ['video', 'article', 'book', 'project', 'course', 'audio', 'graphic'];
  const missingTypes = allTypes.filter(t => !typeCount[t]);
  const underrepresentedTypes = allTypes.filter(t => (typeCount[t] || 0) <= 1);

  return `═══════════════════════════════════════════════════════════════════════════════
✨ SECTION ENRICHMENT MISSION ✨
═══════════════════════════════════════════════════════════════════════════════

A learning path section needs additional high-quality resources to meet quality standards.

LEARNING PATH: "${pathTitle}" (${skillLevel} level)

SECTION TO ENRICH:
- Title: "${section.title}"
- Description: "${section.description}"
- Current Resource Count: ${existingResources.length} (needs to reach 5-7 for optimal learning)

CURRENT RESOURCES IN THIS SECTION:
${existingResources.map((r, i) => `${i + 1}. "${r.title}" (${r.type}, ${r.is_free === true ? 'FREE' : r.is_free === false ? 'PAID' : 'unknown'})`).join('\n')}

GAP ANALYSIS:
- Resource types present: ${Object.keys(typeCount).join(', ') || 'none'}
- Resource types missing: ${missingTypes.length > 0 ? missingTypes.join(', ') : 'all types covered'}
- Underrepresented types: ${underrepresentedTypes.length > 0 ? underrepresentedTypes.join(', ') : 'good balance'}
- Free vs Paid: ${freeCount} free, ${paidCount} paid
- Free percentage: ${existingResources.length > 0 ? Math.round((freeCount / existingResources.length) * 100) : 0}%

YOUR MISSION:

Find 2-3 high-quality, complementary resources that fill gaps in this section's learning materials.

PRIORITIZATION (in order of importance):

1. **Type Diversity**: Prioritize missing types${missingTypes.length > 0 ? ` (especially: ${missingTypes.slice(0, 3).join(', ')})` : ''}
2. **Hands-On Learning**: Add project/interactive resources if missing
3. **Difficulty Range**: Ensure beginner, intermediate, and advanced coverage
4. **Free Resources**: Prioritize free if current free % is below 60%
5. **Authoritative Sources**: Official docs, recognized platforms, expert creators

RESOURCE DISCOVERY:

Identify current, high-quality resources that complement the existing materials:
- Find resources that fill type gaps
- Look for hands-on projects or interactive content
- Search for official documentation or canonical references
- Identify highly-rated tutorials from reputable sources
- Find recent content (2022+) from active creators

CRITICAL - AVOID DUPLICATES:
Do NOT recommend ANY of these URLs already in the learning path:
${allExistingUrls.slice(0, 30).join('\n')}
${allExistingUrls.length > 30 ? `... and ${allExistingUrls.length - 30} more existing URLs` : ''}

REQUIREMENTS FOR NEW RESOURCES:

✓ Must be directly relevant to: "${section.title}"
✓ Must complement (not duplicate) existing resources
✓ Must fill identified gaps (type, difficulty, free/paid balance)
✓ Published or updated 2022 or later preferred
✓ Must be currently accessible (working URL)
✓ Prefer free resources unless paid offers significant added value
✓ Must be different from all existing resources (different content AND URL)

═══════════════════════════════════════════════════════════════════════════════

OUTPUT FORMAT - CRITICAL:

Return ONLY valid JSON matching this EXACT schema. NO markdown code blocks, NO explanatory text before or after, ONLY the JSON object:

{
  "resources": [
    {
      "title": "Build a Complete Project: React Task Manager",
      "url": "https://github.com/example/react-task-manager-tutorial",
      "type": "project",
      "is_free": true,
      "description": "Step-by-step hands-on project building a full-featured task management app with React hooks, context, and local storage. Includes complete source code and tutorial.",
      "estimated_minutes": 180,
      "difficulty": "intermediate",
      "gap_filled": "Adds hands-on project practice, fills missing 'project' type"
    },
    {
      "title": "React Performance Optimization - Official Guide",
      "url": "https://react.dev/learn/render-and-commit",
      "type": "article",
      "is_free": true,
      "description": "Official React documentation covering rendering behavior, performance optimization techniques, and best practices for avoiding unnecessary re-renders.",
      "estimated_minutes": 45,
      "difficulty": "advanced",
      "gap_filled": "Provides advanced-level coverage, free alternative to paid courses"
    }
    // 1-2 more resources following this exact structure
  ]
}

REQUIRED FIELDS FOR EACH RESOURCE:
- title: Exact title of the resource (string)
- url: Full working URL starting with https:// or http:// (string)
- type: One of: "video" | "article" | "book" | "project" | "course" | "audio" | "graphic"
- is_free: true | false | null (boolean | null)
- description: 1-2 sentences explaining value and specific content covered (string)
- estimated_minutes: Realistic time to complete/consume (number | null)
- difficulty: "beginner" | "intermediate" | "advanced" | null
- gap_filled: ONE sentence explaining what gap this fills (string)

Return exactly 2-3 resources that complement the existing ones and fill identified gaps.

═══════════════════════════════════════════════════════════════════════════════`;
}

/**
 * Task handler for enriching sections
 */
export const enrichSectionsTask: TaskWithResult = async (payload, helpers) => {
  const { pathId } = payload as EnrichSectionsPayload;

  console.log(`[enrich_sections] Starting for path ${pathId}`);

  const supabase = createServiceClient();

  try {
    // Check if cancelled
    const { data: pathCheck } = await supabase
      .from('learning_paths')
      .select('generation_status')
      .eq('id', pathId)
      .single();

    if (pathCheck?.generation_status === 'cancelled') {
      console.log(`[enrich_sections] Path ${pathId} was cancelled, exiting`);
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
        generation_status: 'enriching_sections',
        generation_jobs: {
          ...generationJobs,
          enrichment: {
            job_id: helpers.job.id.toString(),
            started_at: new Date().toISOString(),
            attempts: helpers.job.attempts,
            status: 'pending',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[enrich_sections] Status updated to enriching_sections`);

    // Step 2: Fetch path metadata including model and account tier
    const { data: path } = await supabase
      .from('learning_paths')
      .select('title, skill_level, model_used, account:accounts(subscription_tier)')
      .eq('id', pathId)
      .single();

    if (!path) {
      throw new Error('Path not found');
    }

    // Determine model to use: user's selected model or tier default
    const accountTier = (path.account as any)?.subscription_tier || 'free';
    const modelToUse = path.model_used || getDefaultModelForTier(accountTier);

    // Step 3: Fetch all sections with their resources (including sections with 0 resources)
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select(`
        id,
        title,
        description,
        order,
        resources (
          id,
          title,
          url,
          type,
          is_free,
          link_status,
          order
        )
      `)
      .eq('learning_path_id', pathId)
      .order('order', { ascending: true });

    if (sectionsError) {
      console.error(`[enrich_sections] Error fetching sections:`, sectionsError);
      throw new Error(`Failed to fetch sections: ${sectionsError.message}`);
    }

    if (!sections || sections.length === 0) {
      console.log(`[enrich_sections] No sections found for path ${pathId} - this might indicate the sections were deleted or not created yet`);
      throw new Error('No sections found');
    }

    console.log(`[enrich_sections] Found ${sections.length} sections`);

    // Step 4: Identify sections that need enrichment (< 5 active resources)
    interface SectionToEnrich {
      section: any;
      activeResources: any[];
      nextOrder: number;
    }

    const sectionsToEnrich: SectionToEnrich[] = [];

    for (const section of sections) {
      if (!section.resources) continue;

      // Count active resources (exclude broken and requires_login)
      const activeResources = section.resources.filter(
        (r: any) => r.link_status !== 'broken' && r.link_status !== 'requires_login'
      );

      if (activeResources.length < 5) {
        // Calculate next order number (max order + 1)
        const maxOrder = Math.max(0, ...section.resources.map((r: any) => r.order || 0));
        sectionsToEnrich.push({
          section,
          activeResources,
          nextOrder: maxOrder + 1,
        });
      }
    }

    console.log(`[enrich_sections] Found ${sectionsToEnrich.length} sections needing enrichment`);

    // Early exit if no work needed - skip LLM call
    if (sectionsToEnrich.length === 0) {
      console.log(`[enrich_sections] No sections need enrichment - skipping LLM call`);

      const completedAt = new Date().toISOString();
      const { data: finalPath } = await supabase
        .from('learning_paths')
        .select('generation_jobs, generation_metadata')
        .eq('id', pathId)
        .single();

      const startedAt = finalPath?.generation_jobs?.enrichment?.started_at;
      const updatedMetadata = updateJobTiming(
        finalPath?.generation_metadata,
        'enrich_sections',
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
          },
          generation_jobs: {
            ...finalPath?.generation_jobs,
            enrichment: {
              ...finalPath?.generation_jobs?.enrichment,
              completed_at: completedAt,
              status: 'completed',
              note: 'No sections needed enrichment',
            },
          },
        })
        .eq('id', pathId);

      console.log(`[enrich_sections] Queuing validate_resource_links for OpenGraph fetch`);
      await addJob('validate_resource_links', { pathId });

      return { success: true, pathId, sectionsEnriched: 0 };
    }

    // Step 5: Initialize OpenRouter
    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        'X-Title': 'ViaProto',
      },
    });

    // Step 5.5: Fetch ALL existing URLs for deduplication
    const allExistingUrls = sections
      .flatMap(s => s.resources?.map((r: any) => r.url) || [])
      .filter(Boolean);

    console.log(`[enrich_sections] Total existing URLs in path: ${allExistingUrls.length}`);

    let enrichedCount = 0;
    let failedCount = 0;
    const enrichedSectionIds: string[] = [];

    // Step 6: Enrich each under-resourced section
    for (const { section, activeResources, nextOrder } of sectionsToEnrich) {
      try {
        console.log(`[enrich_sections] Enriching section: ${section.title} (${activeResources.length} active resources)`);

        const prompt = buildEnrichmentPrompt(
          section,
          activeResources,
          allExistingUrls,
          path.title,
          path.skill_level
        );

        console.log(`[enrich_sections] Using model: ${modelToUse}`);

        const completion = await openrouter.chat.completions.create({
          model: modelToUse,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7, // Higher temperature for more flexibility in finding complementary resources
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
          // Strategy 2: Strip markdown code blocks
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
                console.error(`[enrich_sections] Failed to parse response for section ${section.id}. First 300 chars:`, responseText.substring(0, 300));
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
              }
            } else {
              console.error(`[enrich_sections] No JSON found in response for section ${section.id}:`, responseText.substring(0, 200));
              throw new Error(`Response was not JSON: ${responseText.substring(0, 100)}...`);
            }
          }
        }

        const enrichmentData = EnrichmentResponseSchema.parse(parsed);

        console.log(`[enrich_sections] Found ${enrichmentData.resources.length} complementary resources`);

        // Filter out any resources that duplicate existing URLs
        const uniqueResources = enrichmentData.resources.filter(
          (resource) => !allExistingUrls.includes(resource.url)
        );

        if (uniqueResources.length === 0) {
          console.warn(`[enrich_sections] All suggested resources were duplicates for section ${section.id} - skipping enrichment`);
          failedCount++;
          continue;
        }

        if (uniqueResources.length < enrichmentData.resources.length) {
          console.log(`[enrich_sections] Filtered out ${enrichmentData.resources.length - uniqueResources.length} duplicate URLs`);
        }

        // Insert new unique resources
        let currentOrder = nextOrder;
        for (const resource of uniqueResources) {
          const { error: insertError } = await supabase
            .from('resources')
            .insert({
              section_id: section.id,
              title: resource.title,
              url: resource.url,
              type: resource.type,
              is_free: resource.is_free,
              description: resource.description,
              estimated_minutes: resource.estimated_minutes,
              link_status: 'unchecked', // Will be validated by validate_resource_links
              order: currentOrder,
            });

          if (insertError) {
            console.error(`[enrich_sections] Failed to insert resource:`, insertError);
            failedCount++;
          } else {
            currentOrder++;
            // Add to global list to prevent duplicates within same enrichment run
            allExistingUrls.push(resource.url);
          }
        }

        enrichedCount++;
        enrichedSectionIds.push(section.id);
      } catch (error) {
        console.error(`[enrich_sections] Error enriching section ${section.id}:`, error);
        failedCount++;
      }
    }

    console.log(`[enrich_sections] Enriched ${enrichedCount}/${sectionsToEnrich.length} sections`);

    // Step 7: Update job completion and timing
    const completedAt = new Date().toISOString();
    const { data: finalPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
      .eq('id', pathId)
      .single();

    const startedAt = finalPath?.generation_jobs?.enrichment?.started_at;
    const updatedMetadata = updateJobTiming(
      finalPath?.generation_metadata,
      'enrich_sections',
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
          sections_enriched: enrichedSectionIds,
        },
        generation_jobs: {
          ...finalPath?.generation_jobs,
          enrichment: {
            ...finalPath?.generation_jobs?.enrichment,
            completed_at: completedAt,
            status: 'completed',
            sections_enriched: enrichedCount,
            enrichment_failures: failedCount,
          },
        },
      })
      .eq('id', pathId);

    console.log(`[enrich_sections] Job completed in ${formatDuration(updatedMetadata.job_timings.enrich_sections.duration_ms)}`);

    // Step 8: Queue validate_resource_links to fetch OpenGraph for new resources
    await addJob('validate_resource_links', { pathId });
    console.log(`[enrich_sections] Queued validate_resource_links for OpenGraph fetch`);

    return {
      success: true,
      pathId,
      sectionsEnriched: enrichedCount,
      failedCount,
    };
  } catch (error) {
    console.error(`[enrich_sections] Error:`, error);

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
          generation_status: 'failed_enrichment',
          generation_error: error instanceof Error ? error.message : 'Unknown error during section enrichment',
          generation_jobs: {
            ...errorPath?.generation_jobs,
            enrichment: {
              ...errorPath?.generation_jobs?.enrichment,
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
