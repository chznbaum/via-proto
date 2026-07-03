# ViaProto — Agent Guide

This project uses **GSD** for planning. The source of truth for scope, decisions, and how the
code is organized lives in `.planning/` — not in this file. (This applies to any agent: Codex,
Claude Code, Cursor, etc. — `AGENTS.md`, `CLAUDE.md`, and `.cursorrules` are thin pointers to
the same `.planning/` content.)

**Read before working:**

- **Planning** — `.planning/PROJECT.md` (what this is, business context, key decisions,
  constraints), `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`
  (current milestone/phase status)
- **Codebase map** — `.planning/codebase/`: `STACK.md` (stack, dev commands),
  `ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md`, `TESTING.md`, `INTEGRATIONS.md`,
  `CONCERNS.md`

Plan and execute work through GSD (`/gsd-*`) so `.planning/` stays the system of record.
