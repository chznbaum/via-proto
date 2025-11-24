# AI Prompt Engineering Improvements

This document outlines implemented improvements and future enhancements for the AI-powered learning path generation system.

## Status: Current Implementation (November 2024)

### ✅ Completed Improvements

1. **Revised System Prompt** (libs/jobs/tasks/generate-sections-resources.ts:31)
   - Restructured with visual hierarchy (separators, bold headings)
   - Web search requirement prominently placed at the top
   - Added mandatory 5-step research protocol for each resource
   - Explicit prohibition against using memorized/training data URLs
   - Pre-output verification checklist
   - Emphasis on resource recency (2022+ preferred)

2. **User Message Reinforcement** (libs/jobs/tasks/generate-sections-resources.ts:205)
   - Added critical reminder at start of user message
   - Included topic-specific search query examples
   - Reinforced web search requirement multiple times

3. **Temperature Adjustment** (libs/jobs/tasks/generate-sections-resources.ts:502)
   - Reduced from 0.7 to 0.3 to minimize URL hallucination
   - Lower temperature increases factual accuracy and reduces creativity/guessing

### Expected Results

These changes should significantly reduce:
- ❌ Dead/broken links from outdated training data
- ❌ Resources from pre-2022 without verification
- ❌ Hallucinated URLs that never existed
- ❌ Generic "remembered" resources over specific searched ones

And increase:
- ✅ Current, verified resources (2022+)
- ✅ Working URLs discovered via active web search
- ✅ Diverse, high-quality learning materials
- ✅ Free alternatives for paid resources

---

## Future Enhancement: URL Validation Logic

### Overview
Post-generation URL validation to catch dead links before saving resources to database.

### Implementation Approach

**Location**: `libs/jobs/tasks/generate-sections-resources.ts` (after line 471, before database insertion)

**Function**:
```typescript
/**
 * Validates resource URLs by attempting to fetch them
 * @param sections - Generated sections with resources
 * @returns Validation results with invalid URLs flagged
 */
async function validateResourceUrls(sections: Section[]): Promise<{
  valid: boolean;
  results: Array<{
    url: string;
    valid: boolean;
    statusCode?: number;
    error?: string;
  }>;
  invalidCount: number;
}> {
  const allResources = sections.flatMap(s => s.resources);

  console.log(`[URL Validation] Checking ${allResources.length} resource URLs...`);

  const results = await Promise.allSettled(
    allResources.map(async (resource) => {
      try {
        // Use HEAD request for efficiency (no body download)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(resource.url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow', // Follow redirects
          headers: {
            'User-Agent': 'ViaProto-URLValidator/1.0'
          }
        });

        clearTimeout(timeoutId);

        return {
          url: resource.url,
          valid: response.ok, // 200-299 status codes
          statusCode: response.status
        };
      } catch (error) {
        return {
          url: resource.url,
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  const validationResults = results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      url: 'unknown',
      valid: false,
      error: 'Promise rejected'
    };
  });

  const invalidUrls = validationResults.filter(r => !r.valid);

  if (invalidUrls.length > 0) {
    console.warn(`[URL Validation] Found ${invalidUrls.length} invalid URLs:`,
      invalidUrls.map(u => `${u.url} (${u.statusCode || u.error})`));
  } else {
    console.log(`[URL Validation] All ${allResources.length} URLs validated successfully`);
  }

  return {
    valid: invalidUrls.length === 0,
    results: validationResults,
    invalidCount: invalidUrls.length
  };
}
```

**Integration Point** (in generateSectionsResourcesTask, after line 471):
```typescript
// Step 8: Parse and validate response
const parsedResponse = parseSectionsResponse(responseText);
const sectionsData = SectionsResourcesResponseSchema.parse(parsedResponse);

console.log(`[generate_sections_resources] Validated ${sectionsData.sections.length} sections with resources`);

// NEW: Validate URLs before saving to database
const urlValidation = await validateResourceUrls(sectionsData.sections);

if (!urlValidation.valid) {
  const invalidPercentage = (urlValidation.invalidCount /
    sectionsData.sections.flatMap(s => s.resources).length * 100).toFixed(1);

  console.warn(`[generate_sections_resources] URL validation failed: ${urlValidation.invalidCount} invalid URLs (${invalidPercentage}%)`);

  // DECISION POINT: Choose one of these strategies:

  // Option A: REJECT - Retry entire generation if too many failures
  if (urlValidation.invalidCount > 3 || parseFloat(invalidPercentage) > 15) {
    throw new Error(`Too many invalid URLs (${urlValidation.invalidCount}). Regenerating...`);
  }

  // Option B: FILTER - Remove invalid resources, keep valid ones
  // sectionsData.sections.forEach(section => {
  //   section.resources = section.resources.filter(r =>
  //     urlValidation.results.find(vr => vr.url === r.url)?.valid
  //   );
  // });

  // Option C: FLAG - Save all but mark invalid ones
  // Store urlValidation.results in generation_metadata for manual review
}

// Continue with database insertion...
```

