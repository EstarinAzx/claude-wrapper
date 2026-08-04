---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 6 (`relay-leg`)_
_At commit: `333bded` on `main`, pushed and level with `origin/main`_

## Current focus

**#103 landed and closed.** The composer's popover-open Escape branch now stops
propagation, preserving the stated one-Escape/one-dismissal invariant. Next
frontier is **#104**: measure whether a subagent terminal message really arrives
after `result/success`; only build the out-of-band status port if it does.

## State

- **In flight:** nothing. Ticket branch was squash-merged and deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #103 as `333bded`. `InputBar` adds one
  `stopPropagation()` inside only its popover-open Escape branch.
- **Gate:** typecheck clean; **990 tests across 64 files** green (+2); build clean.
- **Mutation evidence:** deleting `stopPropagation()` closes the viewer and reds
  the positive collision test. With no popover, composer Escape still reaches
  and closes the viewer.
- **Queue:** seven open, #104 through #110, all `ready-for-agent`; none
  `ready-for-human`. Live blocker count for every ticket is 0.
- **Blocked:** nothing.

## Pick up here

Take **#104** after re-running the frontier query. Read the whole ticket. First
extend the spike-harness pattern to measure whether a real subagent terminal
message lands after `result/success`, and by how much. Record the result before
changing production code.

If no late message arrives, close #104 with evidence and build nothing. If it
does, TDD a dedicated `EnginePorts` callback following #83's
`onBackgroundTasks` precedent. The callback must bypass `emit`, whose
`activeOnEvent` is null between turns. Never call `drainSubagents()` on success:
it reports a still-running async agent as failed.

## Skills for next session

- `superpowers:systematic-debugging` — measure the claimed late-message ordering
  before accepting the proposed cause.
- `superpowers:test-driven-development` — port wiring and ordering pins must go
  red before implementation if measurement authorizes the build.
- `superpowers:verification-before-completion` — full test/typecheck/build gate
  before landing.

## Open questions

None for #104. Its measurement decides whether code is warranted.
`ready-for-human` remains forbidden while owner is AFK.

## Recent context

- Post-#99, #103's prescribed physical sequence no longer double-dismisses:
  both surfaces are mounted, focus sits on the viewer Close button, and Escape
  closes only the viewer while the popover remains. This was measured in the
  built Electron window and recorded on the ticket.
- The latent propagation bug remained test-reachable by dispatching Escape at
  the composer. Both surfaces were asserted open first; the fix is still one
  line and preserves no-popover propagation.
- #104's closest measurement is #81's 3.3-second late **task-level** event. That
  does not prove the separate `subagent` event follows the same timing.
- A successful turn must not drain subagents as failed. #104's remedy, if
  authorized, is an out-of-band status port modeled on #83.
- No durable decision was appended for #103; it enforces an invariant already
  stated in `Sidebar` rather than choosing new behavior.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
