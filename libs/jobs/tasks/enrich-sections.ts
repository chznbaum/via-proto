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

import type { Task } from 'graphile-worker';
import OpenAI from 'openai';
import { createServiceClient } from '@/libs/supabase/service';
import type { EnrichSectionsPayload } from '../types';
import { addJob } from '../queue';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';
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
  existingResources: Array<{ title: string; type: string; is_free: boolean | null }>,
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
  const underrepresentedTypes = allTypes.filter(t => (typeCount[t] || 0) === 1);

  return `═══════════════════════════════════════════════════════════════════════════════
🔍 CRITICAL TASK - ENRICH UNDER-RESOURCED SECTION  🔍
═══════════════════════════════════════════════════════════════════════════════

A section needs MORE HIGH-QUALITY resources to meet our quality standards.

LEARNING PATH: "${pathTitle}" (${skillLevel} level)
SECTION: "${section.title}"
DESCRIPTION: "${section.description}"

CURRENT RESOURCES (${existingResources.length} total):
${existingResources.map((r, i) => `${i + 1}. ${r.title} (${r.type}, ${r.is_free === true ? 'FREE' : r.is_free === false ? 'PAID' : 'unknown'})`).join('\n')}

RESOURCE GAP ANALYSIS:
- Types present: ${Object.keys(typeCount).join(', ')}
- Types missing: ${missingTypes.length > 0 ? missingTypes.join(', ') : 'none'}
- Types underrepresented: ${underrepresentedTypes.length > 0 ? underrepresentedTypes.join(', ') : 'none'}
- Free/Paid: ${freeCount} free, ${paidCount} paid

YOUR MISSION:
Use web search to find 2-3 HIGH-QUALITY complementary resources that fill gaps in this section.

PRIORITIZATION RULES (in order):
1. **Type Diversity**: Prefer missing types (${missingTypes.slice(0, 3).join(', ') || 'N/A'})
2. **Hands-on Learning**: Add projects/interactive content if missing
3. **Difficulty Balance**: Ensure coverage across beginner/intermediate/advanced
4. **Free Resources**: Prioritize free if < 60% are currently free
5. **Authoritative Sources**: Official docs, recognized platforms, expert authors

SEARCH STRATEGY:
1. Search: "${section.title} ${missingTypes[0] || 'tutorial'} ${skillLevel} 2024"
2. Search: "${pathTitle} ${section.title} hands-on practice"
3. Search: "best ${section.title} resources official documentation"

REQUIREMENTS FOR NEW RESOURCES:
✓ Must complement (not duplicate) existing resources
✓ Must be directly relevant to section topic: "${section.title}"
✓ Published or updated 2022 or later
✓ Accessible (working URL, prefer free over paid)
✓ Different resource types preferred (fill gaps)
✓ Direct link to content (not landing page)

FOR EACH RESOURCE:
- **title**: Exact title from web search
- **url**: Full working URL (verify it loads)
- **type**: video | article | book | project | course | audio | graphic
- **is_free**: true | false | null
- **description**: 1-2 sentences on what it covers
- **estimated_minutes**: Number or null
- **difficulty**: beginner | intermediate | advanced | null
- **gap_filled**: ONE sentence explaining what gap this fills (e.g., "Adds hands-on project practice", "Provides advanced-level coverage", "Free alternative to paid resources")

Return 2-3 resources that COMPLEMENT the existing ones.

═══════════════════════════════════════════════════════════════════════════════`;
}

/**
 * Task handler for enriching sections
 */
export const enrichSectionsTask: Task = async (payload, helpers) => {
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

    // Step 2: Fetch path metadata
    const { data: path } = await supabase
      .from('learning_paths')
      .select('title, skill_level')
      .eq('id', pathId)
      .single();

    if (!path) {
      throw new Error('Path not found');
    }

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

        const parsed = JSON.parse(responseText);
        const enrichmentData = EnrichmentResponseSchema.parse(parsed);

        console.log(`[enrich_sections] Found ${enrichmentData.resources.length} complementary resources`);

        // Insert new resources
        let currentOrder = nextOrder;
        for (const resource of enrichmentData.resources) {
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
