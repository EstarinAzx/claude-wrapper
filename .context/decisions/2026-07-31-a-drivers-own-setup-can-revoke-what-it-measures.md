---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decisions, testing, drivers, scrollbar, engine]
---

# A driver's own setup can revoke what it measures

**Decision:** `gui-51` (#77) drives **every** surface it names into overflow and
measures it. The four `NOT DRIVEN` lines are gone and the state they described
is gone with them: the run seeds its own store (24 sessions, one of them 30
turns), opens the long session so `.chat` scrolls, types 20 lines past the
composer's 8-line ceiling, types `/` to open the popover and opens the Commands
dock. A surface is now **measured or the run FAILS**; there is no third, quiet
outcome. Seven readings, one rule.

**Why now:** a driver whose entire claim is *"this scrollbar rule is GLOBAL"*
was measuring two surfaces and printing an honest note about four others. The
note was correct and the `PASS` above it was not what it looked like — this is
[[2026-07-31-a-driver-establishes-its-premise]] pointed at the driver itself:
`.chat` and `.message-input` were empty **because the run left them empty**, and
both command surfaces were absent **because nothing opened them**. All four were
states this driver could create; it was already stubbing dialogs and opening
menus.

## The finding: order the setup by what it REVOKES, not by what it needs

The first working version measured in the order the surfaces appear on screen —
rail, pane, then the menus. It came back with the model picker showing **1 row**
and both command surfaces **never mounted**, which reads exactly like a CLI that
answers nothing.

The CLI was fine. **Opening a past session had closed the engine.**
`openSession` calls `targetSession`, which closes the query so the next send
rebuilds one pointed at the resumed transcript — deliberate, documented, and
from that moment `listModels()` and `listCommands()` both answer `[]` **by
contract**. The three CLI-sourced surfaces (`.model-menu`, `.command-popover`,
`.command-list`) are filled from the query the folder pick's eager warm-up
(#39) built, so a driver that opens a session first has quietly revoked its own
instrument two steps before using it.

Generalised: **when setup steps change what the app can still answer, order them
by what each one takes away.** A step that only *reads* can go anywhere; a step
that closes an engine, switches a workspace or clears a pane is a boundary, and
everything that depends on the pre-boundary capability belongs before it. The
driver now says so in a comment at the boundary itself, because the failure is
invisible at the call site — nothing throws, two lists just go empty.

**And the shape that made it hard to see: an empty list beside a static row
looks populated.** The picker always renders one row (the "default" pick) before
whatever the CLI offers, so an empty fetch renders as a one-item menu — present,
plausible, not overflowing. The count to reason about is what the list was
supposed to *add*, never `querySelectorAll(...).length`. The driver logs it as
`N rows incl. the static default` so nobody re-derives this from a `1`.

## `.session-groups` was passing by inheritance

It never printed `NOT DRIVEN`, and that was luck: it overflowed because the
developer's real store holds ~490 sessions. On a fresh machine the same line
would have gone quiet, and under #77's no-third-state rule it would now FAIL
instead. So it is seeded like the rest. **A surface that passes only on the
machine that wrote it is inherited, not established** — and converting a note
into a failure is exactly what turns that distinction from pedantry into a red
run.

## Mutation: all seven redden, including the four that were blind

`::-webkit-scrollbar { width: 10px }` → `16px`, rebuilt, re-run:

| surface | rule intact | rule mutated |
|---|---|---|
| probe div | 12dev | **20dev** |
| `.command-popover` | 12dev | **20dev** |
| `.command-list` | 12dev | **20dev** |
| `.model-menu` | 12dev | **20dev** |
| `.message-input` | 11.25dev (coarse) | **20dev (coarse)** |
| `.session-groups` | 12dev | **20dev** |
| `.chat` | 12dev | **20dev** |

Reverted with the same anchored replace; `git diff -- src/` empty afterwards and
the built CSS hash returned to `index-yb3vXtUj.css`. Before this ticket four of
those seven rows did not exist — the mutation is what makes "they were blind" a
measurement rather than an argument.

The **drive** steps were shown red too, without arranging it: the first run
failed with `.command-popover — could not drive: absent`, `.model-menu — could
not drive: present but not overflowing`. That is the intended reading. `could
not drive` names the **setup**, a gutter mismatch names the **rule**; one FAIL
string for both is how a driver wastes an afternoon
([[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]]).

## The budgets did not move, and the coarse one is doing real work

`EXPECTED_GUTTER = 10`, `isGutter` at `1` exact / `1 + dpr` coarse, `GUTTER_FN`
byte-identical — verified by diff, not by intent
([[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]]).

Worth recording because it is the one number a future leg will be tempted to
touch: at dpr 1.25 `.message-input` reads **9css / 11.25dev**, which is
**1.25dev** from the expected 12.5 — *past the exact budget of 1* and inside the
coarse budget of 2.25. That is not slack being spent by accident. A textarea
renders no element children, so its shim reads 0, the zero-reading guard
engages, and the coarse instrument's whole-CSS-pixel rounding is what costs the
1.25dev. **The composer is only measurable because that guard and that wider
budget exist**, and the driver now fails if the reading ever comes back `exact`
— an exact reading there means the instrument changed under us and the guard is
no longer the thing being relied on.

Headroom is still real: the mutation put every surface at 20dev, 7.5dev past
expected, against budgets of 1 and 2.25.

**No CSS was touched** (beyond the reverted mutation), which the ticket required
for its own reason: `tests/scrollbar.test.ts` scans every line naming a
scrollbar pseudo-element, comments included.

**Reversibility:** easy. The change is one driver file; no `src/` change, so the
suite is unmoved at 864 tests across 58 files.

## Related

- [[decisions]] — index
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule this applies
  to the driver's own state
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — #71,
  the instrument kept verbatim here
- [[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]] — #76, the
  sibling ticket and the `could not drive` / assertion split
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — why the 16px run
  is the receipt
- [[active-work]] · [[pick-up]]
