---
type: active-work
project: claude-wrapper
updated: 2026-08-02
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-02 by Opus 5 (1M) (auto) — **relay leg 1 landed #87; the queue is NOT dry (#88, #89)**_
_At commit: `75f1db9` on `main`, pushed. Gate green: typecheck clean, **953 tests across 63 files**, unchanged by this leg — #87 is measurement-only with no `src/` change_
_Driver check: **not run this leg, and not implicated.** #87 touched only `scripts/`; no renderer code and no CSS, so the GUI batch has nothing to observe. Last full run was 23/23 green at `ea780a0`. No standing red anywhere, so any red is a real regression._

## Current focus

**#88 and #89 are open, `ready-for-agent`, and mutually unblocked — take #88 next
(lowest id).** #87 landed and closed; #86 remains `ready-for-human` and is not
loop work.

**#87 measured Feature A dead, and on a stronger ground than the one that blocked
it.** The question was whether an extended-thinking block ever reaches the app.
It does — on the app's own options, with no thinking config set at all — and its
`thinking` field is **empty**: 0 characters in all five configs, with only
`signature` populated at 756–952 chars. So a collapsed thinking strip has nothing
to render, **independently of #86's UI constraints**: even with a surface granted
and owner call 1 answered, it would draw an empty string. Owner call 2 (does a
thinking strip owe the tool card's DOM-exclusion contract) is moot for want of a
subject. See [[2026-08-02-the-thinking-block-arrives-empty]].

The one open thread on it is **not code**: the measurement is on the `wisped`
path, and the native path is unmeasurable on this machine — with the wisp vars
stripped by the app's own `resolveSpawnEnv`, the host CLI answers `Not logged in
· Please run /login`. `SPIKE87_BACKEND=native SPIKE87_ONLY=control-app-options`
closes it after a human logs in.

| # | Ticket | State |
|---|---|---|
| ~~#87~~ | ~~spike: does an extended-thinking block ever reach the app?~~ | `75f1db9`, **closed** — measurement only |
| #88 | spike: is MCP server status non-empty, and does it change between turns? | open, `ready-for-agent` — **next** |
| #89 | The session-listing comment claims this app writes `sdk-ts`; there are zero such records | open, `ready-for-agent` |
| #86 | Three seeded features, three unmeasured premises | open, `ready-for-human` — **not loop work** |

**Two landmines from #87 that generalise to any future spike:**

**`result.subtype` is `'success'` on a failed turn.** The first native control
returned `subtype: 'success'` twice while every assistant message was the
synthetic text `Invalid API key`. `is_error` is the field that says so. A spike
that reads only `subtype` reports a clean zero for a config that never reached a
model — indistinguishable from a real negative.

**Unsetting `ANTHROPIC_BASE_URL` by hand is not native mode.** It leaves
`ANTHROPIC_API_KEY` in place, so the CLI takes the gateway's key to the real
endpoint and every turn comes back `Invalid API key`. `backend-mode.ts` strips
**three** `WISP_KEYS`; import its `resolveSpawnEnv` rather than approximating it,
for the same reason spikes import `cli-path.ts` rather than copying the PATH walk.

## Previously (the #84/#85 nesting line, complete)

**Nothing is parked on it.** #84 and #85 both landed and closed.

The arc, because it is the useful part: a second unattended `/preset vibe init`
run took the `taskToParent` join #83 reserved and filed **#84** as a
measurement-only spike. #84 found a `local_bash` `task_started` carries
`tool_use_id` but **no parent under any name** (key set exhaustive at eight
fields) — while the owning agent sits **one hop away**, on the `assistant` message
carrying that Bash `tool_use` block. **#84's own predicted conclusion was
falsified by its own measurement**: it had stated that a negative there would kill
agent-nesting, and it does not. So the owner's choice did not collapse into a
fact; they then answered it directly (**nest under the spawning agent**, **hybrid**
with Background as fallback), and **#85** shipped it. See
[[2026-08-01-the-spawner-is-one-hop-off-task-started]] and
[[2026-08-01-nesting-happens-in-the-render-not-the-model]].

| # | Ticket | State |
|---|---|---|
| ~~#82~~ | ~~The Agents dock re-reads its sidecars every turn, without blanking what it already has~~ | `3f34737`, **closed** |
| ~~#83~~ | ~~Surface live background tasks in the Agents dock, through an injected port~~ | `ea780a0`, **closed** |
| ~~#84~~ | ~~Measure whether a background task's spawner is reachable on the wire~~ | `335df49`, **closed** — measurement only |
| ~~#85~~ | ~~Nest agent-spawned background tasks under their spawning agent~~ | `3e24a53`, **closed** |

They were serialised rather than run beside each other because both edit
`AgentsDock`'s state shape. #83 inherited the shape #82 changed and, as its
ticket asked, left `keepStale` alone.

**#83 shipped the background-tasks section, and its four choices are all
structural rather than stylistic.**

The **port** is the third of its shape (`onModelReport` #52, `onTerminal` #73),
but the case it protects is not an edge: #81 timed a level landing **3.3s after
`result/success`**, and **a task settling between turns is the NORMAL case** for
background work. So the pins are about WHEN a message arrives, not what it
carries — two tests deliver a level with no active turn, one after `warmUp()`
alone and one after a turn has fully resolved.

**REPLACE, never accumulate**, end to end. Mutation-verified: making the renderer
append reds two tests (a finished task that never leaves, a section that never
empties).

**The per-process reset lives in the engine's own `close()`.** `makeEngine()`
looked like the single funnel and is the wrong one — four of the six discard
paths set `engine = null` and rebuild **lazily on the next send**, so a reset at
construction leaves a dead process's tasks on screen from the model pick until
the next send. All six paths call `close()`. Note the deliberate inversion:
`onTerminal` must NEVER fire for `close()`, `onBackgroundTasks` firing there IS
the feature.

**Its own section, and the guard untouched.** The level branch sits BEFORE the
fallthrough to `handleTaskMessage`, so a `local_agent` row in a level emits zero
subagent events — pinned. `local_agent` is dropped from the section too (the
Agent tool is async, so a subagent is in the level beside its own agent row),
filtered by `task_type` rather than joined because the payload carries nothing to
join on.

See [[2026-08-01-a-level-is-replaced-not-accumulated]].

**#82 landed: the dock re-reads on every turn end.** The defect was **a
dependency that could only change once** — `useChat` writes `setActiveSessionId`
**inside the `turn-end` branch**, so `[sessionId]` moves `null → id` on turn ONE
and the read effect was **structurally incapable of firing** on turns 2..N,
exactly the window where subagents spawn. The suite was green throughout, because
that effect *does* fire — just never twice.

The trigger is #80's `LastTurn` taken **whole**: the outcome decides WHETHER, the
nonce decides WHEN, and never `busy === false`. The read now carries a
**`keepStale` flag**, because a session change and a same-session re-read want
opposite things done to what is already on screen — `false` clears first, `true`
is stale-while-revalidate and keeps the last good rows even when the read fails.
Seven tests added (the suite's first `toHaveBeenCalledTimes`), four mutants
killed, **no `gui-82` driver** because every surface is React state over a channel
jsdom already mocks.

See [[2026-08-01-a-refresh-must-not-blank-what-it-has]].

**#83 became buildable only because #81 measured a second source.** The
mutation-verified `local_agent` guard governs which *task messages become
subagent rows and events*; the level signal is independent of it, so a separate
section fed from the level **amends** rather than reverses — the guard is never
touched and the Bash test stays green.

See [[2026-08-01-the-background-agents-seed-decided]].

| # | Ticket | Landed |
|---|---|---|
| ~~#75~~ | ~~Turn-end notification + taskbar flash when unfocused~~ | `9905e1d` |
| ~~#76~~ | ~~`gui-48`: drive the busy refusal instead of printing `SKIPPED`~~ | `c9114a5` |
| ~~#77~~ | ~~`gui-51`: drive every named surface into overflow~~ | `88c1e3f` |
| ~~#78~~ | ~~Measure the launch artifact; gate `win.show()` only if objectionable~~ | `51ea6d5` — measured, gate **declined**, no `src/` change |
| ~~#79~~ | ~~The window remembers its size and position~~ | `03ab834` — gate **built**, on its own numbers |
| ~~#80~~ | ~~Type-while-busy composer with a queued send~~ | `1855910` |
| ~~#81~~ | ~~Measure whether `background_tasks_changed` fires on the host CLI~~ | `002e524` — measured, **all three conditions HELD**, `src/` still unchanged |
| ~~#82~~ | ~~The Agents dock re-reads its sidecars every turn, without blanking what it already has~~ | `3f34737` — stale-while-revalidate, and #83 unblocked |
| ~~#83~~ | ~~Surface live background tasks in the Agents dock, through an injected port~~ | `ea780a0` — the level consumed, the guard untouched |

**#81 measured `background_tasks_changed` and it FIRES.** Host CLI **2.1.220** /
SDK **0.3.220**, wisped, two runs identical. All three of the ticket's
authorising conditions held: it arrives on the stream under `engine.ts`'s exact
options; its `task_id` is the *same value* as `task_started.task_id`, the
`taskToParent` key and the `agent-<id>` sidecar id; and `local_bash` rides it, so
the level shows work the Agents panel filters out.

**A build is therefore authorised — and this ticket still built nothing**, because
every avenue for surfacing it is named in its own Out of scope section. The
authorisation is the deliverable; the feature is a separate ticket, and no
autonomy grant is live to file it. #27's "never fired" was an **untested
negative**, not a wrong reading: the app never calls `backgroundTasks()` and
nothing in #27's two turns could produce a background task.

Two findings bind whatever builds on it. **The `Agent` tool is ASYNC on this
CLI** — new since #27 — so a subagent is a background task from birth and
`backgroundTasks()` changes no membership. And **a level event lands 3.3s AFTER
`result`**, where `finishTurn()` has already nulled `activeOnEvent`, so `emit()`
reaches nobody: a background signal must be an **injected port** (#52/#73 shape),
never an `EngineEvent`. Harness: `scripts/spike-81-background-tasks.mjs`, ~20s.

See [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]].

**#80 shipped the composer staying live while a turn streams.** Enter commits the
draft; a quiet `.queued-note` above the pill says so and carries a
`Cancel queued prompt` control; the prompt fires when the turn ends.

**The queue is a FLAG on the draft, not a copy of it**, and that one choice
answers four of the ticket's questions at once: cardinality is one by
construction, "replace or append" dissolves (what fires is whatever is in the box
when the turn ends, never a hidden snapshot), cancelling costs nothing because the
text never went anywhere, and `<InputBar key={cwd}>` resets the queue with the
draft and the tray — so no queued prompt can cross a workspace switch without a
hand-written line in `switchWorkspace`'s `ok` branch.

**The flush condition is stated POSITIVELY and lives in a pure table**
(`src/shared/queued-send.ts`, beside `announce.ts`). All three terminal outcomes
clear `busy`, so a "flush once no longer busy" rule resends after Stop and can
spend the prompt on an engine that just went terminal (#73). **Exactly one of
twelve** outcome × queue × engine combinations sends — `turn-end` with a live
engine. Every other row **unqueues**, which releases the commitment and never the
text, so Stop stays safe to leave under the user's cursor.

`Engine.isBusy()` is still the app's one busy source. `lastTurn` records how a
turn **ended**, which is a different question, and carries a nonce because two
turns ending the same way must be two events.

See [[2026-08-01-a-queued-prompt-is-a-flag-on-the-draft]].

## State

- **In flight:** nothing. `main` = `ea780a0` + this leg's `.context` commit, pushed. No open branches.
- **Queue (`ready-for-agent`): EMPTY.** #83 was the last open ticket and it closed this leg. Nothing is blocked on anything; there is simply nothing filed. The next move is the owner's — see `## Pick up here`.
- **Landed:** **#83** (`ea780a0`) — the background-tasks section, a third injected port, 23 tests, five mutants killed and an ADR. Before it, **#82** (`3f34737`) — the dock's turn-end re-read, `keepStale`, seven tests and an ADR; **#81** (`002e524`), the harness and its ADR with **no `src/` diff, deliberately**, then the seven parked calls taken with their ADR — **also no `src/` diff**: taking a call decides it, it does not build it.
- **Parked for the owner: TWO, and they are the older halves — the seven are DONE.** The 2026-08-01 `/preset vibe init` run parked seven calls with no grant; the owner made one live after #81 landed and **all seven were taken** ([[2026-08-01-the-background-agents-seed-decided]]): two authorise work (#82, #83), four closed as **no** (the seed's meaning is the SDK concept; no labelled map; no new top-level surface; non-agent work **yes** but as its own section), one **struck** (map pan-zoom). `.claude/vibe.md`'s `## Needs you` is **history now, not a queue** — its `## Taken` section carries the resolutions. **What still stands are the two older halves:** Tailwind is not dropped but the adopt-utilities question does, and the titlebar's control count does not change while the aesthetic question stays the owner's. **#83 was deliberately routed into the existing Agents dock so it does not pre-empt that second one.**
- **Blocked:** nothing.

## Pick up here

**The queue is dry.** Run the frontier query first anyway — this line goes stale
the moment the owner files something, and that is this project's standing lesson
(a leg once wrote that closing #70 would empty the queue and was wrong, because
#71 had been unblocked the whole time).

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

If it really is empty, **the next move is the owner's** — file new work, or run
`/preset init` / `/preset vibe init` to generate a batch. The `## Deferred` list
below is the standing menu of candidates, and `## Open questions` holds the ones
that need an answer before they can be specced. **Two owner calls stand and are
named in [[pick-up]]** (Tailwind's adopt-utilities half, the titlebar's control
count); do not take either without a grant.

**Do not re-open the seven from `.claude/vibe.md`.** They were all taken on
2026-08-01 and that file's `## Needs you` is history, not a queue. A new *reason*
reopens one of them; a re-read does not.

The most concrete unspec'd candidate #83 leaves behind is the **`taskToParent`
join** — #81 measured the level's `task_id` matching the edge stream's key, but
the payload carries no parent, so the join is **observed and reserved**. It is
its own ticket, deliberately not grown into #83.

**Whatever comes next inherits the ledger below.** The `## Landmines` section is
long and load-bearing — it is the accumulated set of traps that a green suite
cannot see. Read it before touching the composer, the stylesheet import order,
the driver set, or anything that measures a launch.

Conventions unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged
to main, gate green before merge, `.context/` commits on main only.

## Open questions

- **Should the rail filter out `sdk-cli` sessions?** The listing fix admits **112** rows to surface the **37** this app wrote; the rest are headless automation, ~20 of them this repo's own GUI drivers. Accepted deliberately, but it is worst exactly where the owner looks first. The blocker is that `SDKSessionInfo` exposes no `entrypoint` / `origin` / `sessionKind`, so filtering means either re-opening ~680 JSONLs (the scan the SDK reader exists to avoid) or `tagSession` on every session this app creates, which is prospective only. **#68 was explicitly NOT the answer to this.**
- **Should Tailwind stay at all?** Nothing in the app uses a utility class. Either adopt utilities deliberately for new UI, or drop two devDependencies and the vite plugin and inline `@theme` into `:root`. **This half is deliberately still open** (the vibe run settled only that Tailwind is not dropped today). **A drop changes more than it looks:** today the defaults compile into `@layer theme` while `[data-theme=…]` blocks are unlayered, so unlayered-beats-layered makes the override win *regardless of import order*. Drop Tailwind and both become unlayered at specificity (0,1,0), so source order becomes the only thing deciding — `tests/theme.test.ts`'s import-position pin silently stops being a tidiness check and becomes the whole safety argument.
- **The titlebar is crowded** — app name + session title + two pills + three dock buttons + window controls. The "each button eats drag region" clause is **measured FALSE** (no-drag width constant at 344.3css; widest grab strip 182css at 688css), and the one measured defect shipped as #72. What remains is an aesthetic question about control count, which is **the owner's**, and #72 made it cheap: the centring no longer depends on a number equal to the wider block.
- **Should `rails.css:325` read `var(--mint)` like every other component site?** A naming inconsistency, not a bug — but #70 established that the long name and the alias are **not** interchangeable inside a nested `data-theme` opt-in, so it is no longer a pure find-and-replace.
- **Is a fifth palette ever wanted?** The whitelist, the `Record<Theme, string>` copy map and the key-set test make it a three-line change, deliberately.
- One deferred owner decision from #58's Out of Scope: whether an honest Write diff is wanted at permission time only, or also after an auto-run and in replay.

## Recent context

The per-ticket narrative for #64–#79 has been folded into the ADRs listed under
`## Related` and the traps under `## Landmines`. What stays here is the set of
lessons that keep recurring across unrelated tickets.

- **When a lifecycle hook is the only funnel every path passes through, the reset belongs IN it — #83 is the case that found it.** The obvious single site for the per-process reset was `makeEngine()`, and it is wrong: four of the six discard paths null the engine and rebuild *lazily on the next send*, so resetting at construction leaves a dead process's tasks on screen from the model pick until the user sends again. `close()` is the funnel that actually holds. The general form: when hunting for the one place to put an invariant, check whether the paths reach your candidate **eagerly** — a lazy rebuild is a window, and windows are where stale indicators live.
- **Two ports on one lifecycle hook can want OPPOSITE things, and consistency between them is the bug (#83).** `onTerminal` must never fire for `close()` (main's teardown is not a death); `onBackgroundTasks` firing for `close()` is the entire per-process reset. Both are commented at their definitions for that reason. A future tidy-up that "makes the close() handling consistent" breaks exactly one of them, silently.
- **A signal whose dropped case is the NORMAL case needs its pin written about timing, not payload (#83).** Every mid-turn delivery test passes against a wrongly-wired `EngineEvent`. The tests that discriminate are the ones with no active turn at all — after `warmUp()` alone, and after a turn has fully resolved with `isBusy()` asserted false first. Sibling of #80's "an edge between two samples is not observable by sampling": ask what state the system must be IN for the assertion to mean anything.
- **A value written once per session cannot be the trigger for something that happens once per turn — #82 is the case that found it.** The dock's read effect depended on `[sessionId]`, which `useChat` writes inside the `turn-end` branch: it moves `null → id` on turn ONE and never again, so the effect was **structurally incapable of firing** on turns 2..N. Nothing was missing and nothing threw; the suite was green because the effect *does* fire, just never twice. When a trigger is a dependency, ask how many times that dependency can change in the lifetime you care about.
- **An assertion that something SURVIVED is vacuous unless the thing it survives is shown to have HAPPENED (#82).** "The rows are still on screen after a re-read" passes perfectly against a panel that never re-read. The pin asserts `toHaveBeenCalledTimes(2)` first. This is the sibling of #76's absence lesson: both failure modes are a test measuring nothing while reading as though it measured something.
- **A refresh must not blank what it already has (#82).** Setting `loading` before every read, with a merge that drops the disk half unless `status === 'ok'`, means each refresh destroys the rows for its own duration — worst exactly while the user is watching the panel change, and it takes the nested edges with it because those are disk-only. Stale-while-revalidate, and a transient failure keeps the last good snapshot rather than downgrading it.
- **A NEGATIVE is only a measurement if the path was exercised — #81 is the case that found it.** #27 recorded "`background_tasks_changed` never fired" from two turns in which nothing could have produced a background task. That is an *untested* negative, and it reads on the page exactly like a tested one. Before citing an absence, ask what in that run could have made the thing appear; if the answer is nothing, the note is a gap, not a finding.
- **State the authorising condition BEFORE the run, and honour it in both directions (#78, then #81).** #78 named its condition, measured, and declined. #81 named three, measured, and all three *held* — and it still changed no `src/`, because the same ticket's Out of scope had already named every avenue. "Authorised" is permission for a future ticket, not an instruction to grow this one.
- **A queued action needs a POSITIVE trigger, never the absence of a state — #80 is the case that found it.** `busy` going false is not "the turn succeeded": Stop, a failed turn and a finished one all clear it. Naming the one outcome that earns the action (and asserting the other rows do something specific) is what makes the negatives visible; "when no longer busy" would have resent into a turn the user had just killed.
- **Releasing a commitment must not release the user's WORK.** #80's `unqueue` drops the flag and leaves the draft in the composer, which is what lets Stop stay the button under the cursor while a prompt is queued. The general form: when undoing a user's action, ask what of theirs the undo destroys.
- **A mutation can expose a hole in your TEST rather than in the code, and #80's is the clean example.** Leaving the queued flag standing after its own flush did *not* redden a bare send-count — the flush had emptied the composer, so the second firing had nothing to send. The real bug there is not a double send; it is spending the **next** draft without the user ever committing it. The test now types a fresh draft first.
- **An edge between two samples is not observable by sampling.** `gui-80`'s first run reported "the flushed prompt never put the app back in flight" for a prompt that had already sent, run and finished: the turn ending and the flushed turn starting are one React commit apart, so a `busy` poll steps straight over the boundary. Wait on a **monotonic** side effect (a count that only goes up), never on an edge.
- **Count the side effect at the layer that owns it.** jsdom cannot tell one flush from two, because `useChat.send`'s own busy guard swallows the second and leaves no trace. `gui-80` adds a **second `ipcMain.on('chat:send')` listener in main** beside the real one — `on` appends, so the real handler is untouched and every prompt is witnessed exactly once. (A `handle` channel could not be counted this way; invoke allows one handler.)
- **When two instruments disagree, suspect the instrument first** (#71, and #77 again). The disagreement is usually the finding.
- **Measure the stated cause before speccing a fix for it.** #71's gutter, #68's Windows handle, #70's `color-mix()`, #78's "every launch" premise and the titlebar's drag region were all measured FALSE. Four of spec #64's five ADRs now carry an amendment written after a probe measured their stated premise; **read an ADR's amendment before citing it.**
- **A driver's own setup can revoke what it measures (#77), and its LAUNCH LINE is part of that setup (#74).** Order setup steps by what each one takes away, not by what it needs.
- **Destruction is quiet, so an assertion phrased as an absence can measure nothing (#76).** Assert what went on living, not what failed to appear — and mutation-verify absence assertions first, because they are the ones that lie.
- **A green suite is not evidence a feature works end to end (#73).** When a feature's value is that state SURVIVES, interrogate the thing that holds the state, not the thing that displays it.
- **When a preference has both a REPORT and an EFFECT, the report can self-heal while the effect stays broken — and if the effect is reactive, the obvious pin on it self-heals too (#69, #70).** Pin the FIRST value written.
- **A measurement ticket's deliverable can be a decline, and the decline needs the same rigour as a build (#78).** Numbers on the ticket, instrument committed and mutation-verified, ADR amended to say which sentence is now false.
- **The platform may already have solved the thing you are about to gate (#78).** Before building state management, check whether the platform is already holding the state.

## Landmines (carried forward)

**From #83 — binding on the background-tasks path and on anything built on the
CLI's level signal:**

- **The reset lives in `engine.close()`, and moving it to `makeEngine()` reopens the stale window.** All six discard paths in `index.ts` call `close()`; only three of them rebuild eagerly. A reset at construction is green in every test and wrong on screen for as long as the user waits between a model pick and their next send.
- **`onTerminal` must NEVER fire for `close()`. `onBackgroundTasks` MUST.** Do not harmonise them.
- **The `background_tasks_changed` branch must stay BEFORE the `else` that calls `handleTaskMessage`.** Moving it after — or deleting it so the level falls through — puts `local_agent` rows from the level through the subagent path a second time. Mutation-verified: it reds five tests, including the "a level NEVER produces subagent events" pin.
- **REPLACE, never append, at every layer.** Mutation-verified in the renderer (`[...prev, ...t]` reds two tests). The whole value of a level is that a dropped message costs one frame instead of wedging a finished task on screen forever.
- **The set lives in `useChat`, not in `AgentsDock`.** The dock unmounts on every panel close and the level only re-fires on a membership CHANGE, so a set held in the component is lost with no way back. Pinned by a close-and-reopen test.
- **`nonAgentTasks` excludes ONLY `local_agent`.** An unknown future `task_type` is kept on purpose — an allow-list makes the panel lie by omission the first time the CLI grows a kind, and that failure is invisible.
- **Render the raw `task_type`, never a friendly label.** `BackgroundTaskSummary`'s `shell` / `subagent` / `monitor` / `workflow` ride the hook payload this app never registers. A test pins that `shell` never appears.
- **Background tasks must never reach `mergeAgents`**, and the two travel as separate props all the way to the DOM for that reason.
- **`.background-tasks` relies on `.agents-dock` being a flex column with `min-height: 0`.** That was read, not assumed. Its `flex-shrink: 0` and `max-height: 40%` are what keep a burst of background work from eating the panel; the list scrolls instead.
- **The section renders only when non-empty and its rows are non-interactive.** A fourth empty state would compete with the three the agent half already has, and a background task has no sidecar, no transcript and no parentage in the payload — there is nothing to open.

**From #82 — binding on the Agents dock, and on #83 which edits the same state:**

- **The dock's disk read is now ONE callback with a `keepStale` flag, and the two callers want opposite things.** `false` (session changed) clears first and reports a failure as `unreadable`; `true` (same session, re-read) touches nothing until the new list is in hand and keeps the last good rows when the read fails. Re-splitting these into two read paths is how the `null` vs `[]` contract drifts between them.
- **The trigger is `lastTurn.outcome === 'turn-end'` plus the nonce, never `busy === false`.** All three terminal outcomes clear busy, so a not-busy rule re-reads after Stop and after a failed turn. Second time this codebase has needed the rule (#80 was the first).
- **The seen-nonce is consumed on EVERY outcome and SEEDED at mount.** Skip the bookkeeping on outcomes that read nothing and a stale nonce fires on a later render; skip the seed and opening the dock after a turn reads the same directory twice for one event. Neither is visible without a count assertion.
- **`sessionId` moves once per SESSION, not once per turn.** It is written inside `useChat`'s `turn-end` branch, from a promise, so it also lands a render LATER than `lastTurn` — which is why the first turn is covered by the session effect and not by the trigger.
- **#83 should replace the TRIGGER and leave `keepStale` alone.** They were split for exactly that.

**From #81 — true of anything built on the CLI's background-task signal:**

- **`background_tasks_changed` FIRES, and a level event can land AFTER `result`.** Measured 3.3s past turn B's `result/success`. `finishTurn()` nulls `activeOnEvent` at `result`, so `emit()` reaches nobody — a background signal routed as an `EngineEvent` is dropped **in exactly the case it exists for**. It must be an injected port, the shape of #52's `onModelReport` and #73's `onTerminal`.
- **The `Agent` tool is ASYNC on this CLI (2.1.220), and #27's blocking observation is stale.** Its `tool_result` reads *"Async agent launched successfully"* ~12ms after the `tool_use`, and the turn's `result/success` arrives while the subagent is still running and still emitting. **A subagent is a background task from birth** — it is in the level payload before anything backgrounds it, and `backgroundTasks()` returns `true` while changing no membership. Any design that assumes the Agent tool blocks, or that the app must background a subagent, is built on the old shape.
- **The level's `task_id` joins, but parentage does NOT ride in the payload.** The declaration's *"do not correlate it with the edge stream"* is about the payload carrying no `tool_use_id` and no parent — the join key itself matched `task_started.task_id`, the `taskToParent` key and the `agent-<id>` sidecar id, one value in four places. So parentage is only reachable through `taskToParent`, i.e. only if the `task_started` was seen. Treat the join as **observed and reserved**, not guaranteed.
- **The level speaks the EDGE stream's vocabulary, not `BackgroundTaskSummary`'s.** `tasks[].task_type` carries the raw `local_agent` / `local_bash` discriminants. `BackgroundTaskSummary.type`, in the same `sdk.d.ts`, documents friendly labels (`shell`, `subagent`, `monitor`, `workflow`). Two vocabularies for one idea; do not map one onto the other by assumption.
- **The sidecars live at `<projectDir>/<sessionId>/subagents/`, which is exactly where `subagent-store.ts` reads.** The spike's first run scanned the project dir FLAT, found zero, and looked like "the CLI stopped writing sidecars" — a false alarm that cost a detour. Any tool re-deriving that path must copy `subagentsDir()`, not guess.
- **Re-running the spike costs ~20s** (`node --experimental-strip-types scripts/spike-81-background-tasks.mjs`), dumps JSONL outside the repo, and evaluates the three conditions mechanically. It imports the app's **real** `cli-path.ts` rather than a copy of the PATH walk, so it cannot drift into measuring a different binary than the app runs. **Measurement gap, unchanged from #27: the native backend is still unobserved** — both runs were wisped.

**From #80 — true of the composer and of the queued send:**

- **The composer is never `disabled` any more, and `useChat.send` is still the one place that refuses a send while busy.** Re-adding `disabled={busy}` to the textarea, the paperclip or the paste handler puts the ticket's whole complaint back with every test green except the two that name it. The tray is live while busy **on purpose**: a composer that took words but refused images would queue a prompt with half of it missing.
- **The queue lives in `InputBar` so that `<InputBar key={cwd}>` resets it.** Lifting it into `App` or `useChat` means it must join the `ok` branch of `switchWorkspace` by hand — the `pendingInsert` bug class verbatim, and the failure is a queued prompt firing into the *next* project.
- **The queue is a FLAG on the draft, never a copy.** Snapshotting the text at commit time re-introduces every question the flag design dissolves (replace-vs-append, a stale copy to cancel, a second thing to reset) and makes what fires differ from what is on screen.
- **`lastTurn` is not a second busy flag, and its NONCE is load-bearing.** It records how a turn *ended*; `Engine.isBusy()` is still the only reading of whether one is running. Drop the nonce and `{ outcome: 'turn-end' }` twice in a row is not a dependency change — the second queued prompt of a conversation silently never fires.
- **Flush on `turn-end` positively, never on "no longer busy".** All three terminal outcomes clear `busy`. The decision is the twelve-row table in `src/shared/queued-send.ts`; keep it pure and keep the rows asserted positively (`toBe('unqueue')`, never `not.toBe('flush')`) or the two negatives go absence-shaped and pass vacuously.
- **`unqueue` releases the commitment and NEVER the text.** Every non-flush row is lossless by design, which is the entire reason Stop is safe to leave under the user's cursor while a prompt is queued. A "tidy-up" that also clears the draft turns Stop into a paragraph-eater.
- **A double flush is invisible to jsdom.** The second one is swallowed by `useChat.send`'s busy guard and leaves no trace, so one send and two look identical from the DOM. Only `gui-80`'s IPC count can tell them apart — and only because it counts with a **second `ipcMain.on` listener**, which appends rather than replacing.
- **A bare send-count cannot see a commitment that outlived its own flush**, because the flush empties the composer and the next firing has nothing to send. Type a fresh draft first; the real bug is spending the NEXT draft without the user committing it.
- **`.queued-note-cancel` is its own selector, and it joins the shared shell/focus/hover groups** (`rails.css` + `shared.css`), not a bare base. `.tool-card-toggle` and `.switch-refusal-retry` are both on record as bare selectors that started matching the wrong button.
- **Queueing must not grow a second Send button.** While busy the send slot IS Stop and must stay that way; `gui-80` asserts the count of `Send`-labelled buttons is zero during a queued turn, because a second send affordance would race the queue.
- **`stopTail()` still runs at FLUSH, inside `send`, not at enqueue.** A commitment is not driving the session; the tail stops when the prompt actually goes.

**From #78 — true of anything measuring launch, paint, visibility or window
geometry:**

- **Chromium persists the zoom factor per origin, in `userData`.** A driver run
  against the real profile opens at the stored zoom and reports no reflow — an
  inherited pass. `gui-78` gives every launch a fresh `userData` via
  `app.setPath` **before `ready`** (which also means it never touches the user's
  real localStorage). Any future launch measurement must do the same.
- **Playwright cannot measure a launch.** Under `_electron.launch()` the window
  never emits `ready-to-show`, so it is never shown and never painted and
  `getEntriesByType('paint')` is **empty**. Fine for DOM-driving drivers, fatal
  for paint/visibility/timing ones.
- **`NODE_OPTIONS=--require` never reaches Electron** (`NODE_OPTIONS` is `null`
  inside main), and **`context.addInitScript()` is too late** — `launch()`
  resolves at ~380ms with the window already loading. Being the Electron **entry
  point** is the hook that works: `gui-78-probe.cjs` hooks and then `require`s
  `out/main/index.js`.
- **In a background/headless session the app's window never paints with GPU
  compositing on.** No `ready-to-show`, `isVisible()` false after 20s. Add
  `--disable-gpu` — but know it flattens acrylic, so no material can be judged
  visually in that run.
- **`ready-to-show` fires on the first paint of the still-EMPTY document.** The
  window goes on screen 38–61ms before React commits anything, showing a
  transparent frame (`body` computes `rgba(0, 0, 0, 0)`) — the bare backdrop
  material. Anything reasoning about "what the window shows at launch" must not
  assume the UI is in it.
- **`getZoomFactor()` at window construction reads 1.0 even on a warm profile**,
  because the persisted zoom is restored at document commit. A premise check on
  it can never fail; read the first **painted** frame's `devicePixelRatio`
  instead.

**From #77 — true of `gui-51` and of any driver that both changes app state and
reads a CLI-sourced list:**

- **Opening a past session CLOSES the engine.** `openSession` → `targetSession`,
  after which `listModels()` and `listCommands()` answer `[]` **by contract**.
  Any driver that needs the model picker, the slash-command popover or the
  Commands dock must reach them **before** it opens a session. Nothing throws;
  the lists just go quiet, and the failure looks like a broken CLI.
- **`.model-menu` always renders one row (the static "default" pick).** A count
  of 1 means the fetched list was EMPTY, not that the CLI offers one model.
  `gui-51` logs it as `N rows incl. the static default` for exactly this reason.
- **`gui-51` seeds 24 sessions + one 30-turn session into its own store dir**
  (`~/.claude/projects/gutter51-<uuid8>/`, cleaned in `finish()` and on timeout)
  and picks a temp workspace, not the repo. Do not "simplify" it back to picking
  `APP_DIR`: `.session-groups` would then overflow only on a machine with a big
  store, and under the no-third-state rule that is a FAIL, not a quiet note.
- **`.message-input` must read `exact: false`, and the driver fails if it does
  not.** A textarea renders no element children, so the `width:100%` shim reads
  0 and the coarse fallback takes over. That guard is load-bearing: an exact
  reading there means the instrument changed under us.
- **The coarse budget is spent, not spare.** `.message-input` reads 11.25dev
  against 12.5 expected — **past** the exact budget of 1 and inside the coarse
  `1 + dpr` = 2.25. Whole-CSS-pixel rounding costs that 1.25dev. Tightening the
  coarse budget toward the exact one reddens a healthy composer.
- **`gui-51` must not touch the stylesheet.** `tests/scrollbar.test.ts` scans
  every line naming a scrollbar pseudo-element, comments included.

**From #76 — true of `gui-48` and of any driver asserting that a guard held:**

- **`gui-48` now costs ONE real CLI turn and waits up to 600s** (was a 120s
  watchdog). Its busy-refusal section runs LAST, from inside the temp workspace
  the earlier switch moved into.
- **The survival assertion is `replyChars > 0`, sampled BEFORE the click.**
  Moving the sample after the click narrows the window to nothing and the
  reading stops discriminating. `completed` and `newErrors` are **measured
  vacuous** for this branch and kept for another; do not cite them as covering
  the refusal, and do not delete them as dead.
- **The premise wait is 60s, not 20s, and it earned that.** The turn starts in a
  brand-new temp workspace, so the CLI is cold — a green run really did fail its
  own premise at 20s. Tightening it back makes the driver flaky in the honest
  direction (a loud FAIL), which is still a wasted run.
- **The "Open project" affordance must stay reachable while busy.** `gui-48`
  asserts the dialog opens exactly once during the refused switch. Busy-gating
  that button would make main's refusal unreachable — the same reasoning the
  foreign session row carries, and it is now pinned by a driver as well as by a
  comment.
- **A third temp dir (`wrapper-refused-*`) exists so a broken refusal LANDS
  somewhere.** Pointing the busy pick at the already-open folder would make the
  failure read as "the title did not change", which is what a working refusal
  reads as too.

**From #75 — true of the announcement path and of any future focus question:**

- **`win.isFocused()` alone is NOT "someone is looking", and this is measured.**
  A minimised window reports `isFocused() === true` on Electron 43 / Windows 11,
  and `win.blur()` moves it not at all (no `blur` event either) — only
  `win.hide()` flips it. `isLooking(win)` in `src/main/turn-announce.ts` is the
  app's answer; "simplifying" it back to `isFocused()` makes the feature silent
  for the commonest way of walking away, with all 864 tests green.
- **`app.setAppUserModelId` is load-bearing and nothing at runtime can read it
  back.** Electron exposes no getter, so deleting it costs nothing visible: the
  toast just stops appearing, with no error. `gui-75` guards it by grepping the
  **built** bundle and labels that as a static check.
- **Patch `Notification.prototype.show`, never the `Notification` class.** The
  built main bundle captures the constructor when it loads, so a class swap can
  record nothing while the app happily notifies — the same reason `gui-69`
  patches `BrowserWindow.prototype.setBackgroundMaterial`.
- **`gui-75` MINIMISES rather than blurs**, deliberately, and `hide()` is not a
  substitute: a hidden window has no taskbar button for the flash to land on.
  Third deliberate driver divergence, after `gui-69`'s GPU and `gui-74`'s
  missing `--no-sandbox`.
- **`announceTurn` guards `turn-aborted` a second time, on purpose.** It is what
  lets `ANNOUNCE_COPY` exclude the silent row by type. Measured consequence:
  deleting the abort guard in `shouldAnnounce` leaks `flashFrame(true)` while
  the toast stays suppressed. Not dead code — do not delete it, and do not move
  the decision into it.
- **A "notifications off" toggle, if ever wanted, is a renderer-stored
  preference in the Appearance dock** under that dock's constraints (no
  `input`, no `select`, no second `role="radio"` group). Out of scope for #75
  and stated in the ticket.

**From #74 — true of the window and of the driver set:**

- **`gui-74` launches WITHOUT `--no-sandbox`, deliberately, and "standardising" it onto the house launch args silently guts it.** It would keep passing — that is the whole point. It is the second driver that diverges on purpose, after `gui-69` keeps the GPU on because `--disable-gpu` photographs neither backdrop material.
- **`sandbox: true` is load-bearing and nothing in vitest can see it.** No test constructs a `BrowserWindow`, so the flag can be flipped back with all 843 tests green and the build clean. `gui-74` is the only thing that reddens.
- **A preload that starts needing Node is a decision, not a fix.** If some future preload import pulls in a Node builtin, the honest move is an ADR recording the measured reason — an unmeasured `sandbox: false` puts the app back where it started with an extra commit. Check the **built** bundle (`out/preload/index.js`), never the source: today it holds exactly one require, `require("electron")`.
- **`ProcessMetric.sandboxed` is documented for macOS and Windows only.** On Linux the field may read `undefined`, which reads in `gui-74` as a failure and is really a driver limit. The flag assertion above it tells the two apart: flag `true` + metric `undefined` is the limit, flag `false` is the defect.
- **`gui-48` and `gui-51` have pre-existing holes, observed by #74 and deliberately not fixed. Half spent: `gui-48`'s closed as #76 (`c9114a5`) — it drives the busy refusal now and prints no `SKIPPED` line.** `gui-51` still prints four `NOT DRIVEN` lines for surfaces that were not overflowing, and PASSes; that half is **#77**, the current frontier.

**From #73 — true of the engine's terminal path and of every resume:**

- **`resume` binds at query CONSTRUCTION and `ensureQuery` returns early ever after.** So whatever builds the query owns the resume — on the switch path that is `warmUp`, which now TAKES the target. Calling `warmUp()` bare, or "tidying" the argument away because `pendingResume` is already set, silently puts the rebuilt engine on a fresh session **while the pane, refilled from disk, looks perfectly correct**. No unit test can see it; `switch-workspace.test.ts`'s argument pin is the only guard.
- **The terminal signal is out of band, and it has to be.** `emit()` only reaches `activeOnEvent`, and the stream-death branches emit only `if (turnResolve)` — so **a stream dying between turns emits nothing at all**. Moving the distinction onto the `{ type: 'error' }` event drops it in exactly that case, and reddens five existing exact-`toEqual` pins on the way.
- **`onTerminal` must not fire for `close()`.** Main tears the engine down on every workspace switch, model pick and permission cycle; `close()` sets `terminalError` first and then ends the stream, so both stream-death branches check who got there first. Firing unconditionally puts a "restart and resume" control on screen after an ordinary model pick.
- **`activeSessionId` is only written at turn-end.** A death mid first-turn leaves it null in the renderer while main has held the id since `init`, so the terminal handler re-reads it over `chat:session-id`. Trusting the local null offers "nothing to resume" for a conversation that resumes perfectly.
- **A session IS resumable after an abnormal death** — measured, not assumed: killed with `taskkill /F`, the SDK accepts the id and reports **the same id** back. Do not re-file the honest-restart degradation as though it were still open.
- **`streamingStub`'s handle has no `close()`**, so `engine.close()` cannot reach the stream-ended branch through it — a test built on it passes without running the code it names. Use a handle carrying `close`, and assert the stream actually finished.
- **The restart control needs its `--restart` modifier class.** `.switch-refusal-retry` is already worn by the transcript-retry button; a bare selector grabs whichever renders first. Same failure mode as the tool card's, and just as silent.

**From #72 — true of the titlebar:**

- **`.titlebar-center` must stay IN FLOW, and `.session-title`'s truncation only works because of it.** The span's `display` is never authored — it is blockified by being a flex item, and that is what makes `overflow` / `text-overflow` apply. "Simplifying" the slot back to a plain block, or to absolute centring, silently restores the overlap with nothing red.
- **`pointer-events: none` on `.titlebar-center` is load-bearing, not decoration.** Now that the slot spans the middle of the titlebar in flow, dropping it hands a wide strip of the drag region to a non-interactive `<div>`.
- **The title is off true centre by design (~15css today).** It centres in the space available, bounded by `|left − right|`. Do not "fix" it by re-adding absolute positioning — that is the trade the ticket recorded and the owner's call to reverse.
- **`.session-title` is still NOT in `shared.css`'s truncation triad, deliberately.** Its rule lives in `titlebar.css`. Widening the shared group instead repaints the sessions rail and the agents dock, invisibly to a suite that loads no CSS.
- **`gui-72` measures against a real 60-character workspace folder** — a temp dir handed to the stubbed `showOpenDialog`, so the title comes from app state, not injected text. It fails loudly (`NOT DRIVEN, not a pass`) if the workspace never switched, because every geometry assertion would otherwise pass on the string "New session". Its temp-dir cleanup runs **after** `app.close()` and is best-effort: the engine holds the fixture as its cwd, so an EBUSY there is ordinary and must never decide the verdict.

**From #71 — true of `gui-51` and of any driver that measures geometry:**

- **`gui-51` compares in DEVICE pixels, and converting it back to CSS pixels re-breaks it.** The expectation is `10 × devicePixelRatio` within 1 device px. `devicePixelRatio` is read **live** because it already folds display scaling and webContents zoom into the one factor the bar is snapped against — hardcoding it, or comparing the CSS-pixel reading, pins a number that legitimately moves with the zoom preference.
- **Never measure a gutter with `offsetWidth - clientWidth` again.** Both round to whole CSS pixels, so one true value reads as several different numbers depending on where each element's box sits — that is the entire #71 defect. The exact instrument is a `width:100%` shim whose rect **is** the content box.
- **The shim's zero-reading guard is load-bearing, not defensive noise.** A `<textarea>` renders no element children, so its shim reads 0; the guard detects that and falls back to the coarse reading flagged `exact: false`, which is then given back the whole CSS pixel of rounding it carries. Delete the guard and `.message-input` reports a gutter of several hundred pixels the moment it overflows.
- **Do not widen either budget (1 device px exact / `1 + dpr` coarse).** Measured headroom: deleting the global rule from `base.css` puts every surface at 15dev against an expected 12.5, so the exact budget has 2.5× margin. Widening to fit a number is the move #65 exists to undo.
- **A tolerance can be passing by arithmetic accident.** The old ±0.5 survived only because `10 × 1.1 = 11.0` is integral; `10 × 1.25 = 12.5` is not, and the bar snapped to 12. **A green driver at one zoom says nothing about another** — #71 was re-verified at 1.0, 1.1, 1.25 and 1.5.

**From #70 — now true of the theme path in code:**

- **`useTheme`'s lazy `useState(readStored)` initialiser is load-bearing, and the OBVIOUS pin does not catch breaking it.** Only `tests/appearance-dock.test.tsx`'s MutationObserver pin ("the default is never applied first") dies; every attribute assertion self-heals. Do not simplify that test into a plain `getAttribute` check, and do not read the attribute inside the observer callback — writes coalesce.
- **The theme picker is a LISTBOX, not a radiogroup, and it has to be.** #69's pin reads every `role="radio"` in the Appearance panel as a backdrop (`r.dataset.backdrop`), so a second radiogroup in that panel reddens it. Any future pick-one control in this panel faces the same constraint, on top of #66's dock-wide "no `input`, no `select`".
- **`themes.css` blocks are selected as `[data-theme=…]`, deliberately without `:root`.** The bare form also matches nested elements, which is what lets the four swatches preview themselves. Adding `:root` back silently kills the preview — four identical swatches, nothing red.
- **A nested `data-theme` opt-in must read `var(--color-mint)`, never `var(--mint)`.** The short alias resolved once at `:root`. `.appearance-swatch` is the one rule in the app that depends on this; "tidying" it onto the alias is a silent regression.
- **Frost is authored as a block even though its values equal the defaults.** It is the structural reference the key-set and lightness pins compare against. Deleting it as redundant guts three tests.
- **The theme file's rules are pinned STRUCTURALLY — do not hand-tune a value past them.** Lightness and alpha are fixed on every key, neutral chroma is fixed, accent chroma lives in `0.05`–`0.09`, and the four hues must stay distinct. `tests/theme.test.ts` strips comments first, so prose in `themes.css` is safe (unlike the other two raw-text readers).
- **`data-theme` outlives `cleanup()` in jsdom.** `tests/appearance-dock.test.tsx` removes it in `beforeEach`; a new test file touching themes needs the same line or it inherits the previous file's palette.

**From #69 — now true of the backdrop path in code:**

- **`useBackdrop`'s lazy `useState(readStored)` initialiser is load-bearing, and breaking it is nearly invisible.** Only the mount-push assertion dies; the panel self-corrects. Same shape as `useZoom`'s, and the storage key `backdrop` is **deliberately unversioned** (acrylic is an identity, not a tuned default) — version it if that ever stops being true.
- **`normalizeBackdrop` compares, never coerces.** Do not "tidy" it into `String(value)`.
- **The Backdrop control is a radiogroup of BUTTONS, and it has to be.** A dock-wide pin asserts the Appearance panel renders no `input` and no `select`. Any new control in that panel — #70's theme picker included — must satisfy the same constraint.
- **`gui-69` runs with the GPU ON**, unlike every other driver here, and it mutates the real app's `localStorage` before restoring it. Do not "standardise" it onto `--disable-gpu`: that flattens acrylic and photographs neither material.
- **Backdrop touches no neutral, and must not.** Coupling it to the palette makes it a second theme axis writing the same custom properties as #70, from two independent controls, invisibly.

**From #67 — true of the token store:**

- **`color-mix(in oklch, var(--mint) N%, transparent)` is established idiom, six sites, and those sites theme themselves.** 6% / 12% / 14% / 20% / 22% / 50%. **Do not tokenise them, do not expect them in #70's key set, and do not read them as literals #67 missed.**
- **The accent is FOUR tokens and `--color-mint-wash` now exists** (`oklch(0.87 0.07 180 / 0.1)`, plus the `--mint-wash` alias). One caller was two; #69's selected-option fill is the second. Exempt from the one-caller-token rule because its job is to be an **override point**.
- **Sixteen colour literals outside `tokens.css` are deliberate.** A future "finish the tokenisation" pass is wrong, not incomplete.
- **Proving a CSS refactor changed nothing means resolving `var()` and diffing per selector — then mutating the checker.** The minifier reorders declarations within a rule; separate custom-property definitions from painting declarations.

**From #66 — true of the Appearance dock:**

- **`useZoom`'s lazy initialiser is load-bearing and breaking it is invisible to the old suite.** Mutation-verified: only `tests/appearance-dock.test.tsx`'s readout pins die. `zoom-level-v2` stays versioned; bump it on the next default change.
- **The keydown listener reads `levelRef`, not `level`.** Both paths must go through `apply`.
- **The Appearance dock JOINS the dock-shell groups — it carries `.agents-dock`** — and `styles/appearance.css` owns only its control rows. Do NOT widen a shared group in `rails.css` / `shared.css`: that repaints the sessions rail and the agents dock silently, with a suite that loads no CSS. **#70's theme rows go in `styles/appearance.css` too.**
- **The panel must stay draft-free.** Pinned by asserting no button in the dock matches `/save|apply|reset|revert/i`.
- **A dock member must go in the `openDock` UNION, never another boolean.** Pinned against both siblings in both directions.
- **`@testing-library/jest-dom` is NOT installed.** Assert DOM properties directly (`el.disabled`).

**From #64's design pass — all spent in code now, and true of it:**

- **`tests/theme.test.ts` IS the third raw-text CSS reader**, joining `tests/scrollbar.test.ts` and `tests/multiline-composer.test.tsx`. It is the only one of the three that strips comments before parsing — verified by deleting a declaration and leaving it behind commented out, which still reddens.
- **`themes.css` imports immediately after `tokens.css` and before `base.css`** — thirteenth import, and the position is pinned. A theme block landing before the tokens it overrides is the silent restyle the cascade rule exists to prevent; a `themes.css` that is never imported at all leaves every disk-reading pin green while the feature does nothing.
- **`--color-mint-ink` follows the hue but keeps its lightness AND its chroma**; neutrals move by hue angle only. Only `--color-mint`, `--color-mint-press` and `--color-mint-wash` may move chroma, within `0.05`–`0.09`.
- **No test can say whether a theme looks good**, and a driver screenshot cannot judge the backdrop at all. Real window or nothing. All four palettes were eyeballed by hand at `1769aa4`.
- **The IPC rule is spent for this batch.** #68 and #69 took both new channels; theme and zoom are renderer-only and fire it zero times.

**From #68 — true of the delete path:**

- **`deleteSession` takes ONE argument, and the pin is on the arity as well as the value.**
- **The delete's outcome is a claim about the STORE, never about the error text.** `unavailable` must stay `failed`.
- **The busy gate is `active && busy`, NOT `!foreign && busy`.** It looks like an inconsistency to be tidied. It is not.
- **Windows holds no delete-blocking handle on a transcript** — measured, all three states.
- **The delete control's hidden state must stay `opacity`, and the reveal must keep `:focus-within`.**
- **`session-index.ts` ignores `CLAUDE_CONFIG_DIR` while the SDK honours it.** Pre-existing and app-wide.

**From #65 — true of the driver set:**

- **A driver must ESTABLISH the app state it asserts, never inherit it.** Drivers write each other's state.
- **A `SKIPPED` line is a hole in the gate, not an environment note.**
- **Never assert a fact about this machine's disk.** Compare filters against each other, and compare **totals**.

**Carried from earlier legs:**

- **`includeProgrammatic` must stay `true`, and nothing pins the argument.** The behaviour is pinned by `tests/session-store-live.test.ts`, which mocks nothing. That file must keep saving/restoring `CLAUDE_CONFIG_DIR`.
- **A test that mocks the SDK module cannot pin what the SDK does.**
- **The store's session listing and its session *resolution* have different filters.**
- **The conversation you are in is a clickable row now.** `useChat.openSession`'s same-id guard is what stops a click re-adopting the live session.
- **`scope: 'project'` drops cwd-less sessions too**, and runs **before** the cap, deliberately.
- **`--r-pill` on a growable box is a bug waiting for the box to grow.** `.input-pill` is pinned to a literal `24px`. #69's choice cards use a literal `8px` for the same reason.
- **A persisted preference silently outranks the default it was seeded from.**
- **`sed -i` rewrites a whole file to LF.** Use the `Edit` tool for mutations, or re-normalise afterwards.
- **A script importing a project dependency must live under the project tree.**
- **The `@import` order in `styles.css` IS the cascade, and breaking it is silent.** `tokens` → `themes` → `base` → `shared` must stay first, **thirteen** lines today. The first three are pinned by `tests/theme.test.ts`; the rest are not.
- **A new rule goes in the file that owns its surface, never in the entry.**
- **`tests/scrollbar.test.ts` scans EVERY LINE containing a scrollbar pseudo-element, comments included.**
- **`tests/multiline-composer.test.tsx` slices raw CSS between literal braces.** `.bubble` and `.message-input` must stay **ungrouped**.
- **Split a file by LINE RANGE, never by retyping it.**
- **`styles.css` and all of `src/` is CRLF, while `.context/*.md` is LF in the index.** Re-normalise after a whole-file `Write`. (#67 and #69 both verified their edited files stayed 100% CRLF.)
- **`.command-row-btn` is the one row button without `font: inherit`**, deliberately excluded.
- **Tint steps 1 and 2 differ by 0.01 alpha** for no recorded reason. Collapsing them is a design call.
- **A mutation that kills nothing may be telling you the CODE is dead.**
- **Never render a Write diff.** Labelled content preview only; the guard is an assertion of **absence**.
- **The card carries THREE disclosure booleans**, one per region.
- **A fourth control on the tool card must be named twice over** — a `.tool-card-toggle--<what>` modifier class **and** an accessible name outside `tests/toolcards.test.tsx`'s `TOGGLE` regex. Both failures are silent.
- **`lineDiff`'s `>=` tie-break is load-bearing**, and **never `split('\n')` in the diff path.**
- **`[]` and `null` mean different things on both store channels.** `?? []` at a new call site restores the exact bug #60 removed.
- **Never cache a failed index build.**
- **Live-tail's failed-read guard is `continue`, never `break`.**
- **A failure notice must retire when the thing it warns about arrives.**
- **The mutation harness must normalise CRLF.** Anchors written with `\n` match **zero** times in `src/`, and a zero-match anchor reads exactly like a surviving mutation. Anchored `Edit` calls sidestep the class.
- **Never summarise a tool result on the way into state.**
- **The collapsed tool-card test is a mechanism check.** Detail must stay **conditionally mounted**.
- **`resultSummary` runs on the COMPLETE result, on every render.**
- **`inputEntries` sorts, and the sort is load-bearing.**
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** Commit first, then mutate, and reverse with the same anchored replace. (#69's six mutations were verified reversed by an empty `git diff`.)
- **`gh` infers the repo from the working directory.**
- **#57's watcher is epoch-fenced, and the fence is the whole safety argument.**
- **`fs.watch` throws SYNCHRONOUSLY** on ENOENT/EPERM.
- **A reload's staleness re-check must not orphan the queued re-run.**
- **Live-tail is for a session you are WATCHING, never one you are DRIVING.**
- **Pins are mutation-verified. Never "fix" a red pin by editing its expectation.** The legitimate-retirement allowance is **spent**.
- **A green test can be green for the wrong reason.** Assert the mechanism — a fetch count, a read that must not happen, a call ORDER.
- **A session id is only resumable once a turn has run** (#54).
- **Never re-derive a store path from `cwd`.**
- **Never call `window.api.pickFolder` outside `Welcome`.**
- **Never clear the pane with `newChat()` on a switch path.** Use `adoptSession(id)`.
- **Do not add a second busy flag.**
- **Never un-key the composer.** `<InputBar key={cwd}>` is the entire draft / tray / autocomplete reset.
- **`pendingInsert` must be cleared in the same commit as the cwd change.**
- **Anything workspace-scoped added to App state must join the `ok` branch** of `switchWorkspace`.
- **Do not rebuild the storage index inside `listSessions`**, and never re-add `customTitle ?? summary`.
- **#50: never match CLI markup mid-string.** A real recorded argument is `fable[1m]`.
- **#51: never scope a scrollbar rule to a component**, and never add `scrollbar-width` / `scrollbar-color`.
- **Never write a literal ESC byte or a `\u` escape into source.**
- **A session fixture with no `cwd` is a foreign row.**
- **New `window.api` channel → ALL FOUR mock sites** (`chat-harness.ts`, `session.test.tsx`, `shell.test.tsx`, `sidebar.test.tsx`) plus `preload/index.d.ts`, and guard every IPC with `isTrustedIpc`.
- **A module-level cache needs a test reset.**
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, and it needs `stat` now.
- **Never add a resize effect to `InputBar`** — height is CSS (`field-sizing: content`).
- **Never hardcode a model name anywhere.**
- **Never merge `picked` and `reported` in `model-mode.ts`.**
- **Wisp `options.model`: the CLI shadows the FAMILIES, the bridge resolves the ALIASES.** Never run bare `wisp snapshot` — always name the family.
- **The app runs the HOST `claude` when PATH has one** (`cli-path.ts`).
- **`gh issue close --comment` silently drops the comment if the issue is already closed** — and a commit trailer (`Closes #n`) closes the issue the moment main is pushed, so **comment first, then close**. **`gh issue list` lags a close by seconds.**
- **A squash merge leaves the branch "not fully merged"** — `git branch -d` refuses it; `-D` is correct here, not force in the dangerous sense.
- **The Bash tool is not PowerShell** — heredoc, never a PowerShell here-string.
- **A mutation harness must assert its anchor matched exactly once.**

## Known issues / not-our-bug

- **`gui-75` is not reliable inside a long batch run, and its red there is a premise failure rather than a regression. Reproduced on three legs, green on a solo re-run every time — and #83's leg ran it inside a full 23-driver batch and it PASSED first try, so the flake is intermittent rather than batch-deterministic.** #76's leg: `could not drive: the window lost focus during the second turn`, `focusedAtEnd: false`. #77's leg: `could not drive: the window would not take focus`, same shape. **#82's leg reproduced the first form exactly** and was green on re-run with `focusedAtEnd: true`. **Every time green re-run alone.** Something on the machine steals focus during an unattended batch; it is the only focus-dependent driver in the set, so it is the only one exposed. **Read its FAIL line before believing the red** — `could not drive:` is the driver saying its own setup failed, which #65's rule makes loud on purpose. Same class as the `gui-73` batch red a previous leg diagnosed as a collapsing process tree. **A batch that reds only here is a green batch**; re-run it solo before writing anything down.
- **There is no expected driver failure any more.** `gui-51`'s standing red closed as #71 (`b6e8911`), and `gui-72` joined the set green at `9fecc10`; **every driver in the set is green, and any red is now a real regression.** The old note said "a second signature is a real regression" — that qualifier is gone, and so is the cover it gave.
- **A capture cannot see the right ~20% of the layout.** The window composites `windowWidth` device px while the page lays out `windowWidth` CSS px at zoom 1.25, so every right-hand dock is clipped out of a screenshot at any window size — re-confirmed by #69's captures, where the Appearance panel is visibly cut. **Measure with `getBoundingClientRect`**; `gui-66` works around it with a presentational-only `setZoom(1)` after every assertion.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Don't point a GUI driver's temp cwd there.
- **GUI driver traps:** `--disable-gpu` flattens acrylic (so `gui-69` leaves the GPU on); measure in the DOM, never off screenshots; dispatch clicks via `page.evaluate(() => el.click())`; arm a hard `setTimeout(process.exit)` before awaiting `app.close()`; never re-read an element after an action that may not have happened; **count the side effect you care about**; pass any path as an **argument** to `app.evaluate`; stub `dialog.showOpenDialog` in main before any click that opens one; and **select controls by their modifier class**.
- **Driver trick (gui-69):** patch a main-process method (`BrowserWindow.prototype.setBackgroundMaterial`) from `app.evaluate` to record its arguments — that is what separates "the renderer called preload" from "the window was told", and comparing `BrowserWindow.getAllWindows().map(w => w.id)` across the action proves no rebuild. To observe a **mount** push without racing renderer boot, install the patch and then `page.reload()`.
- **Driver trick (gui-scope-zoom-pill):** clearing `sidebar-scope` / `zoom-level-v2` from `localStorage` **after mount but before the folder click** shows shipped defaults rather than the dev machine's stored values.
- **Driver trick (gui-66):** a webContents zoom change is measurable **in the DOM** as `window.innerWidth` moving inversely. Also: read a shared group's DECLARED value out of `document.styleSheets` when live siblings carry user-resized inline widths.
- **Driver trick (gui-63 / gui-62 / gui-61 / gui-55):** seeded tool calls and terminal-shaped sessions can be written straight into the native store; the Write assertion is one of **absence**; clean up on every exit path.
- **jsdom is blind to CSS, so a visual ticket needs a driver** — and a *CSS-only* change needs more than a driver. **Resolving `var()` in both compiled bundles and diffing declarations per selector is the exhaustive check.**

## Deferred (still no spec)

**Deferred by #64, with reasons on record:** literal **persistent acrylic** via a native window-composition dependency ([[2026-07-23-persistent-glass-deferred]] stays live for it); a **light theme**; **re-hueing the danger shades or the three syntax-highlight colours**; **bulk delete / clear-all / archive / rename / undo / trash** for sessions; **gating `win.show()` on the first preference push** (only if a driver measures the launch artifact as objectionable — #69 did not measure it); a **resize grip or persisted width** for the Appearance dock; **refactoring the titlebar's four dock props** into a generic pair; **reducing the titlebar's control count**; ~~re-tuning the neutral palette per backdrop~~ (**struck 2026-07-31** — this entry contradicted `DESIGN.md`, which states the opposite as a rule: "The neutrals are not re-tuned per backdrop (#69)" and "If Mica ever reads too dark, that is a theme value or a defect, not a coupling to build." The design doc is newer, more specific, and was rewritten by #69 for this purpose, so it governs); **migrating the four existing preference keys** to any new storage.

**Struck 2026-07-31 as already delivered:** "one-click restart on `terminalError`" shipped as **#73**; and "busy-switch detach" was never deferred — it was **decided against**, with a live ADR ([[2026-07-23-busy-switch-block-not-detach]]). Both were still sitting in the lists below as though open.

**Newly noted by #70:** whether a fifth palette is ever wanted (the whitelist, the `Record<Theme, string>` copy map and the key-set test all make it a three-line change, deliberately); and whether `--color-mint*` should be renamed now that mint is one palette of four rather than the only one — cosmetic, and a rename touches every component site.

**Noted by #67, now with a caveat:** renaming `rails.css:325`'s `var(--color-mint)` to the short alias every other component site uses. Still cosmetic **at that site** (it is not nested under a `data-theme` opt-in) — but #70 established that the long name and the alias are **not** interchangeable inside one, so this is no longer a pure find-and-replace class of change.

**Carried, still unspec'd:** filter or de-noise the `sdk-cli` rows (**#68 is explicitly not the answer**); revisit the scope-chip control for contrast; give `.command-row-btn` its `font: inherit`; decide whether tint steps 1 and 2 should collapse; decide Tailwind's fate.

**Deferred by #58, with reasons on record:** honest whole-file **Write diff**; **per-tool rich card bodies**; **permission-mode default or persistence**; **adopting the SDK's richer permission metadata**; a **wrapper-owned truncation cap**; a **diff dependency**; **syntax highlighting inside diffs**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a collapsed strip; ~~native turn-end notifications + taskbar flash~~ (**struck 2026-07-31 — shipped as #75, `9905e1d`**); ~~type-while-busy composer then queued send~~ (**struck 2026-08-01 — shipped as #80, `1855910`**); ~~one-click restart on `terminalError`~~ (shipped as #73); **turn pulse** from the dropped telemetry; **MCP + settings-parse health** surfacing.

**Newly noted by #80, and named Out of Scope on its ticket:** a **multi-prompt
queue** with reordering and post-commit editing — a different feature with its
own UI, and the flag-on-the-draft design is deliberately one-by-construction, so
this is a rewrite rather than an extension. Also unaddressed: whether a queued
prompt should survive a **Stop** as a queued prompt rather than as a draft (it
currently un-queues and leaves the text), and whether the pending row should show
the text itself rather than a fixed label — it does not need to today, because the
draft it refers to is visible in the composer directly beneath it.

**Struck 2026-08-01 as delivered:** ~~the **background-tasks feature** on the CLI's `background_tasks_changed` level signal~~ — **shipped as #83 (`ea780a0`)**, with every shape the grant decided: injected port, own section, `local_agent` guard untouched, inside the existing Agents dock.

**DELIVERED 2026-08-01 as #85 (`3e24a53`)** — nesting shipped as the hybrid the
owner chose. The two notes below are kept for the trail only; neither is open.

**MEASURED 2026-08-01 by #84** — the entry below is superseded on its central
factual claim and kept for the trail. #84 found the spawner **is** reachable: a
`local_bash` `task_started` carries `tool_use_id` (3/3) but no parent of any name,
and the owning agent sits on the **`assistant` message carrying that Bash
`tool_use` block** as `parent_tool_use_id`. So the join is
**level `task_id` → `task_started.tool_use_id` → the containing assistant
message's `parent_tool_use_id`**, every hop already received by `engine.ts`. What
remains unspec'd is **not** feasibility but the **visual form**, which is an open
owner decision. See [[2026-08-01-the-spawner-is-one-hop-off-task-started]].

**Newly noted by #83, and named Out of Scope on its ticket:** the **`taskToParent` join**. #81 measured the level's `task_id` matching `task_started.task_id`, the `taskToParent` key and the `agent-<id>` sidecar id — one value in four places — but the payload carries **no `tool_use_id` and no parent**, so parentage is reachable only when the `task_started` was seen. #83 treats the join as **observed and reserved** and does not use it; nesting a background task under its spawner is a separate ticket. Also unaddressed: whether a background task should ever become **clickable** (it has no sidecar and no transcript today, so there is nothing behind it), and whether the CLI's `backgroundTasks()` accessor is ever worth calling — #81 measured it changing no membership, because the `Agent` tool is already async.

**Struck 2026-08-01 by the grant, with warrants:** ~~a labelled / node-box map~~ (the map ADR states a principle *and* a mechanism, and the mechanism survives a wider container); ~~a new top-level surface~~ (background tasks join the Agents dock instead); ~~**map pan-zoom**~~ (the fixed canvas is the *reason* it is unnecessary, its one named ceiling has a cheaper recorded fix, and nothing anywhere states what it was for — re-file it only if a real complaint attaches).

**Newly noted by #75:** whether a **"notifications off" preference** is ever wanted — deliberately not built (Out of scope), and if it lands it is a renderer-stored key with a control in the Appearance dock under that dock's constraints. Also unanswered by measurement: whether the toast actually **paints** on this machine, since no driver can see Action Center; the app identity is verified statically only.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the **watch-installed-after-the-read gap**; context-pressure meter; typed failed-turn recovery; full-text transcript search; **session rename / archive**; drag-and-drop; replay thumbnails; N-concurrent engines; **fork-on-resume**; busy-switch detach (decided against); folding `Welcome`'s last `pickFolder` caller onto the chooser; agent archive / control (**map pan-zoom struck 2026-08-01**); and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — **#83, shipped; why the port's pin is about timing rather than payload, why the reset lives in `close()` rather than `makeEngine()`, why `onTerminal`'s `close()` rule is deliberately inverted here, and why the level is filtered rather than joined**
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — **#82, shipped; a dependency that could only change once, why the second dep was rejected, and why `keepStale` lives on the read rather than the effect**
- [[2026-08-01-the-background-agents-seed-decided]] — **all seven parked calls taken under a live grant; two authorise work (#82, #83), four close as no, one is struck, and four are decided against the seed's literal words**
- [[2026-08-01-background-tasks-changed-fires-and-the-ids-join]] — **#81, measured; all three conditions held, `src/` unchanged anyway, and the two findings that bind any future build (the async Agent tool, and a level event landing past `result`)**
- [[2026-08-01-a-queued-prompt-is-a-flag-on-the-draft]] — **#80, shipped; why the queue is a flag rather than a payload, why the flush condition is positive, and why an unqueue keeps the text**
- [[2026-07-31-the-window-waits-until-it-knows-where-to-be]] — **#79, shipped; the window remembers its size and position, and the `win.show()` gate #78 declined was built here**
- [[2026-07-31-a-drivers-own-setup-can-revoke-what-it-measures]] — **#77, shipped; why the CLI-sourced surfaces are measured before the session is opened, and why `.session-groups` had to be seeded**
- [[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]] — **#76, shipped; why the skip's reason expired, and why two of three survival assertions measured nothing**
- [[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]] — **#75, shipped; why main answers it with no channel, why `turn-aborted` is silent, and why `isFocused()` alone is the wrong instrument**
- [[2026-07-31-the-renderer-is-sandboxed-and-the-driver-must-not-undo-it]] — **#74, shipped; why the flag bought nothing, and why the driver had to drop `--no-sandbox` to prove it**
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — **#73, shipped; why the distinction is a broadcast, and why resume binds at warm-up**
- [[2026-07-23-engine-terminal-on-stream-death]] — **amended by #73: premise confirmed, reversibility clause spent, nothing reversed**
- [[2026-07-31-the-titlebar-centre-is-a-flex-item-not-an-overlay]] — **#72, shipped; why containment is structural and what the ~15css off-centre trade buys**
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — **#71, shipped; why the instrument moved to device pixels and the CSS did not move at all**
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — **#70, shipped; carries TWO amendments — #67's `color-mix()` correction and #70's own mechanism confirmation plus the alias limit**
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — **#69, shipped as argued; amended with the live confirmation**
- [[2026-07-31-a-preference-lives-where-it-is-read]] — **#69 consumed it; the premise held**
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66, shipped as argued
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68, amended with the probe result
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, and the rule the driver set now follows
- [[2026-07-30-the-import-order-is-the-cascade]] — where `themes.css` and `appearance.css` sit
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] · [[2026-07-23-tailwind4-tokens]] — the token store #70 overrides
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — the reflex behind mutation-verifying #69's pins
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] ·
  [[2026-07-30-two-disclosures-two-booleans]] ·
  [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]] ·
  [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-28-sanitizing-replay-markup-is-an-anchor-not-a-strip]] ·
  [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] ·
  [[2026-07-28-choosing-a-folder-is-not-changing-workspace]] ·
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]] ·
  [[2026-07-28-composer-height-is-css-not-state]] ·
  [[2026-07-27-slash-commands-are-a-dumb-pipe]] ·
  [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-in-app-permission-mode-toggle]] ·
  [[2026-07-23-busy-switch-block-not-detach]]
