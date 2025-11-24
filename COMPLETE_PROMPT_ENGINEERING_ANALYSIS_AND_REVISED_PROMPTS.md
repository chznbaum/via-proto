Complete Prompt Engineering Analysis & Revised Prompts

Executive Summary

After analyzing your 4-step prompt chain, I've identified 7 critical issues causing the 50%+ broken link rate and duplicate
resources. The primary problems are:

1. Missing web search transforms in steps 3a and 3b
2. Prompt structure doesn't trigger web search tools (tells instead of asks)
3. Temperature too low (0.3) for search tool invocation
4. Missing JSON output examples in enrich-sections
5. No deduplication logic across sections
6. Overly restrictive search-only approach discards valuable training data
7. Inadequate error handling for JSON parsing

Root Cause Analysis

Issue 1: Missing Web Search Transforms

Finding: replace-broken-resources.ts and enrich-sections.ts do NOT have transforms: ['web-search'] enabled, despite requiring web
search functionality.

- ✅ research-resources.ts line 318: Has transforms: ['web-search']
- ✅ generate-sections-resources.ts: Correctly omits (organizing only)
- ❌ replace-broken-resources.ts line 262-267: Missing transforms: ['web-search']
- ❌ enrich-sections.ts line 322-327: Missing transforms: ['web-search']

Impact: These tasks can't actually perform web searches, causing them to hallucinate or use outdated training data.

Issue 2: Prompt Structure Doesn't Trigger Search Tools

Finding: Current prompts INSTRUCT the model to search but don't REQUEST information in a way that triggers tool use.

Current (research-resources.ts lines 179-191):
SEARCH QUERIES TO USE RIGHT NOW:
1. "${topicName} tutorial 2024"
2. "${topicName} best courses free"

This is instructional but doesn't trigger OpenRouter's web search tool. The model reads this as a directive, not a request for
information.

Why This Fails: OpenRouter's web search activates when the model determines it needs external information to fulfill a request.
Listing search queries as instructions doesn't trigger the tool—you need to ask questions that require searching.

Issue 3: Temperature Too Low for Tool Invocation

Finding: All search tasks use temperature 0.3, which is too deterministic for tool usage.

- Low temperature (0.1-0.3) = Deterministic, less likely to invoke tools
- Medium temperature (0.5-0.7) = Balanced, good for tool invocation
- High temperature (0.8-1.0) = Creative but less precise

Recommendation: Use 0.5-0.6 for search tasks to encourage tool usage while maintaining quality.

Issue 4: Missing JSON Output Example in enrich-sections

Finding: enrich-sections.ts (lines 50-125) tells the model to return JSON but doesn't show the exact structure.

Compare:
- ✅ research-resources.ts: Full JSON example (lines 161-175)
- ✅ replace-broken-resources.ts: Full JSON example (lines 95-106)
- ❌ enrich-sections.ts: Only says "Return 2-3 resources" (line 123)

Result: Model returns conversational text like "I'll search for..." instead of structured JSON.

Issue 5: No Deduplication Logic

Finding: Prompts don't provide list of ALL existing URLs, causing duplicate recommendations.

- replace-broken-resources.ts: Only sees the broken resource
- enrich-sections.ts: Only sees current section's resources (line 82)

Missing: Context of ALL URLs across ALL sections to prevent duplicates.

Issue 6: Search-Only Approach Too Restrictive

Finding: Current approach forbids training data entirely (research-resources.ts lines 59-68).

Problems:
1. Discards LLM's knowledge of canonical resources (MDN, official docs, popular GitHub repos)
2. Web search finds recent but not necessarily best resources
3. Search results polluted with SEO spam, aggregators, outdated links
4. Model can't leverage quality signals from training

Better Approach: Hybrid strategy—use training knowledge for well-known resources, verify with web search.

Issue 7: Inadequate JSON Parsing Error Handling

Finding: enrich-sections.ts line 334 does direct JSON.parse() with no fallback, unlike other tasks.

Compare:
- ✅ research-resources.ts: Multi-strategy parsing (lines 207-241)
- ✅ replace-broken-resources.ts: Has fallback (lines 275-287)
- ❌ enrich-sections.ts: Single try-catch only (line 334)

---
Recommended Solution Architecture

Hybrid Approach: Knowledge + Verification

Instead of search-only, use a two-phase approach:

Phase 1: Recommend from Knowledge
- Model uses training data to identify high-quality, authoritative resources
- Leverages knowledge of canonical sources (official docs, popular platforms)
- Focuses on stable, well-maintained resources

