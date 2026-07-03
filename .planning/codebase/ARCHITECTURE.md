<!-- refreshed: 2026-07-03 -->
# Architecture

**Analysis Date:** 2026-07-03

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         User-Facing Web Layer                           │
│  Route Groups: (main) | (auth) | (dashboard)  +  API Routes (app/api/)  │
│  Next.js 15 App Router • Server Components & Async APIs • Tailwind+DaisyUI│
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌────────────────┐ ┌──────────────┐ ┌──────────────────┐
    │ Path Initiation│ │ Model Select │ │ Account & Auth   │
    │  API Handler   │ │ & Validation │ │  (Supabase Auth) │
    │ /api/paths/    │ │  via Stripe  │ │  RLS Policies    │
    │ initiate       │ │   webhooks   │ │                  │
    └────────┬────────┘ └──────────────┘ └──────────────────┘
             │
             │ Rate limit + validation
             │ Create path record (pending status)
             │ Queue first job
             ▼
    ┌────────────────────────────────────────────────────────┐
    │         Graphile Worker Background Job Processor       │
    │            (worker.ts - Standalone Node.js)            │
    │                                                         │
    │  9-Step Generation Pipeline:                           │
    │  1. generate_metadata ────┐                            │
    │  2. fetch_unsplash_image ─┼─ Core Generation (always) │
    │  3. research_resources   ─┤                            │
    │  4. generate_sections_resources ┤                      │
    │  5. validate_and_finalize ┼─────┐                     │
    │  6. validate_resource_links ────┼─ Resource Validation│
    │  7. replace_broken_resources  ──┼─ (Conditional)     │
    │  8. enrich_sections ────────────┘                      │
    │  9. validate_resource_links (2nd pass, no checks)      │
    │     └──> notify_generation_failed (on error)           │
    │                                                         │
    │  Entry: libs/jobs/tasks/  (typescript modules)         │
    │  Queue: libs/jobs/queue.ts (addJob API)                │
    │  Types: libs/jobs/types.ts (type-safe payloads)        │
    └─────────────┬──────────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
    ┌──────────────────┐ ┌─────────────────────────────────┐
    │  Supabase        │ │  External Services              │
    │  (PostgreSQL)    │ │  • OpenRouter API (40+ models)  │
    │                  │ │  • Unsplash (cover images)      │
    │  Tables:         │ │  • Link metadata (OpenGraph)    │
    │  • profiles      │ │  • Search engines (web scrape)  │
    │  • accounts      │ │  • Resend (email notifications) │
    │  • learning_paths│ │  • Stripe (webhooks only)       │
    │  • sections      │ │                                 │
    │  • resources     │ └─────────────────────────────────┘
    │  • topics        │
    │  • account_users │
    │  (RLS enforced)  │
    └──────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Path Generation Coordinator** | Manages the 9-step job pipeline, status transitions | `app/api/paths/initiate/route.ts` |
| **Metadata Generator** | AI-driven path title, description, skill level | `libs/jobs/tasks/generate-metadata.ts` |
| **Image Fetcher** | Unsplash image selection and caching | `libs/jobs/tasks/fetch-unsplash-image.ts` |
| **Resource Researcher** | Web search for 30-50 candidate resources | `libs/jobs/tasks/research-resources.ts` |
| **Content Organizer** | Generates 5-8 learning sections with resources | `libs/jobs/tasks/generate-sections-resources.ts` |
| **Resource Validator** | Fetches OpenGraph metadata, checks link accessibility | `libs/jobs/tasks/validate-resource-links.ts` |
| **Resource Improver** | Replaces broken links and enriches under-resourced sections | `libs/jobs/tasks/replace-broken-resources.ts`, `enrich-sections.ts` |
| **Path Finalizer** | Quality checks, marks completion | `libs/jobs/tasks/validate-and-finalize.ts` |
| **Failure Notifier** | Sends email on generation failure | `libs/jobs/tasks/notify-generation-failed.ts` |
| **Account Manager** | Subscription tier, rate limits, seat management | `libs/auth.ts`, `libs/accounts.ts`, `libs/stripe.ts` |
| **Model Catalog** | AI model configuration, tier-based access control | `libs/models/model-config.ts` |

## Pattern Overview

**Overall:** Event-driven asynchronous background job pipeline with rate-limited client polling.

