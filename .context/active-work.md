---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 15 (`relay-leg`)_
_At commit: `e05f400` on `main`, pushed and level with `origin/main`_

## Current focus

**#112 landed and closed.** Three writers discarded the engine and rebuilt
nothing while `commands:list` and `model:list` read straight off that handle, so
both went empty and stayed empty until the next send. Rebuilt **lazily at the two
read handlers** through a new `src/main/list-engine.ts`; `discardEngine` and all
three writers are untouched. Next frontier is **#113**.

## State

- **In flight:** nothing. Squash-merged and the branch deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #112 as `e05f400` — new `src/main/list-engine.ts` and
  `tests/list-engine.test.ts`, two read handlers rewired in `src/main/index.ts`,
  and `scripts/spike-105-model-pick-channels.mjs` taught the read side. Also
  filed **#114**, a spike, from that harness re-run.
- **Gate:** typecheck clean; **1034 tests across 68 files** (1026 + 8); build
  clean.
- **Queue:** two open, **#113** and **#114**, both `ready-for-agent`, both with
  live `blocked_by` 0; none `ready-for-human`.
- **Blocked:** nothing.

## Pick up here

Take **#113** after re-running the frontier query. It is what #108 measured and
declined to build: a second `chat:send` under a live turn tells the renderer the
turn ended — 518ms, with main still holding `turnResolve` — while `chat:send`
itself carries no busy check at all and the realistic case is refused only by the
**emptied draft**, a UI convenience standing in for a guard.

**#114 is the newer and the odder one, and it is not urgent.** A spike asking
whether closing a live warmed engine and immediately rebuilding it can kill the
main process. Filed from an observation, not from reading code: Electron main
vanished in **2 of 6** post-fix harness runs (0 of 2 pre-fix), both times at the
same iteration's `pickFolder`, with **no exception and no stderr**, and did not
recur across four later runs including one of nine iterations that sailed past
the same point. Its premise may well die under measurement, which is a success.

## Skills for next session

- `superpowers:test-driven-development` — #113's premise is measured and
  reproducible, so red-green applies.
- `superpowers:verification-before-completion` — the gate is the full
  test/typecheck/build run.

## Open questions

None for #113. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- **A fix can move a cost instead of removing one.** #112's first list read after
  a pill click went from **0–1ms and wrong** to a **median ~5.5s and right**
  (1ms on a live engine). The wait moved off the click and onto the menu open, and
  off every user onto the one who opens a menu — the trade the ticket chose, but a
  reader of the diff alone would see a bug removed and no cost at all. Nearly all
  of it is `supportedCommands`, not query construction.
- **A spike harness must be taught the fix, or it reports the fix as its own
  failure.** Phase B only read the writers, so a correctly fixed app printed
  `PREMISE: NOT CONFIRMED` — indistinguishable from a spike that measured nothing.
  It now reads the READ handlers too and names which state it is in.
- **A green suite is evidence about the code only if the runner is sound.**
  `npm test` died mid-leg with `SyntaxError: Unexpected token ')'` and no file
  name; the cause was one flipped byte in `node_modules/@vitest/mocker`. What
  separated "my change" from "this machine" in a minute was
  `git stash push -u && npm test` on the clean tree. Reproducing the **recorded**
  baseline (1026/67) afterwards is what proved the repair.
- **The before/after was re-measured here, not compared to a committed artifact.**
  The pre-fix build was stashed, rebuilt and re-run minutes before the post-fix
  one, so both share a machine, a CLI and an hour.
- **Prefer a demonstration to a citation.** The no-cache contract was proven by
  the backend flip answering **15 → 5** — the smaller, mode-aware list — rather
  than by quoting the handler's comment.
- Ticket baselines were stale for the sixth consecutive ticket; read the count
  from `main`, not from the ticket.
- `gui-75` and `gui-52` still carry standing environmental reds; reproduce solo on
  clean `main` before treating either as a regression.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-the-wait-moved-it-did-not-vanish]]
- [[2026-08-04-a-green-suite-does-not-prove-a-sound-toolchain]]
