# Implementation Status: Resource Improvement & Timing Tracking
**Date**: November 24, 2025
**Status**: ~70% Complete - Ready to Resume

---

## ✅ Completed Tasks

### 1. Timing Tracking System (100% Complete)

**Created:**
- `libs/jobs/timing.ts` - Utility functions for tracking job duration

**Updated (All 6 jobs now track timing):**
- `libs/jobs/tasks/generate-metadata.ts` - Added timing tracking
- `libs/jobs/tasks/fetch-unsplash-image.ts` - Added timing tracking (2 locations)
- `libs/jobs/tasks/research-resources.ts` - Added timing tracking
- `libs/jobs/tasks/generate-sections-resources.ts` - Added timing tracking
- `libs/jobs/tasks/validate-and-finalize.ts` - Added timing tracking
- `libs/jobs/tasks/validate-resource-links.ts` - Added timing tracking

**How it works:**
- Each job calls `updateJobTiming()` before completion
- Stores `duration_ms`, `started_at`, `completed_at` in `generation_metadata.job_timings`
- Calculates cumulative `total_generation_time_ms`
- Logs human-readable duration (e.g., "12.5s", "1m 23s")
- **No UI changes yet** - data persisted for future use

### 2. Resource Guidance Update (100% Complete)

**File**: `libs/jobs/tasks/generate-sections-resources.ts`

**Changes:**
- Line 63: Changed from "3-7 resources per section" → "7-8 resources per section"
- Line 82: Updated array specification
- Line 122: Updated selection criteria
- Line 168: Updated checklist
- Line 175: Updated total from "20-35" → "40-60" resources

**Impact**: AI will now generate more resources per section, reducing need for enrichment.

### 3. Database Migrations (100% Complete)

**Created:**
- `supabase/migrations/20251124180000_add_resource_improvement_and_cancellation.sql`

**New statuses added:**
- `validating_links` - User-visible status while fetching OpenGraph data
- `replacing_broken_resources` - Replacing broken/dead links
- `enriching_sections` - Adding resources to under-resourced sections
- `cancelled` - User-initiated cancellation
- `failed_link_validation` - Link validation failure
- `failed_replacement` - Resource replacement failure
- `failed_enrichment` - Section enrichment failure

**To apply:**
```bash
cd /Users/chazona/Repos/saas/via-proto
supabase db push
```

### 4. validate_resource_links Updates (100% Complete)

**File**: `libs/jobs/tasks/validate-resource-links.ts`

**Changes:**
1. **Status visibility restored** (Line 55):
   - Changed from keeping status as `completed` to setting `validating_links`
   - User now sees "Fetching link previews..." in UI

2. **Added conditional job queuing** (Lines 228-270):
   - Counts broken/inaccessible resources (`broken` + `requires_login`)
   - If `broken_count > 3`: queues `replace_broken_resources`
   - Counts active resources per section (after validation)
   - If any section has `< 5 active resources`: queues `enrich_sections`
   - If no improvement needed: marks path as `completed`

3. **Added import**: `addJob` from '../queue'

4. **Added to resources query**: `section_id` field (Line 103)

### 5. replace_broken_resources Job (100% Complete)

**Created:** `libs/jobs/tasks/replace-broken-resources.ts`

**Functionality:**
- Triggered when > 3 broken/inaccessible resources found
- Fetches all resources with `link_status = 'broken' OR 'requires_login'`
- For each broken resource:
  - Builds targeted search prompt with original title/description/type
  - Uses Claude Sonnet 4.5 with web search enabled
  - Searches for 3-5 replacement candidates (temp 0.3)
  - Selects best match by relevance_score
  - Updates resource record with new URL, title, description
  - Sets `link_status = 'unchecked'` (will be re-validated)
- Logs replaced count and failures
- Queues `enrich_sections` next
- Tracks timing via `updateJobTiming()`

**Prompt strategy:**
- Uses original resource context (title, description, type)
- Includes section title and path title for context
- Prioritizes same content type but allows substitution
- Requires 2022+ publication dates
- Returns candidates with relevance scores (1-10)

