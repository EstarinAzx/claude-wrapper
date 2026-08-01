---
type: pick-up
project: claude-wrapper
updated: 2026-08-01
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next ticket: queue empty

**Nothing is open on the tracker — not one issue, in any state of triage.** #84
landed and closed this leg. `main` is pushed, no open branches.

**Run the frontier query anyway.** This line is a snapshot and goes stale the
moment the owner files something. It is this project's standing lesson: a leg
once wrote that closing #70 would empty the queue and was wrong, because #71 had
been unblocked the whole time.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

**If it really is empty, the next move is the owner's — and there is now exactly
one thing waiting on them.** #84 measured the ground for the background-task
nesting feature and proved it buildable **both ways**, so the build is blocked
only on a design call nobody but the owner can make: **what should nesting look
like?** See `## Do not decide these` below. Everything needed to build it the
moment that is answered is in
[[2026-08-01-the-spawner-is-one-hop-off-task-started]].

Other candidates as before: `## Deferred (still no spec)` in [[active-work]] is
the menu, `## Open questions` there holds the ones needing an answer first.

## Landed last leg

**#84 — measured whether a background task's spawner is reachable. It is, one
hop off where everyone was looking.** Landed as `335df49`, ticket closed.
Measurement only, **no `src/` change**. Gate green: typecheck clean, **944 tests
across 63 files** (baseline unchanged — scripts-only). The 23-driver GUI batch
was **not** triggered: no renderer code and no CSS changed.

Measured live on host CLI **2.1.220 / SDK 0.3.220**, backend `wisped`, 101
messages, by extending `scripts/spike-81-background-tasks.mjs` in place (+76).

- **A `local_bash` `task_started` carries `tool_use_id` (3/3) but no parent under
  any name.** The key set is exhaustive at eight fields, and the harness now
  records `Object.keys(msg)` for exactly that reason — *an absence is only a
  measurement if a differently-named field could have been seen.*
- **The owning agent IS reachable — on the `assistant` message carrying the Bash
  `tool_use` block**, as `parent_tool_use_id`. Proven at seq 90, and the control
  discriminates cleanly: agent-spawned bash → the agent's id, main-thread bash →
  `null`.
- **The ticket's own predicted conclusion was FALSIFIED.** #84 stated that a
  negative on the parent field would mean agent-nesting "is not buildable on the
  current stream model". It is buildable. The #68 pattern again — the probe
  falsified its own premise and the feature survived.
- **Turn C is why this is a measurement and not a guess.** #81's only bash came
  off the main thread, where there is no owner at all, so a missing parent there
  could not distinguish "absent" from "nothing to name".

See [[2026-08-01-the-spawner-is-one-hop-off-task-started]].

**Landed the leg before: #83** — live background tasks in the Agents dock through
a third injected port (`ea780a0`), REPLACE-never-accumulate, reset carried by
`engine.close()` rather than `makeEngine()` because four of six discard paths
rebuild lazily. See [[2026-08-01-a-level-is-replaced-not-accumulated]] — which
was **missing from `decisions.md`'s index** until this leg added it.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #84:

- **A field's absence is only a measurement if a differently-named field could
  have been seen.** Record `Object.keys(msg)`, not just the key you expected.
  #84's "no parent on `task_started`" is trustworthy *because* the key set came
  back exhaustive at eight fields.
- **Check whether your negative path was ever exercised.** #81 concluded nothing
  about bash parentage because its only backgrounded Bash ran on the main thread,
  where there is no owner — the same trap as #27's "never fired". A control that
  cannot distinguish "absent" from "nothing to name" measures nothing.
- **A ticket's stated implication can be wrong even when its stated observation
  is right.** #84 predicted Q1-positive/Q2-negative would kill agent-nesting; the
  observation held and the implication did not. Write the condition falsifiably
  and then actually check it against what you found.
- **Data captured is not data recorded.** #81's harness captured `tool_use_id` on
  every `task_started` from day one, but never printed it and wrote its evidence
  to a temp dir outside the repo on purpose — so the answer was produced and lost
  three times before anyone read it back.
- **`parent_tool_use_id` is on the `assistant` envelope, never on the `system`
  message.** `engine.ts:409` already reads it and `:419` returns immediately, so
  the `tool_use` blocks inside subagent messages are never inspected. Both halves
  of the join have always been in the process.

Still true from #83:

- **When hunting for the one place to put an invariant, check whether every path
  reaches your candidate EAGERLY.** `makeEngine()` is the single funnel for
  engine creation and was still the wrong site, because four of six discard paths
  rebuild lazily and a lazy rebuild is a window. `close()` is the funnel that
  holds.
- **Two ports on one lifecycle hook can want opposite things, and consistency
  between them is the bug.** `onTerminal` must never fire for `close()`;
  `onBackgroundTasks` firing there is the whole reset.
- **A signal whose dropped case is the NORMAL case needs its pin written about
  timing, not payload.** Every mid-turn test passes against a wrongly-wired
  `EngineEvent`; only the no-active-turn ones discriminate.
- **`nonAgentTasks` excludes only `local_agent`** — an unknown future
  `task_type` is kept, because an allow-list makes the panel lie by omission the
  first time the CLI grows a kind.
- **Render the raw `task_type`**, never `BackgroundTaskSummary`'s friendly
  labels; they ride a hook payload this app never registers.
- **`.background-tasks` depends on `.agents-dock` being a flex column with
  `min-height: 0`** — read, not assumed.

Still true from #82: **a value written once per session cannot trigger something
that happens once per turn**; **an assertion that something SURVIVED is vacuous
unless the thing it survives is shown to have happened**; **a refresh must not
blank what it already has**; **the nonce is consumed on every outcome and seeded
at mount**; **`keepStale` is on the read and #83 left it alone.**

