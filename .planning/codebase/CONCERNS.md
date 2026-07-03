<!-- refreshed: 2026-07-03 -->
# Codebase Concerns

**Analysis Date:** 2026-07-03

## Critical Concerns

### Worker Dependency Fragility

**What happens:** Learning path generation completely stalls if the Graphile Worker process is not running. Paths remain stuck in `pending` or intermediate states indefinitely with no user notification.

**Why it's wrong:**
- Users initiate path generation via `POST /api/paths/initiate` (creates path, queues job)
- Polling via `GET /api/paths/[id]/status` returns current state but doesn't indicate if worker is hung
- If worker crashes or isn't started, no jobs process but users see "generating" indefinitely
- No alerting mechanism to detect stalled paths
- Production deployment requires **both** services (web + worker) — missing either silently breaks generation

**Files involved:**
- `worker.ts` - Worker entry point, no health check endpoint
- `app/api/paths/initiate/route.ts` - Creates path then queues job
- `libs/jobs/queue.ts` - Job queuing, assumes worker will eventually consume
- `app/api/paths/[id]/status/route.ts` - Status polling, no worker health indicator

**Do this instead:**
1. Add worker health check endpoint (`GET /api/worker/health`)
2. Store job execution metadata: `last_picked_up_at`, `stuck_threshold` (e.g., 1 hour without progress)
3. Add Sentry alerts for jobs stuck in a state > 1 hour
4. Dashboard warning: "Generation service temporarily unavailable" if worker health check fails
5. Document **mandatory requirement**: "Deploy web and worker as separate services; both must be running"

---

### Zero Test Coverage

**What happens:** No unit, integration, or E2E tests exist in the project. Critical business logic has no automated verification.

**Why it's wrong:**
- Path generation flow (3-stage job chain) has complex state transitions with no test coverage
- Stripe webhook handler (`app/api/webhook/stripe/route.ts`) processes payments with no test isolation
- Rate limiting logic (`app/api/paths/initiate/route.ts:109-131`) has edge cases (pro = 10, team = 20 + 6 per seat) uncovered
- Model tier access control (`app/api/paths/initiate/route.ts:65-84`) gates models by subscription — no tests verify this works
- Account setup during signup (`app/api/auth/setup-account/route.ts`) creates personal account — potential race conditions untested
- Regression risk: Future changes to quota calculation, webhook handling, or job orchestration have zero safety net

**Files affected:**
- `app/api/` - All 20+ API routes unprotected
- `libs/jobs/tasks/` - 9 background job implementations, each 300-700 lines, unverified
- `libs/accounts.ts` - Account creation, tier checking, quota calculation
- `libs/stripe.ts` - Stripe utilities used by webhook handler

**Do this instead:**
1. Add Jest/Vitest + test configuration
2. Start with critical path: `POST /api/paths/initiate` (rate limit validation, model access, path creation)
3. Add webhook tests: verify Stripe signature validation, account updates, tier transitions
4. Add job chain tests: mock database, verify metadata → image → sections sequencing
5. Minimum viable target: 60% coverage on `libs/` and `app/api/`

---

## Tech Debt & Fragile Areas

### Large Component and Job Task Files

**Problem:** Several files exceed 700 lines, mixing concerns:

**Files:**
- `libs/jobs/tasks/generate-sections-resources.ts` (719 lines) - Fetch metadata, call AI, insert sections, queue next job
- `components/paths/SectionTimeline.tsx` (797 lines) - Render sections, handle edits, modal state, validation
- `libs/link-metadata.ts` (985 lines) - URL validation, oEmbed APIs, fallback strategies for 10+ platforms
- `libs/jobs/tasks/enrich-sections.ts` (568 lines) - Resource metadata enrichment + API calls
- `libs/jobs/tasks/research-resources.ts` (448 lines) - Web search, resource ranking, validation

**Impact:** 
- Difficult to test isolated behavior (no seams for mocking)
- Harder to debug when something breaks
- High cognitive load for future modifications
- Job task files mix database, API calls, error handling, and orchestration

**Do this instead:**
- Extract URL validation from `link-metadata.ts` into separate `validateUrl()`, `checkUrlStatus()`, `fetchOEmbedData()` functions
- Break `generate-sections-resources.ts` into stages: `fetchMetadata()`, `callAI()`, `validateSections()`, `persistSections()`
- Move modal state logic from `SectionTimeline.tsx` into custom hooks (`useResourceEditor`, `useSectionEditor`)

