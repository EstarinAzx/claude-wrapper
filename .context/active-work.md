---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 13 (`relay-leg`)_
_At commit: `86bab34` on `main`, pushed and level with `origin/main`_

## Current focus

**#110 landed and closed.** The window's bounds report was debounced 250ms and
the `closed` handler cancelled the pending timer, so any move or resize inside
that window was discarded and the next launch came back at the previous
position. Fixed by flushing on **`close`** (not `closed` — by then the
`webContents` is gone), with the debounce extracted to
`src/main/bounds-reporter.ts` so a test can reach it. Next frontier is **#111**.

## State

- **In flight:** nothing. Squash-merged and the branch deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #110 as `86bab34` — new `src/main/bounds-reporter.ts`,
  13 tests in `tests/bounds-reporter.test.ts`, `index.ts` wiring reduced to four
  listeners, and a new GUI driver pair (`gui-110.mjs` + `gui-110-probe.cjs`).
- **Gate:** typecheck clean; **1024 tests across 67 files** green (1011 + 13);
  build clean; `gui-110` PASS (and red-verified against `main` first).
- **Queue:** three open, #111 through #113, all `ready-for-agent`; none
  `ready-for-human`. Every one has live `blocked_by` 0.
- **Blocked:** nothing.

## Pick up here

Take **#111** after re-running the frontier query. `drainSubagents()` in
`engine.ts`'s `close()` is gated on `if (turnResolve)`, so an engine torn down
**between** turns strands an open subagent row on "running…" forever — and the
CLI process is gone, so #104's `onSubagent` terminal edge can never arrive
either. The remedy is to move the drain above that block, matching
`onBackgroundTasks([])` one line up, which is already unconditional for exactly
this reason.

It is an ordinary fix with a reproducible premise, so reproduce, then guard, then
mutation-verify. The ticket names the check that stops it being a one-liner:
prove an unconditional call cannot double-emit when a turn **is** in flight
(`drainSubagents` clears the set, so the second call should be a no-op — assert
it), and keep the existing `'a closed query drains a still-running agent'` test
green **untouched**.

## Skills for next session

- `superpowers:test-driven-development` — #111 is a real fix with a reproducible
  premise, so red-green applies.
- `superpowers:verification-before-completion` — the gate is the full
  test/typecheck/build run.

## Open questions

None for #111. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- **A message that is never sent leaves no artifact**, so a state-shaped test
  cannot see it. #110 survived #79's own exhaustive GUI driver for exactly that
  reason. Where the defect is a missing send, assert on the port.
- **A remedy that crosses a process boundary needs a witness on each side.**
  Flushing on `close` puts the message in flight during teardown, and
  `window-all-closed` quits the app — so main's send and the renderer's write
  are two facts owned by two processes. `gui-110` reports them apart. Measured:
  the race does not eat the write, but a single pass/fail could not have said so.
- **A "before" run needs a positive control**, or "the old value is still there"
  is trivially true. `gui-110`'s launch 1 proves the ordinary debounced store
  works before launch 2 concludes anything from storage not changing.
- **An instrument must refuse runs that missed the window.** `gui-110` fails
  loudly if the debounce fired before the close, rather than scoring that run as
  either a reproduction or a fix.
- **Second consecutive leg where a comment claimed more than the code did.**
  #109's was true of the ordering and read as the guarantee; #110's was simply
  false ("short enough that closing the window straight after moving it still
  stores the new position"). Both corrected in the same change as the fix.
- A deliberately-unused interface member can be the thing that makes a test able
  to fail — `ReportableWindow.getBounds` exists so choosing the wrong read is
  expressible.
- `gui-75` and `gui-52` still carry standing environmental reds; `gui-52`'s is
  additionally doubtful since #105 measured the CLI returning 15 models.
- Ticket baselines remain stale: #111 says 995/64, `main` is now at **1024/67**.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-a-scheduled-report-is-not-a-sent-one]]
