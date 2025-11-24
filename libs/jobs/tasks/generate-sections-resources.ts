/**
 * Job Task: generate_sections_resources
 *
 * Generates learning sections and resources using AI based on metadata from Job #1.
 * This is Job #3 (final step) in the three-step path generation sequence.
 *
 * Flow:
 * 1. Update status to curating_resources
 * 2. Fetch path metadata (title, description, skill_level) from database
 * 3. Fetch topic and competencies
 * 4. Fetch user competency proficiency levels
 * 5. Call OpenRouter with sections/resources prompt
 * 6. Validate response (SectionsResourcesResponseSchema)
 * 7. Insert sections into database
 * 8. Insert resources per section
 * 9. Calculate total_estimated_hours from section hours
 * 10. Update learning_paths with completion status and metadata
 */

import type { Task } from 'graphile-worker';
import OpenAI from 'openai';
import { createServiceClient } from '@/libs/supabase/service';
import { SectionsResourcesResponseSchema } from '@/libs/validation/path-schema';
import type { GenerateSectionsResourcesPayload } from '../types';
import { addJob } from '../queue';

/**
 * Build system prompt for sections/resources generation
 * Based on the comprehensive prompt from libs/openrouter.ts, but adapted
 * to work with pre-generated metadata
 */
function buildSectionsSystemPrompt(): string {
  return `You are an expert curriculum designer and educational researcher specializing in personalized learning path creation. Your expertise lies in discovering high-quality educational resources and structuring them into pedagogically sound, practical learning roadmaps.

IMPORTANT CONTEXT:
The learning path ALREADY HAS a title, description, and skill level that were generated in a previous step. Your task is to create the detailed learning content (sections and resources) that fulfill the promise of that existing metadata. DO NOT regenerate or modify the title, description, or skill level.

CORE MISSION:
Create comprehensive, research-backed learning sections with carefully curated external resources. Your sections must deliver on the path's existing description and guide learners from their current knowledge level to mastery through hands-on practice.

PATH STRUCTURE REQUIREMENTS:
1. Create exactly 5-8 sections that form a logical learning progression
2. Sequence sections by prerequisite knowledge (foundational → intermediate → advanced)
3. Each section must contain at least 3-7 high-quality resources in learning order
4. Total estimated time should reflect realistic learning commitment (typically 20-100+ hours for comprehensive paths)

SECTION DESIGN GUIDELINES:
- Title: Clear, specific topic/skill being taught
- Description: 2-3 sentences explaining what learners will achieve and why this section matters
- Prerequisite Level:
  * "required" = Must complete this section to proceed safely
  * "recommended" = Strongly beneficial but can skip if experienced
  * "optional" = Enrichment/deeper dive for interested learners
- Notes: Use this field strategically for:
  * Important warnings or gotchas
  * Suggestions for applying the knowledge
  * Context about why this section is ordered here
  * Alternative approaches for different learning styles
- Estimated Hours: Realistic time including practice/projects (not just consumption time)

RESOURCE REQUIREMENTS - CRITICAL:
1. ONLY include resources that currently exist - use web search to verify URLs
2. Every URL must be direct and functional (https:// or http://)
3. Test resource availability - avoid dead links, paywalled content without free alternatives
4. For EVERY paid resource (books, courses), provide at least one free alternative
5. Explicitly mark is_free: true/false (null only if truly unknown after research)
6. Resource types to include:
   - Videos: Tutorials, lectures, demonstrations
   - Articles: Blog posts, documentation, guides
   - Books: O'Reilly, Manning, free online books
   - Projects: GitHub repos, coding challenges, hands-on exercises
   - Audio: Podcasts, audiobooks (when relevant)
   - Graphics: Infographics, visual guides, cheat sheets

RESOURCE BALANCE & QUALITY:
- Include diverse formats: Don't rely solely on videos or articles
- Balance theory (40%) with practice (60%) - prioritize hands-on learning
- Each section should have at least ONE project/practice resource
- Quality indicators to prioritize:
  * Authoritative sources (official docs, recognized experts)
  * Recent/updated content (prefer last 2-3 years unless classic resource)
  * High engagement (popular GitHub repos, well-reviewed courses)
  * Clear learning outcomes
  * Production-ready examples/best practices
- Description: Write 1-2 compelling sentences explaining what makes this resource valuable and what specific skills/knowledge it provides
- Estimated Minutes: Be realistic - include time for practice/absorption, not just reading/watching

RESEARCH PROCESS:
1. Search for current, highly-rated resources in the topic area
2. Verify each URL actually works and leads to the resource (not a search page or login wall)
3. Cross-reference multiple sources to find the best resources
4. For paid resources, actively search for free alternatives (YouTube, freeCodeCamp, MDN, official docs, open-source books)
5. Check publication/update dates to ensure currency
6. Prioritize resources that build on each other logically

QUALITY STANDARDS - YOUR PATH MUST:
✓ Progress logically from fundamentals to advanced topics
✓ Include hands-on projects that apply learned concepts
✓ Provide multiple resource types for different learning preferences
✓ Offer both free and premium options with clear labeling
✓ Contain working, verified URLs only
✓ Specify realistic time commitments
✓ Balance breadth (overview) with depth (mastery)
✓ Enable learners to build portfolio-worthy projects by completion

OUTPUT FORMAT - CRITICAL:
Return ONLY valid JSON matching this exact schema. NO markdown code blocks, NO explanatory text before or after, ONLY the JSON object:

{
  "sections": [
    {
      "order": number (starting from 1),
      "title": "string - Clear section topic",
      "description": "string - What learners will achieve in this section",
      "prerequisite_level": "required" | "recommended" | "optional",
      "notes": "string | null - Strategic guidance, warnings, or context",
      "estimated_hours": number,
      "resources": [
        {
          "order": number (starting from 1),
          "title": "string - Resource title",
          "url": "string - Must start with https:// or http://",
          "type": "video" | "article" | "book" | "project" | "audio" | "graphic" | "course",
          "is_free": boolean | null,
          "description": "string - 1-2 sentences on value and content",
          "estimated_minutes": number | null
        }
      ]
    }
  ],
  "total_estimated_hours": number
}

FINAL REMINDERS:
- All URLs must be verified, direct links to actual resources
- Every paid resource needs a free alternative somewhere in the path
- Focus on practical, career-ready skills with project-based learning
- Return ONLY the JSON object - no other text or formatting
- Your sections must deliver on the path's existing title and description`;
}

