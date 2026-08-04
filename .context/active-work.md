---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 4 (`relay-leg`)_
_At commit: `752a9a5` on `main`, pushed and level with `origin/main`_

## Current focus

**#101 landed and closed.** `listSubagents` now preserves an unreadable store
root as `null`, while a readable store missing the session or its subagents
still answers `[]`. Next frontier is **#102**: an open subagent viewer reads its
transcript once and stays stale while its agent continues and finishes.

## State

- **In flight:** nothing. Ticket branch was squash-merged and deleted; working
  tree contains only this pending `.context/` wrap-up.
- **Done this session:** #101 as `752a9a5`. `listSubagents` branches on
  `resolveSessionDir` before building the subagents path; the shared
  `readSubagentTranscript` leniency remains untouched.
- **Gate:** typecheck clean; **987 tests across 64 files** green (+1 from the 986
  baseline); build clean. Focused store and dock suites are 79/79.
- **Mutation evidence:** making the previously unreadable fake root readable
  changed criterion 1 from expected `null` to actual `[]`, proving the new root
  failure test distinguishes failure from an ordinary missing session.
- **Queue:** nine open, #102 through #110, all `ready-for-agent`; none
  `ready-for-human`. Live blocker count for #102 is 0; its only dependency, #99,
  is closed.
- **Blocked:** nothing.

## Pick up here

Take **#102** after re-running the frontier query. Read the whole ticket before
editing. Pass `lastTurn` from `App` into `SubagentDrawer` and reuse its nonce as
the established turn-end re-read trigger; do not add a timer, streaming path,
spinner, or visual change.

Required red-first coverage: open with a short transcript, emit `turn-end`,
resolve a longer transcript, and assert both snapshots; then prove an ordinary
stream event does not increase `subagentTranscript` call count. Preserve the
existing async cleanup guard so an older read cannot overwrite a newer one.
Mutation-verify by removing the turn trigger.

Run:

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/102 --jq '.issue_dependencies_summary.blocked_by'
```

## Skills for next session

- `superpowers:test-driven-development` — add the turn-end refresh and no-per-event
  pins red before changing the viewer.
- `superpowers:verification-before-completion` — full test/typecheck/build gate
  before landing.

## Open questions

None for #102. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- The former `fakeIo({})` “no subagents dir” test did not model a readable empty
  store: its root enumeration failed, so it silently covered the wrong branch.
  It now seeds the session transcript before asserting the missing directory.
- Exact dock copy is pinned: `null` renders “Could not read this session’s
  agents.”; `[]` renders “No agents in this session.”
- #102's refresh must key on `lastTurn.nonce`, not every engine event. Its cleanup
  guard is the defense against the stale-continuation class #100 just fixed.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
