---
type: decision
project: claude-wrapper
date: 2026-08-01
updated: 2026-08-01
tags: [context, decision]
---

# background_tasks_changed fires, and its ids join the edge stream

**Decision:** Spike #81 re-ran #27's harness against the **host** CLI with the
background path deliberately exercised, and **all three of the ticket's
authorising conditions held**. A background-tasks feature is therefore
**authorised**. This ticket still changed **no `src/`**, because every avenue for
surfacing it is named in its own Out of scope section — the authorisation is the
deliverable, the feature is a separate ticket.

**What was observed** — host CLI **2.1.220** (`C:\Users\S.D\.local\bin\claude.exe`,
resolved by importing the app's real `cli-path.ts`, not a copy of the walk), SDK
**0.3.220**, backend **wisped**. Two runs, identical shape both times; the second
run's summary is the one quoted on the ticket. Harness:
`scripts/spike-81-background-tasks.mjs`, ~20s per run.

| Condition | Held | Evidence |
|---|---|---|
| C1 — arrives on the stream | **yes** | 3 `background_tasks_changed` per run, under `engine.ts`'s exact options |
| C2 — ids relate to what the app holds | **yes** | the level's `task_id` **is** the `taskToParent` key **and** the `agent-<id>` sidecar id |
| C3 — a `task_type` other than `local_agent` | **yes** | two `local_bash` tasks joined the set |

## The seven findings

1. **It fires.** `{seq 24, ms 7884}`, `{seq 53, ms 13833}`, `{seq 70, ms 19171}`.
   #27's "never fired" was an **untested negative**, not a contradiction: the app
   never calls `backgroundTasks()` and nothing in #27's two turns could produce a
   background task.

2. **The level precedes the edge, 3/3, by one message and ~1ms.** The declaration
   calls the ordering unspecified ("in practice the level precedes them"); on this
   binary it did, every time. Observed, not guaranteed.

3. **REPLACE semantics confirmed.** Payloads carried 1, then 2, then 3 tasks —
   the full live set each time, never a delta.

4. **The join key works, three ways.** For the subagent:
   `background_tasks_changed.tasks[].task_id` === `task_started.task_id` ===
   the key `engine.ts` puts in `taskToParent` === the on-disk
   `agent-<id>.meta.json` id. One value, `a685b8039d6f1539e`, in all four places.
   **The declaration says "the payload carries ids only, so do not correlate it
   with the edge stream"** — what it withholds is *parentage inside the payload*,
   and that is true (no `tool_use_id`, no parent). The join itself held. Treat it
   as **observed, and reserved** — a consumer that needs parentage must reach it
   through `taskToParent`, which means it must have seen the `task_started`.

5. **`local_bash` rides the level too**, so the level shows work the Agents panel
   deliberately filters out. That is C3, and it is also why turning the level into
   panel rows is a **separate** decision — it reverses a mutation-verified
   exclusion ("reds the Bash test").

6. **The `Agent` tool is ASYNC on this CLI, and that is new since #27.** Its
   `tool_result` reads *"Async agent launched successfully"* and arrives ~12ms
   after the `tool_use`; turn A's `result/success` lands at ms 10106 while the
   subagent goes on emitting until ms 19172. **A subagent is a background task
   from birth** — it was already in the level payload before anything backgrounded
   it. `backgroundTasks()` returned `true` and produced **no** membership change,
   because the set was already correct.

7. **A level event lands AFTER `result`, and the app would drop it.** The third
   event arrives 3.3s past turn B's `result/success` (ms 19171 vs ms 15911).
   `finishTurn()` nulls `activeOnEvent` at `result`, so `emit()` reaches nobody.
   This is the ticket's Out-of-scope note **measured rather than assumed**: a
   background signal must be an **injected port** in the shape of #52's
   `onModelReport` and #73's `onTerminal`, never an `EngineEvent`.

**One vocabulary trap for whoever builds this.** The level's `tasks[].task_type`
carries the raw discriminants `local_agent` / `local_bash` — the same vocabulary
as the edge stream. `BackgroundTaskSummary.type`, declared in the same
`sdk.d.ts` and used by the `background_tasks?` fields elsewhere, documents
*friendly* labels ('shell', 'subagent', 'monitor', 'workflow'). Two different
vocabularies for the same idea; the level message speaks the edge stream's.

**Why:** the declaration promises a superset of what any given binary delivers,
and the app follows the **host** install rather than the lockfile's SDK, so only
the host binary can answer this. Naming the three conditions before the run (#78's
pattern) is what keeps "we measured it" from sliding into "so we built it".

**Reversibility:** these are observations, invalidated by a CLI upgrade. The
harness is committed and re-runs in ~20 seconds. **Measurement gap, unchanged
from #27: the native backend was not observed** — this ran wisped. The level is
CLI-local bookkeeping, so the backend *should* be irrelevant to whether it
emits; that is inference, not measurement.

**What stays the owner's.** No autonomy grant is live. This spike answers the
factual half of four parked calls in `.claude/vibe.md` → `## Needs you` — the
seed's meaning, the Agents-dock refresh trigger, whether non-agent background
work belongs in the panel, and injected-port-vs-`EngineEvent` — and settles none
of them.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-25-task-messages-confirmed-live-shape]] — #27, whose `background_tasks_changed` line this supersedes as **untested** rather than wrong
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the injected-port shape finding 7 requires
- [[2026-07-31-the-window-is-shown-before-the-app-exists]] — #78, the conditions-stated-in-advance pattern
