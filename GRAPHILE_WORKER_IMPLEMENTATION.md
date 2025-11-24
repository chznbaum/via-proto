# Graphile Worker Implementation Plan

**Created:** January 23, 2025
**Status:** Planning Complete - Ready for Implementation
**Purpose:** Replace synchronous path generation with proper background job system

---

## Table of Contents

1. [Overview](#overview)
2. [Current vs New Architecture](#current-vs-new-architecture)
3. [Job Flow Detailed](#job-flow-detailed)
4. [Database Changes](#database-changes)
5. [File Structure](#file-structure)
6. [Implementation Checklist](#implementation-checklist)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Configuration](#deployment-configuration)
9. [Future Enhancements](#future-enhancements)

---

## Overview

### Why This Change?

**Current problems:**
- ❌ Path generation fails when multiple users generate simultaneously
- ❌ 30-60+ second API route timeouts
- ❌ No progress feedback during generation (users wait blindly)
- ❌ Polling doesn't stop properly (duplicate toasts, keeps polling after completion)
- ❌ No proper retry mechanism for failures
- ❌ Synchronous processing blocks other requests

**What we're building:**
- ✅ Sequential job chain for each path (3 separate jobs)
- ✅ Real-time progress feedback at each step
- ✅ Concurrent path generation (2-3 at a time)
- ✅ Automatic retries with exponential backoff
- ✅ Email notifications on final failure
- ✅ Clean separation of concerns
- ✅ Foundation for future async work (OpenGraph fetching, etc.)

### Technology Choice

**Graphile Worker** - PostgreSQL-native job queue
- Uses existing Supabase database (no Redis needed)
- LISTEN/NOTIFY for near-instant job pickup
- Battle-tested, TypeScript support
- Built-in retries, concurrency control, cron scheduling
- Isolated schema namespace (won't conflict with app tables)

---

## Current vs New Architecture

### Current Flow (Problematic)

```
User submits form
    ↓
POST /api/paths/initiate
    - Creates empty path record
    - Returns pathId
    ↓
Client calls POST /api/paths/[id]/generate-content
    - Does EVERYTHING synchronously (30-60s):
      * Fetch topic/competencies
      * Update status to 'generating_metadata'
      * Update status to 'fetching_image'
      * Fetch Unsplash image
      * Update status to 'curating_resources'
      * Call OpenRouter (ONE big prompt for title + sections + resources)
      * Insert sections and resources
      * Mark completed
    - API timeout risk
    - Blocks other requests
    ↓
Client polls GET /api/paths/[id]/status every 2 seconds
    - Polling doesn't stop properly
    - Shows status but no incremental data
```

**Problems:**
- Entire generation is one blocking API call
- Concurrent generations cause failures
- No separation between generation steps
- Status updates are cosmetic (don't reflect actual progress)

---

### New Flow (Job-Based)

```
User submits form
    ↓
POST /api/paths/initiate
    - Creates empty path record (placeholder title)
    - Queues Job #1: generate_metadata
    - Returns immediately
    ↓
Worker picks up Job #1: generate_metadata
    - Status: 'generating_metadata'
    - Small OpenRouter call for title/description/skill_level
    - Updates learning_paths with metadata
    - User sees updated title in dashboard
    - Queues Job #2: fetch_unsplash_image
    ↓
Worker picks up Job #2: fetch_unsplash_image
    - Status: 'fetching_image'
    - Fetches Unsplash image
    - Updates learning_paths.unsplash_image_id
    - User sees cover image appear
    - Queues Job #3: generate_sections_resources
    ↓
Worker picks up Job #3: generate_sections_resources
    - Status: 'curating_resources'
    - Large OpenRouter call for sections/resources
    - Uses metadata from Job #1 in prompt
    - Inserts sections and resources
    - Calculates total_estimated_hours
    - Updates status to 'completed'
    - User can now view full path
    ↓
Client polls GET /api/paths/[id]/status
    - Sees incremental progress through each step
    - Stops polling on 'completed' or 'failed_*'
    - Shows step-specific error messages
```

**Benefits:**
- Each job is independent (failure isolation)
- User sees incremental updates (title appears, then image, then resources)
- Multiple paths can generate concurrently
- Proper retry logic at each step
- Clean separation of concerns

---

## Job Flow Detailed

### Job #1: `generate_metadata`

**Purpose:** Generate path title, description, and skill level

**Input Payload:**
```typescript
{
  pathId: string,
  topicId: string,
  topicName: string,
  goals?: string,
  modelId: string
}
```

**Process:**
1. Update `learning_paths.generation_status = 'generating_metadata'`
2. Fetch topic and competency details from database
3. Call OpenRouter with **metadata-only prompt**:
   ```
   Generate a learning path title, description, and skill level for:
   Topic: {topicName}
   User goals: {goals}
   Competencies: {competencies}

   Return JSON: { title, description, skill_level }
   ```
4. Validate response with `MetadataResponseSchema`
5. Update `learning_paths`:
   - `title`
   - `description`
   - `skill_level`
   - `model_used`
6. **Queue next job:** `fetch_unsplash_image`

**Success Criteria:**
- Valid metadata received and stored
- Next job queued

**Failure Handling:**
- Retry up to 3 times (exponential backoff)
- On final failure:
  - Set `generation_status = 'failed_metadata'`
  - Queue `notify_generation_failed` job
  - Send email to user + support

**User Experience:**
- Dashboard card updates from "Learning {Topic}" → actual generated title
- Description appears
- Skill level badge shows

---

### Job #2: `fetch_unsplash_image`

**Purpose:** Find and attach cover image for the learning path

**Input Payload:**
```typescript
{
  pathId: string,
  topicName: string
}
```

**Process:**
1. Update `learning_paths.generation_status = 'fetching_image'`
2. Call Unsplash API search with `topicName`
3. Get first result (or random from top 10)
4. Check if photo already exists in `unsplash_images` table (by `photo_id`)
5. If new: Insert into `unsplash_images`, trigger download location
6. Update `learning_paths.unsplash_image_id`
7. **Queue next job:** `generate_sections_resources`

**Success Criteria:**
- Image fetched and linked to path
- Next job queued

**Failure Handling:**
- Retry up to 3 times
- On final failure:
  - Set `generation_status = 'failed_image'`
  - Queue `notify_generation_failed` job
  - **Keep metadata from Job #1** (path has title/description but no image)

**User Experience:**
- Cover image appears on dashboard card
- Path looks more complete

**Note:** Image fetch failure is non-critical; path is still usable without image.

---

### Job #3: `generate_sections_resources`

**Purpose:** Generate the actual learning content (sections and resources)

**Input Payload:**
```typescript
{
  pathId: string,
  // Metadata from Job #1 is fetched from DB, not passed in payload
}
```

**Process:**
1. Update `learning_paths.generation_status = 'curating_resources'`
2. Fetch path metadata (title, description, skill_level) from database
3. Fetch topic and competencies
4. Fetch user competency proficiency levels
5. Call OpenRouter with **sections/resources prompt**:
   ```
   Generate a learning path for:
   Title: {title}
   Description: {description}
   Skill Level: {skill_level}
   Competencies: {competencies}
   User's existing skills: {userCompetencies}

   Return JSON: {
     sections: [{ title, description, resources: [...] }],
     total_estimated_hours: number
   }
   ```
6. Validate response with `SectionsResourcesResponseSchema`
7. Insert sections into `sections` table
8. Insert resources into `resources` table (per section)
9. Update `learning_paths`:
   - `total_estimated_hours`
   - `generation_status = 'completed'`
   - `generation_metadata.completed_at`

**Success Criteria:**
- All sections and resources inserted
- Path marked as completed

**Failure Handling:**
- Retry up to 3 times
- On final failure:
  - Set `generation_status = 'failed_sections'`
  - Queue `notify_generation_failed` job
  - **Keep metadata and image from Jobs #1 and #2**

**User Experience:**
- Path status changes to "Completed"
- User can click "View Path" and see full content
- Sections and resources are visible

---

### Job: `notify_generation_failed`

**Purpose:** Email user and support when generation fails

**Input Payload:**
```typescript
{
  pathId: string,
  step: 'generate_metadata' | 'fetch_unsplash_image' | 'generate_sections_resources',
  error: string,
  userId: string,
  topicName: string
}
```

**Process:**
1. Fetch user email from `profiles` table
2. Compose email:
   - **To:** User's email
   - **CC:** Support email (from config)
   - **Subject:** "Learning Path Generation Failed - {topicName}"
   - **Body:**
     - Which step failed
     - Topic name
     - Error message (sanitized)
     - Path ID (for support debugging)
     - Future: Link to retry
3. Send via Resend API

**Email Template:**
```
Hi {userName},

We encountered an issue while generating your learning path for "{topicName}".

What happened: The {step} step failed after multiple attempts.

What this means:
- [For metadata failure]: We couldn't generate the path details. Please try creating the path again.
- [For image failure]: We couldn't fetch a cover image, but your path content was generated successfully. The path is still usable.
- [For sections failure]: We successfully created the path title and description, but couldn't generate the learning resources. You can retry generation from your dashboard (coming soon).

We've notified our support team and they're looking into it.

Path ID: {pathId}

Best regards,
The ViaProto Team
```

**No Retries:** This job itself doesn't retry (fire-and-forget email)

---

## Database Changes

### 1. Graphile Worker Schema

**Migration File:** `supabase/migrations/20250123_setup_graphile_worker.sql`

```sql
-- Graphile Worker Schema - Initial Setup
-- Generated from graphile-worker@14.0.0 (or current version)
-- Date: 2025-01-23
--
-- This creates the graphile_worker schema and all required tables.
-- Future schema updates will be handled automatically by the worker
-- when the npm package is upgraded (it has its own migration system).

-- [Generated SQL from: npx graphile-worker --schema-only -c $DATABASE_URL]
-- (Paste the output here)
```

**How to generate:**
```bash
# After installing graphile-worker package
npx graphile-worker --schema-only -c $DATABASE_URL > /tmp/graphile_worker_schema.sql

# Review the SQL, then copy into migration file
```

---

### 2. Update `generation_status` Enum

**Migration File:** `supabase/migrations/20250123_add_granular_failure_statuses.sql`

```sql
-- Add step-specific failure statuses for better UX and retry logic

ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'failed_metadata';
ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'failed_image';
ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'failed_sections';

-- Current enum values:
-- 'pending', 'generating_metadata', 'fetching_image', 'curating_resources', 'completed', 'failed'
-- New values:
-- 'failed_metadata', 'failed_image', 'failed_sections'

-- Old 'failed' status can be deprecated or used for generic failures
```

---

### 3. Optional: Add `generation_step` Column (Future Enhancement)

**Not required for MVP**, but useful for richer tracking:

```sql
ALTER TABLE learning_paths
ADD COLUMN generation_step TEXT;

-- Tracks: 'metadata', 'image', 'sections'
-- Complements generation_status
```

---

## File Structure

### New Files to Create

```
via-proto/
├── libs/
│   ├── jobs/
│   │   ├── queue.ts                    # Job queue utility (addJob function)
│   │   ├── tasks/
│   │   │   ├── index.ts                # Task list export for worker
│   │   │   ├── generate-metadata.ts    # Job #1 handler
│   │   │   ├── fetch-unsplash-image.ts # Job #2 handler
│   │   │   ├── generate-sections-resources.ts # Job #3 handler
│   │   │   └── notify-generation-failed.ts    # Email notification handler
│   │   └── types.ts                    # TypeScript types for job payloads
│   └── prompts/
│       ├── generate-metadata.ts        # OpenRouter prompt for metadata
│       └── generate-sections.ts        # OpenRouter prompt for sections/resources (existing, modified)
├── worker.ts                           # Worker entry point (root level)
├── supabase/migrations/
│   ├── 20250123_setup_graphile_worker.sql
│   └── 20250123_add_granular_failure_statuses.sql
└── GRAPHILE_WORKER_IMPLEMENTATION.md   # This document
```

---

### Files to Modify

```
app/api/paths/
├── initiate/route.ts                   # Add job queuing
├── [id]/status/route.ts                # Enhance with job status
└── [id]/generate-content/route.ts      # DELETE THIS FILE

components/paths/
└── DashboardPaths.tsx                  # Fix polling cleanup, show step progress

libs/
├── validation/path-schema.ts           # Add MetadataResponseSchema, SectionsResourcesResponseSchema
└── openrouter.ts                       # Update to support separate metadata/sections calls

config.ts                               # Add support email for notifications
package.json                            # Add worker scripts
```

---

### Files to Delete

```
app/api/paths/[id]/generate-content/route.ts
```

This route becomes obsolete because the worker handles all generation.

---

## Implementation Checklist

### Phase 1: Setup (30 min)

- [ ] **Step 1.1:** Install Graphile Worker
  ```bash
  npm install graphile-worker
  ```

- [ ] **Step 1.2:** Generate Graphile Worker schema SQL
  ```bash
  npx graphile-worker --schema-only -c $DATABASE_URL > /tmp/graphile_worker_schema.sql
  ```

- [ ] **Step 1.3:** Create Supabase migration for Graphile Worker
  ```bash
  supabase migration new setup_graphile_worker
  # Copy SQL from /tmp/graphile_worker_schema.sql
  ```

- [ ] **Step 1.4:** Create migration for failure statuses
  ```bash
  supabase migration new add_granular_failure_statuses
  # Add ALTER TYPE commands for new enum values
  ```

- [ ] **Step 1.5:** Apply migrations
  ```bash
  supabase db reset
  ```

---

### Phase 2: Schemas & Types (30 min)

- [ ] **Step 2.1:** Create split Zod schemas in `libs/validation/path-schema.ts`
  - [ ] `MetadataResponseSchema` (title, description, skill_level)
  - [ ] `SectionsResourcesResponseSchema` (sections[], total_estimated_hours)
  - [ ] Keep existing `AIPathResponseSchema` for reference

- [ ] **Step 2.2:** Create job payload types in `libs/jobs/types.ts`
  ```typescript
  export type JobType =
    | 'generate_metadata'
    | 'fetch_unsplash_image'
    | 'generate_sections_resources'
    | 'notify_generation_failed';

  export interface GenerateMetadataPayload {
    pathId: string;
    topicId: string;
    topicName: string;
    goals?: string;
    modelId: string;
  }

  export interface FetchUnsplashImagePayload {
    pathId: string;
    topicName: string;
  }

  export interface GenerateSectionsResourcesPayload {
    pathId: string;
  }

  export interface NotifyGenerationFailedPayload {
    pathId: string;
    step: string;
    error: string;
    userId: string;
    topicName: string;
  }
  ```

---

### Phase 3: Job Queue Utility (20 min)

- [ ] **Step 3.1:** Create `libs/jobs/queue.ts`
  ```typescript
  import { quickAddJob } from 'graphile-worker';
  import type { JobType, /* all payload types */ } from './types';

  export async function addJob(
    type: JobType,
    payload: any, // Union type of all payloads
    options?: {
      priority?: number;
      maxAttempts?: number;
      runAt?: Date;
    }
  ) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not configured');
    }

    await quickAddJob(
      { connectionString },
      type,
      payload,
      {
        maxAttempts: options?.maxAttempts ?? 3,
        priority: options?.priority,
        runAt: options?.runAt,
      }
    );
  }
  ```

---

### Phase 4: Task Handlers (2-3 hours)

- [ ] **Step 4.1:** Create `libs/jobs/tasks/generate-metadata.ts`
  - [ ] Import Supabase client, OpenRouter, Zod schema
  - [ ] Update status to 'generating_metadata'
  - [ ] Fetch topic and competencies
  - [ ] Create new OpenRouter prompt (metadata only)
  - [ ] Call OpenRouter with metadata prompt
  - [ ] Validate with `MetadataResponseSchema`
  - [ ] Update learning_paths with metadata
  - [ ] Queue `fetch_unsplash_image` job
  - [ ] Return success

- [ ] **Step 4.2:** Create `libs/jobs/tasks/fetch-unsplash-image.ts`
  - [ ] Import Supabase client, Unsplash utility
  - [ ] Update status to 'fetching_image'
  - [ ] Call `fetchUnsplashImage(topicName)`
  - [ ] Check for existing image in DB
  - [ ] Insert/link image to path
  - [ ] Trigger download location
  - [ ] Queue `generate_sections_resources` job
  - [ ] Return success

- [ ] **Step 4.3:** Create `libs/jobs/tasks/generate-sections-resources.ts`
  - [ ] Import Supabase client, OpenRouter, Zod schema
  - [ ] Update status to 'curating_resources'
  - [ ] Fetch path metadata from DB (title, description, skill_level)
  - [ ] Fetch topic, competencies, user competencies
  - [ ] Call OpenRouter with sections prompt (include metadata in context)
  - [ ] Validate with `SectionsResourcesResponseSchema`
  - [ ] Insert sections (loop through array)
  - [ ] Insert resources per section
  - [ ] Update learning_paths with total_estimated_hours
  - [ ] Update status to 'completed'
  - [ ] Update generation_metadata.completed_at
  - [ ] Return success

- [ ] **Step 4.4:** Create `libs/jobs/tasks/notify-generation-failed.ts`
  - [ ] Import Supabase client, Resend
  - [ ] Fetch user profile (email, name)
  - [ ] Compose email body (step-specific message)
  - [ ] Send via Resend (user + CC support)
  - [ ] Log email send status
  - [ ] Return success (no retries)

- [ ] **Step 4.5:** Create `libs/jobs/tasks/index.ts`
  ```typescript
  import type { TaskList } from 'graphile-worker';
  import { generateMetadataTask } from './generate-metadata';
  import { fetchUnsplashImageTask } from './fetch-unsplash-image';
  import { generateSectionsResourcesTask } from './generate-sections-resources';
  import { notifyGenerationFailedTask } from './notify-generation-failed';

  export const tasks: TaskList = {
    generate_metadata: generateMetadataTask,
    fetch_unsplash_image: fetchUnsplashImageTask,
    generate_sections_resources: generateSectionsResourcesTask,
    notify_generation_failed: notifyGenerationFailedTask,
  };
  ```

---

### Phase 5: OpenRouter Prompts (1 hour)

- [ ] **Step 5.1:** Create `libs/prompts/generate-metadata.ts`
  - [ ] Write prompt for metadata generation only
  - [ ] Include: topic, goals, competencies
  - [ ] Request: title, description, skill_level (JSON)
  - [ ] Export as function: `getMetadataPrompt(params)`

- [ ] **Step 5.2:** Update existing sections prompt
  - [ ] Modify to include pre-generated metadata in context
  - [ ] "Using the following path details: {title}, {description}, {skill_level}..."
  - [ ] Request: sections[] and total_estimated_hours only

---

### Phase 6: Worker Setup (30 min)

- [ ] **Step 6.1:** Create `worker.ts` at project root
  ```typescript
  import { run } from 'graphile-worker';
  import { tasks } from './libs/jobs/tasks';
  import { addJob } from './libs/jobs/queue';

  async function main() {
    console.log('🚀 Starting Graphile Worker...');

    const runner = await run({
      connectionString: process.env.DATABASE_URL!,
      taskList: tasks,
      concurrency: 3, // 2-3 jobs simultaneously
      pollInterval: 1000, // Check for jobs every 1s
      noHandleSignals: false, // Handle SIGTERM gracefully
      events: {
        'job:start': ({ job }) => {
          console.log(`▶️  Job started: ${job.task_identifier} (${job.id})`);
        },
        'job:success': ({ job }) => {
          console.log(`✅ Job completed: ${job.task_identifier} (${job.id})`);
        },
        'job:error': async ({ job, error }) => {
          console.error(`❌ Job error: ${job.task_identifier} (${job.id})`, error);

          // On final failure, queue notification
          if (job.attempts >= job.max_attempts) {
            console.log(`📧 Queueing failure notification for job ${job.id}`);
            await addJob('notify_generation_failed', {
              pathId: job.payload.pathId,
              step: job.task_identifier,
              error: error.message,
              userId: job.payload.userId || 'unknown',
              topicName: job.payload.topicName || 'Unknown Topic',
            });
          }
        },
      },
    });

    console.log('✅ Worker started successfully');

    await runner.promise;
  }

  main().catch((err) => {
    console.error('💥 Worker crashed:', err);
    process.exit(1);
  });
  ```

- [ ] **Step 6.2:** Add worker scripts to `package.json`
  ```json
  {
    "scripts": {
      "worker": "tsx worker.ts",
      "worker:dev": "tsx watch worker.ts",
      "worker:setup": "npx graphile-worker --schema-only -c $DATABASE_URL"
    }
  }
  ```

- [ ] **Step 6.3:** Update `.env.example`
  ```bash
  # Worker Configuration
  WORKER_CONCURRENCY=3
  WORKER_POLL_INTERVAL=1000
  ```

---

### Phase 7: API Route Updates (1 hour)

- [ ] **Step 7.1:** Modify `app/api/paths/initiate/route.ts`
  - [ ] After creating path record, add job:
    ```typescript
    await addJob('generate_metadata', {
      pathId: newPath.id,
      topicId: topic.id,
      topicName: topic.name,
      goals: validatedInput.goals,
      modelId: validatedInput.model_id || getDefaultModelForTier(tier),
    });
    ```
  - [ ] Update response message: "Path created. Generation queued."
  - [ ] Remove any synchronous generation logic

- [ ] **Step 7.2:** Delete `app/api/paths/[id]/generate-content/route.ts`
  - [ ] This entire file is obsolete

- [ ] **Step 7.3:** Enhance `app/api/paths/[id]/status/route.ts`
  - [ ] Keep existing path status fetch
  - [ ] Optionally: Query Graphile Worker job status for richer info
  - [ ] Return: status, error, createdAt, (optional: job attempts, next retry)

---

### Phase 8: Client-Side Fixes (30 min)

- [ ] **Step 8.1:** Fix polling cleanup in `components/paths/DashboardPaths.tsx`
  - [ ] Line 99-121: Ensure interval is cleared BEFORE showing toast
  - [ ] Use `useRef` for polling intervals instead of state (prevents closure issues)
  - [ ] Stop polling on any terminal status: 'completed' | 'failed_*'
  - [ ] Show toast only once per path completion/failure

- [ ] **Step 8.2:** Add step-by-step progress UI
  - [ ] Map statuses to user-friendly messages:
    ```typescript
    const STATUS_MESSAGES = {
      pending: 'Preparing your path...',
      generating_metadata: 'Creating title and description...',
      fetching_image: 'Finding the perfect cover image...',
      curating_resources: 'Gathering learning resources...',
      completed: 'Ready to view!',
      failed_metadata: 'Metadata generation failed',
      failed_image: 'Image fetch failed (path still usable)',
      failed_sections: 'Resource curation failed',
    };
    ```
  - [ ] Update `GeneratingPathCard` component to show these messages

- [ ] **Step 8.3:** Handle failed states gracefully
  - [ ] For `failed_metadata`: Show error + "Try Again" (future)
  - [ ] For `failed_image`: Show path anyway (image is optional)
  - [ ] For `failed_sections`: Show partial path (title + description exist)

---

### Phase 9: Testing (1-2 hours)

- [ ] **Step 9.1:** Local Testing Setup
  ```bash
  # Terminal 1: Start Next.js dev server
  npm run dev

  # Terminal 2: Start worker
  npm run worker:dev
  ```

- [ ] **Step 9.2:** Test Single Path Generation
  - [ ] Submit form to create path
  - [ ] Verify Job #1 (metadata) starts
  - [ ] Check DB: title/description updated
  - [ ] Verify Job #2 (image) starts
  - [ ] Check DB: unsplash_image_id updated
  - [ ] Verify Job #3 (sections) starts
  - [ ] Check DB: sections and resources inserted
  - [ ] Verify status changes to 'completed'
  - [ ] Verify polling stops
  - [ ] Click "View Path" and confirm full content visible

- [ ] **Step 9.3:** Test Concurrent Generation (2-3 paths)
  - [ ] Create 3 paths simultaneously from different browser tabs
  - [ ] Verify all 3 complete successfully
  - [ ] Check worker logs for interleaved job execution
  - [ ] Confirm no failures due to concurrency

- [ ] **Step 9.4:** Test Failure Scenarios
  - [ ] **Metadata failure:** Temporarily break OpenRouter API key
    - [ ] Verify retries (3 attempts)
    - [ ] Verify status becomes 'failed_metadata'
    - [ ] Verify email sent
  - [ ] **Image failure:** Temporarily break Unsplash API key
    - [ ] Verify Job #2 fails but Job #3 still runs
    - [ ] Verify path has title/description but no image
  - [ ] **Sections failure:** Temporarily break OpenRouter mid-generation
    - [ ] Verify retries
    - [ ] Verify path keeps metadata + image
    - [ ] Verify status becomes 'failed_sections'

- [ ] **Step 9.5:** Test Polling Cleanup
  - [ ] Create path
  - [ ] Wait for completion
  - [ ] Verify success toast appears ONCE
  - [ ] Check browser dev tools: verify interval cleared
  - [ ] Navigate away and back
  - [ ] Verify no duplicate toasts or active intervals

- [ ] **Step 9.6:** Test Worker Crash Recovery
  - [ ] Start path generation
  - [ ] Kill worker process (Ctrl+C)
  - [ ] Restart worker
  - [ ] Verify job resumes from where it left off
  - [ ] Verify path completes successfully

---

### Phase 10: Deployment Prep (30 min)

- [ ] **Step 10.1:** Update Coolify configuration
  - [ ] Document in `DEPLOYMENT.md` (new file or update existing)
  - [ ] Two services needed:
    - **web**: Existing Next.js app
    - **worker**: New background processor
  - [ ] Both services share same environment variables
  - [ ] Worker service configuration:
    ```yaml
    name: viaproto-worker
    build: npm install
    start: npm run worker
    env: [same as web service]
    restart: always
    health_check: none (or custom script)
    ```

- [ ] **Step 10.2:** Add health check for worker (optional)
  - [ ] Create `/api/worker/health` endpoint
  - [ ] Worker periodically pings this endpoint
  - [ ] Coolify can monitor worker liveness

- [ ] **Step 10.3:** Document environment variables
  - [ ] DATABASE_URL (must be same for web + worker)
  - [ ] OPENROUTER_API_KEY
  - [ ] UNSPLASH_ACCESS_KEY
  - [ ] RESEND_API_KEY
  - [ ] Support email for notifications

---

## Testing Strategy

### Unit Tests (Future Enhancement)

Not required for MVP, but recommended:

- [ ] Test job payload validation
- [ ] Test OpenRouter prompt generation
- [ ] Test email template rendering
- [ ] Test retry logic

### Integration Tests

- [ ] End-to-end path generation (all 3 jobs)
- [ ] Concurrent path generation
- [ ] Failure recovery at each step
- [ ] Email notification delivery

### Manual Testing Checklist

Use this checklist before deploying to production:

- [ ] Single path generation completes successfully
- [ ] 3 concurrent path generations complete
- [ ] Metadata failure triggers email
- [ ] Image failure doesn't block sections generation
- [ ] Sections failure keeps metadata + image
- [ ] Polling stops correctly on completion
- [ ] No duplicate toasts
- [ ] Dashboard shows step-by-step progress
- [ ] Worker restarts gracefully
- [ ] Database reset includes worker schema

---

## Deployment Configuration

### Coolify Setup

**Service 1: Web (Existing)**
```yaml
name: viaproto-web
type: nextjs
build_command: npm install && npm run build
start_command: npm start
port: 3000
env:
  - DATABASE_URL
  - OPENROUTER_API_KEY
  - UNSPLASH_ACCESS_KEY
  - RESEND_API_KEY
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [all other existing env vars]
```

**Service 2: Worker (New)**
```yaml
name: viaproto-worker
type: nodejs
build_command: npm install
start_command: npm run worker
port: none (background process)
env:
  - DATABASE_URL (must match web service)
  - OPENROUTER_API_KEY
  - UNSPLASH_ACCESS_KEY
  - RESEND_API_KEY
  - SUPABASE_SERVICE_ROLE_KEY (for server-side operations)
restart_policy: always
health_check: optional
```

**Shared Database:**
- Both services point to same `DATABASE_URL`
- Worker uses Graphile Worker schema (isolated namespace)
- No conflicts with web app tables

**Deployment Order:**
1. Deploy database migrations (includes Graphile Worker schema)
2. Deploy web service
3. Deploy worker service
4. Verify both services running
5. Test path generation end-to-end

---

## Future Enhancements

### Phase 2: OpenGraph Fetching (Post-MVP)

After path generation completes, queue additional jobs:

```typescript
// In generate-sections-resources task, after marking completed:
const { data: resources } = await supabase
  .from('resources')
  .select('id, url')
  .eq('learning_path_id', pathId);

for (const resource of resources) {
  await addJob('fetch_opengraph', {
    resourceId: resource.id,
    url: resource.url,
  });
}
```

**New Task:** `fetch_opengraph`
- Fetches og:image, og:title, og:description
- Updates resources table
- Handles timeouts and broken links
- Non-blocking (doesn't affect path completion)

---

### Phase 3: Manual Retry Buttons

Add retry capability for failed generations:

**UI:**
- `failed_metadata` → "Retry Generation" button
- `failed_image` → "Retry Image" button (keeps metadata)
- `failed_sections` → "Retry Resources" button (keeps metadata + image)

**API Endpoint:** `POST /api/paths/[id]/retry`
- Checks current status
- Queues appropriate job based on failure type
- Resets status to pending or specific step

---

### Phase 4: Streaming Progress

Replace polling with Server-Sent Events (SSE) or WebSockets:

- Real-time job progress updates
- No need for 2-second polling
- Better user experience

**Implementation:**
- Use Supabase Realtime subscriptions
- Or: SSE endpoint that listens to Graphile Worker events
- Update dashboard in real-time

---

### Phase 5: Scheduled Jobs

Use Graphile Worker's cron support for:

- Daily cleanup of old completed jobs
- Weekly email digest of generated paths
- Monthly analytics reports

---

### Phase 6: Priority Queue

Add priority to jobs:

- Pro/Team users get higher priority (lower number = higher priority)
- Free users get lower priority
- Emergency retries get highest priority

```typescript
await addJob('generate_metadata', payload, {
  priority: tier === 'free' ? 10 : 1
});
```

---

## Troubleshooting

### Common Issues

**Issue:** Worker doesn't start
- Check DATABASE_URL is set correctly
- Verify Graphile Worker schema is installed: `npm run worker:setup`
- Check logs for connection errors

**Issue:** Jobs are pending but not processing
- Check worker is running: `ps aux | grep worker`
- Check worker logs for errors
- Verify concurrency setting (not set too low)

**Issue:** Duplicate toasts on completion
- Verify interval is cleared in `useEffect` cleanup
- Check polling logic clears interval before showing toast
- Use `useRef` for interval storage

**Issue:** Path stuck in 'generating_metadata' forever
- Check worker logs for errors
- Verify OpenRouter API key is valid
- Check job retries: `SELECT * FROM graphile_worker.jobs WHERE payload->>'pathId' = 'xxx'`
- Manually queue retry job if needed

**Issue:** Email notifications not sending
- Verify RESEND_API_KEY is set
- Check Resend dashboard for send logs
- Verify support email is configured in config.ts

---

## Database Queries for Monitoring

### Check Job Queue Status

```sql
-- See all pending jobs
SELECT task_identifier, payload, attempts, created_at
FROM graphile_worker.jobs
WHERE locked_at IS NULL
ORDER BY created_at DESC;

-- See running jobs
SELECT task_identifier, payload, attempts, locked_at
FROM graphile_worker.jobs
WHERE locked_at IS NOT NULL;

-- See failed jobs (exhausted retries)
SELECT task_identifier, payload, attempts, last_error
FROM graphile_worker.jobs
WHERE attempts >= max_attempts;
```

### Check Path Generation Status

```sql
-- Count paths by status
SELECT generation_status, COUNT(*)
FROM learning_paths
GROUP BY generation_status;

-- Find stuck paths (older than 10 minutes, still pending)
SELECT id, title, generation_status, created_at
FROM learning_paths
WHERE generation_status IN ('pending', 'generating_metadata', 'fetching_image', 'curating_resources')
  AND created_at < NOW() - INTERVAL '10 minutes';
```

### Job Performance Metrics

```sql
-- Average job duration by type (if you add timing)
SELECT task_identifier,
       AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds
FROM graphile_worker.jobs
WHERE run_at <= NOW()
GROUP BY task_identifier;
```

---

## Success Criteria

Implementation is complete when:

- ✅ Single path generation completes through all 3 jobs
- ✅ 3 concurrent path generations complete without issues
- ✅ User sees incremental progress (title, image, sections)
- ✅ Polling stops correctly on completion/failure
- ✅ No duplicate toasts
- ✅ Failed generations send email notifications
- ✅ Worker restarts don't lose jobs
- ✅ Database resets include worker schema
- ✅ Coolify deployment documented for web + worker services
- ✅ All manual testing checks pass

---

## Timeline Estimate

**Total Time:** 8-12 hours (can be split across multiple sessions)

- Setup & Migrations: 1 hour
- Schemas & Types: 30 min
- Job Queue Utility: 20 min
- Task Handlers: 2-3 hours (most complex part)
- Prompts: 1 hour
- Worker Setup: 30 min
- API Updates: 1 hour
- Client Fixes: 30 min
- Testing: 1-2 hours
- Deployment Prep: 30 min
- Documentation: 30 min

**Recommended Sessions:**
- Session 1: Setup through Task Handlers (4-5 hours)
- Session 2: Worker setup through Testing (3-4 hours)
- Session 3: Deployment and polish (1-2 hours)

---

## Questions & Decisions Log

**Q:** Should we use Graphile Worker CLI or Supabase migrations for schema?
**A:** Hybrid approach - initial schema in Supabase migration (version controlled), future updates handled by worker automatically.

**Q:** Delete or keep generate-content route?
**A:** Delete entirely. Worker is single source of truth for generation.

**Q:** Job retention policy?
**A:** Keep all jobs forever for MVP. Implement cleanup later.

**Q:** Failure notifications?
**A:** Email user + CC support via Resend. In-app notifications are future enhancement.

**Q:** OpenGraph timing?
**A:** After path generation (separate jobs), not during. Provides faster user feedback.

**Q:** Concurrency level?
**A:** 2-3 jobs simultaneously. Can adjust based on API rate limits.

**Q:** Worker deployment?
**A:** Separate container in Coolify. Shares environment with web app.

---

**END OF IMPLEMENTATION PLAN**

This document serves as the complete reference for implementing Graphile Worker background job processing in ViaProto. All architectural decisions, code examples, and testing strategies are documented here for reference during implementation.

Last Updated: January 23, 2025
