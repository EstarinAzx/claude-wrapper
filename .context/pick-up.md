---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed this leg (2026-08-04) — #98, `f1813bc`

**The subagent transcript viewer opens as a centred popup instead of a right-edge
drawer.** Owner-decided placement, verbatim: *"make the subagents chat view a
center pop up not a side panel one"* — execution, not design.

`src/renderer/src/styles/subagent.css` is the **only `src/` file touched**: no
JSX, no class rename, no keyframe rename, no new token. Plus `gui-98.mjs` (new),
criterion 6 in `gui-96.mjs`, an ADR, and two `happy-path.md` node **labels**.

All 8 criteria met. Centring measured at **0.000 device px** on both axes in both
scroll states; `.chat-column` at **exactly 760** in both. Gate green: typecheck
clean, **979 across 64** (baseline exact), build clean. `gui-98` red-verified
then green, `gui-95` green and untouched (16 stops, close at 6), `gui-96` green.

**Neither anti-modal ADR is superseded and neither gets a banner** — one decides
where Appearance lives, the other how deletion confirms, and this overturns only
the **rationale they shared**. **The glass-ban question is recorded UNRESOLVED on
purpose.**

See [[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]].

## Frontier: TWELVE OPEN, ALL `ready-for-agent`, NONE `ready-for-human`

**Next unblocked, lowest-numbered: #99** — the viewer's focus trio. #98 unblocked
it. Run the frontier query anyway; this table goes stale the moment anything
moves, and a leg once wrote that closing #70 would empty the queue and was wrong
because #71 had been unblocked all along.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | subject | blocked by |
|---|---|---|
| **99** | the viewer takes focus on open, traps it, gives it back on close | — (was 98) |
| **100** | two unguarded async continuations in `useChat` apply after their target moved | — |
| **101** | `listSubagents` contradicts its own docstring: unreadable store reads as "no agents" | — |
| **102** | the viewer reads the transcript once, so a running agent is frozen | **99** |
| **103** | the composer's `Escape` does not stop propagation, so one press dismisses two things | — (see below) |
| **104** | a subagent open when a turn SUCCEEDS is never drained; its terminal event reaches nobody | — |
| **105** | **spike** — does picking a model empty the model menu and slash commands until the next send? | — |
| **106** | a clipboard image that fails to read is rejected with a self-contradictory message | — |
| **107** | **the rail can delete the session a turn is streaming into** — data loss, first turn only | — |
| **108** | **spike** — can a second send, or a hung interrupt, strand the turn lifecycle? | — |
| **109** | `switchWorkspace` checks `isBusy` before an await, so a send during resolve tears down a live turn | — |
| **110** | the window's last move or resize is dropped if you close inside the 250ms debounce | — |

**#103 reports `blocked_by: 0` from the API even though every queue table lists it
as chained behind #99** — the native dependency link was never created. The API is
authoritative, so **#103 is pickable now**. If the chain was intended, add the
link rather than assuming it. Flagged on #98's closing comment.

**#107 is still the one to take first if you are choosing by consequence** — it
destroys a transcript that is being written, by an ordinary sequence, and it is
the only data-loss defect in the batch. The queue rule is lowest-numbered, so it
will not come up on its own for a while.

**#105 and #108 are SPIKES and must stay spikes** — harness, findings,
recommendation, **no `src/` diff**. Killing their own premise is a successful
outcome.

**`ready-for-human` is FORBIDDEN until the owner is back.** The 2026-08-04 seed
said so verbatim — *"never tag anything ready for human … i give you the drivers
seat"*. A stuck ticket gets a comment, keeps `ready-for-agent`, and **stops the
relay** rather than being relabelled.

## What #99 inherits, and it changes how #99 is built

- **`gui-95`'s walk is 16 stops** and terminates by seeing focus return to the
  `.subagent-row` anchor. **A focus trap makes that return impossible**, so the
  walk would cycle inside the pane and burn its full 120-press budget. The
  cycle-break must move to "focus is back on the walk's own first stop".
- **The app has NO precedent for what a modal owes.** Five `.focus()` call sites
  in the renderer (three composer refocus, two roving-ring) and **not one** moves
  focus on open or restores it on close. Every part of the trio needs its own
  warrant.
- **The restore half fixes a PRE-EXISTING strand, not one the trap creates.**
  `gui-95` reaches `.subagent-drawer-close` at stop 6 today and activating it
  unmounts the node focus sits on. Initial focus makes that guaranteed rather
  than incidental — a reason to fix it in the same ticket, not a regression.