**Key Characteristics:**
- **Separation of Concerns**: Path creation (sync) vs. generation (async background jobs)
- **Type Safety**: Zod validation for inputs; TypeScript for job payloads
- **Graceful Degradation**: Resource replacement if broken links detected; enrichment for under-resourced sections
- **Observability**: Job status stored in database; client polls every 2-3 seconds; Sentry error tracking in worker
- **Scalability**: Graphile Worker with configurable concurrency (default 3 jobs parallel); poll interval configurable

## Layers

**Layer 1: Route Groups (UI Entry Points)**

**Location**: `app/(main)/`, `app/(auth)/`, `app/(dashboard)/`

**Purpose:**
- `(main)`: Landing page, blog, public path discovery, auth forms
- `(auth)`: Login, register, OAuth callbacks
- `(dashboard)`: User dashboard, path management, account settings (requires auth via `requireAuth()`)

**Contains:** Server/client page components, layout wrappers with HTML/body

**Depends on:** Supabase client/server, components, utilities

**Used by:** Next.js router

---

**Layer 2: API Routes (Server Logic)**

**Location**: `app/api/`

**Purpose:**
- Path generation endpoints (`/api/paths/initiate`, `/api/paths/[id]/status`)
- Account & subscription management (`/api/accounts/switch`, `/api/accounts/[accountId]`)
- Stripe webhook handling (`/api/webhook/stripe`)
- Authentication callbacks (`/api/auth/callback`, `/api/auth/setup-account`)
- Model listing & validation (`/api/models`)
- Search and discovery (`/api/search`, `/api/topics`)
- Error reporting (`/api/error-report`)

**Contains:** Route handlers (POST, GET, PATCH, etc.); Zod validation; Supabase queries; external API calls

**Depends on:** Supabase (server), validation schemas, Stripe SDK, job queue

**Used by:** Frontend API calls, webhooks (Stripe), background jobs

---

**Layer 3: Background Job Processor (Async Generation)**

**Location**: `libs/jobs/`, `worker.ts`

**Purpose:**
- Execute long-running AI operations asynchronously
- Retry failed tasks with exponential backoff
- Chain jobs sequentially (metadata → image → research → sections → validation → improvement)
- Send failure notifications

**Contains:**
- `worker.ts`: Graphile Worker entry point; registers all tasks; handles shutdown; Sentry integration
- `libs/jobs/queue.ts`: Type-safe job queueing API (`addJob()`, `addJobsInSequence()`)
- `libs/jobs/tasks/`: Individual task implementations (generate-metadata.ts, fetch-unsplash-image.ts, etc.)
- `libs/jobs/types.ts`: Job payload types (GenerateMetadataPayload, etc.)
- `libs/jobs/timing.ts`: Job timing utilities

**Depends on:** Supabase (service role for direct DB access), OpenRouter, Unsplash, link-metadata, search-engines

**Used by:** API routes via `addJob()`; self (task → task queueing for pipeline)

---

**Layer 4: Data Access & Persistence**

**Location**: `libs/supabase/`, `libs/auth.ts`, `libs/accounts.ts`

**Purpose:**
- Supabase client initialization (server, client, service role variants)
- Authentication helpers (requireAuth, getUserDefaultAccount, getAccountWithRole)
- Account/subscription queries
- Row-level security policy enforcement

**Contains:**
- `libs/supabase/server.ts`: SSR-safe server client (uses cookies)
- `libs/supabase/client.ts`: Browser client for client-side Supabase
- `libs/supabase/service.ts`: Service role client (bypasses RLS; for webhooks/jobs)
- `libs/auth.ts`: Auth helpers, account lookup
- `libs/accounts.ts`: Account creation, user/seat management

**Depends on:** `@supabase/ssr`, `@supabase/supabase-js`

**Used by:** All layers (routes, API handlers, background jobs)

---

**Layer 5: External Integrations**

**Location**: `libs/openrouter.ts`, `libs/unsplash.ts`, `libs/link-metadata.ts`, `libs/search-engines.ts`, `libs/stripe.ts`, `libs/resend.ts`

**Purpose:**
- AI model inference via OpenRouter (40+ models, structured JSON output)
- Unsplash image selection and caching
- OpenGraph metadata scraping (link thumbnails, descriptions)
- Web search for resource discovery
- Stripe payment processing (create checkout, webhooks)
- Email sending (Resend)

**Contains:** API client wrappers, prompt construction, response validation

**Depends on:** External services (HTTP clients: axios, openai SDK, stripe SDK)

**Used by:** Background job tasks, API routes

---

**Layer 6: Configuration & Models**

**Location**: `config.ts`, `libs/models/model-config.ts`, `contexts/config.tsx`