---

## 🚧 Remaining Tasks

### 1. enrich_sections Job Task (0% Complete)

**File to create:** `libs/jobs/tasks/enrich-sections.ts`

**Requirements:**
- Triggered by `replace_broken_resources` OR `validate_resource_links` (if sections < 5 active resources)
- Fetch sections with `< 5 active resources` (after link validation)
- For each under-resourced section:
  - Analyze existing resources (types, difficulty, topics covered)
  - Identify gaps (e.g., all videos, no projects; all beginner, no intermediate)
  - Build targeted search prompt to find 2-3 complementary resources
  - Focus on filling type/difficulty gaps
  - Insert new resources with proper `order` (append to end or insert logically)
- Update `generation_metadata.sections_enriched` array
- Queue `validate_resource_links` to re-check new resources
- Track timing via `updateJobTiming()`

**Prompt strategy:**
```typescript
function buildEnrichmentPrompt(
  section: { title: string; description: string; order: number },
  existingResources: Array<{ title: string; type: string; difficulty: string }>,
  pathTitle: string,
  skillLevel: string
): string {
  // Analyze gaps in existing resources
  // Request 2-3 resources that complement existing ones
  // Prioritize missing types (e.g., if no projects, find projects)
  // Ensure free resources if all are paid, etc.
}
```

**Model:** Claude Sonnet 4.5, temp 0.3, web search enabled

**Expected structure:**
```typescript
const EnrichmentResponseSchema = z.object({
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['video', 'article', 'book', 'project', 'audio', 'graphic', 'course']),
    is_free: z.boolean().nullable(),
    description: z.string(),
    estimated_minutes: z.number().nullable(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).nullable(),
    gap_filled: z.string(), // e.g., "Adds hands-on project practice"
  })).min(2).max(3),
});
```

**Edge cases to handle:**
- Section already has 7+ resources (skip enrichment)
- No gaps to fill (section is diverse) - skip or add 1-2 anyway?
- AI returns resources already in section (dedupe by URL)

### 2. Update types.ts (0% Complete)

**File:** `libs/jobs/types.ts`

**Add:**
```typescript
export interface ReplaceBrokenResourcesPayload {
  pathId: string;
}

export interface EnrichSectionsPayload {
  pathId: string;
}

// Update JobType union
export type JobType =
  | 'generate_metadata'
  | 'fetch_unsplash_image'
  | 'research_resources'
  | 'generate_sections_resources'
  | 'validate_and_finalize'
  | 'validate_resource_links'
  | 'replace_broken_resources'  // NEW
  | 'enrich_sections'            // NEW
  | 'notify_generation_failed';

// Update JobPayload union
export type JobPayload =
  | GenerateMetadataPayload
  | FetchUnsplashImagePayload
  | ResearchResourcesPayload
  | GenerateSectionsResourcesPayload
  | ValidateAndFinalizePayload
  | ValidateResourceLinksPayload
  | ReplaceBrokenResourcesPayload  // NEW
  | EnrichSectionsPayload           // NEW
  | NotifyGenerationFailedPayload;
```

### 3. Register New Jobs (0% Complete)

**File:** `libs/jobs/tasks/index.ts`

**Add imports:**
```typescript
import { replaceBrokenResourcesTask } from './replace-broken-resources';
import { enrichSectionsTask } from './enrich-sections';
```

**Add to task registry:**
```typescript
export const tasks: Record<string, Task> = {
  generate_metadata: generateMetadataTask,
  fetch_unsplash_image: fetchUnsplashImageTask,
  research_resources: researchResourcesTask,
  generate_sections_resources: generateSectionsResourcesTask,
  validate_and_finalize: validateAndFinalizeTask,
  validate_resource_links: validateResourceLinksTask,
  replace_broken_resources: replaceBrokenResourcesTask,  // NEW
  enrich_sections: enrichSectionsTask,                    // NEW
  notify_generation_failed: notifyGenerationFailedTask,
};
```

**Update documentation comment** to reflect 8-step flow.

