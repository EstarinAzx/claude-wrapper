---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 5 (`relay-leg`)_
_At commit: `b9ca7f0` on `main`, pushed and level with `origin/main`_

## Current focus

**#102 landed and closed.** An open subagent viewer now re-reads its disk
transcript when `lastTurn.nonce` changes instead of freezing at its opening
snapshot. Next frontier is **#103**: the composer's slash-popover Escape handler
prevents the default but does not stop propagation, so one key can dismiss both
the popover and viewer.

## State

- **In flight:** nothing. Ticket branch was squash-merged and deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #102 as `b9ca7f0`. `App` passes `lastTurn` to
  `SubagentDrawer`; its existing guarded read effect also keys on the nonce.
- **Gate:** typecheck clean; **988 tests across 64 files** green (+1); build clean.
- **Mutation evidence:** removing `lastTurn?.nonce` left `finished snapshot`
  absent. The restored dependency passed. An ordinary `text-delta` leaves
  `subagentTranscript` at one call.
- **Queue:** eight open, #103 through #110, all `ready-for-agent`; none
  `ready-for-human`. Live blocker count for #103 is 0.
- **Blocked:** nothing.

## Pick up here

Take **#103** after re-running the frontier query. Read the whole ticket. Measure
its post-#99 reachability in-run: open the slash popover, mouse-open the viewer,
then press Escape and record whether both still dismiss.

TDD the one-line production fix in `InputBar.tsx`: while a popover is open,
Escape dismisses it and calls `stopPropagation()`. Pin both surfaces positively
and prove Escape with no popover still reaches the existing outer handler. Do
not change `SubagentDrawer`, `Sidebar`, or surrounding key handling.

## Skills for next session

- `superpowers:test-driven-development` — add both Escape propagation pins red
  before the one-line production change.
- `run` — drive the built app for ticket-required reachability measurement.
- `superpowers:verification-before-completion` — full test/typecheck/build gate
  before landing.

## Open questions

None for #103. `ready-for-human` remains forbidden while owner is AFK.

## Recent context

- The first #102 test passed vacuously: its first `turn-end` also moved
  `activeSessionId` from null to `sess-1`, already rerunning the effect. The real
  pin establishes turn one before opening and tests turn two.
- #102 preserved the existing effect cleanup flag, so a late previous read
  cannot overwrite the newer transcript.
- No durable decision was appended; #102 extends the established `LastTurn`
  trigger without changing its contract.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