Still true from #81: **a level event can land AFTER `result`**; **the `Agent`
tool is ASYNC and #27's blocking observation is stale**; **the join key works but
parentage is NOT in the payload**; **a NEGATIVE is only a measurement if the path
was exercised**; **sidecars live at `<projectDir>/<sessionId>/subagents/`** —
copy `subagentsDir()`, never guess it.

Still true: **the composer is never `disabled`** and the queue stays in
`InputBar`; **`lastTurn`'s nonce is load-bearing**; **`unqueue` releases the
commitment, never the text**; **a double flush is invisible to jsdom**; **an edge
between two samples is not observable by sampling**; **`resume` binds at query
CONSTRUCTION** and `warmUp` TAKES the target; **a stream dying BETWEEN turns
emits nothing**; **`win.isFocused()` alone is not "someone is looking"**;
**opening a past session CLOSES the engine** (reach `listModels()` /
`listCommands()` first); **a test asserting an ABSENCE is the one most likely to
be vacuous**; **no expected driver failure — any red is a real regression**; a
driver must ESTABLISH the state it asserts and be shown red first; **pins are
mutation-verified and no pin retirement is authorised**; **do not add a second
busy flag**; **never un-key the composer** and **anything workspace-scoped must
join the `ok` branch**; **main reports `getNormalBounds()`**;
`tests/scrollbar.test.ts` scans every line naming a scrollbar pseudo-element,
comments included; `gui-51` compares in **device** pixels; measure with
`getBoundingClientRect`, not screenshots; `.titlebar-center` must stay IN FLOW;
**`src/` is CRLF** and `.context/*.md` is LF; a new `window.api` channel needs
**all four** mock sites plus `preload/index.d.ts`; never hardcode a model name.

From #78, binding on anything that measures a launch: **Playwright cannot
measure a launch**; **`NODE_OPTIONS=--require` never reaches Electron** and
`addInitScript()` is too late — be the **entry point**; **`--disable-gpu` is
load-bearing in a background session**; **Chromium persists the zoom factor per
origin inside `userData`**, so an un-isolated launch is an inherited pass.

## Baseline

`main` = `335df49` + this leg's `.context` commit, pushed. No open branches.
**22** assertion drivers plus the observational `gui-scope-zoom-pill`, **23/23
green at `ea780a0`** — **not re-run at `335df49`, and correctly so**: #84 changed
only `scripts/` and `.context/`, no renderer code and no CSS, so the batch was not
triggered. `gui-75` passed first try inside the last batch — the documented focus
flake is intermittent, not batch-deterministic, so do not treat a future red there
as expected without reading its `could not drive:` line.

Test baseline holds at **944 across 63 files**, unchanged by #84 (measurement
only). `scripts/spike-81-background-tasks.mjs` is now **+76 lines** past what #81
ran; git history holds the original, and #81's findings are unaffected.

## Do not decide these

**The seven are DONE.** The owner made a grant live on 2026-08-01 and all seven
of `.claude/vibe.md`'s parked calls were taken — that file's `## Needs you` is
**history now, not a queue**, and its `## Taken` section carries the resolutions.
Do not re-open them from the seed; four were decided *against* the seed's literal
words on the record's reasons, and a new **reason** reopens them, not a re-read.
**Both tickets the grant filed have now landed (#82, #83), so the grant is
fully spent.**

**Two older halves still stand and are still the owner's:** Tailwind is **not
dropped** but the adopt-utilities question **stays open**, and the titlebar's
control count **does not change** while the aesthetic question **stays the
owner's**. **#83 honoured the second one** — it joined the existing Agents dock
rather than adding a fourth surface, which would have forced a fourth titlebar
control.

**NEW and the most actionable thing waiting on the owner — what should background
task nesting LOOK like?** #84 proved the data is there **both ways** (name the
spawning tool call, or nest under the spawning agent), so this is now the only
thing blocking a build ticket, and it is purely a design call. Three raised
defers from the 2026-08-01 vibe run sit in `.claude/vibe.md` → `## Needs you`,
all reversible, none taken irreversibly:

1. **Which reading of "spawner" did you mean?** #84 did *not* collapse this into
   a fact — both are buildable. Still a real choice.
2. **May parentage state be recorded for non-agent tasks at all?** No state was
   shipped; the spike renders nothing.
3. **What should nesting look like?** Deliberately not chosen. The agent tree's
   flat-with-a-depth precedent (`paddingLeft: depth * 14`, `aria-level`) is
   *available but unwarranted* here — it is stated for `AgentRow`s inside
   `buildAgentTree`, and background tasks deliberately never reach it
   ("A separate prop, never folded into liveAgents", `src/renderer/src/App.tsx:342`).
   Borrowing it would be a taste call wearing a citation.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — **#84, this leg; the spawner IS reachable, on the `assistant` envelope rather than `task_started`, and the ticket's own predicted conclusion was falsified**
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — **#83, shipped; the port, the reset site, and why the level is filtered rather than joined**
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82, the state shape #83 inherited and left alone
- [[2026-08-01-the-background-agents-seed-decided]] — the grant, now fully spent
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, the measurement #83 rests on
- [[2026-07-25-agents-dock-disk-contract]] — the `null` vs `[]` split the separate section protects
- [[2026-07-25-live-rows-two-sources-one-event]] — the mutation-verified `local_bash` exclusion #83 amended rather than reversed
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the port shape, and the `close()` rule #83 deliberately inverts
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81
- `.claude/vibe.md` — the 2026-08-01 run that filed #81, and the seven calls since taken
