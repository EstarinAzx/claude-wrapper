---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Frontier: ONE unblocked `ready-for-agent` ticket

`blocked_by: 0` verified after #96 closed. **The `ready-for-human` queue is
empty.**

| # | size | what |
|---|---|---|
| **#97** | medium | measure the mint budget — **measurement only, no `src/` change** |

`ticket-loop` takes **#97**. It will need a **sixth spike harness** in
`scripts/` — copy `spike-90-agent-view.mjs` for its scrubbing (basename only,
never an absolute temp path, which keeps the OS username out of the repo).

**#97 closes the queue.** Nothing is behind it in either label, so the relay's
designed stop fires after it and **the next move is the owner's** — file new
work, or run `/preset init` / `/preset vibe init` for a batch. `## Deferred` in
[[active-work]] is the standing menu; `## Open questions` holds the ones needing
an answer before they can be specced.

**Run the frontier query anyway** — this table is a snapshot, and this project's
standing lesson is that a leg once wrote that closing #70 would empty the queue
and was wrong, because #71 had been unblocked all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

~~#86 / #87 / #88 / #89 / #90 / #91 / #92 / #93 / #94 / #95 / #96~~ — closed.

## Landed this sitting (2026-08-04) — #96, `93ccd7d`

**The two authored values that sat off `DESIGN.md`'s scales now conform; the two
accepted exceptions are pinned in place.** Two declarations, no other diff:

- **`composer.css:112`** — `.model-menu-item { font-weight: 500 }` **deleted**
  (the rule went empty and went with it; the row inherits **400**). Not raised to
  600, which the doc reserves for "app name and bubble-less emphasis".
- **`subagent.css:84`** — `subagent-slide` 180ms → **200ms**; it is an *entry*
  and the doc names exactly one entry duration.

`agent-map.css` and `rails.css` have **no diff** — both `subagent-pulse 1.4s`
sites are accepted exceptions, now asserted **positively** so conforming them
reds.

**The load-bearing part is the instrument.**
[[2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit]]:

1. **An "unchanged box" criterion is driven through BOTH states in one run** —
   forced to 400, reflow, measure; forced to 500, reflow, measure; restore. It
   cannot be measured across the source edit, and the weaker one-run form
   ("computes 400 and its box is H") **passes against any H**. Measured
   **Δ 0.000 device px** at 1.25 dpr, so #94's line-box class is absent **by
   measurement**. Seventh vacuity-trap instance.
2. **Red-verified first:** criteria 1, 2 and 3 failed (weight `500`, one grep hit
   at `composer.css:112`, `0.18s`) while 4 and 5 passed, exit `1` → all pass,
   exit `0`.

Before it, **#95** (`e9a3c28`) took the subagent scrim out of the tab order;
**#91** (`5e6699b`) put live background sessions in the sessions rail; **#94**
(`e1a2c31`) put the Commands dock in the app's own font; **#93** (`07c0068`)
gave every interactive control the focus ring.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. **New from #96:**

- **`base.css:92` kills EVERY animation under `prefers-reduced-motion: reduce`.**
  `animationDuration` then reads `0s` for the conforming value *and* the
  exceptions, so a duration criterion passes for the wrong reason. Force
  `no-preference` **and read the media state back** — forcing is not taking.
- **An "X is unchanged" criterion cannot span the source edit.** Drive the live
  element through both states in-run instead. **Seventh instance** after #76,
  #82, #93, #94, #91, #95.
