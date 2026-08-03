---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Frontier: #94, `ready-for-agent`, unblocked

**One agent ticket is open.** #93 landed and closed this leg; #94 is the
remaining half of the 2026-08-04 owner grant.

- **#94** — `ready-for-agent`, **`blocked_by: 0` verified**: `.command-row-btn`
  gets `font: inherit` **without** shifting vertical metrics.

**Read the ticket body, not the ADR it cites.**
`2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system.md` says the fix
"would repaint `.command-row-desc`" — one child. That understates it. **`font:
inherit` is a shorthand and resets `line-height` too**; `rails.css` has zero
`line-height` declarations, `body` sets `1.6`, and a `<button>`'s UA default is
`normal`, so **all three** `.command-row-*` children shift vertical metrics,
including the two that declare their own `font-family`. **Pin the children's
`line-height` first, then add `font: inherit`.**

jsdom is blind to CSS, so #94 needs a driver too, red-verified against `main`
before the fix — same house rule that shaped `gui-93` (an instrument that cannot
fail measures nothing). `.command-row-btn` is a sessions/commands **dock row**, so
`gui-93`'s rail-collapse trick does not apply; the Commands dock opens from a
titlebar toggle.

Then, and none of these are loop work:

- **#92** — `ready-for-human`, the GUI conformance audit from an unattended
  `vibe init` run. Five of its six owner calls were taken under the 2026-08-04
  grant (→ #93, #94); **three remain the owner's** and are commented on the
  issue: the stale accent clause, `.model-menu-item`'s `font-weight: 500`, and
  what "professional grade" concretely means. **Do not take them** — Pressure
  refuted the doc-reconciliation ticket *after* the grant and it stayed refuted.
  A grant is permission to decide, not permission to decide badly.
- **#86** — open, `ready-for-human`: findings + five owner calls.
- **#91** — open, `ready-for-human`, **blocked by 1** (#86). The
  background-sessions surface. **Do not build it** — see `## Do not decide these`.
- ~~#87 / #88 / #89 / #90 / #93~~ — closed.

**Run the frontier query anyway** — this line is a snapshot. This project's
standing lesson is that a leg once wrote that closing #70 would empty the queue
and was wrong, because #71 had been unblocked all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

If it really is empty, **the next move is the owner's** — file work, or run
`/preset init` / `/preset vibe init` to generate a batch. `active-work.md`'s
`## Deferred` is the standing candidate menu and `## Open questions` holds what
needs an answer before it can be specced.

## Landed this leg (2026-08-04) — #93, `07c0068`

**Every interactive control wears the app's focus ring.** Thirteen controls
rendered Chromium's default `outline: auto 0.8px rgb(229, 151, 0)` on keyboard
focus, including `.send-btn`, both titlebar state pills and the window controls.
`titlebar.css` authored **zero** `:focus-visible` rules and now authors one. Gate
green: typecheck clean, **953 tests across 63 files** (baseline unchanged),
`gui-93` PASS, `gui-72` and `gui-51` re-run green because this touched their
stylesheets. All six edited files verified 100% CRLF.

**The decision, in one line: the treatment is picked per control by what it
paints, not applied uniformly.** The `shared.css` focus group sets
`background: var(--tint-3)` as well as the hairline, so joining it *is* the
regression — it would have replaced the mint on `.send-btn` / `.pick-folder-btn` /
`.backend-pill--wisped`, the danger fill on `.perm-pill--bypass` and the red on
`.win-btn-close`. Fill in any state, or an icon button → **hairline alone**.
Genuinely transparent menu/list row → the shared group, which took exactly two new
members.

| file | selectors | treatment |
|---|---|---|
| `titlebar.css` | `.backend-pill` `.perm-pill` `.model-pill` `.agents-toggle` `.sidebar-toggle` `.win-btn` | hairline |
| `composer.css` | `.send-btn` `.attach-btn` | hairline |
| `chat.css` | `.pick-folder-btn` | hairline |
| `subagent.css` | `.subagent-drawer-close` | hairline |
| `rails.css` | `.session-delete` | hairline |
| `shared.css` | `.model-menu-item` `.command-option` | shared wash+hairline |

**Re-running the enumeration corrected the ticket twice** — its own table said to
do that rather than trust it. `.session-delete-armed` authors no background (only
`color`), so one rule on the base class covers armed/cancel/ordinary; and
`.command-option--active` already paints the same `var(--tint-3)` the shared group
applies, so the wash replaces nothing.

**The important acceptance criterion passed against the broken build.** Criterion
2 — *no authored fill replaced on focus* — was green on all 13 controls in the red
run, because with no focus rule anywhere a background trivially cannot move. It
was mutation-verified separately (adding `background: var(--tint-3)` to the
titlebar rule reds seven controls, `.backend-pill` and `.perm-pill` among them),
then reversed with the same anchored edit, `git diff` empty afterwards.

New driver: **`.claude/skills/run-desktop/gui-93.mjs`**, 13 controls Tab-driven
per control, one static-checked and labelled as such.

See [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]].