### Strategy Options

**Option A: Reject & Retry** (Recommended for initial rollout)
- **Pros**: Ensures high quality, leverages Graphile Worker's retry mechanism
- **Cons**: More AI API calls, longer generation time
- **Use When**: >15% failure rate or >3 invalid URLs
- **Implementation**: Throw error to trigger retry (max 3 attempts)

**Option B: Filter Invalid Resources**
- **Pros**: Faster, no regeneration needed
- **Cons**: May leave sections under-resourced (< 3 resources)
- **Use When**: Low failure rate (<10%), sections still have enough resources
- **Implementation**: Remove invalid resources, verify min 3 resources/section

**Option C: Flag for Review**
- **Pros**: Doesn't block path completion, allows manual curation
- **Cons**: Requires admin UI for reviewing flagged URLs
- **Use When**: Beta testing, gathering data on failure patterns
- **Implementation**: Store validation results in `generation_metadata`, add admin dashboard

### Configuration

```typescript
// config.ts - Add these constants
export const URL_VALIDATION = {
  ENABLED: true, // Feature flag
  TIMEOUT_MS: 5000, // Per-URL timeout
  MAX_INVALID_COUNT: 3, // Trigger regeneration if exceeded
  MAX_INVALID_PERCENTAGE: 15, // Trigger regeneration if exceeded
  RETRY_STRATEGY: 'reject' as 'reject' | 'filter' | 'flag'
} as const;
```

### Testing Checklist

Before enabling in production:
- [ ] Test with intentionally bad URLs
- [ ] Test with timeout scenarios (slow servers)
- [ ] Test with redirects (301/302)
- [ ] Test with rate-limited domains
- [ ] Test with various status codes (404, 403, 500)
- [ ] Measure impact on generation time
- [ ] Verify worker retry behavior

### Level of Effort: URL Validation

- **Implementation**: 2-3 hours
  - Write `validateResourceUrls` function (1h)
  - Integrate into task flow (30min)
  - Add configuration/feature flag (30min)
  - Error handling and logging (1h)

- **Testing**: 1-2 hours
  - Unit tests for validation function
  - Integration tests with real URLs
  - Error scenario testing

- **Total**: 3-5 hours

---

## Future Enhancement: Prompt Chaining Approach

### Overview
Split monolithic generation into 3 sequential steps for maximum reliability and control.

### Current Flow (1 Step)
```
Input: Topic + Metadata → [Single AI Call] → Output: Sections + Resources
```
**Problem**: AI must simultaneously:
- Research resources via web search
- Organize into logical sections
- Format as JSON
- Balance resource types
- Verify URLs

Too many cognitive tasks → hallucination risk

### Proposed Flow (3 Steps)

#### **Step 1: Research Phase** (New Job: `research_resources`)
**Goal**: Pure web search, gather 30-50 candidate resources

**Prompt**:
```typescript
function buildResearchPrompt(topicName: string, skillLevel: string): string {
  return `You are a learning resource researcher. Your ONLY task is to search the web and compile a comprehensive list of high-quality learning resources.

TOPIC: "${topicName}"
SKILL LEVEL: ${skillLevel}

RESEARCH REQUIREMENTS:
1. Use web search to find 30-50 current resources (2022+)
2. Include diverse types: videos, articles, books, projects, courses
3. Verify each URL is accessible
4. Mix of free and paid options
5. Range from beginner-friendly to advanced

For EACH resource, document:
- title: Exact title of the resource
- url: Full verified URL
- type: video|article|book|project|course|audio|graphic
- is_free: true|false
- publish_date: When it was published/last updated
- description: 1-2 sentences on content
- estimated_minutes: Time to complete (estimate)
- difficulty: beginner|intermediate|advanced

OUTPUT: JSON array of resources, no filtering or organization yet.

{
  "resources": [
    {
      "title": "...",
      "url": "https://...",
      "type": "video",
      "is_free": true,
      "publish_date": "2024-03",
      "description": "...",
      "estimated_minutes": 45,
      "difficulty": "beginner"
    },
    // ... 30-50 resources
  ]
}

