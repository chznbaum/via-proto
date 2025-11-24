/**
 * Job Task: research_resources
 *
 * PROMPT CHAIN STEP 1: Pure web search to discover 30-50 candidate learning resources
 *
 * This is the first step in the 3-step prompt chaining approach:
 * Step 1: Research (this task) - Web search for resources
 * Step 2: Curate (generate_sections_resources) - Organize into sections
 * Step 3: Validate (validate_and_finalize) - Quality checks and persist
 *
 * Flow:
 * 1. Update status to researching_resources
 * 2. Fetch path metadata (title, description, skill_level) from database
 * 3. Call OpenRouter with research-only prompt
 * 4. Validate response (array of 30-50 resources)
 * 5. Store researched resources in generation_metadata.researched_resources
 * 6. Queue next job: generate_sections_resources (curation phase)
 */

import type { Task } from 'graphile-worker';
import OpenAI from 'openai';
import { createServiceClient } from '@/libs/supabase/service';
import type { ResearchResourcesPayload } from '../types';
import { addJob } from '../queue';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';
import { z } from 'zod';

/**
 * Schema for individual researched resource
 */
const ResearchedResourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(['video', 'article', 'book', 'project', 'audio', 'graphic', 'course']),
  is_free: z.boolean().nullable(),
  publish_date: z.string().nullable(), // e.g. "2024-03" or "2024"
  description: z.string(),
  estimated_minutes: z.number().nullable(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).nullable(),
});

/**
 * Schema for research response
 */
const ResearchResponseSchema = z.object({
  resources: z.array(ResearchedResourceSchema).min(20).max(60), // 20-60 resources
});

type ResearchedResource = z.infer<typeof ResearchedResourceSchema>;

/**
 * Build system prompt for pure resource research
 */
