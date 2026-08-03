---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Frontier: queue empty — the next move is the owner's

**Zero `ready-for-agent` tickets.** #93 and #94 both landed and closed this
sitting, which spends the 2026-08-04 owner grant in full. The relay chain
(`ticket-loop`, legs 1–2) **stopped itself here** rather than spawning a leg with
nothing to work.

**Run the frontier query anyway** — this line is a snapshot, and this project's
standing lesson is that a leg once wrote that closing #70 would empty the queue
and was wrong, because #71 had been unblocked all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

The three open issues are **all `ready-for-human`, and none is loop work**:

- **#92** — the GUI conformance audit from an unattended `vibe init` run. Five of
  its six owner calls were taken under the 2026-08-04 grant (→ #93, #94, both now
  landed); **three remain the owner's** and are commented on the issue. **Do not
  take them** — Pressure refuted the doc-reconciliation ticket *after* the grant
  and it stayed refuted. A grant is permission to decide, not permission to
  decide badly.
- **#86** — findings + five owner calls.
- **#91** — **blocked by 1** (#86). The background-sessions surface. **Do not
  build it** — see `## Do not decide these`.
- ~~#87 / #88 / #89 / #90 / #93 / #94~~ — closed.

If it really is empty, file work or run `/preset init` / `/preset vibe init` to
generate a batch. `active-work.md`'s `## Deferred` is the standing candidate menu
and `## Open questions` holds what needs an answer before it can be specced.

## Landed this leg (2026-08-04) — #94, `e1a2c31`

**The Commands dock renders in the app's own font.** `.command-row-btn` was the
last row button without `font: inherit`, so the dock painted its descriptions in
Chromium's UA button font — **Arial 13.3333px** here — while every sibling row
used `--font`. Deferred by #79 (contract: zero visual change) and flagged since.
Gate green: typecheck clean, **953 tests across 63 files** (baseline unchanged),
`gui-94` PASS, `gui-51` and `gui-93` re-run green. Both edited files verified
100% CRLF.

**The decision, in one line: the neutraliser goes on the parent, not on the
children that visibly moved.**

```css
.session-row-btn, .agent-row-btn, .command-row-btn { font: inherit; }
.command-row-btn  { line-height: normal; }   /* the whole subtree, font-relative */
.command-row-desc { line-height: 1.1; }      /* the one child whose family changes */
```

`font` is a **shorthand** — it resets `line-height` too, and `rails.css` declares
zero line-heights while `body` sets `1.6` and a `<button>`'s UA `normal` does not
inherit. So the naive join moved **all three** children, not the one the ADR
predicted:

| | pre-fix | `font: inherit` alone | shipped |
|---|---|---|---|
| `.command-row-name` | 15.2px | 20.8px (**+5.6**) | 15.2px (0) |
| `.command-row-hint` | 12.8px | 17.6px (**+4.8**) | 12.8px (0) |
| `.command-row-desc` | 12px | 17.6px (**+5.6**) | 12.1px (+0.1) |
| `.command-row-btn` | **60px** | **76px** | 60.1px (+0.1) |

**The ticket's own prescribed remedy was the trap, twice.** It said to pin all
three children to measured pixels. (1) `.command-row-name` / `.command-row-hint`
render a **second time** in the composer's slash popover, which `font: inherit`
never reaches but a shared-class pin does. (2) 15.2px / 12.8px are **Cascadia
Code's** metrics — `--mono` is a fallback list, so the pin would *introduce* the
shift wherever it resolves to Consolas.

New driver: **`.claude/skills/run-desktop/gui-94.mjs`**, which hardcodes no
measurement — it rebuilds the pre-fix row from a UA-font replica whose children
carry the **authored** declarations, and measures both surfaces.

See [[2026-08-04-the-font-shorthand-resets-the-line-box]].

## Landed before that (2026-08-04) — #93, `07c0068`

**Every interactive control wears the app's focus ring.** Thirteen controls
rendered Chromium's default `outline: auto 0.8px rgb(229, 151, 0)` on keyboard
focus. **The treatment is picked per control by what it paints, not applied
uniformly** — the `shared.css` focus group sets `background: var(--tint-3)` as
well as the hairline, so joining it *is* the regression for anything carrying a
fill. Fill in any state, or an icon button → hairline alone. Genuinely
transparent menu/list row → the shared group, which took exactly two new members.
New driver `gui-93.mjs`. See
[[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]].

