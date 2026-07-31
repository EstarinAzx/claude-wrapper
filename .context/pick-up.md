---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`. Then read the ADRs listed below **before touching any ticket** — the spec summarises, the ADRs argue. **Two of them now carry amendments**; read the amendment before citing either.

## What the last leg landed

**#67 closed — `e16ace6`.** The two duplicate colour literals are tokenised. `--color-mint-wash` (`oklch(0.87 0.07 180 / 0.1)`) joins the three existing accent tokens with a `--mint-wash` short alias; `rails.css:324` (active session row) references it, and `titlebar.css:209` (`.win-btn-close:hover`) now references `--text`. Colour literals outside `tokens.css`: **18 → 16**. The accent is now the **four-token set #70 defines against**.

**Zero visual change, proven at the compiled-bundle level** as the acceptance criteria required: every `var()` resolved before and after, effective declarations diffed per selector — 305 rules and 301 distinct selectors both sides, 1024 painting declarations both sides, and the whole difference is the two new custom-property *definitions*, each resolving to the literal it replaced. The checker was **mutation-verified in both directions** (re-hue the token → red at the call site; delete the titlebar declaration → red) so its PASS is not a diff that silently matched nothing.

Gate green — typecheck, build, **786 tests across 54 files** (unchanged; this ticket adds no tests, deliberately — see the ticket comment for why a fourth raw-text CSS reader was not the right thing to add here).

## Next ticket

**#69 — Backdrop control: Acrylic or Mica.** Open, `ready-for-agent`, `blocked_by: 0`. It is the older of the two remaining and the batch ordering has always been #67 → #69 → #70.

**#70 (Four themes) is unblocked too** — #67 released it, and it depends on nothing else. Either order works now. **#71 is not in that chain.**

## Landmines

Full ledger in [[active-work]]. The ones that will bite #69 and #70:

- **#67 amended an ADR: `color-mix()` is NOT a new mechanism here.** [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] argued the fourth token partly by calling it one. False — `color-mix(in oklch, var(--mint) N%, transparent)` was already in the stylesheet **six times** (6/12/14/20/22/50%), one of them 256 lines above the literal in question. **The good news is for #70: those six re-hue for free** through `var(--mint)`. Do not tokenise them, do not expect them in the key set (still exactly **four** accent keys), and do not read them as literals #67 missed. The token still shipped and still stands — as an authored per-theme override point the key-set test can pin.
- **`gui-51` is an EXPECTED driver failure** — `model menu gutter 9.4px | .session-groups gutter 9px`, tracked as #71, re-confirmed byte-identical after #66 and untouchable by #67 (a proven-byte-identical dedup). It is the *only* one. A second failing driver, or a different signature, is a real regression. #71's stated premise is spent: **#66 did not move the default zoom** (still `1.25`); the ticket stands on the pre-existing miscalibration alone.
- **Preferences stay in renderer `localStorage`.** The main-side store rested on a premise that is false — `setBackgroundMaterial` is runtime-settable. See [[2026-07-31-a-preference-lives-where-it-is-read]]. #69 pushes its value over IPC on mount and on change, the pattern `useZoom` already ships. **Do not re-derive this mid-leg.**
- **#69 adds the batch's last new IPC channel** (backdrop, one-way). That fires the standing rule: all four mock sites plus `preload/index.d.ts`, plus `isTrustedIpc` and a two-string value whitelist at the boundary. Theme and zoom are renderer-only and fire it zero times.
- **New controls go in `styles/appearance.css`, beside the zoom row** — the panel's control-row file, imported after `rails.css`. Do **not** widen a shared dock-shell group to fit them: that repaints the sessions rail and the agents dock silently, with a suite that loads no CSS.
- **`themes.css` (#70) imports immediately after `tokens.css` and before `base.css`** — thirteenth import. A theme block landing before the tokens it overrides is the silent restyle the cascade rule exists to prevent.
- **`themes.css` will be the THIRD raw-text CSS reader in the suite.** The other two have already gone red on prose. **Strip comments before parsing** — a naive property regex counts a commented-out declaration happily. #67 deliberately did not add a fourth.
- **The panel must stay draft-free.** A pin asserts no button in the dock matches `/save|apply|reset|revert/i`. #69's control commits on change like the zoom one.
- **`@testing-library/jest-dom` is NOT installed** — `toBeDisabled` / `toBeInTheDocument` fail as `Invalid Chai property`. Assert DOM properties directly.
- **A driver screenshot cannot judge the backdrop at all** — `--disable-gpu` flattens acrylic, so Acrylic and Mica look identical to it. Real window or nothing. Same for whether a theme looks good.
- **A screenshot cannot see the right ~20% of the layout.** The window composites `windowWidth` device px while the page lays out `windowWidth` CSS px at zoom 1.25, so any right-hand dock is clipped out of a capture at any window size. Measure with `getBoundingClientRect`; `gui-66` shows the workaround.
- **A resizable sibling's current width is not a baseline.** Both other docks carry a restored inline width. Compare against the width the shared group *declares*, read out of `document.styleSheets`.
- **Proving a CSS-only change moved nothing means resolving `var()` and diffing per selector — then mutating the checker.** The bundle is not comparable by byte count or by plain `diff`; the minifier reorders declarations within a rule. Separate custom-property definitions from painting declarations, since adding a token legitimately adds definitions while moving no painted value. Worked twice now (#67 and the stylesheet refactor).
- Everything from earlier legs still applies — the `@import` order IS the cascade (**twelve** lines today, thirteen after #70), pins are mutation-verified and never "fixed" by editing an expectation, `src/` is CRLF while `.context/*.md` is LF, and never hardcode a model name.

## Baseline

`main` = `e16ace6` + this leg's `.context` commit. **Pushed.** No open branches. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — **#69, the next ticket**
- [[2026-07-31-a-preference-lives-where-it-is-read]] — **#69's storage answer**
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — **#70; #67 delivered its two-literal section and AMENDED its `color-mix()` premise**
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66, shipped as argued
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68, amended with the probe result
- [[2026-07-31-a-driver-establishes-its-premise]] — #65's outcome, and the rule the driver set now follows
- [[2026-07-30-the-import-order-is-the-cascade]] — why `appearance.css` imports after `rails.css` and `themes.css` before `base.css`
