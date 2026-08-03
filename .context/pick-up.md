---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Frontier: TWO unblocked `ready-for-agent` tickets

Both verified `blocked_by: 0` after #95 closed. **The `ready-for-human` queue is
still empty.**

| # | size | what |
|---|---|---|
| **#96** | small | two off-scale values conform to `DESIGN.md` (`font-weight: 500`, `subagent-slide 180ms`) |
| **#97** | medium | measure the mint budget — **measurement only, no `src/` change** |

`ticket-loop` takes the oldest, which is **#96**.

**Run the frontier query anyway** — this table is a snapshot, and this project's
standing lesson is that a leg once wrote that closing #70 would empty the queue
and was wrong, because #71 had been unblocked all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

~~#86 / #87 / #88 / #89 / #90 / #91 / #92 / #93 / #94 / #95~~ — closed.

**If the queue goes empty, the next move is the owner's** — file new work, or run
`/preset init` / `/preset vibe init` for a batch. `## Deferred` in
[[active-work]] is the standing menu.

## Landed this sitting (2026-08-04) — #95, `e9a3c28`

**The subagent drawer's scrim is out of the tab order.** `tabIndex={-1}` +
`aria-hidden="true"` on `.subagent-drawer-backdrop`, exactly `.model-backdrop`'s
shape. It had been a keyboard stop whose only job is to swallow an outside
click. #93 flagged it and left it alone on purpose — its contract was CSS-only
and this is JSX.

**Scope item 2 was a check, and it came back clear.** Nothing depends on the
scrim being announced: `.subagent-drawer-close` ("Close viewer") is a real
reachable affordance and Escape works, so a keyboard user already had two ways
out. The now-unreachable `aria-label` went with the change.

**The load-bearing part is the instrument, not the fix.**
[[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]]:

1. **The drawer IS reachable with no live turn.** Push `chat:event` from main —
   a `Task` tool-use then a `subagent` tick — and `useChat` grows the clickable
   `.subagent-row`. The belief that this needs a real subagent turn came from
   #93's CSS-only contract and was **never a measurement**. `gui-95` presses
   real Tab keys in the real drawer; **only the two seed events are synthetic.**
2. **One-stop differential, red-verified first:** 17 stops with the scrim at #6
   and exit `1` → **16 stops**, scrim absent, close moved 7 → 6, exit `0`.

Before it, **#91** (`5e6699b`) put the workspace's live background sessions in
the sessions rail; **#94** (`e1a2c31`) put the Commands dock in the app's own
font; **#93** (`07c0068`) gave every interactive control the focus ring.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. **New from #95:**

- **A GUI driver can reach the subagent drawer with NO live turn** — push
  `chat:event` from main. **#93's "needs a real turn" note is retired.** The
  same trick already existed in `gui-agents-dock.mjs` (`tasks:changed`) and
  `tests/subagent-viewer.test.tsx`. Always say what is synthetic.
- **Match CSS classes by whitespace-split TOKEN, never substring.**
  `.subagent-row` is a substring of `subagent-row--running`; that silently ate
  `gui-95`'s cycle-break and its whole 120-stop budget. Every
  `className.includes(...)` in a driver is this bug waiting.
- **`$?` after a pipe is the LAST command's exit code, not the driver's.**
  `node gui-x.mjs | tail -30; echo $?` prints `tail`'s `0` and reads exactly like
  a pass. Redirect to a file, or read `PIPESTATUS`.
- **The subagent drawer has NO focus trap** despite `role="dialog"
  aria-modal="true"` — Tab leaves it into the pills, dock toggles, window
  controls and composer, all behind the scrim. Known, unfixed, **unfiled**.
- **Two scrims exist and must agree** — `.subagent-drawer-backdrop` and
  `.model-backdrop`: `aria-hidden="true"` + `tabIndex={-1}`, no label. A third
  copies the pair, and `tabIndex={-1}` is not optional beside `aria-hidden`.
- **`tests/` is LF while `src/` is CRLF.** Both real, git normalises on add, the
  commit warnings are expected. Do not "fix" either.
- **A ticket's stated baseline ages** — #95's said 953/63, which predates #91's
  +25. Re-measure rather than matching the ticket.

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
reliably match `:focus-visible` — press real keys**;
`.session-row-btn-active`'s mint left-marker is replaced by the shared focus
group on focus (pre-existing, uncaught).