## Landed before that (2026-08-03) — architecture pass, no ticket

**`createEngine`'s seven port/getter slots are now one named `EnginePorts`
object** (`c7cee33`) — the three-arg construction (83 test sites) untouched.
**`index.ts` gained `discardEngine(resume)`**, the one funnel for the five IPC
discard paths. Port semantics untouched: `onTerminal` never fires for `close()`,
`onBackgroundTasks` fires `[]` there, reset still lives in `engine.close()`.
Owner-directed, off-tracker by design. See
[[2026-08-03-the-engine-ports-are-named-not-counted]].

Before that, **#90** (`c989fe5`) measured the CLI's background sessions
**reachable — by one route, at ~893ms of a fresh CLI process per look, poll-only**,
with the app appearing in its own listing and `sessionId` the only universal key.
No `src/` change. See
[[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]].

## Landmines

Full ledger in [[active-work]] — long and load-bearing. **New from #93:**

- **A new control does not "join the focus group" by default — ask what it paints
  first.** The shared group writes `background: var(--tint-3)`. Adding a control
  that carries a fill in any state replaces that fill at the moment the user
  selects it, with every test green. jsdom cannot see it.
- **`.model-pill` takes hairline-only and breaks the rule's letter on purpose.**
  The three pills brighten by `filter`, not by a background, so it carries no fill
  in any state — but washing one of three pills that share a base rule splits the
  group visually. A tidy-up that "corrects" it into the wash group is a silent
  regression.
- **An assertion of the form "X is unchanged" is vacuous in the build where
  nothing could change it.** #93's most important criterion passed on all 13
  controls against the broken build. Third instance after #76 and #82, and the
  first inside a brand-new driver. Mutation-verify absence and no-change
  assertions *before* trusting them.
- **`Tab` is not a way out of the composer while the slash popover is open.**
  `InputBar.onKeyDown` binds `Tab` to `accept(matches[hi])` with
  `preventDefault()`. `.command-option` is reachable only by `Shift+Tab`.
- **The sessions rail is 100 real tab stops.** A Tab walk with it expanded never
  reaches the composer, which reads exactly like a missing control. `gui-93`
  collapses it first and fails loudly if the collapse did not take.
- **`el.focus()` does not reliably match `:focus-visible`** — press real keys, or
  the driver passes against the broken build.
- **`gui-93` reads its expected ring and wash from a probe element**, never a
  hardcoded colour. Four palettes ship; a literal would red on three.
- **`.subagent-drawer-close` is static-checked, not Tab-driven**, and the report
  says so. Renaming the selector drops it to no coverage, silently.
- **`.subagent-drawer-backdrop` is a focusable `<button>` with a fill and it still
  wears Chromium's ring, deliberately** — an inset hairline on a viewport-sized
  scrim boxes the whole window. The real fix is `tabIndex={-1}` (its sibling
  `.model-backdrop` already has it), a JSX change removing a tab stop. **Owner's
  to file.**
- **`.session-row-btn-active`'s mint left-marker (`box-shadow: inset 2px 0 0 0`)
  is replaced by the shared focus group on focus.** Pre-existing, untouched, not
  caught by anything.

**Still live from #92 (the GUI audit):**

- **`2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system.md`
  UNDERSTATES `.command-row-btn`'s blast radius** — this is #94's whole trap, see
  above.
- **`DESIGN.md`'s accent clause is STALE.** It names a *closed* list of five mint
  spends; mint is painted in **9 files, ~45 refs**. `DESIGN.md` still **governs**,
  so design work is decided against a partly false map until reconciled. **Not a
  licence to amend it** — the owner refused that ticket after the grant.