function buildResearchPrompt(topicName: string, skillLevel: string, goals?: string): string {
  return `═══════════════════════════════════════════════════════════════════════════════
⚠️  CRITICAL REQUIREMENT - YOU ARE A RESEARCH-ONLY AGENT  ⚠️
═══════════════════════════════════════════════════════════════════════════════

YOU MUST USE WEB SEARCH FOR EVERY SINGLE RESOURCE.

Your ONLY job is to SEARCH and DISCOVER learning resources. You will NOT organize them, structure them, or filter them - that happens later.

DO NOT use URLs from your training data or memory.
DO NOT suggest resources you "remember" - SEARCH for them NOW.
DO NOT hallucinate or guess URLs.

Your training data is outdated (pre-2025). Many URLs you know are dead or moved.
The ONLY acceptable URLs are ones you discover through active web search RIGHT NOW.

═══════════════════════════════════════════════════════════════════════════════

YOUR MISSION: Pure Resource Discovery

TOPIC: "${topicName}"
SKILL LEVEL: ${skillLevel}${goals ? `\nLEARNER GOALS: ${goals}` : ''}

SEARCH AND COMPILE 30-50 HIGH-QUALITY LEARNING RESOURCES.

DO NOT organize, filter, or structure yet - just compile a comprehensive list.
Another AI agent will organize these resources into sections later.

═══════════════════════════════════════════════════════════════════════════════

SEARCH STRATEGY:

Use multiple search queries to find diverse resources:

1. **By Type:**
   - "${topicName} tutorial video 2024"
   - "${topicName} article guide 2024"
   - "${topicName} book pdf free"
   - "${topicName} course online"
   - "${topicName} project github"

2. **By Platform:**
   - "${topicName} youtube tutorial"
   - "${topicName} udemy course"
   - "${topicName} coursera"
   - "${topicName} freeCodeCamp"
   - "${topicName} MDN documentation"
   - "${topicName} bookshop.org"

3. **By Difficulty:**
   - "${topicName} beginner tutorial 2024"
   - "${topicName} intermediate guide"
   - "${topicName} advanced techniques"
   - "${topicName} expert patterns"

4. **By Quality:**
   - "${topicName} best practices 2024"
   - "${topicName} comprehensive guide"
   - "${topicName} official documentation"
   - "learn ${topicName} project based"

5. **For Free Alternatives:**
   - "${topicName} free course"
   - "${topicName} open source tutorial"
   - "${topicName} free alternative"

═══════════════════════════════════════════════════════════════════════════════

RESOURCE REQUIREMENTS:

For EACH resource, document:
- **title**: Exact title of the resource (from web search)
- **url**: Full verified URL starting with https:// or http://
- **type**: video | article | book | project | course | audio | graphic
- **is_free**: true | false | null (null only if genuinely cannot determine)
- **publish_date**: When published/updated (e.g. "2024-03", "2023", or null if unknown)
- **description**: 1-2 sentences explaining what it covers
- **estimated_minutes**: Time to complete/consume (estimate, or null)
- **difficulty**: beginner | intermediate | advanced | null

QUALITY CRITERIA:
✓ Published or updated 2022 or newer (prefer 2024-2025)
✓ Direct URL to the resource (not search page, not landing page)
✓ Actually accessible (verify it loads)
✓ Authoritative source or highly engaged content
✓ Clear learning value

DIVERSITY REQUIREMENTS:
- Mix of videos, articles, books, projects, courses
- Range from beginner to advanced difficulty
- Both free and paid options (but prioritize free)
- Various platforms (YouTube, GitHub, official docs, courses, blogs)
- Theory AND practice resources
- Quick reads AND comprehensive deep-dives

GOAL:
Discover 30-50 resources that cover the full spectrum of learning for this topic.
Cast a WIDE net - include beginner, intermediate, and advanced resources.
Include both quick tutorials AND comprehensive courses.
Mix free AND paid (with more free options).

═══════════════════════════════════════════════════════════════════════════════

OUTPUT FORMAT:

Return ONLY valid JSON. NO markdown blocks, NO explanatory text, ONLY the JSON object:

{
  "resources": [
    {
      "title": "Complete React Tutorial for Beginners",
      "url": "https://www.youtube.com/watch?v=example",
      "type": "video",
      "is_free": true,
      "publish_date": "2024-03",
      "description": "Comprehensive 8-hour video course covering React fundamentals, hooks, and state management with hands-on projects.",
      "estimated_minutes": 480,
      "difficulty": "beginner"
    },
    // ... 29-49 more resources
  ]
}

═══════════════════════════════════════════════════════════════════════════════

SEARCH QUERIES TO USE RIGHT NOW:

1. "${topicName} tutorial 2024"
2. "${topicName} best courses free"
3. "${topicName} projects github"
4. "${topicName} comprehensive guide 2024"
5. "${topicName} beginner tutorial"
6. "${topicName} advanced techniques"
7. "${topicName} official documentation"
8. "learn ${topicName} free"
9. "${topicName} youtube tutorial"
10. "${topicName} hands-on project"

Execute these searches NOW and compile the discovered resources.

═══════════════════════════════════════════════════════════════════════════════

FINAL REMINDER:
Every URL must come from web search conducted RIGHT NOW.
Your training data is outdated - do not rely on memorized URLs.
Search, discover, document. No organization or filtering yet.

═══════════════════════════════════════════════════════════════════════════════`;
}

/**
 * Parse JSON response (handles markdown code blocks)
 */
function parseResearchResponse(responseText: string): any {
  // Strategy 1: Try direct parse
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 2: Strip markdown code blocks and try again
  const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = responseText.trim().match(codeBlockPattern);
  const cleanText = match ? match[1].trim() : responseText.trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 3: Try to find JSON object within text
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // All strategies failed
  }

  // Log error details
  console.error('Failed to parse research response. First 500 chars:', responseText.substring(0, 500));
  throw new Error(
    `Failed to parse research response as JSON. Response started with: ${responseText.substring(0, 100)}...`
  );
}

/**
 * Task handler for resource research
 */
