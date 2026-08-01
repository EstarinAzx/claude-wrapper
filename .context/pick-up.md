---
type: pick-up
project: claude-wrapper
updated: 2026-08-01
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next ticket: #83

**#83 — "Surface live background tasks in the Agents dock, through an injected
port."** `ready-for-agent`, and **now unblocked** — #82 landed and closed, so its
only blocking edge is gone. It is the frontier and the only open ticket.

**Run the frontier query anyway.** This line is a snapshot and goes stale the
moment the owner files something. It is this project's standing lesson: a leg
once wrote that closing #70 would empty the queue and was wrong, because #71 had
been unblocked the whole time.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

If #83 is gone too, the next move is the owner's: file something, or run
`/preset init` (or `/preset vibe init` for an unattended funnel). Candidates are
already written down — `## Deferred (still no spec)` in [[active-work]] is the
menu, and `## Open questions` there holds the ones needing an answer first.

**Read [[2026-08-01-the-background-agents-seed-decided]] before starting #83** —
call 5 is its warrant, and its whole "amend, not reversal" argument rests on #81
having measured the level signal as a **second, independent source**. Then read
[[2026-08-01-a-refresh-must-not-blank-what-it-has]], because #83 edits the state
shape #82 just changed.

**#83's landmines, up front:**

- **It must be an INJECTED PORT, never an `EngineEvent`.** #81 measured a level
  event landing **3.3s after `result`**, where `finishTurn()` has already nulled
  `activeOnEvent` — so an `EngineEvent` is dropped in exactly the case the signal
  exists for. Shape it like #52's `onModelReport` and #73's `onTerminal`.
- **Do not touch the `local_agent` guard in `engine.ts`.** It is
  mutation-verified and it governs which *task messages become subagent rows and
  events*. The level signal is a **different source**; a background-tasks section
  fed from it amends rather than reverses, which is the entire reason call 5 was
  buildable at all. The Bash test must stay green.
- **Background tasks must NOT merge into the agent rows.** A `local_bash` task
  has no sidecar, no `parentToolUseId` and no usage — feeding it through
  `mergeAgents` re-creates the exact "a disk-only row starts claiming it used 0
  tokens" failure [[2026-07-25-agents-dock-disk-contract]] exists to prevent. Its
  own section.
- **The level speaks the edge stream's vocabulary** (`local_agent` /
  `local_bash`), not `BackgroundTaskSummary`'s friendly labels (`shell`,
  `subagent`, `monitor`, `workflow`) declared in the same `sdk.d.ts`.
- **A subagent is a background task from birth** — the `Agent` tool is ASYNC on
  this CLI, so the level will carry rows the Agents list already shows. Decide
  what that section does about them before writing it.
- **`keepStale` is now on the read, and #83 should leave it alone.** The trigger
  and the staleness policy were deliberately split so the level signal can
  replace the former without touching the latter.

## Landed last leg

**#82 — the Agents dock re-reads its sidecars on every turn end.** Merged as
`3f34737`, ticket closed. Gate green: typecheck clean, **921 tests across 62
files** (was 914), build ok. **The 22-driver GUI batch was re-run** because
renderer code changed — **all green**.

The defect was **a dependency that could only change once**: `useChat` writes
`setActiveSessionId` inside the `turn-end` branch, so `[sessionId]` moved
`null → id` on turn ONE and the dock's read effect was structurally incapable of
firing on turns 2..N — exactly the window where subagents spawn. The suite was
green throughout, because that effect *does* fire, just never twice.

The trigger is #80's `LastTurn` taken **whole** — outcome decides WHETHER, nonce
decides WHEN — and the read now carries a **`keepStale` flag**: a session change
clears first, a same-session re-read touches nothing until the new list is in
hand and keeps the last good rows even when the read fails.

Seven tests added — the suite's first `toHaveBeenCalledTimes` — and four mutants
killed. **No `gui-82` driver**: every surface is React state over a channel jsdom
already mocks.

See [[2026-08-01-a-refresh-must-not-blank-what-it-has]].

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #82:

- **A value written once per session cannot be the trigger for something that
  happens once per turn.** The failure is invisible to a green suite, because the
  effect fires — just not a second time. When a trigger is a dep, ask how many
  times that dep can change in the lifetime you care about.
- **An assertion that something SURVIVED is vacuous unless the thing it survives
  is shown to have happened.** The in-flight test asserts
  `toHaveBeenCalledTimes(2)` before asserting the rows are still there; without
  it, it passes just as well against a panel that never re-read.
- **A refresh must not blank what it already has.** `loading` before every read
  plus a merge that drops disk rows unless `status === 'ok'` means the tree shape
  flickers out and back on each refresh — and nested edges are disk-only, so the
  nesting goes with it.
- **The nonce is consumed on every outcome, and seeded at mount.** Skip the
  bookkeeping on outcomes that read nothing and a stale nonce fires later; skip
  the seed and opening the dock after a turn reads twice for one event.

Still true from #81: **a level event can land AFTER `result`**; **the `Agent` tool
is ASYNC and #27's blocking observation is stale**; **the join key works but
parentage is NOT in the payload** (reachable only via `taskToParent`); **the level
speaks `local_agent` / `local_bash`**; **a NEGATIVE is only a measurement if the
path was exercised**; **sidecars live at `<projectDir>/<sessionId>/subagents/`** —
copy `subagentsDir()`, never guess it.

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

`main` = `3f34737` + this leg's `.context` commit, pushed. No open branches.
**22** assertion drivers plus the observational `gui-scope-zoom-pill`, **22/22
green at `3f34737`**. `gui-75` failed its focus premise on the first pass of that
batch and was green on re-run — the documented flake, not a red.

## Do not decide these

**The seven are DONE.** The owner made a grant live on 2026-08-01 and all seven
of `.claude/vibe.md`'s parked calls were taken — that file's `## Needs you` is
**history now, not a queue**, and its `## Taken` section carries the resolutions.
Do not re-open them from the seed; four were decided *against* the seed's literal
words on the record's reasons, and a new **reason** reopens them, not a re-read.

**Two older halves still stand and are still the owner's:** Tailwind is **not
dropped** but the adopt-utilities question **stays open**, and the titlebar's
control count **does not change** while the aesthetic question **stays the
owner's**. **#83 was deliberately routed into the existing Agents dock so it does
not pre-empt that second one** — a fourth dock would have forced a fourth
titlebar control.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — **#82, and the state shape #83 inherits**
- [[2026-08-01-the-background-agents-seed-decided]] — **the grant; call 5 is #83's warrant**
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, the measurement #83 rests on
- [[2026-08-01-a-queued-prompt-is-a-flag-on-the-draft]] — #80, where `LastTurn` and its nonce came from
- [[2026-07-25-agents-dock-disk-contract]] — the `null` vs `[]` split #83 must not collapse
- [[2026-07-25-live-rows-two-sources-one-event]] — the mutation-verified `local_bash` exclusion #83 amends rather than reverses
- [[2026-07-25-agent-tree-edge-is-the-sidecar]] — why blanking the disk rows takes the tree with it
- [[2026-07-25-map-geometry-is-a-pure-slot-layout]] — the warrant that closed the labelled map and struck pan-zoom
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the injected-port shape #83 must use
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81; #82 added no driver and says why
- `.claude/vibe.md` — the 2026-08-01 run that filed #81, and the seven calls since taken