---

### Missing Environment Variable Validation at Startup

**Problem:** Critical environment variables are accessed at runtime with no validation that they're set. If a variable is missing, app crashes mid-request instead of at startup.

**Files affected:**
- `worker.ts` (line 43-46) - Checks `DATABASE_URL` but no other critical vars
- `app/api/webhook/stripe/route.ts` (line 10, 14) - Assumes `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` exist
- `libs/openrouter.ts` (line 6) - Assumes `OPENROUTER_API_KEY` exists
- `libs/supabase/service.ts` - Assumes `SUPABASE_SERVICE_ROLE_KEY` exists

**Impact:** Transient failures in production if env vars not set during deployment

**Do this instead:**
1. Create `validateEnv()` function in root or in each process entry point
2. Call before any business logic:
   ```typescript
   const requiredVars = [
     'NEXT_PUBLIC_SUPABASE_URL',
     'SUPABASE_SERVICE_ROLE_KEY',
     'OPENROUTER_API_KEY',
     'STRIPE_SECRET_KEY',
     'DATABASE_URL' // worker only
   ];
   ```
3. Fail fast in `worker.ts` and Next.js root layout if validation fails

---

### Integer Casting in Rate Limit Calculation

**Problem:** `app/api/paths/initiate/route.ts:109-131` casts team seat count to compute quota. Integer arithmetic with defaults could overflow or produce incorrect results.

```typescript
if (tier === 'team') {
  const additionalSeats = Math.max(0, seatCount - 2);
  return 20 + (additionalSeats * 6);  // Could be 20 + Infinity if seatCount is null/NaN
}
```

**Risk:** If `account.seat_count` is null or undefined, `Math.max()` and multiplication could produce NaN, bypassing rate limiting.

**Files:** `app/api/paths/initiate/route.ts:109-131`

**Do this instead:**
```typescript
const limit = getRateLimit(
  account.subscription_tier,
  account.seat_count ?? 1  // Explicit null-coalescing
);
```
Add validation in account creation to ensure `seat_count` is never null.

---

### Stripe Webhook Idempotency Not Tracked

**Problem:** `app/api/webhook/stripe/route.ts` processes webhook events without explicit idempotency checking. If Stripe retries an event, the handler may process it twice.

**Scenario:** Webhook for `checkout.session.completed` arrives twice (network retry). Both times:
- `checkout.session.completed` handler updates account with same `stripe_subscription_id`
- First update succeeds; second is duplicate but undetected
- For `invoice.paid`, same update happens twice (less harmful for this one)

**Files:** `app/api/webhook/stripe/route.ts`

**Impact:** 
- Account updates are idempotent (UPDATE by id), so mostly safe
- But logs will show duplicate processing; harder to debug
- Revenue reporting could double-count if logic changes

**Do this instead:**
1. Store processed webhook event IDs in database table `stripe_webhook_events(event_id, processed_at)`
2. Check before processing:
   ```typescript
   const { data: existing } = await supabase
     .from('stripe_webhook_events')
     .select('id')
     .eq('event_id', event.id)
     .single();
   
   if (existing) {
     return NextResponse.json({ status: 'already_processed' });
   }
   ```
3. Upsert after successful processing

---

### Error Handling in Database `.single()` Calls

**Problem:** Multiple places use `.single()` without descriptive error messages. If query returns 0 or 2+ rows, error message is generic.

**Examples:**
- `libs/jobs/tasks/generate-sections-resources.ts:417` - `.single()` on path fetch, error message is vague
- `libs/jobs/tasks/fetch-unsplash-image.ts:42` - `.single()` with generic error
- `app/api/paths/[id]/status/route.ts:28-41` - Fetches path twice with `.single()`

**Impact:** Debugging job failures is harder; logs don't clarify if path not found or query returned multiple rows.

**Files:**
- `libs/jobs/tasks/generate-sections-resources.ts` (11 `.single()` calls)
- `libs/jobs/tasks/fetch-unsplash-image.ts` (10 `.single()` calls)
- `libs/jobs/tasks/validate-and-finalize.ts` (5 `.single()` calls)

