# Synthesis Summary

Single entry point for downstream consumers (gsd-roadmapper). Mode: new (net-new bootstrap,
no existing .planning/ context). Precedence: ADR > SPEC > PRD > DOC.

## Doc Counts by Type
- ADR: 0
- SPEC: 0
- PRD: 0
- DOC: 2 (CLAUDE.md, README.md) — both high-confidence, corroborating
- UNKNOWN/low-confidence: 0

Cross-ref graph: empty (no cross_refs) → cycle detection ran, no cycles.

## Decisions
- Locked: 0
- Observed (DOC-level, non-locked): 12 — framework (Next.js 15), database/auth (Supabase),
  AI (OpenRouter), payments (Stripe), background jobs (Graphile Worker), styling (Tailwind 4 +
  DaisyUI), blog CMS (TinaCMS), email (Resend), images (Unsplash), deployment (Coolify/Hetzner),
  account/billing model, licensing (proprietary).
- File: .planning/intel/decisions.md

## Requirements
- Extracted: 9 (from DOC-level sources; no formal PRDs, acceptance criteria inferred)
- IDs: REQ-path-generation, REQ-generation-status-tracking, REQ-model-selection,
  REQ-rate-limiting, REQ-subscription-billing, REQ-team-collaboration,
  REQ-public-path-discovery, REQ-blog, REQ-topic-search
- File: .planning/intel/requirements.md

## Constraints
- Extracted: 13
  - nfr: 8 (worker-required, nextjs15-async, rls, input-validation, rate-limit-before-create,
    free-tier-public, model-catalog partial, node-version)
  - protocol: 2 (webhook-signature, job-retry-policy)
  - api-contract: 1 (paths + stripe + models + topics endpoints)
  - schema: 2 (db-schema, model-catalog-shape)
- File: .planning/intel/constraints.md

## Context Topics
- 8 topics: product overview, path generation flow, dev workflow, naming/conventions,
  route-group architecture (flagged discrepancy), deployment/infra, support/licensing,
  standing policy (no xAI/Grok).
- File: .planning/intel/context.md

## Conflicts
- Blockers: 0
- Competing variants: 0
- Auto-resolved / INFO: 3 (route-group structure discrepancy; minimumTier enum;
  additive pricing/infra detail)
- Detail: .planning/INGEST-CONFLICTS.md

## Status
READY — no blockers, no competing variants. Safe to route to gsd-roadmapper.

## Notes for Roadmapper
- The stale Payload-CMS deployment doc was excluded upstream; TinaCMS is the sole blog-CMS decision.
- Verify route-group layout against the actual app/ tree (docs disagree; README likely newer).
- Verify minimumTier enum against libs/models/model-config.ts.
- Standing exclusion (from user memory): xAI/Grok excluded from the owner-funded catalog only (owner won't fund that inference); the planned BYOK milestone relaxes this for user-supplied OpenRouter keys.
