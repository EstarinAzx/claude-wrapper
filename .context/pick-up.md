---
type: pick-up
project: claude-wrapper
updated: 2026-08-02
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next ticket: #89 — the `sdk-ts` provenance comment

**Queue is NOT dry, but it is down to one.** #88 landed and closed this leg.

- **#89** — the session-listing comment claims this app writes `sdk-ts`; there
  are zero such records — **next, and the last `ready-for-agent` ticket**
- ~~**#88**~~ — closed, `833f969`. MCP health measured **alive**; see below.
- ~~**#87**~~ — closed, `75f1db9`. The thinking block arrives **empty**.
- **#86** — `ready-for-human`, **not yours**: the findings + five owner calls.

**Run the frontier query anyway** — this line is a snapshot and the owner may
have filed or closed since. Standing lesson: a leg once wrote that closing #70
would empty the queue and was wrong, because #71 had been unblocked all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

### #89 is the first ticket in this batch that TOUCHES `src/`

#87 and #88 were both measurement-only. #89 is not — step 4 of its body edits
`src/main/session-store.ts:34-40`. So unlike the last two legs:

- The **full gate is owed**: typecheck + `npm test`. Baseline is **953 tests
  across 63 files**; it should stay 953 unless you add tests.
- `tests/session-store-live.test.ts` **pins the behaviour against a real store** —
  read it before touching the comment, and do not weaken the pin.
- **Do not delete the argument.** The comment explains that
  `includeProgrammatic: true` stays explicit so a future SDK default flip cannot
  take it silently. Fix the reasoning; keep the guard.
- The **GUI driver batch is still not owed** — a main-process comment is not
  renderer code and not CSS. If you do touch the renderer, the batch is 22
  assertion drivers + the observational `gui-scope-zoom-pill`, and `gui-75` has a
  documented environmental red (reproduce on clean `main` before blaming it).

### Two things from #88 that bear on #89 directly

- **`resolveSpawnEnv` (`backend-mode.ts:43-55`) spreads `process.env` wholesale**
  and never sets `CLAUDE_CODE_ENTRYPOINT`. #88 imported that same function rather
  than approximating it — do the same for #89's step 1, because the whole finding
  is what the app's real spawn env does, not what a hand-rolled one does.
- **A launch from inside a Claude Code session inherits the parent's
  entrypoint.** #89's step 1 asks for the launched-from-outside case explicitly;
  that comparison IS the finding, and an agent-run measurement is inside a
  session by construction. If you cannot get an outside-a-session launch, say so
  plainly rather than reporting the inside case as the answer — #87 recorded
  exactly that shape of limit for the native backend and it was the right call.

## Landed last leg

**#88 — MCP health already arrives, once per turn.** Landed as `833f969`, ticket
closed. Measurement only, **no `src/` change**. Gate green: typecheck clean,
**953 tests across 63 files** (baseline unchanged — scripts only). GUI batch
**not** triggered.

Measured on host CLI **2.1.220 / SDK 0.3.220**, backend `wisped`, by
`scripts/spike-88-mcp-status.mjs` — three configs × two turns, 4–6 poll points
each. Evidence at `scripts/spike-88-findings.json` (scrubbed: `config` values
never recorded, only key sets and `type`; `error` verbatim only for
spike-injected servers).

**All four questions positive**, the opposite outcome to #87:

- **Q1 — `init.mcp_servers` is non-empty.** 4 measured, **3 app-visible**.
- **Q2 — no push of any kind.** The only mcp-shaped key on any message at any
  depth is `$.mcp_servers` on `system:init`.
- **Q3 — `mcpServerStatus()` works at every poll point**, 0–13ms, **including
  before the first turn and before any `init` has arrived**.
- **Q4 — a broken server reports `status: 'failed'` with
  `error: "MCP error -32000: Connection closed"` — and the failure is visible on
  the `init` snapshot too.**

**The finding the four questions did not ask for: `init` fires once per TURN,
not once per session.** So `engine.ts:461-465` is already handed a fresh
`mcp_servers` every turn and discards it. The cheapest build is a second field
read in a branch that already exists. **This partly retires #86's "must ride an
injected port" constraint** — the port is only needed to refresh *while idle*.

`init` carries exactly `{name, status}` and is enough for a red dot; only
`mcpServerStatus()` says **why** (`error`) and answers before turn 1.

