---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 14 (`relay-leg`)_
_At commit: `d572bb4` on `main`, pushed and level with `origin/main`_

## Current focus

**#111 landed and closed.** `close()` gated `drainSubagents()` on `turnResolve`,
so an engine torn down **between** turns left every open subagent pulsing
"running…" forever — and the CLI process is gone by then, so #104's `onSubagent`
terminal edge could never arrive either. The drain moved above the block to match
`onBackgroundTasks([])` one line up, which was already unconditional for exactly
the same reason. Next frontier is **#112**.

## State

- **In flight:** nothing. Squash-merged and the branch deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #111 as `d572bb4` — one moved line in
  `src/main/engine.ts`, a corrected `drainSubagents` docstring, and 2 tests in
  `tests/engine.test.ts`. No new file, no new port, no GUI driver.
- **Gate:** typecheck clean; **1026 tests across 67 files** green (1024 + 2);
  build clean.
- **Queue:** two open, #112 and #113, both `ready-for-agent`; none
  `ready-for-human`. Both have live `blocked_by` 0.
- **Blocked:** nothing.

## Pick up here

Take **#112** after re-running the frontier query. It is the remedy #105 priced
and declined to build: picking a model, flipping permission or flipping backend
nulls the query handle, and both live read channels answer `[]` until the next
send — measured **15 → 0 models and 119 → 0 commands across 6/6 warmed runs** of
the built app driven over its own IPC. The emptiness was **attributed** rather
than observed, by an OS-level witness (the SDK's query is a child process of
main, seen still alive while the app answered `[]`), and the remedy was priced at
a **median 1539ms per pill click**.

Two things that bind before writing code:

- **`gui-52`'s standing red is DOUBTFUL and chasing it is out of scope** — #105
  measured the CLI itself returning 15 models and 119 commands here, which kills
  the "the CLI has no models" confound at the source. It is already named in
  #112's out-of-scope list.
- **`scripts/spike-105-model-pick-channels.mjs` is this ticket's end-to-end
  evidence.** Re-run it after the fix: its phase-C AFTER counts turning non-zero
  is what closes the loop, and phase B asserts `src/main/index.ts`'s handler
  bodies mechanically, so it fails loudly if the code moved underneath it.

## Skills for next session

- `superpowers:test-driven-development` — #112 has a reproducible premise that
  was already measured, so red-green applies.
- `superpowers:verification-before-completion` — the gate is the full
  test/typecheck/build run.

## Open questions

None for #112. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- **A gate can be a comment's belief, compiled.** #111's `if (turnResolve)` was
  exactly the code its own docstring implied ("only called on the failure paths";
  "a successful turn has already drained them"). Both halves were falsified by
  #104 landing afterwards. Fourth consecutive leg where a comment claimed more
  than the code delivered, and the first where the comment **caused** the defect
  rather than overstating a correct one — an overclaiming comment is found by
  testing the code, but a justifying one has to be re-derived against its
  dependencies, because the code agrees with it perfectly.
- **A passing mutation proves the code, not the test.** The ticket's own
  "check before assuming it is a one-liner" (an unconditional drain must not
  double-emit mid-turn) came back GREEN — genuinely robust, and evidence about
  the *test* only after a **compound** mutation that also dropped
  `subagentParents.clear()` reddened it. When a mutation survives, the next move
  is a compound mutation removing the reason it survived.
- **Ticket baselines are stale for the fifth consecutive ticket** — #111 said
  995/64, `main` was at 1024/67 and is now **1026/67**. #112's own baseline will
  be stale too; read it from `main`, not from the ticket.
- `gui-75` and `gui-52` still carry standing environmental reds; reproduce solo
  on clean `main` before treating either as a regression.
- Ports keep earning their keep: this is the third defect in four legs whose only
  possible witness was an injected port rather than any readable state.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-the-gate-was-the-comments-belief-compiled]]
