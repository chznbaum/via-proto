# Requirements: ViaProto

**Defined:** 2026-07-03
**Core Value:** A user describes a goal and receives a trustworthy, structured learning path where every step links to a real, verified resource.

> **Retrospective baseline.** These 9 requirements describe the v1 (Milestone 1) product that
> is already shipped and live at https://viapro.to. All are delivered and marked Complete.
> IDs are preserved from `.planning/intel/requirements.md`.

## v1 Requirements

### Path Generation

- [x] **REQ-path-generation**: User generates a personalized, structured learning path from a described goal/topic + skill level (+ optional goals and AI model). Path contains 5-8 sections, each with 3-7 curated resources; resources are verified via AI web search, typed (video/article/book/project/course), and labeled free vs paid; generation runs asynchronously.
- [x] **REQ-generation-status-tracking**: User sees pollable multi-stage generation status (`pending → generating_metadata → fetching_image → curating_resources → completed`), polled via `GET /api/paths/[id]/status`; on permanent failure (after 3 job retries) the user is emailed.
- [x] **REQ-topic-search**: User gets typeahead topic suggestions from ~500+ pre-seeded topics via `GET /api/topics`.

### AI Model System

- [x] **REQ-model-selection**: User selects from the AI model catalog (~39 models via OpenRouter), gated by subscription tier — free tier gets the 10 `minimumTier: "free"` models, Pro/Team get the full catalog (no team-exclusive models). Adding a model to `MODEL_CATALOG` surfaces it automatically in UI and generation. [Code-verified 2026-07-03: `libs/models/model-config.ts:515-517`]

### Accounts & Billing

- [x] **REQ-rate-limiting**: System enforces monthly path-generation quotas by tier, checked before path creation — Free 1/mo, Pro 10/mo, Team 20 + (6 × additional seats beyond 2)/mo (2 seats=20, 5=38, 10=68). Quota consumed at initiation, not completion. [Code-verified 2026-07-03: `app/api/paths/initiate/route.ts:109-117`]
- [x] **REQ-subscription-billing**: User subscribes via Stripe with checkout (`POST /api/stripe/create-checkout`), self-serve portal (`POST /api/stripe/create-portal`), and signature-verified webhooks (`POST /api/webhook/stripe`) driving subscription state on the `accounts` table.
- [x] **REQ-team-collaboration**: Team accounts with seat-based pricing, shared/pooled quota, an invite + acceptance flow (`(main)/invite`), and account switching; `account_users` provides the many-to-many user↔account relationship.

### Public Product & Content

- [x] **REQ-public-path-discovery**: Anyone can discover public paths on `/explore` and view public detail at `/paths/[id]`; free-tier paths are always public (cannot be made private).
- [x] **REQ-blog**: TinaCMS-backed blog with a visual editor (`/admin/index.html`) and git-committed MDX in `content/posts/`; listing + `[slug]` post pages with live editing.

## v2 Requirements

Deferred to future release. Not in Milestone 1 roadmap.

- **Candidate — BYOK (bring-your-own-keys) for OpenRouter**: free plans supply their own OpenRouter
  API key and can use any valid model at their own cost. Removes owner-funded inference as the gating
  constraint (and relaxes the xAI/Grok exclusion for user-funded usage). Owner's next planned milestone —
  formalize via `/gsd-new-milestone` when it becomes active scope.
- Candidate as-built surface not formalized as v1 REQs — progress/competency tracking, lead capture,
  error reporting, in-app search — capture here or promote to active scope via `/gsd-new-milestone` if pursued.

## Out of Scope

| Feature | Reason |
|---------|--------|
| xAI / Grok models in the owner-funded catalog | Owner won't fund xAI/Grok inference. Excluded while ViaProto pays; the planned BYOK milestone (user-supplied OpenRouter keys) will let users choose any model, including xAI/Grok, at their own cost. |
| Team-exclusive AI models | `team` tier exists in `SubscriptionTier` enum but no models gate to it; gating is `free`/`pro` only. |
| Payload CMS for the blog | Superseded — blog is TinaCMS only (stale Payload deployment doc excluded during ingest). |
| Open-source licensing | Product is proprietary, all rights reserved. |

## Traceability

Which phases cover which requirements. Every v1 requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-topic-search | Phase 1 | Complete |
| REQ-path-generation | Phase 2 | Complete |
| REQ-generation-status-tracking | Phase 2 | Complete |
| REQ-model-selection | Phase 2 | Complete |
| REQ-rate-limiting | Phase 3 | Complete |
| REQ-subscription-billing | Phase 3 | Complete |
| REQ-team-collaboration | Phase 4 | Complete |
| REQ-public-path-discovery | Phase 5 | Complete |
| REQ-blog | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 after retrospective bootstrap (Milestone 1 — v1 shipped baseline).*