- **`.model-menu-item`'s box does NOT move between 400 and 500** — `33.000 ×
  173.000` device px at both. Cite this, not #94, on this row.
- **The two `subagent-pulse 1.4s` sites are accepted exceptions** and `gui-96`
  reds if you conform them. Proposed and refuted twice now.
- **`gui-96.mjs` is the ONLY guard on both values, in either direction** — jsdom
  sees neither a computed weight nor an animation duration.
- **`gui-52` is RED and environmental** — an **empty** CLI model list
  (`count: 1` is gui-51's *"the fetched list was EMPTY"* landmine). Reproduced on
  clean `main` with the work stashed before being called so. Second standing red
  beside `gui-75`; both are premise failures, not regressions.
- **`.claude/settings.json` holds a live `ANTHROPIC_API_KEY` in the working
  tree.** The file is **tracked** and the committed version has no key, so
  `git add -A` / `git commit -a` from any session **publishes a secret**. Stage
  by path, always. Pre-existing; flagged for the owner, not a leg's to fix.

**Still live from #95:** a GUI driver can reach the **subagent drawer with NO
live turn** (push `chat:event` from main — a `Task` tool-use then a `subagent`
tick); **match CSS classes by whitespace-split TOKEN, never substring**
(`.subagent-row` is a substring of `subagent-row--running`); **`$?` after a pipe
is the pipe's exit code**, not the driver's; **the subagent drawer has NO focus
trap** (known, unfixed, unfiled); **two scrims exist and must agree**
(`aria-hidden="true"` + `tabIndex={-1}`, no label); **`tests/` is LF while `src/`
is CRLF** — do not "fix" either; **a ticket's stated baseline ages** — #96's said
953/63 for the second consecutive ticket, actual **979/64**. Re-measure.

**Still live from #91:** **NEVER read `~/.claude/daemon/roster.json`**
(`rvAuth`/`ptyAuth`, socket paths, `dispatch.env` — attach credentials); **the
spawn is not a licence** (a future `child_process` must clear `cli-path.ts`'s bar
and get an ADR); **nothing may put the background list on a timer** (the rail's
window-`focus` listener is three lines away and would cost ~893ms of CLI process
per refocus); **`sessionId` is the only universal key**; **`state`/`status` are
OPEN vocabularies** — render the raw string; **no unified "is it alive"
boolean**; **the app is in its own listing** and `cwd` cannot exclude it
(`kind === 'background'` does); **an absence assertion needs surviving rows
beside it**; **whether `--cwd` matches by prefix or exactly is UNMEASURED**;
**jsdom loads no CSS**, so no vitest test can see the accent budget.

**Still live from #94:** **`font: inherit` is a SHORTHAND** and resets
`line-height` (plus style/variant/weight/stretch/size) — `rails.css` has zero
line-heights, `body` sets `1.6`, UA `normal` does not inherit, so it moves
**every** child including ones that set their own family. **Enumerate the
shorthand.** The neutraliser goes on the **parent**. **`.command-row-name` /
`.command-row-hint` render on TWO surfaces** and agree only because
`.command-option` uses the `font-family` **longhand**. **Every line-height in
this app is unitless — all 19.** **`.command-list`'s height measures nothing.**

**Still live from #93:** a new control does not "join the focus group" by default
— **ask what it paints first**; `.model-pill` breaks the rule's letter **on
purpose**; `Tab` is not a way out of the composer while the slash popover is
open; the sessions rail is **~101 real tab stops** and any driver walking to the
composer must collapse it *and verify the collapse*; **`el.focus()` does NOT
reliably match `:focus-visible` — press real keys**; the driver reads its
expected ring/wash from a **probe element**, never a hardcoded colour (four
palettes ship); `.session-row-btn-active`'s mint left-marker is replaced by the
shared focus group on focus (pre-existing, uncaught).

**Still live from #92 — and #97 is the ticket that ends it:** **`DESIGN.md`'s
accent clause is unverified in BOTH halves** (the enumeration and the ≤10%), and
it still **governs** meanwhile. **`DESIGN.md` was not amended, and must not be**
to match current drift — that laundering move was refused for the accent clause
in #92 and again for the weight scale in #96, so #97 **produces the evidence and
is forbidden from spending it**. **"No measurement can answer a taste call" is a
FALSE PARAPHRASE** carried in `.claude/vibe-2026-07-31-*.md`; the real line is
about **instruments, not ownership**. **Two agreeing sources are not a quorum
when a third exists.**

**Still live from #90:** the listing is a **join** the CLI performs, and the two
on-disk stores cover only 2 of 6 and 1 of 6 active rows; **a name-level scan for
"agent" here returns SUBAGENT APIs**; an empty return measures nothing.

**Still live from #89/#88/#87:** `entrypoint` is decided by the **launch env**,
never by this app, and **cannot** separate this app's sessions from its own GUI
drivers; **one record decides a whole session** (64KB head/tail windows); `init`
fires per **TURN**, not per session; `McpServerStatus.config` carries `env`;
**the thinking block arrives EMPTY** (`thinking: ""`, every config);
`result.subtype` is `'success'` on a failed turn (`is_error` says so); unsetting
`ANTHROPIC_BASE_URL` by hand is **not** native mode (import `backend-mode.ts`'s
`resolveSpawnEnv`).

**Still true from #85/#84/#83/#82/#81:** a mutant can kill a **bad test** before
it kills the code; **reproduce a red on clean `main` with the work stashed before
calling it a regression** (used again this sitting, on `gui-52`); **judge drivers
by exit code**; a field's absence is only a measurement if a differently-named
field could have been seen; `parent_tool_use_id` is on the `assistant` envelope;
two ports on one lifecycle hook can want opposite things; **an assertion that
something SURVIVED is vacuous unless the thing it survives is shown to have
happened**; a level event can land **after** `result`; the `Agent` tool is
**async**.

**Still true:** the composer is never `disabled`; `lastTurn`'s nonce is
load-bearing; `unqueue` releases the commitment, never the text; a double flush
is invisible to jsdom; an edge between two samples is not observable by sampling;
`resume` binds at query **construction** and `warmUp` takes the target; a stream
dying **between** turns emits nothing; `win.isFocused()` alone is not "someone is
looking"; **opening a past session CLOSES the engine** (so `listModels()` /
`listCommands()` answer `[]` — reach them first); a test asserting an **absence**
is the one most likely to be vacuous — **mutation-verify it**, seven times bitten
now (#76, #82, #93, #94, #91, #95, #96); pins are mutation-verified and no pin
retirement is authorised; do not add a second busy flag; never un-key the
composer; anything workspace-scoped must join the `ok` branch; main reports
`getNormalBounds()`; `tests/scrollbar.test.ts` scans every line naming a
scrollbar pseudo-element (comments included);
`tests/multiline-composer.test.tsx` slices raw CSS between literal braces, so
**no CSS comment may contain a closing brace**; `gui-51` compares in **device**
pixels; measure with `getBoundingClientRect`; `.titlebar-center` must stay **in
flow**; a new `window.api` channel needs **all four** mock sites
(`tests/chat-harness.ts`, `session.test.tsx`, `shell.test.tsx`,
`sidebar.test.tsx`) plus `preload/index.d.ts`; never hardcode a model name;
**`gh issue close --comment` silently drops the comment if the issue is already
closed — comment first, then close**; a squash merge leaves the branch "not fully
merged", so `git branch -D` is correct there.

From #78: **Playwright cannot measure a launch**; `NODE_OPTIONS=--require` never
reaches Electron; `--disable-gpu` is load-bearing in a background session (and
flattens acrylic); Chromium persists the zoom factor per origin inside
`userData`.

## Baseline

`main` = `93ccd7d` (#96) plus the `.context` commits. **Unpushed.** No open
branches. Test baseline **979 across 64 files — unchanged by #96**, which added
no vitest test on purpose (jsdom can see neither of its values). Green with
typecheck clean at `93ccd7d`.

**Untracked and deliberately left alone:** `.context/2026-07-23.md` and
`.context/Untitled.canvas`, both **0 bytes** — Obsidian stubs. Not committed, not
deleted; the owner's to clear. They are also the only two `.context` lint issues
(`no-frontmatter`, `orphan`), both pre-existing. **`.claude/settings.json`
carries an uncommitted modification holding a live API key** — see the landmine
above; it predates all of this and was not touched.

**27** assertion drivers plus the observational `gui-scope-zoom-pill` — `gui-96`
is newest. This leg ran **four**: `gui-96` (new, PASS), `gui-51`, `gui-93`,
`gui-95` — the ones measuring the two surfaces it touched — all exit 0, plus
`gui-52` red and proven environmental. Last full batch at `3e24a53`: **22 green,
`gui-75` red**, environmental. **Judge drivers by exit code.** A leg that touches
shared CSS or the rail's layout should run the batch.

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`. All five import the app's real `cli-path.ts` /
`backend-mode.ts` rather than copying them. **#90 is the one to copy for
scrubbing.** **#97 needs the sixth.**

