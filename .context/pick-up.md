---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #99, `790fc34`

**The centred subagent viewer now owns focus for its complete lifetime.** Opening
focuses the existing Close button before paint; `Tab` and `Shift+Tab` cannot
leave `.subagent-drawer-root`; closing by button, Escape, or scrim restores the
element focused before open when it still exists.

One component-local lifetime rather than App-level opener refs: capture in
`useLayoutEffect`, root-local trap over live enabled stops, restore from cleanup.
No CSS, focus-ring, scrim, Escape-propagation, package, or visual change.

Gate green: typecheck clean, **982 tests across 64 files** (+3), build clean;
`gui-95`, `gui-93`, `gui-96` all green. Mutation evidence: deleting restore reds
all three exits; deleting the handler makes both walks escape at stop 1 and the
hidden composer appears at forward stop 13.

See [[2026-08-04-focus-belongs-to-the-modal-lifetime]].

## Frontier: ELEVEN OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #100** — two stale async continuations in
`useChat`. Run the query anyway; the API is authority.

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **100** | two async continuations in `useChat` apply after their target moved | — |
| **101** | `listSubagents` collapses unreadable store to “no agents” | — |
| **102** | open viewer freezes its transcript at the first disk read | — (99 closed) |
| **103** | composer Escape can dismiss two things | — |
| **104** | successful turn never drains a still-open subagent | — |
| **105** | **spike** — model pick may empty models/commands until next send | — |
| **106** | failed clipboard-image read gets contradictory copy | — |
| **107** | rail can delete the session receiving its first streaming turn | — |
| **108** | **spike** — second send or hung interrupt may strand lifecycle | — |
| **109** | send during `switchWorkspace` resolve tears down a live turn | — |
| **110** | close inside 250ms debounce drops final window bounds | — |

**#102's dependency list still contains #99, but #99 is closed and the live
`blocked_by` summary is 0.** This is expected: summary counts open blockers.

**#107 remains the only data-loss ticket**, but queue order is lowest-numbered.
**#105 and #108 are spikes:** harness + findings + recommendation, no `src/`
diff. Killing their premise succeeds.

`ready-for-human` is forbidden while the owner is AFK. A stuck ticket gets a
precise comment, keeps `ready-for-agent`, and stops the relay.

## What #100 requires

Read the full ticket. One generation counter in `useChat`, bumped by every path
that changes what the pane is looking at and checked after every relevant await.
Do not add an “adopting” busy flag: it leaves the two `currentSessionId` sites
unfixed and violates the one-busy-source rule.

Required explicit-order tests:

1. `openSession(A)` slow, then `openSession(B)` fast; resolve B then A. Pane,
   `activeSessionId`, watch target, and engine target end on B.
2. `openSession(A)`, then `newChat()`, then resolve A. Pane stays empty and id
   stays null.
3. `turn-end` starts `currentSessionId`; run `newChat`; resolve old id. Id stays
   null.
4. Repeat for `onEngineTerminal`'s independent `currentSessionId` call.
5. Mutation-remove each guard and watch the matching test red.

Keep these existing contracts:

- `adoptSession` installs the watch **after** transcript read deliberately.
- `openSession`'s same-id early return prevents live pane overwrite.
- `newChat` stays gated on the existing `busy`; no second busy-like flag.
- Promises are resolved out of order by the test, never by timers.

## Landmines from #99

- A modal's focus belongs to mount/unmount. Both Task-card and Agents-dock openers
  survive behind the scrim, and all three close paths unmount the same component.
- `gui-95`'s cycle marker is its own initial stop, not `.subagent-row`; a correct
  trap makes the opener unreachable.
- The viewer currently has one sequential stop. Forward and reverse Tab both
  cycle on Close. The root has `tabIndex={-1}` only as a zero-stop fallback and
  never enters sequential order.
- `gui-93` still prints a stale **note** that this viewer needs a real turn and is
  static-only. Its assertions are green; #95 proved the surface is drivable by a
  synthetic `chat:event`. Do not fold that unrelated prose cleanup into #100.
- The plan lives at
  `docs/superpowers/plans/2026-08-04-subagent-viewer-focus.md`; no second design
  record is needed.

## Still-live batch landmines

- **Overlay selectors must be scoped.** A bare `.chat-column` reads the app's own
  chat behind the scrim and once passed against the wrong drawer.
- Reaching viewer transcript content in a driver needs **two IPC stubs**:
  `chat:session-id` and `subagents:transcript`.
- Driver window bounds are borrowed persisted state; restore them after the
  250ms debounce.
- `.claude/settings.json` is untracked and gitignored; stage by path anyway.
- `gui-75` is focus-dependent and has twice red in a batch while passing solo.
  `gui-52` is environmental red when the CLI model list is empty.
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- A ticket's baseline ages: live baseline after #99 is **982/64**.
- `gh issue close --comment` can lose its comment on an already-closed issue;
  comment first, then close.
- A squash merge leaves the ticket branch “not fully merged”; `git branch -D` is
  correct after the squash commit.

## Do not decide these

The AFK grant removes ownership as a ground for deferring; it does not reopen
standing calls outside this seed:

1. Tailwind's adopt-utilities half.
2. Titlebar control count, pinned at 8.
3. Whether 12px is the right line box for 11px muted descriptions.
4. Whether the accent clause's enumeration should change after #97 measured it.
5. Whether `DESIGN.md`'s glass ban reaches a `var(--surface)` pane.

A new reason reopens a call; a broader grant does not.

## Baseline

`main` = `790fc34`, pushed and level with `origin/main`; no ticket branch.
Typecheck clean, **982 tests / 64 files**, build clean. `gui-95`, `gui-93`, and
`gui-96` green on this commit. **30** driver files remain in
`.claude/skills/run-desktop/`.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-04-focus-belongs-to-the-modal-lifetime]] — #99
- [[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]] — #98
- [[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]] — #95
- `.claude/vibe.md` — run that filed #98–#110
