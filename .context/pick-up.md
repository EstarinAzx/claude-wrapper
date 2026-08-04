---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #101, `752a9a5`

**An unreadable subagent store no longer claims that no agents exist.**
`listSubagents` preserves `resolveSessionDir(...).status === 'unavailable'` as
`null`; an ordinary missing session and a missing `subagents/` directory remain
`[]`. `readSubagentTranscript` keeps its separate lenient contract unchanged.

Gate green: typecheck clean, **987 tests / 64 files** (+1), build clean. The root
failure test was red first (`expected null, received []`) and mutation-verified
by making the root readable; exact unreadable and empty Agents-dock copy is
pinned.

## Frontier: NINE OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #102** — the open subagent viewer freezes its
transcript at the first disk read. Live `blocked_by` is 0; #99 is closed. Run the
query anyway.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **102** | open viewer freezes its transcript at first disk read | — (#99 closed) |
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

## What #102 requires

Read the full ticket. Reuse the trigger `AgentsDock` already uses: pass
`lastTurn` from `App` to `SubagentDrawer`, and re-read on its turn-end nonce.
This is a disk refresh after a turn, not streaming.

Required tests:

1. Open the viewer and resolve a short transcript; assert it.
2. Emit `turn-end`, resolve a distinct longer transcript, and assert the new
   message appears while the original remains established.
3. Emit an ordinary streaming event and assert `subagentTranscript` call count
   does not increase.
4. Existing first-open argument pin remains green.
5. Remove the turn trigger and watch criterion 2 red.

Preserve the effect cleanup/async guard. A late result from the previous read
must not overwrite the newer one. No timer, spinner, refresh affordance,
per-event disk read, streaming path, or visual change.

## Landmines from #101

- `fakeIo({})` means the store root itself cannot enumerate; it does **not** mean
  a readable store containing no session. Seed some sibling/session file when a
  test needs the readable-miss branch.
- `null` means unreadable and `[]` means none spawned. Do not collapse them in a
  new call site.
- Exact dock copy is now pinned in both states.

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

`main` = `752a9a5`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **987 tests / 64 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- `.claude/vibe.md` — run that filed #98–#110