**Do this instead:**
```typescript
const { data: path, error: pathError } = await supabase
  .from('learning_paths')
  .select('*')
  .eq('id', pathId)
  .single();

if (pathError) {
  if (pathError.code === 'PGRST116') { // No rows
    throw new Error(`Path ${pathId} not found (query returned 0 rows)`);
  }
  if (pathError.code === 'PGRST117') { // Multiple rows
    throw new Error(`Path query returned multiple rows for id=${pathId} — data corruption`);
  }
  throw pathError; // Other error
}
```

---

### Link Metadata Validation Over-Complexity

**Problem:** `libs/link-metadata.ts` (985 lines) implements fallback strategies for URL validation:
1. Try oEmbed API (for YouTube, Vimeo, Spotify, etc.)
2. Fall back to platform-specific API (GitHub)
3. Fall back to HEAD request with browser User-Agent
4. Fall back to full GET request
5. Lenient domain checks for bot-blocking sites

**Risks:**
- Multiple external API calls create cascading failures
- If oEmbed times out, falls to HEAD (slow user experience)
- Some URLs marked "active" with low confidence (HEAD-only check)
- Hard to test; depends on real external APIs

**Files:** `libs/link-metadata.ts` (used by resource validation jobs)

**Impact:** Resource validation is slow and brittle; links may be incorrectly marked active/broken

**Do this instead:**
1. Add caching for validation results (1-week TTL in database)
2. Split into smaller functions: `checkOEmbed()`, `checkGitHub()`, `checkHTTP()`, `classifyDomain()`
3. Add timeout enforcement (5 seconds per check) and fallback more aggressively
4. Consider async queuing: validate resource URLs in background, mark as `unchecked` until complete

---

## Performance Concerns

### Polling-Based Status Updates

**Problem:** Client polls `GET /api/paths/[id]/status` every 2-3 seconds during generation. Generation takes 2-15 minutes, so 40-400 queries per path generated.

**Files:** `app/(main)/paths/...` (polling logic) → `app/api/paths/[id]/status/route.ts`

**Impact:**
- Database load increases linearly with concurrent generation count
- Polling adds latency (client waits 2-3 sec between status checks)
- Not real-time feedback

**Do this instead:**
1. Implement WebSocket or Server-Sent Events (SSE) for real-time status
2. Or: Increase polling interval to 5-10 seconds (acceptable UX, reduces DB load 2-4x)
3. Or: Cache status in Redis with short TTL (1 second) to avoid repeated DB queries

---

### Unsplash Image Fetching Without Caching

**Problem:** `libs/jobs/tasks/fetch-unsplash-image.ts` calls Unsplash API for every path, even if image for topic already cached.

**Code:** `libs/unsplash.ts:49` mentions caching plan but not fully implemented.

**Impact:** Rate limits on Unsplash API; duplicate requests for same topic

**Do this instead:**
1. Check `unsplash_images` table first: `topic_name` + `query` → cached image
2. Only call API if cache miss
3. Store in `unsplash_images(topic_name, query, image_url, cached_at)`

---

### N+1 Queries in Path List Endpoint

**Problem:** `app/api/paths/route.ts:57-70` selects paths with relations (topics, profiles, accounts). If 50 paths returned, each relation is potentially a separate query.

**Files:** `app/api/paths/route.ts`

**Impact:** Slow list endpoint under load; database connection pool exhaustion

**Note:** Supabase should batch these, but worth monitoring in production logs.

---

## Security & Access Control

### Public Path Visibility Not Clearly Documented

**Problem:** Free tier accounts always have paths public; Pro/Team can choose. This is enforced in `app/api/paths/initiate/route.ts:148-152` but:
- Not obvious in UI
- No warning to free users that paths are discoverable
- Public paths endpoint (`view=public`) has no rate limiting

**Files:**
- `app/api/paths/initiate/route.ts:148-152` - Enforces public visibility
- `app/api/paths/route.ts:77-78` - Public paths query
- No clear UI warning

**Do this instead:**
1. Add banner in dashboard: "Free tier paths are always public"
2. Rate limit public path endpoint
3. Consider obfuscating free tier path URLs (UUID without direct pattern)

---

### Service Role Key Usage Verified

**Status:** Service role key is used appropriately in:
- `app/api/webhook/stripe/route.ts` - Correct (webhook processing)
- `app/api/auth/setup-account/route.ts` - Correct (account creation)
- `app/api/auth/callback/route.ts` - Correct (OAuth callback)
- `app/api/invitations/accept/route.ts` - Correct (invitation lookup)

These usages are intentional and justified (bypassing RLS needed for these operations). No concerns here.

