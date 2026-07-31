---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## What the last leg landed

**#71 closed — `b6e8911`. Driver-only: no source and no CSS changed.**

`gui-51.mjs` had been red since `ece7b9c` raised `DEFAULT_ZOOM` from 1.1 to 1.25. Its diagnosis was flagged UNCONFIRMED by the ticket itself, and the measurement settled it: **the gutter is identical on every surface at every zoom** — 10.0css at zoom 1.0, ~9.99 at 1.1, **9.6css / 12dev at 1.25**. The "probe reads 10 but two elements read 9 and 9.4 and disagree" was entirely `offsetWidth - clientWidth`, which rounds *both* operands to whole CSS pixels and so reported one true value as three different numbers. The probe's exact `10` was rounding luck.

9.6 is correct: Chromium lays the bar out in whole **device** pixels (`10css × 1.25 = 12.5 → 12 → 9.6css`), and `10 × 1.1 = 11.0` is integral, which is the only reason the ±0.5 tolerance survived that long. So the driver's expectation moved to device pixels, where it is zoom-free; the CSS was left alone, because chasing the snap would mean varying the authored value per zoom level — the per-context copy #51 deleted. The tolerance was **not** widened; the content box is now measured exactly (a `width:100%` shim's rect), so the budget stays tight at 1 device px.

Verified **zoom-independent, not re-tuned: PASS at 1.0, 1.1, 1.25 and 1.5.** Verified still sharp by mutation: deleting the rule from `base.css` puts every surface at 15dev against an expected 12.5 and fails all three.

Gate green — typecheck, build, **823 tests across 56 files** (unchanged; no source touched).

## Next ticket

**#72 — the session title cannot truncate and overlaps the pills and dock buttons.** `ready-for-agent`, CSS-only, ~6 lines in `styles/titlebar.css`. No JSX, no class name, no aria-label changes.

Filed by an autonomous `/preset vibe` run against the two candidates the last leg listed (Tailwind's fate, the crowded titlebar), with the owner asleep. The full record — every question, which agent answered it, the grepped warrant, and the cross-model verdict — is in **`.claude/vibe.md`**. Read it before touching either topic.

**The run falsified half the premise it was given.** "Each button eating drag region" is measured and **false**: the titlebar's no-drag width is constant at 344.3css, and the widest uninterrupted grab strip is still 182css at the narrowest width tested. The defect it found instead is unrelated to crowding — `.session-title` is an inline span with `nowrap` and no `max-width`/`overflow`/`text-overflow`, inside an out-of-flow `position: absolute` centre. Collision thresholds by page width: 1280css → 111 chars · 1024css → 72 · 819css → 41 · **688css → 21**.

**Four calls are parked for the owner and must NOT be decided by an agent** — Tailwind's fate, which buttons leave, whether the three dock toggles collapse, and #72's centring trade-off. Each is listed in `.claude/vibe.md` under `## Needs you` with the reversible default already taken and the alternative written next to it. #72's Out of Scope section repeats the boundary.

Still true: `.claude/relay-leg.md`'s "Current queue" section is stale by construction, and its own text says never to take a prose sentence there over the tracker. Re-run the frontier query — it is the authority over this section.

## Landmines

Full ledger in [[active-work]]. The ones #71 added:

- **`gui-51` compares in DEVICE pixels now.** `devicePixelRatio` is read live because it folds display scaling and webContents zoom into the one factor the bar is snapped against. Converting it back to a CSS-pixel comparison re-breaks it the next time the default zoom moves.
- **Never measure a gutter with `offsetWidth - clientWidth`.** Both round to whole CSS pixels; that rounding *was* the bug. The exact instrument is a `width:100%` shim whose rect is the content box.
- **The shim's zero-reading guard is load-bearing.** A `<textarea>` renders no element children, so its shim reads 0 and the code falls back to the coarse reading flagged `exact: false`. Remove the guard and `.message-input` reports a several-hundred-pixel gutter the moment it overflows.
- **Do not widen either budget** (1 device px exact, `1 + dpr` coarse). The mutation margin is 2.5×; widening to fit a number is what #65 exists to undo.
- **A green driver at one zoom says nothing about another.** The old tolerance passed by arithmetic accident. Re-run across zoom levels when touching geometry.
- **`getComputedStyle().width` is not a content-width instrument here** — the global `box-sizing: border-box` makes it return the border box. Measured and rejected; do not re-propose it.

Still true from earlier legs: **there is no expected driver failure any more — every driver is green, so any red is a real regression**; the `@import` order IS the cascade (thirteen lines, `tokens` → `themes` → `base` pinned); pins are mutation-verified and never "fixed" by editing an expectation, and **no pin retirement is authorised**; `tests/scrollbar.test.ts` scans every line containing a scrollbar pseudo-element, comments included, and does not strip them; a screenshot cannot see the right ~20% of the layout, so measure with `getBoundingClientRect`; `--disable-gpu` is fine for geometry but flattens acrylic, so leave `gui-69` / `gui-70` on the GPU; `src/` is CRLF; and never hardcode a model name.

## Baseline

`main` = `bbe91ee` + this run's `.context` commit. No open branches, no source or CSS touched by the vibe run — it filed a ticket and amended the record, nothing more. Trust `git log origin/main..main` over any note.

## Added by the vibe run

- **A record correction, in [[active-work]] under "Should Tailwind stay at all?".** The sentence "the theme override is indifferent to whether the defaults come from `@theme` or a plain `:root` block, though a move would have to keep the theme blocks unlayered" is **incomplete**, and a future Tailwind drop would have leaned on it. Unlayered is necessary but not sufficient: once the defaults are *also* unlayered, `:root` and `[data-theme=…]` are both specificity (0,1,0) and **source order alone decides**. It still works — `tests/theme.test.ts` pins the import position — but the guarantee degrades from order-proof to order-dependent, and that pin quietly becomes the whole safety argument. Raised by the cross-model pressure agent, confirmed against the record, written back as an amendment.
- **`.session-title` is the only title-ish element absent from the 13-selector truncation triad** in `styles/shared.css`. Put #72's rule in `titlebar.css` (the file that owns the surface) — do **not** widen the shared group, which repaints the sessions rail and agents dock silently against a suite that loads no CSS.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — **#71, the decision this leg recorded**
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] — #51, the contract #71 interpreted under a scaled renderer
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, and why widening a tolerance is the wrong fix
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — #70, shipped; two amendments
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — #69, shipped as argued
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66, the panel all three controls live in
- [[2026-07-30-the-import-order-is-the-cascade]] — why `themes.css` sits where it does
