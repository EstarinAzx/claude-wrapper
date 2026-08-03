---
type: pick-up
project: claude-wrapper
updated: 2026-08-03
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Frontier: QUEUE EMPTY

**No `ready-for-agent` ticket is open.** #90 landed and closed this leg and was
the only one. The two remaining issues are both `ready-for-human`:

- **#86** — open, `ready-for-human`, **not loop work**: findings + five owner calls.
- **#91** — open, `ready-for-human`, **blocked by 1** (#86; #90 cleared this leg).
  The background-sessions *surface*. **Do not build it** — see `## Do not decide these`.
- ~~#87 / #88 / #89 / #90~~ — closed.

**Run the frontier query anyway** — this line is a snapshot and the owner may
have filed since. This project's standing lesson is that a leg once wrote that
closing #70 would empty the queue and was wrong, because #71 had been unblocked
all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

If it really is empty, **the next move is the owner's** — file work, or run
`/preset init` / `/preset vibe init` to generate a batch. `active-work.md`'s
`## Deferred` is the standing candidate menu and `## Open questions` holds what
needs an answer before it can be specced.

## Landed this leg (2026-08-03, evening) — architecture pass, no ticket

**`createEngine`'s seven port/getter slots are now one named `EnginePorts`
object** (`c7cee33`) — the three-arg construction (83 test sites) is untouched;
the six placeholder-laden sites collapsed to named keys. **`index.ts` gained
`discardEngine(resume)`**, the one funnel for the five IPC discard paths
(folder pick, `chat:target`, backend flip, permission cycle, model pick); the
switch transaction's port-sequenced teardown is deliberately NOT routed through
it. Port semantics untouched: `onTerminal` never fires for `close()`,
`onBackgroundTasks` fires `[]` there, reset still lives in `engine.close()`.
Gate green: typecheck clean, **953 tests across 63 files** (baseline
unchanged), all three files verified 100% CRLF. Owner-directed
(`/improve-codebase-architecture`), off-tracker by design.

Assessed and deliberately NOT taken: `handleMessage` split (internal to a deep
module, no interface gain), titlebar dock-prop pair (owner-deferred in
[[active-work]]), Tailwind (owner call), any renderer state move (ledger
forbids the specific "tidyings" available there). The next engine port (#86's
MCP-health seed would be the fourth) now costs one named key, not slot-counting.

## Landed earlier (2026-08-03) — #90, measurement only

**The CLI's background sessions ARE reachable — by one route, at one CLI process
per look.** Landed as `c989fe5`, ticket closed. **No `src/` change**; the
deliverables are `scripts/spike-90-agent-view.mjs`, evidence in
`scripts/spike-90-findings.json`, and an ADR. Gate green: typecheck clean,
**953 tests across 63 files** (baseline unchanged). GUI batch **not** owed — two
files under `scripts/` and one ADR are neither renderer code nor CSS.

Measured on host CLI **2.1.220 / SDK 0.3.220**, backend `wisped`.

| | question | answer |
|---|---|---|
| 1 | SDK exposes them? | **No** — 29 exports, none list background sessions |
| 2 | `claude agents --json`? | **Yes** — exit 0, parses, no TTY needed |
| 3 | Payload? | **Two row shapes**; `state` at **four** values, open |
| 4 | Push or poll? | **Poll only** |
| 5 | Cost? | median **893ms** (min 846, max 1068, n=5) |
| 6 | `--cwd` scopes? | by **directory** yes, by **kind** no, and it keeps the caller |

**Three findings the six questions did not ask for:**

- **`sessionId` is the only universal key.** `id` is absent on interactive rows.
  And `state` (background-only) vs `pid`/`status` (live process) means **no
  single field describes a row's liveness**.
- **The app appears in its own listing**, as `kind: "interactive"` — measured by
  running a real `query()` at `engine.ts`'s options and polling *during* the
  turn. An SDK-spawned headless CLI does register with the supervisor.
- **`~/.claude/daemon/roster.json` carries attach credentials** (`rvAuth`,
  `ptyAuth`, socket paths, `dispatch.env`). Never log, never commit.

**Two corrections the harness made to itself, both worth knowing:** its first run
answered Q1 **YES** off a name-level regex matching `getSubagentMessages` /
`listSubagents` — the repo's third meaning of "agent". It now *calls* candidates.
They then returned `[]`, and an empty array has no fields by construction, so the
negative was **vacuous** until it was exercised against a real session with
sidecars on disk. #81's rule, biting inside the instrument.