- **There is NO accessibility commitment on record** beyond what #93 just shipped.
  The one accessibility clause in the corpus is about **reachability** of a hidden
  control, not indication. Do not stretch it.
- **"No measurement can answer a taste call" is a FALSE PARAPHRASE** carried in
  `.claude/vibe-2026-07-31-*.md` logs. The real line — "eyeballed in a real
  window, never a driver screenshot" — is about **instruments, not ownership**.
- **Two agreeing sources are not a quorum when a third exists.**

**Still live from #90:** `sessionId` is the only universal key in the agent-view
payload; **no single field describes a row's liveness**; `state` is four values
and open, `status` was caught opening inside one sitting; an SDK-spawned CLI
registers as `kind: "interactive"` so **the app is in its own listing**;
**`~/.claude/daemon/roster.json` holds attach credentials** — never log, never
commit; the listing is a **join** the CLI performs; **a name-level scan for
"agent" here returns SUBAGENT APIs** — call the thing before believing its name;
an empty return measures nothing.

**Still live from #89:** `entrypoint` is decided by the **launch env**, never by
this app; **one record decides a whole session** (64KB head/tail windows), so
counting records is not counting sessions; `sessionKind: daemon|daemon-worker` is
a second programmatic path; the value set is **five**; `session-index.ts` cannot
be imported by a spike.

**Still live from #88:** a lever whose own effect is unverifiable cannot test
anything; **`init` fires per TURN, not per session**; `McpServerStatus.config`
carries `env`; `disabled` is a status and the common one; cwd selects the project
MCP scope.

**Still live from #87:** `result.subtype` is `'success'` on a failed turn —
`is_error` says so; unsetting `ANTHROPIC_BASE_URL` by hand is **not** native mode
(import `backend-mode.ts`'s `resolveSpawnEnv`); a type census answers what shapes
exist, never what belongs to what.

**Still true from the 2026-08-03 trace:** **"the agents view" is AMBIGUOUS** —
this app's Agents dock lists subagents inside one session; the CLI's agent view
lists whole background sessions. Say which one, every time. The **sessions rail is
the dangerous lookalike**: it lists stored transcripts, not live processes. A
driver that resizes the window revokes what it measures; element screenshots clip
to the viewport.

**Still true from #85/#84/#83/#82/#81:** a mutant can kill a **bad test** before
it kills the code; reproduce a red on clean `main` with the work stashed before
calling it a regression; **judge drivers by exit code**; a field's absence is only
a measurement if a differently-named field could have been seen; `parent_tool_use_id`
is on the `assistant` envelope; check whether every path reaches your candidate
**eagerly**; two ports on one lifecycle hook can want opposite things; a value
written once per session cannot trigger something that happens once per turn; **an
assertion that something SURVIVED is vacuous unless the thing it survives is shown
to have happened**; a level event can land **after** `result`; the `Agent` tool is
**async**; a negative is only a measurement if the path was exercised.

**Still true:** the composer is never `disabled`; `lastTurn`'s nonce is
load-bearing; `unqueue` releases the commitment, never the text; a double flush is
invisible to jsdom; an edge between two samples is not observable by sampling;
`resume` binds at query **construction** and `warmUp` takes the target; a stream
dying **between** turns emits nothing; `win.isFocused()` alone is not "someone is
looking"; **opening a past session CLOSES the engine** (so `listModels()` /
`listCommands()` answer `[]` — reach them first); a test asserting an **absence**
is the one most likely to be vacuous; **no expected driver failure**; pins are
mutation-verified and no pin retirement is authorised; do not add a second busy
flag; never un-key the composer; anything workspace-scoped must join the `ok`
branch; main reports `getNormalBounds()`; `tests/scrollbar.test.ts` scans every
line naming a scrollbar pseudo-element (comments included);
`tests/multiline-composer.test.tsx` slices raw CSS between literal braces, so
`.bubble` and `.message-input` stay ungrouped and no CSS comment may contain a
closing brace; `gui-51` compares in **device** pixels; measure with
`getBoundingClientRect`; `.titlebar-center` must stay **in flow**; **`src/` is
CRLF** (and so is `scripts/`) while `.context/*.md` is LF; a new `window.api`
channel needs **all four** mock sites plus `preload/index.d.ts`; never hardcode a
model name; **`gh issue close --comment` silently drops the comment if the issue is
already closed — comment first, then close**; a squash merge leaves the branch
"not fully merged", so `git branch -D` is correct there.

