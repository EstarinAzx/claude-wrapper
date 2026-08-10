---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, gui-drivers, inspect, determinism]
---

# An instrument may not photograph a state the app calls impossible

## Decision

**#133 (`5e1b6b0`).** `inspect.mjs` captures the three right-hand docks — Agents,
Commands, Appearance — as `stage: 'dock'` surfaces driven through their titlebar
toggles, taking the run from five surfaces to eight and from seven files to ten.

Three rules came out of building it, and the third is the one that generalises
past this file.

**Docks are captured LAST, after the window frames.** A dock is an in-flow aside,
so an open one takes width out of `main.chat`. Captured any earlier they would
move the boxes of surfaces that have nothing to do with them, and #133's own AC3
("the five existing surfaces are captured identically") would fail for a reason
entirely internal to the instrument.

**Docks are selected by `aria-label`, never by class.** All three asides wear
`agents-dock` — the other two are `agents-dock commands-dock` and `agents-dock
appearance-dock`. A `.agents-dock` selector matches whichever dock happens to be
open and writes it out under the wrong filename, which is worse than failing.

**And the general one: an instrument must not force the app into a state the app
itself considers impossible, because sooner or later something photographs it.**
`useZoom` applies its persisted level on mount (`DEFAULT_ZOOM` 1.25); the driver
then called `setZoomFactor(1)` afterwards. The window rendered at 1 — 1440 CSS px
wide, verifiable in every capture — while the app still believed 1.25. `useZoom`
documents that as impossible in its own words: *"the readout can never disagree
with the window"*, because every in-app path goes through `step`.

Nothing photographed the disagreement for two tickets. Then #133 added the
Appearance dock, whose stepper prints that number, and the first capture read
**"125%" across a demonstrably 100% window**. A critic reading that file cannot
distinguish it from a real defect — the tenth instance of this repo's oldest
failure, an instrument artifact reported as a finding.

Fixed by seeding `zoom-level-v2` to `1` and reloading before the folder pick, so
the app mounts believing what the window does. Seeded rather than stepped because
`nextZoom(level, 'reset')` returns `DEFAULT_ZOOM`, not 1 — the app offers no path
to 100% that is not counting clicks.

## Why

**The docks were a third of the window's chrome with no observer at all.**
`DESIGN.md` defines the Agents dock as the sessions rail's mirror — same 44px
head, same row shell, grip on the facing edge — and through five gauntlet waves
the rail was photographed every time and the dock never was. A spec'd mirror with
scrutiny on one side drifts by construction, and it already had: a builder got a
dock foot strip's padding wrong at both ends while its own comment claimed to be
copying a dock rule.

**Real content is the whole point, so two fixtures were added to the one that was
already here.** An empty dock says nothing about row rhythm or head alignment,
which is the only reason to look at one.

- *Agents* reads `.meta.json` sidecars seeded next to the fixture transcript —
  the dock's **real** disk path (`subagents:list` → `listSubagents`). Three rows,
  one nested, because nesting is about 1 agent in 185 and a flat fixture would
  photograph only the common case and leave `INDENT_PX` invisible. One row
  carries no model and no depth, so "not recorded" and "zero" stay distinguishable.
- *Commands* is the one surface that **cannot be reached honestly**.
  `commands:list` calls `supportedCommands()` on a live query, so with no engine
  the dock's truthful answer is its empty state. The handler is replaced in main
  with a fixture, at the same boundary as the existing `dialog.showOpenDialog`
  stub. **A green `commands-dock.png` therefore says nothing about whether the
  CLI serves commands** — gui-51 and gui-94 own that, against a warm engine.
- *Appearance* needs no fixture; its content is local state.

That is not a compromise so much as an admission of what the instrument always
was: the chat surface has been a seeded fixture since #131. Provenance does not
matter for design review, only that a real row rendered through the real
component and the real stylesheet. It matters enormously for any other claim,
which is why the header states it per surface.

**AC3 was verified by diffing, not by asserting.** A capture from `HEAD` before
the change against captures after: identical boxes on all five, and `welcome`
(25497), `sidebar` (27222), `chat` (91470) and `input-bar` (14703) byte-identical
across four runs.

**`titlebar.png` was not, and chasing that down is where #142 came from.** The
unmodified driver run three times gives 9084 / 9538 / 9083 — a *wider* spread
than the modified one — so the instability predates this ticket. Cause:
`.session-title` renders `basename(cwd)`, and the fixture workspace is
`mkdtemp`'d, so six random characters change the glyphs while the box and the
text length (43) stay fixed. Filed rather than fixed, because every candidate
repair trades randomness for a collision between concurrent runs, and that is a
decision rather than a detail.

**The obvious way to check the new selectors was wrong, which is worth keeping.**
Grepping `tests/` for `aria-label="Agents"` returns nothing, so the aside labels
look unpinned. Mutating one refuted that immediately: six existing tests red,
because they pin it through `getByRole('complementary', { name: 'Commands' })` —
an accessible-name query pins a label without ever spelling it as an attribute.
So `tests/inspect-docks.test.ts` claims exactly one thing, and it is not that a
label exists: the **driver's** copy of these strings must match the renderer's.
Renaming a dock reds six tests, those get fixed alongside the component, the
suite goes green, and the driver is left holding a name nothing answers to — a
working app, a green gate, and a blind instrument. Red-verified in that
direction: mutating the driver's `open:` string reds this file and leaves all 107
existing dock tests green.

**Both new failure paths were red-verified together**, a renamed toggle and an
empty command list in one run: exit 1, each failure naming its surface and its
reason, `CAPTURED 8/10 files`, and the third dock still captured. `openDock`
reports only the missing-toggle case — the one `capture` cannot describe, since
with no control to click the aside never mounts and `capture` would blame the
dock instead of the titlebar. Every other failure stays in `capture`, so those
sentences keep one home.

## Reversibility

**Reversible, and cheaply.** The docks are three entries in an array plus one
loop; deleting them returns the run to five surfaces and seven files, since
`EXPECTED_FILES` is `SURFACES.length + 2` and no count is written by hand.

The zoom seed is the part that should **not** be reverted casually: removing it
restores a capture set whose Appearance frame prints a percentage contradicting
the window it was taken from. If `zoom-level-v2` is bumped (its own comment says
to bump on the next default change), `tests/inspect-docks.test.ts` reds — that
pin exists precisely because the drift is announced rather than hypothetical.

The commands stub is the one piece with a standing cost: it means this run can
never notice that `commands:list` broke. That was already true — the run has no
engine — but it is now true *silently*, which is why the header says so twice.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — #132, the same lesson one
  layer down: this file's test exists because nothing in the gate runs the driver.
- [[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]] — #131,
  which built the surface set and the loud-failure contract this extends.
