---
type: active-work
project: claude-wrapper
updated: 2026-07-31
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-31 by Opus 5 (1M) (auto) — **`/preset vibe init` on "improve the wrapper and make it production ready": queue refilled with #73 + #74**_
_At commit: `56b11b4` on `main`, pushed. Gate measured green before filing: typecheck clean, **823 tests green across 56 files**_
_Driver check: no standing red anywhere in the set — every driver is green, so any red is a real regression._

## Current focus

**Two tickets open, both `ready-for-agent`, no blocking edge between them.** A relay
chain is draining them.

- **#73 — recovering from a terminal stream death discards the conversation.**
  `chooseWorkspace` passes `resumeId: null`, so the recovery the app's own error copy
  instructs starts a fresh SDK session and empties the pane — the exact consequence
  [[2026-07-23-engine-terminal-on-stream-death]] cited when it rejected auto-restart.
  The fix stays user-initiated, so the ADR is not reversed, and that ADR pre-costs it
  under Reversibility. **AC1 is blocking:** prove a session is resumable after an
  *abnormal* stream death before building on it.
- **#74 — run the renderer sandboxed.** `sandbox: false` buys nothing: the built
  preload requires only `electron`. No ADR ever argued the flag. The work is proving
  nothing broke, and it needs a driver because vitest cannot observe `sandbox`.

**Three hypotheses were probed and killed** rather than filed — see [[pick-up]]'s
landmines: main-process crash handlers (unhandled rejections are non-fatal on
Electron 43), silent `catch` swallows (all deliberate and commented), and
`void watchSession` (already guarded). A window-bounds ticket was killed by
[[2026-07-31-a-preference-lives-where-it-is-read]], which forbids a main-side store
in those words.

**Previously:** #72 landed as `9fecc10` and closed; spec #64 is delivered and closed;
#71 and #72 closed standalone after it.

**#72 — the session title truncates instead of overlapping.** CSS only, six declarations, no JSX / class name / aria-label. `.titlebar-center` went from `position: absolute; left: 50%; translateX(-50%)` to `flex: 1; min-width: 0; display: flex; justify-content: center` (keeping `pointer-events: none`), and `.session-title` gained `overflow: hidden; text-overflow: ellipsis; min-width: 0`. See [[2026-07-31-the-titlebar-centre-is-a-flex-item-not-an-overlay]].

Measured before and after with `getBoundingClientRect` against a real 60-character workspace folder, at the four widths in the ticket:

| content px | page css | before | after | slot after |
|---|---|---|---|---|
| 1600 | 1280 | 456.5..823.5 | 478.5..845.5 | 275..1049 |
| 1280 | 1024 | 328.5..695.5 | 350.5..717.5 | 275..793 |
| 1024 | 819 | **226.1..593.1** (neighbours at 275 / 588.2) | 275..588.2 | 275..588.2 |
| 860 | 688 | **160.5..527.5** (neighbours at 275 / 457) | 275..457 | 275..457 |

Before, the title was a **constant 366.9css wide at every window width**. After, it shrinks to the slot and ellipsises (`client 313 / scroll 367` at 819css; `client 182 / scroll 367` at 688css) while a 60-char name still renders whole at 1280css and 1024css.

**The vibe run that filed it also falsified half the complaint it was handed, and that half stays false:** "each button eating drag region" is measured wrong — the titlebar's no-drag width is constant at 344.3css and does not grow with content; the draggable share falls 73.1% → 50% only because the window shrinks around it, and the widest uninterrupted grab strip is still 182css at the narrowest width tested. See `.claude/vibe.md` for the full record and the four calls parked for the owner.

The owner asked for four things — a delete-sessions button, a settings surface ("you decide what to put there"), a persistent-acrylic toggle, and colour themes. All four shipped, one ticket per relay leg, plus the two driver-hygiene tickets that bracketed the batch:

