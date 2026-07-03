# Constraints (Intel)

Technical constraints, NFRs, and contracts extracted from DOC-level sources (no SPECs present).
Grouped by type: nfr | api-contract | schema | protocol.

---

## CON-worker-required (nfr)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- type: nfr
- content: The Graphile Worker process (npm run worker / worker:dev) MUST be running or path generation stalls indefinitely in "pending". Worker is a separate deployable that must share DATABASE_URL with the web service. Config: WORKER_CONCURRENCY=3, WORKER_POLL_INTERVAL=1000.

## CON-nextjs15-async-apis (nfr)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- type: nfr
- content: Next.js 15 async APIs must be awaited — dynamic route params (Promise), headers(), cookies(), and the Supabase server client (await createClient()). Client-side createClient() is synchronous.

## CON-rls-security (nfr)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- type: nfr
- content: All core tables enforce Row-Level Security. Anon key = client-side, RLS enforced. Service-role key = server-only, bypasses RLS; use only for webhooks/admin. Never expose SUPABASE_SERVICE_ROLE_KEY on the client.

## CON-input-validation (nfr)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- type: nfr
- content: All API inputs validated with Zod schemas (libs/validation/). ZodError → 400; unauthenticated → 401; unexpected → 500.

## CON-webhook-signature (protocol)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- type: protocol
- content: Stripe webhook signatures MUST be verified via stripe.webhooks.constructEvent using STRIPE_WEBHOOK_SECRET before processing. Production webhook URL: https://viapro.to/api/webhook/stripe.

## CON-rate-limit-before-create (nfr)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- type: nfr
- content: Rate-limit checks execute BEFORE path/resource creation to prevent quota exhaustion. Paths count against quota at initiation, not completion.

## CON-job-retry-policy (protocol)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- type: protocol
- content: Each of the three generation jobs retries up to 3 times on failure; on permanent failure notify_generation_failed emails the user.

## CON-free-tier-public (nfr)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- type: nfr
- content: Free-tier paths are always public (cannot be set private). Free tier is limited to the models with minimumTier "free" — 10 in the current catalog (docs said 7; CODE-VERIFIED 2026-07-03). Enforced in app/api/paths/initiate/route.ts (visibility at :147-152; model gating at :73-84).

## CON-api-contract-paths (api-contract)
- source: /Users/chazona/Repos/saas/via-proto/README.md, /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- type: api-contract
- content: |
  Path generation:
    POST /api/paths/initiate      — create path, queue generate_metadata
    GET  /api/paths/[id]/status   — poll generation status
    GET  /api/paths/[id]          — path details
  Other:
    POST /api/stripe/create-checkout
    POST /api/stripe/create-portal
    POST /api/webhook/stripe
    GET  /api/models              — list available AI models
    GET  /api/topics              — topic typeahead search

## CON-db-schema (schema)
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- type: schema
- content: |
  Core tables (all with RLS):
    profiles          — 1:1 with auth.users
    accounts          — billing entity (personal/team); holds stripe_customer_id,
                        stripe_subscription_id, subscription_tier (free/pro/team),
                        subscription_status (active/past_due/canceled), seat_count
    account_users     — many-to-many user ↔ account
    topics            — pre-seeded (~500+)
    learning_paths    — belongs to account; has status field (multi-stage)
    sections          — ordered sections within a path
    resources         — videos/articles/books/projects
    unsplash_images   — cached cover images
  Migrations: supabase/migrations/ (timestamped). Seed: supabase/seed.sql from data/*.json via scripts/generate-seeds.js.

## CON-model-catalog-shape (schema)
- source: /Users/chazona/Repos/saas/via-proto/README.md, /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- type: schema
- content: |
  MODEL_CATALOG entry (libs/models/model-config.ts):
    id, name, provider, minimumTier, costTier,
    supportsWebSearch, supportsStructuredOutput, description, featured?
  costTier ∈ {free, low, medium, high, premium}
  minimumTier ∈ {free, pro, team} — RESOLVED 2026-07-03 against model-config.ts:6
    (CLAUDE.md was correct; README's {free, pro} was an incomplete example).
    In practice no model sets minimumTier "team" (10 free + 28 pro; ~39 catalog entries).

## CON-node-version (nfr)
- source: /Users/chazona/Repos/saas/via-proto/README.md
- type: nfr
- content: Node.js 18+ required. Supabase CLI required for local DB.
