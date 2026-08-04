---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #110, `86bab34`

The bounds report was debounced 250ms and the `closed` handler **cancelled** the
pending timer, so a move or resize followed by a close inside that window was
discarded and the next launch came back at the previous position. Fixed by
flushing on **`close`** — not `closed`, where the `webContents` is already gone —
with the debounce, the `getNormalBounds()` read and the flush extracted to
`src/main/bounds-reporter.ts` so vitest can reach them.

**The extraction is the point, not tidiness.** A message that is never sent
leaves no trace in main, in the renderer or on disk, which is how this survived
#79's own exhaustive driver. Every assertion is on the send port's call count and
payload.

**The teardown race was measured, not assumed.** `window-all-closed` quits this
app, so a send from `close` is in flight while the renderer is being destroyed —
main's send and the renderer's `localStorage` write are two facts owned by two
processes. `gui-110` reports them apart: **0 sends / stale rectangle** before,
**1 send at 66–69ms / the moved rectangle** after. The race does not eat the
write here, but a single pass/fail could not have said which half failed.

Gate green: typecheck clean, **1024 tests / 67 files** (1011 + 13), build clean,
`gui-110` PASS after being red-verified on clean `main`.

## Frontier: THREE OPEN, ALL `ready-for-agent`

**Next unblocked, lowest-numbered: #111.** Live `blocked_by` is 0 for all three.
Run the query anyway — it is the authority over this table, and this line has
been wrong before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **111** | engine closed between turns strands an open subagent | — |
| **112** | pill click empties the model menu and slash commands | — |
| **113** | a second `chat:send` tells the renderer the live turn ended | — |

**No spikes left in the batch** — #111–#113 are all ordinary fixes, so premise
reproduction and mutation evidence apply to every one.

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #111 requires

`src/main/engine.ts`, `close()`:

```ts
onBackgroundTasks([])          // unconditional — the per-process reset
if (turnResolve) {
  drainSubagents()             // <-- gated, and that is the defect
  emit({ type: 'error', message: 'query closed' })
  finishTurn()
}
```

Close the engine **between** turns with a subagent still open and nothing flips
that row to `failed`; the CLI process is gone, so #104's `onSubagent` terminal
edge can never arrive either. The row pulses "running…" until New chat. Remedy:
move `drainSubagents()` above the `if`, matching `onBackgroundTasks([])` one line
up, which is already unconditional for exactly this reason.

Reachable through any of the six engine-discard paths `close()` funnels — the
easy one is: run a turn that spawns a subagent, let the turn end while the agent
is still working (the `Agent` tool is async; #104 measured an agent still open at
`result/success` in 2 of 3 runs), then pick a different model.

Three things the ticket names, all still live:

- **It is not automatically a one-liner.** Prove an unconditional call cannot
  double-emit when a turn *is* in flight — `drainSubagents` clears
  `subagentParents`/`taskToParent`, so the second call should be a no-op, and the
  ticket wants that **asserted** rather than reasoned.
- **The existing `'a closed query drains a still-running agent'` test must stay
  green and untouched.**
- **`onTerminal` must NOT fire for `close()`** — main's teardown is not a stream
  death. That asymmetry with `onBackgroundTasks` is deliberate and documented;
  do not "make them consistent". And do not touch the success branch of the
  `result` handler: #104 forbids `drainSubagents()` there, mutation-verified by
  seven tests.

## Still-live batch landmines

- **A message that is never SENT leaves no artifact** (#110) — no state-shaped
  test can see it, so assert on the port.
- **A remedy crossing a process boundary needs a witness on each side** (#110).
  Main can be right and the renderer still lose the value.
- **A "before" run needs a positive control** (#110), or "nothing changed" is
  trivially true; and an instrument should **refuse** runs that missed the
  window it was aimed at.
- **Ordering a check before a mutation is necessary and not sufficient** (#109).
  An `await` between them means the answer must be re-read on the far side.
- **A "tear down, then report X" mutation passes a status-only assertion**
  (#109). Where the contract is "a rejection is a no-op", assert port by port
  that nothing was reached.
- **Ask the process that holds the fact** (#108). Four instrument bugs there were
  all the same mistake — measuring a proxy for a fact another process owns.
- **A pane that stopped growing is NOT an idle engine** — growth is sound as a
  positive, useless as a negative.
- **Re-check a premise at the moment it matters**, not before a settle.
- **`gui-52`'s red is DOUBTFUL, and chasing it is out of scope** — #105 measured
  the CLI returning **15 models**. Filed in #112's out-of-scope.
- `gui-75` still has a standing environmental red (focus-dependent); reproduce
  solo before treating it as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- **A single sample cannot measure an asynchronous event** (#104, #105).
- **A stub that fails everything measures less than one that fails selectively**
  (#106).
- **A mocked refusal asserts the harness** (#107) — bind the real decision behind
  the seam when the decision is what the test is about.
- Ticket baselines are stale: #111 says 995/64, `main` is at **1024/67**.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `86bab34`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **1024 tests / 67 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-a-scheduled-report-is-not-a-sent-one]]
- `.claude/vibe.md` — run that filed #98–#110
