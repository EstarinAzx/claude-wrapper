---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (chain 3, relay leg 2, `relay-leg`)_
_At commit: `790fc34` on `main`, pushed and level with `origin/main`_

## Current focus

**#99 landed and closed.** The centred subagent viewer now tells the truth about
`aria-modal="true"`: focus moves inside before paint, real forward and reverse
Tab navigation cannot reach controls behind the scrim, and every close path gives
focus back to the control that opened it. Next frontier is **#100**, the two stale
async continuations in `useChat`.

## State

- **In flight:** nothing. No ticket branch remains; working tree contains only
  this pending `.context/` wrap-up.
- **Done this session:** #99 as `790fc34`. `SubagentDrawer` captures the prior
  `activeElement` in `useLayoutEffect`, focuses the existing Close button, traps
  Tab on the dialog root, and restores only a still-connected opener on unmount.
  Button, Escape, and scrim exits all share that one cleanup.
- **Gate:** typecheck clean; **982 tests across 64 files** green (+3 from the
  979 baseline); build clean; `gui-95`, `gui-93`, and `gui-96` all green.
  `gui-95` measures one real-key stop in each direction, both contained.
- **Mutation evidence:** deleting restore made all three exit rows red. Removing
  the root handler made both walks escape at stop 1 and reached the hidden
  composer at forward stop 13.
- **Queue:** eleven open, #100 through #110, all `ready-for-agent`; none
  `ready-for-human`; every live API blocker count is 0. Closing #99 unblocked
  #102. Lowest-numbered frontier is #100.
- **Blocked:** nothing.

## Pick up here

Take **#100** after re-running the frontier query. It requires one generation
counter in `useChat`, explicitly resolved out-of-order promises, and four
mutation-verified tests: two `openSession` races plus stale `currentSessionId`
continuations from `turn-end` and `onEngineTerminal`. Keep its deliberately
ordered transcript-read then watch-install sequence, the same-id early return,
and the one `busy` source.

Run:

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/100 --jq '.issue_dependencies_summary.blocked_by'
```

## Skills for next session

- `superpowers:systematic-debugging` for the two reproduced stale-continuation races.
- `superpowers:test-driven-development` for explicit out-of-order red/green tests.
- `superpowers:verification-before-completion` before landing.

## Open questions

None for #100. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- Component-local ownership beat App-level opener refs: mount/unmount already is
  the viewer's entire lifetime, so every exit shares one restore path.
- `gui-95` now cycles on its own first stop. The old `.subagent-row` cycle break
  became unreachable under a correct trap and would have burned 120 presses.
- `gui-93` still prints a stale static note claiming the viewer needs a real turn.
  Its assertions are green, but #95 proved the surface is drivable synthetically.
  Do not fold that unrelated prose cleanup into #100.
- No CSS, scrim attribute, Escape propagation, focus-ring, package, or visual
  change landed in #99.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-focus-belongs-to-the-modal-lifetime]]
- [[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]]
- [[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]]
