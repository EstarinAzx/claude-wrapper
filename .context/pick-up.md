---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## QUEUE EMPTY — the batch is drained and the relay is stopped

`gh issue list --state open` returns **zero issues**. Nothing open, nothing
blocked, nothing `ready-for-human`, no leftovers. The relay chain
(`.claude/relay/relay-leg.md`) is stopped at leg 17 and spawned no successor.

Run the query anyway — it is the authority over this file, and this line has
been wrong before (leg 5 wrote that the queue would be empty and #71 was
unblocked the whole time, merely outside the batch).

```text
gh issue list --state open
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

If it returns a ticket, work it and restart the relay with
`/relay N=1 read and follow .claude/relay-leg.md`. If it returns nothing, there
is no work to pick up; wait for the owner to file some.

## Landed this leg (2026-08-04) — #114, `acaaa3a`

A spike, and the last ticket of the #98–#114 batch. **NOT REPRODUCED**: closing
a live, warmed, never-run engine and constructing another in the same tick killed
no host process in **76 scored pairs** — 52 in bare Node, 24 in the built app
over `session:pick-folder`, across three runs. No `src/` diff, which is part of a
spike's gate here.

Two of the ticket's three questions were answered by **moving** the question:

- **`close()` never kills the CLI child.** It ends stdin and defers any kill by
  2000ms, then 5000ms more on win32 before `SIGKILL`. So the "same tick" contains
  no kill at all. Measured: the app runs with **two overlapping CLI children** for
  a second or two after every pick.
- **The pair costs a stall, not a death.** `close()` 0ms, `makeEngine()` 0ms,
  `warmUp()` **~1.2s of straight-line blocking**, attributed to the SDK's
  `query()` constructor (1163ms and 1168ms with the engine removed).

Gate green: typecheck clean, **1044 tests / 70 files** (unchanged), build clean.

## The one thing written up and deliberately NOT filed

The ~1.2s main-thread stall above. Real, reproducible on every run, and unrelated
to the crash question — but it is an **SDK cost**, so the remedy is a deferred
spawn or an off-thread warm-up rather than an `engine.ts` change. Filing it is a
scoping call the owner has not made, and the AFK grant is spent with the batch.

## Still-live landmines

- **A lost target is not a dead process** (#114). Playwright's `Target page,
  context or browser has been closed` reports its own connection. Any future
  harness reporting an app death must **write the exit code into its committed
  findings**, not print it — `spike-105` printed it, and the record therefore
  cannot say what the sighting behind #114 actually was.
- **This CLI emits no `init` during warm-up** (#114) — only `hook_started` /
  `hook_response` across 20s, despite `engine.ts`'s comment. Gate "the engine is
  live" on `listModels()` answering non-empty.
- **An instrument that fails its own setup will report that as the phenomenon**
  (#114, three times in one leg) unless the verdict requires a scored observation
  first.
- **A ref synced by an effect is late in BOTH directions** (#113); every write to
  `busy` goes through one `markBusy`.
- **An instrument can be named for the world before the fix** (#113). Read
  `busyClearedWhileTurnLive` beside `turnStillLiveAfterClear`, never alone.
- **Wire the fake to the defect, or the test passes with the guard deleted**
  (#113). **A source fact that tracks a spelling reports a rename as a fix** (#113).
- **A fix can move a cost instead of removing one** (#112). The first list read
  after a pill click is a **median ~5.5s**; #114 measured the whole pick-plus-read
  round trip at a median 6.2s and found ~1.2s of it is main blocking.
- **A spike harness must be taught the fix, or it reports the fix as its own
  failure** (#112). **A green suite is evidence about the code only if the runner
  is sound** (#112's leg) — `git stash push -u && npm test` first.
- **A gate can be a comment's belief, compiled** (#111). **A passing mutation
  proves the code, not the test** (#111).
- **A message that is never SENT leaves no artifact** (#110) — assert on the port.
  **A "before" run needs a positive control** (#110).
- **Ordering a check before a mutation is necessary and not sufficient** (#109).
- **A "tear down, then report X" mutation passes a status-only assertion**
  (#109, #113). Assert port by port that nothing was reached.
- **Ask the process that holds the fact** (#108). **An empty list is ATTRIBUTED,
  not observed** (#105). **A single sample cannot measure an asynchronous event**
  (#104, #105).
- **`gui-52`'s red is DOUBTFUL** — #105 measured the CLI returning 15 models /
  119 commands, and #112's phase A reconfirmed it twice. `gui-75` is
  focus-dependent; reproduce solo before believing either red.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- Test baseline on `main` is **1044/70**; ticket bodies have been stale about this
  for eight consecutive tickets, so read it from `main`.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

The AFK grant expired with the batch and never reopened these:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `acaaa3a`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **1044 tests / 70 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-a-lost-target-is-not-a-dead-process]]
- [[2026-08-04-a-ref-synced-by-an-effect-is-late-in-both-directions]]
- `.claude/vibe.md` — run that filed #98–#110
