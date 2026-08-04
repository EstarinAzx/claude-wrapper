---
type: pick-up
project: claude-wrapper
updated: 2026-08-04
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Frontier: THE TRACKER IS EMPTY

**Zero open issues, in either label.** Not "the agent queue is dry" — nothing is
open at all. Verified with the frontier query after #97 closed, not predicted.

```
gh issue list --state open --label ready-for-agent
gh issue list --state open --label ready-for-human
gh issue list --state open
```

All three returned nothing. **Run them again anyway** — this table goes stale the
moment anything is filed, and this project's standing lesson is that a leg once
wrote that closing #70 would empty the queue and was wrong, because #71 had been
unblocked all along.

**The relay chain stopped here rather than spawning a leg 5.** An empty queue is
`ticket-loop`'s designed stop; `max_legs: 8` was never reached.

**The next move is the owner's** — file new work, or run `/preset init` /
`/preset vibe init` for a batch. `## Deferred` in [[active-work]] is the standing
menu; `## Open questions` holds the ones needing an answer before they can be
specced.

~~#86 … #97~~ — all closed.

## Landed this sitting (2026-08-04) — #97, `96fb20f`

**The mint budget is measured, and the measurement was deliberately not spent.**
Measurement only: **no `src/` diff, `DESIGN.md` untouched.** Deliverable is
`scripts/spike-97-mint-budget.mjs` + `scripts/spike-97-findings.json` — the
**sixth** spike harness and the first that drives the WINDOW rather than the CLI.

**One mechanism answers both halves: a token differential.** A declaration
resolves to an accent token **iff its computed value changes when that token
changes**; a pixel carries accent alpha `a` iff `A - B = a·(M - N)` when the
token is overridden. **The ground cancels exactly**, which is why the
`--disable-gpu`/acrylic trap cannot move the number and why no tolerance had to
be invented for neutrals that are deliberately tinted toward the accent hue.

**Verdict, and it splits:**

- **"spent only on [5 sites]" — VIOLATED.** 52 declarations resolve to an accent
  token; **38 paint surface here, 8 listed and 30 not.**
- **"≤10% of surface" — SATISFIED under both readings.** Peak **1.02% ink /
  1.08% coverage** over 4 palettes × 2 states. Two numbers ship because the
  clause does not say which it means.

**The clause remains the owner's call, on #92.** Producing the evidence does not
license spending it.

See [[2026-08-04-the-ground-cancels-in-a-token-differential]].

## Landmines

Full ledger in [[active-work]] — long and load-bearing. **New from #97:**

- **`rule.style` enumerates a var-shorthand's longhands with EMPTY values**, so a
  `value.includes('var(')` filter drops every `background:` declaration. It
  reported 21 declarations, missed **four of the five NAMED sites**, and read
  green. Parse `rule.style.cssText`, splitting on top-level `;` only.
- **THREE pixel kinds live in a window driver**: DIP (`setContentBounds`),
  physical (`capturePage`), CSS (`innerWidth` = DIP ÷ **zoom, which is 1.25
  here** and persisted by Chromium in `userData`). Assert the capture equals the
  window content in **device** px; comparing `innerWidth` to DIP reds a correct
  capture.
- **`toBitmap()` is BGRA** and a mis-ordered projection still returns non-zero.
  A **calibration target** reading `a = 1.0000` is what proves channel order,
  compositing model and scale at once.
- **Keep `--color-mint-wash`'s 0.1 alpha when overriding it**, or `a` differs
  between A and B and that token's reading inflates ~10× in silence.
- **The build emits `color-mix()` fallback pairs — 6 declarations never paint in
  Chromium**, but would paint the accent at FULL opacity where 6% was asked for
  in any engine without `color-mix`. Do not "clean them up".
