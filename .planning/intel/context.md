# Context (Intel)

Running notes from DOC-level sources, keyed by topic, appended verbatim-in-substance with
source attribution. Both docs corroborate the same product.

---

## Product Overview
- source: /Users/chazona/Repos/saas/via-proto/README.md, /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- ViaProto is an AI-powered learning-path generator: describe a goal, get a structured path from
  fundamentals to mastery, each step backed by a real, verified resource.
- Solves information overload / deteriorating search quality (SEO-gamed content farms).
- Target audience: professionals needing to upskill quickly amid layoffs and automation.
- Live at https://viapro.to. Dev port 3001.
- Output described as "20-100+ hours of curated learning content" per path.

## Path Generation Flow
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, README.md (+ CODE-VERIFIED 2026-07-03)
- User selects topic + skill level + optional goals + optional model → system checks rate
  limits and model access → chained background jobs → status polled by client → completed.
- CORRECTION: the docs describe "three sequential jobs," but libs/jobs/tasks/ contains a richer
  pipeline of 8 generation-stage tasks + a failure notifier: generate-metadata, fetch-unsplash-image,
  generate-sections-resources, research-resources, enrich-sections, validate-resource-links,
  replace-broken-resources, validate-and-finalize (+ notify-generation-failed). See
  .planning/codebase/ARCHITECTURE.md for the authoritative flow and ordering.
- Resource-verification stages (research-resources / generate-sections-resources / validate-resource-links)
  perform web search to verify and repair resource URLs.

## Development Workflow
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md, /Users/chazona/Repos/saas/via-proto/README.md
- Two terminals required: `npm run dev` (web, :3001) and `npm run worker:dev` (worker).
- Local DB: `supabase start`, `supabase db reset`, seeds via `node scripts/generate-seeds.js`.
- Stripe local: `stripe listen --forward-to localhost:3001/api/webhook/stripe`.
- Testing checklist (CLAUDE.md): dev server + worker + supabase running, user authed, quota
  remaining, valid topic, OpenRouter key set.

## Naming & Conventions
- source: /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- Files kebab-case; Components PascalCase; functions/vars camelCase.
- Import order: React/Next → third-party → components/ → libs/ → types/ → config → relative.
- TypeScript strict; prefer interface for object shapes; import type for type-only; Zod for runtime validation.

## Route Group Architecture
- source: /Users/chazona/Repos/saas/via-proto/README.md (+ CODE-VERIFIED 2026-07-03)
- RESOLVED: the actual app/ tree has THREE top-level route groups — (auth), (dashboard), (main) —
  plus app/api/. README was correct; CLAUDE.md's nested "(main) is outer, (dashboard)/auth nest
  inside" description is STALE.
  - (auth): login, register, callback
  - (dashboard): dashboard, account, skills, upgrade, progress
  - (main): explore, paths, blog, invite, privacy, terms, [...not-found]
  - app/api/: paths, stripe, webhook, models, topics, accounts, invitations, tracking,
    competencies, user-competencies, search, lead, error-report, health, auth
- Root app/layout.tsx sets metadataBase; (main)/layout.tsx owns html/body/fonts/analytics (Swetrix).

## Deployment / Infra
- source: /Users/chazona/Repos/saas/via-proto/README.md, /Users/chazona/Repos/saas/via-proto/CLAUDE.md
- Coolify → Hetzner VPS, BunnyCDN for DNS/CDN, SSL auto-handled by Coolify.
- Two services: Web (npm run build / npm run start) and Worker (npm install / npm run worker),
  sharing DATABASE_URL; worker restart policy: always.
- Pre-deploy: supabase db push, seed topics, configure Stripe webhook, verify env vars & RLS.

## Support & Licensing
- source: /Users/chazona/Repos/saas/via-proto/README.md
- Contacts: support@viapro.to, privacy@viapro.to, security@viapro.to.
- License: Proprietary, all rights reserved. Not open source.

## Standing Policy (from user memory, not in source docs)
- xAI/Grok models are excluded from the OWNER-FUNDED model catalog (owner won't fund xAI/Grok
  inference). CLARIFIED 2026-07-03: not absolute — the planned bring-your-own-keys (BYOK) milestone
  will let users on their own OpenRouter key choose any model, including xAI/Grok. Keep them out of
  the owner-paid default catalog only.
