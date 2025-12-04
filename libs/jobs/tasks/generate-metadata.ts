/**
 * Job Task: generate_metadata
 *
 * Generates learning path metadata (title, description, skill_level) using AI.
 * This is Job #1 in the three-step path generation sequence.
 *
 * Flow:
 * 1. Fetch path and topic details from database
 * 2. Call OpenRouter with metadata-only prompt
 * 3. Validate response (MetadataResponseSchema)
 * 4. Update learning_paths with metadata
 * 5. Queue next job: fetch_unsplash_image
 */

import type { Task } from 'graphile-worker';
import { createServiceClient } from '@/libs/supabase/service';
import { MetadataResponseSchema } from '@/libs/validation/path-schema';
import type { GenerateMetadataPayload } from '../types';
import { addJob } from '../queue';
import { updateJobTiming, calculateTotalGenerationTime, formatDuration } from '../timing';
import OpenAI from 'openai';

/**
 * Build system prompt for metadata generation
 */
function buildMetadataSystemPrompt(): string {
  return `You are an expert curriculum designer creating personalized learning path metadata.

Your task is to generate ONLY the high-level information about a learning path:
- A compelling, specific title
- A clear description of what the learner will achieve
- The appropriate skill level (beginner/intermediate/advanced)

DO NOT generate sections, resources, or detailed content - that will be done in a separate step.

Return ONLY valid JSON matching this schema (no markdown, no extra text):
{
  "title": "string - Engaging, specific learning path title (e.g. 'Master React Hooks and State Management')",
  "description": "string - 2-4 sentences describing path goals, target audience, and outcomes",
  "skill_level": "beginner" | "intermediate" | "advanced"
}

SKILL LEVEL GUIDANCE:
- beginner: Assumes no prior experience with the topic, starts from fundamentals
- intermediate: Assumes basic familiarity, focuses on practical application and common patterns
- advanced: Assumes solid foundation, covers advanced techniques, optimization, and architecture`;
}

/**
 * Build user prompt for metadata generation
 */
function buildMetadataUserPrompt(params: {
  topicName: string;
  goals?: string;
  competencies?: any[];
  userCompetencies?: any[];
}): string {
  const { topicName, goals, competencies, userCompetencies } = params;

  let prompt = `Create metadata for a learning path on: "${topicName}"`;

  if (goals) {
    prompt += `\n\nLearner's Goals: ${goals}`;
  }

  // Add competency context for personalization
  if (competencies && competencies.length > 0) {
    prompt += `\n\nCOMPETENCY CONTEXT:`;
    prompt += `\nThis topic involves the following competencies:\n`;

    for (const tc of competencies) {
      if (!tc.competency) continue;

      const comp = tc.competency;
      prompt += `\n- ${comp.name}${tc.is_primary ? ' (PRIMARY)' : ''}`;

      // Check user's proficiency to determine skill level
      if (userCompetencies && userCompetencies.length > 0) {
        const userProf = userCompetencies.find(
          (uc: any) => uc.competency_id === comp.id
        );
        if (userProf) {
          prompt += ` - User level: ${userProf.proficiency_level}`;
        } else {
          prompt += ` - User has NOT learned this yet`;
        }
      }

      // Add prerequisites context
      if (comp.prerequisites && comp.prerequisites.length > 0) {
        const prereqNames = comp.prerequisites
          .map((p: any) => p.prerequisite?.name)
          .filter(Boolean);
        if (prereqNames.length > 0) {
          prompt += `\n  Prerequisites: ${prereqNames.join(', ')}`;
        }
      }
    }

    prompt += `\n\nBased on the user's proficiency levels above, choose the appropriate skill_level:
- If user shows "none" or "beginner" in primary competency: skill_level = "beginner"
- If user shows "intermediate" in primary competency: skill_level = "intermediate"
- If user shows "advanced" or "expert" in primary competency: skill_level = "advanced"`;
  }

  return prompt;
}

/**
 * Parse JSON response (handles markdown code blocks)
 */
function parseMetadataResponse(responseText: string): any {
  // Remove markdown code blocks if present
  const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = responseText.trim().match(codeBlockPattern);
  const cleanText = match ? match[1].trim() : responseText.trim();

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    // Try to extract JSON object from text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw error;
  }
}

/**
 * Task handler for metadata generation
 */
