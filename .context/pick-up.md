---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`. Then read the ADRs listed below **before touching any ticket** — the spec summarises, the ADRs argue.

## What the last leg landed

**#66 closed — `a7c0470`.** The Appearance dock: a third titlebar toggle opens a right-hand panel titled Appearance, in the same slot as Agents and Commands, gated on an open project. It joins the existing `openDock` union rather than adding a boolean, so mutual exclusion is structural. Fixed width, no resize grip, no persisted width, no Save/Apply/Reset, no dirty state. One control — Zoom as minus / readout / plus, stepping through `nextZoom` verbatim, each stepper disabled at its bound. Gate green — typecheck, build, **786 tests across 54 files** (+16).

**`useZoom` now returns `{ level, step }`.** The level left the mount effect's closure so a readout could exist. The lazy `useState(readStored)` initialiser is the load-bearing part and the mutation to remember: set the initial state from an effect instead and the **entire** `zoom-shortcuts` suite stays green — main is still told the stored level — while the panel reports the default. Only the new readout pins catch it.

**`gui-66`** red-verified against a build without the feature, then green: stepping in shrinks the viewport 880 → 815 CSS px while the readout moves 125% → 135%, stepping out returns both, `Ctrl+=` moves both, and opening Agents leaves exactly one dock mounted.

## Next ticket

**#67 — Tokenise the two duplicate colour literals.** Open, `ready-for-agent`, `blocked_by: 0`. Small, and it is the last thing **#70** waits on.

**#69 (Backdrop: Acrylic or Mica) is now unblocked too** — #66 released it, and it depends on nothing else. Either order works; #67 first keeps #70's path shortest. **#71 is not in that chain.**

## Landmines

Full ledger in [[active-work]]. The ones that will bite #67 and #69:

- **`gui-51` is an EXPECTED driver failure** — `model menu gutter 9.4px | .session-groups gutter 9px`, tracked as #71, re-confirmed byte-identical after #66. It is the *only* one. A second failing driver, or a different signature, is a real regression. Note #71's stated premise is spent: **#66 did not move the default zoom** (still `1.25`); the ticket stands on the pre-existing miscalibration alone.
- **Preferences stay in renderer `localStorage`.** The main-side store rested on a premise that is false — `setBackgroundMaterial` is runtime-settable. See [[2026-07-31-a-preference-lives-where-it-is-read]]. #69 pushes its value over IPC on mount and on change, the pattern `useZoom` already ships.
- **#69 adds the batch's last new IPC channel** (backdrop, one-way). That fires the standing rule: all four mock sites plus `preload/index.d.ts`, plus `isTrustedIpc` and a two-string value whitelist at the boundary. Theme and zoom are renderer-only and fire it zero times.
- **New controls go in `styles/appearance.css`, beside the zoom row** — the panel's control-row file, imported after `rails.css`. Do **not** widen a shared dock-shell group to fit them: that repaints the sessions rail and the agents dock silently, with a suite that loads no CSS.
- **The panel must stay draft-free.** A pin asserts no button in the dock matches `/save|apply|reset|revert/i`. #69's control commits on change like the zoom one.
- **`@testing-library/jest-dom` is NOT installed** — `toBeDisabled` / `toBeInTheDocument` fail as `Invalid Chai property`. Assert DOM properties directly.
- **`themes.css` (#70) will be the THIRD raw-text CSS reader in the suite.** The other two have already gone red on prose. **Strip comments before parsing** — a naive property regex counts a commented-out declaration happily.
- **A screenshot cannot see the right ~20% of the layout.** The window composites `windowWidth` device px while the page lays out `windowWidth` CSS px at zoom 1.25, so any right-hand dock is clipped out of a capture at any window size. Not new, not #66's doing — the Agents dock has always been affected. Measure with `getBoundingClientRect`; `gui-66` shows the workaround (drop the factor to 1 for a presentational-only shot, after every assertion).
- **A resizable sibling's current width is not a baseline.** Both other docks carry a restored inline width. To claim "it joined the shell", compare against the width the shared group *declares*, read out of `document.styleSheets`.
- **A driver screenshot cannot judge the backdrop at all** — `--disable-gpu` flattens acrylic, so Acrylic and Mica look identical to it. Real window or nothing.
- Everything from earlier legs still applies — the `@import` order IS the cascade (now **twelve** lines), pins are mutation-verified and never "fixed" by editing an expectation, `src/` is CRLF while `.context/*.md` is LF, and never hardcode a model name.

## Baseline

`main` = `a7c0470` + this leg's `.context` commit. **Pushed.** No open branches. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — **#66, shipped as argued**
- [[2026-07-31-a-preference-lives-where-it-is-read]] — **#69's storage answer**
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — **#69, the newly unblocked ticket**
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — #70, which #67 unblocks
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68, amended with the probe result
- [[2026-07-31-a-driver-establishes-its-premise]] — #65's outcome, and the rule the driver set now follows
- [[2026-07-30-the-import-order-is-the-cascade]] — why `appearance.css` imports after `rails.css`