| # | Ticket | Commit |
|---|---|---|
| ~~#65~~ | ~~Retire the stale `gui-45` driver~~ | `f0dfc68` |
| ~~#68~~ | ~~Delete a session from the rail~~ | `70c904f` |
| ~~#66~~ | ~~Appearance dock with the zoom control~~ | `a7c0470` |
| ~~#67~~ | ~~Tokenise the two duplicate colour literals~~ | `e16ace6` |
| ~~#69~~ | ~~Backdrop control: Acrylic or Mica~~ | `add4e5b` |
| ~~#70~~ | ~~Four themes: Frost, Ember, Moss, Slate~~ | `1769aa4` |
| ~~#71~~ | ~~`gui-51`'s gutter tolerance vs. the default zoom~~ | `b6e8911` |

**Four of the batch's five ADRs carry an amendment written after a probe measured their stated premise** — two because it was false (#68's Windows handle, #70's `color-mix()`), two because it held and is now measured rather than cited (#69's runtime-settable `setBackgroundMaterial`, #70's unlayered-beats-layered override). Read an ADR's amendment before citing it.

## State

- **In flight:** a relay chain draining #73 and #74. No open branches yet. `main` = `56b11b4` + this run's `.context` commit.
- **Queue (`ready-for-agent`):** **#73** and **#74**. No blocking edge — either order works.
- **Parked for the owner (7, all reversible):** Tailwind's fate · which titlebar buttons leave · whether the three dock toggles collapse · #72's centring trade-off · **whether the window should remember its geometry** · **which daily-driver polish item comes next** · **whether a renderer error boundary is wanted**. Full entries with the default taken and the alternative in `.claude/vibe.md` under `## Needs you`. **A leg may not decide any of them.**
- **Landed this run:** no code. Two tickets filed after four hypotheses were probed against the real tree and three were killed.
- **Blocked:** nothing.

## Pick up here

**There is no frontier ticket.** The queue is dry, so the next relay leg finds nothing to pick and self-closes; that is the designed end of the chain, not a failure.

**Do not decide the four parked calls in `.claude/vibe.md`.** They are the owner's. Three are untouched; the fourth (#72's centring) now has its default *shipped and measurable* — open the app, look at the title, and it is either fine or it is a two-line revert to absolute centring plus the magic number.

If the owner brings a new want, the route is `/preset init` → `/hp` MVD → `to-spec` → `to-tickets`, then a fresh `/relay N=1 read and follow .claude/relay-leg.md` chain over the resulting batch. `.claude/relay-leg.md`'s "Current queue" section is stale by construction and its own text says to trust the frontier query over it.

The **Open questions** below are the live candidates if the owner wants a direction picked for them — **Tailwind's fate is now the longest-waiting one, and it is unblocked**: #72 was the last natural test of the utilities premise and it shipped without a single utility class.

Conventions unchanged: one ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green before merge, `.context/` commits on main only.

## Open questions

