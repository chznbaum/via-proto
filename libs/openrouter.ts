import OpenAI from "openai";

// Initialize OpenAI SDK with OpenRouter base URL
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
    "X-Title": "ViaProto",
  },
});

/**
 * Get the appropriate AI model based on subscription tier
 * @deprecated Use getDefaultModelForTier from @/libs/models instead
 */
export function getModelByTier(tier: "free" | "pro" | "team"): string {
  return tier === "free"
    ? "deepseek/deepseek-chat"
    : "anthropic/claude-sonnet-4.5";
}

/**
 * Build the system prompt for AI path generation
 */
function buildSystemPrompt(): string {
  return `You are an expert curriculum designer and educational researcher specializing in personalized learning path creation. Your expertise lies in discovering high-quality educational resources and structuring them into pedagogically sound, practical learning roadmaps.

CORE MISSION:
Create a comprehensive, research-backed learning path that guides learners from their current knowledge level to mastery through carefully curated external resources. Your path must balance theoretical understanding with hands-on practice.

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
  "title": "string - Engaging, specific learning path title",
  "description": "string - 2-4 sentences describing path goals, target audience, and outcomes",
  "total_estimated_hours": number,
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
          "type": "video" | "article" | "book" | "project" | "audio" | "graphic",
          "is_free": boolean | null,
          "description": "string - 1-2 sentences on value and content",
          "estimated_minutes": number | null
        }
      ]
    }
  ]
}

FINAL REMINDERS:
- All URLs must be verified, direct links to actual resources
- Every paid resource needs a free alternative somewhere in the path
- Focus on practical, career-ready skills with project-based learning
- Return ONLY the JSON object - no other text or formatting`;
}

/**
 * Build the user prompt for AI path generation
 */
function buildUserPrompt(
  topic: string,
  goals?: string,
  competencies?: any[],
  userCompetencies?: any[],
): string {
  let prompt = `Create a comprehensive learning path for: "${topic}"`;

  if (goals) {
    prompt += `\n\nLearning Goals: ${goals}`;
  }

  // Add competency context
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
 * Strip markdown code blocks from JSON response
 * Claude models sometimes wrap JSON in ```json ... ``` despite instructions
 */
function stripMarkdownCodeBlocks(text: string): string {
  // Remove markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = text.trim().match(codeBlockPattern);

  if (match) {
    return match[1].trim();
  }

  return text.trim();
}

/**
 * Parse JSON response with multiple fallback strategies
 */
function parseAIResponse(responseText: string): any {
  // Strategy 1: Try direct parse
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 2: Strip markdown code blocks and try again
  try {
    const cleanedText = stripMarkdownCodeBlocks(responseText);
    return JSON.parse(cleanedText);
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
    // Continue to throw original error
  }

  // All strategies failed - throw detailed error
  console.error("Failed to parse AI response. First 500 chars:", responseText.substring(0, 500));
  throw new Error(
    `Failed to parse AI response as JSON. Response started with: ${responseText.substring(0, 100)}...`
  );
}

/**
 * Generate a learning path using AI
 */
export async function generateLearningPath(params: {
  topic: string;
  goals?: string;
  model: string;
  competencies?: any[];
  userCompetencies?: any[];
}): Promise<any> {
  const { topic, goals, model, competencies, userCompetencies } = params;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(topic, goals, competencies, userCompetencies);

  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }, // Enforce JSON output
      // OpenRouter-specific: Enable web search for real resources
      // @ts-ignore - OpenRouter extension
      transforms: ["web-search"],
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from AI model");
    }

    return parseAIResponse(responseText);
  } catch (error) {
    console.error("Error generating learning path:", error);
    throw error;
  }
}
