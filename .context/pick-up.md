---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #100, `be4e5e7`

**Delayed session work can no longer move the pane backwards.** One monotonic
pane generation in `useChat` fences transcript adoption and both independent
`currentSessionId` continuations. `openSession` targets main only if its adoption
committed, so pane, active row, watch and engine stay on the latest user action.

Gate green: typecheck clean, **986 tests / 64 files** (+4), build clean. Four
explicit out-of-order tests were mutation-verified, including the engine target
separately from pane state.

## Frontier: TEN OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #101** — `listSubagents` reports an unreadable
store root as “no agents.” Live `blocked_by` is 0. Run the query anyway.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **101** | unreadable subagent store collapses to “no agents” | — |
| **102** | open viewer freezes its transcript at first disk read | — |
| **103** | composer Escape can dismiss two things | — |
| **104** | successful turn never drains a still-open subagent | — |
| **105** | **spike** — model pick may empty models/commands | — |
| **106** | failed clipboard-image read gets contradictory copy | — |
| **107** | rail can delete session receiving first streaming turn | — |
| **108** | **spike** — second send/hung interrupt lifecycle | — |
| **109** | send during workspace resolve tears down live turn | — |
| **110** | close inside debounce drops final window bounds | — |

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets precise comment, and stops relay.

## What #101 requires

Read full ticket. `subagent-store.ts`'s docstring is correct; code is wrong.
Prefer distinguishing `unavailable` at `listSubagents` call site so shared
`readSubagentTranscript` leniency stays untouched.

Required tests:

1. Store-root enumeration failure returns `null`.
2. Readable root with no target session returns `[]`.
3. Agents dock shows exact unreadable copy for `null` and exact empty copy for
   `[]`.
4. Existing non-ENOENT subagent-directory failure pin stays green.
5. Make root readable and watch criterion 1 red.

## Landmines from #100

- Controlled promise resolution must use async `act()`. `waitFor` on absence can
  pass before a stale microtask runs; the first four tests did exactly that.
- Guarding only pane writes is incomplete. A stale `openSession` can still call
  `targetSession(old)` unless adoption reports whether it committed.
- `adoptSession` keeps transcript-read then watch-install order deliberately.
- Same-id `openSession` early return and single `busy` source remain load-bearing.

## Still-live batch landmines

- #105 and #108 are spikes: harness + findings + recommendation, no `src/` diff.
- #107 remains only data-loss ticket, but queue order is lowest-numbered.
- `gui-75` and `gui-52` have standing environmental reds; reproduce solo before
  treating either as a regression.
- Never hardcode model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- Squash-merged ticket branches need `git branch -D`.

## Do not decide these

AFK grant does not reopen standing calls outside this seed:

1. Tailwind adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is right line box for 11px muted descriptions.
4. Whether accent clause enumeration changes after #97.
5. Whether glass ban reaches a `var(--surface)` pane.

## Baseline

`main` = `be4e5e7`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **986 tests / 64 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- `.claude/vibe.md` — run that filed #98–#110