export const generateMetadataTask: Task = async (payload, helpers) => {
  const { pathId, topicId, topicName, goals, modelId } =
    payload as GenerateMetadataPayload;

  console.log(`[generate_metadata] Starting for path ${pathId}`);

  const supabase = createServiceClient();

  try {
    // Check if cancelled
    const { data: pathCheck } = await supabase
      .from('learning_paths')
      .select('generation_status')
      .eq('id', pathId)
      .single();

    if (pathCheck?.generation_status === 'cancelled') {
      console.log(`[generate_metadata] Path ${pathId} was cancelled, exiting`);
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
        generation_status: 'generating_metadata',
        generation_jobs: {
          ...generationJobs,
          metadata: {
            job_id: helpers.job.id.toString(),
            started_at: new Date().toISOString(),
            attempts: helpers.job.attempts,
            status: 'pending',
          },
        },
      })
      .eq('id', pathId);

    console.log(`[generate_metadata] Status updated to generating_metadata`);

    // Step 2: Fetch topic and competencies
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      throw new Error(`Topic not found: ${topicError?.message || 'Unknown error'}`);
    }

    // Step 3: Fetch competencies associated with this topic
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
              slug
            )
          )
        )
      `)
      .eq('topic_id', topicId);

    if (competenciesError) {
      console.warn(`[generate_metadata] Failed to fetch competencies:`, competenciesError);
    }

    // Step 4: Fetch user competencies (for the path creator)
    const { data: pathData } = await supabase
      .from('learning_paths')
      .select('creator_id')
      .eq('id', pathId)
      .single();

    let userCompetencies: any[] = [];
    if (pathData && topicCompetencies) {
      const competencyIds = topicCompetencies
        .map((tc: any) => tc.competency?.id)
        .filter(Boolean);

      if (competencyIds.length > 0) {
        const { data: userComps } = await supabase
          .from('user_competencies')
          .select('competency_id, proficiency_level')
          .eq('user_id', pathData.creator_id)
          .in('competency_id', competencyIds);

        userCompetencies = userComps || [];
      }
    }

    console.log(`[generate_metadata] Calling OpenRouter with model: ${modelId}`);

    // Step 5: Initialize OpenRouter client
    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        'X-Title': 'ViaProto',
      },
    });

    // Step 6: Generate metadata using OpenRouter
    const systemPrompt = buildMetadataSystemPrompt();
    const userPrompt = buildMetadataUserPrompt({
      topicName,
      goals,
      competencies: topicCompetencies,
      userCompetencies,
    });

    const completion = await openrouter.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI model');
    }

    console.log(`[generate_metadata] Received AI response`);

    // Step 7: Parse and validate response
    const parsedResponse = parseMetadataResponse(responseText);
    const metadata = MetadataResponseSchema.parse(parsedResponse);

    console.log(`[generate_metadata] Validated metadata:`, {
      title: metadata.title.substring(0, 50),
      skill_level: metadata.skill_level,
    });

    // Step 8: Update learning_paths with metadata
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        title: metadata.title,
        description: metadata.description,
        skill_level: metadata.skill_level,
        model_used: modelId,
        generation_status: 'generating_metadata', // Keep status (next job will update)
      })
      .eq('id', pathId);

    if (updateError) {
      throw new Error(`Failed to update path with metadata: ${updateError.message}`);
    }

    console.log(`[generate_metadata] Path updated with metadata`);

    // Step 9: Update job metadata with completion and timing
    const completedAt = new Date().toISOString();
    const { data: finalPath } = await supabase
      .from('learning_paths')
      .select('generation_jobs, generation_metadata')
      .eq('id', pathId)
      .single();

    const startedAt = finalPath?.generation_jobs?.metadata?.started_at;
    const updatedMetadata = updateJobTiming(
      finalPath?.generation_metadata,
      'generate_metadata',
      startedAt,
      completedAt
    );
    const totalTime = calculateTotalGenerationTime(updatedMetadata);

    await supabase
      .from('learning_paths')
      .update({
        generation_jobs: {
          ...finalPath?.generation_jobs,
          metadata: {
            ...finalPath?.generation_jobs?.metadata,
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

    console.log(`[generate_metadata] Job completed in ${formatDuration(updatedMetadata.job_timings.generate_metadata.duration_ms)}`);

    // Step 10: Queue next job - fetch_unsplash_image
    await addJob('fetch_unsplash_image', {
      pathId,
      topicName,
    });

    console.log(`[generate_metadata] Completed! Queued fetch_unsplash_image`);

    return {
      success: true,
      pathId,
      metadata: {
        title: metadata.title,
        skill_level: metadata.skill_level,
      },
    };
  } catch (error) {
    console.error(`[generate_metadata] Error:`, error);

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
          generation_status: 'failed_metadata',
          generation_error: error instanceof Error ? error.message : 'Unknown error during metadata generation',
          generation_jobs: {
            ...errorPath?.generation_jobs,
            metadata: {
              ...errorPath?.generation_jobs?.metadata,
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