**Purpose:**
- App-wide configuration (domain, Stripe plan IDs, colors, auth URLs)
- AI model catalog with tier-based access control
- React context for client-side config access

**Contains:** Model metadata (provider, cost tier, access restrictions), Stripe price IDs, feature flags

**Depends on:** Environment variables

**Used by:** All layers for configuration decisions

---

**Layer 7: Utilities & Validation**

**Location**: `libs/validation/`, `libs/models/`, `contexts/`, `hooks/`

**Purpose:**
- Input validation schemas (Zod)
- Helper functions (getDefaultModelForTier, getAccountWithRole)
- React hooks (useLocalStorage)
- Config context provider

**Contains:** Zod schemas for paths, teams, progress; utility functions; hooks; context

**Depends on:** zod, React

**Used by:** API routes, components, jobs

## Data Flow

### Primary Request Path: Learning Path Generation

1. **User initiates path** (`POST /api/paths/initiate` — `app/api/paths/initiate/route.ts:19-237`)
   - Parse request (topic_id, goals, model_id)
   - Fetch user and default account
   - Validate model against tier and catalog
   - Check rate limits (free: 1/mo, pro: 10/mo, team: 20+6×seats/mo)
   - Create learning_paths record with `generation_status: 'pending'`
   - Queue first job: `generate_metadata`
   - Return pathId to client

2. **Background job: generate_metadata** (`libs/jobs/tasks/generate-metadata.ts`)
   - Fetch path, topic, topic competencies from Supabase
   - Call OpenRouter with topic context and learner goals
   - Parse AI response (title, description, skill_level)
   - Update learning_paths table: status → `generating_metadata`, store metadata
   - Queue next job: `fetch_unsplash_image`

3. **Background job: fetch_unsplash_image** (`libs/jobs/tasks/fetch-unsplash-image.ts`)
   - Query Unsplash API for topic-relevant cover image
   - Cache image info in unsplash_images table
   - Update learning_paths: status → `fetching_image`, store image URL
   - Queue next job: `research_resources`

4. **Background job: research_resources** (`libs/jobs/tasks/research-resources.ts`)
   - Perform web searches for 30-50 candidate resources
   - Filter by domain, relevance, accessibility
   - Store candidates in temporary staging
   - Queue next job: `generate_sections_resources`

5. **Background job: generate_sections_resources** (`libs/jobs/tasks/generate-sections-resources.ts`)
   - Call OpenRouter to organize candidates into 5-8 learning sections
   - Create sections and resources records in database
   - Update learning_paths: status → `curating_resources`
   - Queue next job: `validate_and_finalize`

6. **Background job: validate_and_finalize** (`libs/jobs/tasks/validate-and-finalize.ts`)
   - Quality checks: minimum resources per section, section count
   - Calculate total_estimated_hours
   - Update learning_paths: status → `completed`
   - Queue next job: `validate_resource_links`

7. **Background job: validate_resource_links (1st pass)** (`libs/jobs/tasks/validate-resource-links.ts`)
   - Fetch OpenGraph metadata for each resource (title, description, thumbnail)
   - Check link accessibility (HTTP HEAD request, 2xx/3xx status)
   - Mark broken links (4xx/5xx)
   - If > 3 broken links found: queue `replace_broken_resources`
   - If < 5 active resources per section: queue `enrich_sections`
   - Otherwise: complete

8. **Background job: replace_broken_resources (conditional)** (`libs/jobs/tasks/replace-broken-resources.ts`)
   - Call OpenRouter to generate replacement resources
   - Insert new resources, mark old ones as inactive
   - Queue `validate_resource_links` (2nd pass)

9. **Background job: enrich_sections (conditional)** (`libs/jobs/tasks/enrich-sections.ts`)
   - For sections with < 5 active resources: call OpenRouter for suggestions
   - Insert additional resources
   - Queue `validate_resource_links` (2nd pass)

10. **Background job: validate_resource_links (2nd pass)**
    - Same process as step 7, but no further improvement checks
    - Mark path as fully complete

**Status Polling (Client):**
- Client calls `GET /api/paths/[id]/status` every 2-3 seconds
- Returns current `generation_status` and progress metadata
- Stops polling when status = `completed` or `failed`

**On Error (Any Job):**
- Job retries up to 3 times (configurable via `maxAttempts`)
- After final failure: worker queues `notify_generation_failed`
- Email sent to user with error details
- Path marked as `failed` with error message stored in `generation_error`

