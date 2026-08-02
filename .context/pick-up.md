---
type: pick-up
project: claude-wrapper
updated: 2026-08-02
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## queue empty

**#89 landed and closed. Nothing is `ready-for-agent`.** The relay chain stopped
here rather than spawning another leg — the queue going dry is its designed stop.

- ~~**#89**~~ — closed, `5e41520`. The entrypoint is a launch-env fact; see below.
- ~~**#88**~~ — closed, `833f969`. MCP health arrives once per turn.
- ~~**#87**~~ — closed, `75f1db9`. The thinking block arrives empty.
- **#86** — open, `ready-for-human`, **not loop work**: findings + five owner calls.

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

## Landed last leg

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

Full ledger in [[active-work]] — long and load-bearing. New from #89:

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

`main` = `5e41520` + this leg's `.context` commit, pushed. No open branches.
Test baseline **953 across 63 files** — unchanged by #87, #88 and #89 (#89's
`src/` diff is comment-only).

**22** assertion drivers plus the observational `gui-scope-zoom-pill`. Last full
batch run at `3e24a53`: **22 green, `gui-75` red**, and that red is
**environmental, NOT a regression** — reproduced identically on clean `main`
(`47ad14d`) with the work stashed. **Judge drivers by exit code.**

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`.
All four import the app's real `cli-path.ts` / `backend-mode.ts` rather than
copying them — follow that when writing the next one, and note #89's finding that
`session-index.ts` **cannot** be imported the same way.

## Do not decide these

**The seven from `.claude/vibe.md` are DONE** and the 2026-08-01 grant is fully
spent. That file's `## Needs you` is history, not a queue. A new **reason**
reopens one of those calls; a re-read does not.

**Two older halves still stand and are still the owner's:** Tailwind is **not
dropped** but the adopt-utilities question **stays open**; the titlebar's control
count **does not change** while the aesthetic question **stays the owner's**.

**The 2026-08-02 vibe run's five calls are the owner's and are OPEN** — #86 holds
them. Owner call 1 (where does a non-agent panel live?) is still **the gate on
any MCP UI**. Owner call 2 went moot on #87 for want of a subject. **#89 moved
owner call 5's ground**: the `sdk-cli` de-noising half now has a stronger
negative than it asked for — the wrapper's own sessions and the GUI drivers'
carry the **same** `entrypoint` value and are not separable by it. Whether to
de-noise at all is still the owner's.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — **#89, this leg; the launch env decides, one record decides a session, and the value set is five**
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89; its `sdk-ts` provenance sentence is false, its decision stands**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — #87
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — #85
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84; right observation, wrong stated implication
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
