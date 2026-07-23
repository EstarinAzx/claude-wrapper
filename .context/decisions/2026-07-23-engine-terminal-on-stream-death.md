---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decisions, engine]
---

# Dead streaming query is terminal, not auto-restarted

**Decision:** When the long-lived streaming-input query's output stream ends or throws (`#6` engine), the engine goes terminal: every later `runTurn` fails immediately with the stored error. No automatic re-`query()`.
**Why:** A silent restart would begin a fresh SDK session and drop the whole conversation without `resume` plumbing — worse than a legible error. Reviewer confirmed the restart path started new conversations. Recovery is explicit: picking a folder builds a fresh engine (`makeEngine` closes the old query and cancels pending permissions via the broker).
**Reversibility:** easy — capture `session_id` and rebuild with `resume` inside `ensureQuery` if in-place recovery is ever wanted; the terminal flag is one variable.

## Related

- [[decisions]] — index
- [[2026-07-23-engine-per-turn-resume]]
