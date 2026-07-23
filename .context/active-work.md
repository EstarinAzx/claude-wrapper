---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by relay `relay-leg` leg 1 (background, unattended)_
_At commit: 67a22c5 on main_

## Current focus

Draining the **spec #9** queue (session history / switching / agents view) via
the `relay-leg` relay chain — one ticket per leg, `max_legs 8`, serial (N=1).
Leg 1 landed **#10**; the chain hands off to leg 2 for **#11**.

## State

- **In flight (background):** relay chain `relay-leg`. Leg 1 done; leg 2 spawns
  for #11. Self-paced, edits the shared checkout ([[2026-07-23-bg-isolation-none]]).
- **Done this leg (#10, `67a22c5`):** engine is session-aware. Captures the SDK
  `session_id` into closure state, surfaced via **`sessionId(): string | null`**
  on the `Engine` interface — an accessor, not a new `EngineEvent`
  ([[2026-07-23-session-id-accessor-not-event]]). `runTurn` gained `resume?: string`
  → SDK query `options.resume`, set only when provided. Streaming / tools /
  permissions / stop / legible-error copy untouched; `EngineEvent` unchanged so
  the renderer never moved. Gate green: typecheck · **81/81** · build.
- **Blocked:** nothing. #11 unblocked + independent; #12 waits on #11;
  #13 waits on #10 (done) + #12; #14 waits on #13.

## Pick up here

See [[pick-up]] — next unblocked `ready-for-agent` is **#11** (list sessions in a
left sidebar). If the relay chain is still live in `claude agents`, leg 2 is
already on it; only pick up by hand if the chain died (crash / `max_legs` /
`stop: true` before the queue emptied).

## Skills for next leg

- **#11 = store-reader + pure `summary()` + sidebar.** New main-process session-
  store module reads `~/.claude/projects/<enc-cwd>/*.jsonl` (enc = every
  non-alphanumeric → `-`, forward only); `summary()` is pure (fixture-testable,
  no fs). Sidebar UI runs **impeccable** vs `docs/design/frost-mono-reference.png`;
  reuse the `tests/session.test.tsx` / `chat-harness.ts` renderer seam and ADD
  aria-labels — never rename the pinned ones.
- **#13 (resume UX)** consumes `sessionId()` + `runTurn(..., resume)`. Ceiling
  noted in [[2026-07-23-session-id-accessor-not-event]]: retargeting resume on a
  live engine means rebuilding the cached query (or `close()` + fresh engine on
  foreground switch), since `ensureQuery` early-returns once built.

## Deferred (own future specs)

Fancy spatial agents-view (session boxes in a canvas), live-tail external
sessions, N-concurrent engines, fork-on-resume, global project switcher.

## Open loose ends

- Local `main` pushed through this leg's wrap-up (relay body pushes each leg).
- **Ecosystem:** the global relay skill was edited during setup (per-leg naming)
  → per CLAUDE.md, sync the ecosystem-kb vault + `/preset health` before any
  template push (not a relay-leg concern; carry for an interactive session).

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[happy-path]]
- [[2026-07-23-session-id-accessor-not-event]] · [[2026-07-23-engine-per-turn-resume]]
- Spec #9 + tickets #11–#14 on the tracker (canonical).
