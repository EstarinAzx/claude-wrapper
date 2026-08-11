---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, design-system, bans, testing]
---

# A permission outlives the thing it permits unless both are pinned

## Decision

#140 (`b30a4b3`) keeps the selected session row's 2px mint stripe and amends
`DESIGN.md`'s **Bans in force** with one named, scoped exception beside the #125 glass
exception, in the same form and stating it is not a precedent.

The stripe itself is **untouched**. The commit is a document edit plus a test.

| half | what it holds | gate |
|---|---|---|
| code | `.session-row-btn-active` declares `inset 2px 0 0 0 var(--color-mint)` over `--mint-wash` | `npm test` |
| scope | exactly ONE box-shadow in all of `styles/` has a nonzero horizontal offset | `npm test` |
| anti-vacuity | every `box-shadow` value in `styles/` is one the parser can actually read | `npm test` |
| document | the section still bans side-stripes, and names surface + declaration + scope + not-a-precedent | `npm test` |

## Why

**The amendment on its own would have been half a fix, and the missing half is the
one nothing was watching.**

An exception in prose protects the stripe from a conformance pass — that is the
direction #125 argued, and it is real: this repo's own history has a commit literally
titled *"style: two off-scale values conform to DESIGN.md"*, and two separate reviewers
have now read this stripe against the spec, one backwards as a full outline and one
correctly as a spec break.

The other direction was wide open. **Before this commit nothing in the repo asserted
the stripe existed.** `rails.css:548` was its only occurrence, read by no test and no
driver. Delete the rule and every check in the suite stays green while `DESIGN.md` goes
on granting an exception for a declaration that is no longer there — a document
arguing for a permission nothing needs, with no instrument anywhere that notices.

`tests/subagent-material.test.ts` already names this failure for #125 in its own
comment: shipping the rule without the amendment, and reverting the rule while keeping
the amendment, must **both** be red. So acceptance 2's phrase "in #125's form" was read
to include its **pin**, not only its sentence. That reading is the decision.

**This is the sibling of #139's rule one turn out.** There the finding was that a check
on a value survives the death of its reason unless the reason is checked too. Here the
subject is a *permission* rather than a value, and the reason is a *declaration in
another file* rather than a DOM fact — but the shape is identical, and so is the
failure: the surviving artifact stays green and stops meaning anything.

### The discriminator is geometric, so it is parsed rather than grepped

A side stripe is a shadow pushed sideways: a **nonzero horizontal offset**. The
`inset 0 0 0 1px var(--tint-6)` idiom used on fifteen other surfaces in this app has
offset **zero** and paints a full hairline outline on every edge. Same CSS property,
opposite shape, and a grep for `box-shadow` cannot tell them apart — it would either
catch every hairline in the app or, keyed on the mint token, catch nothing but the one
line it was written from and never see a second stripe appear.

So the scan parses the first length token off each declaration and asserts exactly one
nonzero one exists across `styles/` and `styles.css`. That is the mechanical form of
"the exception is that row only", and it is the same claim #125's test makes when it
says `backdrop-filter` appears nowhere else.

**A value the parser cannot read reds rather than being skipped.** Silent skipping is
precisely how this check would go vacuous the day somebody writes
`box-shadow: var(--some-stripe)` — the scan would find no numeric offset, count it as
"not a stripe", and stay green over the exact thing it exists to catch.

### #125 supplies the method, not the authority

A cross-model adversary refuted the ruling's first draft correctly: *"an exception to
the glass ban cannot license an exception to an unrelated side-stripe ban. Reusing
#125's amendment pattern stretches precedent into permission."*

The ruling was restated to respect it and the restatement is carried in the amendment
itself. The authority is the owner's standing grant. #125 is cited for **how** to write
a scoped exception, never for **whether** one may exist.

The alternative shape — rewriting the ban to read "no *decorative* side-stripes" — was
considered and rejected on #125's own reasoning: a category rewrite hands every future
surface a licence, where a named exception hands out exactly one.

### The ticket's framing was corrected rather than adopted

The ticket argues the banned list is "a list of **decorative** vocabulary", which would
make the violation merely apparent. Reading the line, that is weaker than stated:
*"No side-stripe borders, no gradient text, no decorative extra glass layers inside the
window (the OS acrylic is the one glass), no card grids, no em dashes in copy."* The
word "decorative" qualifies the **glass clause alone**, and "no em dashes in copy" is
not a decoration rule at all.

**The textual violation is real.** It resolves the same way for a better reason: the
stripe carries state — it is how a reader tells which session is selected — and
deleting a selection indicator to satisfy a decoration ban trades a working affordance
for a tidier document. Exempt it; do not argue it away.

### What was NOT measured, recorded rather than left implied

The ticket's **option 2** asked whether the mint wash alone would read as selected,
making the stripe redundant. Nobody measured it. It was declined on the reasoning
above, not on evidence.

That limit is written into `DESIGN.md` and into the test file's header, so the
amendment claims the stripe is **permitted**, never that it is **necessary**. If it is
ever measured and the wash carries selection alone, the honest move is to remove the
stripe and the exception together.

### D4 is not engaged, and that was verified rather than asserted

Any CSS change owes a driver pin that executes. This ruling changed no CSS, checked two
independent ways: `rails.css` is byte-identical to `HEAD`, and the built CSS bundle kept
its content hash (`index-B83pCap1.css`). No pixels moved, so no driver is owed, and the
whole pin lives in the fast gate where it runs on every commit.

### The extractor idiom did not transfer, and two probes proved it

`.subagent-drawer` is pinned with an anchored `^\.class\s*\{` regex. That matches
**nothing** here: `.session-row-btn-active` is a **grouped** selector paired with its
`:hover`, so the character after the class name is a comma, not a brace. Copying the
idiom would have produced an empty body — and an empty body would have failed loudly
rather than silently, but for the wrong reason and with a misleading message.

Two mutations confirm the fixed extractor reads the real rule rather than passing by
luck: renaming the class reds it, and `.session-row-btn-active-x` is correctly refused
by the negative lookahead.

## Reversibility

**Cheap to reverse, and the halves come apart cleanly.**

Removing the stripe means deleting the amendment and this test file together — three
tests in the first describe red immediately, which is the point. Nothing else in the
app depends on either.

The scope check is the half most likely to be argued with: it currently reads "no other
surface may carry a stripe", and the moment a second one is licensed it must be widened
deliberately rather than deleted. Widening it to a list of exempt selectors is the
natural next shape, and #125's line already anticipates the equivalent move for glass.

The thing that should **not** be reverted quietly is the anti-vacuity test. Without it
the scope scan silently stops covering any shadow written through a token, and a green
scan over an unread population is worse than no scan.

## Related

- [[decisions]] · [[active-work]] · [[overview]]
- [[2026-08-11-a-value-check-outlives-its-warrant-unless-the-warrant-is-checked-too]] — #139, the same shape one turn in: a value's reason rather than a permission's subject
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
- [[2026-08-11-a-test-built-on-ambient-state-measures-the-ambient-state]] — #141, the mutation-verify-the-test habit this leg used on all thirteen
