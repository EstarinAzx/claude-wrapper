---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #102, `b9ca7f0`

**The open subagent viewer no longer freezes at its first disk read.** `App`
passes the established `lastTurn` signal into `SubagentDrawer`; its guarded
transcript effect re-runs on the nonce. Ordinary stream events trigger no disk
read, and the existing cleanup still blocks stale async responses.

Gate green: typecheck clean, **988 tests / 64 files** (+1), build clean. The
second-turn refresh test was red first and mutation-verified by removing the
nonce dependency. Its first version exposed a test trap: turn one also changes
`sessionId`, so the test must establish that turn before opening the viewer.

## Frontier: EIGHT OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #103** — the composer handles Escape inside
its slash popover without stopping propagation, so one press can also close the
viewer. Live `blocked_by` is 0. Run the query anyway.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **103** | composer Escape can dismiss two things | — |
| **104** | successful turn never drains a still-open subagent | — |
| **105** | **spike** — model pick may empty models/commands | — |
| **106** | failed clipboard-image read gets contradictory copy | — |
| **107** | rail can delete session receiving first streaming turn | — |
| **108** | **spike** — second send/hung interrupt lifecycle | — |
| **109** | send during workspace resolve tears down live turn | — |
| **110** | close inside debounce drops final window bounds | — |

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #103 requires

Read the full ticket. First measure reachability after #99: open the slash
popover, mouse-open the viewer, press Escape, and record whether both dismiss.
Land the fix regardless of that verdict: add `e.stopPropagation()` beside
`preventDefault()` only in `InputBar`'s popover-open Escape branch.

Required tests:

1. Establish popover and viewer both open; fire Escape at composer; assert the
   popover closes and viewer remains open.
2. With no popover open, assert Escape still reaches the existing outer handler.
3. Remove `stopPropagation()` and watch criterion 1 red.
4. Do not touch `SubagentDrawer`, `Sidebar`, or nearby key handling.

Record the reachability result on #103 whichever way it comes out.

## Landmines from #102

- A first `turn-end` also writes `activeSessionId`; a refresh test that starts
  there can pass through the old `[sessionId]` dependency and prove no nonce
  behavior. Establish turn one before opening, then test turn two.
- `SubagentDrawer`'s `live` cleanup is load-bearing against older reads applying
  after newer ones. Do not weaken it in adjacent work.
- The viewer refresh keys on `lastTurn?.nonce`; ordinary stream events must not
  read disk.

## Still-live batch landmines

- #105 and #108 are spikes: harness + findings + recommendation, no `src/` diff.
- #107 remains the only data-loss ticket, but queue order is lowest-numbered.
- `gui-75` and `gui-52` have standing environmental reds; reproduce solo before
  treating either as a regression.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause enumeration changes after #97.
5. Whether the glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `b9ca7f0`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **988 tests / 64 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- `.claude/vibe.md` — run that filed #98–#110
