---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Frontier: THREE unblocked `ready-for-agent` tickets

All three verified `blocked_by: 0` after #91 closed. **The `ready-for-human`
queue is still empty.**

| # | size | what |
|---|---|---|
| **#95** | tiny | `.subagent-drawer-backdrop` takes `tabIndex={-1}` like its sibling |
| **#96** | small | two off-scale values conform to `DESIGN.md` (`font-weight: 500`, `subagent-slide 180ms`) |
| **#97** | medium | measure the mint budget — **measurement only, no `src/` change** |

`ticket-loop` takes the oldest, which is **#95** — and this time the oldest is
also the smallest. It is a two-line change with a real trap attached: the sibling
it copies (`.subagent-drawer-close`) is **static-checked, not Tab-driven** (#93),
so a driver asserting the backdrop is not a tab stop must press real keys or it
measures nothing.

**Run the frontier query anyway** — this table is a snapshot, and this project's
standing lesson is that a leg once wrote that closing #70 would empty the queue
and was wrong, because #71 had been unblocked all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

~~#86 / #87 / #88 / #89 / #90 / #91 / #92 / #93 / #94~~ — closed.

## Landed this sitting (2026-08-04) — #91, `5e6699b`

**The app can now list live background Claude Code sessions.** A read-only,
manually-refreshed, workspace-scoped section in the **sessions rail**, above the
stored transcripts. This was the surface blocked since 2026-08-02, and it did not
need a new dock: #86.1 answered "a section in an existing surface", and **a
section needs no titlebar toggle**. Control count still **8**, pinned twice.

**Say which "agent" you mean.** This is the CLI's *agent view* (whole background
sessions). Not the Agents dock (subagents inside the open session). Not
`background-tasks.ts` (jobs inside the open session). Three meanings, and **two of
them are now visible in the same component** — [[flows]] has been corrected, since
its "this app has no equivalent of agent view" line is now false.

Two architectural facts, both in
[[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]]:

1. **`src/main/agent-view.ts` re-adds a `child_process` spawn.** `cli-path.ts`'s
   rule is not broken but **not met** — it is conditioned on *"a question
   `fs.existsSync` can answer"* and #90 established this is not one.
2. **Pull-only is a measurement.** 893ms per look, one whole CLI process, no warm
   path, no push channel; a 5s poll is ~19% of a core *and* the staleness window
   equals the poll interval. Refresh button + workspace change, nothing else.

**The real spawn works:** `gui-91` opened a *temp* workspace and the genuine
`claude agents --json --cwd <temp>` came back with an honest empty list — which is
also the only end-to-end check that `--cwd` scopes at all.

Before it, **#94** (`e1a2c31`) put the Commands dock in the app's own font;
**#93** (`07c0068`) gave every interactive control the focus ring, picked per
control; **#90** (`c989fe5`) measured this listing reachable at ~893ms per look.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. **New from #91:**

- **NEVER read `~/.claude/daemon/roster.json`** — `rvAuth` / `ptyAuth`, socket
  paths, `dispatch.env`. Attach credentials. Never log, never commit, never
  surface. It covers 1 of 6 active rows anyway.
- **The spawn is not a licence.** A future `child_process` must clear the same
  bar `cli-path.ts` sets — show there is no SDK route and no file that answers it
  — and get an ADR.
- **Nothing may put the background list on a timer.** The obvious mistake is
  three lines away: the rail's window-`focus` listener, correct for the cheap
  disk read beside it, would cost ~893ms of CLI process per refocus.
- **`sessionId` is the only universal key.** `id` is absent on interactive rows
  and only an 8-char *prefix* where present.
- **`state` and `status` are OPEN vocabularies** — render the raw string. Four
  `state` values measured where three were predicted.
- **No unified "is it alive" boolean.** `state` is background-only, `pid`/`status`
  belong to a live process, the row shape is two shapes. Neither `pid` nor
  `status` is carried into the app.
- **The app is in its own listing** as `kind: "interactive"`, and **`cwd` cannot
  exclude it**. `kind === 'background'` drops it.
- **An absence assertion needs surviving rows beside it** — #91's self-exclusion
  test feeds two background rows *plus* the interactive one, and the filter was
  mutation-verified. **Fifth instance** after #76, #82, #93, #94.
- **Whether `--cwd` matches by prefix or exactly is UNMEASURED.** The app
  delegates scoping to the CLI rather than deciding it. Assume neither answer.
- **jsdom loads no CSS, so no vitest test can see the accent budget.** `gui-91`
  resolves `--mint` live and scans every painted colour in the section; a new
  surface should do the same.

