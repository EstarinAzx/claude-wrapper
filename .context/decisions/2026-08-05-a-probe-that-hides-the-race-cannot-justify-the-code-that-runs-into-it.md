---
type: decision
project: claude-wrapper
updated: 2026-08-05
tags: [context, decision]
---

# A probe that hides the race cannot justify the code that runs into it

**Decision:** #119 (`403d761` + `e0b8855`) keeps acrylic's blur through a focus
loss by **re-asserting the material on the window's `blur` event** —
`src/main/backdrop-keeper.ts`, three attempts at 0 / 250 / 800ms. **No
dependency.** Both routes #117 priced stay rejected, both backdrop ADRs stand
unamended, `src/shared/backdrop.ts`'s two-string whitelist is untouched, and
`package.json` is unchanged.

This answers the 2026-07-23 ADR's revisit condition — *"if/when the
unfocused-opaque flip becomes worth a dependency or an aesthetic change"* —
with **neither**. Owner-verified after a stress test: *"ok it works"*.

## The fix was already in #117's data, unexplained

#117's S4 recorded an oddity and did not chase it: acrylic's **focused** capture
scored 97 distinct colours in one round and 434 in two others — same window,
same material, same code path. The only difference was that rounds 2–3 set
`acrylic` right after `mica`, i.e. a real material **change**. That is one step
short of the whole answer, and it sat in a committed findings file for the
length of one conversation.

`scripts/probe-acrylic-reapply.mjs` chased it and it generalises to the
unfocused state: 948 focused / **118 unfocused** / 924 re-asserted, holding at
+5s and +15s.

**Carry this forward:** #117 was a *good* spike — it swept 1387 declarations and
priced three routes correctly — and its recommendation of adopt-nothing was
still wrong, because the thing that overturned it was an anomaly in its own
output that it recorded honestly and declined to explain. A spike's unexplained
observations are not decoration; they are the cheapest available lead.

## The durable half: the probe never ran the path that shipped

The probe re-applied the material **800ms after** focus was lost, and scored
924/948 every single time. The first shipped handler re-applied
**synchronously** on `blur`. Nothing orders Electron's `blur` event against
DWM's own switch to the inactive backdrop, so a re-assert that lands first is
simply overwritten — and the owner found it immediately: *"it 90% works but when
i stress tested it sometimes it slips"*.

**The probe's timing hid the race by construction.** Its 800ms was an arbitrary
settle chosen to make the measurement clean, and it made the measurement clean
by removing the only hard part. So the number that justified shipping was
measured on a path the shipped code does not take.

Generalised: **when a probe measures a mechanism the product will trigger from
an event, the probe must trigger it the same way.** A convenience delay in an
instrument is not neutral — it is a silent assumption that timing does not
matter, in exactly the situation where timing is the question. Near-sibling of
[[2026-08-05-the-caret-is-the-trigger-and-jsdom-cannot-see-it]]: there the test
environment could not see the trigger, here the instrument stepped around it.

## The schedule is reasoned, not measured, and that is stated

Three attempts bracket the window. The queue is dropped on every entry point, so
churned focus cannot end in a pile of late writes, and the delayed call reads
the material at **fire** time so a blur-then-switch-to-Mica cannot push acrylic
back 800ms after the user opted out.

A probe written to compare schedules **failed its own setup and was deleted**.
The metric is "distinct colours seen through the window", and over a uniform
dark desktop blurred and flat are identical — it scored a properly blurred,
focused window at **60** where good runs score 850–950, then printed
`recommendation: asIs` off two scored trials out of thirty. Discarded rather
than kept with a caveat: a broken instrument in the repo is worse than none,
because the next reader will believe its numbers.

## Three instrument lessons, each of which first looked like a product defect

- **Plant what you measure through.** `gui-119.mjs` now puts a known
  high-contrast window *behind* the target, so the metric no longer depends on
  what the desktop happens to hold, and it **refuses to score at all** if the
  focused baseline falls under 250 distinct colours.
- **Chromium throttles rendering in a background window.** Injected marker divs
  frequently do not paint while the window is unfocused, so the per-capture
  occlusion control scored `corners: 0` on captures that were otherwise perfect.
  Occlusion is now checked on the headline captures only, with the window pinned
  at `screen-saver` level throughout — a stated simplification, not a silent one.
- **`moveTop()` and app-level `focus({steal:true})` can hand focus back** on
  win32, so a churn sequence must **settle unfocused and verify it** rather than
  assume.

## An event handler must not be able to throw

`apply` guards a destroyed window and swallows what it cannot apply. This runs
from `win.on('blur')`, so a throw is an uncaught exception in main and Electron
puts a modal *"A JavaScript error occurred in the main process"* dialog over the
user's app. **Observed live** — from an unguarded handler a probe injected into
the running app, which is its own lesson: an instrument may fail to measure, but
it may never break the thing it measures. A material we could not apply is a
cosmetic loss; that dialog is not.

## What ships is "it comes back", not "it never goes"

Owner, on the delivered build: *"for a split second it does opeque up but i
think that should be fine for now"*. The 0ms attempt is the one that loses the
race, so the first attempt that reliably lands is at 250ms — about a quarter
second of opaque before the blur returns. **Accepted for now.** Recorded because
the pixel measurements (ratio 1.00, 8/8 under stress) are taken *after* the
transition and say nothing about the first 250ms; a later reader comparing the
flash to those numbers would otherwise read a regression.

Upgrade path if it stops being acceptable: earlier entries in
`REASSERT_DELAYS_MS`. Each is one call on a window nobody is looking at, so the
cost is negligible; the open question is how early DWM will accept one, which
needs a capture taken *during* the transition rather than after.

## Also settled here

**Mica survives blur** — owner observation in a real window, *"micas fine when i
click away its there"*. The first actual sighting on a record that had **twice
refuted** the claim for want of one, and it is now load-bearing: the keeper
re-asserts acrylic and deliberately does not re-assert mica.

**Reversibility:** easy. One module, one event handler pair, one constant.
Deleting the `blur` handler restores the previous behaviour exactly.

## Related

- [[decisions]]
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]] — #117, whose unexplained anomaly this chased and whose adopt-nothing recommendation it overturned
- [[2026-08-05-the-caret-is-the-trigger-and-jsdom-cannot-see-it]] — the sibling instrument lesson from the same day
- [[2026-07-23-persistent-glass-deferred]] — the revisit condition this answers; its rejection of the NATIVE-DEP route stands
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — still stands; its whitelist is now measured to be load-bearing
