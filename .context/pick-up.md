---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`. Then read the ADRs listed below **before touching the ticket** — the spec summarises, the ADRs argue. **Three now carry amendments**; read the amendment before citing any of them.

## What the last leg landed

**#69 closed — `add4e5b`.** The Appearance panel has a **Backdrop** control: Acrylic (default and identity) and Mica, as a `role="radiogroup"` of buttons with roving tabindex. `src/shared/backdrop.ts` holds the two-string whitelist and `normalizeBackdrop`, which is the trust boundary main reuses before `win.setBackgroundMaterial`; `backdrop:set` is one-way and `isTrustedIpc`-guarded, registered at all four mock sites plus `preload/index.d.ts`. `useBackdrop.ts` stores the choice in renderer `localStorage` (unversioned `backdrop` key) and pushes it on mount and on change.

**Verified in a real GPU-on window** (`gui-69.mjs`, seen red on `main` first): `setBackgroundMaterial` was called **on the window** with only whitelisted values, the **window id did not change** (applies live, no rebuild), and a **real second process** read the choice back and re-pushed it. `DESIGN.md`'s false neutrals clause was rewritten, not deleted; `PRODUCT.md` untouched; **no neutral moved** (`tokens.css` is not in the diff).

Gate green — typecheck, build, **802 tests across 55 files** (786 → 802). `gui-66` re-run PASS. `gui-51` unchanged.

## Next ticket

**#70 — Four themes: Frost, Ember, Moss, Slate.** Open, `ready-for-agent`, `blocked_by: 0`. **It is the last ticket in spec #64's batch — closing it closes the spec.**

**#71 is not in that chain** and blocks nothing.

## Landmines

Full ledger in [[active-work]]. The ones that will bite #70:

- **`color-mix()` is NOT a new mechanism here, and the six existing sites re-hue for FREE.** [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] argued the fourth accent token partly by calling it one. False — `color-mix(in oklch, var(--mint) N%, transparent)` was already in the stylesheet **six times** (6/12/14/20/22/50%). They read `var(--mint)`, so a `:root[data-theme]` override reaches them for nothing. **Do not tokenise them, do not expect them in the key set (still exactly four accent keys), do not read them as literals #67 missed.**
- **`themes.css` will be the THIRD raw-text CSS reader in the suite.** The other two have already gone red on prose. The theme file will *want* a comment per hue, and a naive `--color-\w+:` regex counts a commented-out declaration happily. **Strip comments before parsing.** #67 and #69 both declined to add a fourth reader; this ticket is where one is actually warranted.
- **`themes.css` imports immediately after `tokens.css` and before `base.css`** — thirteenth import. A theme block landing before the tokens it overrides is the silent restyle the cascade rule exists to prevent.
- **The key-set test must be mutation-verified in BOTH directions** — deleting one declaration reddens it, and a value re-tint must **not**. A key-set test that fires on a re-tint gets retired the first time someone adjusts a hue. Name it for what it pins ("every theme declares the same keys"), never "themes are correct".
- **`--color-mint-ink` follows the hue but keeps its lightness AND its chroma**; neutrals move by **hue angle only** (their chroma is fixed). Only `--color-mint` / `--color-mint-press` may move chroma, within `0.05`–`0.09`.
- **New controls go in `styles/appearance.css`, beside the Backdrop and Zoom rows.** Do **not** widen a shared dock-shell group to fit a theme picker: that repaints the sessions rail and the agents dock silently, with a suite that loads no CSS.
- **The theme picker cannot use `<input>` or `<select>`.** A **dock-wide** pin asserts the Appearance panel renders neither. #69's `BackdropChoices` is the worked shape: a `Record<Value, Copy>` mapped over the whitelist, so a value without copy is a type error and copy without a value renders nowhere — which makes "exactly four options" structural rather than a counted assertion. Copy or extract as suits.
- **A preference that has both a REPORT and an EFFECT can self-heal in the report and stay broken in the effect.** #69's sharpest mutation: an effect-set initial state instead of `useState`'s lazy initialiser leaves every display pin green while the window never hears the stored value. #70's "effect" is the `data-theme` attribute on `documentElement` — same shape. **Pin what crossed the boundary, not what the panel says.**
- **The panel must stay draft-free.** A pin asserts no button in the dock matches `/save|apply|reset|revert/i`. The theme control commits on change like its two siblings.
- **Theme is renderer-only — it fires the IPC rule ZERO times.** #68 and #69 spent both of this batch's new channels.
- **The pref is a four-string whitelist falling back to `frost`.** An unknown stored string sets an attribute matching no block and silently renders the defaults.
- **`@testing-library/jest-dom` is NOT installed** — `toBeDisabled` / `toBeInTheDocument` fail as `Invalid Chai property`. Assert DOM properties directly.
- **No test can say whether Ember looks good.** Say so rather than implying coverage. A driver measures computed values; the aesthetic call needs a real window and a human.
- **A screenshot cannot see the right ~20% of the layout** — every right-hand dock is clipped, re-confirmed by #69's captures. Measure with `getBoundingClientRect`; `gui-66` shows the `setZoom(1)` workaround for a presentational shot.
- **`gui-51` is the ONE expected driver failure** — `model menu gutter 9.4px | .session-groups gutter 9px`, tracked as #71, re-confirmed after #66, #67 and #69. A second failing driver, or a different signature, is a real regression.
- Everything from earlier legs still applies — the `@import` order IS the cascade (**twelve** lines today, thirteen after #70), pins are mutation-verified and never "fixed" by editing an expectation, `src/` is CRLF, and never hardcode a model name.

## Baseline

`main` = `add4e5b` + this leg's `.context` commit. **Pushed.** No open branches. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — **#70, the next and last ticket; #67 delivered its two-literal section and AMENDED its `color-mix()` premise**
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — #69, shipped as argued and amended with the live confirmation
- [[2026-07-31-a-preference-lives-where-it-is-read]] — #69 consumed it; the runtime-settable premise held
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66, the panel #70's control joins
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68, amended with the probe result
- [[2026-07-31-a-driver-establishes-its-premise]] — #65's outcome, and the rule the driver set now follows
- [[2026-07-30-the-import-order-is-the-cascade]] — why `themes.css` imports before `base.css`
