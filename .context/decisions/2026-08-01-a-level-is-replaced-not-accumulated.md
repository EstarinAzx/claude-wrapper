---
type: decision
project: claude-wrapper
date: 2026-08-01
updated: 2026-08-01
tags: [context, decision, agents, engine]
---

# A level is replaced, not accumulated — and its reset belongs to the engine

**Decision:** #83 surfaces the CLI's live background-task set in the Agents dock
as **its own section**, fed by an **injected port** carrying the **whole set**
every time, and reset to empty by the **engine's own `close()`**. Four choices
inside that are load-bearing for anything built on this signal next.

Shipped at `ea780a0`. Warrant:
[[2026-08-01-the-background-agents-seed-decided]] calls 1, 3, 5 and 6;
measurement: [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]].

## 1. A port, not an `EngineEvent` — and the test says WHEN, not what

Third port of this shape, after #52's `onModelReport` and #73's `onTerminal`,
and the measurement behind it is the sharpest of the three: #81 timed a level
event landing **3.3s after `result/success`**, where `finishTurn()` has already
nulled `activeOnEvent`, so `emit()` reaches nobody.

What makes this one different from its two predecessors is that the dropped case
is not an edge — **a task settling between turns is the NORMAL case for
background work**. The signal exists to say "something is still running after
your turn finished".

The pin therefore had to be about **when the message arrives**, not what it
carries. Two tests deliver a level with no active turn: one after `warmUp()`
alone, one after a turn has fully resolved (`isBusy()` asserted false first).
Both would pass against the wrong wiring if they were merely mid-turn, which is
exactly the bug the ticket named.

## 2. REPLACE, never accumulate — stated as a test, not as a comment

The SDK declares the payload as the full live set and says why: pairing
`task_started` with a finish means one missed bookend wedges a stale "running"
indicator forever. So nothing in the chain merges. The engine hands each payload
over whole; `useChat` calls `setBackgroundTasks` with it directly.

**Mutation-verified**: making the renderer append (`[...prev, ...t]`) reds two
tests — a finished task that never leaves, and the section that never empties.
The comment on the line would not have caught it.

The reason a level is safe to consume this way is the same reason it must not be
merged with the edge stream: the two are **independent sources for one fact**,
and the level is the one that is self-correcting.

## 3. The per-process reset lives in `close()`, not at six call sites

The level is per-process — the SDK emits nothing at startup — so a set that
outlives its engine is a **permanently stale indicator**, and this app rebuilds
the engine constantly: workspace switch, model pick, permission cycle, backend
flip, targeting another session.

`makeEngine()` looked like the natural single funnel and is the **wrong** one.
Four of those paths set `engine = null` and rebuild **lazily on the next send**,
so resetting at construction leaves the dock showing a dead process's tasks from
the moment the user picks a model until the moment they next send.

`close()` is the funnel that actually holds: **all six paths call it** before
they drop or replace the engine. One line there covers every one, and it is
covered *by construction* rather than by a reviewer remembering — this codebase
has re-learned the "must join the `ok` branch by hand" failure enough times
(`pendingInsert`, the workspace-scoped App state) to prefer a structural answer.

