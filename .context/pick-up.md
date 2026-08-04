---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #103, `333bded`

**One composer Escape now dismisses one surface.** `InputBar` calls
`stopPropagation()` only when its slash popover is open. Positive tests prove
the popover closes while the viewer stays open, and prove a composer Escape
with no popover still reaches and closes the viewer.

Gate green: typecheck clean, **990 tests / 64 files** (+2), build clean. Removing
`stopPropagation()` mutation-reds the collision test because the dialog
vanishes.

Real-window reachability after #99 was measured and recorded on #103: opening
the popover, then mouse-opening the viewer, leaves both mounted but moves focus
to `.subagent-drawer-close`. A physical Escape therefore closes only the viewer
and leaves the popover mounted. The easy user route is gone; the latent event
contract is now pinned anyway.

## Frontier: SEVEN OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #104** — a successful turn nulls
`activeOnEvent` while an async subagent can still be running, so its later
terminal status may reach nobody. Live `blocked_by` is 0. Run the query anyway.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **104** | successful turn may lose late subagent terminal status | — |
| **105** | **spike** — model pick may empty models/commands | — |
| **106** | failed clipboard-image read gets contradictory copy | — |
| **107** | rail can delete session receiving first streaming turn | — |
| **108** | **spike** — second send/hung interrupt lifecycle | — |
| **109** | send during workspace resolve tears down live turn | — |
| **110** | close inside debounce drops final window bounds | — |

`ready-for-human` is forbidden while owner is AFK. Stuck ticket keeps
`ready-for-agent`, gets a precise comment, and stops the relay.

## What #104 requires

Read the full ticket. Measure before building: extend
`scripts/spike-81-background-tasks.mjs`'s harness pattern, using #90's scrubbing
rules, to observe whether a real `subagent` terminal message lands after
`result/success` and how late.

- Record timing on #104 and in `.context/`, whichever way it comes out.
- If no terminal message lands late, close with evidence and make no `src/`
  change.
- If it does, add a dedicated injected `EnginePorts` callback following #83's
  `onBackgroundTasks` precedent. It must not route through `emit`.
- Drive `taskStarted()` → `success` → late terminal notification, assert the
  turn listener has already finished before the late push, then assert status
  reaches `done`.
- Positively pin that success never emits `subagent: 'failed'` for an agent still
  running. Existing failure-branch drain tests stay untouched.
- Mutation-verify both ordering/status tests.

## #104 landmines

- #81 measured a task **level** arriving 3.3s after success. `subagent` terminal
  status travels a different path; do not treat that as this ticket's answer.
- `emit` calls `activeOnEvent?.(event)`. A new port routed through it inherits
  the exact between-turn drop.
- `drainSubagents()` emits `failed`; calling it on success lies about async agents
  that remain live and later succeed. This shortcut is explicitly forbidden.
- `mergeAgents` deliberately lets live state beat disk. Do not invert it to hide
  stale status.
- `result.subtype === 'success'` can accompany `is_error`; do not reinterpret
  that discriminator while here.

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

`main` = `333bded`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **990 tests / 64 files**, build clean.

## Related

- [[overview]] · [[active-work]] · [[decisions]]
- `.claude/vibe.md` — run that filed #98–#110
