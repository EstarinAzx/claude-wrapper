---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 16 (`relay-leg`)_
_At commit: `dadacbe` on `main`, pushed and level with `origin/main`_

## Current focus

**#113 landed and closed.** `chat:send` had no busy check at all, so a second
send under a live turn was answered by `runTurn`'s overlap branch on the
**second** caller's `onEvent` — and the renderer reads every `error` as
turn-terminal, so it stopped calling itself busy while the first turn was still
streaming. Refused in main now, before that closure is ever built. Next frontier
is **#114**, the last open ticket.

## State

- **In flight:** nothing. Squash-merged and the branch deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #113 as `dadacbe` — new `src/main/send-guard.ts`,
  `tests/send-guard.test.ts` and `tests/double-send.test.tsx`, the `chat:send`
  handler rewired in `src/main/index.ts`, `useChat.ts`'s busy writes routed
  through one `markBusy` helper, and `scripts/spike-108-turn-lifecycle.mjs`
  taught the fix in three places.
- **Gate:** typecheck clean; **1044 tests across 70 files** (1034 + 10); build
  clean.
- **Queue:** one open, **#114**, `ready-for-agent`, live `blocked_by` 0; none
  `ready-for-human`.
- **Blocked:** nothing.

## Pick up here

Take **#114** after re-running the frontier query. It is a spike, and the only
ticket left: does closing a live warmed engine and immediately rebuilding it
kill the main process? Filed from an observation during #112's re-run rather
than from reading code — Electron main vanished in **2 of 6** post-fix harness
runs (0 of 2 pre-fix), both at the same iteration's `pickFolder`, with no
exception and no stderr, and did not recur across four later runs including one
of nine iterations that sailed past the same point.

**A third sighting landed this leg, unlooked-for.** One
`SPIKE108_PHASES=AC` run died with `electronApplication.evaluate: Resulting
promise was garbage collected` mid-C1 and passed on re-run. Same shape: no
exception, no stderr, and it did not reproduce. That is a different harness on a
different path, which is worth carrying into #114 — the two observations share
"main went away quietly" and little else, and treating them as the same
phenomenon before measuring is the premise the spike exists to test.

**Its premise may well die under measurement, and that is a success.** Both
mechanism and reachability are open and can fail separately — #108's shape.

## Skills for next session

- `superpowers:verification-before-completion` — a spike's output is findings,
  so the discipline is that every claim names the run it came from.
- **No `src/` diff.** #114 is a spike and must stay one; `git diff --stat --
  src/` empty is part of its gate.

## Open questions

None for #114. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- **A ref synced by an effect is late in BOTH directions.** `busyRef` mirrored
  `busy` from a `useEffect`. Late upward is the whole of #113. Late downward
  broke #80's queued flush — **InputBar's effect runs before App's**, so the ref
  still read `true` when the flush asked, and four `queued-composer` pins caught
  it. Every write now goes through one `markBusy`, which removes the window
  rather than shrinking it.
- **An instrument can be named for the world before the fix.** #108's
  `busyClearedWhileTurnLive` computes `busy went false` and does not measure its
  own name — the poll loop breaks on the turn's ordinary end just as readily as
  on the probe's error, so in a fixed app it is true for the most boring reason
  there is. A verdict keyed on it scored a working guard as a failure. The
  discriminating fact was the **overlap error's absence**, corroborated by the
  retry afterwards being **accepted rather than refused**.
- **Wire the fake to the defect, or the test passes with the guard deleted.**
  The renderer tests only became evidence once the harness answered a second
  send the way main was measured to answer it. Before that, "busy stayed true"
  was true because the fake said nothing at all.
- **A source fact that tracks a spelling reports a rename as a fix** (#113).
  Phase A's `rendererClearsBusyOnError` matched `/setBusy\(false\)/`; renaming to
  `markBusy` would have printed "the renderer no longer clears busy on error".
- **A refusal has to happen before the callback is attached** (#113). `runTurn`
  already rejected a second turn — by calling the second caller's `onEvent`,
  which is the defect. The engine cannot fix this itself.
- Ticket baselines were stale for the seventh consecutive ticket; read the count
  from `main`, not from the ticket.
- `gui-75` and `gui-52` still carry standing environmental reds; reproduce solo
  on clean `main` before treating either as a regression.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-a-ref-synced-by-an-effect-is-late-in-both-directions]]
- [[2026-08-04-the-wait-moved-it-did-not-vanish]]