From #78: **Playwright cannot measure a launch**; `NODE_OPTIONS=--require` never
reaches Electron; `--disable-gpu` is load-bearing in a background session (and
flattens acrylic); Chromium persists the zoom factor per origin inside `userData`.

## Baseline

`main` = `07c0068` (#93). **Three commits ahead of origin and unpushed** —
`c7cee33`, `09ca8fe` and `07c0068`, plus this leg's `.context` commit. No open
branches; `ticket/93-focus-ring` was squash-merged and deleted. Test baseline
**953 across 63 files**, re-verified green at `07c0068` with typecheck clean.

**Untracked and deliberately left alone:** `.context/2026-07-23.md` and
`.context/Untitled.canvas`, both **0 bytes** — Obsidian stubs from opening the
vault. Not committed, not deleted; the owner's to clear. `.claude/settings.json`
also carries an uncommitted modification that predates this leg and was not
touched.

**23** assertion drivers plus the observational `gui-scope-zoom-pill` — `gui-93`
is new this leg. Last full batch run at `3e24a53`: **22 green, `gui-75` red**, and
that red is **environmental, NOT a regression** — reproduced identically on clean
`main` with the work stashed. **Judge drivers by exit code.** This leg ran three
(`gui-93`, `gui-72`, `gui-51`), all green; the full batch was deliberately not
run for a CSS-only change that alters nothing at rest.

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`. All five import the app's real `cli-path.ts` /
`backend-mode.ts` rather than copying them. **#90 is the one to copy for
scrubbing** — it records a temp dir's basename rather than the absolute path,
keeping the OS username out of the repo.

## Do not decide these

**The seven from `.claude/vibe.md` are DONE** and the 2026-08-01 grant is fully
spent; that file's `## Needs you` is history, not a queue. **The 2026-08-04 grant
is spent too** — it produced #93 (landed) and #94 (open). A new **reason** reopens
a call; a re-read does not.

**Three of #92's calls remain the owner's** and are commented on that issue: the
stale accent clause, `.model-menu-item`'s `font-weight: 500`, and what
"professional grade" means. They were refuted **after** the grant and stayed
refuted.

**Two older halves still stand:** Tailwind is **not dropped** but the
adopt-utilities question **stays open**; the titlebar's control count **does not
change** while the aesthetic question stays the owner's. #93 respected the second
one — it added a focus state to existing controls and no affordance.

**#91 is the owner's and is STILL BLOCKED — do not build it.** A
background-sessions surface is new UI, and #86's constraint that no new feature
may add a titlebar control is live. Every dock opens from a titlebar toggle and
there is no router, so a new dock is *unreachable*; which existing dock a
non-agent panel joins is owner call 1, unanswered. #90 cleared one of its two
blockers, which is exactly the trap — a leg reading "only one blocker left" and
taking it does the thing #90's Out of scope forbade in advance.

**The 2026-08-02 vibe run's five calls are the owner's and are OPEN** — #86 holds
them. Owner call 1 is still the gate on any MCP UI. **#89 moved owner call 5's
ground**: the wrapper's own sessions and the GUI drivers' carry the same
`entrypoint` value and are not separable by it.

**Newly the owner's, filed by nobody yet:** `.subagent-drawer-backdrop` should
probably take `tabIndex={-1}` like its `.model-backdrop` sibling, removing a tab
stop. #93 deliberately left it alone — it is a JSX behaviour change, not a CSS
one.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows.** First entry is the Agents dock, and it carries the
  agent-view name-collision table. Read it before any ticket naming "agents"
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — **this leg's
  ticket (#93); why joining the shared focus group IS the regression, why an icon
  button takes the hairline even when transparent, and why criterion 2 needed a
  mutation to mean anything**
- [[2026-08-03-the-engine-ports-are-named-not-counted]] — the architecture pass (`c7cee33`)
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — #90
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — #87
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — #85
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83
- [[2026-08-01-a-refresh-must-not-blank-what-it-has]] — #82
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81 and #93
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