## Do not decide these

**Both 2026-08-04 grants are spent.** A new **reason** reopens a call; a re-read
does not.

**Only THREE owner calls still stand:**

1. **Tailwind's adopt-utilities half.** Tailwind is not dropped; a *drop* has a
   measured cascade risk — today the defaults compile into `@layer theme` while
   `[data-theme=…]` blocks are unlayered, so unlayered-beats-layered decides the
   override regardless of import order. Drop it and source order becomes the only
   thing deciding, which silently promotes `tests/theme.test.ts`'s import-position
   pin from a tidiness check to the whole safety argument.
2. **The titlebar's control count.** #86.1 was decided specifically so nothing
   pre-empts it; #91 shipped without touching it and pins it at 8 in both the
   suite and `gui-91`.
3. **Whether 12px is the right line box for 11px muted description text** (#94).
   The preserved geometry is *Arial's* metric, an artifact of the bug it fixed;
   Segoe's own 14.4px sits closer to the app's other micro text (1.3–1.45).
   Nothing blocks on it.

**Still open and unfiled: the subagent drawer has no focus trap.**
`role="dialog" aria-modal="true"` traps nothing — Tab walks out of the drawer
into the controls behind the scrim. Real a11y gap, strictly larger than #95, and
deliberately not filed because filing is a scoping call and the grants are spent.
Evidence is the 16-stop walk in #95's ticket comment.

**One scoping choice is SHIPPED and cheap to overrule: which surface #91's
section joins.** It went to the **sessions rail** rather than the Agents dock, on
stated reasoning. One section in one component; moving it is a small diff.
Eyeballable at `%TEMP%\claude-wrapper-shots\gui-91-rail-rows.png`.

**And the accent clause itself** — #97 produces the evidence but deliberately
does **not** spend it.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows**, and the agent-view name-collision table
- [[2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit]] — **#96,
  this sitting: the two conformed values, and the in-run A/B technique**
- [[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]] — #95
- [[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]] — #91
- [[2026-08-04-the-parked-owner-calls-are-taken]] — the nine calls, which **filed
  #96 and #97**
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — **#94, the line-box bug
  one property over, which is why #96's AC5 existed**
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — **AMENDED by #94**
- [[2026-08-03-the-engine-ports-are-named-not-counted]] — the architecture pass (`c7cee33`)
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — #90
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — **#87, which made #86.2 moot**
- [[2026-08-01-the-background-agents-seed-decided]] — the batch-ADR precedent
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81, #93, #94, #91, #95, #96
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- [[2026-07-24-ui-polish-model-picker-subagent-viewer]] — where the drawer came from
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
