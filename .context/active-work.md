---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 3 (`relay-leg`)_
_At commit: `be4e5e7` on `main`, pushed and level with `origin/main`_

## Current focus

**#100 landed and closed.** `useChat` now rejects every delayed transcript or
session-id answer whose pane generation is stale. Next frontier is **#101**: the
subagent store flattens a failed store-root enumeration to `[]`, contradicting
its own `null`-means-unreadable contract and making the Agents dock lie that no
agents exist.

## State

- **In flight:** nothing. Ticket branch was squash-merged and deleted; working
  tree contains only this pending `.context/` wrap-up.
- **Done this session:** #100 as `be4e5e7`. One monotonic pane generation is
  bumped by adoption and New chat; delayed transcript loads, turn-end id reads,
  and terminal id reads compare it before writing. `openSession` retargets the
  engine only when adoption committed.
- **Gate:** typecheck clean; **986 tests across 64 files** green (+4 from the 982
  baseline); build clean. Four explicit out-of-order tests cover slow A after
  fast B, slow A after New chat, turn-end id after New chat, and terminal id
  after New chat.
- **Mutation evidence:** removing the adoption guard reds both transcript races;
  removing the `openSession` boolean check independently leaves the pane on B
  but retargets the engine to A; removing either id guard reds its matching test.
- **Queue:** ten open, #101 through #110, all `ready-for-agent`; none
  `ready-for-human`. Live blocker count for #101 is 0.
- **Blocked:** nothing.

## Pick up here

Take **#101** after re-running the frontier query. Read the whole ticket before
editing. Keep `readSubagentTranscript` lenient and distinguish statuses at the
`listSubagents` call site if that avoids widening the shared helper's contract.
Required coverage is both store outcomes (`unavailable` → `null`, readable but
missing session → `[]`) plus exact Agents-dock unreadable and empty copy. Preserve
the existing non-ENOENT subagent-directory `null` pin. Mutation-verify the root
failure case.

Run:

```text
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/101 --jq '.issue_dependencies_summary.blocked_by'
```

## Skills for next session

- `superpowers:test-driven-development` — write the two store outcomes and dock
  copy assertions red before changing the status mapping.
- `superpowers:verification-before-completion` — full test/typecheck/build gate
  before landing.

## Open questions

None for #101. `ready-for-human` remains forbidden while the owner is AFK.

## Recent context

- Tests resolving controlled promises must wrap the resolver in async `act()`;
  a first version used `waitFor` on absence and all four checks passed before the
  stale continuation ran.
- Returning whether adoption committed is what guards the engine side effect;
  guarding only `adoptSession` state still lets stale `openSession` retarget main.
- #101's trigger is specifically store-root enumeration failure. An individual
  bad project directory is skipped and cannot produce `unavailable`.
- No API, preload, CSS, package, or design change landed in #100.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
