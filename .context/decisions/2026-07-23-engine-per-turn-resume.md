---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decisions, engine]
---

# Engine MVP = per-turn query() + resume, not streaming input

**Decision:** `src/main/engine.ts` runs one SDK `query()` per turn, carrying conversation context via captured `session_id` + `resume`. Rejected for now: one long-lived streaming-input query.
**Why:** Per-turn is materially simpler (no async-generator input plumbing, no process lifetime management) and fully covers #4 (text only). But the SDK gates `interrupt()` and `canUseTool` behind streaming-input mode — so the Stop button (#7) and permission round-trip (#6) REQUIRE the upgrade. The swap is contained inside `createEngine`; the `Engine` interface and everything downstream (IPC, renderer, tests) stay put. Marked `ponytail:` at the definition.
**Reversibility:** easy — planned, not just possible

## Related

- [[decisions]] — index
- [[2026-07-22-agent-sdk-engine]]