- **`.subagent-drawer-backdrop` must keep `aria-hidden="true"` + `tabIndex={-1}`
  parity with `.model-backdrop`** (#95). Two scrims exist and must agree.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. **New from #98:**

- **A driver measuring an overlay here is measuring against a live lookalike.**
  The workspace chat stays mounted behind the scrim, so a bare `.chat-column`
  resolves to the **background** one and reads ~760 at any comfortable window
  size regardless of what the overlay does. `gui-98`'s criterion 2 was written
  that way and **passed against the 560px edge-pinned drawer**; only the red run
  exposed it. **Scope every in-pane selector to `.subagent-drawer`.** #95's rule
  was match class *tokens* not substrings — this is the same failure one level
  up: **the right class on the wrong element.**
- **Reaching the chat inside the viewer needs TWO IPC stubs, not one.** The
  prescribed `subagents:transcript` stub is never reached alone: `SubagentDrawer`
  resolves a session id first, and both `activeSessionId` (written only in
  `useChat`'s `turn-end` branch) and the `currentSessionId()` fallback
  (`engine.sessionId()`, null until `turnEverRun`) are **null** under a synthetic
  `chat:event` push, so it short-circuits at `if (!sid)` and renders the empty
  branch — which mounts neither `.chat` nor `.chat-column`. Stub
  `chat:session-id` too.
- **The window size a driver INHERITS is routinely too small.** This run
  inherited **900×600 DIP = 720 CSS px at 1.25 zoom**, under the 868 the 820px
  pane needs. Set the bounds, read the CSS width back **as a premise**, restore
  past the 250ms debounce.
- **A finished CSS animation leaves `getAnimations()`**, so "nothing is running"
  is also what an element with no animation reports. Pair it with the computed
  `animationName`. Do not assert the in-flight sample — a slow frame reds a
  correct build.
- **A lazy regex cannot read a `@keyframes` body** — it stops at the first stop's
  close brace. Mutation-checked: an X translate reinstated in `to` is caught by
  brace-counting and **missed** by the lazy form, still reading green.
- **At 1.25 zoom the overflow bar spends 9.6 CSS px, not 10.** The column still
  reads 760 because `max-width` caps `770 - 9.6`; the derivation is exact at
  zoom 1 and has ~0.4px of slack here.
- **Do not simplify the 820.** 760, 808 and 810 were each proposed and each wrong
  for a different reason.

**Still live from #97:** **`rule.style` enumerates a var-shorthand's longhands
with EMPTY values**, so a `value.includes('var(')` filter drops every
`background:` declaration (parse `cssText`, split on top-level `;`); **THREE pixel
kinds live in a window driver** — DIP (`setContentBounds`), physical
(`capturePage`), CSS (`innerWidth` = DIP ÷ **zoom, 1.25 here**); **`toBitmap()` is
BGRA** and a calibration target reading `a = 1.0000` is what proves it; **keep
`--color-mint-wash`'s 0.1 alpha when overriding it**; **the build emits
`color-mix()` fallback pairs — 6 declarations never paint in Chromium** but would
paint the accent at full opacity elsewhere, so do not "clean them up";
**`.backend-pill--wisped` is the largest unlisted accent spend** and is
backend-mode-dependent; **cross-frame subtraction is invalid once the injected
thing reflows**; **restore borrowed window state** (bounds and the `theme` key);
**`::marker` paints outside its element's border box**; **accent share is
window-size dependent**; **a ticket's stated baseline has been stale three
consecutive times** — #98's was correct (979/64), the first in a while.

**Still live from #96:** **`base.css:92` kills EVERY animation under
`prefers-reduced-motion: reduce`** — force the media state **and read it back**;
**an "X is unchanged" criterion cannot span the source edit** — drive the live
element through both states in-run; **the two `subagent-pulse 1.4s` sites are
accepted exceptions** and `gui-96` reds if you conform them; **`gui-96.mjs` is
the ONLY guard on the weight, the 200ms and now the entry axis**; **`gui-52` is
RED and environmental** (empty CLI model list). **`.claude/settings.json` is
untracked and gitignored since `d6ec749`** — staging by path is still the right
habit but no longer the only thing standing between this repo and a published
key.

**Still live from #95:** a GUI driver can reach the viewer with **NO live turn**
(push `chat:event` from main — a `Task` tool-use then a `subagent` tick); **match
CSS classes by whitespace-split TOKEN, never substring**; **`$?` after a pipe is
the pipe's exit code**; **two scrims exist and must agree**; **`tests/` is LF
while `src/` is CRLF** — do not "fix" either (`scripts/` and `.claude/skills/` are
CRLF too; the warnings on commit are expected).

**Still live from #91:** **NEVER read `~/.claude/daemon/roster.json`** (attach
credentials); **nothing may put the background list on a timer**; **`sessionId` is
the only universal key**; **`state`/`status` are OPEN vocabularies**; **the app is
in its own listing** and `cwd` cannot exclude it; **an absence assertion needs
surviving rows beside it**; **jsdom loads no CSS**, which is why #97 and #98 both
had to be window drivers.

**Still live from #94:** **`font: inherit` is a SHORTHAND** and resets
`line-height` — **enumerate the shorthand**; the neutraliser goes on the
**parent**; **`.command-row-name` / `.command-row-hint` render on TWO surfaces**;
**every line-height in this app is unitless — all 19**.

**Still live from #93:** a new control does not "join the focus group" by default
— **ask what it paints first**; `.model-pill` breaks the rule's letter **on
purpose**; the sessions rail is **~101 real tab stops**; **`el.focus()` does NOT
reliably match `:focus-visible` — press real keys**; drivers read expected colours
from a **probe element**, never a literal.

**Still true:** **reproduce a red on clean `main` with the work stashed before
calling it a regression**; **judge drivers by exit code**; a mutant can kill a
**bad test** before it kills the code; the composer is never `disabled`;
`lastTurn`'s nonce is load-bearing; `resume` binds at query **construction**;
**opening a past session CLOSES the engine**; a test asserting an **absence** is
the one most likely to be vacuous — **mutation-verify it**, and #98 makes the
ninth time this has bitten; never hardcode a model name; **`gh issue close
--comment` silently drops the comment if the issue is already closed — comment
first, then close**; a squash merge leaves the branch "not fully merged", so `git
branch -D` is correct there; **Playwright cannot measure a launch**;
`--disable-gpu` is load-bearing in a background session.

## Baseline

`main` = `f1813bc`, **PUSHED — level with origin.** The 19-commit unpushed
backlog this note used to record is **cleared**; do not carry that figure
forward. No open branches. Test baseline **979 across 64 files**, typecheck
clean, `npm run build` clean — all three run this leg, not inherited.

**`gui-95` and `gui-96` are ALL GREEN on this commit** (driven, not assumed), and
**`gui-98` is red-verified then green**. `gui-95`'s walk is **16 stops** with the
close button at stop 6 — the number #99 has to change.

**30 driver files** in `.claude/skills/run-desktop/` (28 assertion drivers, two
`gui-7x-probe` helpers, plus the observational `gui-scope-zoom-pill`). Two
standing environmental reds, both premise failures rather than regressions and
**neither retested this leg** (nothing in #98's diff moves their subjects):
**`gui-75`** (focus-dependent — it has now gone red in two consecutive batch runs
while passing solo both times, so re-run it alone before believing a red) and
**`gui-52`** (empty CLI model list).

**`gui-98.mjs` is the one to copy for measuring anything inside an overlay** —
scoped selectors, both scroll states established and verified in-run, borrowed
window bounds restored, and two IPC stubs to reach the content at all.

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`, `spike-97-mint-budget.mjs`. **#90 is the one to copy
for scrubbing; #97 for measuring anything rendered whole-window.**

## Do not decide these

**The 2026-08-04 AFK grant is in force** — *"never tag anything ready for human as
i will be away from home whatever it is you need from me i wont be there to
answer so i give you the drivers seat."* Read strictly: it removes **ownership**
as a ground for deferring and forbids the `ready-for-human` label outright. It
does **not** remove the need for a **warrant**, does **not** license anything
irreversible, and does **not** reopen the standing calls below — they sit outside
its seed, and **a new reason reopens a call; a broader grant does not.**

**Only THREE owner calls still stand:**

1. **Tailwind's adopt-utilities half.** A *drop* has a measured cascade risk —
   the defaults compile into `@layer theme` while `[data-theme=…]` blocks are
   unlayered, so unlayered-beats-layered decides the override regardless of
   import order.
2. **The titlebar's control count**, pinned at 8.
3. **Whether 12px is the right line box for 11px muted description text** (#94).

**And the accent clause, the sharpest of them** — #97 produced the evidence and
deliberately did not spend it. The proportion half **holds**; the enumeration half
**does not**. Whether the *enumeration* should change is a taste call.

**A fourth is now open, and #98 opened it deliberately: whether `DESIGN.md`'s
glass ban reaches a `var(--surface)` pane at all.** Read literally, the anti-modal
ADR's sentence already condemned the drawer that shipped on `main` before #98,
which no ADR had ever noticed. #98 did not settle it because it did not have to —
it changes no layer, material or opacity. **Recording it unresolved is the
decision; settling it in passing would be the failure.**

**One scoping choice is SHIPPED and cheap to overrule:** which surface #91's
section joins (the sessions rail, not the Agents dock).

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows**, and the agent-view name-collision table
- [[2026-08-04-the-viewer-is-centred-and-the-glass-ban-is-left-unresolved]] —
  **#98, this leg: the centred popup, and the vacuity the red run caught**
- [[2026-08-04-the-ground-cancels-in-a-token-differential]] — #97
- [[2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit]] — #96
- [[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]] — #95
- [[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]] — #91
- [[2026-08-04-the-parked-owner-calls-are-taken]] — the nine calls
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — #94
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — **not superseded by #98**
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — **not superseded by #98**
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — **AMENDED by #94**
- [[2026-08-03-the-engine-ports-are-named-not-counted]] — the architecture pass (`c7cee33`)
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — #90
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — #87
- [[2026-08-01-the-background-agents-seed-decided]] — the batch-ADR precedent
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81, #93,
  #94, #91, #95, #96, #97 **and #98's scoped-selector vacuity**
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- [[2026-07-24-ui-polish-model-picker-subagent-viewer]] — where the viewer came from
- `.claude/vibe.md` — the run that filed #98–#110
