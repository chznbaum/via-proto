import OpenAI from 'openai';

// Initialize OpenAI SDK with OpenRouter base URL
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'ViaProto',
  },
});

/**
 * Get the appropriate AI model based on subscription tier
 */
export function getModelByTier(tier: 'free' | 'pro' | 'team'): string {
  return tier === 'free'
    ? 'deepseek/deepseek-chat'
    : 'anthropic/claude-sonnet-4.5';
}

/**
 * Build the system prompt for AI path generation
 */
function buildSystemPrompt(): string {
  return `You are an expert curriculum designer creating personalized learning paths.

Your task is to research current, high-quality educational resources and structure them into a comprehensive learning roadmap.

CRITICAL REQUIREMENTS:
1. Use web search to find REAL, CURRENT resources (not hypothetical)
2. Link only to publicly available resources
3. Provide free alternatives when recommending paid resources
4. Include direct URLs (not search result pages)
5. Estimate time commitments accurately
6. Organize resources in a logical learning progression
7. Include a variety of resource types (videos, articles, books, projects, etc.)

OUTPUT FORMAT: JSON matching this exact schema:
{
  "title": string,
  "description": string,
  "total_estimated_hours": number,
  "sections": [
    {
      "order": number (starting from 1),
      "title": string,
      "description": string,
      "prerequisite_level": "required" | "recommended" | "optional",
      "notes": string | null,
      "estimated_hours": number,
      "resources": [
        {
          "order": number (starting from 1),
          "title": string,
          "url": string (must start with https:// or http://),
          "type": "video" | "article" | "book" | "project" | "audio" | "graphic",
          "is_free": boolean | null,
          "description": string,
          "estimated_minutes": number | null
        }
      ]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. Do not include markdown code blocks or explanations.`;
}

/**
 * Build the user prompt for AI path generation
 */
function buildUserPrompt(topic: string, skillLevel: string, goals?: string): string {
  let prompt = `Create a comprehensive learning path for: "${topic}"

Skill Level: ${skillLevel}
`;

  if (goals) {
    prompt += `\nLearning Goals: ${goals}`;
  }

  prompt += `\n\nPlease create a detailed, well-structured learning path with at least 4-6 sections, each containing 3-5 high-quality resources. Focus on practical, hands-on learning with a mix of theory and practice.`;

  return prompt;
}

/**
 * Generate a learning path using AI
 */
export async function generateLearningPath(params: {
  topic: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  goals?: string;
  model: string;
}): Promise<any> {
  const { topic, skillLevel, goals, model } = params;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(topic, skillLevel, goals);

  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }, // Enforce JSON output
      // OpenRouter-specific: Enable web search for real resources
      // @ts-ignore - OpenRouter extension
      transforms: ['web-search'],
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI model');
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error generating learning path:', error);
    throw error;
  }
}
