/**
 * Job Task: generate_sections_resources (MODIFIED FOR PROMPT CHAINING)
 *
 * PROMPT CHAIN STEP 2: Organize pre-researched resources into logical learning sections
 *
 * This is the second step in the 3-step prompt chaining approach:
 * Step 1: Research (research_resources) - Web search for 30-50 resources ✓
 * Step 2: Curate (this task) - Organize into 5-8 sections
 * Step 3: Validate (validate_and_finalize) - Quality checks and completion
 *
 * Flow:
 * 1. Update status to curating_resources
 * 2. Fetch path metadata and researched_resources from database
 * 3. Call OpenRouter with curation-only prompt (NO web search needed)
 * 4. Validate response (sections must only use researched resources)
 * 5. Insert sections into database
 * 6. Insert resources per section
 * 7. Calculate total_estimated_hours from section hours
 * 8. Update learning_paths with metadata
 * 9. Queue next job: validate_and_finalize
 */

import type { Task } from 'graphile-worker';
import OpenAI from 'openai';
import { createServiceClient } from '@/libs/supabase/service';
import { SectionsResourcesResponseSchema } from '@/libs/validation/path-schema';
import type { GenerateSectionsResourcesPayload } from '../types';
import { addJob } from '../queue';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';

/**
 * Build system prompt for curation (organizing pre-researched resources)
 */
function buildCurationSystemPrompt(): string {
  return `═══════════════════════════════════════════════════════════════════════════════
⚠️  CRITICAL REQUIREMENT - YOU ARE A CURATION-ONLY AGENT  ⚠️
═══════════════════════════════════════════════════════════════════════════════

YOU ARE ORGANIZING PRE-RESEARCHED RESOURCES. DO NOT ADD NEW URLS.

You have been given a pool of 30-50 pre-researched, web-verified learning resources.
Your ONLY job is to organize them into logical learning sections.

DO NOT add new URLs - you can only select from the provided pool.
DO NOT modify URLs - use them exactly as provided.
DO NOT invent new resources - only organize what you have been given.

You MAY exclude resources that don't fit, but you CANNOT add new ones.

═══════════════════════════════════════════════════════════════════════════════

YOUR MISSION: Organize Resources into Learning Sections

You are a curriculum designer creating a structured learning path from pre-researched resources.

The learning path ALREADY HAS:
- Title (DO NOT modify)
- Description (DO NOT modify)
- Skill level (DO NOT modify)

You need to:
1. Create 5-8 logical learning sections
2. Select 7-8 resources per section from the available pool
3. Order sections for progressive learning (foundational → advanced)
4. Order resources within each section for logical flow

═══════════════════════════════════════════════════════════════════════════════

SECTION STRUCTURE REQUIREMENTS:

Create 5-8 sections with:

- **order**: Sequential numbering (1, 2, 3...)
- **title**: Clear, specific topic/skill being taught
- **description**: 2-3 sentences on what learners achieve and why this section matters
- **prerequisite_level**:
  * "required" - Must complete to proceed safely
  * "recommended" - Highly beneficial but skippable if experienced
  * "optional" - Enrichment/deeper dive
- **notes**: Strategic guidance, warnings, application tips, or null
- **estimated_hours**: Realistic time including practice (sum of resource times + practice time)
- **resources**: Array of 7-8 resources selected from available pool

PROGRESSION:
Sections should build on each other logically:
Foundational concepts → Core skills → Practical application → Advanced techniques

═══════════════════════════════════════════════════════════════════════════════

RESOURCE SELECTION GUIDELINES:

BALANCE (within each section):
✓ Mix of resource types (videos, articles, projects, books)
✓ At least ONE hands-on project/practice resource per section
✓ Free AND paid options (prioritize free)
✓ Quick reads AND comprehensive deep-dives
✓ Theory (40%) AND practice (60%)

QUALITY CHECKS:
✓ Resources fit the section topic
✓ Resources build on each other within the section
✓ Difficulty appropriate for section position in path
✓ No duplicate resources across sections
✓ Total path uses 20-35 resources (don't use all 30-50 available)

FOR EACH SELECTED RESOURCE:
- **order**: Sequential within section (1, 2, 3...)
- **title**: Use exact title from available pool
- **url**: Use exact URL from available pool (NO modifications)
- **type**: Use exact type from available pool
- **is_free**: Use exact value from available pool
- **description**: Use or slightly adapt description from available pool
- **estimated_minutes**: Use or adjust based on your judgment

═══════════════════════════════════════════════════════════════════════════════

SELECTION STRATEGY:

1. **Identify Core Concepts**: What are the 5-8 major topics/skills to learn?
2. **Map Resources to Topics**: Which resources best teach each topic?
3. **Order Sections**: Arrange topics by prerequisite knowledge
4. **Select Best Resources**: Choose 7-8 resources per section that:
   - Cover the topic comprehensively
   - Offer diverse formats
   - Include hands-on practice
   - Progress from easy to challenging
5. **Verify Balance**: Check that selected resources are diverse and complete

═══════════════════════════════════════════════════════════════════════════════

OUTPUT FORMAT:

Return ONLY valid JSON. NO markdown blocks, NO explanatory text, ONLY the JSON object:

{
  "sections": [
    {
      "order": 1,
      "title": "Getting Started with React Fundamentals",
      "description": "Master the core concepts of React including components, JSX, and props. Build a solid foundation that will support all advanced topics.",
      "prerequisite_level": "required",
      "notes": "Take your time with these fundamentals - they're crucial for everything that follows. Practice each concept before moving forward.",
      "estimated_hours": 8,
      "resources": [
        {
          "order": 1,
          "title": "Official React Documentation - Getting Started",
          "url": "https://react.dev/learn",
          "type": "article",
          "is_free": true,
          "description": "The authoritative guide to React fundamentals directly from the React team. Clear explanations with interactive examples.",
          "estimated_minutes": 120
        },
        // ... 2-6 more resources from available pool
      ]
    },
    // ... 4-7 more sections
  ],
  "total_estimated_hours": 45
}

═══════════════════════════════════════════════════════════════════════════════

PRE-OUTPUT CHECKLIST:

Before generating final JSON, verify:
□ 5-8 sections created
□ Each section has 7-8 resources
□ Sections progress logically (foundational → advanced)
□ Resources within each section are ordered logically
□ Every resource is from the available pool (no new URLs)
□ URLs are exactly as provided (not modified)
□ At least one project/practice resource per section
□ Mix of resource types across the path
□ Total 40-60 resources selected (not all from researched pool)
□ No duplicate resources across sections
□ total_estimated_hours calculated from section hours

═══════════════════════════════════════════════════════════════════════════════

FINAL REMINDER:
You are ORGANIZING, not RESEARCHING.
Only select from the provided resource pool.
Do not add, modify, or invent URLs.

═══════════════════════════════════════════════════════════════════════════════`;
}

