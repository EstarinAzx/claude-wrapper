---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #109, `74cbecf`

`switchWorkspace` read `isBusy()` before awaiting `resolveTarget` and mutated on
the far side, so a turn starting in the gap was torn down by `closeEngine()`
while the switch still returned `ok`. Fixed with **one extra `isBusy()` read**
after the resolve; pre-await checks byte-identical, no lock/queue/flag.

**The premise reproduced, and the measurement cut both ways.** Cold resolve is
**18.2ms median** (7 paired runs, 160 project dirs / 918 transcripts); warm is
**0.0ms**. So the window is far too narrow for two *human* actions to collide in
— but **cold is the ordinary path**, because `session:list` calls
`resetSessionIndex()` and that same listing renders the row you click to get
here. The window exists only because the rail's own refresh drops the index. The
plausible path is a #80 queued send flushing from its `turn-end` effect (one
machine-timed side); recorded as **plausible, not measured**.

Gate green: typecheck clean, **1011 tests / 66 files** (1009 + 2), build clean.

## Frontier: FOUR OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #110.** Live `blocked_by` is 0 for all four.
Run the query anyway — it is the authority over this table, and this line has
been wrong before.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **110** | close inside debounce drops final window bounds | — |
| **111** | close between turns strands an open subagent row | — |
| **112** | pill click empties the model menu and slash commands | — |
| **113** | a second `chat:send` tells the renderer the live turn ended | — |

**No spikes left in the batch** — #110–#113 are all ordinary fixes, so premise
reproduction and mutation evidence apply to every one.

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #110 requires

`reportBounds` debounces the `bounds:changed` push by 250ms
(`src/main/index.ts:293-300`) and the `closed` handler **clears** the pending
timer (`:304`), so a move or resize followed by a close inside that window is
silently discarded. **Flush instead of cancel**, on `close` (not `closed` — the
`webContents` is gone by then, and that distinction is the whole fix), sending
`win.getNormalBounds()` so a maximised window never persists its transient
rectangle. Leave the `closed` clear as belt-and-braces.

Three landmines the ticket names, all still live:

- **Do not touch #79's show-gate half.** `bounds:set` must keep releasing the
  gate on a `null` or invalid payload, or every first-ever launch waits out the
  1500ms timeout.
- **The `:222-224` comment currently asserts the behaviour this ticket adds**
  ("the debounce is short enough that closing the window straight after moving it
  still stores the new position"). Fix it in the same change — #109 was a whole
  ticket about a comment that was true of the ordering and false of the
  guarantee, and this one is plainly false as written.
- **Criterion 2 is the trap**: the flush must not double-send when the debounce
  had already fired.

## Still-live batch landmines

- **Ordering a check before a mutation is necessary and not sufficient** (#109).
  An `await` between them means the answer must be re-read on the far side.
- **A "tear down, then report X" mutation passes a status-only assertion**
  (#109). Where the contract is "a rejection is a no-op", assert port by port
  that nothing was reached — the status alone ships the destructive version.
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
- Ticket baselines are stale: they say 979/64, `main` is at **1011/66**.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `74cbecf`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **1011 tests / 66 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]]
- `.claude/vibe.md` — run that filed #98–#110
