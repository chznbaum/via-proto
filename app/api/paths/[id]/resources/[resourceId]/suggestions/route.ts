import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { canEditPath } from "@/libs/auth";
import OpenAI from "openai";
import { z } from "zod";

/**
 * Schema for replacement candidate - matches the background job schema
 */
const ReplacementCandidateSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(["video", "article", "book", "project", "audio", "graphic", "course"]),
  is_free: z.boolean().nullable(),
  description: z.string(),
  relevance_score: z.number().min(1).max(10),
});

const ReplacementResponseSchema = z.object({
  candidates: z.array(ReplacementCandidateSchema).min(1).max(5),
});

export type ReplacementCandidate = z.infer<typeof ReplacementCandidateSchema>;

/**
 * Build prompt for finding replacement resources
 * Adapted from libs/jobs/tasks/replace-broken-resources.ts
 */
function buildReplacementPrompt(
  brokenResource: {
    title: string;
    description?: string;
    url: string;
    type: string;
    is_free: boolean | null;
  },
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
- Description: "${brokenResource.description || "N/A"}"
- Type: ${brokenResource.type}
- Original URL: ${brokenResource.url} (BROKEN - do not reuse)
- Free Status: ${brokenResource.is_free === true ? "FREE" : brokenResource.is_free === false ? "PAID" : "unknown"}

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
${allExistingUrls.slice(0, 20).join("\n")}
${allExistingUrls.length > 20 ? `... and ${allExistingUrls.length - 20} more URLs` : ""}

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
 * Parse AI response with multiple fallback strategies
 */
function parseAIResponse(responseText: string): unknown {
  // Strategy 1: Try direct parse
  try {
    return JSON.parse(responseText);
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 2: Try to strip markdown code blocks
  const codeBlockPattern = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const match = responseText.trim().match(codeBlockPattern);
  const cleanText = match ? match[1].trim() : responseText.trim();

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 3: Extract JSON object from text
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Fall through to error
    }
  }

  throw new Error(`Failed to parse AI response as JSON`);
}

/**
 * POST /api/paths/[id]/resources/[resourceId]/suggestions
 * Generate replacement suggestions for a broken resource
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const { id: pathId, resourceId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Permission check - must be able to edit the path
    const canEdit = await canEditPath(user.id, pathId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this path" },
        { status: 403 }
      );
    }

    // 3. Fetch the resource and its context
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select(
        `
        id,
        title,
        description,
        url,
        type,
        is_free,
        link_status,
        sections!inner(
          id,
          title,
          learning_path_id,
          learning_paths!inner(
            id,
            title,
            skill_level,
            model_used
          )
        )
      `
      )
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Type assertion for joined data
    const section = resource.sections as unknown as {
      id: string;
      title: string;
      learning_path_id: string;
      learning_paths: {
        id: string;
        title: string;
        skill_level: string;
        model_used: string;
      };
    };

    if (section.learning_path_id !== pathId) {
      return NextResponse.json(
        { error: "Resource does not belong to this path" },
        { status: 400 }
      );
    }

    const path = section.learning_paths;

    // 4. Fetch all existing URLs for deduplication
    const { data: allSections } = await supabase
      .from("sections")
      .select(`resources (url)`)
      .eq("learning_path_id", pathId);

    const allExistingUrls =
      allSections
        ?.flatMap((s) => s.resources?.map((r: { url: string }) => r.url))
        .filter(Boolean) || [];

    // 5. Initialize OpenRouter
    const openrouter = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001",
        "X-Title": "ViaProto",
      },
    });

    // 6. Build and send the prompt
    const prompt = buildReplacementPrompt(
      {
        title: resource.title,
        description: resource.description || undefined,
        url: resource.url,
        type: resource.type,
        is_free: resource.is_free,
      },
      section.title,
      path.title,
      path.skill_level,
      allExistingUrls
    );

    const completion = await openrouter.chat.completions.create({
      model: path.model_used,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      // @ts-ignore - OpenRouter extension
      transforms: ["web-search"],
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    // 7. Parse and validate response
    const parsed = parseAIResponse(responseText);
    const validated = ReplacementResponseSchema.parse(parsed);

    // 8. Filter out duplicates and sort by relevance
    const uniqueCandidates = validated.candidates
      .filter((candidate) => !allExistingUrls.includes(candidate.url))
      .sort((a, b) => b.relevance_score - a.relevance_score);

    return NextResponse.json({
      suggestions: uniqueCandidates,
      original_resource: {
        id: resource.id,
        title: resource.title,
        url: resource.url,
        type: resource.type,
      },
    });
  } catch (error) {
    console.error("Error generating replacement suggestions:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid AI response format", details: error.errors },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate replacement suggestions" },
      { status: 500 }
    );
  }
}