**Still live from #94:** **`font: inherit` is a SHORTHAND** and resets
`line-height` (plus style/variant/weight/stretch/size) — `rails.css` has zero
line-heights, `body` sets `1.6`, UA `normal` does not inherit, so it moves **every**
child including ones that set their own family. **Enumerate the shorthand; not
enumerating is what made the tailwind ADR wrong.** The neutraliser goes on the
**parent**. **`.command-row-name` / `.command-row-hint` render on TWO surfaces**
(dock + slash popover) and agree only because `.command-option` uses the
`font-family` **longhand**. **Every line-height in this app is unitless — all 19.**
**`.command-list`'s height measures nothing** (`max-height`-bound).

**Still live from #93:** a new control does not "join the focus group" by default
— **ask what it paints first**; `.model-pill` breaks the rule's letter **on
purpose**; `Tab` is not a way out of the composer while the slash popover is open;
the sessions rail is **100 real tab stops** (now 101, and any driver walking to
the composer must collapse it); **`el.focus()` does NOT reliably match
`:focus-visible` — press real keys**; **`.subagent-drawer-close` is
static-checked, not Tab-driven** — which is #95's trap;
`.session-row-btn-active`'s mint left-marker is replaced by the shared focus group
on focus (pre-existing, uncaught).

**Still live from #92:** **`DESIGN.md`'s accent clause is unverified in BOTH
halves** — the enumeration and the ≤10% — and **#97 exists to end that**; it still
**governs** meanwhile, and #91 spent no accent because of it. **`DESIGN.md` was
not amended, and must not be** to match current drift. **"No measurement can
answer a taste call" is a FALSE PARAPHRASE** carried in
`.claude/vibe-2026-07-31-*.md`; the real line is about **instruments, not
ownership**. **Two agreeing sources are not a quorum when a third exists.**

**Still live from #90:** the listing is a **join** the CLI performs, and the two
on-disk stores cover only 2 of 6 and 1 of 6 active rows; **a name-level scan for
"agent" here returns SUBAGENT APIs**; an empty return measures nothing.

