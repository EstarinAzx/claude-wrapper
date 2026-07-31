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

## Amended 2026-07-31 by #73 — premise CONFIRMED, reversibility clause SPENT, nothing reversed

This ADR rejected a **silent** restart. #73 built the **user-initiated** one, so
that reasoning is untouched — and the Reversibility line above ("capture
`session_id` and rebuild with `resume` … the terminal flag is one variable") is
now cashed in rather than theoretical.

**The blocking measurement, because nothing had ever measured it.** The app only
ever resumed sessions that ended *normally*; whether a session survives an
*abnormal* death was assumed, and the whole ticket rested on it. Probed against
the real SDK and the host CLI: a turn ran and planted a fact, the CLI process
tree was killed with `taskkill /F` — so the consuming stream **threw**
(`Claude Code process exited with code 1`), the engine's own terminal path — and
a fresh query with `resume: <that id>` was then accepted, **reported the same
session id back**, and returned the planted fact. Resume after an abnormal death
works, so the honest-restart degradation the ticket pre-authorised was not
needed. `gui-73` now re-proves this end to end on every run, which is why the
standalone probe was not kept.

**What the ADR did not say, and what actually cost the conversation.** The
sentence "Recovery is explicit: picking a folder builds a fresh engine" was
endorsing a path that passed `resumeId: null` — so the endorsed recovery
produced the exact outcome this ADR rejected auto-restart *for*. The flag was
never the problem; the argument was.

**Measured while building it, and worth carrying:** a stream dying **between**
turns emits nothing at all. The engine only emits into an active turn
(`if (turnResolve)`), so the pane stays silent and the user learns nothing until
a prompt is spent on a dead engine. That is why the terminal signal is out of
band rather than an `EngineEvent` — see
[[2026-07-31-a-terminal-death-is-a-signal-not-an-event]].

## Related

- [[decisions]] — index
- [[2026-07-23-engine-per-turn-resume]]
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73's way out, and why the distinction is not an event
