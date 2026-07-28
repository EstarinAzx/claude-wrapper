---
type: decision
project: claude-wrapper
date: 2026-07-29
tickets: [55, 56, 57]
tags: [context, decision, sessions, replay]
---

# Live-tail is a signal, not a stream

## Context

Owner report: a session being driven in a terminal, viewed simultaneously in
the wrapper, does not progress — the pane is a snapshot from open time, and
seeing new turns means re-opening the session. The VS Code extension follows
the same session live.

The transcript is read exactly once per open (`session:transcript` →
`readTranscript` → `parseTranscript` → `setMessages`); nothing in the repo
watched a file. Spec #55, tickets #56 (gui-55 driver) and #57 (core).

## Decision

**Watch the file, signal the renderer, re-run the existing load path**
(approach A of three).

- Main owns **one** watcher, at most one watched session: directory-level
  `fs.watch` filtered to the session's filename (file-level watch is unreliable
  on Windows), trailing debounce ~200ms.
- Only a **signal** crosses IPC — "watch this id (or null)" in, "this id
  changed" out. The transcript keeps travelling over the existing load channel;
  its read/parse/sanitize pipeline is reused untouched. No new parsing surface.
- Reload is a wholesale replace through the existing transcript→chat mapping.

## The eligibility gate

Live-tail is for a session you are **watching**, never one you are **driving**.
Adopting a session makes it tail-eligible; sending a message or starting a new
chat clears it; busy blocks any reload. Two reasons, both structural:

- A reload during your own turn clobbers the live engine stream.
- A reload after your own send swaps live attachment thumbnails for replay
  chips — the bytes deliberately never cross IPC on reopen.

Once you send, your own stream keeps you current, so nothing is lost.

## Paths closed

- **Incremental byte tailing** (offsets, partial-line buffers, truncation
  detection): rejected for v1 — the largest new-bug surface for a latency win
  nobody measured. It is the documented upgrade path if wholesale reload
  visibly flickers or lags. Do not start there.
- **Polling**: rejected — background wake on idle sessions forever, latency
  equal to the interval, and no less rendering care than the watch.
- **Empty reload result with a non-empty pane is skipped**: the lenient read
  path answers `[]` for transient failure too, and a tailed transcript never
  legitimately shrinks to nothing. Do not "fix" this into a blank pane.
- **Installing the watch BEFORE the adoption read** (closed while landing #57):
  it would shrink the window in which a write is missed, but it opens a worse
  race — a signal arriving during adoption starts a reload that can resolve
  *before* the adoption's own, older read, which then overwrites it and walks
  the pane backwards. The gap stays, marked `ponytail:` at the call site. The
  real fix, if a missed write is ever observed, is to route the adoption read
  through `reload` itself with an authoritative first pass — not to reorder
  two independent reads.

## Sequencing

#56 (the gui-55 driver) lands **before** #57 and must be seen red against the
featureless build — the gui-54 lesson made an ordering: the proof exists and
has failed before the fix exists, so its green means something.

## Reversibility

Moderate. The signal-only IPC contract and the eligibility gate are load-
bearing; the wholesale-reload body behind them can be swapped for incremental
tailing without touching either.

## Related

- [[active-work]] · [[pick-up]] · [[overview]]
- [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] — same philosophy:
  the transcript file is the CLI's fact; re-read it, never mirror it.
- [[2026-07-25-replay-shows-markers-not-bytes]] — why a post-send reload would
  degrade attachments, which is half the eligibility gate.
