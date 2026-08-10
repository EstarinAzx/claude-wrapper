---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, testing, gui-drivers, instruments]
---

# The noise floor is part of the instrument

## Decision

**#137 (`b35e799`).** `inspect.mjs` captures `welcome-min-window.png` — the
`.welcome` pane at the window's enforced minimum — between the standard Welcome
frames and the folder pick. Strictly after the standard captures, so those keep
the standard size; strictly before the pick, because `.welcome` stops existing
the moment a workspace opens and no later point in the run can reach it.

**The size is asked for, not written down.** The driver reads
`getMinimumSize()` off the window rather than restating `minWidth`/`minHeight`
from `src/main/index.ts`. `tests/inspect-welcome-min.test.ts` holds that shape
by asserting the driver does not contain either literal, which caught two of my
own comments during the build.

**The claim under test now executes.** The `.welcome` comment in `chat.css`
argues a height budget — content plus padding against the pane the shortest
permitted window leaves — and nothing had ever photographed it. It is restated
in the driver as `CLAIMED_HEADROOM_PX = 65`, and a disagreement beyond 1px fails
the run. Measured: **64.98 against 65, drift -0.02px**, reproduced across three
runs, with `scrollHeight` equal to `clientHeight` and the hero 32.5px clear of
the content box top and bottom. The arithmetic was right. It had simply never
been checked by anything that could fail.

## Why

**The ticket's AC2 demanded every other surface be byte-identical, and that
could not be established without first measuring what the instrument does when
nothing changes.** So the baseline was run **twice** before a line was written.
Three of ten files already differed between two runs of the *unmodified*
driver — not the one `#142` names.

**Two instabilities were superimposed, and they were separated by removing a
cause rather than by reasoning about one.** A deterministic copy of the
unmodified driver (fixed `SID`, fixed workspace path in place of `mkdtemp`) was
run twice: `titlebar.png` went byte-identical, which **confirms #142's
mechanism**; `sidebar.png` still moved, which proves a second, independent
source. No amount of argument from the first cause would have found the second,
and the tempting move — "titlebar is known-unstable, so this whole family is
#142" — would have filed the second cause under the first and lost it.

**The second cause is that the rail is not fixture-driven, though the
instrument's own header says the whole thing is.** Dumping `aside.sidebar`'s
`innerHTML` across two runs: **100 session rows, 99 of them
`session-row-btn-foreign`** — real sessions from the machine that ran the
instrument, one row being the fixture — and the entire diff is four
`.session-row-meta` spans ticking `8m`→`9m`, `19m`→`20m`, `49m`→`50m`,
`1h`→`2h`. **Same character length**, which is exactly why the driver's existing
`textLength` guard reported 7524 in every run and saw nothing. Filed as **#148**,
which is a leak as much as an instability: those captures carry real session
titles and an absolute path into `.gauntlet/bar/` for a cross-model critic to
read.

**Three candidate explanations were killed by measurement, not by argument.**
Shot twice 2.5s apart inside one run the sidebar is byte-identical, so it is not
a settling race; `getComputedStyle(...).animationName` is `none` on every
descendant, so it is not the `subagent-pulse` infinite animation that `rails.css`
does contain; `scrollTop` is 0 in both runs, so it is not a scroll offset. Each
of those was the obvious answer at some point in the hour.

**Result: 8 of the 10 other captures are byte-identical with the fixture pinned,
`titlebar.png` included; 2 are excluded with a measured cause that predates this
change.** Against the unpinned baseline it is 7 of 10. That is a weaker claim
than AC2 asked for and a much stronger one than "they were already flaky", and
the difference between those two sentences is entirely the baseline runs.

**No capture was adjusted to green a hash.**

## The correction that generalises furthest

The DOM phase reported **exit status 0 while its own text said `DOM PHASE
FAIL`** — with **no pipe involved**. The command ended in `; echo`, and the
shell reports the last command's status.

The rule recorded after leg 5 was *"do not pipe the phase through `tail`"*.
That is narrower than the defect. **Any trailing command replaces the status**,
including the `echo` you added to print it. Read `$?` on its own line, or check
the redirected file. The phase exits 1 correctly and always did.

## Reversibility

**Reversible.** Reverting `b35e799` removes one capture, one surface entry, one
constant and one test file; `EXPECTED_FILES` is derived (`SURFACES.length + 2`)
so no count needs unwinding.

The part that is **not** free to reverse is `CLAIMED_HEADROOM_PX`. It is a copy
of a number argued in prose, and copies drift. Moving it to match a future
measurement without also moving the sum in `chat.css` converts a check into a
rubber stamp, which is worse than not having it — the driver's comment says so
at the declaration.

The resize is borrowed state and the restore sits in a `finally` whose own
failure is caught rather than allowed to replace the exception it runs alongside.
That is a promise, not a guarantee: it does not run if the process dies. The
real fix is the private `--user-data-dir` that **#147** covers, and this capture
is now another reason to want it.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]] — the
  direct predecessor. That one says a driver's neighbours are part of what you
  are measuring; this one says the instrument's **own variance** is too, and
  both were found by running the withheld case rather than by reasoning.
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — same shape one level in:
  there an assertion existed and nothing executed it, here a sum existed and
  nothing measured it.
- [[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]] — an
  instrument's threshold is a measurement, not a constant. The noise floor is
  the same claim about its baseline.
