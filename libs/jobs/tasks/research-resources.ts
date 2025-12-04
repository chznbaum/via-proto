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
🔍 LEARNING RESOURCE RESEARCH MISSION 🔍
═══════════════════════════════════════════════════════════════════════════════

You are an expert educational researcher tasked with discovering 30-50 high-quality learning resources for a comprehensive learning path.

TOPIC: "${topicName}"
SKILL LEVEL: ${skillLevel}${goals ? `\nLEARNER GOALS: ${goals}` : ''}

RESEARCH APPROACH:

Your goal is to identify the BEST learning resources that currently exist for this topic. Use your knowledge of high-quality educational resources AND verify that they are still accessible and current through web search.

CRITICAL REQUIREMENTS:

1. **Resource Discovery Strategy**:
  - Start with authoritative sources: official documentation, recognized platforms, expert authors
  - Include diverse formats: videos, articles, books, projects, courses, tutorials
  - Balance free and paid options (prioritize free when quality is equivalent)
  - Find resources across difficulty levels: beginner, intermediate, advanced
  - Prioritize hands-on, project-based learning materials

2. **Quality Indicators** (prioritize resources with these traits):
  - Official documentation or canonical sources (React docs, MDN, etc.)
  - Reputable platforms: YouTube channels with 100k+ subs, Udemy/Coursera top-rated
  - Popular GitHub projects: 1k+ stars, active maintenance
  - Recognized authors: industry experts, bestselling authors
  - Recent content: published or updated 2022 or later (verify publication dates)
  - High engagement: good reviews, active communities, proven track records

3. **Verification Requirements**:
  - Every URL must be verified as currently accessible
  - Check that links lead directly to content (not landing pages or paywalls)
  - Confirm publication/update dates are recent
  - For paid resources, identify free alternatives covering similar content
  - Ensure diverse resource types and platforms

4. **Coverage Requirements** (aim for this distribution):
  - Videos: 8-12 resources (YouTube tutorials, course videos)
  - Articles: 8-12 resources (blog posts, documentation, guides)
  - Projects: 5-8 resources (GitHub repos, coding challenges)
  - Courses: 4-6 resources (Udemy, Coursera, freeCodeCamp)
  - Books: 3-5 resources (O'Reilly, Manning, free PDFs)
  - Other: 2-4 resources (podcasts, infographics, cheat sheets)

═══════════════════════════════════════════════════════════════════════════════

RESEARCH TASKS:

For this topic, identify current, high-quality learning resources in these categories:

1. **Official Documentation & Canonical Resources**
  - Find the official docs, getting started guides, and authoritative references
  - Verify these are maintained and current

2. **Beginner-Friendly Video Tutorials**
  - Find comprehensive video courses and tutorials for beginners
  - Include both free (YouTube) and paid (Udemy, Coursera) options
  - Look for recent content (2023-2025)

3. **In-Depth Articles & Guides**
  - Identify detailed blog posts, technical articles, and written tutorials
  - Find content from recognized platforms and expert developers
  - Include both quick reads and comprehensive guides

4. **Hands-On Projects & Practice**
  - Find GitHub repositories with learning projects
  - Identify coding challenges and interactive exercises
  - Look for project-based courses and workshops

5. **Comprehensive Courses**
  - Identify top-rated paid courses (with free alternatives)
  - Find free bootcamp-style resources (freeCodeCamp, The Odin Project)
  - Include both structured curricula and self-paced options

6. **Books & Long-Form Content**
  - Find authoritative books (both paid and free/open-source)
  - Identify comprehensive written guides
  - Look for recently published or updated editions

7. **Supplementary Resources**
  - Find relevant podcasts, cheat sheets, and reference materials
  - Identify community resources and forums
  - Include visual learning aids (infographics, diagrams)

═══════════════════════════════════════════════════════════════════════════════

OUTPUT FORMAT - CRITICAL:

Return ONLY valid JSON matching this EXACT schema. NO markdown code blocks, NO explanatory text, ONLY the JSON object:

{
  "resources": [
    {
      "title": "Official React Documentation",
      "url": "https://react.dev/learn",
      "type": "article",
      "is_free": true,
      "publish_date": "2024",
      "description": "The authoritative, comprehensive guide to React from the core team. Covers fundamentals, hooks, and advanced patterns with interactive examples.",
      "estimated_minutes": 240,
      "difficulty": "beginner"
    },
    {
      "title": "React - The Complete Guide 2024 (incl. Next.js, Redux)",
      "url": "https://www.udemy.com/course/react-the-complete-guide/",
      "type": "course",
      "is_free": false,
      "publish_date": "2024-01",
      "description": "Comprehensive 50-hour paid course covering React, hooks, Redux, and Next.js with hands-on projects and real-world applications.",
      "estimated_minutes": 3000,
      "difficulty": "beginner"
    },
    {
      "title": "freeCodeCamp React Course for Beginners",
      "url": "https://www.youtube.com/watch?v=bMknfKXIFA8",
      "type": "video",
      "is_free": true,
      "publish_date": "2023",
      "description": "Free 12-hour comprehensive React tutorial covering fundamentals, hooks, and project building. Excellent free alternative to paid courses.",
      "estimated_minutes": 720,
      "difficulty": "beginner"
    }
    // ... 27-47 more resources following this exact structure
  ]
}

REQUIRED FIELDS FOR EACH RESOURCE:
- title: Exact title of the resource (string)
- url: Full verified URL starting with https:// or http:// (string)
- type: One of: "video" | "article" | "book" | "project" | "course" | "audio" | "graphic"
- is_free: true | false | null (null only if genuinely cannot determine)
- publish_date: "YYYY-MM" or "YYYY" or null (string | null)
- description: 1-2 compelling sentences explaining value and content (string)
- estimated_minutes: Realistic time to complete/consume, or null (number | null)
- difficulty: "beginner" | "intermediate" | "advanced" | null

═══════════════════════════════════════════════════════════════════════════════

QUALITY CHECKLIST - Before returning, verify:

□ 30-50 resources total
□ All URLs verified as currently accessible
□ Mix of resource types (not all videos or all articles)
□ Range of difficulty levels (beginner to advanced)
□ Both free AND paid options (more free than paid)
□ Recent content (2022+ preferred)
□ Authoritative sources included
□ At least 5-8 hands-on project resources
□ Official documentation included
□ Every paid resource has a free alternative somewhere in the list
□ Descriptions are specific and compelling
□ All fields properly filled (no missing required data)

Return the JSON object now.

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
      temperature: 0.7, // Higher temperature for better search tool invocation and discovery
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