/**
 * Build user prompt for sections/resources generation
 * Includes the pre-generated metadata so AI can create content that matches
 */
function buildSectionsUserPrompt(params: {
  title: string;
  description: string;
  skillLevel: string;
  topicName: string;
  goals?: string;
  competencies?: any[];
  userCompetencies?: any[];
}): string {
  const { title, description, skillLevel, topicName, goals, competencies, userCompetencies } = params;

  let prompt = `Create detailed learning sections and resources for the following learning path:

PATH METADATA (ALREADY GENERATED - DO NOT MODIFY):
- Title: "${title}"
- Description: "${description}"
- Skill Level: ${skillLevel}
- Topic: "${topicName}"`;

  if (goals) {
    prompt += `\n- Learner's Goals: ${goals}`;
  }

  prompt += `\n\nIMPORTANT: Your sections and resources must fulfill the promise of this title and description. Make sure the content you generate matches the scope and focus described above.`;

  // Add competency context for personalization
  if (competencies && competencies.length > 0) {
    prompt += `\n\nCOMPETENCY CONTEXT:`;
    prompt += `\nThis topic involves the following competencies:\n`;

    for (const tc of competencies) {
      if (!tc.competency) continue;

      const comp = tc.competency;
      prompt += `\n- ${comp.name}${tc.is_primary ? ' (PRIMARY)' : ''}`;

      if (comp.description) {
        prompt += `\n  Description: ${comp.description}`;
      }

      // Check user's proficiency
      if (userCompetencies && userCompetencies.length > 0) {
        const userProf = userCompetencies.find(
          (uc: any) => uc.competency_id === comp.id
        );
        if (userProf) {
          prompt += `\n  User's Current Level: ${userProf.proficiency_level}`;
        }
      }

      // Add prerequisites
      if (comp.prerequisites && comp.prerequisites.length > 0) {
        prompt += `\n  Prerequisites:`;
        for (const prereq of comp.prerequisites) {
          if (!prereq.prerequisite) continue;

          prompt += `\n    - ${prereq.prerequisite.name} (${prereq.prerequisite_level})`;

          // Check user's proficiency in prerequisite
          if (userCompetencies && userCompetencies.length > 0) {
            const userPrereqProf = userCompetencies.find(
              (uc: any) => uc.competency_id === prereq.prerequisite.id
            );
            if (userPrereqProf) {
              prompt += ` - User level: ${userPrereqProf.proficiency_level}`;
            } else {
              prompt += ` - User has NOT learned this yet`;
            }
          }
        }
      }

      // Add alternatives
      if (comp.alternatives && comp.alternatives.length > 0) {
        const altNames = comp.alternatives
          .map((a: any) => a.alternative?.name)
          .filter(Boolean);
        if (altNames.length > 0) {
          prompt += `\n  Alternative competencies: ${altNames.join(', ')}`;
        }
      }
    }

    prompt += `\n\nIMPORTANT: Use this competency information to personalize the learning path:

CRITICAL RULE: User proficiency ALWAYS takes priority over prerequisite labels. Check proficiency FIRST before including any content.

WHEN TO SKIP PREREQUISITES (User Already Knows Them):
- If user shows "intermediate", "advanced", or "expert" level in a prerequisite: SKIP teaching that prerequisite entirely
- Example: React requires JavaScript. If user shows "JavaScript: expert", START directly with React concepts - do NOT include JavaScript sections
- If user is advanced/expert in the main competency: Focus only on advanced topics, edge cases, and best practices

WHEN TO INCLUDE PREREQUISITES (User Needs to Learn):
- ONLY if prerequisite shows "User has NOT learned this yet" OR "User level: none" OR "User level: beginner"
- For "required" prerequisites at none/beginner: Dedicate 1-2 full sections to fundamentals BEFORE the main topic
- For "recommended" prerequisites at none/beginner: Include a condensed intro section or note which sections assume this knowledge
- For "optional" prerequisites at none/beginner: Mention in notes but don't require

PROFICIENCY-BASED CONTENT ADJUSTMENT:
- none/beginner: Comprehensive fundamentals, step-by-step progression, lots of practice
- intermediate: Skip basics entirely, focus on practical patterns and real-world application
- advanced: Skip basics and intermediate, focus on optimization, architecture, edge cases
- expert: Only cutting-edge topics, advanced patterns, assume deep knowledge

Example 1: React path, JavaScript: none → Include 2 JavaScript fundamentals sections before React
Example 2: React path, JavaScript: expert → Skip JavaScript entirely, assume advanced JS patterns knowledge
Example 3: React path, JavaScript: intermediate → Start directly with React basics, assume JS knowledge`;
  }

  return prompt;
}