- **`.backend-pill--wisped` is the largest unlisted accent spend on screen** (1483
  device px vs the avatar's 958) **and is backend-mode-dependent**.
- **Cross-frame subtraction is invalid once the injected thing reflows** — the
  typing-dot probe went **negative** that way. Measure the probe's own region;
  `position: fixed` is what makes an injected element frame-comparable.
- **Restore borrowed window state**: bounds (persisted by #79) and the `theme`
  key. A run ending at 900×600 on Slate moves what `gui-51` measures.
- **`::marker` paints outside its element's border box**, so rect-based
  attribution misses ordered-list markers. A limit of the breakdown, not the
  totals.
- **Accent share is window-size dependent** (0.38% → 0.88% at 900×600), because
  the accent sites are fixed-size.
- **A ticket's stated baseline was stale for the THIRD consecutive ticket** —
  #97 said 953/63, actual **979/64**.

**Still live from #96:** **`base.css:92` kills EVERY animation under
`prefers-reduced-motion: reduce`** — force the media state **and read it back**,
because forcing is not taking (#97 used this deliberately, to freeze frames);
**an "X is unchanged" criterion cannot span the source edit** — drive the live
element through both states in-run; **`.model-menu-item`'s box does NOT move
between 400 and 500**; **the two `subagent-pulse 1.4s` sites are accepted
exceptions** and `gui-96` reds if you conform them; **`gui-96.mjs` is the ONLY
guard on both values**; **`gui-52` is RED and environmental** (empty CLI model
list); **~~`.claude/settings.json` holds a live `ANTHROPIC_API_KEY` in a TRACKED
file~~ — RESOLVED 2026-08-04 (`d6ec749`).** It is now untracked and
gitignored, so `git add -A` no longer picks it up (verified). **Staging by path
is still the right habit, but it is no longer the only thing standing between
this repo and a published key.** Note for anyone hitting this pattern again:
a `.gitignore` entry alone would **not** have fixed it — gitignore does not
apply to already-tracked files, and `git rm --cached` is the half that
untracks. The key value was confirmed absent from **all** commits across all
refs before the change, so no rotation was needed.

**Still live from #95:** a GUI driver can reach the **subagent drawer with NO
live turn** (push `chat:event` from main — a `Task` tool-use then a `subagent`
tick); **match CSS classes by whitespace-split TOKEN, never substring**;
**`$?` after a pipe is the pipe's exit code**, not the driver's; **the subagent
drawer has NO focus trap** (known, unfixed, unfiled); **two scrims exist and must
agree**; **`tests/` is LF while `src/` is CRLF** — do not "fix" either
(`scripts/` is CRLF too; the warnings on commit are expected).

**Still live from #91:** **NEVER read `~/.claude/daemon/roster.json`** (attach
credentials); **the spawn is not a licence**; **nothing may put the background
list on a timer**; **`sessionId` is the only universal key**; **`state`/`status`
are OPEN vocabularies** — render the raw string; **no unified "is it alive"
boolean**; **the app is in its own listing** and `cwd` cannot exclude it; **an
absence assertion needs surviving rows beside it**; **whether `--cwd` matches by
prefix or exactly is UNMEASURED**; **jsdom loads no CSS**, which is exactly why
#97 had to be a window driver.

**Still live from #94:** **`font: inherit` is a SHORTHAND** and resets
`line-height` (plus style/variant/weight/stretch/size) — **enumerate the
shorthand**; the neutraliser goes on the **parent**; **`.command-row-name` /
`.command-row-hint` render on TWO surfaces**; **every line-height in this app is
unitless — all 19**; **`.command-list`'s height measures nothing**.

**Still live from #93:** a new control does not "join the focus group" by default
— **ask what it paints first**; `.model-pill` breaks the rule's letter **on
purpose**; `Tab` is not a way out of the composer while the slash popover is
open; the sessions rail is **~101 real tab stops**; **`el.focus()` does NOT
reliably match `:focus-visible` — press real keys**; drivers read expected
colours from a **probe element**, never a literal (four palettes ship).

**From #92, and #97 has now ENDED the evidence half:** the accent clause's two
halves are **measured** — proportion holds (~10× headroom), enumeration does not
(30 unlisted surface declarations). **`DESIGN.md` was still NOT amended, and must
not be** to match drift: that laundering move was refused for the accent clause
in #92, again for the weight scale in #96, and #97 was **forbidden from spending
its own evidence**. **"No measurement can answer a taste call" is a FALSE
PARAPHRASE** carried in `.claude/vibe-2026-07-31-*.md`; the real line is about
**instruments, not ownership** — and #97 is the case that proves it, having
measured the half everyone assumed was unmeasurable.

**Still live from #90/#89/#88/#87:** the agent-view listing is a **join** the CLI
performs; **a name-level scan for "agent" here returns SUBAGENT APIs**; an empty
return measures nothing; `entrypoint` is decided by the **launch env** and cannot
separate this app's sessions from its own GUI drivers; **one record decides a
whole session**; `init` fires per **TURN**; `McpServerStatus.config` carries
`env`; **the thinking block arrives EMPTY**; `result.subtype` is `'success'` on a
failed turn (`is_error` says so); unsetting `ANTHROPIC_BASE_URL` by hand is **not**
native mode.

**Still true:** **reproduce a red on clean `main` with the work stashed before
calling it a regression**; **judge drivers by exit code**; a mutant can kill a
**bad test** before it kills the code; the composer is never `disabled`;
`lastTurn`'s nonce is load-bearing; an edge between two samples is not observable
by sampling; `resume` binds at query **construction**; a stream dying **between**
turns emits nothing; **opening a past session CLOSES the engine**; a test
asserting an **absence** is the one most likely to be vacuous — **mutation-verify
it**, eight times bitten now (#76, #82, #93, #94, #91, #95, #96, #97); never
hardcode a model name; **`gh issue close --comment` silently drops the comment if
the issue is already closed — comment first, then close**; a squash merge leaves
the branch "not fully merged", so `git branch -D` is correct there; **Playwright
cannot measure a launch**; `--disable-gpu` is load-bearing in a background session
(and flattens acrylic — harmless to a differential, fatal to a hue classifier).

## Baseline

`main` = `96fb20f` (#97) plus this `.context` commit. **Unpushed, 14 ahead of
origin.** No open branches. Test baseline **979 across 64 files — unchanged by
#97**, which is measurement-only and added no `src/` diff at all. Typecheck
clean.

**The working tree is now CLEAN** apart from `.context/2026-07-23.md` and
`.context/Untitled.canvas`, both **0 bytes** — Obsidian stubs, the owner's to
clear, and the only two `.context` lint issues. `.claude/settings.json` no longer
shows as a modification: it was untracked and gitignored in `d6ec749`.

**29 driver files** in `.claude/skills/run-desktop/` (27 assertion drivers, two
`gui-7x-probe` helpers, plus the observational `gui-scope-zoom-pill`). **#97 ran
none of them, correctly** — it touched no `src/` file and no CSS, so no driver's
subject moved. Two standing environmental reds, both premise failures rather than
regressions and both unretested this leg: **`gui-75`** (focus-dependent) and
**`gui-52`** (empty CLI model list).

Spike harnesses in `scripts/`: `spike-81-background-tasks.mjs`,
`spike-87-thinking.mjs`, `spike-88-mcp-status.mjs`, `spike-89-entrypoint.mjs`,
`spike-90-agent-view.mjs`, **`spike-97-mint-budget.mjs`**. The first five import
the app's real `cli-path.ts` / `backend-mode.ts`; **#97 is the odd one out** — it
drives the built window through playwright-core and imports no app module, so it
needs `npm run build` first. **#90 is still the one to copy for scrubbing; #97 is
the one to copy for measuring anything rendered.**

## Do not decide these

**Both 2026-08-04 grants are spent.** A new **reason** reopens a call; a re-read
does not.

**Only THREE owner calls still stand:**

1. **Tailwind's adopt-utilities half.** A *drop* has a measured cascade risk —
   today the defaults compile into `@layer theme` while `[data-theme=…]` blocks
   are unlayered, so unlayered-beats-layered decides the override regardless of
   import order.
2. **The titlebar's control count.** #86.1 was decided so nothing pre-empts it;
   #91 shipped without touching it and pins it at 8.
3. **Whether 12px is the right line box for 11px muted description text** (#94).

**And the accent clause, which is now the sharpest of them** — #97 produced the
evidence and deliberately did not spend it. The proportion half **holds**; the
enumeration half **does not**. So the question is whether the *enumeration*
should change, and the answer is a taste call, not a measurement.

**Still open and unfiled: the subagent drawer has no focus trap.**
`role="dialog" aria-modal="true"` traps nothing. Real a11y gap, deliberately not
filed because filing is a scoping call and the grants are spent. Evidence is the
16-stop walk in #95's ticket comment.

**One scoping choice is SHIPPED and cheap to overrule:** which surface #91's
section joins (the sessions rail, not the Agents dock). Eyeballable at
`%TEMP%\claude-wrapper-shots\gui-91-rail-rows.png`.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[flows]] — **traced flows**, and the agent-view name-collision table
- [[2026-08-04-the-ground-cancels-in-a-token-differential]] — **#97, this
  sitting: the token differential, and the accent clause's two halves measured**
- [[2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit]] — #96
- [[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]] — #95
- [[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]] — #91
- [[2026-08-04-the-parked-owner-calls-are-taken]] — the nine calls, which **filed
  #96 and #97**
- [[2026-08-04-the-font-shorthand-resets-the-line-box]] — #94
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — **AMENDED by #94**
- [[2026-08-03-the-engine-ports-are-named-not-counted]] — the architecture pass (`c7cee33`)
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — #90
- [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] — #89
- [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] — **AMENDED by #89**
- [[2026-08-02-mcp-health-already-arrives-once-per-turn]] — #88
- [[2026-08-02-the-thinking-block-arrives-empty]] — #87
- [[2026-08-01-the-background-agents-seed-decided]] — the batch-ADR precedent
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81, #93, #94, #91, #95, #96, **and #97's calibration target**
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- [[2026-07-24-ui-polish-model-picker-subagent-viewer]] — where the drawer came from
- `.claude/vibe.md` — the runs that filed #81 and #86–#89
