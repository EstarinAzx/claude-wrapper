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

**None. The queue is empty — `gh issue list --state open` returns `[]`.**

Zero open issues: nothing `ready-for-agent`, nothing stuck `ready-for-human`, nothing blocked, and the old unlabelled umbrella #1 is closed too. **Spec #64 is delivered and closed**, and #71 was the last standalone. The relay chain stopped itself here rather than spawning a leg with no work.

**This is the one claim in this file worth re-checking rather than trusting** — the previous leg's prediction that the queue would be dry was wrong, because #71 was `ready-for-agent` and outside the batch the whole time. Re-run the frontier query; it is the authority over this sentence, exactly as it was over that one.

If the owner brings a new want: `/preset init` → `/hp` MVD → `to-spec` → `to-tickets`, then a fresh `/relay N=1 read and follow .claude/relay-leg.md` chain. **`.claude/relay-leg.md`'s "Current queue" section is now stale by construction** — it still describes #71 as the frontier. Its own text already says never to take a prose sentence there over the tracker.

The live candidates, if a direction is wanted: **Tailwind's fate** (nothing in the app uses a utility class, eight specs on) and **the crowded titlebar** (an impeccable pass, deferred through the whole batch). Both are self-contained. Full list under "Open questions" and "Deferred" in [[active-work]].

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

`main` = `b6e8911` + this leg's `.context` commit. **Pushed.** No open branches. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — **#71, the decision this leg recorded**
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] — #51, the contract #71 interpreted under a scaled renderer
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, and why widening a tolerance is the wrong fix
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — #70, shipped; two amendments
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — #69, shipped as argued
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66, the panel all three controls live in
- [[2026-07-30-the-import-order-is-the-cascade]] — why `themes.css` sits where it does
