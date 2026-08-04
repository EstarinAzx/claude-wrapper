---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 10 (`relay-leg`)_
_At commit: `7e62f9e` on `main`, pushed and level with `origin/main`_

## Current focus

**#107 landed and closed — the batch's only data-loss defect is gone.** The rail
could delete the session a turn was streaming into, during that session's first
turn, unlinking a `.jsonl` the CLI was still appending to. The busy refusal now
lives in main, the only process holding the in-flight id at that moment. Next
frontier is **#108**, the batch's remaining spike.

## State

- **In flight:** nothing. Ticket branch squash-merged and deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #107 as `7e62f9e` — new `src/main/delete-guard.ts`,
  plus `src/main/index.ts` and `src/renderer/src/App.tsx`; two new test files,
  eleven tests.
- **Gate:** typecheck clean; **1009 tests across 66 files** green (998 + 11);
  build clean.
- **Queue:** five open, #108 through #112, all `ready-for-agent`; none
  `ready-for-human`. Every one has live `blocked_by` 0.
- **Blocked:** nothing.

## Pick up here

Take **#108** after re-running the frontier query. It is a **SPIKE** and must
stay one: harness in `scripts/`, scrubbed findings JSON beside it, a ticket
comment stating reachability per claim, and **no `src/` diff**. Two mechanisms
are confirmed by reading and neither's reachability is established:

1. **The overlap rejection clears busy on a live turn.** `engine.ts`'s
   `if (turnResolve !== null)` emits an `error` to the *second* caller's
   `onEvent`, and the renderer treats every `error` as turn-terminal
   (`setBusy(false)`) while the first turn still holds `turnResolve`. `chat:send`
   has no busy guard. Open because `useChat.send` guards on `busy` — React state,
   so a true double-submit in one render tick reads `false` twice — and #80's
   queue may already close it. **Instrument main to count sends; never infer from
   the UI.**
2. **Stop has no local completion path.** `interrupt()` sets a flag and calls
   `currentQuery?.interrupt?.().catch(() => {})`; the turn completes locally only
   when a `result` arrives. If the CLI never sends one, `turnResolve` never
   resolves and the UI is stuck busy. Drive Stop against a turn — including
   mid-tool-call — and record whether `result` always follows, and how long.

Killing either premise is a successful outcome; this tracker has three
precedents (#78, #84, #105).

## Skills for next session

- `superpowers:verification-before-completion` — the spike's gate is the same
  full test/typecheck/build run, plus `git diff --stat -- src/` coming back
  empty.
- No TDD skill: a spike writes a harness, not app code.

## Open questions

None for #108; the ticket states both claims, both landmines and the two
remedies it forbids pre-empting. `ready-for-human` remains forbidden while the
owner is AFK.

## Recent context

- **A guard has to live where its fact lives.** #107's refusal sat with the
  *control* (the rail's trash button) rather than with the *information* (the
  in-flight session id, which only main has during turn 1). That is the
  intuitive placement and it is what created the bug.
- **"Two sources could only disagree" assumes both hold the same fact.** The
  `index.ts` comment declining a busy check was sound reasoning from a premise
  that was true everywhere except the window that mattered. It was rewritten,
  not deleted — the next reader would otherwise re-derive it.
- **The renderer's null outlives the busy window.** `turn-aborted` and `error`
  clear `busy` without reading the session id back from main; only `turn-end`
  and engine-terminal do. Any renderer logic keyed on `activeSessionId` should
  check whether those two branches reach it.
- **A mocked refusal asserts the harness.** #107's renderer tests bind the real
  `guardedDelete` behind the IPC, because a `deleteSession` mock returning
  `'failed'` passes with the guard deleted.
- **Assert what was REACHED, not only what was returned.** A delete guard
  answering `'failed'` after unlinking satisfies every status-only test.
- Premise reproduced before the fix for the fifth consecutive leg. #108's
  premises are reachability claims, so the harness *is* the reproduction.
- `gui-75` and `gui-52` still carry standing environmental reds; `gui-52`'s is
  additionally **doubtful** since #105 measured the CLI returning 15 models.
  Reproduce solo on clean `main` before treating either as a regression.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-a-refusal-belongs-where-the-fact-lives]]