---

## Known Gaps & Limitations

### Rate Limit Precision

**Issue:** Rate limits are checked at `POST /api/paths/initiate` (path creation time), not at job start time. This is correct but creates edge case:
- User initiates 5 paths quickly (all succeed rate limit check)
- Later in month, paths complete
- This is intended behavior but could confuse users who see "5 pending" but quota says "0/5"

**Files:** `app/api/paths/initiate/route.ts:86-131`

**Fix needed:** None—this is correct behavior, but document it.

---

### Model Catalog Manual Maintenance

**Problem:** AI models must be manually added to `libs/models/model-config.ts`. No sync with OpenRouter `/v1/models` endpoint.

**Risk:** Catalog can become stale; deprecated models remain available; new models not added

**Files:** `libs/models/model-config.ts` (591 lines, all manual)

**Do this instead:**
1. Periodically (monthly) fetch `https://openrouter.ai/api/v1/models` to audit catalog
2. Add Sentry alert if known models are no longer available
3. Consider auto-updating pricing/cost tiers from OpenRouter API

---

### xAI/Grok Policy Compliance

**Status:** ✅ No xAI or Grok models in `MODEL_CATALOG`. Policy is enforced (owner pays inference costs, model excluded by principle).

**Verification:** Searched `model-config.ts` — no xAI, Grok, or `x-ai/` prefixes found.

---

## Documentation Gaps

### Deployment Checklist Accuracy

**Files affected:** `README.md:297-305` (Production Checklist)

**Status:** Current checklist is accurate and up-to-date with TinaCMS-based blog.

**Previously stale items:** No references to abandoned Payload CMS migration found.

---

### Worker Restart Documentation Missing

**Problem:** No clear documentation on how to restart worker in production. Coolify setup instructions exist but monitoring/restart procedures are vague.

**Files:** `README.md:273-308` (Deployment section)

**Do this instead:**
1. Add to README: "Monitor worker in production: `journalctl -u viapro-worker` (systemd) or Coolify logs"
2. Document automatic restart policy: Worker should restart on crash
3. Alert on worker exit: Configure Sentry to alert if worker crashes 3+ times in 1 hour

---

## Monitoring & Observability Gaps

### No Job Failure Alerts

**Problem:** When a background job fails permanently (exhausts retries), `notify_generation_failed` job queues an email to user. No system-level alert to admin/ops.

**Files:**
- `worker.ts:88-104` - Queues notification job on final failure
- `libs/jobs/tasks/notify-generation-failed.ts` - Sends email only

**Impact:** If email sending fails or is blocked, admin won't know about systematic issues (e.g., OpenRouter API down, database connection drops)

**Do this instead:**
1. Add Sentry alert on job failure: tag with `job_type`, `error`, `attempt_count`
2. Track metric: jobs failed per hour; alert if > 5% failure rate
3. Log failed job details to structured logger (Axiom is already integrated)

---

### Missing Deadletter Queue Behavior

**Problem:** If `notify_generation_failed` job fails, no deadletter handling. User never learns their path failed.

**Files:** `libs/jobs/tasks/notify-generation-failed.ts`

**Do this instead:**
1. Store failed path IDs in `failed_paths(path_id, reason, error_message, created_at)`
2. Add admin dashboard widget: "Failed paths awaiting retry"
3. Implement retry logic or manual admin intervention

---

## Recommendations by Priority

### P0 (Critical)

1. **Add worker health monitoring** - Health endpoint + Sentry alerts for stuck jobs
2. **Implement webhook idempotency** - Track processed Stripe events to prevent double-processing
3. **Add minimum tests** - Critical path generation and Stripe webhook handler

### P1 (High)

1. **Validate environment variables at startup** - Fail fast before requests fail
2. **Improve error messages in database queries** - Better debugging of job failures
3. **Add job failure alerts** - Sentry integration for permanent failures

### P2 (Medium)

1. **Refactor large files** - Break up `generate-sections-resources.ts`, `link-metadata.ts`
2. **Optimize polling** - Move to SSE or increase interval
3. **Implement URL validation caching** - Reduce external API calls

### P3 (Low)

1. **Audit model catalog against OpenRouter** - Monthly sync check
2. **Document worker restart procedures** - Add to deployment guide
3. **Implement WebSocket for real-time updates** - Nice-to-have, not critical

---

*Concerns audit: 2026-07-03*