CRITICAL: Every URL MUST be found via web search RIGHT NOW. Use these search queries:
- "${topicName} tutorial 2024"
- "${topicName} free course"
- "${topicName} project github"
- "${topicName} best practices guide"
- "${topicName} beginner guide"
- "${topicName} advanced techniques"

DO NOT use memorized URLs. Search and verify each one.`;
}
```

**Output**: Stored in `learning_paths.generation_metadata.researched_resources`

#### **Step 2: Curation Phase** (Modified Job: `generate_sections_resources`)
**Goal**: Organize researched resources into logical learning sections

**Prompt**:
```typescript
function buildCurationPrompt(
  researchedResources: Resource[],
  title: string,
  description: string,
  skillLevel: string
): string {
  return `You are a curriculum designer organizing pre-researched learning resources into a structured learning path.

PATH CONTEXT:
- Title: "${title}"
- Description: "${description}"
- Skill Level: ${skillLevel}

You have ${researchedResources.length} pre-researched, verified resources available (listed below). Your task is to organize them into 5-8 logical learning sections.

AVAILABLE RESOURCES:
${JSON.stringify(researchedResources, null, 2)}

ORGANIZATION REQUIREMENTS:
1. Create 5-8 sections with clear progression (foundational → advanced)
2. Select 3-7 resources per section from the available pool
3. Ensure each section has at least ONE hands-on project/practice resource
4. Balance free and paid resources
5. Mix resource types (videos, articles, projects, etc.)
6. Sections should build on each other logically
7. You MAY exclude resources that don't fit, but CANNOT add new ones

For EACH section:
- order: 1-8
- title: Clear topic
- description: What learners achieve
- prerequisite_level: required|recommended|optional
- notes: Strategic guidance or null
- estimated_hours: Total for section
- resources: Array of 3-7 resources selected from available pool (with same order within section)

OUTPUT: JSON with sections only

{
  "sections": [
    {
      "order": 1,
      "title": "...",
      "description": "...",
      "prerequisite_level": "required",
      "notes": "...",
      "estimated_hours": 5,
      "resources": [
        // Reference resources from the available pool by URL
        // Include: order, title, url, type, is_free, description, estimated_minutes
      ]
    }
  ],
  "total_estimated_hours": 45
}

IMPORTANT: Only use resources from the available pool. Do not invent new URLs.`;
}
```

**Input**: Pre-researched resources from Step 1
**Output**: Organized sections with resources

#### **Step 3: Validation Phase** (New Job: `validate_and_finalize`)
**Goal**: Final quality checks and database persistence

**Tasks**:
- Validate section/resource counts (5-8 sections, 3-7 resources each)
- Verify no new URLs were added
- Check resource type diversity
- Confirm free alternatives exist for paid resources
- Run URL validation (if enabled)
- Insert into database
- Update status to `completed`

### Implementation Architecture

**New Database Column**:
```sql
-- Add to learning_paths table
ALTER TABLE learning_paths
ADD COLUMN generation_metadata JSONB DEFAULT '{}'::jsonb;

-- Example structure:
{
  "researched_resources": [...], // From Step 1
  "resource_selection_reasoning": "...", // From Step 2
  "validation_results": {...}, // From Step 3
  "total_resources_researched": 47,
  "total_resources_selected": 28,
  "url_validation_failures": 2
}
```

**New Jobs**:
1. `research_resources` - Step 1
2. `generate_sections_resources` - Modified for Step 2
3. `validate_and_finalize` - Step 3

**Flow**:
```
generate_metadata → fetch_unsplash_image → research_resources →
generate_sections_resources → validate_and_finalize → completed
```

**Status Updates**:
```typescript
pending → generating_metadata → fetching_image → researching_resources →
curating_resources → validating → completed
```

### Advantages

✅ **Separation of Concerns**: Each step has one clear objective
✅ **Better Web Search**: Step 1 is 100% focused on search, not distracted by formatting
✅ **No Hallucination Risk**: Step 2 can only select from verified resources
✅ **Easier Debugging**: Can inspect intermediate results
✅ **Retry Granularity**: If Step 2 fails, don't need to redo Step 1 research
✅ **Quality Control**: Step 3 validates before committing to database
✅ **User Transparency**: Can show "researching..." → "organizing..." → "finalizing..." status

### Disadvantages

❌ **More Complexity**: 3 jobs instead of 1, more coordination
❌ **Longer Generation**: 3 sequential API calls (~30-45s longer)
❌ **More Tokens**: Research phase uses tokens to generate 30-50 resources (then filters to ~25)
❌ **Storage**: Need to store intermediate results in database
❌ **Migration**: Need to update existing flow without breaking in-progress generations

