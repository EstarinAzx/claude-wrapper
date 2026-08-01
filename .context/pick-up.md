---
type: pick-up
project: claude-wrapper
updated: 2026-08-01
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next ticket: queue empty

**Nothing is open on the tracker — not one issue, in any state of triage.** #83
landed and closed this leg; it was the last of the two tickets the 2026-08-01
autonomy grant filed. No branches are open and `main` is pushed.

**Run the frontier query anyway.** This line is a snapshot and goes stale the
moment the owner files something. It is this project's standing lesson: a leg
once wrote that closing #70 would empty the queue and was wrong, because #71 had
been unblocked the whole time.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

**If it really is empty, the next move is the owner's.** File work, or run
`/preset init` (or `/preset vibe init` for an unattended funnel). The candidates
are already written down — `## Deferred (still no spec)` in [[active-work]] is the
menu, and `## Open questions` there holds the ones that need an answer first.

The most concrete unspec'd candidate is the one #83 deliberately left behind: the
**`taskToParent` join**, so a background task could nest under whatever spawned
it. #81 measured the level's `task_id` matching `task_started.task_id`, the
`taskToParent` key and the `agent-<id>` sidecar id — one value in four places —
but the payload carries **no `tool_use_id` and no parent**, so parentage is
reachable only where the `task_started` was seen. Treat that join as **observed
and reserved**, and give it its own ticket rather than growing anything into it.

## Landed last leg

**#83 — live background tasks in the Agents dock, through an injected port.**
Merged as `ea780a0`, ticket closed. Gate green: typecheck clean, **944 tests
across 63 files** (was 921/62), build ok. **The 23-driver GUI batch was re-run —
all green**, because this changed renderer code *and* added CSS.

Four choices, all structural:

- **A port, not an `EngineEvent`** — third of the shape after #52 and #73, but
  the case it protects is not an edge: #81 timed a level landing **3.3s past
  `result/success`**, and a task settling between turns is the NORMAL case for
  background work. The pins are therefore about WHEN a message arrives, not what
  it carries.
- **REPLACE, never accumulate**, at every layer. Mutation-verified.
- **The per-process reset lives in `engine.close()`**, not `makeEngine()` — four
  of the six discard paths rebuild *lazily*, so a reset at construction leaves a
  dead process's tasks on screen until the next send.
- **Its own section**, `local_agent` dropped from it, and the level branch placed
  **before** the fallthrough to `handleTaskMessage` so the mutation-verified
  guard is untouched.

Five mutants killed, 23 tests added. See
[[2026-08-01-a-level-is-replaced-not-accumulated]].

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #83:

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

`main` = `ea780a0` + this leg's `.context` commit, pushed. No open branches.
**22** assertion drivers plus the observational `gui-scope-zoom-pill`, **23/23
green at `ea780a0`**. `gui-75` passed first try inside the batch this time — the
documented focus flake is intermittent, not batch-deterministic, so do not treat
a future red there as expected without reading its `could not drive:` line.

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

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — **#83, shipped; the port, the reset site, and why the level is filtered rather than joined**
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82, the state shape #83 inherited and left alone
- [[2026-08-01-the-background-agents-seed-decided]] — the grant, now fully spent
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — #81, the measurement #83 rests on
- [[2026-07-25-agents-dock-disk-contract]] — the `null` vs `[]` split the separate section protects
- [[2026-07-25-live-rows-two-sources-one-event]] — the mutation-verified `local_bash` exclusion #83 amended rather than reversed
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the port shape, and the `close()` rule #83 deliberately inverts
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81
- `.claude/vibe.md` — the 2026-08-01 run that filed #81, and the seven calls since taken