Note the deliberate asymmetry with its neighbour: **`onTerminal` must NEVER fire
for `close()`** (main's teardown is not a death), while `onBackgroundTasks`
firing there **is the point** (nothing runs once the CLI is gone). Two ports, one
lifecycle hook, opposite rules — so neither can be "made consistent" with the
other without breaking one.

## 4. Its own section, and `local_agent` dropped from it

Not merged into the agent rows: a `local_bash` task has no sidecar, no
`parentToolUseId` and no usage, and `mergeAgents` would re-create the
"a disk-only row starts claiming it used 0 tokens" failure
[[2026-07-25-agents-dock-disk-contract]] exists to prevent.

This is also what keeps the ticket an **amend rather than a reversal**.
`engine.ts`'s `if (str(src.task_type) !== 'local_agent') return` governs which
**task messages become subagent rows and events** — a different source. The
level branch sits **before** the fallthrough to `handleTaskMessage`, so the level
never reaches that code at all; the guard is untouched and the Bash test stays
green. A pin asserts a level carrying a `local_agent` row emits **zero** subagent
events.

`local_agent` rows are dropped from the section itself, because the `Agent` tool
is async on this CLI and **a subagent is a background task from birth** — it is
in the level beside its own agent row, and rendering both is two names for one
piece of work. **Filtered by `task_type`, not joined**: the payload carries no
`tool_use_id` and no parent, so there is nothing to join on, and inventing a key
would be exactly the correlation #81 measured as absent.

Only `local_agent` is excluded. An unknown future `task_type` is **kept** — it is
still background work the user started, and an allow-list would make the panel
lie by omission the first time the CLI grows a kind.

## 5. The raw discriminant is rendered verbatim

`tasks[].task_type` carries `local_agent` / `local_bash`.
`BackgroundTaskSummary.type`, declared in the same `sdk.d.ts`, documents
`shell` / `subagent` / `monitor` / `workflow` — but it rides the **hook** payload,
and this app registers zero SDK hooks. Two vocabularies for one idea. Printing
`shell` where the CLI said `local_bash` would be showing the user an assumption
as a fact, so the section prints what arrived and a test pins that `shell` never
appears.

## Deliberate simplifications

- **The section is absent when empty, rather than showing a fourth empty state.**
  The dock already has three (loading / unreadable / none), and "nothing is
  running in the background" is the norm rather than news.
- **The rows are not interactive.** A background task has no sidecar, no
  transcript, and no parentage in the payload to reach one by — there is nothing
  to open, so they stay plain text instead of buttons that do nothing.
- **The set lives in `useChat`, not in `AgentsDock`.** The dock unmounts every
  time the panel closes and the level only re-fires when membership *changes*, so
  a set held in the component would be lost on close with no way back until the
  next task started or ended. Pinned by a close-and-reopen test.

## Why

The temptation with a signal that has both a level and an edge form is to join
them — the ids *do* match, which #81 confirmed. Resisting that is what keeps the
mutation-verified guard untouched and the two sources independent. The level
answers "what is running now" completely and self-correctingly; the edge stream
answers "which agent is this and whose child is it". Neither answer improves by
being mixed with the other, and the payload carries nothing to mix them *with*.

## Reversibility

- The port is one optional trailing parameter with a no-op default; an engine
  built without it is inert and pinned as such.
- `nonAgentTasks` is a pure one-liner — showing agents in the section again is a
  one-line change plus a test expectation.
- The section is a leaf render guarded by `tasks.length > 0`; deleting it leaves
  every other layer working.
- If the join to `taskToParent` is ever wanted, #81's finding stands: it is
  **observed and reserved**, reachable only when the `task_started` was seen, and
  it needs its own ticket rather than growing this one.

## Measurement gap, carried

**Nothing here was driven in a real window.** Like #82, every surface is React
state over a channel jsdom already mocks, so no `gui-83` driver was added — but
unlike #82, this ticket **did** add CSS (a footer strip in the dock), and jsdom
is blind to CSS. The strip's parent is a flex column with `min-height: 0`, which
was read rather than assumed, and the 23-driver batch was re-run green. A real
backgrounded Bash in a real window remains unobserved; `scripts/spike-81-background-tasks.mjs`
is what measures the signal end to end, at the CLI layer, in ~20s.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-08-01-the-background-agents-seed-decided]] — the warrant; calls 1, 3, 5, 6
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, the measurement every choice above rests on
- [[2026-07-25-live-rows-two-sources-one-event]] — the `local_agent` guard this amends rather than reverses
- [[2026-07-25-agents-dock-disk-contract]] — the null/empty split the separate section protects
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the port shape, and the `close()` rule this one deliberately inverts
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82, the state shape this inherited and left alone
