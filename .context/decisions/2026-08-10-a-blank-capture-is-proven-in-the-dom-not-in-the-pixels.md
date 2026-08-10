---
type: decision
project: claude-wrapper
date: 2026-08-10
ticket: 131
commit: 4a80989
tags: [decision, instrument, gauntlet, measurement, screenshots]
---

# A blank capture is proven in the DOM, not in the pixels

## The question

#131 built the consolidated `inspect:` command — one run, five core surfaces,
into a caller-supplied directory. Its fourth acceptance criterion is the one with
teeth:

> A capture failure is LOUD. A missing or blank surface must be reported as a
> failure, never a silently absent file. A bar folder that quietly came back
> half-empty reads exactly like a surface that had nothing wrong with it.

"Missing" is easy — the element is not there, or has no box, or is not painted.
**"Blank" is the hard half**, and the obvious instrument for it is the file
itself: a photograph of nothing compresses to almost nothing, so floor the
capture at some bytes-per-kilopixel and a flat frame fails.

That reasoning is wrong twice, and both refutations came from measuring it rather
than from thinking harder about it.

## What was measured

**First attempt — a fixed floor of 1.5 bytes/kilopixel.** Pointed at
`.welcome-mark`, a 44x44 solid mint fill and about as blank as a region in this
app can be, the capture scored **403.93 bytes/kpx — the highest reading of the
entire run**, against 14.47 for the sparse Welcome hero and ~102 for the chat.
PNG carries roughly 700 bytes of fixed header and chunk overhead, and over an
area of two kilopixels that overhead *is* the measurement. Density tracks content
only once the area is large enough for the overhead to vanish, so a single floor
is meaningless across surfaces whose areas differ by three orders of magnitude.

**Second attempt — a per-run negative control at 2x.** Photograph a 320x320 patch
of this app's own empty background and require every surface to be twice as
dense. Measured: background **10.77**, Welcome **14.47**. The control **failed
Welcome** — a legitimately sparse hero (one mark, one title, one line of hint,
one button, centred in 1440x852) that clears pure background by only **34%**.

That second failure is the important one. Shipping it would have produced a red
run against a surface with nothing wrong with it: the tenth instance of this
repo's oldest failure mode, an instrument artifact reported as a finding, in a
file whose own header warns about exactly that.

## The decision

**The DOM assertions carry the guarantee; the pixel check is a backstop kept only
at the strength the numbers support.**

Every surface declares what makes it that surface, asserted inside its own
subtree *before* it is photographed — a chat needs `.msg-user`, `.msg-assistant`,
`.tool-card` and `.date-divider`; a sidebar needs a heading and at least one
`.session-row-btn`. A chat that replayed nothing has no `.msg-user` to find,
whatever its pixels compress to. That is precise where density is vague.

The density ratio stays at **1** — a real surface must beat pure background,
and nothing more is claimed. The 34% margin on the sparsest surface is thin and
is written down as thin rather than dressed up.

Two things guard the "silently absent file" half structurally instead of by
reasoning: a failing run prints `CAPTURED n/7`, and a *green* run asserts it
wrote all seven files, so a green verdict cannot coexist with a half-empty
directory even if the per-surface chain were ever broken.

## Why it generalises

Sibling of [[2026-08-05-file-is-a-secure-context-and-unscored-is-not-refuted]]
and the whole "unscored is not refuted" family, from a new side: **an instrument's
threshold is a measurement, not a constant.** Both thresholds here were arrived
at by sound-sounding reasoning about how PNG compression works, and both were
wrong — the first about small areas, the second about sparse ones. The cost of
finding out was two runs.

The narrower transferable fact: **a screenshot's byte size is not a content
signal below a few hundred kilopixels**, because fixed format overhead dominates.
Any future check tempted to read blankness out of a file size needs to compare
like-for-like areas, and even then needs a real margin before it may fail
anything.

## Reversibility

Fully reversible and cheap. The control is ~40 lines in
`.claude/skills/run-desktop/inspect.mjs` and gates nothing outside that file; the
ratio is one constant. A future instrument that can genuinely read pixels — an
actual PNG decode, or the token-differential trick from
[[2026-08-04-the-ground-cancels-in-a-token-differential]], which already solves a
harder version of this problem — could replace it outright. Nothing in `src/`
depends on any of it.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-08-05-file-is-a-secure-context-and-unscored-is-not-refuted]]
- [[2026-08-04-the-ground-cancels-in-a-token-differential]]