See [[2026-08-02-mcp-health-already-arrives-once-per-turn]].

## Landed the leg before

**#87 — the extended-thinking block arrives, and it is empty.** `75f1db9`,
closed. Measurement only. A `thinking` block **does** reach the app on the app's
own options with no config set, and its `thinking` field is **0 chars in all
five configs**, only `signature` populated at 756–952. So the collapsed-strip
feature closes on **content**, not reachability, independently of #86's UI
constraints. Discriminating: 5 blocks on the reasoning prompt, 0 on the control.

One thread open and **not code**: the native path is unmeasurable here (host CLI
says `Not logged in`). After a human `/login`: `SPIKE87_BACKEND=native
SPIKE87_ONLY=control-app-options`.

See [[2026-08-02-the-thinking-block-arrives-empty]].

**Before that: #85** — agent-spawned background tasks nest under their spawner
(`3e24a53`); two new maps, `taskToParent` deliberately not one of them, nesting
kept a RENDER concern so #83's separate prop survived. See
[[2026-08-01-nesting-happens-in-the-render-not-the-model]].

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #88:

- **A lever whose own effect is unverifiable cannot test anything.**
  `toggleMcpServer` returns `void`. It returned ok for an sdk-type server and
  changed nothing observable — indistinguishable from a frozen status.
  `setMcpServers` settled the question *because* it returns
  `{added, removed, errors}`: the pull is confirmed before the effect is
  consulted. **Prefer the lever that reports itself.**
- **`init` fires per turn, not per session.** Any reasoning treating it as a
  one-shot session snapshot — including #86's — is wrong.
- **`McpServerStatus.config` carries `env`**, which is where an MCP server's API
  keys live. Never log or commit it; key set and `type` only.
- **`disabled` is a status and the common one here** (3 of 4 servers). A panel
  rendering only `connected`/`failed` shows almost nothing.
