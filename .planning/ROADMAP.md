# Roadmap: ViaProto

## Overview

**Retrospective baseline — Milestone 1 (v1, shipped).** This roadmap reconstructs the work
that *already produced* the production-live ViaProto product at https://viapro.to. It maps
the 9 v1 requirements onto five delivery phases, from platform foundation through the AI
generation engine, monetization, team collaboration, and public/marketing surface. All phases
are COMPLETE. Future work enters through `/gsd-new-milestone`; this document exists to give GSD
an accurate as-built foundation, not to schedule pending work.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Platform Foundation & Topic Catalog** - Next.js 15 app, Supabase auth + RLS schema, and searchable seeded topics
- [x] **Phase 2: AI Learning-Path Generation Engine** - Async multi-stage generation of resource-verified paths with tier-gated model selection
- [x] **Phase 3: Subscription Billing & Rate Limits** - Stripe subscriptions with webhook-driven state and per-tier quota enforcement
- [x] **Phase 4: Team Accounts & Collaboration** - Seat-based team accounts with pooled quota, invites, and account switching
- [x] **Phase 5: Public Discovery & Blog** - Public path exploration and a TinaCMS-backed marketing blog

## Phase Details

### Phase 1: Platform Foundation & Topic Catalog
**Goal**: A deployed, authenticated Next.js 15 app with a secure per-account data model and a searchable catalog of learning topics — the substrate every feature builds on.
**Depends on**: Nothing (first phase)
**Requirements**: REQ-topic-search
**Success Criteria** (what must be TRUE):
  1. A visitor can register and sign in via Google OAuth or email and reach an authenticated dashboard.
  2. A signed-in user sees typeahead suggestions drawn from the ~500+ seeded topic catalog as they type.
  3. Data access is scoped per account by Row-Level Security — a user cannot read another account's rows.
  4. The app runs live at viapro.to with the web and worker services deployed (Coolify → Hetzner) sharing one database.
**Plans**: As-built (delivered pre-GSD; not decomposed into GSD plans)
**Status**: COMPLETE
**UI hint**: yes

### Phase 2: AI Learning-Path Generation Engine
**Goal**: A user describes a goal and receives a structured, resource-backed learning path generated asynchronously, with the model choice and live progress they expect.
**Depends on**: Phase 1
**Requirements**: REQ-path-generation, REQ-generation-status-tracking, REQ-model-selection
**Success Criteria** (what must be TRUE):
  1. A user submits a topic + skill level (+ optional goals/model) and a path begins generating.
  2. The client shows live status transitions (`pending → generating_metadata → fetching_image → curating_resources → completed`) polled every 2-3 seconds.
  3. A completed path contains 5-8 sections, each with 3-7 web-verified resources that are typed and labeled free vs paid, with an Unsplash cover image.
  4. A user can pick from the tier-appropriate set of AI models (10 for free tier, full ~39-model catalog for Pro/Team) before generating.
  5. On permanent generation failure (after 3 job retries), the user receives a notification email.
**Plans**: As-built (delivered pre-GSD; not decomposed into GSD plans)
**Status**: COMPLETE
**UI hint**: yes

### Phase 3: Subscription Billing & Rate Limits
**Goal**: Users are billed via Stripe subscriptions and their generation usage is metered against tier quotas before any work is done.
**Depends on**: Phase 2
**Requirements**: REQ-subscription-billing, REQ-rate-limiting
**Success Criteria** (what must be TRUE):
  1. A user can upgrade to Pro via Stripe checkout and manage or cancel their plan via the billing portal.
  2. Subscription tier and status update automatically from signature-verified Stripe webhooks onto the `accounts` table.
  3. Generation is blocked with a clear message once the monthly quota for the tier is exhausted (Free 1/mo, Pro 10/mo, Team 20 + 6/seat beyond 2), and quota is consumed at initiation.
  4. Free-tier restrictions are enforced — free paths are forced public and limited to the 10 free models.
**Plans**: As-built (delivered pre-GSD; not decomposed into GSD plans)
**Status**: COMPLETE
**UI hint**: yes

### Phase 4: Team Accounts & Collaboration
**Goal**: Multiple users share a single team account with pooled, seat-scaled generation quota.
**Depends on**: Phase 3
**Requirements**: REQ-team-collaboration
**Success Criteria** (what must be TRUE):
  1. A team owner can invite members and an invitee can accept membership via an invite link.
  2. Team members share a pooled monthly quota that scales with seat count (20 + 6 × additional seats beyond 2).
  3. A user who belongs to more than one account can switch which account is active.
**Plans**: As-built (delivered pre-GSD; not decomposed into GSD plans)
**Status**: COMPLETE
**UI hint**: yes

### Phase 5: Public Discovery & Blog
**Goal**: Anyone can discover public learning paths and read the marketing blog without an account.
**Depends on**: Phase 2
**Requirements**: REQ-public-path-discovery, REQ-blog
**Success Criteria** (what must be TRUE):
  1. An unauthenticated visitor can browse public paths on `/explore` and open a public path detail page at `/paths/[id]`.
  2. Free-tier generated paths appear publicly and cannot be made private.
  3. Visitors can read blog posts, and an editor can author/edit posts through the TinaCMS visual editor with changes committed to git.
**Plans**: As-built (delivered pre-GSD; not decomposed into GSD plans)
**Status**: COMPLETE
**UI hint**: yes

## Progress

**Execution Order:**
Phases executed in numeric order: 1 → 2 → 3 → 4 → 5 (all complete).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Platform Foundation & Topic Catalog | as-built | Complete | 2026-07-03 (reconstructed) |
| 2. AI Learning-Path Generation Engine | as-built | Complete | 2026-07-03 (reconstructed) |
| 3. Subscription Billing & Rate Limits | as-built | Complete | 2026-07-03 (reconstructed) |
| 4. Team Accounts & Collaboration | as-built | Complete | 2026-07-03 (reconstructed) |
| 5. Public Discovery & Blog | as-built | Complete | 2026-07-03 (reconstructed) |

> "Completed" dates reflect when this retrospective baseline was reconstructed, not the original
> historical ship dates (which predate GSD adoption).
