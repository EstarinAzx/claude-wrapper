---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# The subagent drawer is drivable without a live turn

**#95, shipped as `e9a3c28`.** `.subagent-drawer-backdrop` rendered as a real
`<button>` with no `tabIndex`, so the drawer's scrim was a keyboard tab stop
whose only job is to swallow a click outside the drawer. Its direct analogue
`.model-backdrop` already declined the stop. Two scrims, one job, one in the tab
order. Gate green: typecheck clean, **979 tests across 64 files** (+1),
`gui-95` PASS after being red-verified, `SubagentDrawer.tsx` verified 100% CRLF.

The fix is two lines. **The finding worth carrying is the instrument.**

## Decision

**1 — A decorative scrim is `aria-hidden="true"` + `tabIndex={-1}`, no label.**

That pair is one decision, not two. `aria-hidden` alone on a focusable element is
an `aria-hidden-focus` violation; `tabIndex={-1}` is what makes it legitimate.
And an `aria-hidden` element's `aria-label` is unreachable, so keeping
`aria-label="Close subagent"` would have documented an affordance no longer
offered — it went with the change. The result is byte-equivalent in shape to
`.model-backdrop`, which is the point: **the two scrims must agree, and a third
copies the pair.**

Scope item 2 asked to *check* whether the a11y tree depends on the scrim being
announced rather than assume it. It does not: the drawer carries
`.subagent-drawer-close` ("Close viewer") as a real reachable affordance and an
Escape handler, so a keyboard user already had two ways out and the scrim was a
third that led nowhere. Nothing in the suite or any driver queries its label.

**2 — A GUI driver reaches the subagent drawer with no live turn, by pushing
`chat:event` from main.**

This **reverses a documented belief.** #93 could not Tab-drive any control inside
this drawer and fell back to a static grep of the built CSS, labelling it weaker;
the landmine ledger and #95's own ticket both carried that forward as *"reaching
this drawer needs a real turn that spawns a subagent"*. It was a reasonable
inference from a CSS-only contract, **not a measurement**, and it is false.

`chat:event` is preload-subscribed (`preload/index.ts:144`), so main can send the
same two events the engine emits — a `Task` tool-use and a `subagent` presence
tick — and `useChat` grows the clickable `.subagent-row` from them. The trick was
already in the repo twice: `gui-agents-dock.mjs` does it with `tasks:changed`,
and `tests/subagent-viewer.test.tsx` emits the same shape in jsdom. Nobody had
carried it across to the drawer.

**Be exact about what is synthetic.** The drawer, scrim, close button, styles,
window and Tab presses are all real; the two seed events are not. So this says
nothing about whether the CLI emits them — #84/#85 measured that separately —
and every claim `gui-95` makes is about the tab order.

**Consequence:** the whole drawer surface is now driver-reachable, and #93's
static-only note on `.subagent-drawer-close` can be retired whenever something
next touches it.

**3 — The vitest guard is not the measurement, and says so.**

jsdom cannot press Tab, so the suite cannot see a tab order. The added test
guards the *attribute the walk depends on*, since `gui-95` is manual and nothing
runs it automatically. It is written as two **positive** assertions
(`backdrop.tabIndex === -1`, `close.tabIndex === 0`) rather than an absence, and
was observed failing (`-1` vs `0`) before the fix.

## Why

**The absence-assertion trap, sixth instance** (after #76, #82, #93, #94, #91).
"Tab never lands on the scrim" passes perfectly against a drawer that never
opened. So the *same walk with the same keys* also asserts
`.subagent-drawer-close` **is** reached: if the drawer were shut both would be
missing and the run fails on the second rather than passing on the first. The
premise — drawer open, scrim in the DOM and painted, close button present — is
asserted before the claim.

**Red-verification is what made the instrument real**, and the differential is
exactly one stop:

| | before | after |
|---|---|---|
| cycle length | 17 stops | **16 stops** |
| `.subagent-drawer-backdrop` | **stop 6** | absent |
| `.subagent-drawer-close` | stop 7 | stop 6 |
| exit code | `1` | `0` |

**Two driver defects were caught by that first run, and both generalise:**

- **Substring class matching is a bug.** The cycle-break tested
  `className.includes('subagent-row')`, which is also true of
  `subagent-row--running`, so it never fired and the walk burned its full
  120-stop budget. Match by whitespace-split **token**. Every
  `className.includes(...)` in a driver is this waiting to happen.
- **`$?` after a pipe is the pipe's exit code.** `node gui-95.mjs | tail -45;
  echo $?` printed `0` for a run that had just printed `RED`. This project's
  standing rule is *judge drivers by exit code* — which requires reading the
  driver's, not `tail`'s.

**#93 was right to leave this alone.** It found the control wearing Chromium's
default ring deliberately (an inset hairline on a viewport-sized scrim draws a
box around the whole window) and its contract was CSS-only. The real fix was
always to remove the stop rather than style it, which makes the ring question
moot — and doing it in the CSS ticket would have been smuggling JSX in.

**The ticket's stated baseline (953/63) was stale**, predating #91's +25. Actual
baseline 978/64 → 979/64. A ticket's acceptance numbers age; re-measure rather
than matching them.

## Not decided here

**The drawer has no focus trap**, despite `role="dialog" aria-modal="true"`. The
walk shows Tab leaving the drawer after the close button and continuing through
`.backend-pill`, `.perm-pill`, the three dock toggles, the window controls and
the composer — all *behind* the scrim. Real a11y gap, strictly larger than #95,
**left alone and deliberately not filed**: both 2026-08-04 grants are spent and
filing is a scoping call. Surfaced on the ticket and in the baton for the owner.

## Reversibility

**The fix: trivially reversible**, two attributes on one element. Reverting
restores a tab stop that does nothing, and `gui-95` goes red at stop 6 —
the instrument outlives the decision.

**The driver technique: not a decision to reverse, a fact to use.** The only way
it stops being true is if `chat:event` stops being preload-subscribed, and
`gui-95` fails loudly (`no row means the chat:event push never reached useChat`)
rather than passing vacuously if that happens.

**Dropping `aria-label` is the one judgement an owner might overrule** — it is
the single change beyond the ticket's literal two items, taken because an
`aria-hidden` label is unreachable. Restoring it is one line and changes nothing
observable.

## Related

- [[decisions]]
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — **#93, which
  flagged this and explains why it declined to fix it**; its static-only note on
  `.subagent-drawer-close` is now retirable
- [[2026-07-31-a-driver-establishes-its-premise]] — the premise-before-claim rule
  this driver follows
- [[2026-07-24-ui-polish-model-picker-subagent-viewer]] — where the drawer came from
- [[active-work]] — the landmines this adds to