Before that, **`c7cee33`** named `createEngine`'s seven port/getter slots as one
`EnginePorts` object and added `discardEngine(resume)` (owner-directed,
off-tracker — [[2026-08-03-the-engine-ports-are-named-not-counted]]), and **#90**
(`c989fe5`) measured the CLI's background sessions **reachable at ~893ms of a
fresh CLI process per look, poll-only**
([[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]]).

## Landmines

Full ledger in [[active-work]] — long and load-bearing. **New from #94:**

- **`font: inherit` is a SHORTHAND and resets `line-height`.** With zero
  line-heights in `rails.css`, `1.6` on `body` and a UA `normal` that does not
  inherit, adding it to a button moves **every** child — including ones that set
  their own `font-family` and look immune. It also resets `font-style`,
  `font-variant`, `font-weight`, `font-stretch`, `font-size`. **Enumerate them.
  Not enumerating is the exact error that made the tailwind ADR wrong.**
- **`.command-row-name` and `.command-row-hint` render on TWO surfaces** — the
  Commands dock and the composer's slash popover. They agree today only because
  `.command-option` sets the `font-family` **longhand**, leaving its line-height
  at the same UA `normal`. A pin on the shared class reaches a surface
  `font: inherit` never touches, and would look green doing it.
- **Every line-height in this app is unitless — all 19.** A px one would be the
  first and stops tracking its `--fs-*` token.
- **`.command-list`'s height measures nothing** — `max-height`-bound and scrolls,
  so it read 548px even in the mutation where every row was 27% taller. Assert on
  the row.
- **The UA button font here is Arial 13.3333px**; `--font` is
  `"Segoe UI Variable Text"`. Their `normal` line-heights differ ~19% at the same
  size.
