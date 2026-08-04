---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 17 (`relay-leg`)_
_At commit: `acaaa3a` on `main`, pushed and level with `origin/main`_

## Current focus

**None — the tracker queue is EMPTY.** #114 landed and closed as the batch's last
ticket; `gh issue list --state open` returns **zero issues at all**, none blocked
and none `ready-for-human`. The relay chain is stopped, not paused.

#114 was a spike and its verdict is **NOT REPRODUCED**: closing a live, warmed,
never-run engine and constructing another in the same tick killed no host process
in **76 scored pairs**. No `src/` diff.

## State

- **In flight:** nothing. Squash-merged, branch deleted, main pushed.
- **Done this session:** #114 as `acaaa3a` — `scripts/spike-114-engine-rebuild.mjs`
  (three phases: source+SDK facts, a bare-Node pair loop in an uninstrumented
  child process, and the built app over its own IPC) plus
  `scripts/spike-114-findings.json`. Nothing under `src/` was touched, which is
  part of a spike's gate here.
- **Gate:** typecheck clean; **1044 tests across 70 files** (unchanged); build
  clean; `git diff --stat -- src/` empty.
- **Queue:** empty.
- **Blocked:** nothing.

## Pick up here

There is no next ticket. A fresh session should **not** hunt for one — run
`gh issue list --state open` to confirm the queue is still empty, then wait for
the owner to file work.

**One candidate is already written up and deliberately not filed:** #114 measured
`engine.warmUp()` blocking the calling thread for **~1.2s of straight-line time**,
attributed to the SDK's `query()` constructor spawning the CLI inline (**1163ms
and 1168ms** with the engine removed entirely). In the app that thread is
Electron's main process, and it freezes on every `session:pick-folder` and every
lazy list rebuild #112 introduced. It is real and reproducible on every run, but
it is an **SDK cost** — the remedy is a deferred spawn or an off-thread warm-up,
not a change to `engine.ts` — and filing it is a scoping call the owner has not
made.

## Skills for next session

None pending. `superpowers:verification-before-completion` remains the right
discipline for any future spike: every claim names the run it came from.

## Open questions

None. `ready-for-human` was forbidden for this whole batch while the owner was
AFK, and no ticket ever needed it — nothing is parked behind that rule.

## Recent context

- **A lost target is not a dead process.** Playwright's `Target page, context or
  browser has been closed` reports *its own connection*, and is equally true of a
  dead main, a dead renderer, and a main merely wedged — which this exact path
  does for over a second at a stretch. `spike-105`'s death report printed the exit
  code to the console and never wrote it to its findings, so the record cannot say
  which the original sighting was. `spike-114` asks main directly for its own pid
  on any failure and separates `REPRODUCED` from `DRIVER ARTEFACT`.
- **`close()` does not kill the CLI child.** It ends stdin and defers any kill by
  2000ms, then a further 5000ms on win32 before `SIGKILL`. Measured consequence:
  the app runs with **two overlapping CLI children** for a second or two after
  every pick. Not a crash mechanism, but nobody had written it down.
- **A source fact must be readable as a snippet, not just a boolean.** Phase A
  records the text each fact matched, so a rename shows up as changed text rather
  than as a silent `false` — #113's landmine applied to a new harness.
- **An instrument that fails setup will report the failure as the phenomenon**
  unless the verdict keys on having scored something first. Caught three times in
  one leg: a failed bundle, a teardown read as a death, and a cleanup EBUSY.
- **This CLI emits no `init` during warm-up** — only `hook_started`/`hook_response`
  across 20s — despite `engine.ts`'s comment saying the first model report arrives
  then. Any future gate on "the engine is live" should use `listModels()`
  answering non-empty, which is the control protocol responding.
- `gui-75` and `gui-52` still carry standing environmental reds; reproduce solo on
  clean `main` before treating either as a regression.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-a-lost-target-is-not-a-dead-process]]
- [[2026-08-04-the-wait-moved-it-did-not-vanish]]
