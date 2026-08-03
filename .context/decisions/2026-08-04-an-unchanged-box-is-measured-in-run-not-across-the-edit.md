---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# An unchanged box is measured in-run, not across the edit

**#96, shipped as `93ccd7d`.** `DESIGN.md` names two scales that two authored
values missed, each at exactly one site: weights are *"400 body, 600 app name and
bubble-less emphasis"* and `.model-menu-item` authored **500**; transitions are
*"150ms, entries 200ms"* and `subagent-slide` — an entry — ran **180ms**. Two
declarations changed, nothing else. Gate green: typecheck clean, **979 tests
across 64 files** (unchanged), `gui-96` PASS after being red-verified.

The fix is two lines. **The finding worth carrying is the instrument, again.**

## Decision

**1 — Conform by deletion, not by raising to the next named value.**

`.model-menu-item`'s `font-weight: 500` was the only such declaration in
`styles/`, and the rule became empty when the declaration went, so the rule went
too. The row drops to the inherited **400**. It was *not* raised to 600: the doc
reserves 600 for "app name and bubble-less emphasis", which a menu row is not,
and the jump is visibly heavier than the 500 was asking for. This is the same
consistency argument [[2026-08-04-the-parked-owner-calls-are-taken]] used to kill
"widen the documented scale" for the accent clause — a move that cannot be wrong
there and right here.

**2 — The two `subagent-pulse 1.4s` sites are accepted exceptions and stay.**

`agent-map.css` and `rails.css` have **no diff**. The clause governs *transitions
and entries*; an infinite ambient loop is neither, and a symmetric easing on one
is defensible. A previous audit round proposed conforming them and was refuted.
`gui-96` now asserts both still read `1.4s` **positively**, so a later tidy-up
that "conforms" them reds rather than passing quietly.

**3 — An "unchanged box" criterion is driven through both states in one run.**

This is the reusable part. AC5 asks that the row's box not move — the #94 failure
one property over, where a font change moved every child of a row by 27%. That
cannot be measured across the source edit in a single run, and the tempting
weaker form ("the row computes 400 and its height is H") **passes against any
H**, which is the vacuity trap this project has now hit seven times.

So the driver drives the **live** row through both weights in-run: forced to
`400`, reflow, measure; forced to `500`, reflow, measure; restore. Same element,
same cascade, same fonts, only the weight moving. That is non-vacuous in the red
run and the green run alike, and it is exactly the quantity the criterion is
about.

Measured at 1.25 dpr: `33.000 × 173.000` device px at **both** weights, delta
**0.000**. So the #94 class of bug is **absent by measurement**, not merely
unobserved.

## Why

**Reduced-motion would have made two criteria measure nothing.** `base.css:92`
sets `animation: none !important` on `*`, `*::before` and `*::after` under
`prefers-reduced-motion: reduce`, globally and on purpose. Under that media state
`animationDuration` reads `0s` for the conforming value **and** for the
exceptions — so AC3 would have passed for the wrong reason while AC4 failed for
one, and the run would have looked like a real result. `gui-96` forces
`no-preference` **and then reads the media state back**, because forcing
something is not the same as it having taken. Premise before claim, the
[[2026-07-31-a-driver-establishes-its-premise]] rule applied to a media query
rather than to a control.

**Red-verification produced a clean three-of-five differential:**

| criterion | before | after |
|---|---|---|
| 1 — `.model-menu-item` weight | **`500`** | `400` |
| 2 — `font-weight: 500` in `styles/` | **1 hit** (`composer.css:112`) | none |
| 3 — `subagent-slide` duration | **`0.18s`** | `0.2s` |
| 4 — both `subagent-pulse` sites | `1.4s` | `1.4s` |
| 5 — row box across both weights | Δ `0.000` | Δ `0.000` |
| exit code | `1` | `0` |

Criteria 4 and 5 passing in **both** runs is the point, not a weakness: 4 is a
positive guard on values that must not move, and 5 is non-vacuous by construction
precisely because it does not depend on the edit.

**No vitest test was added, and that is the ticket's own reasoning.** jsdom can
see neither a computed font-weight nor an animation duration, so nothing in
`tests/` pins either value in either direction. `gui-96.mjs` is the **only** guard
on all five criteria — deleting or renaming it silently removes the coverage
entirely, the same exposure `gui-94` carries for the command-row font.

**One measurement is a live element, one is a probe, and the driver says which.**
`.subagent-row--running .subagent-row-dot` is measured on a genuinely running
synthetic subagent. `.agent-map-halo` is measured on a **probe** `<div>` carrying
that class — the rule is a bare single-class selector, so the probe resolves it
through the real cascade, but it is not the agent map and the output labels it
`(PROBE element)`. The [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]]
probe technique, reused and disclosed.

**The ticket's stated baseline was stale, second consecutive time.** AC7 says 953
across 63 files; the real baseline is **979 across 64**, because #91 added 25 and
#95 added 1 after the ticket was written. Re-measured rather than matched — the
same correction #95 had to make.

## Not decided here

**`gui-52` is red and it is not this ticket's doing.** It exits `1` here and
exits `1` identically on clean `main` with the work stashed, failing on
`menu has only 1 entries` / `no CLI-only row`: the CLI returned an **empty** model
list in both runs, which is `gui-51`'s documented *"a count of 1 means the fetched
list was EMPTY"* landmine. Environmental, reproduced before being called so.
Nothing here touches the model list — only the weight of the row that renders it.

**Whether 400 is the right weight for a menu row at all** is not reopened. The
doc names two weights and this conforms to one of them; preferring a third is a
`DESIGN.md` change, which is the owner's and which the accent-clause reasoning
says must not be made by laundering current drift into the doc.

## Reversibility

**Trivially reversible**, two declarations. Restoring either sends `gui-96` red on
the matching criterion — criterion 1 and 2 for the weight, criterion 3 for the
duration — so the instrument outlives the decision in both directions.

**Criterion 4 is the deliberate one-way clause.** It exists so that reverting *the
exceptions* into conformance is the thing that reds. That is the asymmetry the
ticket asked for.

## Related

- [[decisions]]
- [[2026-08-04-the-parked-owner-calls-are-taken]] — **filed this ticket**, and
  where "conform rather than widen the doc" was settled
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — **#94, the line-box bug
  one property over**, which is why AC5 exists at all
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93, the probe
  technique reused here, and which put `.model-menu-item` in the focus wash group
- [[2026-07-31-a-driver-establishes-its-premise]] — the rule the reduced-motion
  check follows
- [[active-work]] — the landmines this adds to
