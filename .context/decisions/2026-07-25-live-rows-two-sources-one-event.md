---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# Live agent rows: two sources, one event, and absent-not-zero end to end

**Decision:** #30 made the Agents panel live by giving `handleMessage` the
`type: 'system'` branch it never had, and **widening** the existing `subagent`
event rather than adding a second one. Four choices inside that are load-bearing
for #31 and #33.

**1. Two sources upsert one key; neither owns the row.** `task_started` creates
the row (earliest possible — before any output exists, with `description` and
`subagent_type` attached), and the old `parent_tool_use_id` bucketing stays as
the presence floor. Both emit the same event keyed by the spawning `Agent`
tool_use id, so whichever lands first creates the row and the second is a no-op.
The fallback branch was never removed, so a CLI that stops emitting task
messages degrades to presence-only instead of to an empty panel.

**2. `taskToParent` is the bash filter, not just a lookup.** The map
(`task_id` → spawning tool_use id) exists because `task_progress` /
`task_updated` carry `task_id` alone for a nested agent. It is populated **only**
by a `task_started` whose `task_type === 'local_agent'`, and every later task
message is dropped unless its `task_id` is already in the map. That single gate
does the `local_bash` filtering too — backgrounded Bash calls ride the same
stream with their own short task ids and simply never register. Filtering on the
map rather than re-checking `task_type` per message matters because
`task_progress`/`task_updated` do not carry `task_type` at all.

**3. Absent stays absent across all three layers.** Engine (`assignDefined`
copies only supplied fields), merge (`mergeAgents` omits the key rather than
writing `undefined`), render (segments test `!== undefined`, not truthiness). A
disk-only row therefore shows no usage line while a live agent that genuinely ran
zero tools shows "0 tools". Both halves are mutation-verified: making the engine
write `?? 0` reds the absent-usage tests, and opening the `local_agent` filter
reds the Bash test.

**4. Terminal state is guarded in both directions.** Only a status outside
`NON_TERMINAL` (`running`/`pending`/`in_progress`/`queued`) closes a row, so a
future non-terminal `task_updated` patch cannot read as "finished" — today's CLI
only ever sends a terminal one, and the guard is what keeps that an observation
rather than an assumption. Conversely an agent already settled by its task
message is removed from the open set, so the abort/error/close drain does not
re-fail a completed agent.

**Deliberate simplification:** elapsed time is the CLI's own `duration_ms`,
rendered as given — no local timer and no re-render clock. Ceiling: the number
freezes between progress ticks (~2.5–3s) and after completion shows final
elapsed, which is the correct reading anyway. Upgrade path if a smooth clock is
ever wanted: tick locally from the last `duration_ms` plus wall time since it
arrived, only while `status === 'running'`.

**Why:** The spec asked for one event type; the temptation with four new message
kinds is a second, richer event and a second list. Widening kept the inline
Task-card row and the drawer working untouched, and kept one correlation key
across live stream, disk sidecars and the drawer. Zero-filling absent usage would
have been three lines shorter and would have quietly destroyed the distinction
#28 built the `null`-vs-`[]` split to preserve.

**Reversibility:** The event widening is additive — every new field is optional,
so any consumer reading only `parentToolUseId` + `status` is unaffected. The
`local_agent` gate is one line if bash tasks ever want their own surface.
`mergeAgents` is pure and unit-tested, so the merge policy can be changed without
touching the engine.

## For #31 (nested agents)

- The tree **cannot** come from forwarded traffic
  ([[2026-07-25-task-messages-confirmed-live-shape]] finding 6). `taskToParent`
  is the natural place to hang the parent edge.
- `subagentEvent()` is the single builder for the widened event — add nested
  fields there and they reach the panel for free.
- `tests/engine.test.ts > engine task messages` holds the real wire shapes as
  runnable fixtures; reuse them rather than re-deriving from the spike comment.

## Related

- [[decisions]]
- [[2026-07-25-task-messages-confirmed-live-shape]] — the spike this implements
- [[2026-07-25-agents-dock-disk-contract]] — the disk half of the merged list
- [[active-work]] · [[pick-up]]