See [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]].

## Landed previous session (2026-08-03) — no ticket, a trace and two filings

- **`.context/flows.md` started** (`3447ace`) — first entry is the Agents dock:
  how it opens, where background tasks render, entry point and key files.
- **`.claude/skills/run-desktop/gui-agents-dock.mjs`** (`3447ace`) — 13 checks,
  exit 0, **no CLI turns**.
- **The name collision recorded** (`522957a`) — this app's Agents dock is **not**
  the CLI's agent view. Read that section before writing "the agents view".
- **#90 and #91 filed.** #90 is now closed.

Two cautions on that driver, both written into `flows.md`:

- Its background half is a **synthetic** `tasks:changed` push from main — it says
  **nothing** about whether the CLI emits the level. Not end-to-end evidence.
- **Resizing the window mid-run was tried and abandoned.** DOM and frame
  disagreed microseconds apart under `--disable-gpu`. **Unresolved** as artifact
  vs defect. Anyone shooting a wide window settles this first.

## Landed before that

**#89 — the entrypoint this app writes is a fact about the launch env.** Landed
as `5e41520`, ticket closed. The `src/` change is a **comment**; no behaviour
moved and the live pin is untouched. Gate green: typecheck clean, **953 tests
across 63 files** (baseline unchanged). GUI batch **not** triggered — a
main-process comment is neither renderer code nor CSS.

Measured on host CLI **2.1.220 / SDK 0.3.220**, backend `wisped`, by
`scripts/spike-89-entrypoint.mjs` — three configs, one real turn each, evidence
at `scripts/spike-89-findings.json`.

**The ticket's observation was right and its implication was half wrong** (the
#84 shape, third time). There really are zero `sdk-ts` records here; that means
the comment named the wrong member of the set, not that the discriminator is
missing. The SDK's stamp is inherit-wins
(`if (!env.CLAUDE_CODE_ENTRYPOINT) env.CLAUDE_CODE_ENTRYPOINT = "sdk-ts"`) and
`resolveSpawnEnv` spreads `process.env` wholesale, so:

| launch context | wrote | verdict | hidden by `false` |
|---|---|---|---|
| terminal Claude Code session | `sdk-cli` | programmatic | yes |
| outside any session | `sdk-ts` | programmatic | yes |
| VS Code Claude Code session | `claude-vscode` | **interactive** | **no** |

An inherited value is **transformed, not passed through**, and there is **no
`sdk-` prefix rule** — the third config exists to test exactly that. The
conclusion survives and is now measured at the store level: `false` takes the
listing from **806 rows to 567**, a 239-row delta.

See [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]]. It **amends**
[[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]], whose "this app
writes `sdk-ts`" sentence is now false — read the amendment before citing it.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #90:

- **`sessionId` is the ONLY universal key in the agent-view payload.** `id` is
  absent on interactive rows (and is an 8-char `sessionId` prefix where present).
- **No single field describes a row's liveness.** `state` = supervisor lifecycle,
  **background rows only**; `pid` + `status` appear together exactly when a live
  process exists.
- **`state` is FOUR values here** (`blocked`, `done`, `failed`, **`working`**),
  against the three the ticket predicted, and **not closed**. Render the raw
  string — #83's `task_type` rule.
- **`status` is not closed either, proven live.** The findings file recorded
  `<null> | busy`; minutes later, same session, an interactive row read
  **`idle`**. The open-set rule is not a hedge here — it fired within one sitting.
- **An SDK-spawned CLI REGISTERS with the supervisor, as `kind: "interactive"`.**
  The app is visible to the agent view and to itself, and `cwd` cannot filter it
  out.
- **`~/.claude/daemon/roster.json` holds ATTACH CREDENTIALS** — `rvAuth`,
  `ptyAuth`, `rendezvousSock`, `ptySock`, `dispatch.env`. Never read it into a
  log, a findings file or a UI.
- **The listing is a JOIN.** `~/.claude/sessions/` covered 2 of 6 active rows,
  `roster.json` 1 of 6. Watching either is a re-poll trigger, not a substitute.
- **A name-level scan for "agent" here returns SUBAGENT APIs.** #90's own first
  run got its headline answer wrong that way. **Call the thing before believing
  its name** — and remember an empty return measures nothing.
- **`scripts/spike-89-findings.json` leaks the OS username** (absolute temp
  path). spike-90 records the basename only. Not fixed; not that ticket's file.

Still true from the 2026-08-03 trace:

