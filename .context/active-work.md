---
type: active-work
project: claude-wrapper
updated: 2026-07-31
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-31 by Opus 5 (1M) (auto) — relay leg 5 of spec #64's batch: ticket **#69** landed_
_At commit: `add4e5b` on `main`, pushed. Gate: typecheck clean, build clean, **802 tests green across 55 files** (786 → 802, +1 file)_
_Driver check: `gui-69` **PASS** in a real GPU-on window, seen red on `main` first. `gui-66` re-run **PASS**. `gui-51` remains the one expected red (#71), byte-identical signature_

## Current focus

**Spec #64's batch is one ticket from done. #65, #68, #66, #67 and #69 are closed; #70 is the last one, and it is unblocked.**

The owner asked for four things — a delete-sessions button, a settings surface ("you decide what to put there"), a persistent-acrylic toggle, and colour themes. The funnel turned that into:

| # | Ticket | Blocked by |
|---|---|---|
| ~~#65~~ | ~~Retire the stale `gui-45` driver~~ — **closed, `f0dfc68`** | — |
| ~~#68~~ | ~~Delete a session from the rail~~ — **closed, `70c904f`** | — |
| ~~#66~~ | ~~Appearance dock with the zoom control~~ — **closed, `a7c0470`** | — |
| ~~#67~~ | ~~Tokenise the two duplicate colour literals~~ — **closed, `e16ace6`** | — |
| ~~#69~~ | ~~Backdrop control: Acrylic or Mica~~ — **closed, `add4e5b`** | — |
| **#70** | Four themes: Frost, Ember, Moss, Slate | — |

Five ADRs carry the reasoning and were written **before** the spec. Read [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] before touching #70 — it argues, the spec only summarises — **and read its amendment**, which is load-bearing and in #70's favour.

**All three of the batch's counter-intuitive calls are now spent and in code:** the delete call omits `dir` (pinned by value *and* arity), the two duplicate colour literals are tokenised, and preferences stayed in renderer `localStorage` rather than moving to a main-side store. Nothing is left waiting to be reversed. #70 is the batch's one straightforwardly additive ticket.

## State

- **In flight:** nothing. No open branches.
- **Landed this leg:** #69 as `add4e5b` — a Backdrop control (Acrylic default / Mica) in the Appearance panel, `src/shared/backdrop.ts` as the two-string whitelist and trust boundary, `backdrop:set` as a one-way guarded channel, `useBackdrop.ts` storing in renderer `localStorage` and pushing on mount and on change, new rows in `styles/appearance.css` only. `DESIGN.md`'s false neutrals clause rewritten; `PRODUCT.md` untouched. New driver `gui-69.mjs`.
- **Queue (`ready-for-agent`):** **two open** — **#70** (the last batch ticket) and **#71** (unblocked, standalone, outside the chain). Verified via `issue_dependencies_summary.blocked_by`.
- **Blocked:** nothing.
- **Open:** #64 (the spec, stays open until #70 closes), #70, #71.

## Pick up here

**Take #70 (Four themes) — it is the last ticket in the batch, and closing it closes spec #64.**

**#71 is not in that chain** and blocks nothing. Its premise is overtaken: it was filed expecting #66 to move the default zoom, and #66 did not (still `1.25`). `gui-51`'s tolerance is still calibrated to the old `1.1` default, so the ticket stands on the pre-existing miscalibration alone.

Conventions unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green before merge, `.context/` commits on main only.

## Open questions

- **Should the rail filter out `sdk-cli` sessions?** The listing fix admits **112** rows to surface the **37** this app wrote; the other 75 are headless automation, ~20 of them this repo's own GUI drivers titled "say OK" / "reply with exactly: PONG". Accepted deliberately, but it is worst exactly where the owner looks first. The blocker is that `SDKSessionInfo` exposes no `entrypoint` / `origin` / `sessionKind` — the deciding field is read from disk and discarded — so filtering means either re-opening ~680 JSONLs (the scan the SDK reader exists to avoid) or `tagSession` on every session this app creates, which is prospective only and would not reach the 37 already written. **#68 was explicitly NOT the answer to this**, and shipped saying so.
- **Should Tailwind stay at all?** Nothing in the app uses a utility class — eight specs after [[2026-07-23-tailwind4-tokens]] promised "new/evolving UI uses utilities," it has never happened. Either adopt utilities deliberately for new UI, or drop two devDependencies and the vite plugin and inline `@theme` into `:root`. **#70 deliberately does not bundle this.**
- **The titlebar is crowded** — app name + session title + two pills + **three** dock buttons + window controls, each button eating drag region. Flagged for an impeccable pass, deliberately out of scope for the batch.
- **Should the Appearance panel's two control shapes converge?** #69 introduced `.appearance-field--stacked` beside #66's label-left/control-right row, because an option carrying a sentence of trade cannot sit beside its label in a fixed-width panel. #70's theme picker is a third case (four options, no descriptions). Whether those become one component is a #70 call, not a defect.
- **Should `rails.css:325` read `var(--mint)` like every other component site?** It reads `var(--color-mint)` — the one long-name reference in component CSS. Themes correctly either way; a naming inconsistency, not a bug.
- One deferred owner decision from #58's Out of Scope: whether an honest Write diff is wanted at permission time only, or also after an auto-run and in replay. Still open.

## Recent context

- **A self-healing display hides a push that never happened, and only a pin on the EFFECT catches it.** #69's sharpest mutation: replacing `useBackdrop`'s lazy `useState(readStored)` with an effect-set initial state kills exactly **one** assertion — the one asserting what reached main. Every display-facing pin stays green, because the effect corrects the panel a tick later; the window meanwhile wears the constructed default while the panel reports the stored choice. This is #66's `useZoom` trap generalised: **when a preference has both a report and an effect, the report can self-heal and the effect cannot**, so the pin must be on what crossed the boundary. Worth carrying into #70, whose "effect" is a `data-theme` attribute rather than an IPC call — same shape, same blind spot.
- **A trust boundary must compare, never coerce.** `normalizeBackdrop` checks membership on the raw value. A `String(value)` boundary is the natural-looking version and admits any object with a convenient `toString`; there is a test named for exactly that, and it dies when the coercion is added back. `clampZoom`'s `Number()` is not the same thing — a numeric clamp has a defined answer for garbage, a string whitelist does not.
- **Instrumenting the far side of a boundary is what separates "called" from "applied".** The vitest suite can only observe that a preload function was invoked. `gui-69` patches `setBackgroundMaterial` **in main**, which is what turns "the renderer tried" into "the window was told", and the same trick proves the *absence* of a rebuild: window id `1` before and after. Reusable for any main-affecting preference.
- **A driver should print what it cannot prove, next to its own PASS.** `gui-69` cannot say whether Acrylic and Mica look different — that is DWM compositing over a wallpaper, and a capture of an automated window is not evidence either way. It says so in its output rather than letting a green read as more than it is. The GPU is deliberately left **on** in that driver, unlike every other one here, because `--disable-gpu` photographs neither material.
- **A pin written for one control can constrain the next one's markup.** #66's "the zoom control is not a slider or a select" is written **dock-wide** (`dock().querySelector('input, select')`), so #69's pick-one-of-two could not use radio inputs. It shipped as a `role="radiogroup"` of buttons with roving tabindex, which is the app's idiom anyway. Not a stale pin and not a workaround — the constraint was read and satisfied.
- **`Record<Value, Copy>` mapped over the whitelist makes "exactly N options" structural.** #69's option list cannot drift from `BACKDROPS`: a material without copy is a type error, copy without a material renders nowhere. Cheaper than a test asserting the count, and it is the shape #70's four themes want.
- **An ADR's premise can also survive, and saying so is worth as much as an amendment.** [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] rested on `setBackgroundMaterial` being runtime-settable, cited from `electron.d.ts`. It is now measured live (`{"patched":true}`), and the ADR records that. Two probes in this batch falsified their premise; this one confirmed it, and the difference is only visible because all three were run.
- **An ADR's conclusion can be right while its stated reason is measurably false, and the fix is to amend rather than to reverse.** [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] justified the fourth accent token by calling `color-mix()` "a new mechanism". One grep settles it: it was already in the stylesheet **six times** (6/12/14/20/22/50%), one of them 256 lines above the literal in question. The token shipped anyway, standing on two other things: it is an authored per-theme override point the key-set test can pin, and it kept #67's resolved value byte-identical. **The correction is load-bearing for #70, and in its favour** — those six read `var(--mint)` and so **re-hue for free**.
- **A proof method constrains which implementations are acceptable, not just which are correct.** `color-mix(… 10%, transparent)` is computationally identical to `oklch(0.87 0.07 180 / 0.1)` but not textually, and #67's acceptance criteria asked for equivalence proven by resolving `var()` in the compiled bundle.
- **A diff harness that silently matches nothing reports a clean PASS.** #67's checker was mutation-verified in both directions before its result was believed.
- **The probe falsified its own premise and the feature survived.** #68 was written around a Windows delete-blocking handle. Measured: the unlink **succeeds** mid-turn. The scope did not widen; the real hazard was the opposite of the predicted one — a mid-turn delete succeeds and is then **undone** by the running turn's next append.
- **Classify by asking the store, not by reading the error.** `deleteSession` catches, drops the index and re-resolves the id.
- **A feature can be a diagnostic.** Project-scoping the rail revealed a two-day-old listing bug an unscoped rail had been hiding.
- **A mutation that kills nothing may mean the code is dead** — #63's coalescing pass is the worked example.

## Landmines (carried forward)

**From #69 — now true of the backdrop path in code:**

- **`useBackdrop`'s lazy `useState(readStored)` initialiser is load-bearing, and breaking it is nearly invisible.** Only the mount-push assertion dies; the panel self-corrects. Same shape as `useZoom`'s, and the storage key `backdrop` is **deliberately unversioned** (acrylic is an identity, not a tuned default) — version it if that ever stops being true.
- **`normalizeBackdrop` compares, never coerces.** Do not "tidy" it into `String(value)`.
- **The Backdrop control is a radiogroup of BUTTONS, and it has to be.** A dock-wide pin asserts the Appearance panel renders no `input` and no `select`. Any new control in that panel — #70's theme picker included — must satisfy the same constraint.
- **`gui-69` runs with the GPU ON**, unlike every other driver here, and it mutates the real app's `localStorage` before restoring it. Do not "standardise" it onto `--disable-gpu`: that flattens acrylic and photographs neither material.
- **Backdrop touches no neutral, and must not.** Coupling it to the palette makes it a second theme axis writing the same custom properties as #70, from two independent controls, invisibly.

**From #67 — true of the token store:**

- **`color-mix(in oklch, var(--mint) N%, transparent)` is established idiom, six sites, and those sites theme themselves.** 6% / 12% / 14% / 20% / 22% / 50%. **Do not tokenise them, do not expect them in #70's key set, and do not read them as literals #67 missed.**
- **The accent is FOUR tokens and `--color-mint-wash` now exists** (`oklch(0.87 0.07 180 / 0.1)`, plus the `--mint-wash` alias). One caller was two; #69's selected-option fill is the second. Exempt from the one-caller-token rule because its job is to be an **override point**.
- **Sixteen colour literals outside `tokens.css` are deliberate.** A future "finish the tokenisation" pass is wrong, not incomplete.
- **Proving a CSS refactor changed nothing means resolving `var()` and diffing per selector — then mutating the checker.** The minifier reorders declarations within a rule; separate custom-property definitions from painting declarations.

**From #66 — true of the Appearance dock:**

- **`useZoom`'s lazy initialiser is load-bearing and breaking it is invisible to the old suite.** Mutation-verified: only `tests/appearance-dock.test.tsx`'s readout pins die. `zoom-level-v2` stays versioned; bump it on the next default change.
- **The keydown listener reads `levelRef`, not `level`.** Both paths must go through `apply`.
- **The Appearance dock JOINS the dock-shell groups — it carries `.agents-dock`** — and `styles/appearance.css` owns only its control rows. Do NOT widen a shared group in `rails.css` / `shared.css`: that repaints the sessions rail and the agents dock silently, with a suite that loads no CSS. **#70's theme rows go in `styles/appearance.css` too.**
- **The panel must stay draft-free.** Pinned by asserting no button in the dock matches `/save|apply|reset|revert/i`.
- **A dock member must go in the `openDock` UNION, never another boolean.** Pinned against both siblings in both directions.
- **`@testing-library/jest-dom` is NOT installed.** Assert DOM properties directly (`el.disabled`).

**From #64's design pass — traps still ahead in #70:**

- **`themes.css` will be the THIRD raw-text CSS reader in the suite**, joining `tests/scrollbar.test.ts` and `tests/multiline-composer.test.tsx`. Both have gone red on prose. The theme file will *want* comments explaining each hue, and a naive `--color-\w+:` regex counts a commented-out declaration happily. **Strip comments before parsing.** #67 and #69 both deliberately declined to add a fourth.
- **`themes.css` imports immediately after `tokens.css` and before `base.css`** — thirteenth import. A theme block landing before the tokens it overrides is the silent restyle the cascade rule exists to prevent.
- **`--color-mint-ink` follows the hue but keeps its lightness AND its chroma**; neutrals move by hue angle only. Only `--color-mint` / `--color-mint-press` may move chroma, within `0.05`–`0.09`.
- **No test can say whether a theme looks good**, and a driver screenshot cannot judge the backdrop at all. Real window or nothing.
- **The IPC rule is spent for this batch.** #68 and #69 took both new channels; theme and zoom are renderer-only and fire it zero times.

**From #68 — true of the delete path:**

- **`deleteSession` takes ONE argument, and the pin is on the arity as well as the value.**
- **The delete's outcome is a claim about the STORE, never about the error text.** `unavailable` must stay `failed`.
- **The busy gate is `active && busy`, NOT `!foreign && busy`.** It looks like an inconsistency to be tidied. It is not.
- **Windows holds no delete-blocking handle on a transcript** — measured, all three states.
- **The delete control's hidden state must stay `opacity`, and the reveal must keep `:focus-within`.**
- **`session-index.ts` ignores `CLAUDE_CONFIG_DIR` while the SDK honours it.** Pre-existing and app-wide.

**From #65 — true of the driver set:**

- **A driver must ESTABLISH the app state it asserts, never inherit it.** Drivers write each other's state.
- **A `SKIPPED` line is a hole in the gate, not an environment note.**
- **Never assert a fact about this machine's disk.** Compare filters against each other, and compare **totals**.

**Carried from earlier legs:**

- **`includeProgrammatic` must stay `true`, and nothing pins the argument.** The behaviour is pinned by `tests/session-store-live.test.ts`, which mocks nothing. That file must keep saving/restoring `CLAUDE_CONFIG_DIR`.
- **A test that mocks the SDK module cannot pin what the SDK does.**
- **The store's session listing and its session *resolution* have different filters.**
- **The conversation you are in is a clickable row now.** `useChat.openSession`'s same-id guard is what stops a click re-adopting the live session.
- **`scope: 'project'` drops cwd-less sessions too**, and runs **before** the cap, deliberately.
- **`--r-pill` on a growable box is a bug waiting for the box to grow.** `.input-pill` is pinned to a literal `24px`. #69's choice cards use a literal `8px` for the same reason.
- **A persisted preference silently outranks the default it was seeded from.**
- **`sed -i` rewrites a whole file to LF.** Use the `Edit` tool for mutations, or re-normalise afterwards.
- **A script importing a project dependency must live under the project tree.**
- **The `@import` order in `styles.css` IS the cascade, and breaking it is silent.** `tokens` → `base` → `shared` must stay first. **Twelve** lines today, thirteen after #70.
- **A new rule goes in the file that owns its surface, never in the entry.**
- **`tests/scrollbar.test.ts` scans EVERY LINE containing a scrollbar pseudo-element, comments included.**
- **`tests/multiline-composer.test.tsx` slices raw CSS between literal braces.** `.bubble` and `.message-input` must stay **ungrouped**.
- **Split a file by LINE RANGE, never by retyping it.**
- **`styles.css` and all of `src/` is CRLF, while `.context/*.md` is LF in the index.** Re-normalise after a whole-file `Write`. (#67 and #69 both verified their edited files stayed 100% CRLF.)
- **`.command-row-btn` is the one row button without `font: inherit`**, deliberately excluded.
- **Tint steps 1 and 2 differ by 0.01 alpha** for no recorded reason. Collapsing them is a design call.
- **A mutation that kills nothing may be telling you the CODE is dead.**
- **Never render a Write diff.** Labelled content preview only; the guard is an assertion of **absence**.
- **The card carries THREE disclosure booleans**, one per region.
- **A fourth control on the tool card must be named twice over** — a `.tool-card-toggle--<what>` modifier class **and** an accessible name outside `tests/toolcards.test.tsx`'s `TOGGLE` regex. Both failures are silent.
- **`lineDiff`'s `>=` tie-break is load-bearing**, and **never `split('\n')` in the diff path.**
- **`[]` and `null` mean different things on both store channels.** `?? []` at a new call site restores the exact bug #60 removed.
- **Never cache a failed index build.**
- **Live-tail's failed-read guard is `continue`, never `break`.**
- **A failure notice must retire when the thing it warns about arrives.**
- **The mutation harness must normalise CRLF.** Anchors written with `\n` match **zero** times in `src/`, and a zero-match anchor reads exactly like a surviving mutation. Anchored `Edit` calls sidestep the class.
- **Never summarise a tool result on the way into state.**
- **The collapsed tool-card test is a mechanism check.** Detail must stay **conditionally mounted**.
- **`resultSummary` runs on the COMPLETE result, on every render.**
- **`inputEntries` sorts, and the sort is load-bearing.**
- **Never `git checkout <file>` to undo a mutation on uncommitted work.** Commit first, then mutate, and reverse with the same anchored replace. (#69's six mutations were verified reversed by an empty `git diff`.)
- **`gh` infers the repo from the working directory.**
- **#57's watcher is epoch-fenced, and the fence is the whole safety argument.**
- **`fs.watch` throws SYNCHRONOUSLY** on ENOENT/EPERM.
- **A reload's staleness re-check must not orphan the queued re-run.**
- **Live-tail is for a session you are WATCHING, never one you are DRIVING.**
- **Pins are mutation-verified. Never "fix" a red pin by editing its expectation.** The legitimate-retirement allowance is **spent**.
- **A green test can be green for the wrong reason.** Assert the mechanism — a fetch count, a read that must not happen, a call ORDER.
- **A session id is only resumable once a turn has run** (#54).
- **Never re-derive a store path from `cwd`.**
- **Never call `window.api.pickFolder` outside `Welcome`.**
- **Never clear the pane with `newChat()` on a switch path.** Use `adoptSession(id)`.
- **Do not add a second busy flag.**
- **Never un-key the composer.** `<InputBar key={cwd}>` is the entire draft / tray / autocomplete reset.
- **`pendingInsert` must be cleared in the same commit as the cwd change.**
- **Anything workspace-scoped added to App state must join the `ok` branch** of `switchWorkspace`.
- **Do not rebuild the storage index inside `listSessions`**, and never re-add `customTitle ?? summary`.
- **#50: never match CLI markup mid-string.** A real recorded argument is `fable[1m]`.
- **#51: never scope a scrollbar rule to a component**, and never add `scrollbar-width` / `scrollbar-color`.
- **Never write a literal ESC byte or a `\u` escape into source.**
- **A session fixture with no `cwd` is a foreign row.**
- **New `window.api` channel → ALL FOUR mock sites** (`chat-harness.ts`, `session.test.tsx`, `shell.test.tsx`, `sidebar.test.tsx`) plus `preload/index.d.ts`, and guard every IPC with `isTrustedIpc`.
- **A module-level cache needs a test reset.**
- **Vitest + `node:fs/promises`:** a module mock must also export `default`, and it needs `stat` now.
- **Never add a resize effect to `InputBar`** — height is CSS (`field-sizing: content`).
- **Never hardcode a model name anywhere.**
- **Never merge `picked` and `reported` in `model-mode.ts`.**
- **Wisp `options.model`: the CLI shadows the FAMILIES, the bridge resolves the ALIASES.** Never run bare `wisp snapshot` — always name the family.
- **The app runs the HOST `claude` when PATH has one** (`cli-path.ts`).
- **`gh issue close --comment` silently drops the comment if the issue is already closed** — and a commit trailer (`Closes #n`) closes the issue the moment main is pushed, so **comment first, then close**. **`gh issue list` lags a close by seconds.**
- **A squash merge leaves the branch "not fully merged"** — `git branch -d` refuses it; `-D` is correct here, not force in the dangerous sense.
- **The Bash tool is not PowerShell** — heredoc, never a PowerShell here-string.
- **A mutation harness must assert its anchor matched exactly once.**

## Known issues / not-our-bug

- **`gui-51.mjs` FAILS on `main`** with `model menu gutter 9.4px | .session-groups gutter 9px` — a **standing, characterised red**, tracked as **#71**. Its ±0.5px tolerance around a 10px gutter is calibrated to `DEFAULT_ZOOM = 1.1` and `ece7b9c` raised the default to `1.25`. Verified pre-existing and re-confirmed byte-identical after #66, #67 and **#69**. **This is the one expected driver failure — a second signature is a real regression.** Do not widen the tolerance until the numbers fit.
- **A capture cannot see the right ~20% of the layout.** The window composites `windowWidth` device px while the page lays out `windowWidth` CSS px at zoom 1.25, so every right-hand dock is clipped out of a screenshot at any window size — re-confirmed by #69's captures, where the Appearance panel is visibly cut. **Measure with `getBoundingClientRect`**; `gui-66` works around it with a presentational-only `setZoom(1)` after every assertion.
- **Fable-5 refuses turns whose cwd looks sensitive** (`Downloads/*`). Don't point a GUI driver's temp cwd there.
- **GUI driver traps:** `--disable-gpu` flattens acrylic (so `gui-69` leaves the GPU on); measure in the DOM, never off screenshots; dispatch clicks via `page.evaluate(() => el.click())`; arm a hard `setTimeout(process.exit)` before awaiting `app.close()`; never re-read an element after an action that may not have happened; **count the side effect you care about**; pass any path as an **argument** to `app.evaluate`; stub `dialog.showOpenDialog` in main before any click that opens one; and **select controls by their modifier class**.
- **Driver trick (gui-69):** patch a main-process method (`BrowserWindow.prototype.setBackgroundMaterial`) from `app.evaluate` to record its arguments — that is what separates "the renderer called preload" from "the window was told", and comparing `BrowserWindow.getAllWindows().map(w => w.id)` across the action proves no rebuild. To observe a **mount** push without racing renderer boot, install the patch and then `page.reload()`.
- **Driver trick (gui-scope-zoom-pill):** clearing `sidebar-scope` / `zoom-level-v2` from `localStorage` **after mount but before the folder click** shows shipped defaults rather than the dev machine's stored values.
- **Driver trick (gui-66):** a webContents zoom change is measurable **in the DOM** as `window.innerWidth` moving inversely. Also: read a shared group's DECLARED value out of `document.styleSheets` when live siblings carry user-resized inline widths.
- **Driver trick (gui-63 / gui-62 / gui-61 / gui-55):** seeded tool calls and terminal-shaped sessions can be written straight into the native store; the Write assertion is one of **absence**; clean up on every exit path.
- **jsdom is blind to CSS, so a visual ticket needs a driver** — and a *CSS-only* change needs more than a driver. **Resolving `var()` in both compiled bundles and diffing declarations per selector is the exhaustive check.**

## Deferred (still no spec)

**Deferred by #64, with reasons on record:** literal **persistent acrylic** via a native window-composition dependency ([[2026-07-23-persistent-glass-deferred]] stays live for it); a **light theme**; **re-hueing the danger shades or the three syntax-highlight colours**; **bulk delete / clear-all / archive / rename / undo / trash** for sessions; **gating `win.show()` on the first preference push** (only if a driver measures the launch artifact as objectionable — #69 did not measure it); a **resize grip or persisted width** for the Appearance dock; **refactoring the titlebar's four dock props** into a generic pair; **reducing the titlebar's control count**; **re-tuning the neutral palette per backdrop**; **migrating the four existing preference keys** to any new storage.

**Newly noted by #69:** whether the panel's two control-row shapes (`.appearance-field` and `.appearance-field--stacked`) should converge once #70 adds a third; and **arrow-key selection in the Backdrop radiogroup is implemented, but no other radiogroup exists yet to share it with** — extract only when #70 makes it a second copy.

**Noted by #67:** renaming `rails.css:325`'s `var(--color-mint)` to the short alias every other component site uses — cosmetic, themes correctly either way.

**Carried, still unspec'd:** filter or de-noise the `sdk-cli` rows (**#68 is explicitly not the answer**); revisit the scope-chip control for contrast; give `.command-row-btn` its `font: inherit`; decide whether tint steps 1 and 2 should collapse; decide Tailwind's fate.

**Deferred by #58, with reasons on record:** honest whole-file **Write diff**; **per-tool rich card bodies**; **permission-mode default or persistence**; **adopting the SDK's richer permission metadata**; a **wrapper-owned truncation cap**; a **diff dependency**; **syntax highlighting inside diffs**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a collapsed strip; **native turn-end notifications + taskbar flash**; **type-while-busy composer** then queued send; **one-click restart on `terminalError`**; **turn pulse** from the dropped telemetry; **MCP + settings-parse health** surfacing.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the **watch-installed-after-the-read gap**; context-pressure meter; typed failed-turn recovery; full-text transcript search; **session rename / archive**; drag-and-drop; replay thumbnails; N-concurrent engines; **fork-on-resume**; busy-switch detach (decided against); folding `Welcome`'s last `pickFolder` caller onto the chooser; agent archive / control / map pan-zoom; and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — **#70, the last ticket; read its amendment**
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — **#69, shipped as argued; amended with the live confirmation**
- [[2026-07-31-a-preference-lives-where-it-is-read]] — **#69 consumed it; the premise held**
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66, shipped as argued
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68, amended with the probe result
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, and the rule the driver set now follows
- [[2026-07-30-the-import-order-is-the-cascade]] — where `themes.css` and `appearance.css` sit
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] · [[2026-07-23-tailwind4-tokens]] — the token store #70 overrides
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — the reflex behind mutation-verifying #69's pins
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] ·
  [[2026-07-30-two-disclosures-two-booleans]] ·
  [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] ·
  [[2026-07-30-inspection-is-universal-approval-safety-is-opt-in]] ·
  [[2026-07-30-a-failure-is-a-value-absence-stays-lenient]] ·
  [[2026-07-30-the-app-must-be-able-to-list-its-own-sessions]] ·
  [[2026-07-23-transcript-parser-pure-renderer-summarises]] ·
  [[2026-07-29-live-tail-is-a-signal-not-a-stream]] ·
  [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] ·
  [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] ·
  [[2026-07-28-sanitizing-replay-markup-is-an-anchor-not-a-strip]] ·
  [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] ·
  [[2026-07-28-choosing-a-folder-is-not-changing-workspace]] ·
  [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] ·
  [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] ·
  [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] ·
  [[2026-07-28-storage-location-is-an-index-not-an-encoding]] ·
  [[2026-07-28-session-metadata-is-the-sdks-job]] ·
  [[2026-07-28-composer-height-is-css-not-state]] ·
  [[2026-07-27-slash-commands-are-a-dumb-pipe]] ·
  [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-in-app-permission-mode-toggle]] ·
  [[2026-07-23-busy-switch-block-not-detach]]
