---
type: decision
project: claude-wrapper
updated: 2026-08-05
tags: [context, decision]
---

# The pane is a projection, so the edit is a refill

**Decision:** #123 (`f649f1d`) ships "redit message, resend" as a **refill of the
composer** and nothing else. A user message carries a control that puts its exact
text back in the box, where it can be edited and sent as a **new** turn. The
original is untouched in the pane and untouched on disk.

That is **forced, not chosen**, and the warrant is one line of `useChat.ts`:

```ts
setMessages(transcript.map(toChatMessage))
```

Both `adoptSession` and the live-tail reload loop replace the **entire** array
from `loadTranscript(id)`. The renderer's list is a **projection of the disk
transcript, which the CLI owns** — so a renderer-side edit to an already-sent
message survives exactly until the next adopt or tail signal, and the superseded
turn stays in the conversation either way. `/rewind` is not among the CLI's 121
advertised commands, so there is no history-rewriting route to lean on. #127
measures whether any route exists at all.

## It routes through the channel that already existed

The refill uses **`pendingInsert`**, the same `{ text, nonce }` prop the commands
dock inserts through — deliberately not a second channel. That is what makes the
ticket's hardest constraint hold **without new logic**: #80's queued-send
commitment is a **boolean flag on the draft**, not a copy of it, so an insert can
only ever replace what is in the box. No second draft is possible, no
double-commit is possible, and what fires at `turn-end` is whatever is visible.
The nonce is what lets one message be reused twice.

A refill implemented as its own lifted state, or one that snapshotted the text at
click time, would break that silently — hence the pins, one of which reds under a
constant-nonce mutation.

## Text only, and the reason generalises

Refill carries **words alone**. `toChatMessage` drops attachment payloads on
reopen and keeps only markers, so the messages most worth resending are exactly
the ones whose attachments **cannot** be rebuilt. Restoring them for a live
message only would make the control's behaviour depend on state the user cannot
see; carrying a marker into the tray would show a chip with no bytes behind it
and send a prompt that silently lost its images.

## The instrument lesson — a value read behind a transition is not a settled one

`gui-123.mjs`'s first run reported **"tabbing lands on an invisible control"** off
a computed `opacity: 0.585`. The control was fine: the reveal is a 150ms
transition and the read happened on the same tick as the Tab press. The hover
phase had a settle wait and passed; the keyboard phase did not, and the two
disagreed for no product reason at all.

The driver now records the value **on landing** beside the settled one, so an
animating rule (`onLand: 0.17` → `1`) is distinguishable from one that never
applies (`onLand: 0` → `0`). **Any driver reading a computed value behind a
transition needs both readings**, or its red cannot be told apart from an
instrument artefact — the same family as
[[2026-08-05-file-is-a-secure-context-and-unscored-is-not-refuted]], where a
probe's own defect nearly bought an IPC bridge the app does not need.

The driver also **costs zero CLI turns**: main's `chat:send` listener is removed
before anything is typed, so the renderer still appends the user bubble and no
engine turn runs. The listener count is **read back** rather than trusted, because
a send that quietly still fired would have emptied the composer underneath the
refill assertion and reported a product failure.

## What this binds

- **The control sits beside `.bubble`, never inside it.**
  `tests/multiline-composer.test.tsx` reads that element's `textContent`
  verbatim.
- **It renders only when a handler is passed.** `SubagentDrawer` renders the same
  `Chat` against an agent's transcript; a control there would refill the
  conversation's composer from another agent's history.
- **`chat.css` is now read as raw TEXT too** — six files do this. Comments are
  stripped first, and the new suite additionally pins that `.bubble {` is still
  the **first** literal match in the file, because `multiline-composer` slices
  from exactly that string.
- **Hidden must not mean gone.** The control is `opacity: 0` at rest, never
  `display: none` or `visibility: hidden`, or it leaves the tab order and the
  keyboard path disappears with it. The driver asserts the computed `display`
  for that reason.

## Related

- [[2026-08-05-file-is-a-secure-context-and-unscored-is-not-refuted]]
- [[2026-08-05-the-clis-command-surface-is-enumerable-and-two-asks-died-on-it]]
- [[decisions]] · [[active-work]] · [[pick-up]]