- **"The agents view" is AMBIGUOUS in this repo.** This app's Agents dock is an
  aside listing subagents *inside* one session; the CLI's agent view is a
  full-terminal list of whole background *sessions* and explicitly does not row
  subagents. Near-inverses sharing a name. Say which one, every time. Third
  meaning of "agent" here, beside the two `background-tasks.ts` reconciles.
- **The wrapper cannot reach the CLI's agent view by construction** — it runs the
  CLI headless via the SDK, so there is no TUI, no `←` binding, no takeover
  screen. Anything of that shape must be built, and #91 records why it is blocked.
- **The sessions rail is the dangerous lookalike.** It has a "This project /
  All projects" scope control, so it *looks* like a session list already exists.
  It lists stored transcripts, not live processes: no state, no attach, no
  dispatch.
- **A driver that resizes the window revokes what it measures** — see the
  unresolved paint disagreement above. `gui-agents-dock.mjs` collapses the
  sessions rail instead. This is #77's lesson recurring.
- **Element screenshots clip to the viewport.** `el.screenshot()` on a node that
  sits outside the window returns grey, not the node. It is not a fallback for a
  too-small window.

New from #89:

- **`entrypoint` is decided by the LAUNCH ENV, never by this app.** Any future
  reasoning of the form "this app writes X" is wrong by construction. Three
  measured values, and one of them (`claude-vscode`) is classified
  **interactive** — so the app *can* write a non-programmatic transcript.
- **ONE record decides a whole session.** The SDK reads only a 64KB head window
  and a 64KB tail window; the verdict is the **first** `entrypoint` in the head,
  else the **last** in the tail. Everything between is never read. **Counting
  records is not counting sessions** — which retires #89's own table method. And
  mixed-value session files exist (three found in a 400-file scan, mixing
  `claude-vscode` with `cli`), so "the session's entrypoint" is not well defined.