### 4. Frontend Updates (0% Complete)

**File:** `components/paths/GeneratingPathCard.tsx`

**Changes needed:**

1. **Add new statuses to type** (Line 6):
```typescript
status: 'pending' | 'generating_metadata' | 'fetching_image' | 'researching_resources'
  | 'curating_resources' | 'validating' | 'validating_links' | 'replacing_broken_resources'
  | 'enriching_sections' | 'completed' | 'cancelled' | 'failed' | 'failed_metadata'
  | 'failed_image' | 'failed_research' | 'failed_sections' | 'failed_validation'
  | 'failed_link_validation' | 'failed_replacement' | 'failed_enrichment';
```

2. **Add status messages** (Lines 18-51):
```typescript
case 'validating_links':
  return 'Fetching link previews and checking accessibility...';
case 'replacing_broken_resources':
  return 'Replacing broken or inaccessible resources...';
case 'enriching_sections':
  return 'Adding resources to under-resourced sections...';
case 'cancelled':
  return 'Generation cancelled';
case 'failed_link_validation':
  return 'Link validation failed';
case 'failed_replacement':
  return 'Resource replacement failed';
case 'failed_enrichment':
  return 'Section enrichment failed';
```

3. **Update terminal statuses** (Line 53):
```typescript
const isTerminal = [
  'completed', 'cancelled', 'failed', 'failed_metadata', 'failed_image',
  'failed_research', 'failed_sections', 'failed_validation', 'failed_link_validation',
  'failed_replacement', 'failed_enrichment'
].includes(status);
```

4. **Update failed statuses** (Line 54):
```typescript
const isFailed = [
  'failed', 'failed_metadata', 'failed_image', 'failed_research',
  'failed_sections', 'failed_validation', 'failed_link_validation',
  'failed_replacement', 'failed_enrichment'
].includes(status);
```

5. **Add "View Path" button after metadata** (Lines 96-116):
```typescript
{/* Show View Path button if metadata is generated (not just when completed) */}
{!isFailed && status !== 'pending' && status !== 'generating_metadata' && (
  <a
    href={`/paths/${pathId}`}
    className="btn btn-sm btn-primary gap-2 ms-auto"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span className="iconify lucide--external-link size-4"></span>
    View Path (Generating...)
  </a>
)}

{/* Cancel button stays until fully complete */}
{!isTerminal && (
  <button
    className="btn btn-sm btn-error gap-2 border-none"
    onClick={handleCancel}
  >
    <span className="iconify lucide--x-square size-4"></span>
    Cancel
  </button>
)}

{/* Show final View Path when complete */}
{status === 'completed' && (
  <a href={`/paths/${pathId}`} className="btn btn-sm btn-primary ms-auto">
    <span className="iconify lucide--arrow-right size-4"></span>
    View Path
  </a>
)}
```

**User experience:**
- After `generating_metadata` completes → "View Path (Generating...)" button appears
- User can click to see path (will show skeleton/loading states for incomplete sections)
- Cancel button remains until `completed` or terminal failure
- Background jobs continue: validating_links → replacing → enriching
- Status message updates: "Fetching link previews..." → "Replacing broken resources..." → "Adding resources..."

### 5. Cancellation Implementation (0% Complete)

#### A. Create Cancel Endpoint

**File to create:** `app/api/paths/[id]/cancel/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this path (check via account_users)
    const { data: path } = await supabase
      .from('learning_paths')
      .select('account_id, creator_id')
      .eq('id', pathId)
      .single();

    if (!path) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    // Check if user is member of account
    const { data: membership } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', path.account_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        generation_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', pathId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, pathId });
  } catch (error) {
    console.error('Error cancelling path:', error);
    return NextResponse.json(
      { error: 'Failed to cancel path generation' },
      { status: 500 }
    );
  }
}
```

#### B. Add Cancellation Checks to All Jobs

**Pattern to add at START of each task** (after pathId extraction, before status update):