/**
 * Parse JSON response (handles markdown code blocks)
 */
function parseSectionsResponse(responseText: string): any {
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
  console.error('Failed to parse AI response. First 500 chars:', responseText.substring(0, 500));
  throw new Error(
    `Failed to parse AI response as JSON. Response started with: ${responseText.substring(0, 100)}...`
  );
}

/**
 * Task handler for sections and resources generation
 */
export const generateSectionsResourcesTask: Task = async (payload, helpers) => {
  const { pathId } = payload as GenerateSectionsResourcesPayload;

  console.log(`[generate_sections_resources] Starting for path ${pathId}`);

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
        generation_status: 'curating_resources',
        generation_jobs: {
          ...generationJobs,
          sections: {
            job_id: helpers.job.id.toString(),
            started_at: new Date().toISOString(),
            attempts: helpers.job.attempts,
            status: 'pending',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[generate_sections_resources] Status updated to curating_resources`);

    // Step 2: Fetch path data (including metadata from Job #1)
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select('title, description, skill_level, model_used, creator_id, topic_id, generation_metadata')
      .eq('id', pathId)
      .single();

    if (pathError || !path) {
      throw new Error(`Path not found: ${pathError?.message || 'Unknown error'}`);
    }

    if (!path.title || !path.description || !path.skill_level) {
      throw new Error('Path metadata is missing. Job #1 may have failed to set metadata.');
    }

    console.log(`[generate_sections_resources] Using metadata: "${path.title.substring(0, 50)}...", skill: ${path.skill_level}`);

    // Step 3: Fetch topic details
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', path.topic_id)
      .single();

    if (topicError || !topic) {
      throw new Error(`Topic not found: ${topicError?.message || 'Unknown error'}`);
    }

    // Step 4: Fetch competencies associated with this topic
    const { data: topicCompetencies, error: competenciesError } = await supabase
      .from('topic_competencies')
      .select(`
        is_primary,
        competency:competencies(
          id,
          name,
          slug,
          description,
          prerequisites:competency_prerequisites!competency_prerequisites_competency_id_fkey(
            prerequisite_level,
            prerequisite:competencies!competency_prerequisites_prerequisite_id_fkey(
              id,
              name,
              slug,
              description
            )
          ),
          alternatives:competency_alternatives!competency_alternatives_competency_id_fkey(
            alternative:competencies!competency_alternatives_alternative_id_fkey(
              id,
              name,
              slug
            )
          )
        )
      `)
      .eq('topic_id', path.topic_id);

    if (competenciesError) {
      console.warn(`[generate_sections_resources] Failed to fetch competencies:`, competenciesError);
    }

    // Step 5: Fetch user's competency proficiency levels
    let userCompetencies: any[] = [];
    if (topicCompetencies && topicCompetencies.length > 0) {
      const competencyIds = topicCompetencies
        .map((tc: any) => tc.competency?.id)
        .filter(Boolean);

      // Also get prerequisite IDs
      const prerequisiteIds = topicCompetencies
        .flatMap((tc: any) =>
          tc.competency?.prerequisites?.map((p: any) => p.prerequisite?.id) || []
        )
        .filter(Boolean);

      const allCompetencyIds = [...new Set([...competencyIds, ...prerequisiteIds])];

      if (allCompetencyIds.length > 0) {
        const { data: userComps } = await supabase
          .from('user_competencies')
          .select('competency_id, proficiency_level')
          .eq('user_id', path.creator_id)
          .in('competency_id', allCompetencyIds);

        userCompetencies = userComps || [];
      }
    }

    console.log(`[generate_sections_resources] Calling OpenRouter with model: ${path.model_used}`);

    // Step 6: Initialize OpenRouter client
    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        'X-Title': 'ViaProto',
      },
    });

    // Step 7: Generate sections and resources using OpenRouter
    const systemPrompt = buildSectionsSystemPrompt();
    const userPrompt = buildSectionsUserPrompt({
      title: path.title,
      description: path.description,
      skillLevel: path.skill_level,
      topicName: topic.name,
      goals: path.generation_metadata?.goals,
      competencies: topicCompetencies,
      userCompetencies,
    });

    const completion = await openrouter.chat.completions.create({
      model: path.model_used,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
      // OpenRouter-specific: Enable web search for real resources
      // @ts-ignore - OpenRouter extension
      transforms: ['web-search'],
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI model');
    }

    console.log(`[generate_sections_resources] Received AI response`);

    // Step 8: Parse and validate response
    const parsedResponse = parseSectionsResponse(responseText);
    const sectionsData = SectionsResourcesResponseSchema.parse(parsedResponse);

    console.log(`[generate_sections_resources] Validated ${sectionsData.sections.length} sections with resources`);

    // Step 9: Insert sections and resources
    let totalResourcesCount = 0;

    for (const section of sectionsData.sections) {
      // Insert section
      const { data: newSection, error: sectionError } = await supabase
        .from('sections')
        .insert({
          learning_path_id: pathId,
          order: section.order,
          title: section.title,
          description: section.description,
          prerequisite_level: section.prerequisite_level,
          notes: section.notes || null,
          estimated_hours: section.estimated_hours,
        })
        .select('id')
        .single();

      if (sectionError || !newSection) {
        throw new Error(`Failed to insert section: ${sectionError?.message || 'Unknown error'}`);
      }

      console.log(`[generate_sections_resources] Inserted section: "${section.title}"`);

      // Insert resources for this section
      const resourcesData = section.resources.map((resource) => ({
        section_id: newSection.id,
        order: resource.order,
        title: resource.title,
        url: resource.url,
        type: resource.type,
        is_free: resource.is_free,
        description: resource.description,
        estimated_minutes: resource.estimated_minutes,
      }));

      const { error: resourcesError } = await supabase
        .from('resources')
        .insert(resourcesData);

      if (resourcesError) {
        throw new Error(`Failed to insert resources for section "${section.title}": ${resourcesError.message}`);
      }

      totalResourcesCount += section.resources.length;
      console.log(`  [generate_sections_resources] Inserted ${section.resources.length} resources`);
    }

    console.log(`[generate_sections_resources] All sections and resources inserted`);

    // Step 10: Calculate total_estimated_hours from section hours
    const calculatedTotalHours = sectionsData.sections.reduce(
      (sum, section) => sum + section.estimated_hours,
      0
    );

    console.log(`[generate_sections_resources] Calculated total hours: ${calculatedTotalHours}`);

    // Step 11: Update learning_paths with completion status, job metadata, and path metadata
    const { data: completionPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs')
      .eq('id', pathId)
      .single();

    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        total_estimated_hours: calculatedTotalHours,
        generation_status: 'curating_resources', // Keep status, next job will mark as completed
        generation_metadata: {
          ...path.generation_metadata,
          sections_count: sectionsData.sections.length,
          resources_count: totalResourcesCount,
        },
        generation_jobs: {
          ...completionPath?.generation_jobs,
          sections: {
            ...completionPath?.generation_jobs?.sections,
            completed_at: new Date().toISOString(),
            status: 'completed',
          },
        },
      })
      .eq('id', pathId);

    if (updateError) {
      throw new Error(`Failed to update path with completion status: ${updateError.message}`);
    }

    console.log(`[generate_sections_resources] Sections completed! Queuing link validation`);

    // Step 12: Queue link validation job
    await addJob('validate_resource_links', { pathId });
    console.log(`[generate_sections_resources] Queued validate_resource_links job`);

    return {
      success: true,
      pathId,
      sectionsCount: sectionsData.sections.length,
      resourcesCount: totalResourcesCount,
      totalHours: calculatedTotalHours,
    };
  } catch (error) {
    console.error(`[generate_sections_resources] Error:`, error);

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
          generation_status: 'failed_sections',
          generation_error: error instanceof Error ? error.message : 'Unknown error during sections generation',
          generation_jobs: {
            ...errorPath?.generation_jobs,
            sections: {
              ...errorPath?.generation_jobs?.sections,
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
