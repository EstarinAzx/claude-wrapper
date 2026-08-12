---
type: decision
project: claude-wrapper
date: 2026-08-12
updated: 2026-08-12
tags: [context, decision, instrument, drivers, intermittent, evidence, compositor]
---

# Evidence may not destroy the verdict, and the renderer cannot see a stalled compositor

## Decision

#156 (`0e63253`) changes `gui-91.mjs` so a stalled screenshot costs the artifact
and nothing else. The underlying stall is **not** fixed; it was never reproduced.
The tracking moved to **#165** rather than dying with the closed ticket, and the
repo-wide version of the same hole was filed as **#166**.

Plainly: the driver used to take a photo it did not need in order to reach its
verdict, and when the camera jammed it threw the verdict away too. Now the jam is
recorded and the verdict survives.

| half | shipped shape |
|---|---|
| blast radius | the capture is wrapped; a stall is recorded, attributed from **main**, and the run continues to its real verdict |
| vocabulary | `bad` read **first** → real red wins (`FAIL`, exit 1); only-evidence-lost → **declines to score** (`UNSCORED`, exit 2); clean → `PASS` |
| the stall itself | **NOT FIXED**, unreproduced in 28 runs → #165 |
| the widening | 26 of 39 capture calls repo-wide have the same shape → #166 |

## Why

**A capture here is evidence, not an assertion.** Nothing in `gui-91`'s `bad`
array ever read `shotEmpty` or `shotRows` — they are written and their paths are
printed. But the call was a bare `await` in a top-level-await module, so a throw
aborted the run: phases 2 and 3 never executed. **One missing artifact cost eight
assertions it has no bearing on** — the titlebar pin, the no-timer measurement,
the row rendering, the read-only check, the accent budget. And with no verdict
line printed, `dom-phase.mjs` read it as plain `FAIL`, indistinguishable from a
real product break. That indistinguishability *is* the harm the ticket was filed
over: a red that makes no claim about the product trains a reader to re-run
instead of read.

**Both directions the ticket proposed are refuted, and neither refutation needed
the intermittent to land.** `scripts/spike-156-screenshot-stall.mjs`:

- *"A timeout too tight for a cold renderer"* — refuted by ~500x. A working
  capture costs **32–41ms** idle and **40–60ms** with eleven cores saturated,
  against playwright-core's **30000ms** default (`DEFAULT_PLAYWRIGHT_TIMEOUT`,
  which every driver inherits — no driver calls `setDefaultTimeout`, 0 of 55).
  Load moves the cost by tens of milliseconds, not tens of seconds, so a capture
  that spends the whole budget is a **different mode**, not this distribution's
  tail. The ticket's own escape clause ("load makes it likelier") was tested on
  purpose and produced no stall.
- *"A settle/`waitForLoadState` gap"* — refuted structurally and then
  empirically. Exactly two CDP round trips follow the `fonts loaded` line the
  failure's log ends on (`Page.getLayoutMetrics`, then `Page.captureScreenshot`),
  so there is no third wait to have a gap in.

**The transferable finding: the renderer is blind to this condition.** Withhold
the window's frames and the capture hangs, recovering when they return — while
the page goes on reporting `visibilityState: "visible"`, `document.hidden:
false`, and firing `requestAnimationFrame` at **0ms**. So a renderer-side settle
cannot detect it, cannot wait it out, and cannot be the fix. `win.isVisible()` in
**main** was the only witness that moved.

That mattered immediately, not just in theory: awaiting a real animation frame
before capturing was this leg's own first candidate remedy, and the control
**killed it before it shipped**. The general rule is the one worth carrying — a
guard is only as good as the witness it keys on, so validate the detector against
a deliberately induced instance before building anything on it. Had the probe
been assumed sound, the leg would have shipped a wait that fires instantly in
exactly the state it was meant to catch: #154's vacuity hole in a new costume.

**A rate estimated from one event is not a rate.** "About 1 run in 7" was **one
observed failure in 7 trials**. Adding this leg's 28 clean runs (16 idle, 12
saturated, each on a fresh `mkdtemp` profile at the driver's exact pre-capture
timeline) makes the known record **1 in 35**, on two machines and two trees. Not
settled — narrowed, and the interval is still far too wide to plan against.

**Which forced the close/keep-open question.** The standing rule is that an
unproven fix to an intermittent is *worse* than the intermittent, because it
retires the ticket that was tracking it. Both readings were available and both
were wrong on their own: closing #156 outright retires live tracking, and leaving
it `ready-for-agent` refills the queue the chain stops on and hands the next leg
the same unreproducible work. The way out is that the two halves are separable —
close the half that was proven, and re-file the unproven half under text that
matches what is actually known. Tracking continues; only the inaccurate headline
is retired.

## Reversibility

**Cheap both ways.** The driver change is additive and local: one wrapper, one
verdict expression, no `src/` change, `index-DOI17h8g.css` byte-stable. Reverting
restores the bare `await` and with it the eight-assertions-for-one-artifact
trade.

The verdict *ordering* is the part worth arguing before changing. Reading `bad`
first is what stops an instrument problem softening a genuine red, and reporting
`UNSCORED` rather than `PASS` is what stops a driver that has quietly stopped
producing screenshots from reading as healthy (#148's lesson). Both are pinned by
mutation rather than by comment: frames withheld → `UNSCORED`/exit 2 with all
eight assertions still run; the same stall compounded with a real assertion
failure → `FAIL`/exit 1 with the stall still reported.

**One limit, stated so nobody mistakes the control for the cause:** the
deterministic reproduction is a *minimised* window, and nothing minimises a
driver's window during a real run. The wild trigger is still an unidentified way
for a **shown** window to stop producing frames — and note that Chromium's native
occlusion detection, the obvious candidate, leaves `isVisible()` reading `true`,
so the witness that caught the minimise would **not** catch it. #165.

## Related

- [[decisions]] · [[active-work]] · [[overview]] · [[pick-up]]
- [[2026-08-12-a-ban-is-satisfied-by-the-absence-of-what-it-bans]] — the vacuity hole this leg's refuted probe would have re-created
- [[2026-08-12-awaiting-the-mechanism-is-half-a-fix-and-the-timeout-is-bounded-at-both-ends]] — #153's shape; here the mechanism turns out to be unwatchable from the renderer
- [[2026-08-11-a-green-inherited-from-the-machine-is-not-evidence]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
