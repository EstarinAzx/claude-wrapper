---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# The attachment policy module, and the two things no seam test could see

**Decision:** #32 landed the composer half of spec #26 as predicted by
[[2026-07-25-send-payload-encoding-lands-in-the-prefactor]] — no engine work was
needed for the encoding — but the live GUI pass turned up two defects that every
jsdom test passed straight through. Four choices, all load-bearing for #34/#35.

**1. `img-src 'self' data:` is part of the attachment feature, not incidental
config.** The renderer CSP was `default-src 'self'; script-src 'self'; style-src
'self' 'unsafe-inline'` — no `img-src`, so images fell back to `default-src` and
**every `data:` URL was blocked**. The chip thumb and the transcript thumb both
rendered as broken icons while the DOM was perfect: correct `src`, correct
`data:image/png;base64,…`, 451 KB of payload, right element, right class. jsdom
never loads an image, so *no* seam test can catch this class of bug — it is
invisible below the real renderer. The grant is deliberately the narrowest that
works: `img-src`, `data:` only, no `blob:`, no remote scheme.
`tests/attachments-composer.test.tsx` pins the string so a CSP tidy-up cannot
silently un-ship thumbnails. **Any future image source (a `blob:` URL for large
pastes, a `file:` thumbnail for #34's picker) needs its own grant and will fail
exactly this silently.**

**2. An empty text block is not sendable; the block is omitted, not blanked.**
"Sending with attachments and no text is valid" is one of #32's acceptance
criteria, and the #29 encoding would have emitted `{type:'text', text:''}` in
front of the image — which the API rejects. `toUserMessage` now drops the text
block when the prompt is empty, and the path list no longer leads with a blank
line when there is no text. The plain-string pin for text-only sends is
untouched and still holds. Mutation-verified: making the block unconditional
reds `an image with no text sends the image block alone`.

**3. The policy module is per-item judgement plus an explicit fold.**
`src/shared/attachment-policy.ts` exports `judgeAttachment(candidate, count)` →
embed / by-path / reject, and `admitAttachments(count, candidates)` which folds
a batch. The fold lives in the module rather than the composer because the count
cap is a property of the batch, not of an item: **a rejected candidate must not
consume budget**, and that is only testable where the fold is. Mutation-verified
— dropping the increment reds the overflow test. `Candidate` is
`{ name, mediaType, data?, path? }`; empty strings read as absent.

**4. Too big to embed falls through to the path route, rather than rejecting.**
An oversized image *with* a `path` is accepted as `{kind:'path'}` — the agent can
still open it from disk. Only an oversized image with no path is refused. This is
why **#34 needs no policy change**: the picker supplies `Candidate.path` and both
routes already exist.

**Why:** The ticket asked for caps and an allowlist in "one pure module with
direct tests for each outcome", which forces the judge/fold split. The CSP and
empty-block defects are the argument for the GUI pass itself: both were
100%-reproducible product breakage that a 345-test suite reported as green.

**Reversibility:** The policy module is pure and swappable — caps are two
exported constants. The CSP grant is one attribute, but reverting it silently
breaks every thumbnail, which is why it is pinned. The empty-block rule is three
lines in `toUserMessage`.

## For #34 (paperclip) and #35 (replay chips)

- No policy change needed. Supply `Candidate.path` from the picker; oversized
  images and non-embeddable types route by path automatically.
- The tray already handles mixed image/path chips — a chip renders a thumbnail
  only for `kind: 'image'`, and chips are keyed by a composer-local id.
- **#34 still trips the four-mock-sites landmine**: a file picker needs a new
  `window.api` channel, and #32 did not add one (a paste is renderer-local).
- `.bubble-thumb` is a fixed 120px height so image decode causes no layout
  shift; the width settles from the intrinsic aspect.

## Related

- [[decisions]]
- [[2026-07-25-send-payload-encoding-lands-in-the-prefactor]] — predicted the
  composer-only scope this confirms
- [[2026-07-25-attachments-embed-images-paths-for-files]] — spec #26's framing
- [[active-work]] · [[pick-up]]
