---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, gui-drivers, testing, dom-phase, instruments]
---

# The batch is the instrument, and a teardown is a promise

## Decision

A GUI driver that must pin state which **outlives its own process** — window
bounds, zoom factor, anything in Electron's `userData` — launches with a private
`--user-data-dir` rather than borrowing the shared profile and restoring it
afterwards. Landed on `gui-136` in #136; the general case is filed as #147.

## What happened

`gui-136` pins the window size and the zoom factor, because
`setContentSize(640)` only means the 640css window minimum if the page is at
factor 1. Both values persist: bounds are remembered (#79, #110), and the zoom
factor lives in `userData` **and** in the renderer's own localStorage, which
`inspect.mjs` already documents. Written into the shared profile, the drivers
that ran later in the phase inherited them, and `gui-69` and `gui-70` both died
waiting for the composer to become visible. Both pass alone.

Four full phase runs to attribute it:

| run | #136 CSS fix | gui-136 in batch | result |
|---|---|---|---|
| baseline on `main` | no | no | 28/29 — gui-123 only |
| first, then repeated clean | yes | yes | 27/30 — gui-123 + gui-69 + gui-70 |
| isolating | yes | **no** | 28/29 — gui-123 only |
| after the private profile | yes | yes | 29/30 — gui-123 only |

## The three things that outlive the ticket

**1. The batch is the instrument.** The first attribution attempt ran the
suspect immediately followed by the victim — `gui-136`, then `gui-69` — and it
passed. That was taken as exoneration and it was wrong: the effect accumulates
through the intervening launches, so a pair cannot see what a batch produces.
A hazard that only appears at length is not measurable at a length of two. The
run that actually settled it was the *withheld* one — same stylesheet change,
driver removed, whole batch clean — because it changed one variable against the
failing configuration rather than building a smaller one and hoping it was
representative.

**2. A teardown is a promise that goes unkept precisely when it matters.**
Restoring the borrowed bounds and zoom on the way out was the obvious fix and
is the weaker one: teardown code does not run when a driver throws, times out,
or is killed — which is exactly the population of runs that leaves the profile
dirty. Isolation is a **property of the launch**; restoration is a **promise
about its ending**, and instruments fail at their endings. Prefer the property.

**3. "Passes alone, fails in the batch" is not a category, it is a question.**
That sentence is the literal definition of `DOM_SKIP`'s `desktop-exclusive`
entry, and two healthy drivers were one shrug away from being quarantined under
it for another driver's bug. The manifest already demands a measurement for
that category rather than a preference; this is why. A batch-only red should be
attributed to a *cause* before it is given a *name*.

## Two smaller ones from the same leg

**A verdict must be parsed, and the shell can lose it too.** #125 established
that an exit code cannot be trusted because a driver can print FAIL and exit 0.
Here the phase's verdict was read off `npm run test:dom | tail -60`, whose exit
status belongs to `tail` — reported as **0** while the text said
`DOM PHASE FAIL`. The rule reaches one level further out than it was written.

**A pin that agrees at one width may be agreeing for the wrong reason.**
Mutating `.titlebar-center` back to `flex: 1` makes all three titlebar children
split into equal thirds, which *also* centres the title: 10 of 12 driver rows
still passed, and only the 640px row and the source-level check caught it.
Measuring at the ticket's own 1440 alone would have shipped a different, worse
layout as a green.

## Related

- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
- [[2026-08-11-a-protocol-nobody-reads-is-not-a-protocol]]
- [[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]]