/**
 * Build user prompt with pre-researched resources
 */
function buildCurationUserPrompt(params: {
  title: string;
  description: string;
  skillLevel: string;
  topicName: string;
  researchedResources: any[];
  goals?: string;
  competencies?: any[];
  userCompetencies?: any[];
}): string {
  const {
    title,
    description,
    skillLevel,
    topicName,
    researchedResources,
    goals,
    competencies,
    userCompetencies,
  } = params;

  let prompt = `Organize the following pre-researched resources into a structured learning path.

PATH METADATA (ALREADY GENERATED - DO NOT MODIFY):
- Title: "${title}"
- Description: "${description}"
- Skill Level: ${skillLevel}
- Topic: "${topicName}"`;

  if (goals) {
    prompt += `\n- Learner's Goals: ${goals}`;
  }

  prompt += `\n\nAVAILABLE RESOURCES (${researchedResources.length} total):

These resources have been pre-researched and verified. You MUST select from this pool only.
Do NOT add new URLs. You MAY exclude resources that don't fit.

${JSON.stringify(researchedResources, null, 2)}

═══════════════════════════════════════════════════════════════════════════════

IMPORTANT: Your sections and resources must fulfill the promise of the title and description above.
Select 20-35 resources from the pool that best support the learning path goals.`;

  // Extract all URLs for deduplication awareness
  const allAvailableUrls = researchedResources.map((r: any) => r.url);

  prompt += `\n\nDUPLICATION PREVENTION:
You have ${allAvailableUrls.length} unique resources to choose from.
Each resource should appear ONLY ONCE across all sections.
Before including a resource, verify you haven't already used it in a previous section.`;

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
        const userProf = userCompetencies.find((uc: any) => uc.competency_id === comp.id);
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
        const altNames = comp.alternatives.map((a: any) => a.alternative?.name).filter(Boolean);
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
- expert: Only cutting-edge topics, advanced patterns, assume deep knowledge`;
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
 * Task handler for sections and resources generation (curation phase)
 */
export const generateSectionsResourcesTask: Task = async (payload, helpers) => {
  const { pathId } = payload as GenerateSectionsResourcesPayload;

  console.log(`[generate_sections_resources] Starting curation for path ${pathId}`);

  const supabase = createServiceClient();

  try {
    // Check if cancelled
    const { data: pathCheck } = await supabase
      .from('learning_paths')
      .select('generation_status')
      .eq('id', pathId)
      .single();

    if (pathCheck?.generation_status === 'cancelled') {
      console.log(`[generate_sections_resources] Path ${pathId} was cancelled, exiting`);
      return { cancelled: true, pathId };
    }

    // Step 1: Update status and track job start
    const { data: currentPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
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

    // Step 2: Fetch path data (including metadata and researched resources)
    const { data: path, error: pathError } = await supabase
      .from('learning_paths')
      .select('title, description, skill_level, model_used, creator_id, topic_id, generation_metadata')
      .eq('id', pathId)
      .single();

    if (pathError || !path) {
      throw new Error(`Path not found: ${pathError?.message || 'Unknown error'}`);
    }

    if (!path.title || !path.description || !path.skill_level) {
      throw new Error('Path metadata is missing. generate_metadata job may have failed.');
    }

    // Step 2b: Get researched resources from generation_metadata
    const researchedResources = path.generation_metadata?.researched_resources;

    if (!researchedResources || !Array.isArray(researchedResources) || researchedResources.length < 20) {
      throw new Error(
        `Researched resources missing or insufficient. Found: ${researchedResources?.length || 0}, need at least 20. research_resources job may have failed.`
      );
    }

    console.log(
      `[generate_sections_resources] Found ${researchedResources.length} researched resources to curate`
    );

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
      const competencyIds = topicCompetencies.map((tc: any) => tc.competency?.id).filter(Boolean);

      // Also get prerequisite IDs
      const prerequisiteIds = topicCompetencies
        .flatMap((tc: any) => tc.competency?.prerequisites?.map((p: any) => p.prerequisite?.id) || [])
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

    console.log(`[generate_sections_resources] Calling OpenRouter for curation with model: ${path.model_used}`);

    // Step 6: Initialize OpenRouter client
    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        'X-Title': 'ViaProto',
      },
    });

    // Step 7: Generate sections from researched resources (NO web search needed)
    const systemPrompt = buildCurationSystemPrompt();
    const userPrompt = buildCurationUserPrompt({
      title: path.title,
      description: path.description,
      skillLevel: path.skill_level,
      topicName: topic.name,
      researchedResources,
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
      temperature: 0.4, // Slightly higher than research for creative organization
      // NO web-search transform needed - we're organizing existing resources
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI model');
    }

    console.log(`[generate_sections_resources] Received AI curation response`);

    // Step 8: Parse and validate response
    const parsedResponse = parseSectionsResponse(responseText);
    const sectionsData = SectionsResourcesResponseSchema.parse(parsedResponse);

    console.log(`[generate_sections_resources] Validated ${sectionsData.sections.length} sections`);

    // Step 9: Verify all URLs are from researched pool (security check)
    const researchedUrls = new Set(researchedResources.map((r: any) => r.url));
    const allSectionUrls = sectionsData.sections.flatMap((s) => s.resources.map((r) => r.url));
    const invalidUrls = allSectionUrls.filter((url) => !researchedUrls.has(url));

    if (invalidUrls.length > 0) {
      console.error(`[generate_sections_resources] AI added URLs not from researched pool:`, invalidUrls);
      throw new Error(
        `AI generated ${invalidUrls.length} URLs not from researched pool. This violates curation constraints.`
      );
    }

    console.log(`[generate_sections_resources] All URLs verified to be from researched pool ✓`);

    // Step 10: Insert sections and resources into database
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

      const { error: resourcesError } = await supabase.from('resources').insert(resourcesData);

      if (resourcesError) {
        throw new Error(`Failed to insert resources for section "${section.title}": ${resourcesError.message}`);
      }

      totalResourcesCount += section.resources.length;
      console.log(`  [generate_sections_resources] Inserted ${section.resources.length} resources`);
    }

    console.log(`[generate_sections_resources] All sections and resources inserted into database`);

    // Step 11: Calculate total_estimated_hours from section hours
    const calculatedTotalHours = sectionsData.sections.reduce((sum, section) => sum + section.estimated_hours, 0);

    console.log(`[generate_sections_resources] Calculated total hours: ${calculatedTotalHours}`);

    // Step 12: Update learning_paths with metadata and job completion with timing
    const completedAt = new Date().toISOString();
    const { data: completionPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
      .eq('id', pathId)
      .single();

    const startedAt = completionPath?.generation_jobs?.sections?.started_at;
    const updatedMetadata = updateJobTiming(
      completionPath?.generation_metadata || path.generation_metadata,
      'generate_sections_resources',
      startedAt,
      completedAt
    );
    const totalTime = calculateTotalGenerationTime(updatedMetadata);

    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        total_estimated_hours: calculatedTotalHours,
        generation_status: 'curating_resources', // Keep status, next job will update
        generation_metadata: {
          ...updatedMetadata,
          sections_count: sectionsData.sections.length,
          resources_count: totalResourcesCount,
          resources_selected_from_pool: totalResourcesCount,
          resources_available_in_pool: researchedResources.length,
          total_generation_time_ms: totalTime,
        },
        generation_jobs: {
          ...completionPath?.generation_jobs,
          sections: {
            ...completionPath?.generation_jobs?.sections,
            completed_at: completedAt,
            status: 'completed',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[generate_sections_resources] Job completed in ${formatDuration(updatedMetadata.job_timings.generate_sections_resources.duration_ms)}`);

    if (updateError) {
      throw new Error(`Failed to update path with completion status: ${updateError.message}`);
    }

    console.log(`[generate_sections_resources] Curation completed! Queuing validate_and_finalize`);

    // Step 13: Queue validation and finalization job
    await addJob('validate_and_finalize', { pathId });
    console.log(`[generate_sections_resources] Queued validate_and_finalize job`);

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
          generation_error: error instanceof Error ? error.message : 'Unknown error during curation',
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
