---
type: decision
project: claude-wrapper
date: 2026-08-01
updated: 2026-08-01
tags: [context, decision]
---

# A background task nests in the RENDER, never in the data model

**#85**, landed `3e24a53`. Agent-spawned background tasks appear as children of
their spawning agent; parentless ones keep the Background section. Four choices,
all load-bearing.

**1. The hybrid is the shape of the data, not a compromise.** The owner chose
"nest if parented, else Background" over folding everything into the tree, and
#84's measurement is why it is right: **2 of 3 observed tasks had an owning
agent and 1 did not**. A main-thread `Bash` has no owner to nest under, and that
is a normal state of a real session rather than an edge. A design that only
nested would have had nowhere to put it.

**2. Two new maps, and `taskToParent` is NOT one of them.** It cannot be reused:
its membership doubles as the accept-list that keeps Bash out of the agent panel
(`engine.ts:300-303`), so a bash task id inside it would make the lookup at
`:368` resolve a parent for that task's later messages. `toolUseToAgent` is
filled where `handleMessage` **already holds the parent and was stepping over
it** — the early return at `:419` drops a subagent's message before anything
looks inside, so the `tool_use` blocks it issued were never associated with the
agent that issued them. `taskIdToAgent` is filled on `task_started` for **every**
`task_type`, **before** the `local_agent` gate rather than after, because a
backgrounded Bash is exactly the case that gate turns away.

Note this is the correlation `2026-07-25-agent-tree-edge-is-the-sidecar` §1
declined — *for agents*, on the ground that the sidecar supplies the same edge
seconds later. A background task has **no sidecar**, so there is no later and the
trade does not transfer.

**3. Nesting is a render concern, so #83's separate prop is KEPT, not reversed.**
`buildAgentTree`, `flattenAgentTree`, `AgentRow` and `mergeAgents` are all
untouched. The rows never become `AgentRow`s and never reach `mergeAgents`, so
the reason #83 gave still holds unbroken — merging "would make a shell command
claim it ran as an agent and spent zero tokens" (`src/renderer/src/App.tsx:342`).
The join needs nothing new in the renderer either: `AgentRow.parentToolUseId` is
*the same value* as the `parent_tool_use_id` the engine recovers. Nested rows
stay non-interactive and keep the background-task classes — nesting moves a shell
command, it does not promote it.

**4. Enrichment happens on the way OUT, so REPLACE still governs.** The level
still carries the whole live set and still replaces wholesale; the parent lookup
is separate state consulted at emit time. A task leaving the level leaves both
surfaces. Pinned by a test that drops the level to `[]` after enrichment.

**Three conditions send a task to the Background section, and none is an error:**
no owner, an owner absent from the list, or map mode (which has no `<li>`s to
hang from). The fallback is never a drop — the same spirit as the tree ADR's *"a
missing row is worse than a mis-indented one"*.

## Mutation verification — five killed, and one killed a bad test first

- **A** — don't record which agent owns each `tool_use` → the enrichment test reds.
- **B** — record parentage *after* the `local_agent` gate → reds. The ordering is real.
- **C** — write into `taskToParent` instead of `taskIdToAgent` → reds.
- **D** — leave nested tasks *also* in the Background section → reds.
- **E** — drop the on-screen check → an orphaned task silently vanishes; reds.

**C is the one worth remembering.** The test written to catch it *passed against
the broken code*. It asserted that no subagent event was keyed to the bash task —
but widening the accept-list does not create a row keyed to the bash task, it
resolves that task's parent to the **AGENT** and terminates the agent early. The
assertion was checking the wrong shape. It now asserts the harm (`statuses ===
['running']`), and was confirmed red with the mutant still in place before being
accepted. This is the standing landmine restated: *a test asserting an ABSENCE is
the one most likely to be vacuous.*

## Gate

Typecheck clean. **953 tests across 63 files** (was 944), +9.
GUI batch **22/23**. `gui-75` red — **environmental, not a regression**, verified
by reproducing the identical `could not drive: the window lost focus during the
second turn` on **clean `main` (`47ad14d`) with this work stashed**. It is a
premise the driver could not establish, not a failed assertion, and nothing in
#85 touches window focus. `gui-61` was a **false red from the batch script's own
grep**, which matched the string `FAIL` inside the driver's fixture card text;
its exit code is 0.

## Out of scope, deliberately

Background tasks are still **not clickable** — they have no sidecar and no
transcript, and knowing who spawned a shell command does not give it one.
Nesting a background task under another background task is not measured and not
built. The Background section is **not** folded away; the owner chose the hybrid
explicitly over the all-into-the-tree option.

## Related

- [[decisions]]
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84, the measurement
  this rests on, and the ticket whose own predicted conclusion it falsified
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83, whose separate prop
  this keeps rather than reverses
- [[2026-07-25-agent-tree-edge-is-the-sidecar]] — declined this correlation for
  agents, on a trade that does not transfer to a task with no sidecar
- [[2026-07-25-agents-dock-disk-contract]] · [[active-work]] · [[pick-up]]
