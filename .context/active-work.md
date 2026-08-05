---
type: active-work
project: claude-wrapper
updated: 2026-08-05
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-05 by Opus 5, relay chain 3 leg 3, owner away_
_At commit: `f649f1d` on `main`_

## Current focus

**Spec #120's batch is draining. #121, #122 and #123 have landed; four unblocked
slices remain.** Nothing is in flight — the leg that delivered #123 closed it and
handed off.

## State

- **In flight:** nothing. No ticket branch exists;
  `ticket/123-reuse-past-message` was squash-merged and deleted.
- **Closed 2026-08-05:** **#121** — markdown tables render (`ef6ef22`) ·
  **#122** — code blocks carry a copy button (`a359f9f`) · **#123** — reuse a
  past user message (`f649f1d`).
- **Queue:** **#124–#127 unblocked and independent**, takeable in any order.
  **#128 (the 1.0.0 bump) is last by the owner's own instruction** and waits on
  the other four. It still wears `ready-for-agent`, so the frontier query
  returns it — the ordering constraint lives in the ticket body and in
  `.claude/relay-leg.md`, not in a label.
- **Gate on `main`:** typecheck clean, build clean, **1164 tests / 77 files**.
  This replaces the `1145 / 76` line. Every remaining slice adds tests —
  **read the number off `main`, never off this file.**

## The slices

| # | Slice | Shape | State |
|---|---|---|---|
| #121 | Markdown tables render | CSS only — GFM already emits `<table>` | **closed `ef6ef22`** |
| #122 | Code blocks carry a copy button | `components` override + a **measured** clipboard route | **closed `a359f9f`** |
| #123 | Reuse a past user message in the composer | Refill through the existing `pendingInsert` channel | **closed `f649f1d`** |
| #124 | A five-position effort control | CLI-sourced levels, engine rebuild | open |
| #125 | The subagent viewer takes the window material | CSS + pin + DESIGN.md + ADR | open |
| #126 | The subagent map earns its place | Visual pass inside the pinned encoding | open |
| #127 | spike — three routes nobody has called | Probe by calling, build nothing | open |
| #128 | Version 1.0.0 | Blocked by #121–#127 | open, blocked |

## Pick up here

Take any of #124–#127. `/preset ticket-loop` picks the lowest unblocked id, so
**#124** by default.

## Skills for next session

- `run-desktop` — **#125 needs it**, and it must keep `gui-98` passing with
  criterion 5 replaced rather than deleted. There are now **35 `gui-*.mjs`
  drivers**. Read `gui-122.mjs` for the screenshot/clipboard mechanics and
  `gui-123.mjs` for two newer ones: **removing a main-side IPC listener so a
  driver spends zero CLI turns** (with the removal read back), and **reading a
  computed value both on landing and after it settles** when a transition is in
  the way.

## Open questions

Four, all recorded in `.claude/vibe.md` under `## Needs you`, all reversible,
none blocking. **#123 resolved one of them by shipping it** and added none:

1. Whether the acrylic exception reaches any pane beyond the subagent viewer.
2. Whether `ultracode` / `auto` should be reachable at all.
3. What "background a session" should mean in this app.
4. ~~That #123 ships as **refill rather than a true edit**~~ — **taken, shipped
   and warranted.** The default was the reversible one and the record now
   carries why a true edit is impossible rather than merely unchosen. Left in
   the list as answered rather than deleted, since the owner asked for the edit
   by name and may want to revisit what the app should do instead.

## Recent context

- **#123's shape was forced by one line, not chosen.**
  `setMessages(transcript.map(toChatMessage))` runs on adopt AND on every
  live-tail reload, so the pane is a projection of the disk transcript the CLI
  owns. Full reasoning in
  [[2026-08-05-the-pane-is-a-projection-so-the-edit-is-a-refill]].
- **The refill routes through `pendingInsert`, the commands dock's channel.**
  That is what makes the queued-send constraint hold with no new logic — #80's
  commitment is a flag on the draft, not a copy of it. Anything that lifts
  composer state or snapshots text at click time breaks it silently.
- **A value read behind a transition is not a settled one.** `gui-123`'s first
  run reported an invisible control off `opacity: 0.585`, which was the 150ms
  reveal mid-flight. Both readings are now taken. The hover phase had a settle
  wait and passed while the keyboard phase did not — two phases of one driver
  disagreeing for no product reason.
- **A driver can cost zero CLI turns.** `gui-123` removes main's `chat:send`
  listener before typing, so the renderer still appends the user bubble and no
  engine turn runs — and it **reads the listener count back**, because a send
  that quietly still fired would have emptied the composer under the assertion
  and reported a product failure.
- **`chat.css` now has a raw-text reader.** Six test files read a stylesheet as
  text. The new suite also pins that `.bubble {` is still the **first** literal
  match in that file, because `multiline-composer` slices from exactly that
  string.
- **#121's rules were measured, not chosen.** The parser writes column alignment
  as an **inline style** on every cell and emits **no wrapper** around the
  table, so no rule may mark `text-align` important and the table scrolls via
  `display: block` on itself. #122's `components` override wraps `<pre>` only —
  it was **not** extended to `<table>` and should not be.
- **The copy button did NOT ship dead.** `file://` reports
  `isSecureContext: true`, so `navigator.clipboard.writeText` is present and
  measured effective in the built app. Blink rewrites LF → CRLF inside
  `writeText` on Windows; a main-side control proved the OS clipboard innocent.
- **`capturePage`'s rect is window DIP; `getBoundingClientRect()` is the ZOOMED
  page's CSS pixels.** Scale by `getZoomFactor()` or the shot lands up and left.
  Binds #125 and #126.
- **The effort slider's five positions are the SDK's own type**, not a taste
  call — `EffortLevel = 'low'|'medium'|'high'|'xhigh'|'max'`, and `effort` rides
  `Options`, so it binds at query CONSTRUCTION and changing it must rebuild the
  engine exactly as `model:set` does.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[happy-path]]