- **Fourth instance of the vacuous no-change criterion** (after #76, #82, #93).
  Mutation-verify absence and no-change assertions *before* trusting them — this
  is a pattern now, not an accident.
- **`gui-94` is the only guard on the command-row font, either direction.**
  Nothing in `tests/` and none of the other 24 drivers pins it.

**Still live from #93:** a new control does not "join the focus group" by default
— **ask what it paints first**; `.model-pill` takes hairline-only and breaks the
rule's letter **on purpose**; `Tab` is not a way out of the composer while the
slash popover is open (`InputBar.onKeyDown` binds it to `accept`, so
`.command-option` is reachable only by `Shift+Tab`); the sessions rail is **100
real tab stops** and must be collapsed before any composer-bound walk;
`el.focus()` does **not** reliably match `:focus-visible` — press real keys;
`.subagent-drawer-close` is static-checked, not Tab-driven;
`.subagent-drawer-backdrop` is a focusable `<button>` with a fill that still wears
Chromium's ring **deliberately** (the real fix is `tabIndex={-1}`, a JSX change —
**owner's to file**); `.session-row-btn-active`'s mint left-marker is replaced by
the shared focus group on focus (pre-existing, untouched, uncaught).

**Still live from #92 (the GUI audit):** **`DESIGN.md`'s accent clause is STALE**
— it names a *closed* list of five mint spends while mint is painted in **9 files,
~45 refs**; `DESIGN.md` still **governs**, so design work is decided against a
partly false map. **Not a licence to amend it** — the owner refused that ticket
after the grant. **There is NO accessibility commitment on record** beyond what
#93 shipped; the one accessibility clause in the corpus is about **reachability**
of a hidden control, not indication — do not stretch it. **"No measurement can
answer a taste call" is a FALSE PARAPHRASE** carried in
`.claude/vibe-2026-07-31-*.md`; the real line — "eyeballed in a real window, never
a driver screenshot" — is about **instruments, not ownership**. **Two agreeing
sources are not a quorum when a third exists.** (The tailwind-ADR entry is now
**resolved** — #94 amended it in place.)

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
a measurement if a differently-named field could have been seen;
`parent_tool_use_id` is on the `assistant` envelope; check whether every path
reaches your candidate **eagerly**; two ports on one lifecycle hook can want
opposite things; a value written once per session cannot trigger something that
happens once per turn; **an assertion that something SURVIVED is vacuous unless
the thing it survives is shown to have happened**; a level event can land
**after** `result`; the `Agent` tool is **async**; a negative is only a
measurement if the path was exercised.

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
CRLF** (and so is `scripts/` and `.claude/skills/run-desktop/*.mjs`) while
`.context/*.md` is LF; a new `window.api` channel needs **all four** mock sites
plus `preload/index.d.ts`; never hardcode a model name; **`gh issue close
--comment` silently drops the comment if the issue is already closed — comment
first, then close**; a squash merge leaves the branch "not fully merged", so
`git branch -D` is correct there.

From #78: **Playwright cannot measure a launch**; `NODE_OPTIONS=--require` never
reaches Electron; `--disable-gpu` is load-bearing in a background session (and
flattens acrylic); Chromium persists the zoom factor per origin inside `userData`.

## Baseline

`main` = `e1a2c31` (#94). **Five commits ahead of origin and unpushed** —
`c7cee33`, `09ca8fe`, `07c0068`, `485a814` and `e1a2c31`, plus this leg's
`.context` commit. No open branches; `ticket/94-command-row-font-inherit` was
squash-merged and deleted. Test baseline **953 across 63 files**, re-verified
green at `e1a2c31` with typecheck clean.

**Untracked and deliberately left alone:** `.context/2026-07-23.md` and
`.context/Untitled.canvas`, both **0 bytes** — Obsidian stubs from opening the
vault. Not committed, not deleted; the owner's to clear. `.claude/settings.json`
also carries an uncommitted modification that predates both legs and was not
touched.

**24** assertion drivers plus the observational `gui-scope-zoom-pill` — `gui-94`
is new this leg, `gui-93` the leg before. Last full batch run at `3e24a53`:
**22 green, `gui-75` red**, and that red is **environmental, NOT a regression** —
reproduced identically on clean `main` with the work stashed. **Judge drivers by
exit code.** This leg ran three (`gui-94`, `gui-51`, `gui-93`), all exit 0; the
full batch was deliberately not run for a two-declaration CSS change confined to
the Commands dock.

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`. All five import the app's real `cli-path.ts` /
`backend-mode.ts` rather than copying them. **#90 is the one to copy for
scrubbing** — it records a temp dir's basename rather than the absolute path,
keeping the OS username out of the repo.

## Do not decide these

**The 2026-08-04 grant is FULLY SPENT** — it produced #93 and #94, both landed and
closed. The seven from `.claude/vibe.md` are **DONE** and the 2026-08-01 grant is
spent too; that file's `## Needs you` is history, not a queue. A new **reason**
reopens a call; a re-read does not.

**Seven owner calls stand:**

1. **Tailwind's adopt-utilities half** — Tailwind is *not* dropped, but whether to
   adopt utilities deliberately for new UI stays open.
2. **The titlebar's control count** — the aesthetic question. #93 respected it: it
   added a focus state to existing controls and no affordance.
3. **#92's stale accent clause** (`DESIGN.md`), refuted after the grant.
4. **#92's `.model-menu-item` `font-weight: 500`**, refuted after the grant.
5. **#92's "what does professional grade concretely mean"**, refuted after the
   grant.
6. **`.subagent-drawer-backdrop` should probably take `tabIndex={-1}`** like its
   `.model-backdrop` sibling, removing a tab stop. #93 left it alone — a JSX
   behaviour change, not a CSS one. **Filed by nobody yet.**
7. **NEW from #94 — is 12px the right line box for 11px muted description text?**
   The geometry #94 preserved is *Arial's* metric, an artifact of the bug it
   fixed; Segoe's own `normal` is 14.4px (≈1.31), closer to the app's other micro
   text (1.3–1.45). The ticket's contract was a family repaint that moves nothing,
   so it held the old geometry and left this open. **Filed by nobody yet.**
   Nothing blocks on it.

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

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows.** First entry is the Agents dock, and it carries the
  agent-view name-collision table. Read it before any ticket naming "agents"
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — **this leg's ticket
  (#94); why the neutraliser goes on the parent, why pinning the children reaches
  a second surface, and why a px line-height is wrong on a fallback font stack**
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — **AMENDED
  by #94**
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
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81, #93 and #94
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