- **`sessionKind: "daemon" | "daemon-worker"` is a SECOND programmatic path**,
  independent of `entrypoint`. Any filter reasoning only about `entrypoint`
  covers one of two branches. Only `"bg"` exists on this disk (38575), so the
  path is unexercised here — not absent (#81's rule).
- **The value set is FIVE.** Full sweep, all 1178 JSONL across 139 dirs: `cli`
  100750, `claude-vscode` 7154, `sdk-cli` 3647, `sdk-ts` 1172, **`claude-desktop`
  21**. The last was unknown; anything outside the SDK's three-member set is
  silently **interactive**.
- **`entrypoint` rides the MESSAGE envelope**, beside `cwd` / `sessionId` /
  `version` / `gitBranch` / `sessionKind` / `userType`. Metadata records
  (`last-prompt`, `custom-title`, `agent-name`, `mode`, `permission-mode`,
  `file-history-snapshot`) carry none — 81 of 113 lines in a live file.
- **`session-index.ts` cannot be imported by a spike.** It imports
  `../shared/cwd-key` extensionless, which node's ESM resolver rejects under
  `--experimental-strip-types`. `cli-path.ts` and `backend-mode.ts` import fine.
  A spike needing a session's file must enumerate the store itself — and still
  must never re-derive a store path from cwd.
- **An agent-run measurement is inside a Claude Code session by construction.**
  #89's outside-a-session config is a reconstruction by environment, recorded as
  a `limit` field rather than reported as the real case. Same call #87 made for
  the native backend.

Still true from #88:

- **A lever whose own effect is unverifiable cannot test anything.**
  `toggleMcpServer` returns `void`; `setMcpServers` settled the question because
  it returns `{added, removed, errors}`. **Prefer the lever that reports itself.**
- **`init` fires per turn, not per session.**
- **`McpServerStatus.config` carries `env`** — never log or commit it.
- **`disabled` is a status and the common one here** (3 of 4 servers).
- **cwd selects the project MCP scope.**

Still true from #87:

- **`result.subtype` is `'success'` on a failed turn.** `is_error` says so.
- **Unsetting `ANTHROPIC_BASE_URL` by hand is not native mode.** Import
  `backend-mode.ts`'s `resolveSpawnEnv`.
- **A type census answers what shapes exist, never what belongs to what.**

Still true from #86:

- ~~**A comment in this repo can assert a fact the disk does not support**~~ —
  **discharged for `session-store.ts:34-40` by #89.** The general caution stands;
  that specific instance is fixed and now carries a findings pointer.
- **The `entrypoint` value set is larger than the SDK's** — now measured at
  **five** values against the SDK's three-member set.
- **The app silently drops every content-block type it does not know**
  (`engine.ts:546-570`) and there is **no logging anywhere in `src/`**. "We never
  saw X" is not evidence about X.
- **`engine.ts:461-465` reads one field off `init` and discards 15.**
- **Skipping a step beats fabricating its artifact.** Record the deviation.

Still true from #85: **a mutant can kill a BAD TEST before it kills the code**;
**reproduce a red on clean `main` with the work stashed before calling it a
regression**; **judge drivers by exit code, never by scraping stdout**; **when a
guard turns your case away, record before the guard, not after**.

Still true from #84: **a field's absence is only a measurement if a
differently-named field could have been seen**; **check whether your negative
path was ever exercised**; **a ticket's stated implication can be wrong even when
its observation is right** (#89 is now the third instance); **data captured is
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

`main` = `c7cee33` (the ports refactor). **The previous note's five unpushed
commits are PUSHED** — origin/main sat at `d6164b2` when this leg started, so
only `c7cee33` plus this `.context` commit are ahead. No open branches. Test
baseline **953 across 63 files** — unchanged by the refactor, re-verified green
at `c7cee33` with typecheck clean.

**Untracked and deliberately left alone:** `.context/2026-07-23.md` and
`.context/Untitled.canvas`, both **0 bytes** — Obsidian stubs from opening the
vault. Not committed, not deleted; the owner's to clear.

**22** assertion drivers plus the observational `gui-scope-zoom-pill`. Last full
batch run at `3e24a53`: **22 green, `gui-75` red**, and that red is
**environmental, NOT a regression** — reproduced identically on clean `main`
(`47ad14d`) with the work stashed. **Judge drivers by exit code.**

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`. All five import the app's real `cli-path.ts` /
`backend-mode.ts` rather than copying them — follow that when writing the next
one, and note #89's finding that `session-index.ts` **cannot** be imported the
same way. **#90 is the one to copy for scrubbing**: it records the temp dir's
basename rather than the absolute path, which keeps the OS username out of the
repo (the other four do not).

## Do not decide these

**The seven from `.claude/vibe.md` are DONE** and the 2026-08-01 grant is fully
spent. That file's `## Needs you` is history, not a queue. A new **reason**
reopens one of those calls; a re-read does not.

**Two older halves still stand and are still the owner's:** Tailwind is **not
dropped** but the adopt-utilities question **stays open**; the titlebar's control
count **does not change** while the aesthetic question **stays the owner's**.

**#91 is the owner's and is STILL BLOCKED — do not build it.** A
background-sessions surface is new UI, and #86's constraint that **no new feature
may add a titlebar control** is live state that survived a grill. Every dock
opens from a titlebar toggle and there is no router, so a new dock is
*unreachable*, and which existing dock a non-agent panel joins is owner call 1,
unanswered.

**#90 came back reachable and #91 did not move.** Its blocker count went 2 → 1,
which is exactly the trap: a leg reading "only one blocker left" and taking it
would be doing the thing #90's Out of scope forbade in advance. The ticket said
a leg that finds the data reachable **still may not build the panel**, and that
is what happened.

What #90 *did* change is the price #91 is deciding against, now written on the
ticket: **~893ms of a fresh CLI process per look, poll-only, staleness equal to
the poll interval, a `child_process` spawn this app deliberately does not have
(`cli-path.ts` chose a PATH walk over a `which` shell-out to avoid re-adding
one), a row shape that is two shapes, and a list that contains the viewer.**
Peek / reply / attach were out of scope and remain unmeasured — they are the
larger question.

**The 2026-08-02 vibe run's five calls are the owner's and are OPEN** — #86 holds
them. Owner call 1 (where does a non-agent panel live?) is still **the gate on
any MCP UI**. Owner call 2 went moot on #87 for want of a subject. **#89 moved
owner call 5's ground**: the `sdk-cli` de-noising half now has a stronger
negative than it asked for — the wrapper's own sessions and the GUI drivers'
carry the **same** `entrypoint` value and are not separable by it. Whether to
de-noise at all is still the owner's.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows.** First entry is the Agents dock, and it carries the
  agent-view name-collision table. Read it before any ticket naming "agents"
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — **#90, this leg; reachable by subprocess only, ~0.9s a look, poll-only, and the app is in its own list**
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89; the launch env decides, one record decides a session, and the value set is five
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89; its `sdk-ts` provenance sentence is false, its decision stands**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — #87
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — #85
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84; right observation, wrong stated implication
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