**Still live from #92:** **`DESIGN.md`'s accent clause is unverified in BOTH
halves** — the enumeration and the ≤10% — and **#97 exists to end that**; it
still **governs** meanwhile. **`DESIGN.md` was not amended, and must not be** to
match current drift. **"No measurement can answer a taste call" is a FALSE
PARAPHRASE** carried in `.claude/vibe-2026-07-31-*.md`; the real line is about
**instruments, not ownership**. **Two agreeing sources are not a quorum when a
third exists.**

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
it kills the code; reproduce a red on clean `main` with the work stashed before
calling it a regression; **judge drivers by exit code**; a field's absence is
only a measurement if a differently-named field could have been seen;
`parent_tool_use_id` is on the `assistant` envelope; two ports on one lifecycle
hook can want opposite things; **an assertion that something SURVIVED is vacuous
unless the thing it survives is shown to have happened**; a level event can land
**after** `result`; the `Agent` tool is **async**.

**Still true:** the composer is never `disabled`; `lastTurn`'s nonce is
load-bearing; `unqueue` releases the commitment, never the text; a double flush
is invisible to jsdom; an edge between two samples is not observable by sampling;
`resume` binds at query **construction** and `warmUp` takes the target; a stream
dying **between** turns emits nothing; `win.isFocused()` alone is not "someone is
looking"; **opening a past session CLOSES the engine** (so `listModels()` /
`listCommands()` answer `[]` — reach them first); a test asserting an **absence**
is the one most likely to be vacuous — **mutation-verify it**, six times bitten
now (#76, #82, #93, #94, #91, #95); **no expected driver failure**; pins are
mutation-verified and no pin retirement is authorised; do not add a second busy
flag; never un-key the composer; anything workspace-scoped must join the `ok`
branch; main reports `getNormalBounds()`; `tests/scrollbar.test.ts` scans every
line naming a scrollbar pseudo-element (comments included);
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

`main` = `e9a3c28` (#95) plus the `.context` commits. **Unpushed — `main` is 9
ahead of `origin/main`** (8 before this leg, which was already the pre-existing
state). No open branches. Test baseline **979 across 64 files** (was 978/64; #95
added 1), green with typecheck clean at `e9a3c28`.

**Untracked and deliberately left alone:** `.context/2026-07-23.md` and
`.context/Untitled.canvas`, both **0 bytes** — Obsidian stubs. Not committed, not
deleted; the owner's to clear. They are also the only two `.context` lint issues
(`no-frontmatter`, `orphan`), both pre-existing. `.claude/settings.json` carries
an uncommitted modification that predates all of this and was not touched.

**26** assertion drivers plus the observational `gui-scope-zoom-pill` — `gui-95`
is newest. Last full batch run at `3e24a53`: **22 green, `gui-75` red**, and that
red is **environmental, NOT a regression** — reproduced identically on clean
`main` with the work stashed. **Judge drivers by exit code.** #95 ran `gui-95`
only, on the argument that it touched one component's JSX and added a test file
and a driver — no shared CSS, no rail layout. **A leg that touches shared CSS or
the rail's layout should run the batch.**

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`. All five import the app's real `cli-path.ts` /
`backend-mode.ts` rather than copying them. **#90 is the one to copy for
scrubbing** — it records a temp dir's basename rather than the absolute path,
keeping the OS username out of the repo. **#97 will need a sixth.**

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

**NEW, and the only thing #95 leaves open: the subagent drawer has no focus
trap.** `role="dialog" aria-modal="true"` traps nothing — Tab walks out of the
drawer into the controls behind the scrim. Real a11y gap, strictly larger than
#95, and **deliberately not filed**, because filing is a scoping call and the
grants are spent. Evidence is the 16-stop walk in #95's ticket comment.

**One scoping choice is SHIPPED and cheap to overrule: which surface #91's
section joins.** It went to the **sessions rail** rather than the Agents dock, on
stated reasoning. It is one section in one component and moving it is a small
diff. Eyeballable at `%TEMP%\claude-wrapper-shots\gui-91-rail-rows.png`.

**And the accent clause itself** — #97 produces the evidence but deliberately
does **not** spend it.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows**, and the agent-view name-collision table
- [[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]] — **#95,
  this sitting: the scrim, and the driver technique that retires #93's fallback**
- [[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]] — #91
- [[2026-08-04-the-parked-owner-calls-are-taken]] — the nine calls
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — #94
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — **#93, which
  flagged #95 and left it deliberately**
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — **AMENDED by #94**
- [[2026-08-03-the-engine-ports-are-named-not-counted]] — the architecture pass (`c7cee33`)
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — #90
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — **#87, which made #86.2 moot**
- [[2026-08-01-the-background-agents-seed-decided]] — the batch-ADR precedent
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81, #93, #94, #91, #95
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- [[2026-07-24-ui-polish-model-picker-subagent-viewer]] — where the drawer came from
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