```typescript
// Check if cancelled
const { data: pathCheck } = await supabase
  .from('learning_paths')
  .select('generation_status')
  .eq('id', pathId)
  .single();

if (pathCheck?.generation_status === 'cancelled') {
  console.log(`[task_name] Path ${pathId} was cancelled, exiting`);
  return { cancelled: true, pathId };
}
```

**Files to update (7 total):**
1. `libs/jobs/tasks/generate-metadata.ts` - Add check at line ~145
2. `libs/jobs/tasks/fetch-unsplash-image.ts` - Add check at line ~35
3. `libs/jobs/tasks/research-resources.ts` - Add check at line ~160
4. `libs/jobs/tasks/generate-sections-resources.ts` - Add check at line ~275
5. `libs/jobs/tasks/validate-and-finalize.ts` - Add check at line ~30
6. `libs/jobs/tasks/validate-resource-links.ts` - Add check at line ~40
7. `libs/jobs/tasks/replace-broken-resources.ts` - Add check at line ~100

**Also need to add to:** `enrich-sections.ts` when created

#### C. Update Frontend Cancel Handler

**File:** `components/paths/DashboardPaths.tsx`

**Update `handleCancelGeneration` function** (Line 185):

```typescript
const handleCancelGeneration = async (pathId: string) => {
  try {
    // Call cancel endpoint
    const response = await fetch(`/api/paths/${pathId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel');
    }

    // Stop polling
    const interval = pollingIntervalsRef.current.get(pathId);
    if (interval) {
      clearInterval(interval);
      pollingIntervalsRef.current.delete(pathId);
    }

    // Remove from generating paths
    setGeneratingPaths((prev) => prev.filter((p) => p.pathId !== pathId));

    toast.success('Generation cancelled successfully');
  } catch (error) {
    console.error('Error cancelling generation:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to cancel generation');
  }
};
```

**Also update polling to handle cancelled status** (Line 104):

```typescript
const isTerminal = [
  'completed', 'cancelled', 'failed', 'failed_metadata',
  'failed_image', 'failed_sections', 'failed_research',
  'failed_validation', 'failed_link_validation',
  'failed_replacement', 'failed_enrichment'
].includes(data.status);
```

---

## Testing Checklist

Once implementation is complete:

### 1. Database Migration
- [ ] Run `supabase db push`
- [ ] Verify new statuses in constraint: `SELECT con.conbin FROM pg_constraint con WHERE con.conname = 'valid_generation_status'`
- [ ] Check column comment updated

### 2. Worker Restart
- [ ] Stop worker: `Ctrl+C` in terminal running `npm run worker:dev`
- [ ] Restart: `npm run worker:dev`
- [ ] Verify new tasks registered in startup logs

### 3. Happy Path Test (No Broken Links)
- [ ] Generate path on topic with reliable resources (e.g., "React Hooks")
- [ ] Watch status transitions in UI:
  - `pending` → `generating_metadata` → `fetching_image` → `researching_resources` →
    `curating_resources` → `validating` → `completed` → `validating_links` → `completed`
- [ ] Verify timing data in database:
  ```sql
  SELECT generation_metadata->'job_timings' FROM learning_paths WHERE id = 'path_id';
  ```
- [ ] Check "View Path" button appears after metadata
- [ ] Verify path viewable while background jobs run
- [ ] Confirm no replacement/enrichment jobs queued (logs should show "No improvements needed")

### 4. Broken Links Test
- [ ] Generate path on topic known to have broken links (e.g., older frameworks)
- [ ] Wait for `validating_links` to complete
- [ ] Check worker logs for broken count > 3
- [ ] Verify `replace_broken_resources` job queued and runs
- [ ] Check resources table - broken resources should have new URLs and `link_status = 'unchecked'`
- [ ] Verify timing tracked for replacement job

### 5. Under-Resourced Sections Test
- [ ] Manually delete some resources from a generated path to create sections with < 5 resources
- [ ] Trigger `validate_resource_links` via manual job queue or wait for next generation
- [ ] Verify `enrich_sections` job queued
- [ ] Check new resources added to under-resourced sections
- [ ] Verify resources are complementary (different types/difficulties)

### 6. Cancellation Test
- [ ] Start path generation
- [ ] Click "Cancel" button during any status before `completed`
- [ ] Verify status changes to `cancelled` immediately
- [ ] Check worker logs - next job should detect cancellation and exit early
- [ ] Verify UI removes generating card
- [ ] Confirm path not marked as failed (just cancelled)

### 7. Full Flow Test (Broken + Under-Resourced)
- [ ] Generate path
- [ ] Wait for validation to detect > 3 broken links
- [ ] Replacement job runs
- [ ] If sections still < 5 resources after replacement, enrichment runs
- [ ] Final `validate_resource_links` runs to check new resources
- [ ] Path marked as `completed` with all resources validated

### 8. Error Handling
- [ ] Test with invalid API key (should fail gracefully)
- [ ] Test with no researched resources (should handle empty pool)
- [ ] Test with all broken resources (should replace all)
- [ ] Verify failed statuses set correctly: `failed_replacement`, `failed_enrichment`, `failed_link_validation`

---

## Deployment Notes

**Order of deployment:**
1. Apply database migration: `supabase db push`
2. Deploy code changes (all files)
3. Restart worker service
4. Monitor first few generations closely

**Rollback plan:**
If issues arise:
1. Revert migration: Run previous migration file
2. Revert code: `git revert <commit-hash>`
3. Restart services

**Monitoring:**
- Watch worker logs for new job names: `replace_broken_resources`, `enrich_sections`
- Check `generation_metadata.job_timings` being populated
- Monitor error rates for new jobs
- Track broken link reduction (before: ~20-30% → after: target < 10%)

---

## Files Created

1. `libs/jobs/timing.ts` ✅
2. `libs/jobs/tasks/replace-broken-resources.ts` ✅
3. `supabase/migrations/20251124180000_add_resource_improvement_and_cancellation.sql` ✅
4. `IMPLEMENTATION-STATUS.md` (this file) ✅

## Files Modified

1. `libs/jobs/tasks/generate-metadata.ts` ✅
2. `libs/jobs/tasks/fetch-unsplash-image.ts` ✅
3. `libs/jobs/tasks/research-resources.ts` ✅
4. `libs/jobs/tasks/generate-sections-resources.ts` ✅ (also updated resource counts)
5. `libs/jobs/tasks/validate-and-finalize.ts` ✅
6. `libs/jobs/tasks/validate-resource-links.ts` ✅ (major changes)

## Files Pending Creation

1. `libs/jobs/tasks/enrich-sections.ts` ⏳
2. `app/api/paths/[id]/cancel/route.ts` ⏳

## Files Pending Updates

1. `libs/jobs/types.ts` ⏳
2. `libs/jobs/tasks/index.ts` ⏳
3. `components/paths/GeneratingPathCard.tsx` ⏳
4. `components/paths/DashboardPaths.tsx` ⏳
5. All 7 job task files (add cancellation checks) ⏳

---

## Estimated Time to Complete

- `enrich-sections.ts`: 1-1.5 hours
- Type updates: 15 minutes
- Task registry: 10 minutes
- Frontend updates: 30-45 minutes
- Cancel endpoint: 30 minutes
- Cancellation checks (7 files): 45 minutes
- Testing: 1-2 hours

**Total: 4-5 hours of focused work**

---

## Key Design Decisions Made

1. **Separate jobs for replacement vs enrichment** - Allows conditional triggering and clearer logging
2. **Threshold: > 3 broken links** - Avoids running replacement for minor issues
3. **Threshold: < 5 active resources per section** - Ensures quality bar maintained
4. **Replacement queues enrichment** - Sequential flow ensures replacement happens first
5. **Enrichment re-validates** - New resources go through link validation
6. **View Path button appears early** - After metadata, user can preview while generation continues
7. **Cancellation is immediate** - Status changes instantly, jobs check and exit early
8. **Timing tracked in milliseconds** - Precision for future analytics/optimization

---

**Next session: Start with creating `enrich-sections.ts`, then work through remaining tasks in order listed above.**
