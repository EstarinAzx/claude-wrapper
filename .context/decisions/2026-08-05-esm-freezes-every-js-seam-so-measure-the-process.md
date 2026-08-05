---
type: decision
project: claude-wrapper
date: 2026-08-05
updated: 2026-08-05
tags: [context, decision]
---

# ESM freezes every JS seam, so measure the process instead

**#124, shipped as `39c2896`.** The effort control had one acceptance criterion
that mattered more than the rest — *"a driver or harness demonstrates the
setting actually reaches the SDK; a stored value that never reaches `Options` is
the failure mode this ticket exists to avoid"* — and the obvious way to satisfy
it does not work in this app. Gate green: typecheck clean, build clean,
**1226 tests / 80 files** (was 1164 / 77), `gui-124` PASS and red-verified.

## Decision

**When the value under test crosses into a child process, measure the child
process's command line. Do not try to patch the library that spawns it.**

Two JS seams were tried first and both are structurally unpatchable from a
driver that attaches after boot:

| seam | why it fails |
|---|---|
| `sdk.query` | The SDK ships as ESM (`sdk.mjs`). `require()`ing it yields a **frozen namespace**: `sdk.query = fn` silently does nothing. |
| `child_process.spawn` | The SDK does `import{spawn as …}from"child_process"` — an ESM binding resolved at **link time**, so mutating the CJS export afterwards is invisible to it. |

`gui-124.mjs` instead reads `Win32_Process` for every descendant of the Electron
main pid and looks for `--effort <level>` on the CLI invocation. That is *past*
`Options` entirely — it is the argument vector of the real process, so no
app-side plumbing can fake it. It needs no seam, so nothing about the SDK's
module format can take it away.

## The trap inside the trap

**The frozen-namespace assignment fails SILENTLY, and a naive driver reads its
own empty capture array as "the value never arrived".** That is a false RED
about the product, produced entirely by a broken instrument — #122's lesson in a
new shape. This driver only caught it because it read the patch back out of the
module cache (`installedInCache: false`) instead of assuming the assignment took.

**Any probe that installs something must read the installation back.**

## Two more false reds, both instruments

Caught inside the driver rather than shipped as findings:

- **`getComputedStyle(el, '::-webkit-slider-runnable-track')` does not read that
  pseudo-element in Chromium.** It returns the *element's own* computed style,
  whose `background` is `transparent` by design — scored as "the track paints
  nothing".
- **`locator.screenshot()` inherits the documented zoom/clip defect.** At this
  app's live **1.25** zoom factor it cropped a flat patch of the wash: one
  distinct colour, read as "nothing paints". At zoom 1 the same sample reads 26.

The paint phase now normalises zoom **and** runs behind a **positive control on
`.send-btn`** (which carries an authored mint fill). A broken instrument now
reports UNSCORED rather than refuting the thing it cannot see.

## An unset pick needs a stop of its own

Five bare stops left **`low` unreachable by one gesture**. An unset pick has to
park the thumb somewhere, that somewhere was position 0, and a range fires no
change event when the thumb is already where the gesture put it — so clicking
the leftmost position on a fresh launch did nothing at all. Stop 0 is now
`Default`, which is the **absence of a level rather than a sixth level**, and the
same row the model pill's menu already carries.

`tests/effort-control.test.tsx` caught this, not review. A control with a null
state and an ordered scale needs a stop for the null.

## Also measured

- **The CLI's effort surface, live:** 15 model rows, **14 carrying** the effort
  fields, union exactly `["low","medium","high","xhigh","max"]`.
- **#124's ticket text is wrong on one point.** It says one of fifteen rows
  reports `supportsEffort: false`. Measured: all 14 that carry the field say
  **true**, and the fifteenth (`haiku`) **omits both fields**. So an absent field
  means *"the CLI did not say"* → the full scale, while `false` → no control.
  Collapsing those two would have killed the control for `haiku`.
- **`--effort` is a real CLI flag**, which is what makes the process-argv route
  work at all.

## Process notes

- **Never `git checkout <file>` to undo a mutation on uncommitted work.** It
  reverts to HEAD and silently drops every edit made since the branch point.
- **`ConvertTo-Json` over `Win32_Process` is not safe.** A live command line on
  this machine carried a raw control character, producing invalid JSON that took
  the probe down *mid red-path verification* — a driver failing for a reason
  unrelated to what it measures. Tab-delimited lines with the control range
  stripped cannot fail that way.

## Related

- [[2026-08-05-file-is-a-secure-context-and-unscored-is-not-refuted]]
- [[2026-08-05-the-clis-command-surface-is-enumerable-and-two-asks-died-on-it]]
- [[overview]] · [[active-work]] · [[pick-up]]