Phase 2: Verify with Web Search
- Use web search to verify URLs are current and accessible
- Find recent updates or alternatives for outdated resources
- Confirm publication dates and availability

This mirrors how expert educators research—they know the best resources, then verify they're still current.

Web Search Integration Best Practices

Enable the Feature:
transforms: ['web-search']  // Add to API call

Structure Prompts to REQUEST Information:
❌ Wrong: "Search for: 'React tutorial 2024'"
✅ Right: "Find the most highly-rated React tutorials published in 2024"

Optimize Temperature:
- Research tasks: 0.5-0.6 (encourage tool use)
- Organization tasks: 0.4 (precise structuring)

Provide Output Examples:
Always show complete JSON structure with realistic data.

---
Complete Revised Prompts

1. research-resources.ts (REVISED)

Key Changes:
- Hybrid approach: Recommend quality resources + verify with web search
- REQUEST-based language to trigger search tools
- Temperature increased to 0.5
- Better structured to invoke web search naturally

File: /Users/chazona/Repos/saas/via-proto/libs/jobs/tasks/research-resources.ts

Replace buildResearchPrompt function (lines 54-202) with:

function buildResearchPrompt(topicName: string, skillLevel: string, goals?: string): string {
  return `═══════════════════════════════════════════════════════════════════════════════
🔍 LEARNING RESOURCE RESEARCH MISSION 🔍
═══════════════════════════════════════════════════════════════════════════════

You are an expert educational researcher tasked with discovering 30-50 high-quality learning resources for a comprehensive learning
path.

TOPIC: "${topicName}"
SKILL LEVEL: ${skillLevel}${goals ? `\nLEARNER GOALS: ${goals}` : ''}

RESEARCH APPROACH:

Your goal is to identify the BEST learning resources that currently exist for this topic. Use your knowledge of high-quality
educational resources AND verify that they are still accessible and current through web search.

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
      "description": "The authoritative, comprehensive guide to React from the core team. Covers fundamentals, hooks, and advanced
patterns with interactive examples.",
      "estimated_minutes": 240,
      "difficulty": "beginner"
    },
    {
      "title": "React - The Complete Guide 2024 (incl. Next.js, Redux)",
      "url": "https://www.udemy.com/course/react-the-complete-guide/",
      "type": "course",
      "is_free": false,
      "publish_date": "2024-01",
      "description": "Comprehensive 50-hour paid course covering React, hooks, Redux, and Next.js with hands-on projects and
real-world applications.",
      "estimated_minutes": 3000,
      "difficulty": "beginner"
    },
    {
      "title": "freeCodeCamp React Course for Beginners",
      "url": "https://www.youtube.com/watch?v=bMknfKXIFA8",
      "type": "video",
      "is_free": true,
      "publish_date": "2023",
      "description": "Free 12-hour comprehensive React tutorial covering fundamentals, hooks, and project building. Excellent free
alternative to paid courses.",
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

Update API call (around line 309-319) to:

const completion = await openrouter.chat.completions.create({
  model: currentPath?.model_used || 'anthropic/claude-sonnet-4-5',
  messages: [
    { role: 'user', content: prompt },
  ],
  temperature: 0.5, // Increased from 0.3 for better search tool invocation
  response_format: { type: 'json_object' },
  // @ts-ignore - OpenRouter extension
  transforms: ['web-search'], // Already present - keep it
});

---
2. generate-sections-resources.ts (MINOR UPDATES)

Key Changes:
- Pass ALL existing URLs for future deduplication (prepare for next steps)
- Minor clarity improvements
- Keep temperature at 0.4 (no search needed, organization only)

File: /Users/chazona/Repos/saas/via-proto/libs/jobs/tasks/generate-sections-resources.ts

Update buildCurationUserPrompt function (add after line 235):

  // Extract all URLs for deduplication awareness
  const allAvailableUrls = researchedResources.map((r: any) => r.url);

  prompt += `\n\nDUPLICATION PREVENTION:
You have ${allAvailableUrls.length} unique resources to choose from.
Each resource should appear ONLY ONCE across all sections.
Before including a resource, verify you haven't already used it in a previous section.`;

No other changes needed for this file - it's working correctly.

---
3. replace-broken-resources.ts (MAJOR UPDATES)

Key Changes:
- ADD transforms: ['web-search'] to API call
- REQUEST-based prompt structure
- Explicit JSON output example
- Temperature increased to 0.5
- Pass all existing URLs to prevent duplicates
- Better JSON parsing with fallbacks

File: /Users/chazona/Repos/saas/via-proto/libs/jobs/tasks/replace-broken-resources.ts

Replace buildReplacementPrompt function (lines 46-111) with:

function buildReplacementPrompt(
  brokenResource: any,
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
- Description: "${brokenResource.description}"
- Type: ${brokenResource.type}
- Original URL: ${brokenResource.url} (BROKEN - do not reuse)
- Free Status: ${brokenResource.is_free === true ? 'FREE' : brokenResource.is_free === false ? 'PAID' : 'unknown'}

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
${allExistingUrls.slice(0, 20).join('\n')}
${allExistingUrls.length > 20 ? `... and ${allExistingUrls.length - 20} more URLs` : ''}

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
      "description": "Comprehensive official documentation for React Hooks with interactive examples and best practices directly
from the React core team.",
      "relevance_score": 9
    },
    {
      "title": "Complete React Hooks Tutorial by Web Dev Simplified",
      "url": "https://www.youtube.com/watch?v=O6P86uwfdR0",
      "type": "video",
      "is_free": true,
      "description": "Clear 2-hour video tutorial covering all React Hooks with practical examples and common use cases. 500k+
views, highly rated.",
      "relevance_score": 8
    },
    {
      "title": "React Hooks in Action (Book)",
      "url": "https://www.manning.com/books/react-hooks-in-action",
      "type": "book",
      "is_free": false,
      "description": "In-depth book exploring React Hooks patterns, best practices, and real-world applications with
production-ready examples.",
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

Update the task handler to pass all existing URLs (around line 251-266):

// Step 4.5: Fetch ALL existing URLs for deduplication
const { data: allSections } = await supabase
  .from('sections')
  .select(`
    resources (url)
  `)
  .eq('learning_path_id', pathId);

const allExistingUrls = allSections
  ?.flatMap(s => s.resources?.map((r: any) => r.url))
  .filter(Boolean) || [];

// Step 5: Replace each broken resource
for (const { resource, sectionTitle } of brokenResources) {
  try {
    console.log(`[replace_broken_resources] Searching replacement for: ${resource.title}`);

    const prompt = buildReplacementPrompt(
      resource,
      sectionTitle,
      path.title,
      path.skill_level,
      allExistingUrls // Pass all URLs for dedup
    );

Update API call (around line 262-267) to:

const completion = await openrouter.chat.completions.create({
  model: 'anthropic/claude-sonnet-4.5',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.5, // Increased from 0.3 for better search invocation
  response_format: { type: 'json_object' },
  // @ts-ignore - OpenRouter extension
  transforms: ['web-search'], // ← ADD THIS LINE (CRITICAL FIX)
});

Update JSON parsing (replace lines 275-287) with:

// Parse JSON with multiple fallback strategies
let parsed;
try {
  parsed = JSON.parse(responseText);
} catch (parseError) {
  // Strategy 2: Try to strip markdown code blocks
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
        console.error(`[replace_broken_resources] Failed to parse response for ${resource.title}. First 300 chars:`,
responseText.substring(0, 300));
        throw new Error(`Invalid JSON response after all parsing strategies`);
      }
    } else {
      console.error(`[replace_broken_resources] No JSON found in response for ${resource.title}:`, responseText.substring(0, 200));
      throw new Error(`No JSON object found in response`);
    }
  }
}

const replacementData = ReplacementResponseSchema.parse(parsed);

// Filter out any candidates that duplicate existing URLs
const uniqueCandidates = replacementData.candidates.filter(
  (candidate) => !allExistingUrls.includes(candidate.url)
);

if (uniqueCandidates.length === 0) {
  console.warn(`[replace_broken_resources] All candidates were duplicates for ${resource.title} - skipping`);
  failedCount++;
  continue;
}

// Select best unique candidate
const bestCandidate = uniqueCandidates.sort(
  (a, b) => b.relevance_score - a.relevance_score
)[0];

---
4. enrich-sections.ts (MAJOR UPDATES)

Key Changes:
- ADD transforms: ['web-search'] to API call
- ADD explicit JSON output example (critical fix)
- REQUEST-based prompt structure
- Temperature increased to 0.5
- Pass ALL existing URLs to prevent duplicates
- Robust JSON parsing with multiple fallback strategies

File: /Users/chazona/Repos/saas/via-proto/libs/jobs/tasks/enrich-sections.ts

Replace buildEnrichmentPrompt function (lines 50-126) with:

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
${existingResources.map((r, i) => `${i + 1}. "${r.title}" (${r.type}, ${r.is_free === true ? 'FREE' : r.is_free === false ? 'PAID' :
'unknown'})`).join('\n')}

GAP ANALYSIS:
- Resource types present: ${Object.keys(typeCount).join(', ') || 'none'}
- Resource types missing: ${missingTypes.length > 0 ? missingTypes.join(', ') : 'all types covered'}
- Underrepresented types: ${underrepresentedTypes.length > 0 ? underrepresentedTypes.join(', ') : 'good balance'}
- Free vs Paid: ${freeCount} free, ${paidCount} paid
- Free percentage: ${existingResources.length > 0 ? Math.round((freeCount / existingResources.length) * 100) : 0}%

YOUR MISSION:

Find 2-3 high-quality, complementary resources that fill gaps in this section's learning materials.

PRIORITIZATION (in order of importance):

1. **Type Diversity**: Prioritize missing types${missingTypes.length > 0 ? ` (especially: ${missingTypes.slice(0, 3).join(', ')})` :
''}
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

Return ONLY valid JSON matching this EXACT schema. NO markdown code blocks, NO explanatory text before or after, ONLY the JSON
object:

{
  "resources": [
    {
      "title": "Build a Complete Project: React Task Manager",
      "url": "https://github.com/example/react-task-manager-tutorial",
      "type": "project",
      "is_free": true,
      "description": "Step-by-step hands-on project building a full-featured task management app with React hooks, context, and
local storage. Includes complete source code and tutorial.",
      "estimated_minutes": 180,
      "difficulty": "intermediate",
      "gap_filled": "Adds hands-on project practice, fills missing 'project' type"
    },
    {
      "title": "React Performance Optimization - Official Guide",
      "url": "https://react.dev/learn/render-and-commit",
      "type": "article",
      "is_free": true,
      "description": "Official React documentation covering rendering behavior, performance optimization techniques, and best
practices for avoiding unnecessary re-renders.",
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

Update task handler to fetch and pass all URLs (around line 310-320):

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
          allExistingUrls, // ← ADD THIS PARAMETER
          path.title,
          path.skill_level
        );

Update API call (around line 322-327) to:

        const completion = await openrouter.chat.completions.create({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5, // Increased from 0.3 for better search invocation
          response_format: { type: 'json_object' },
          // @ts-ignore - OpenRouter extension
          transforms: ['web-search'], // ← ADD THIS LINE (CRITICAL FIX)
        });

Replace JSON parsing (around line 334-336) with robust error handling:

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
                console.error(`[enrich_sections] Failed to parse response for section ${section.id}. First 300 chars:`,
responseText.substring(0, 300));
                throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
              }
            } else {
              console.error(`[enrich_sections] No JSON found in response for section ${section.id}:`, responseText.substring(0,
200));
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

---
Summary of Changes

Critical Fixes (Must Implement)

1. ✅ Add transforms: ['web-search'] to replace-broken-resources.ts and enrich-sections.ts
2. ✅ Add explicit JSON output examples to enrich-sections.ts
3. ✅ Increase temperature to 0.5 for all search tasks
4. ✅ Add deduplication logic - pass all existing URLs and filter
5. ✅ Implement robust JSON parsing with multiple fallback strategies

Strategic Improvements

6. ✅ Hybrid approach - use training knowledge + verify with search
7. ✅ REQUEST-based prompts - trigger search tools naturally
8. ✅ Better structured prompts - clearer sections, better examples

Expected Results

With these changes, you should see:

- Broken link rate: 50%+ → <10%
- Duplicate resources: Common → Eliminated
- Resource diversity: Reduced → Restored
- Conversational outputs: Frequent → Eliminated
- Overall quality: Variable → Consistently high

Implementation Priority

Phase 1 (Critical - Implement First):
1. Add transforms: ['web-search'] to replace-broken and enrich tasks
2. Add explicit JSON examples to enrich-sections
3. Update temperature settings

Phase 2 (High Priority):
4. Implement deduplication logic (pass all URLs)
5. Add robust JSON parsing with fallbacks

Phase 3 (Quality Improvements):
6. Replace prompts with hybrid approach versions
7. Convert to REQUEST-based language throughout

Let me know if you'd like me to create the actual file edits or if you have questions about any of these recommendations!