### Secondary Flow: Subscription Management & Rate Limiting

1. **User upgrades** (Stripe checkout → webhook)
   - Stripe sends `checkout.session.completed` to `POST /api/webhook/stripe`
   - Create/update `accounts` record with subscription tier, customer ID, subscription ID
   - Auto-create personal account if needed (via `setup-account` endpoint)

2. **Rate limit enforcement**
   - Every path creation checks monthly usage: `SELECT COUNT(*) FROM learning_paths WHERE account_id = ? AND created_at >= first_of_month`
   - Compare against tier limit; reject with 429 if exceeded
   - Limit applies immediately (not after generation completes)

### State Management

**Path Generation State:** Stored in `learning_paths.generation_status` enum
```
pending 
  ↓ (generate_metadata starts)
generating_metadata
  ↓ (metadata complete, fetch_unsplash_image starts)
fetching_image
  ↓ (image complete, research_resources starts)
researching_resources (implied, not explicitly stored)
  ↓ (resources selected, generate_sections_resources starts)
curating_resources
  ↓ (sections created, validate_and_finalize → validate_resource_links)
completed
  (or failed if any job fails after max retries)
```

**Account Subscription State:** Stored in `accounts` table
- `subscription_tier`: free | pro | team
- `subscription_status`: active | canceled | past_due | inactive
- `stripe_customer_id`, `stripe_subscription_id`: Sync with Stripe
- `seat_count`: Updated on subscription changes (team plans)

## Key Abstractions

**Job Payload Type Safety:**
- Purpose: Enforce correct data shape when queueing jobs
- Examples: `GenerateMetadataPayload`, `FetchUnsplashImagePayload`, `GenerateSectionsResourcesPayload`
- Pattern: TypeScript interfaces in `libs/jobs/types.ts`; Zod validation not used for jobs (payload shape enforced at compile time)

**Account + Role Model:**
- Purpose: Support both personal (1 user, 1 account) and team (N users, shared account, tiered access)
- Examples: `AccountMembership`, `AccountWithRole` in `libs/auth.ts`
- Pattern: Join table `account_users` tracks user→account with role (owner/admin/member)

**AI Model Catalog:**
- Purpose: Centralized configuration for 40+ models with tier-based access control
- Examples: MODEL_CATALOG in `libs/models/model-config.ts`
- Pattern: Model metadata objects with `minimumTier`, `costTier`, provider info; helper functions `getModelsForTier()`, `isModelAllowedForTier()`

**Rate Limiting:**
- Purpose: Enforce monthly path quotas per tier and seat count
- Pattern: Calculated at path creation time (not stored); formula: `getRateLimit(tier, seatCount)` in `app/api/paths/initiate/route.ts`
- Tiers: free=1, pro=10, team=20+6×(seats-2)

## Entry Points

**Web Server Entry:**
- Location: `app/layout.tsx` (root), `app/(main)/layout.tsx` (primary HTML/body)
- Triggers: HTTP request to any route
- Responsibilities: Root metadata, child layout rendering, theme/analytics setup

**API Entry: Path Initiation**
- Location: `app/api/paths/initiate/route.ts`
- Triggers: `POST /api/paths/initiate` from frontend
- Responsibilities: Validate user, check rate limit, create path record, queue first job

**Worker Entry:**
- Location: `worker.ts` (root of repo)
- Triggers: `npm run worker` (production) or `npm run worker:dev` (development)
- Responsibilities: Register all job tasks, poll database for queued jobs, execute tasks, handle retries/failures

**Webhook Entry: Stripe**
- Location: `app/api/webhook/stripe/route.ts`
- Triggers: Stripe sends `POST /api/webhook/stripe` (checkout, subscription, payment events)
- Responsibilities: Verify signature, update subscription tier and Stripe IDs in `accounts` table

**Auth Entry: OAuth Callback**
- Location: `app/api/auth/callback/route.ts`
- Triggers: Supabase redirects after OAuth success
- Responsibilities: Handle auth code exchange, create/update user profile

## Architectural Constraints

