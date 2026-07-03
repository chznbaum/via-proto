# Decisions (Intel)

Extracted architectural/technical decisions. Both sources are DOC-level (no ADRs); these
are de-facto decisions embodied in the existing codebase documentation. None are LOCKED.
Downstream (roadmapper) should treat these as observed status quo, not immutable ADRs.

---

## DEC-framework-nextjs15
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed (DOC-level, not locked)
- decision: Build on Next.js 15 (App Router), version 15.1.8, with React 19 and TypeScript 5.9.2 (strict mode).
- scope: application framework
- note: Corroborated by both docs. Next.js 15 async-API patterns (await params/headers/cookies) are mandatory conventions.

## DEC-database-supabase
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Use Supabase (PostgreSQL) as the database with Row-Level Security enforced on all core tables; Supabase Auth for authentication (Google OAuth + Email).
- scope: database + auth
- note: Corroborated. Service-role key bypasses RLS and is server-only.

## DEC-ai-openrouter
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Route all AI generation through OpenRouter (40+ models: Claude, GPT, Gemini, DeepSeek, etc.) via the OpenAI SDK, with structured JSON output.
- scope: AI generation
- note: Corroborated. Model catalog defined in libs/models/model-config.ts.
- constraint reference: No xAI/Grok models (per user memory / owner policy) — not stated in either doc but a standing exclusion.

## DEC-payments-stripe
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Subscription billing via Stripe with webhook-driven state; subscription data persisted on the accounts table.
- scope: payments/billing

## DEC-background-jobs-graphile
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Long-running path generation runs as three sequential Graphile Worker background jobs (generate_metadata → fetch_unsplash_image → generate_sections_resources), each retrying up to 3 times.
- scope: async processing
- note: Worker is a separate deployable process and is REQUIRED for path generation.

## DEC-styling-tailwind4-daisyui
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Tailwind CSS v4 (CSS-first config, no tailwind.config.js) + DaisyUI 5; all theme customization in app/globals.css via @theme; PostCSS plugin is @tailwindcss/postcss.
- scope: styling

## DEC-blog-cms-tinacms
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Blog uses TinaCMS (git-based, TinaCloud) with MDX content in content/posts/.
- scope: blog/CMS
- note: Corroborated by both docs. The stale Payload-CMS deployment doc was deliberately excluded upstream; TinaCMS is the single source of truth for the blog CMS decision.

## DEC-email-resend
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Transactional email via Resend (used for generation-failure notifications).
- scope: email

## DEC-images-unsplash
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Path cover images sourced from the Unsplash API and cached in unsplash_images.
- scope: media

## DEC-deployment-coolify
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Deploy via Coolify as two services (Web: Next.js; Worker: background processor) sharing the same DATABASE_URL. README adds: Coolify targets a Hetzner VPS with BunnyCDN for DNS/CDN.
- scope: deployment/infra

## DEC-accounts-billing-entity
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Accounts (not users) are the billing/ownership entity. Learning paths belong to accounts. Personal accounts = 1 user/1 seat; Team accounts = 2+ users with shared quota.
- scope: account model

## DEC-license-proprietary
- source: /Users/chazona/Repos/saas/via-proto/README.md
- status: observed
- decision: Proprietary, all rights reserved. Not open source.
- scope: licensing
