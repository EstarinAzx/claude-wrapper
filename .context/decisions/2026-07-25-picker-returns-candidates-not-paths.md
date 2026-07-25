---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# The picker channel returns Candidates, and main is where the bytes are read

**Decision:** #34's `attachments:pick` resolves `Candidate[]` — the policy
module's own `{ name, mediaType, data?, path? }` — not the bare `string[]` of
absolute paths the ticket's prose asked for. The main process derives the name
and the media type, and reads the base64 bytes itself, gated by a `stat`.

**1. Bare paths cannot satisfy the ticket.** "A chosen image embeds as an image
block, subject to the same caps as a pasted one" and "the channel returns the
selected absolute paths" are in tension: `judgeAttachment` embeds only when a
candidate carries `data`, so a path-only image would fall straight through to
the by-path branch and never embed. Something has to read the file. Reading it
in main is one channel; reading it in the renderer would be a second channel
(`readFile`) widening the trust boundary for no gain, or a `file:` URL fetch
that the CSP would have to be opened up for.

**2. `Candidate` was already the right type — no new one was invented.** It is
exactly what the picker produces and exactly what `admitAttachments` consumes,
so the channel's return value drops into the same fold a paste uses. The
composer therefore has ONE attachment route: same embed-vs-path judgement, same
count budget, no per-source branch. This is what makes "the cap applies across
sources" true by construction rather than by a second counter.

**3. The read is stat-gated, and skipping the read is the same verdict as
failing it.** Bytes are read only for the four allowlisted image types and only
when `stat` says the file is within `MAX_IMAGE_BYTES` — a 500 MB file is never
loaded to be rejected. An oversized image, an unreadable one, and a non-image
all arrive with `path` and no `data`, which the policy module already routes by
path. So the size cap needed no new rejection branch: the fall-through the #32
note documented does the whole job.

**4. No new CSP grant was needed — the prediction in
[[2026-07-25-attachment-policy-and-the-csp-that-blocked-it]] was wrong on this
point.** That note warned that "a `file:` thumbnail for #34's picker needs its
own grant". Because main hands back base64, a picked image renders from the
same `data:` URL a paste does, under the existing `img-src 'self' data:`.
Verified live: a picked PNG decoded to 1593×1140 in the built app. The warning
still stands for any FUTURE source that is a real URL.

**Why:** The alternative — paths out, renderer reads — spends a second IPC
channel and a CSP widening to move a file read from the process that already
has unrestricted disk access into the one that deliberately does not.

**Reversibility:** Cheap. The channel is one handler and one preload line, and
`Candidate` is a superset of a path — a future consumer wanting only paths can
read `.path` and ignore the rest.

## Follow-on notes for #35

- Replay has to survive both attachment kinds, and the picker makes mixing
  routine: `tests/engine.test.ts > a mixed message keeps images as blocks and
  paths in the one text block` pins the send side of that.
- The main-process handler has **no unit test** — this repo has no Electron test
  harness. It was verified by driving the built app with `dialog.showOpenDialog`
  stubbed in main, which exercises the real handler. Reuse that pattern rather
  than adding a harness.
- A cancel must return BEFORE the fold, not fold an empty batch: folding
  `[]` keeps the chips but silently wipes an existing rejection message. The
  test holds a rejection as well as a chip for exactly this reason —
  mutation-verified, and the weaker chip-only version passed the mutation.

## Related

- [[decisions]]
- [[2026-07-25-attachment-policy-and-the-csp-that-blocked-it]] — predicted "#34
  needs no policy change" (right) and a `file:` CSP grant (wrong)
- [[2026-07-25-attachments-embed-images-paths-for-files]] — spec #26's framing
- [[active-work]] · [[pick-up]]