- **Threading:** Single-threaded event loop (Node.js for web; worker is separate process). Graphile Worker manages concurrency via pooling (default 3 parallel jobs).
- **Global state:** None. Supabase connection strings loaded from env. Stripe/OpenRouter/Unsplash API keys in env. Config singleton in `config.ts`.
- **Circular imports:** None detected. Import order: React/Next → third-party → components → libs → types → config.
- **Async/await discipline:** Next.js 15 requires `await params`, `await headers()`, `await cookies()`, `await createClient()`. All APIs are async.
- **RLS (Row-Level Security):** Enforced for all user data (profiles, accounts, learning_paths, sections, resources). Service role client bypasses RLS only for webhooks and trusted job tasks.
- **Database:** PostgreSQL via Supabase. Migrations in `supabase/migrations/`. Seed data in `supabase/seed.sql` (generated from JSON via `scripts/generate-seeds.js`).

## Anti-Patterns

### Synchronous AI Calls in Request Handlers
**What happens:** Temptation to call OpenRouter directly in path creation API instead of queuing background jobs
**Why it's wrong:** Blocks HTTP request for 30-60 seconds; kills user experience; times out on slow networks
**Do this instead:** Queue job in `app/api/paths/initiate/route.ts:194-203`, let client poll status, background worker executes generation

### Missing Rate Limit Check Before Resource Creation
**What happens:** If rate limit check is skipped, users can create unlimited paths
**Why it's wrong:** Violates subscription tiers; causes billing disputes
**Do this instead:** Check rate limit before creating path record (`app/api/paths/initiate/route.ts:86-131`); increment counter is built into path record creation

### Storing Secrets in Config Files
**What happens:** Stripe keys, API keys hardcoded in config.ts
**Why it's wrong:** Leaked on git; exposed in browser if not careful
**Do this instead:** Load from environment variables; use service role key only on server; never expose in config.tsx context

### Forgetting to Await Supabase Client in Next.js 15
**What happens:** `const supabase = createClient()` without await in server components
**Why it's wrong:** Supabase client is async in Next.js 15 (needs cookie store)
**Do this instead:** Always await: `const supabase = await createClient()`

### Not Validating Model Against Tier Before Queueing
**What happens:** Client requests premium model on free tier; job fails downstream
**Why it's wrong:** Wastes job queue slot; poor UX
**Do this instead:** Validate model server-side before queueing (`app/api/paths/initiate/route.ts:69-84`)

## Error Handling

**Strategy:** Layered error handling with graceful degradation

**Patterns:**

1. **Validation (Zod):**
   - API routes validate input with Zod schemas
   - Return 400 Bad Request with `ZodError` details if invalid
   - Example: `PathGenerationRequestSchema.parse(body)` in `app/api/paths/initiate/route.ts:35`

2. **Authentication/Authorization:**
   - Check `supabase.auth.getUser()` in all protected routes
   - Return 401 if not authenticated
   - Check role via `getAccountWithRole()` for team actions
   - Return 403 if unauthorized

3. **Business Logic:**
   - Rate limit check returns 429 Too Many Requests
   - Model validation returns 403 (not available on tier)
   - Path not found returns 404

4. **Background Jobs:**
   - Task fails → worker catches exception
   - Logs to console and Sentry (with job context)
   - Retry up to 3 times (configurable)
   - Final failure → queue `notify_generation_failed`
   - Path marked `failed` with error message
   - Example: `worker.ts:68-105` (job:error handler)

5. **Resource Replacement:**
   - If > 3 broken links found during validation: queue replacement job
   - If < 5 resources per section: queue enrichment job
   - Graceful fallback: if replacement/enrichment fails, return path with fewer resources (better incomplete than failed)

6. **External Service Failures:**
   - OpenRouter down: job fails, retries 3 times, notifies user
   - Unsplash down: use placeholder image, continue
   - Link validation fails: mark as broken, replace if needed
   - Stripe webhook fails: log error, webhooks retried by Stripe

## Cross-Cutting Concerns

**Logging:** Console.log in background jobs with context (path ID, job type, attempt number). Structured logging via Axiom in production (optional, via `@axiomhq/nextjs`).

**Validation:** Zod schemas for all inputs. TypeScript for compile-time type safety. Job payloads validated at type level (no Zod needed).

**Authentication:** Supabase Auth (Google OAuth, Email). Session stored in httpOnly cookie (managed by Supabase SSR). `requireAuth()` helper redirects to login if not authenticated.

**Rate Limiting:** Monthly quotas enforced at path creation time (not per-job). Tier-based formula in `getRateLimit()` function.

**Error Tracking:** Sentry integration in worker for background job errors. Configured in `worker.ts:22-36`.

**Analytics:** Swetrix (privacy-friendly) for page views, user interactions. Configured in `app/(main)/layout.tsx:4` and `app/(dashboard)/layout.tsx:6`.

---

*Architecture analysis: 2026-07-03*