**Still live from #89/#88/#87:** `entrypoint` is decided by the **launch env**,
never by this app, and **cannot** separate this app's sessions from its own GUI
drivers; **one record decides a whole session** (64KB head/tail windows); `init`
fires per **TURN**, not per session; `McpServerStatus.config` carries `env`;
**the thinking block arrives EMPTY** (`thinking: ""`, every config) — do not build
a thinking strip; `result.subtype` is `'success'` on a failed turn (`is_error`
says so); unsetting `ANTHROPIC_BASE_URL` by hand is **not** native mode (import
`backend-mode.ts`'s `resolveSpawnEnv`).

**Still true from #85/#84/#83/#82/#81:** a mutant can kill a **bad test** before
it kills the code; reproduce a red on clean `main` with the work stashed before
calling it a regression; **judge drivers by exit code**; a field's absence is only
a measurement if a differently-named field could have been seen;
`parent_tool_use_id` is on the `assistant` envelope; two ports on one lifecycle
hook can want opposite things; **an assertion that something SURVIVED is vacuous
unless the thing it survives is shown to have happened**; a level event can land
**after** `result`; the `Agent` tool is **async**.

**Still true:** the composer is never `disabled`; `lastTurn`'s nonce is
load-bearing; `unqueue` releases the commitment, never the text; a double flush is
invisible to jsdom; an edge between two samples is not observable by sampling;
`resume` binds at query **construction** and `warmUp` takes the target; a stream
dying **between** turns emits nothing; `win.isFocused()` alone is not "someone is
looking"; **opening a past session CLOSES the engine** (so `listModels()` /
`listCommands()` answer `[]` — reach them first); a test asserting an **absence**
is the one most likely to be vacuous — **mutation-verify it**, five times bitten
now (#76, #82, #93, #94, and #91's own guard); **no expected driver failure**;
pins are mutation-verified and no pin retirement is authorised; do not add a
second busy flag; never un-key the composer; anything workspace-scoped must join
the `ok` branch; main reports `getNormalBounds()`; `tests/scrollbar.test.ts` scans
every line naming a scrollbar pseudo-element (comments included);
`tests/multiline-composer.test.tsx` slices raw CSS between literal braces, so
**no CSS comment may contain a closing brace**; `gui-51` compares in **device**
pixels; measure with `getBoundingClientRect`; `.titlebar-center` must stay **in
flow**; **`src/` is CRLF** (git `core.autocrlf=true` normalises on add — the
warnings on commit are expected) while `.context/*.md` is LF; a new `window.api`
channel needs **all four** mock sites (`tests/chat-harness.ts`,
`session.test.tsx`, `shell.test.tsx`, `sidebar.test.tsx`) plus
`preload/index.d.ts`; never hardcode a model name; **`gh issue close --comment`
silently drops the comment if the issue is already closed — comment first, then
close**; a squash merge leaves the branch "not fully merged", so `git branch -D`
is correct there.

From #78: **Playwright cannot measure a launch**; `NODE_OPTIONS=--require` never
reaches Electron; `--disable-gpu` is load-bearing in a background session (and
flattens acrylic); Chromium persists the zoom factor per origin inside `userData`.

## Baseline

`main` = `5e6699b` (#91) plus the `.context` commits. **Unpushed — `main` is 8
ahead of `origin/main`**, which was already the pre-existing state. No open
branches. Test baseline **978 across 63→64 files** (was 953/63; #91 added 25 in
one file), green with typecheck clean at `5e6699b`.

**Untracked and deliberately left alone:** `.context/2026-07-23.md` and
`.context/Untitled.canvas`, both **0 bytes** — Obsidian stubs. Not committed, not
deleted; the owner's to clear. They are also the only two `.context` lint issues
(`no-frontmatter`, `orphan`), both pre-existing. `.claude/settings.json` carries an
uncommitted modification that predates all of this and was not touched.

**25** assertion drivers plus the observational `gui-scope-zoom-pill` — `gui-91`
is newest. Last full batch run at `3e24a53`: **22 green, `gui-75` red**, and that
red is **environmental, NOT a regression** — reproduced identically on clean `main`
with the work stashed. **Judge drivers by exit code.** #91 ran `gui-91` only, on
the argument that its one shared-file edit adds two selectors to `shared.css`'s
truncation group without changing any existing selector's declarations. **A leg
that touches shared CSS or the rail's layout should run the batch.**

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`. All five import the app's real `cli-path.ts` /
`backend-mode.ts` rather than copying them. **#90 is the one to copy for
scrubbing** — it records a temp dir's basename rather than the absolute path,
keeping the OS username out of the repo. **#97 will need a sixth.**

## Do not decide these

**Both 2026-08-04 grants are spent.** The first produced #93 and #94; the renewal
took all nine parked calls and produced #95/#96/#97 plus #91's scope, which #91
then built. A new **reason** reopens a call; a re-read does not.

**Only THREE owner calls still stand:**

1. **Tailwind's adopt-utilities half.** Tailwind is not dropped; a *drop* has a
   measured cascade risk — today the defaults compile into `@layer theme` while
   `[data-theme=…]` blocks are unlayered, so unlayered-beats-layered decides the
   override regardless of import order. Drop it and source order becomes the only
   thing deciding, which silently promotes `tests/theme.test.ts`'s import-position
   pin from a tidiness check to the whole safety argument.
2. **The titlebar's control count.** #86.1 was decided specifically so nothing
   pre-empts it; #91 shipped without touching it and now pins it at 8 in both the
   suite and `gui-91`.
3. **Whether 12px is the right line box for 11px muted description text** (#94).
   The preserved geometry is *Arial's* metric, an artifact of the bug it fixed;
   Segoe's own 14.4px sits closer to the app's other micro text (1.3–1.45).
   Nothing blocks on it.

**One scoping choice is now SHIPPED and cheap to overrule: which surface #91's
section joins.** It went to the **sessions rail** rather than the Agents dock, on
stated reasoning (a list of *sessions* belongs on the session surface; the dock's
scope is *inside* the open session, and [[flows]] exists to document that
collision). It is one section in one component and moving it is a small diff.
**It is now eyeballable in a real window** — `gui-91` leaves a screenshot at
`%TEMP%\claude-wrapper-shots\gui-91-rail-rows.png`. That judgement stays the
owner's.

**And the accent clause itself** — #97 produces the evidence but deliberately does
**not** spend it.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows**, and the agent-view name-collision table.
  **Corrected by #91**: the app now has an equivalent of agent view, and the
  collision is on screen.
- [[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]] — **#91,
  this sitting: the spawn, why pull-only, and the three shapes the data forces**
- [[2026-08-04-the-parked-owner-calls-are-taken]] — the nine calls, including
  #86.1 and #91's scope
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — #94
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93, and
  **#95's trap**
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — **AMENDED by #94**
- [[2026-08-03-the-engine-ports-are-named-not-counted]] — the architecture pass (`c7cee33`)
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — **#90, every number #91 spends**
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — **#87, which made #86.2 moot**
- [[2026-08-01-the-background-agents-seed-decided]] — the batch-ADR precedent and the "own section" warrant
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — #85
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81, #93, #94, #91
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
