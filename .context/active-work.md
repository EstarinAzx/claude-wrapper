---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 12 (`relay-leg`)_
_At commit: `74cbecf` on `main`, pushed and level with `origin/main`_

## Current focus

**#109 landed and closed — the batch's first ordinary fix after three spikes.**
`switchWorkspace` read `isBusy()` before an await and mutated after it, so a turn
starting in the gap was torn down while the switch reported `ok`. Fixed by one
extra read. The premise reproduced, and the measurement **narrowed** the ticket's
reachability story while **widening** its ordinariness — see below. Next frontier
is **#110**.

## State

- **In flight:** nothing. Squash-merged and the branch deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #109 as `74cbecf` — one statement plus two comments in
  `src/main/switch-workspace.ts`, two tests in `tests/switch-workspace.test.ts`.
- **Gate:** typecheck clean; **1011 tests across 66 files** green (1009 + 2);
  build clean.
- **Queue:** four open, #110 through #113, all `ready-for-agent`; none
  `ready-for-human`. Every one has live `blocked_by` 0.
- **Blocked:** nothing.

## Pick up here

Take **#110** after re-running the frontier query. The window's last move or
resize is dropped if you close inside the 250ms debounce. Like #109 it is an
ordinary fix, so reproduce the premise, then guard, then mutation-verify.

Note that #110 lands in the launch/bounds path #79 built, which carries its own
standing constraints (`bounds:set` must release the show gate on a `null` or
invalid payload, and main reports bounds with `getNormalBounds()` so maximising
never overwrites the remembered size). Read those in [[overview]] before editing.

## Skills for next session

- `superpowers:test-driven-development` — #110 is a real fix with a reproducible
  premise, so red-green applies.
- `superpowers:verification-before-completion` — the gate is the full
  test/typecheck/build run.

## Open questions

None for #110. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- **Ordering a check before a mutation is necessary and not sufficient.** If an
  `await` separates them, the answer must be re-read on the far side.
  `switchWorkspace`'s comment claimed the ordering and was read as claiming the
  guarantee; the ordering was correct the whole time.
- **A feature that keeps a list honest can be what opens a race.** The switch's
  resolve is slow *only* because `session:list` calls `resetSessionIndex()` — and
  that same listing renders the row the user clicks. Measured 18.2ms cold vs
  **0.0ms warm**: with a warm index there would be no window at all.
- **Measure the window, not just the mechanism.** The mechanism was confirmed by
  reading; the 18ms number is what says the plain two-user-actions story does not
  reach it, and what stopped this leg from writing a reachability claim it had
  not earned.
- **A "tear down, then report busy" mutation passes a status assertion.** Only
  the port-by-port no-mutation assertions catch it. Any future guard whose
  contract is "a rejection is a no-op" needs the same shape of test.
- `chat:send` still carries **no busy guard of any kind** — that is #113, not
  something #109 touched.
- `gui-75` and `gui-52` still carry standing environmental reds; `gui-52`'s is
  additionally doubtful since #105 measured the CLI returning 15 models.
- Ticket baselines remain stale: they say 979/64, `main` is now at **1011/66**.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]]