- **Should the rail filter out `sdk-cli` sessions?** The listing fix admits **112** rows to surface the **37** this app wrote; the other 75 are headless automation, ~20 of them this repo's own GUI drivers titled "say OK" / "reply with exactly: PONG". Accepted deliberately, but it is worst exactly where the owner looks first. The blocker is that `SDKSessionInfo` exposes no `entrypoint` / `origin` / `sessionKind` — the deciding field is read from disk and discarded — so filtering means either re-opening ~680 JSONLs (the scan the SDK reader exists to avoid) or `tagSession` on every session this app creates, which is prospective only and would not reach the 37 already written. **#68 was explicitly NOT the answer to this**, and shipped saying so.
- **Should Tailwind stay at all?** Nothing in the app uses a utility class — eight specs after [[2026-07-23-tailwind4-tokens]] promised "new/evolving UI uses utilities," it has never happened. Either adopt utilities deliberately for new UI, or drop two devDependencies and the vite plugin and inline `@theme` into `:root`. **#70 deliberately did not bundle this, and nothing now blocks it** — the theme override is indifferent to whether the defaults come from `@theme` or a plain `:root` block, though a move would have to keep the theme blocks unlayered or they stop winning. **Amended 2026-07-31 (vibe run, cross-model pressure): "keep them unlayered" is necessary but NOT sufficient, and the sentence above understates what a drop changes.** Today the defaults compile into `@layer theme` while the `[data-theme=…]` blocks are unlayered, so unlayered-beats-layered makes the override win *regardless of import order*. Drop Tailwind and the defaults become a plain `:root` block — at which point `:root` and `[data-theme="ember"]` are **both unlayered and both specificity (0,1,0)**, so source order becomes the only thing deciding, and the guarantee degrades from order-proof to order-dependent. It still works, because `tests/theme.test.ts` already pins the import position (it reddens on a moved import) — but that pin stops being a tidiness check and silently becomes the whole safety argument. Whoever does the drop must know that before they do it.
- **The titlebar is crowded** — app name + session title + two pills + **three** dock buttons + window controls. **Amended 2026-07-31 (vibe run + #72): the "each button eating drag region" clause is measured and FALSE** (no-drag width constant at 344.3css; widest grab strip still 182css at 688css), and the one *measured* defect in the surface — the title overlapping its neighbours — shipped as #72. What remains is an aesthetic question about control count, which is the owner's, and #72 made it cheaper: the centring no longer depends on a number equal to the wider block, so adding or removing a control costs nothing in CSS.
- **Partly answered by #70, and worth a look if a fourth control lands.** The theme picker reused `.appearance-field--stacked` and `.appearance-choice` with one `--theme` modifier (row instead of column, name + swatch), and the two arrow-key handlers were folded into a shared `nextInRing` helper. What did **not** converge is the ARIA role — Backdrop is a radiogroup and Theme a listbox, forced apart by #69's pin, so a single `<PickOne>` component would have to take the role as a prop. Not worth it for two call sites.
- **Should `rails.css:325` read `var(--mint)` like every other component site?** It reads `var(--color-mint)` — the one long-name reference in component CSS. Themes correctly either way; a naming inconsistency, not a bug.
- One deferred owner decision from #58's Out of Scope: whether an honest Write diff is wanted at permission time only, or also after an auto-run and in replay. Still open.

## Recent context

- **`overflow` and `text-overflow` are inert on an inline box, and #72 is the case where that was the whole bug.** `.session-title` had `white-space: nowrap` and nothing to clip with, so it could not truncate *even in principle* — the driver read `display inline · overflow-x visible · text-overflow clip · clientWidth 0` on the unfixed tree. The fix authors no `display` on the span at all: making the parent a flex container **blockifies** the child, which is what switches those properties on. Worth carrying because the natural "tidy-up" — putting the truncation on the span and leaving the parent alone — looks equivalent and does nothing.
- **A box whose measured width does not change with the window is not shrinking for anything.** `.titlebar-center` was `position: absolute`, so the title's rect was a constant **366.9css** at 1280 / 1024 / 819 / 688css pages while its neighbours marched inward until they crossed it. That constant is a cheap tell for an out-of-flow box, and it is more legible in a driver's output than any collision assertion.
- **Containment by construction beat containment by arithmetic.** The rejected fix (keep absolute centring, add `max-width: calc(100% - 2 * <side>)`) is correct today and depends on a number equal to the wider titlebar block — which changes the moment anyone answers the parked "which buttons leave" question. A flex item cannot reach its siblings, so there is no number to rot. See [[2026-07-31-the-titlebar-centre-is-a-flex-item-not-an-overlay]].
- **A rect assertion cannot see ink, and #72's mutation test is what proved it matters.** Deleting `overflow: hidden` leaves every geometry assertion green — the flex box is still the right size — while the text paints straight out of it and back over the buttons. Only the computed-style assertions (`overflow-x`, `text-overflow`) reddened. **When the defect is what gets painted, at least one assertion must read computed style rather than geometry.**
- **When two instruments disagree, suspect the instrument before the app — #71 is the worked example.** The ticket filed itself as UNCONFIRMED because a probe div read exactly `10` while `.model-menu` read `9.4` and `.session-groups` read `9`, three numbers zoom alone could not explain. Measured with un-rounded geometry, **the gutter is identical on every surface at every zoom**; the spread was `offsetWidth - clientWidth` rounding *both* operands to whole CSS pixels, so one value surfaced as three depending on where each box sat. The probe's exact `10` was rounding luck, not evidence the rule applied differently there. **The disagreement between instruments was the finding.**
- **An authored pixel and a laid-out pixel are different units, and a driver must assert in the second.** Chromium lays the scrollbar out in whole **device** pixels: `10css × 1.25 = 12.5 → 12 → 9.6css`. So `9.6` was never a defect, and no CSS could have "fixed" it — chasing it would mean varying the authored value per zoom level, i.e. re-creating the per-context copies #51 deleted. See [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]].
- **Removing the rounding beat tolerating it.** Relaxing ±0.5 to ±1.5css would have made the numbers fit without explaining them. Measuring the content box exactly instead kept the budget tight at 1 device px — and the tight budget is what still catches the real defect with 2.5× margin.
- **The rejected instrument is worth recording so it is not re-proposed:** `getComputedStyle(el).width` looks like a no-mutation way to read a fractional content width, and it is not — under this app's global `box-sizing: border-box` it returns the **border-box** width, so the derived gutter came out `0` / `-9.6` / `-12`. Measured, not assumed.
- **The obvious pin for a self-healing preference can ITSELF self-heal, and #70 is the case that proves it.** #69's lesson was "pin what crossed the boundary, not what the panel says". #70's boundary is `data-theme` on `documentElement` — and that pin **greens under the exact mutation it exists to catch**, because the attribute is *reactive*: an effect-set initial state paints Frost and settles on the stored palette a render later, so every after-the-fact assertion passes. Verified: swapping the lazy initialiser left all 36 assertions green. What separates the two is the **first value written**, so the pin watches that, via a `MutationObserver` recording `oldValue` **per record**. Reading the attribute inside the callback fails too — several writes coalesce into one callback and the settled value is all you see. **Generalise as: when the effect is idempotent and reactive, only its HISTORY distinguishes right from late.**
- **A pin written for one control can force the next one onto a different ARIA role.** #66's dock-wide "no input, no select" already constrained #69 into a radiogroup of buttons. #69's own pin — "every radio in this panel is a backdrop" — then constrained #70 out of `role="radio"` entirely: a second radiogroup would have reddened two #69 assertions. The theme picker shipped as a **listbox**, which means the same thing for single-select and leaves both pins meaning what they said. **Read the neighbouring pins before choosing a role, not after.**
- **A custom-property alias resolves ONCE, where it is declared.** `--mint: var(--color-mint)` is computed at `:root`; descendants inherit the *result*. So a nested element wearing `data-theme` re-resolves `var(--color-mint)` but **not** `var(--mint)`. Measured with four nested probes: the alias painted Frost's mint under all four palettes while the token painted four distinct accents. The whole-window re-hue is unaffected (the attribute is on `documentElement`, which *is* `:root`), but anything nested that wants a *different* palette must read the long name.
- **A self-previewing control removes a whole class of drift.** The four theme swatches carry `data-theme` and read `var(--color-mint)`, so `themes.css` paints them — no palette colour is repeated in `appearance.css`, and there is nothing to fall out of sync when a hue is tuned. The failure mode it replaces is silent: hardcoded swatches keep rendering, just wrong.
- **"Nothing is left behind" is a measurable claim, and it is the strongest one a theme feature can make.** `gui-70` records Frost's accent and its 10% wash, switches palette, then scans every element's computed `color` / `background` / `border` / `fill` for either — excluding elements that deliberately opted into another palette. That single check subsumes "did you miss a literal", "did an alias fail to follow" and "did a `color-mix` site resolve stale".
- **A structural test earns its keep by what it does NOT fire on.** `theme.test.ts` reddens on a deleted declaration, a moved lightness, a moved neutral chroma, an out-of-band accent chroma, a hue collision, a typo'd key and a moved import — and stays green on a re-tint, which is the condition that stops it being retired the first time someone adjusts a hue. It also stays red when the deleted declaration is left behind **inside a comment**, which is the comment-stripping requirement verified rather than asserted.
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

**From #72 — true of the titlebar:**

- **`.titlebar-center` must stay IN FLOW, and `.session-title`'s truncation only works because of it.** The span's `display` is never authored — it is blockified by being a flex item, and that is what makes `overflow` / `text-overflow` apply. "Simplifying" the slot back to a plain block, or to absolute centring, silently restores the overlap with nothing red.
- **`pointer-events: none` on `.titlebar-center` is load-bearing, not decoration.** Now that the slot spans the middle of the titlebar in flow, dropping it hands a wide strip of the drag region to a non-interactive `<div>`.
- **The title is off true centre by design (~15css today).** It centres in the space available, bounded by `|left − right|`. Do not "fix" it by re-adding absolute positioning — that is the trade the ticket recorded and the owner's call to reverse.
- **`.session-title` is still NOT in `shared.css`'s truncation triad, deliberately.** Its rule lives in `titlebar.css`. Widening the shared group instead repaints the sessions rail and the agents dock, invisibly to a suite that loads no CSS.
- **`gui-72` measures against a real 60-character workspace folder** — a temp dir handed to the stubbed `showOpenDialog`, so the title comes from app state, not injected text. It fails loudly (`NOT DRIVEN, not a pass`) if the workspace never switched, because every geometry assertion would otherwise pass on the string "New session". Its temp-dir cleanup runs **after** `app.close()` and is best-effort: the engine holds the fixture as its cwd, so an EBUSY there is ordinary and must never decide the verdict.

**From #71 — true of `gui-51` and of any driver that measures geometry:**

- **`gui-51` compares in DEVICE pixels, and converting it back to CSS pixels re-breaks it.** The expectation is `10 × devicePixelRatio` within 1 device px. `devicePixelRatio` is read **live** because it already folds display scaling and webContents zoom into the one factor the bar is snapped against — hardcoding it, or comparing the CSS-pixel reading, pins a number that legitimately moves with the zoom preference.
- **Never measure a gutter with `offsetWidth - clientWidth` again.** Both round to whole CSS pixels, so one true value reads as several different numbers depending on where each element's box sits — that is the entire #71 defect. The exact instrument is a `width:100%` shim whose rect **is** the content box.
- **The shim's zero-reading guard is load-bearing, not defensive noise.** A `<textarea>` renders no element children, so its shim reads 0; the guard detects that and falls back to the coarse reading flagged `exact: false`, which is then given back the whole CSS pixel of rounding it carries. Delete the guard and `.message-input` reports a gutter of several hundred pixels the moment it overflows.
- **Do not widen either budget (1 device px exact / `1 + dpr` coarse).** Measured headroom: deleting the global rule from `base.css` puts every surface at 15dev against an expected 12.5, so the exact budget has 2.5× margin. Widening to fit a number is the move #65 exists to undo.
- **A tolerance can be passing by arithmetic accident.** The old ±0.5 survived only because `10 × 1.1 = 11.0` is integral; `10 × 1.25 = 12.5` is not, and the bar snapped to 12. **A green driver at one zoom says nothing about another** — #71 was re-verified at 1.0, 1.1, 1.25 and 1.5.

**From #70 — now true of the theme path in code:**

- **`useTheme`'s lazy `useState(readStored)` initialiser is load-bearing, and the OBVIOUS pin does not catch breaking it.** Only `tests/appearance-dock.test.tsx`'s MutationObserver pin ("the default is never applied first") dies; every attribute assertion self-heals. Do not simplify that test into a plain `getAttribute` check, and do not read the attribute inside the observer callback — writes coalesce.
- **The theme picker is a LISTBOX, not a radiogroup, and it has to be.** #69's pin reads every `role="radio"` in the Appearance panel as a backdrop (`r.dataset.backdrop`), so a second radiogroup in that panel reddens it. Any future pick-one control in this panel faces the same constraint, on top of #66's dock-wide "no `input`, no `select`".
- **`themes.css` blocks are selected as `[data-theme=…]`, deliberately without `:root`.** The bare form also matches nested elements, which is what lets the four swatches preview themselves. Adding `:root` back silently kills the preview — four identical swatches, nothing red.
- **A nested `data-theme` opt-in must read `var(--color-mint)`, never `var(--mint)`.** The short alias resolved once at `:root`. `.appearance-swatch` is the one rule in the app that depends on this; "tidying" it onto the alias is a silent regression.
- **Frost is authored as a block even though its values equal the defaults.** It is the structural reference the key-set and lightness pins compare against. Deleting it as redundant guts three tests.
- **The theme file's rules are pinned STRUCTURALLY — do not hand-tune a value past them.** Lightness and alpha are fixed on every key, neutral chroma is fixed, accent chroma lives in `0.05`–`0.09`, and the four hues must stay distinct. `tests/theme.test.ts` strips comments first, so prose in `themes.css` is safe (unlike the other two raw-text readers).
- **`data-theme` outlives `cleanup()` in jsdom.** `tests/appearance-dock.test.tsx` removes it in `beforeEach`; a new test file touching themes needs the same line or it inherits the previous file's palette.

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

**From #64's design pass — all spent in code now, and true of it:**

- **`tests/theme.test.ts` IS the third raw-text CSS reader**, joining `tests/scrollbar.test.ts` and `tests/multiline-composer.test.tsx`. It is the only one of the three that strips comments before parsing — verified by deleting a declaration and leaving it behind commented out, which still reddens.
- **`themes.css` imports immediately after `tokens.css` and before `base.css`** — thirteenth import, and the position is pinned. A theme block landing before the tokens it overrides is the silent restyle the cascade rule exists to prevent; a `themes.css` that is never imported at all leaves every disk-reading pin green while the feature does nothing.
- **`--color-mint-ink` follows the hue but keeps its lightness AND its chroma**; neutrals move by hue angle only. Only `--color-mint`, `--color-mint-press` and `--color-mint-wash` may move chroma, within `0.05`–`0.09`.
- **No test can say whether a theme looks good**, and a driver screenshot cannot judge the backdrop at all. Real window or nothing. All four palettes were eyeballed by hand at `1769aa4`.
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
- **The `@import` order in `styles.css` IS the cascade, and breaking it is silent.** `tokens` → `themes` → `base` → `shared` must stay first, **thirteen** lines today. The first three are pinned by `tests/theme.test.ts`; the rest are not.
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

- **There is no expected driver failure any more.** `gui-51`'s standing red closed as #71 (`b6e8911`), and `gui-72` joined the set green at `9fecc10`; **every driver in the set is green, and any red is now a real regression.** The old note said "a second signature is a real regression" — that qualifier is gone, and so is the cover it gave.
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

**Newly noted by #70:** whether a fifth palette is ever wanted (the whitelist, the `Record<Theme, string>` copy map and the key-set test all make it a three-line change, deliberately); and whether `--color-mint*` should be renamed now that mint is one palette of four rather than the only one — cosmetic, and a rename touches every component site.

**Noted by #67, now with a caveat:** renaming `rails.css:325`'s `var(--color-mint)` to the short alias every other component site uses. Still cosmetic **at that site** (it is not nested under a `data-theme` opt-in) — but #70 established that the long name and the alias are **not** interchangeable inside one, so this is no longer a pure find-and-replace class of change.

**Carried, still unspec'd:** filter or de-noise the `sdk-cli` rows (**#68 is explicitly not the answer**); revisit the scope-chip control for contrast; give `.command-row-btn` its `font: inherit`; decide whether tint steps 1 and 2 should collapse; decide Tailwind's fate.

**Deferred by #58, with reasons on record:** honest whole-file **Write diff**; **per-tool rich card bodies**; **permission-mode default or persistence**; **adopting the SDK's richer permission metadata**; a **wrapper-owned truncation cap**; a **diff dependency**; **syntax highlighting inside diffs**.

**Found by the brainstorm pair, unspec'd:** stream **extended thinking** as a collapsed strip; **native turn-end notifications + taskbar flash**; **type-while-busy composer** then queued send; **one-click restart on `terminalError`**; **turn pulse** from the dropped telemetry; **MCP + settings-parse health** surfacing.

**Carried, unchanged:** live-tail's **incremental byte tailing** and the **watch-installed-after-the-read gap**; context-pressure meter; typed failed-turn recovery; full-text transcript search; **session rename / archive**; drag-and-drop; replay thumbnails; N-concurrent engines; **fork-on-resume**; busy-switch detach (decided against); folding `Welcome`'s last `pickFolder` caller onto the chooser; agent archive / control / map pan-zoom; and the smaller leftovers from #31–#36.

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-31-the-titlebar-centre-is-a-flex-item-not-an-overlay]] — **#72, shipped; why containment is structural and what the ~15css off-centre trade buys**
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — **#71, shipped; why the instrument moved to device pixels and the CSS did not move at all**
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — **#70, shipped; carries TWO amendments — #67's `color-mix()` correction and #70's own mechanism confirmation plus the alias limit**
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
