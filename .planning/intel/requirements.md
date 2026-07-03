# Requirements (Intel)

Derived from DOC-level sources (no PRDs present). These are product capabilities described
in existing docs, restated as requirements for downstream roadmapping. No formal acceptance
criteria existed in-source; acceptance is inferred from described behavior and marked as such.

---

## REQ-path-generation
- source: /Users/chazona/Repos/saas/via-proto/README.md, /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- description: Generate a personalized, structured learning path from a user-described goal/topic, skill level, and optional goals + optional AI model selection.
- acceptance (inferred):
  - Path contains 5-8 sections, each with 3-7 curated resources.
  - Resources are verified via AI web search and typed (video, article, book, project, course, etc.).
  - Each resource labeled free vs paid.
  - Generation runs asynchronously via background jobs with observable status.
- scope: core product

## REQ-generation-status-tracking
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- description: Provide multi-stage status tracking for in-progress generation, pollable by the client.
- acceptance (inferred):
  - Status transitions: pending → generating_metadata → fetching_image → curating_resources → completed.
  - Client polls GET /api/paths/[id]/status every 2-3 seconds.
  - On permanent failure (after 3 retries per job), user is emailed (notify_generation_failed).
- scope: core product

## REQ-model-selection
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- description: Offer 40+ AI models for generation, gated by subscription tier.
- acceptance (inferred):
  - Free tier: access to models with minimumTier "free" — 10 in the current catalog (docs said 7; CODE-VERIFIED 2026-07-03 via getModelsForTier in libs/models/model-config.ts:515-517).
  - Pro/Team: access to the full catalog (~39 models). No model uses minimumTier "team", so free/pro are the only live gate values.
  - Adding a model to MODEL_CATALOG makes it appear automatically in UI and generation API.
- scope: AI model system
- note: RESOLVED — minimumTier enum is {free, pro, team} per model-config.ts:6 (CLAUDE.md was correct); README's {free, pro} was an incomplete example.

## REQ-rate-limiting
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- description: Enforce monthly path-generation quotas by tier, checked before path creation.
- acceptance (CODE-VERIFIED 2026-07-03 against app/api/paths/initiate/route.ts:109-117):
  - Free: 1 path/month.
  - Pro: 10 paths/month. (CLAUDE.md said 5 — STALE.)
  - Team: 20 + (6 × additional seats beyond 2) paths/month. 2 seats=20, 5 seats=38, 10 seats=68. (Docs said "10 + 3×additional seats" — STALE.)
  - Paths count against quota at initiation, not completion.
- scope: account & billing

## REQ-subscription-billing
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- description: Stripe-based subscription billing with checkout, customer portal, and webhook-driven state.
- acceptance (inferred):
  - Checkout via POST /api/stripe/create-checkout; portal via POST /api/stripe/create-portal.
  - Webhook POST /api/webhook/stripe handles checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_succeeded/failed.
  - Webhook signatures verified.
  - Pricing (README): Pro $12/mo or $100/yr; Team $10/seat/mo.
- scope: payments

## REQ-team-collaboration
- source: /Users/chazona/Repos/saas/via-proto/README.md, /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- description: Team accounts with seat-based pricing, shared quota, and invite acceptance flow.
- acceptance (inferred):
  - account_users provides many-to-many user↔account.
  - Team quota scales with seat_count.
  - Invite acceptance route exists ((main)/invite per README).
- scope: accounts

## REQ-public-path-discovery
- source: /Users/chazona/Repos/saas/via-proto/README.md, /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- description: Public discovery (explore) and public path detail pages.
- acceptance (inferred):
  - /explore lists public paths; /paths/[id] shows public detail.
  - Free-tier paths are always public (cannot be private) — per CLAUDE.md.
- scope: public product

## REQ-blog
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- description: TinaCMS-backed blog with visual editor and git-committed MDX content.
- acceptance (inferred):
  - Admin editor at /admin/index.html; content in content/posts/.
  - Listing + [slug] post pages with live editing.
- scope: marketing/content

## REQ-topic-search
- source: /Users/chazona/Repos/saas/via-proto/README.md
- description: Typeahead topic search over pre-seeded topics.
- acceptance (inferred): GET /api/topics returns typeahead results from ~500+ seeded topics.
- scope: core product
