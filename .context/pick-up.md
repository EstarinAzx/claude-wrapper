---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #104, `795be69`

**A subagent's terminal status now has its own port.** `EnginePorts.onSubagent`
bypasses `emit` (whose `activeOnEvent` is null between turns), main broadcasts on
`subagent:changed`, and `useChat` subscribes. `emitSubagent` routes **every**
subagent edge through the port when one is supplied, so one agent's lifecycle is
never split across two channels.

Measured before building. Three runs on host CLI 2.1.221 / SDK 0.3.220 / wisped:

| Run | terminal edge vs `result/success` |
|---|---|
| 1 | **LATE by 14519ms** |
| 2 | early by 1699ms |
| 3 | **LATE by 13126ms**, `openLocalAgents: 1` |

The ordering is a **race** — the `Agent` tool is async, so parent and subagent
settle independently. The answerable question is therefore **reachability**, and
one observation settles it.

Gate green: typecheck clean, **995 tests / 64 files** (+5), build clean.

## Frontier: SEVEN OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #105** — a spike. Live `blocked_by` is 0. Run
the query anyway.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **105** | **spike** — model pick may empty models/commands | — |
| **106** | failed clipboard-image read gets contradictory copy | — |
| **107** | rail can delete session receiving first streaming turn | — |
| **108** | **spike** — second send/hung interrupt lifecycle | — |
| **109** | send during workspace resolve tears down live turn | — |
| **110** | close inside debounce drops final window bounds | — |
| **111** | close between turns strands an open subagent row | — |

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #105 requires

**It is a SPIKE and must stay one** — harness, findings, recommendation, **no
`src/` diff**. Killing its own premise is a successful outcome.

- The premise is genuinely doubtful. `commands:list`'s own comment calls the
  empty answer *"the dock's honest empty state"*, and `gui-52` is a standing
  environmental red for an empty CLI model list — so **an empty list in this
  sandbox is indistinguishable from a null engine**. The spike has to separate
  those two before it can report anything.
- Copy `scripts/spike-104-late-subagent.mjs` for shape: it imports the app's real
  `cli-path.ts` and `backend-mode.ts` (never a copy of the PATH walk or a
  hand-edited env), keeps raw messages in the OS temp dir, and commits only
  shapes, counts, timings and booleans.
- The obvious remedy spawns a CLI process on every pill click — price it before
  recommending it (#90 measured ~893ms per look).

## #105 landmines

- **A single-shot instrument cannot measure an intermittent state.** #104's
  harness had to be rewritten for exactly this: one turn gave the opposite answer
  to the next. Run the path several times and report the attempt count.
- **Review the instrument as production code.** #104's harness shipped two bugs
  that each produced a confident wrong answer: a null status classified as
  terminal, and a filter on a field that was never recorded.
- **`result.subtype` is `'success'` on a failed turn** — `is_error` is the field
  that says so. A spike reading only `subtype` reports a clean zero.
- **Unsetting `ANTHROPIC_BASE_URL` by hand is not native mode** (#87). Use
  `backend-mode.ts`'s `resolveSpawnEnv`.
- `openSession` → `targetSession` **closes the engine**, after which
  `listModels()` / `listCommands()` answer `[]` **by contract** (#77). Order setup
  steps by what each one takes away.

## Still-live batch landmines

- #108 is the other spike: harness + findings + recommendation, no `src/` diff.
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

`main` = `795be69`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **995 tests / 64 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- [[2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding]]
- `.claude/vibe.md` — run that filed #98–#110
