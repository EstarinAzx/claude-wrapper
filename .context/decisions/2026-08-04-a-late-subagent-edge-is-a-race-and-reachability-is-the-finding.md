---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision, agents, engine]
---

# A late subagent edge is a RACE, and reachability is the finding

**Decision:** #104 gives the subagent status stream its own **injected port**,
`onSubagent`, following #83's `onBackgroundTasks` precedent — because a
subagent's terminal edge **can** land after `result/success`, where
`finishTurn()` has already nulled `activeOnEvent` and `emit()` reaches nobody.
The success branch still does **not** call `drainSubagents()`.

## The measurement changed the shape of the claim

The ticket asked whether the late edge happens. It does — but **not every time**,
and the harness was rewritten once that surfaced.

| Run | `task_started` | terminal edge | `result/success` | ordering |
|---|---|---|---|---|
| 1 | 5288ms | 27934ms | 13415ms | **LATE by 14519ms** |
| 2 | 5605ms | 23183ms | 24882ms | early by 1699ms |
| 3 | 5246ms | 22128ms | 9002ms | **LATE by 13126ms** |

Host CLI **2.1.221**, SDK **0.3.220**, backend **wisped**, all three runs. Run 3
also records the number that makes it a defect rather than a curiosity:
**`openLocalAgents: 1` at `result/success`** — an agent was demonstrably still
open when the listener was nulled, and it later completed.

Same prompt, same binary, same backend, opposite answers. The `Agent` tool is
**async on this CLI** ([[2026-08-01-background-tasks-changed-fires-and-the-ids-join]],
finding 6), so the parent turn and the subagent settle **independently**: whether
the parent's `result` lands first depends on how long the parent keeps working
after the tool returns, which a prompt can influence but not control.

**So the question is not "which ordering happens" — it is "is the late ordering
REACHABLE", and one observation settles that.** A defect that occurs on some
turns is a defect. `scripts/spike-104-late-subagent.mjs` therefore runs several
turns against one query, records every turn's ordering, and stops as soon as it
has seen a late one. **An all-early run does not refute the finding**, and the
harness says so in its own output rather than leaving a reader to infer it.

The first version of the harness would have hidden this: it ran exactly one turn
and printed `AUTHORISED TO BUILD: false` on run 2. A single-shot instrument
cannot measure a race — **and the rewrite is what makes a green run mean
something**, because it now reports how many turns it took to see the late
ordering rather than reporting one sample as the answer.

## Two instrument bugs found in review, both fixed before landing

- **An absent status counted as terminal.** `!['running',…].includes(null)` is
  `true`, so a `task_notification` carrying no status at all would have set
  `terminalArrived` and authorised the build **on no evidence**. `engine.ts:426`
  treats an absent status as another progress tick; the harness now matches it.
- **`openLocalAgents` was computed against a field that was never recorded.**
  The filter read `terminal.taskId` while the entries carried none, so the
  predicate was unconditionally true and the number equalled the agent count
  whatever happened. The key is now recorded — and **scrubbed before it reaches
  the committed file**, which is why the fix is a `scrub()` at the boundary
  rather than dropping the field.

Both were caught by review of the instrument, not of the app. **A harness is
production code for the duration of the question it answers.**

## Why a port rather than the obvious shortcut

`drainSubagents()` on the success branch is **explicitly forbidden by the
ticket**, and the measurement is what makes the ban concrete: it emits
`status: 'failed'`, and in run 1 the agent that was still open at
`result/success` went on to **complete**. The shortcut would trade a row stuck on
"running" for a row that says the agent failed when it did not — the same class
of lie the `mergeAgents` live-beats-disk rule exists to avoid inverting.

Mutation-verified: adding `drainSubagents()` to the success branch reds **seven**
tests, including the two new ordering pins.

## The port owns every subagent edge, or none

`emitSubagent` routes to `onSubagent` when supplied and falls back to `emit`
otherwise. One rule, not a per-edge decision: a terminal edge that arrived
between turns would otherwise be the only one on a different channel from the
`running` edge that preceded it, and the renderer's upsert would be reading one
agent's lifecycle off two sources.

**The failure branches keep draining, and are now pinned WITH the port wired.**
Every pre-existing drain test builds the engine portless, so they exercise the
fallback branch that main never uses — the configuration main actually builds was
unproven until two tests were added for it. Mutation-verified: pointing
`drainSubagents` back at `emit` reds both.

## Reversibility

- The port is one optional field on `EnginePorts` with no default; an engine
  built without it behaves exactly as before, and that fallback is pinned.
- `subagent:changed` is a leaf channel: main broadcasts, preload subscribes,
  `useChat` calls the same `handleSubagent` the `chat:event` branch calls.
  Deleting the channel leaves the old path working.
- The `chat:event` `subagent` branch is deliberately **left in place**. With the
  port wired in main it is dead in production, but the two writers are idempotent
  and removing it would strand the older dock tests for no gain.

## Measurement gap, stated

**The user-visible symptom was not driven in a real window.** The evidence is at
the CLI layer (the spike) and at the unit layer (the ordering pins). Nobody
watched a row in the built app stay on "running…" and then settle — `gui-104`
does not exist. The mechanism is measured end to end; the pixel is inferred.

**The `close()` gap is real and NOT fixed here.** `drainSubagents()` in `close()`
is still behind `if (turnResolve)`, so an engine torn down **between** turns with
an open subagent leaves that row pulsing forever — the CLI is gone, so the edge
this port delivers can never arrive. It is pre-existing and out of this ticket's
scope; filed rather than folded in.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83, the port shape this follows
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, which measured the async `Agent` tool and the 3.3s late level
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the first port of this shape