### Cost Analysis

**Current (1-Step)**:
- 1 API call: ~6,000 tokens input, ~4,000 tokens output = 10,000 total
- Cost (Claude Sonnet 4.5): ~$0.06/generation

**Proposed (3-Step)**:
- Research: ~2,000 input, ~8,000 output = 10,000 tokens
- Curate: ~10,000 input (includes researched resources), ~3,000 output = 13,000 tokens
- Validate: No AI call, just logic
- Total: ~23,000 tokens = **~2.3x current cost** (~$0.14/generation)

**Trade-off**: Pay 2.3x more for significantly higher quality and reliability

### Level of Effort: Prompt Chaining

- **Design & Planning**: 2-3 hours
  - Database schema updates
  - Job flow diagram
  - Prompt engineering for each step
  - Error handling strategy

- **Implementation**: 12-16 hours
  - Create `research_resources` task (4h)
  - Modify `generate_sections_resources` for curation (3h)
  - Create `validate_and_finalize` task (3h)
  - Update job queue flow (2h)
  - Migration strategy for in-progress paths (2h)
  - Update frontend status polling (2h)

- **Testing**: 4-6 hours
  - Test each step independently
  - Test full flow end-to-end
  - Test error scenarios and retries
  - Test with various topics and skill levels
  - Performance/cost analysis

- **Documentation**: 2 hours
  - Update CLAUDE.md
  - Update job documentation
  - Add code comments

- **Total**: **20-27 hours** (3-4 days of work)

### Recommendation

**Phase 1 (Completed)**: Prompt improvements + temperature adjustment + URL validation
- **Effort**: 3-5 hours
- **Risk**: Low
- **Expected Improvement**: 40-60% reduction in dead links

**Phase 2 (Fast-Follow)**: URL validation with reject strategy
- **Effort**: 3-5 hours
- **Risk**: Low-Medium
- **Expected Improvement**: 80-90% reduction in dead links
- **When**: After monitoring Phase 1 results for 1-2 weeks

**Phase 3 (Future)**: Full prompt chaining
- **Effort**: 20-27 hours
- **Risk**: Medium (architectural change)
- **Expected Improvement**: 95%+ link reliability, better resource quality
- **When**: If Phase 1+2 don't achieve <5% failure rate, or if we want premium quality

---

## Monitoring & Metrics

To measure effectiveness, track:

**Pre-Improvement Baseline** (Collect for 1 week):
- Total resources generated
- Dead link percentage (manual sampling or automated checks)
- Resources from pre-2022
- User-reported broken links

**Post-Improvement Metrics**:
- Dead link percentage (should drop to <10% immediately, <5% with validation)
- Resource recency (% from 2022+)
- Average publication date of resources
- Generation failures requiring retry
- User satisfaction with resource quality

**Logging**:
```typescript
// In generate-sections-resources.ts
console.log('[Metrics] Generation completed', {
  pathId,
  sectionsCount: sectionsData.sections.length,
  resourcesCount: totalResourcesCount,
  resourceTypes: /* count by type */,
  freeResourcesPercent: /* calculate */,
  avgResourceYear: /* calculate from URLs/metadata */,
  urlValidationFailures: urlValidation?.invalidCount || 0,
  generationTimeMs: Date.now() - startTime
});
```

---

## Testing Plan

### Phase 1 Testing (Current Implementation)
1. Generate 10 test paths across different topics
2. Manually check 30 random resource URLs (3 per path)
3. Note: publication dates, URL validity, source quality
4. Compare against previous generation quality
5. Iterate on prompt if <80% improvement

### Phase 2 Testing (URL Validation)
1. Test validation function with known bad URLs
2. Test with various HTTP status codes
3. Test timeout behavior
4. Test with 10 real path generations
5. Monitor retry rates and generation times

### Phase 3 Testing (Prompt Chaining)
1. Test each step independently
2. Test full flow end-to-end
3. Compare resource quality with Phase 1+2
4. A/B test: 50% old flow, 50% new flow
5. Measure cost, time, and quality differences

---

## Conclusion

**Immediate Impact**: Phase 1 improvements (completed) should dramatically reduce dead links through:
- Explicit web search requirements at prompt start
- Step-by-step research protocol
- Multiple reinforcements throughout prompt and user message
- Lower temperature for more factual responses

**Fast-Follow**: URL validation (3-5 hours) provides automated quality gate

**Future Premium**: Prompt chaining (20-27 hours) for near-perfect reliability if needed

**Recommendation**: Monitor Phase 1 results for 1-2 weeks, then decide if Phase 2/3 needed based on data.