- **cwd selects the project MCP scope.** The temp cwd under `C:\` picked up a
  `scope: "local"` server keyed `"C:/"` in `~/.claude.json` that the repo cwd on
  `D:\` never sees. Caught by the measured per-server `scope` field **after** the
  findings file's first draft asserted the two cwds were equivalent — a written
  assumption corrected by a measurement, which is the #86 landmine again.

Still true from #87:

- **`result.subtype` is `'success'` on a failed turn.** `is_error` is the field
  that says so. A spike reading only `subtype` reports a clean zero for a config
  that never reached a model — indistinguishable from a real negative.
- **Unsetting `ANTHROPIC_BASE_URL` by hand is not native mode.** It leaves
  `ANTHROPIC_API_KEY` in place. Import `backend-mode.ts`'s `resolveSpawnEnv`.
- **A type census answers what shapes exist, never what belongs to what.**
  Correlating deltas to their `content_block_start` index killed a live-leak
  hypothesis that the census alone appeared to support.

Still true from #86:

- **A comment in this repo can assert a fact the disk does not support** —
  `session-store.ts:34-40`, which is **#89's whole subject**.
- **The `entrypoint` value set is larger than the SDK's** (`claude-vscode`
  exists on disk, 0 matches in `sdk.mjs`).
- **The app silently drops every content-block type it does not know**
  (`engine.ts:546-570`) and there is **no logging anywhere in `src/`**. So "we
  never saw X" is not evidence about X.
- **`engine.ts:461-465` reads one field off `init` and discards 15** — #88 turned
  this from a note into the cheapest half of a feature.
- **Skipping a step beats fabricating its artifact.** Record the deviation.

Still true from #85: **a mutant can kill a BAD TEST before it kills the code**;
**reproduce a red on clean `main` with the work stashed before calling it a
regression**; **judge drivers by exit code, never by scraping stdout**; **when a
guard turns your case away, record before the guard, not after**.

Still true from #84: **a field's absence is only a measurement if a
differently-named field could have been seen** — record `Object.keys(msg)`;
**check whether your negative path was ever exercised**; **a ticket's stated
implication can be wrong even when its observation is right**; **data captured is
not data recorded**; **`parent_tool_use_id` is on the `assistant` envelope**.

Still true from #83: **check whether every path reaches your candidate EAGERLY**
(`close()`, not `makeEngine()`); **two ports on one lifecycle hook can want
opposite things**; **`nonAgentTasks` excludes only `local_agent`**; **render the
raw `task_type`**; **`.background-tasks` depends on `.agents-dock` being a flex
column with `min-height: 0`**.

Still true from #82: **a value written once per session cannot trigger something
that happens once per turn**; **an assertion that something SURVIVED is vacuous
unless the thing it survives is shown to have happened**; **a refresh must not
blank what it already has**; **`keepStale` is on the read**.

Still true from #81: **a level event can land AFTER `result`**; **the `Agent`
tool is ASYNC**; **a NEGATIVE is only a measurement if the path was exercised**;
**sidecars live at `<projectDir>/<sessionId>/subagents/`** — copy
`subagentsDir()`, never guess it.

Still true: **the composer is never `disabled`**; **`lastTurn`'s nonce is
load-bearing**; **`unqueue` releases the commitment, never the text**; **a double
flush is invisible to jsdom**; **an edge between two samples is not observable by
sampling**; **`resume` binds at query CONSTRUCTION** and `warmUp` TAKES the
target; **a stream dying BETWEEN turns emits nothing**; **`win.isFocused()` alone
is not "someone is looking"**; **opening a past session CLOSES the engine**;
**a test asserting an ABSENCE is the one most likely to be vacuous**; **no
expected driver failure**; **pins are mutation-verified and no pin retirement is
authorised**; **do not add a second busy flag**; **never un-key the composer**;
**anything workspace-scoped must join the `ok` branch**; **main reports
`getNormalBounds()`**; `tests/scrollbar.test.ts` scans every line naming a
scrollbar pseudo-element; `gui-51` compares in **device** pixels; measure with
`getBoundingClientRect`; `.titlebar-center` must stay IN FLOW; **`src/` is CRLF**
(and so is `scripts/`) while `.context/*.md` is LF; a new `window.api` channel
needs **all four** mock sites plus `preload/index.d.ts`; never hardcode a model
name.

From #78: **Playwright cannot measure a launch**; **`NODE_OPTIONS=--require`
never reaches Electron**; **`--disable-gpu` is load-bearing in a background
session**; **Chromium persists the zoom factor per origin inside `userData`**.

## Baseline

`main` = `833f969` + this leg's `.context` commit, pushed. No open branches.
Test baseline **953 across 63 files** — unchanged by #87 and #88, both
scripts-only.

**22** assertion drivers plus the observational `gui-scope-zoom-pill`. Last full
batch run at `3e24a53`: **22 green, `gui-75` red**, and that red is
**environmental, NOT a regression** — reproduced identically on clean `main`
(`47ad14d`) with the work stashed. It is a premise the driver could not
establish. Failed 3/3 there, so **the documented focus flake is not always
intermittent in a background session**.

**Judge drivers by exit code.** A batch script grepping stdout for `FAIL` reports
`gui-61` red on its own fixture card text; its exit code is 0.

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs` (**+76 lines**
past what #81 ran), `spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`. All three
import the app's real `cli-path.ts` / `backend-mode.ts` rather than copying them
— follow that when writing the next one.

## Do not decide these

**The seven are DONE** and the 2026-08-01 grant is **fully spent** (#82, #83 both
landed). `.claude/vibe.md`'s `## Needs you` is history, not a queue. A new
**reason** reopens one of those calls, not a re-read.

**Two older halves still stand and are still the owner's:** Tailwind is **not
dropped** but the adopt-utilities question **stays open**; the titlebar's control
count **does not change** while the aesthetic question **stays the owner's**.

**The 2026-08-02 vibe run's five calls are the owner's and are OPEN** — #86 holds
them. #88 moved the ground under two of them but answered neither: owner call 1
(where does a non-agent panel live?) is still **the gate on any MCP UI**, and
owner call 5 (settings-parse half — drop or re-scope?) is untouched. Owner call 2
went moot on #87 for want of a subject.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — **#88, this leg; init fires per turn, the failure is already in the payload, and the lever that made the negative real**
- [[2026-08-02-the-thinking-block-arrives-empty]] — #87; the block arrives with nothing in it
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — #85; the hybrid, the two maps, and the mutant that killed a bad test
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84; the spawner IS reachable, and the ticket's predicted conclusion was falsified
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83; the injected-port shape #86 assumed #88's feature would need
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82
- [[2026-07-25-agents-dock-disk-contract]] · [[2026-07-25-live-rows-two-sources-one-event]]
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the port shape
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
