---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 11 (`relay-leg`)_
_At commit: `aa8e683` on `main`, pushed and level with `origin/main`_

## Current focus

**#108 landed and closed — the batch's last spike.** Its two claims came apart in
opposite directions: claim 1's *consequence* is confirmed and witnessed while its
*user path* is closed, and claim 2's hang could not be produced at all. One
remedy filed (**#113**), one half closed on the measurement. Next frontier is
**#109**.

## State

- **In flight:** nothing. Spike squash-merged and the branch deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #108 as `aa8e683` — `scripts/spike-108-turn-lifecycle.mjs`
  and `scripts/spike-108-findings.json`. **No `src/` diff**, as the ticket
  required.
- **Gate:** typecheck clean; **1009 tests across 66 files** green (unchanged — a
  spike adds no app tests); build clean; `git diff --stat -- src/` empty.
- **Queue:** five open, #109 through #113, all `ready-for-agent`; none
  `ready-for-human`. Every one has live `blocked_by` 0.
- **Blocked:** nothing.

## Pick up here

Take **#109** after re-running the frontier query. `switchWorkspace` checks
`isBusy` before an `await`, so a send that lands during the resolve tears down a
live turn. Unlike the last three tickets this one is an ordinary fix, not a
spike — it wants a reproduction first, then a guard, then mutation evidence.

Two things from #108 bear directly on it:

1. **`chat:send` has no busy guard of any kind** — confirmed mechanically. Any
   ticket reasoning about "the app refuses sends while busy" is talking about
   `useChat.send`'s React-state read and nothing else.
2. **After an overlap error the renderer reports idle while main still holds the
   turn.** If #109's work observes `busy` from the renderer, that state is
   reachable and will lie.

## Skills for next session

- `superpowers:test-driven-development` — #109 is a real fix with a reproducible
  premise, so red-green applies.
- `superpowers:verification-before-completion` — the gate is the full
  test/typecheck/build run.

## Open questions

None for #109. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- **Ask the process that holds the fact.** `turnResolve` lives in main, so main's
  own overlap refusal answers "is the turn still live" directly, where rendered
  characters only correlate. Three of this leg's four instrument bugs were the
  same mistake — measuring a proxy for a fact another process owns.
- **A pane that stopped growing is not an idle engine.** Measured 116 → 116
  characters on a turn the engine then refused a send for. Pane growth is sound
  as a positive and worthless as a negative.
- **An idle UI is not an idle engine.** After the overlap error the renderer
  reports idle while main still holds `turnResolve`, which silently corrupted
  later cases in the same harness run until the order was changed.
- **A premise must be re-checked at the moment it matters.** Interrupting a turn
  that had already produced its result gave a latency of **-821ms**. The loud
  version is a negative number; the quiet version is a small positive one that
  reads exactly like a fast interrupt.
- **Ordering beats waiting.** The one case needing a genuinely busy renderer now
  runs first, which removes the dependency instead of managing it.
- `gui-75` and `gui-52` still carry standing environmental reds; `gui-52`'s is
  additionally doubtful since #105 measured the CLI returning 15 models.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-the-composer-is-held-shut-by-a-draft-clear-not-a-guard]]
