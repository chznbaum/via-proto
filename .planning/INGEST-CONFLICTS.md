## Conflict Detection Report

Mode: new. Sources: 2 DOC-level (CLAUDE.md, README.md). Precedence: ADR > SPEC > PRD > DOC.
Both sources are DOC-level and corroborating; overlaps resolved by corroboration/recency.
No ADRs, SPECs, or PRDs present → no locked decisions, no competing acceptance variants.
Cross-ref graph empty → no cycles.

### BLOCKERS (0)

(none)

### WARNINGS (0)

(none)

### INFO (3)

[INFO] Route-group structure described differently across the two docs
  Found: CLAUDE.md documents a nested layout — app/(main)/(dashboard)/ with auth under
    app/(main)/auth/ — i.e. (main) is the outer group.
  Found: README.md documents three top-level route groups — (auth), (dashboard), (main) —
    and additionally lists contexts/ and hooks/ directories.
  Note: Both DOC-level, so no precedence winner. README appears more recent (references
    invite/, progress/, contexts/, hooks/ not present in CLAUDE.md). Recorded in
    intel/context.md as a discrepancy for roadmapper to verify against the actual app/ tree.
    No synthesis value was silently dropped.

[INFO] minimumTier enum differs between docs
  Found: CLAUDE.md (Model System) documents tier access as {free, pro, team}.
  Found: README.md "Add a New AI Model" example types minimumTier as "free" | "pro".
  Note: Resolved by corroboration/recency toward the fuller CLAUDE.md value ({free, pro, team})
    pending a code check of libs/models/model-config.ts. Captured in
    intel/constraints.md (CON-model-catalog-shape). Both DOC-level; no data lost.

[INFO] README adds pricing/infra detail absent from CLAUDE.md (additive, not conflicting)
  Found: README specifies Pro $12/mo or $100/yr and Team $10/seat/mo, and deployment target
    Coolify → Hetzner VPS with BunnyCDN; CLAUDE.md omits these figures.
  Note: Purely additive corroboration — no contradiction. Merged into intel/requirements.md
    (REQ-subscription-billing) and intel/decisions.md (DEC-deployment-coolify).
