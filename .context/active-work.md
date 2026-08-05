---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5, relay chain 3 leg 2, owner away_
_At commit: `a359f9f` on `main`_

## Current focus

**Spec #120's batch is draining. #121 and #122 have landed; five unblocked
slices remain.** Nothing is in flight — the leg that delivered #122 closed it
and handed off.

## State

- **In flight:** nothing. No ticket branch exists;
  `ticket/122-code-block-copy-button` was squash-merged and deleted.
- **Closed 2026-08-05:** **#121** — markdown tables render (`ef6ef22`) ·
  **#122** — code blocks carry a copy button (`a359f9f`).
- **Queue:** **#123–#127 unblocked and independent**, takeable in any order.
  **#128 (the 1.0.0 bump) is last by the owner's own instruction** and waits on
  the other five. It still wears `ready-for-agent`, so the frontier query
  returns it — the ordering constraint lives in the ticket body and in
  `.claude/relay-leg.md`, not in a label.
- **Gate on `main`:** typecheck clean, build clean, **1145 tests / 76 files**.
  This replaces the `1130 / 75` line. Every remaining slice adds tests —
  **read the number off `main`, never off this file.**

## The slices

| # | Slice | Shape | State |
|---|---|---|---|
| #121 | Markdown tables render | CSS only — GFM already emits `<table>` | **closed `ef6ef22`** |
| #122 | Code blocks carry a copy button | `components` override + a **measured** clipboard route | **closed `a359f9f`** |
| #123 | Reuse a past user message in the composer | Refill, never mutate | open |
| #124 | A five-position effort control | CLI-sourced levels, engine rebuild | open |
| #125 | The subagent viewer takes the window material | CSS + pin + DESIGN.md + ADR | open |
| #126 | The subagent map earns its place | Visual pass inside the pinned encoding | open |
| #127 | spike — three routes nobody has called | Probe by calling, build nothing | open |
| #128 | Version 1.0.0 | Blocked by #121–#127 | open, blocked |

## Pick up here

Take any of #123–#127. `/preset ticket-loop` picks the lowest unblocked id, so
**#123** by default.

## Skills for next session

- `run-desktop` — **#125 needs it**, and it must keep `gui-98` passing with
  criterion 5 replaced rather than deleted. #122 has now left three drivers'
  worth of hard-won mechanics behind in `gui-122.mjs`; read it before writing
  a new one, particularly the screenshot and clipboard notes.

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
- **The copy button did NOT ship dead, and the measurement is the finding.**
  `file://` reports `isSecureContext: true`, so `navigator.clipboard.writeText`
  is present and — measured against the built app, read back through main's own
  `clipboard` module — effective. No IPC bridge, no `execCommand` fallback, no
  ADR. `execCommand` is also effective and stays the fallback.
- **The spike's FIRST run scored that route dead, and it was the instrument.**
  Both probe buttons were injected at the same fixed position, so the second
  covered the first, the hit-test refused the click, and the handler never ran —
  with the error swallowed by a bare `.catch(() => {})`. Believing it would have
  built an IPC bridge the app does not need. **Unscored is not refuted**, and a
  probe that swallows its own gesture errors cannot tell the two apart.
- **Blink rewrites LF to CRLF inside `navigator.clipboard.writeText` on Windows.**
  The tempting reading is that the button mangles the payload; a control refuted
  it — the same LF string written from **main** reads back unchanged, so the OS
  clipboard is innocent and the rewrite sits below this repo's code and above the
  OS. Nothing was done about it: on a Windows paste target it is what you want.
- **`capturePage`'s rect is window DIP; `getBoundingClientRect()` is the ZOOMED
  page's CSS pixels.** This app carries its own zoom, so the two differ by
  `getZoomFactor()` and an unscaled rect captures up and to the left of the
  target. Three runs of #122's driver photographed the space above the very
  control they existed to show. Any future driver shooting a specific element
  needs the scaling.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[happy-path]]
