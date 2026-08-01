---
type: pick-up
project: claude-wrapper
updated: 2026-08-01
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## queue empty

**Nothing is open.** #81 landed and closed; `gh issue list --state open` returns
no rows of any kind — no tickets, no specs, no `ready-for-human` leftovers.

**Run the frontier query anyway.** This line is a snapshot and goes stale the
moment the owner files something. It is this project's standing lesson: a leg
once wrote that closing #70 would empty the queue and was wrong, because #71 had
been unblocked the whole time.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

If it really is empty, the next move is the owner's: file something, or run
`/preset init` (or `/preset vibe init` for an unattended funnel). Candidates are
already written down — `## Deferred (still no spec)` in [[active-work]] is the
menu, and `## Open questions` there holds the ones needing an answer first.

**The one deferred item that now has a measurement behind it is the
background-tasks feature** — #81 authorised it and built none of it. Its shape is
already constrained; see the landmines below before speccing it.

## Landed last leg

**#81 — a spike, and its correct outcome was an empty `src/` diff.** Merged as
`002e524`, ticket closed. Gate green: typecheck clean, **914 tests across 62
files** (unchanged), build ok. The **driver batch was not re-run**, deliberately:
no `src/`, no CSS and no renderer code changed, so no driver is implicated.

**`background_tasks_changed` FIRES.** Host CLI **2.1.220** / SDK **0.3.220**,
wisped, two runs identical in shape. All three authorising conditions held —
it arrives under `engine.ts`'s exact options; its `task_id` is the *same value*
as `task_started.task_id`, the `taskToParent` key and the `agent-<id>` sidecar
id; and `local_bash` rides it, so the level shows work the Agents panel filters
out.

**#27's "never fired" was an untested negative**, not a wrong reading: the app
never calls `backgroundTasks()`, and nothing in #27's two turns could have
produced a background task.

**A build is authorised. This ticket still built nothing**, because every avenue
for surfacing it is named in its own Out of scope section. No autonomy grant is
live, so the seven calls in `.claude/vibe.md` → `## Needs you` all stand — #81
answers the factual half of four of them and settles none.

Harness: `scripts/spike-81-background-tasks.mjs`, ~20s a run.
See [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]].

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #81:

- **A level event can land AFTER `result`** (measured, 3.3s past it), where
  `finishTurn()` has already nulled `activeOnEvent`. An `EngineEvent` is dropped
  **in exactly the case the signal exists for** — it must be an injected port,
  the shape of #52's `onModelReport` and #73's `onTerminal`.
- **The `Agent` tool is ASYNC on this CLI and #27's blocking observation is
  stale.** *"Async agent launched successfully"* ~12ms after the `tool_use`, and
  the turn's `result/success` arrives while the subagent still runs. **A subagent
  is a background task from birth**; `backgroundTasks()` returns `true` while
  changing no membership.
- **The join key works but parentage is NOT in the payload.** The SDK's *"do not
  correlate it with the edge stream"* means no `tool_use_id` and no parent ride
  along — the `task_id` itself matched in four places. Parentage is reachable
  only through `taskToParent`, i.e. only if the `task_started` was seen.
  Observed and **reserved**, not guaranteed.
- **The level speaks the edge stream's vocabulary** (`local_agent` /
  `local_bash`), not `BackgroundTaskSummary`'s friendly labels (`shell`,
  `subagent`, `monitor`, `workflow`) declared in the same `sdk.d.ts`.
- **A NEGATIVE is only a measurement if the path was exercised.** Before citing
  an absence, ask what in that run could have made the thing appear.
- **Sidecars live at `<projectDir>/<sessionId>/subagents/`** — exactly where
  `subagent-store.ts` reads. A flat scan of the project dir finds zero and looks
  like a CLI regression. Copy `subagentsDir()`, never guess it.

Still true: **the composer is never `disabled`** and the queue stays in
`InputBar`; **`lastTurn`'s nonce is load-bearing**; **`unqueue` releases the
commitment, never the text**; **a double flush is invisible to jsdom**; **an edge
between two samples is not observable by sampling**; **`resume` binds at query
CONSTRUCTION** and `warmUp` TAKES the target; **a stream dying BETWEEN turns
emits nothing**; **`onTerminal` must never fire for `close()`**;
**`win.isFocused()` alone is not "someone is looking"**; **opening a past session
CLOSES the engine** (reach `listModels()` / `listCommands()` first); **a test
asserting an ABSENCE is the one most likely to be vacuous**; **no expected driver
failure — any red is a real regression**; a driver must ESTABLISH the state it
asserts and be shown red first; **pins are mutation-verified and no pin
retirement is authorised**; **do not add a second busy flag**; **never un-key the
composer** and **anything workspace-scoped must join the `ok` branch**; **main
reports `getNormalBounds()`**; `tests/scrollbar.test.ts` scans every line naming
a scrollbar pseudo-element, comments included; `gui-51` compares in **device**
pixels; measure with `getBoundingClientRect`, not screenshots;
`.titlebar-center` must stay IN FLOW; **`src/` is CRLF** and `.context/*.md` is
LF; a new `window.api` channel needs **all four** mock sites plus
`preload/index.d.ts`; never hardcode a model name.

From #78, binding on anything that measures a launch: **Playwright cannot
measure a launch**; **`NODE_OPTIONS=--require` never reaches Electron** and
`addInitScript()` is too late — be the **entry point**; **`--disable-gpu` is
load-bearing in a background session**; **Chromium persists the zoom factor per
origin inside `userData`**, so an un-isolated launch is an inherited pass.

## Baseline

`main` = `002e524` + this leg's `.context` commit, pushed. No open branches.
**22** assertion drivers plus the observational `gui-scope-zoom-pill`, last
22/22 green at `1855910`; **not re-run for #81** because it changed no app code.

## Do not decide these

**Seven owner calls are parked and LIVE** in `.claude/vibe.md` → `## Needs you`,
filed 2026-08-01 with **no autonomy grant** — unlike the 2026-07-31 batch,
"this is the owner's call" is a legitimate ground for deferring here. #81 answers
the factual half of four (the seed's meaning, the Agents-dock refresh trigger,
whether non-agent background work belongs in the panel, injected-port-vs-
`EngineEvent`) and **settles none**. The other three: the node-box map, a new
top-level surface, and what "map pan-zoom" was meant to solve.

**Two older halves also stay open:** Tailwind is **not dropped** but the
adopt-utilities question **stays open**, and the titlebar's control count **does
not change** while the aesthetic question **stays the owner's**.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81
- [[2026-08-01-a-queued-prompt-is-a-flag-on-the-draft]] — #80
- [[2026-07-31-the-window-waits-until-it-knows-where-to-be]] — #79
- [[2026-07-31-the-window-is-shown-before-the-app-exists]] — #78, whose
  conditions-stated-in-advance pattern #81 reused
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the injected-port
  shape #81 measured a second reason for
- [[2026-07-25-task-messages-confirmed-live-shape]] — #27, whose
  `background_tasks_changed` line #81 supersedes as **untested** rather than wrong
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74 to the
  launch line, #75 to focus, #76 to an expired skip reason, #77 to setup order,
  #78 to the launch profile, #79 to a pristine `userData`, #80 to the two
  premises a queued-send driver has to establish, and #81 to a harness that has
  to exercise the path before its negative means anything
- `.claude/vibe.md` — the 2026-08-01 run that filed #81, and its seven live defers
