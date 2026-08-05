---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5, autonomous `/preset vibe init` run, owner away_
_At commit: `e0b8855` + this session's planning commit_

## Current focus

**Spec #120 is filed and sliced. Seven unblocked `ready-for-agent` tickets are
queued; nothing is in flight.** No code was written this session — vibe plans,
the relay builds.

## State

- **In flight:** nothing.
- **Filed 2026-08-05:** spec **#120** (`needs-triage`) and slices **#121–#128**
  (all `ready-for-agent`).
- **Queue:** #121–#127 unblocked and independent, takeable in any order. **#128
  (the 1.0.0 bump) is last by the owner's own instruction** and waits on the
  other seven.
- **Gate:** untouched this session — `main` is still `e0b8855`, typecheck clean,
  **1122 tests / 74 files**, build clean. Every slice adds tests, so #128 must
  read the new baseline off `main` rather than trusting that number.

## The slices

| # | Slice | Shape |
|---|---|---|
| #121 | Markdown tables render | CSS only — GFM already emits `<table>` |
| #122 | Code blocks carry a copy button | `components` override + a **measured** clipboard route |
| #123 | Reuse a past user message in the composer | Refill, never mutate |
| #124 | A five-position effort control | CLI-sourced levels, engine rebuild |
| #125 | The subagent viewer takes the window material | CSS + pin + DESIGN.md + ADR |
| #126 | The subagent map earns its place | Visual pass inside the pinned encoding |
| #127 | spike — three routes nobody has called | Probe by calling, build nothing |
| #128 | Version 1.0.0 | Blocked by #121–#127 |

## Pick up here

Take any of #121–#127. `/preset ticket-loop` picks the lowest unblocked id.

## Skills for next session

- `run-desktop` — **#122 and #125 both need it.** #122's clipboard route cannot
  be settled in jsdom or in dev; #125 must keep `gui-98` passing with its
  criterion 5 replaced rather than deleted.

## Open questions

Four, all recorded in `.claude/vibe.md` under `## Needs you`, all reversible,
none blocking:

1. Whether the acrylic exception reaches any pane beyond the subagent viewer.
2. Whether `ultracode` / `auto` should be reachable at all.
3. What "background a session" should mean in this app.
4. That #123 ships as **refill rather than a true edit** — the superseded turn
   stays in the conversation, because the disk transcript is the source of truth.

## Recent context

- **A zero-turn probe reshaped the batch.** `supportedCommands()` on a warm
  handle: 121 commands. `/effort` advertised, `/rewind` and `/bg` **absent**.
  That killed two asks as command-wrappers and authorised the third with its
  exact domain. It is why this batch ships six build slices where #115 shipped
  none.
- **The effort slider's five positions are the SDK's own type**, not a taste
  call — `EffortLevel = 'low'|'medium'|'high'|'xhigh'|'max'`, and `effort` rides
  `Options`, so it binds at query CONSTRUCTION and changing it must rebuild the
  engine exactly as `model:set` does.
- **The glass ban's parked question is answered for one pane only.** #98 split
  the owner's instruction into what was stated and what was not; material sat in
  the second bucket *only because the owner had not named it*. The owner has now
  named it.
- **A copy button can ship dead.** Production loads `file://`, dev loads
  http://localhost, and no permission handler is registered — so
  `navigator.clipboard` may pass jsdom, pass dev, and be inert in the built app.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[happy-path]]
