---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# Replay shows markers, and the pure-text arrays stay dropped

**Decision:** #35 widened `parseTranscript` to emit an `AttachmentMarker`
(`kind`, optional `mediaType`, optional `name`) per non-text block of a user
message, and the renderer shows them as chips. Three sub-decisions came with
it, each measured against **546 real transcript files** rather than assumed.

**1. The payload is not forwarded — and the number is bigger than the spec's.**
Spec #26 justified this with one 263 KB screenshot. Measured on this repo's own
session `49c1495a`: **six attachment messages holding 2.17 MB of base64**. The
built app replays that session with a **114 KB** DOM and a base64 scan of the
whole document finds nothing. Live messages show real thumbnails from data the
renderer already holds; replayed ones show chips. Lazy full-image fetch is still
open and needs no change to this contract.

**2. Array-of-only-text user messages keep parsing to nothing.** This looks like
the same data-loss bug and is not. There are **1375** of them, and they are CLI
noise: skill injections (`Base directory for this skill: …`),
`[Request interrupted by user]`. They were dropped before and are dropped now —
the parser emits a user message from array content **only when at least one
marker exists**. This is the "text-only parses exactly as before" acceptance
criterion, and it is the path someone will re-propose after reading the parser
and seeing text being collected. It is pinned by test and mutation-verified:
emitting them reds `array of only text blocks still parses to nothing`.

**3. `tool_result` short-circuits the whole branch.** Measured: `tool_result`
appears in **17295** user content arrays and **never once** co-occurs with a
text or image block. So "has any tool_result → fold into tools, emit no user
message" is safe, and the marker path never has to reason about tool results.
Shapes in full: `["tool_result"]` 17295, `["text"]` 1375, `["image","text"]`
139, `["document"]` 14.

**Two renderer fields, not one.** `ChatMessage` user carries both
`attachments?: Attachment[]` (live bytes → thumbnails) and
`attachmentMarkers?: AttachmentMarker[]` (replay → chips). Merging them into one
union-typed field would push a narrowing branch into every consumer to express
a distinction that is really "which side of IPC produced this". Both stay
absent-not-empty.

**Why:** The parser is the only place that sees the persisted blocks, so it is
the only place that can choose what crosses. Choosing per-block there means the
renderer never holds bytes it cannot use, and an unrecognised future block kind
is recorded rather than silently dropped.

**Reversibility:** Easy to widen, hard to narrow. Adding `data` to the marker
later is one field; the six tests that pin its absence would have to be
deliberately rewritten, which is the point.

## Facts worth not re-deriving

- **No non-text block in the wild carries a filename** — 0 of 185 image and
  document blocks. `name` is defensive; today every real chip labels itself with
  its media type.
- **Both block orders occur**: `image` then `text`, and `text` then `image`. The
  parser is order-independent by construction (text joined, markers in order).
- **A `document` block arrives alone**, with no text block at all (14 of them) —
  so an attachment-only message must emit with `text: ''` rather than be skipped
  for having no words.
- **The composer chip could not be reused as-is.** It is 38px tall because it
  wraps a 28px thumbnail and a remove button; a replay chip has neither, so
  `.bubble-chips .attachment-chip` scopes `min-height: 0; padding: 3px 10px` and
  the inherited 12px radius becomes a pill at the resulting 26px.
- **#35 needed no new `window.api` channel and no CSP grant** — a chip is text,
  not an image source. The four-mock-sites landmine never fired.

## Related

- [[decisions]]
- [[2026-07-25-attachments-embed-images-paths-for-files]] — spec #26's framing;
  this note supersedes its 263 KB figure with a measured 2.17 MB
- [[2026-07-25-picker-returns-candidates-not-paths]] — #34, whose follow-on
  notes set up this ticket
- [[2026-07-23-transcript-parser-pure-renderer-summarises]] — the parser stays
  pure and main-side; this widened it without moving it
- [[active-work]] · [[pick-up]]