export const researchResourcesTask: Task = async (payload, helpers) => {
  const { pathId, topicName, skillLevel } = payload as ResearchResourcesPayload;

  console.log(`[research_resources] Starting for path ${pathId}, topic: ${topicName}`);

  const supabase = createServiceClient();

  try {
    // Check if cancelled
    const { data: pathCheck } = await supabase
      .from('learning_paths')
      .select('generation_status')
      .eq('id', pathId)
      .single();

    if (pathCheck?.generation_status === 'cancelled') {
      console.log(`[research_resources] Path ${pathId} was cancelled, exiting`);
      return { cancelled: true, pathId };
    }

    // Step 1: Update status and track job start
    const { data: currentPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata, model_used')
      .eq('id', pathId)
      .single();

    const generationJobs = currentPath?.generation_jobs || {};
    const generationMetadata = currentPath?.generation_metadata || {};

    await supabase
      .from('learning_paths')
      .update({
        generation_status: 'researching_resources',
        generation_jobs: {
          ...generationJobs,
          research: {
            job_id: helpers.job.id.toString(),
            started_at: new Date().toISOString(),
            attempts: helpers.job.attempts,
            status: 'pending',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[research_resources] Status updated to researching_resources`);

    // Step 2: Initialize OpenRouter client
    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        'X-Title': 'ViaProto',
      },
    });

    // Step 3: Call OpenRouter with research prompt
    const prompt = buildResearchPrompt(topicName, skillLevel, generationMetadata.goals);

    console.log(`[research_resources] Calling OpenRouter with model: ${currentPath?.model_used}`);

    const completion = await openrouter.chat.completions.create({
      model: currentPath?.model_used || 'anthropic/claude-sonnet-4-5',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.3, // Low temperature for factual research
      response_format: { type: 'json_object' },
      // OpenRouter-specific: Enable web search for resource discovery
      // @ts-ignore - OpenRouter extension
      transforms: ['web-search'],
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI model');
    }

    console.log(`[research_resources] Received AI response`);

    // Step 4: Parse and validate response
    const parsedResponse = parseResearchResponse(responseText);
    const researchData = ResearchResponseSchema.parse(parsedResponse);

    console.log(`[research_resources] Validated ${researchData.resources.length} researched resources`);

    // Log some statistics
    const freeCount = researchData.resources.filter(r => r.is_free === true).length;
    const typeBreakdown = researchData.resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`[research_resources] Statistics:`, {
      total: researchData.resources.length,
      free: freeCount,
      paid: researchData.resources.filter(r => r.is_free === false).length,
      unknown: researchData.resources.filter(r => r.is_free === null).length,
      types: typeBreakdown,
    });

    // Step 5: Store researched resources in generation_metadata with timing
    const completedAt = new Date().toISOString();
    const startedAt = generationJobs?.research?.started_at;
    const updatedMetadata = updateJobTiming(
      generationMetadata,
      'research_resources',
      startedAt,
      completedAt
    );
    const totalTime = calculateTotalGenerationTime(updatedMetadata);

    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        generation_metadata: {
          ...updatedMetadata,
          researched_resources: researchData.resources,
          research_stats: {
            total_resources: researchData.resources.length,
            free_count: freeCount,
            type_breakdown: typeBreakdown,
            researched_at: completedAt,
          },
          total_generation_time_ms: totalTime,
        },
        generation_jobs: {
          ...generationJobs,
          research: {
            ...generationJobs.research,
            completed_at: completedAt,
            status: 'completed',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[research_resources] Job completed in ${formatDuration(updatedMetadata.job_timings.research_resources.duration_ms)}`);

    if (updateError) {
      throw new Error(`Failed to store researched resources: ${updateError.message}`);
    }

    console.log(`[research_resources] Stored researched resources in database`);

    // Step 6: Queue next job - generate_sections_resources (curation phase)
    await addJob('generate_sections_resources', { pathId });

    console.log(`[research_resources] Completed! Queued generate_sections_resources`);

    return {
      success: true,
      pathId,
      resourceCount: researchData.resources.length,
      freeCount,
      typeBreakdown,
    };
  } catch (error) {
    console.error(`[research_resources] Error:`, error);

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
          generation_status: 'failed_research',
          generation_error: error instanceof Error ? error.message : 'Unknown error during resource research',
          generation_jobs: {
            ...errorPath?.generation_jobs,
            research: {
              ...errorPath?.generation_jobs?.research,
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
