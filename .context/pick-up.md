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
**and #85** landed and closed. `main` is pushed, no open branches.

**The background-task nesting line of work is COMPLETE.** #84 measured it, the
owner answered both blocking calls, #85 shipped it. Nothing is parked on it.

**Run the frontier query anyway.** This line is a snapshot and goes stale the
moment the owner files something. It is this project's standing lesson: a leg
once wrote that closing #70 would empty the queue and was wrong, because #71 had
been unblocked the whole time.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

**If it really is empty, the next move is the owner's.** `## Deferred (still no
spec)` in [[active-work]] is the menu, and `## Open questions` there holds the
ones needing an answer first. The two older halves in `## Do not decide these`
below are still parked and still the owner's.

## Landed last leg

**#85 — agent-spawned background tasks now nest under their spawner.** Landed as
`3e24a53`, ticket closed. The owner answered both blocking calls (nest under the
spawning **agent**; **hybrid** with the Background section as fallback), and the
hybrid is the shape of the data rather than a compromise — #84 measured 2 of 3
tasks parented and 1 not.

- **Two new maps, and `taskToParent` is deliberately not one of them** — its
  membership doubles as the accept-list keeping Bash out of the agent panel.
- **`toolUseToAgent` is filled where `handleMessage` already held the parent and
  was stepping over it** — `:419` returns before anything looks inside a
  subagent's message, so its `tool_use` blocks were never associated with it.
- **`taskIdToAgent` is filled BEFORE the `local_agent` gate**, because a
  backgrounded Bash is exactly what that gate turns away. Mutation-verified.
- **Nesting is a RENDER concern**, so #83's separate prop is **kept, not
  reversed**: `buildAgentTree`, `flattenAgentTree`, `AgentRow` and `mergeAgents`
  are untouched and a shell command still never claims agent usage.
- **Five mutants killed — and one killed a bad test first.** See landmines.

953 tests (+9). See [[2026-08-01-nesting-happens-in-the-render-not-the-model]].

**Landed the leg before: #84 — measured whether a background task's spawner is
reachable. It is, one hop off where everyone was looking.** `335df49`, closed.
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

Full ledger in [[active-work]] — long and load-bearing. New from #85:

- **A mutant can kill a BAD TEST before it kills the code — and that is the most
  valuable thing mutation testing does here.** #85's check that a bash task never
  becomes an agent row **passed against the broken code**: widening the
  accept-list does not create a row keyed to the bash task, it resolves that
  task's parent to the **AGENT** and terminates the agent early. The assertion
  was checking the wrong shape entirely. **Assert the harm, not the shape**, and
  confirm the fixed assertion reds with the mutant still in place.
- **Before calling a driver red, reproduce it on clean `main` with the work
  stashed.** `gui-75` failed 3/3 here and looked deterministic; it fails
  identically at the baseline commit. A `could not drive:` line is a premise the
  driver could not establish, which is a different animal from a failed
  assertion.
- **A batch script's own grep can manufacture a red.** `gui-61` "failed" because
  the pattern matched the string `FAIL` inside the driver's *fixture card text*.
  Judge drivers by **exit code**, never by scraping their stdout.
- **When a guard turns your case away, record before the guard, not after.**
  `taskIdToAgent` must be written ahead of the `local_agent` early return —
  writing after it is the plausible-looking version that silently never fires.
- **Nesting can be a render concern.** Keeping `buildAgentTree` / `AgentRow` /
  `mergeAgents` untouched let #85 honour #83's separate prop rather than reverse
  it — a shell command renders as a child without ever claiming agent semantics.

Still true from #84:

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

`main` = `3e24a53` + this leg's `.context` commit, pushed. No open branches.
Test baseline is now **953 across 63 files** (#85 added 9; #84 added none).

**22** assertion drivers plus the observational `gui-scope-zoom-pill`. Batch re-run
at `3e24a53` (renderer + CSS changed): **22 green, `gui-75` red**. That red is
**environmental and NOT a regression** — verified by reproducing the identical
`could not drive: the window lost focus during the second turn` on **clean `main`
(`47ad14d`) with the work stashed**. It is a premise the driver could not
establish, not a failed assertion. It failed 3/3 here, so **the documented focus
flake is not always intermittent in a background session** — but still read the
`could not drive:` line, and still reproduce on clean main before blaming a
change.

**Judge drivers by exit code.** A batch script grepping stdout for `FAIL` reports
`gui-61` red on its own fixture card text (`"Bashnpm testFailed: FAIL
tests/auth.test.ts…"`); its exit code is 0.

`scripts/spike-81-background-tasks.mjs` is **+76 lines** past what #81 ran; git
history holds the original, and #81's findings are unaffected.

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

**The three defers from the 2026-08-01 vibe run are ANSWERED and SPENT.** The
owner took all three on 2026-08-01 — nest under the spawning **agent**, record
parentage for non-agent tasks (implied by the first), and the **hybrid** visual
form. #85 shipped exactly that. `.claude/vibe.md` → `## Needs you` keeps them
with their reasoning for the trail; **that section is history now, not a queue**,
apart from the two carried halves above.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — **#85, this leg; the hybrid, the two maps, why #83's separate prop survived, and the mutant that killed a bad test**
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — **#84; the spawner IS reachable, on the `assistant` envelope rather than `task_started`, and the ticket's own predicted conclusion was falsified**
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — **#83, shipped; the port, the reset site, and why the level is filtered rather than joined**
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82, the state shape #83 inherited and left alone
- [[2026-08-01-the-background-agents-seed-decided]] — the grant, now fully spent
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, the measurement #83 rests on
- [[2026-07-25-agents-dock-disk-contract]] — the `null` vs `[]` split the separate section protects
- [[2026-07-25-live-rows-two-sources-one-event]] — the mutation-verified `local_bash` exclusion #83 amended rather than reversed
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the port shape, and the `close()` rule #83 deliberately inverts
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81
- `.claude/vibe.md` — the 2026-08-01 run that filed #81, and the seven calls since taken
