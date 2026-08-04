---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# A failure flattened into a value is judged as one

**#106, shipped as `88ddf19`.** A clipboard image whose file has moved, been
deleted or been locked between the copy and the paste fails to read. The
composer flattened that failure into `data: ''` — a value of the *success* type
— and the pure policy downstream, having no vocabulary for a read that failed,
judged it as one. Gate green: typecheck clean, **998 tests across 64 files**
(+3), build clean. `src/renderer/src/components/InputBar.tsx` is the only `src/`
file touched.

## Decision

**The error path belongs to whoever observed the error, not to the pure function
downstream.**

`readAsBase64(file).catch(() => '')` becomes `.catch(() => null)`. The `.then`
splits the batch: readable candidates go through `admitAttachments` as before,
unreadable ones get a `{ name, reason: COULD_NOT_READ }` rejection pushed by the
composer itself, and the two lists are concatenated into the tray.

`src/shared/attachment-policy.ts` is **untouched** — `Candidate` not widened,
`judgeAttachment`'s signature unchanged, the catch-all message unchanged, and
the oversize-image fall-through's branch order not restructured.

An unreadable file never reaches the policy, so it also **spends no slot from
the count budget** — it was refused before it could be judged.

## Why

The sentinel collided with a legitimate meaning. `''` is what a candidate
carrying no bytes looks like, so `isEmbeddable(mediaType) && data` skipped the
embed branch **even though the media type is embeddable**; `if (path)` skipped
too (a pasted candidate has none); and control reached the catch-all, which
printed:

> `image/png can't be embedded — only PNG, JPEG, GIF and WebP images can`

naming PNG as both the rejected type and an accepted one, and never mentioning
the real failure. **The message was not wrong for the case it was written for —
the wrong case reached it.**

Widening `Candidate` with a read-failure flag was the tempting alternative and
is the thing to not re-propose. `judgeAttachment`'s contract is *given a
candidate, judge what it is*; a read failure is not a property of the
candidate, it is a property of the attempt. The composer is the only place that
attempt happened.

**The premise was reproduced before it was fixed** — the fourth consecutive leg
to do so. A jsdom `FileReader` stubbed to fire `onerror` for a named file
produced the contradictory sentence verbatim, so the ticket's claim was
measured rather than inherited.

**The instrument had to fail selectively.** jsdom's own `FileReader` always
succeeds, so the failure is installed by the test — and installed **by file
name**, because a stub that fails everything cannot show that an unreadable
sibling costs a readable one nothing. The readable file in that mixed paste is
really read, by the real reader, through the stub.

**Mutation-verified twice, because the fix has two halves that fail
differently.** Restoring `.catch(() => '')` reds the pin with the original
contradictory sentence; keeping `null` but dropping `...unreadable` from the
rejection list reds it on the `waitFor` instead, with no rejection rendering at
all. One mutation would have proven only one half.

**AC1's real assertion is the negative one.** The pin asserts the reason **is**
the could-not-read wording *and* **is not** the embeddable-types sentence — a
build that showed both would pass an assertion that only looked for the new
string.

## Reversibility

Cheap and local. One file, one constant, one `.then` body; reverting restores
the old behaviour exactly. The copy (`Couldn't be read — it may have been
moved, deleted or locked`) is pinned by the test as a literal, so changing it is
a deliberate edit in two places rather than a silent drift.

The rejection list puts unreadable entries **before** policy rejections. Nothing
pins that order and no requirement names it; it is a choice, not a derivation.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-04-an-empty-list-is-attributed-not-observed]] — the neighbouring
  case of one value standing for two different causes
