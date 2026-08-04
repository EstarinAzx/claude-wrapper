---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #113, `dadacbe`

`chat:send` carried **no busy check at all**, so a second send under a live turn
reached `runTurn`'s overlap branch, which answers on the **second** caller's
`onEvent` — a fresh closure in `index.ts` forwarding to the same renderer, which
treats every `error` as turn-terminal. The engine's own refusal was delivered as
"your turn ended": 518ms, first turn still streaming, send slot back to "Send".

Refused now in `src/main/send-guard.ts`, **before the call site builds that
closure**, on `delete-guard.ts`'s precedent. The orphan-bubble wrinkle is
answered by never creating one: `useChat.send` declines to issue a second commit
at all. That forced every write to `busy` through one `markBusy` helper — see the
landmine below, it is the most transferable thing in this leg.

Gate green: typecheck clean, **1044 tests / 70 files** (1034 + 10), build clean.

## Frontier: ONE OPEN — #114, the last ticket

Live `blocked_by` is 0. Run the query anyway — it is the authority over this
table, and this line has been wrong before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **114** | **spike** — does closing a live warmed engine and rebuilding it kill main? | — |

**When #114 closes the queue is empty.** At that point: rewrite this file to
"queue empty", commit `.context/` on main, signal the relay stop, spawn nothing.

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #114 is, and what it is not

A spike, filed from an observation during #112's re-run, **not** from reading
code: Electron's main process vanished in **2 of 6** post-fix harness runs
(**0 of 2** pre-fix), both times at the sixth iteration's `pickFolder`, with no
exception and no stderr beyond SDK warnings, and every completed measurement
correct. It did **not** recur across the four later runs, one of which did
**nine** iterations and sailed straight past that point — which kills
"cumulative engine builds" as the explanation.

The structural difference #112 introduced is real: `pickFolder` now closes a
**live, warmed, never-run** query and constructs another in the same tick, every
time, where before the writer had already torn it down.

**A third sighting arrived this leg, on a different harness.** One
`SPIKE108_PHASES=AC` run died with `electronApplication.evaluate: Resulting
promise was garbage collected` mid-C1 and passed on re-run — no exception, no
stderr, no reproduction. Carry it as an observation, not as a confirmation:
"main went away quietly" is all the two share, and folding them together before
measuring is exactly the premise this spike exists to test.

**It is a SPIKE and must stay one** — harness, findings, recommendation, **no
`src/` diff** (`git diff --stat -- src/` empty is part of its gate). Its premise
may well die under measurement, and that is a success.

## Still-live batch landmines

- **A ref synced by an effect is late in BOTH directions** (#113). `busyRef`
  mirrored `busy` from a `useEffect`. Late upward is #113's whole defect. Late
  downward broke #80's queued flush — **a child's effects run before its
  parent's**, so InputBar asked while App's ref still read `true`. Every write
  now goes through one `markBusy`. **A mirror maintained by an effect is a
  mirror plus a window**; anything that reads inside the window disagrees exactly
  when it matters.
- **An instrument can be named for the world before the fix** (#113).
  `busyClearedWhileTurnLive` computes `busy went false` and nothing more — in a
  fixed app it is true because the turn ended. A verdict keyed on it scored a
  working guard as a failure. Read it beside `turnStillLiveAfterClear`, never
  alone.
- **Wire the fake to the defect, or the test passes with the guard deleted**
  (#113). The renderer tests only became evidence once the harness answered a
  second send the way main was *measured* to answer it.
- **A source fact that tracks a spelling reports a rename as a fix** (#113).
- **A fix can move a cost instead of removing one** (#112). The first list read
  after a pill click is now a **median ~5.5s** where it was 0–1ms and wrong. A
  third consumer of a list read inherits that wait.
- **A spike harness must be taught the fix, or it reports the fix as its own
  failure** (#112). Applied three times this leg.
- **A green suite is evidence about the code only if the runner is sound**
  (#112's leg). `git stash push -u && npm test` on the clean tree separates "my
  change" from "this machine" in a minute; do that FIRST.
- **Prefer a demonstration to a citation** (#112).
- **A gate can be a comment's belief, compiled** (#111).
- **A passing mutation proves the code, not the test** (#111). When a mutation
  survives, the next move is a **compound** mutation removing the reason it did.
- **A message that is never SENT leaves no artifact** (#110) — assert on the port.
- **A "before" run needs a positive control** (#110), or "nothing changed" is
  trivially true; and an instrument should **refuse** runs that missed the window.
- **Ordering a check before a mutation is necessary and not sufficient** (#109).
- **A "tear down, then report X" mutation passes a status-only assertion** (#109,
  #113). Assert port by port that nothing was reached.
- **Ask the process that holds the fact** (#108).
- **An empty list is ATTRIBUTED, not observed** (#105).
- **`gui-52`'s red is DOUBTFUL** — #105 measured the CLI returning 15 models /
  119 commands, and #112's phase A reconfirmed it twice.
- `gui-75` still has a standing environmental red (focus-dependent); reproduce
  solo before treating it as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **A single sample cannot measure an asynchronous event** (#104, #105).
- Ticket baselines are stale for the seventh consecutive ticket: read the count
  from `main`, which is at **1044/70**.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `dadacbe`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **1044 tests / 70 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-a-ref-synced-by-an-effect-is-late-in-both-directions]]
- [[2026-08-04-the-composer-is-held-shut-by-a-draft-clear-not-a-guard]]
- `.claude/vibe.md` — run that filed #98–#110
