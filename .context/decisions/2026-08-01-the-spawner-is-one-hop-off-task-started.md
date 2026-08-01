---
type: decision
project: claude-wrapper
date: 2026-08-01
updated: 2026-08-01
tags: [context, decision]
---

# A background task's spawner is reachable, one hop off `task_started`

**#84, measurement only — no `src/` change.** Measured live on host CLI
**2.1.220 / SDK 0.3.220**, backend `wisped`, by an extended
`scripts/spike-81-background-tasks.mjs` (three turns, 101 messages).

**Finding:** a `local_bash` `task_started` carries `tool_use_id` but **no parent
of any name**. The owning agent is nevertheless recoverable — it is on the
**`assistant` message that contains that Bash `tool_use` block**, as
`parent_tool_use_id`. So parentage is one hop away from where you would look for
it, and both readings of "nest under its spawner" are buildable.

## What was measured

Three turns, deliberately including the case #81 never ran — a backgrounded Bash
spawned *inside* a subagent. #81's only bash came off the main thread, where
there is no owning agent, so a missing parent there could not have distinguished
"absent" from "nothing to name".

| Question | Result |
|---|---|
| **Q1** — does a non-agent `task_started` carry `tool_use_id`? | **yes, 3/3** |
| **Q2** — does it name an owning agent? | **no, 0/3** |
| **Q2′** — is a parent hiding under another key? | **no** — the key set is exhaustive (below) |
| **Q3** — is the parent reachable anywhere? | **yes** — on the containing `assistant` message |

A `local_bash` `task_started` carries exactly eight keys, with no room for a
parent to hide:

```
description, session_id, subtype, task_id, task_type, tool_use_id, type, uuid
```

(`local_agent` carries those plus `prompt` and `subagent_type`.) The spike
records `Object.keys(msg)` for exactly this reason — an absence is only a
measurement if a differently-named field could have been seen.

**The attribution is proven, not inferred.** The turn-C Bash `tool_use`
(`toolu_014J…`) appears at seq 90 inside an `assistant` message whose
`parent_tool_use_id` is `toolu_01R2…` — the turn-C Agent's own `tool_use` id.
The control discriminates cleanly:

| `tool_use` | tool | `parent_tool_use_id` |
|---|---|---|
| turn A agent | `Agent` | `null` (top-level) |
| turn A bash | `Bash` | turn A agent |
| turn B bash | `Bash` | `null` (main thread) |
| turn C agent | `Agent` | `null` (top-level) |
| turn C bash | `Bash` | turn C agent |

Agent-spawned bash → the agent's id. Main-thread bash → `null`. Two of the three
background bash tasks were agent-spawned and both attribute correctly.

## The join, in full

Three hops, every one of them on a message `engine.ts` already receives:

1. `background_tasks_changed.tasks[].task_id` — the rows the panel renders.
2. `task_started` — gives `task_id` → `tool_use_id` (the **Bash call**).
3. the `assistant` message carrying that `tool_use` block — gives
   `parent_tool_use_id` (the **owning agent**, or `null` for the main thread).

Hop 3 is the one nobody had looked at. `engine.ts:409` already reads
`parent_tool_use_id` off exactly these messages — but `:419` returns immediately
after bucketing the subagent presence event, so the `tool_use` blocks inside are
never inspected. Both halves of the join are already in the process and have
never been introduced to each other.

## This ticket's own predicted conclusion was WRONG, and the measurement caught it

#84 stated its authorising condition up front, and one branch read:

> "(1) positive, (2) negative → only 'name the spawning **tool call**' is
> reachable. 'Nest under the spawning **agent**' is not buildable on the current
> stream model, and the owner's choice collapses into a fact."

The observed result **is** (1) positive / (2) negative — and the stated
implication is **false**. Agent-nesting is buildable; it just does not read the
field the ticket assumed it would have to. Recorded prominently rather than
quietly restated, because the ticket was written to be falsifiable and was
falsified. This is the #68 pattern again: "The probe falsified its own premise
and the feature survived."

**Consequence for the owner's open question:** the choice between "name the
spawning tool call" and "nest under the spawning agent" does **not** collapse
into a fact. Both are reachable, so it remains a real decision, and it is still
the owner's.

## What this does NOT authorise

- **No build.** #84 ships no `src/` change and this ADR is its whole deliverable.
- **No visual form.** Still an open owner decision, and it blocks any build
  ticket. The agent tree's flat-with-a-depth precedent is stated for `AgentRow`s
  inside `buildAgentTree`, which background tasks deliberately never reach
  ("A separate prop, never folded into liveAgents" — `src/renderer/src/App.tsx:342`).
- **No pin retirement.** In particular a build must keep agent-row emission gated
  to `local_agent`: membership in `taskToParent` doubles as the accept-list
  (`engine.ts:300-303`), so recording bash parents *into that map* would make the
  lookup at `:368` succeed for a bash `task_notification` and red
  `tests/engine.test.ts:954`. The data structure that avoids this is left open —
  a second map is one option, not a requirement.
- **The `local_agent` exclusion in `nonAgentTasks` is untouched.** Its reason is
  duplication, not parentage.

## Caveats

- **Hop 3 is the correlation `2026-07-25-agent-tree-edge-is-the-sidecar.md` §1
  declined** — "It was declined because it costs engine work, a second
  correlation table and a new failure mode". It declined it *for agents*, on the
  ground that the sidecar supplies the same edge a few seconds later. **A
  background task has no sidecar**, so that trade does not transfer: there is no
  later. The ADR also names its own revisit condition ("exactly the thing to
  revisit if nesting ever stops being rare").
- **Backend was `wisped`.** The host binary is the real Claude Code 2.1.220 and
  the task/system message shapes are the CLI's, not the model provider's, so this
  should not affect the finding — but it is recorded rather than assumed.
- **One run, one binary.** Per `cli-path.ts` the app follows the host install, so
  this finding is falsifiable by a CLI upgrade. Re-running the spike is cheap.
- **`scripts/spike-81-background-tasks.mjs` was extended in place** by this
  ticket (+76 lines): it now captures `parent_tool_use_id` and the full key set,
  prints the `tool_use_id` it had always captured but never surfaced, and adds
  turn C. #81's findings are unaffected; git history holds the original.

## Related

- [[decisions]]
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, which
  captured `tool_use_id` at line 163 from the start but never printed it, and
  whose evidence sink is a temp dir outside the repo, so the answer was written
  once and lost
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83, which reserved this
  join and filtered by `task_type` rather than joining
- [[2026-07-25-agent-tree-edge-is-the-sidecar]] — declined hop 3 for agents, on a
  trade that does not transfer to a task with no sidecar
- [[active-work]] · [[pick-up]] · `.claude/vibe.md`
