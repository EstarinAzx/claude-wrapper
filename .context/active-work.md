---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5, relay chain 3 leg 1, owner away_
_At commit: `ef6ef22` on `main`_

## Current focus

**Spec #120's batch is draining. #121 landed; six unblocked slices remain.**
Nothing is in flight — the leg that delivered #121 closed it and handed off.

## State

- **In flight:** nothing. No ticket branch exists; `ticket/121-markdown-tables`
  was squash-merged and deleted.
- **Closed 2026-08-05:** **#121** — markdown tables render (`ef6ef22`).
- **Queue:** **#122–#127 unblocked and independent**, takeable in any order.
  **#128 (the 1.0.0 bump) is last by the owner's own instruction** and waits on
  the other six.
- **Gate on `main`:** typecheck clean, build clean, **1130 tests / 75 files**.
  This replaces the `1122 / 74` batch baseline. Every remaining slice adds
  tests — **read the number off `main`, never off this file.**

## The slices

| # | Slice | Shape | State |
|---|---|---|---|
| #121 | Markdown tables render | CSS only — GFM already emits `<table>` | **closed `ef6ef22`** |
| #122 | Code blocks carry a copy button | `components` override + a **measured** clipboard route | open |
| #123 | Reuse a past user message in the composer | Refill, never mutate | open |
| #124 | A five-position effort control | CLI-sourced levels, engine rebuild | open |
| #125 | The subagent viewer takes the window material | CSS + pin + DESIGN.md + ADR | open |
| #126 | The subagent map earns its place | Visual pass inside the pinned encoding | open |
| #127 | spike — three routes nobody has called | Probe by calling, build nothing | open |
| #128 | Version 1.0.0 | Blocked by #121–#127 | open, blocked |

## Pick up here

Take any of #122–#127. `/preset ticket-loop` picks the lowest unblocked id, so
**#122** by default.

## Skills for next session

- `run-desktop` — **#122 and #125 both need it.** #122's clipboard route cannot
  be settled in jsdom or in dev; #125 must keep `gui-98` passing with its
  criterion 5 replaced rather than deleted.

## Open questions

Four, all recorded in `.claude/vibe.md` under `## Needs you`, all reversible,
none blocking. Unchanged this leg — #121 touched none of them:

1. Whether the acrylic exception reaches any pane beyond the subagent viewer.
2. Whether `ultracode` / `auto` should be reachable at all.
3. What "background a session" should mean in this app.
4. That #123 ships as **refill rather than a true edit** — the superseded turn
   stays in the conversation, because the disk transcript is the source of truth.

## Recent context

- **#121's rules were measured, not chosen, and one of them binds #122.** The
  parser writes column alignment as an **inline style** on every cell and emits
  **no wrapper element** around the table. So no rule anywhere may mark
  `text-align` important, and the table scrolls via `display: block` on itself.
  **#122 adds a `components` override to wrap `<pre>` — do not extend that to
  `<table>`;** the block route is already measured working. Full reasoning in
  [[2026-08-05-the-parser-writes-the-alignment-and-emits-no-wrapper]].
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
