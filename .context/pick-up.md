---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`. **#71 names no ADR** — it is a measurement ticket, not a design one, so there is nothing to read before it beyond the ticket body itself, which is unusually specific and should be followed rather than summarised.

## What the last leg landed

**#70 closed — `1769aa4`. Spec #64 is delivered and closed with it.** The Appearance panel gained a **Theme** control: Frost (default), Ember, Moss, Slate, as a `role="listbox"` of buttons with roving tabindex and a swatch per row. `src/shared/theme.ts` holds the four-string whitelist and `normalizeTheme`; `useTheme.ts` reads storage in a lazy `useState` initialiser and applies `data-theme` to `documentElement`. **Theme fires no IPC.** `src/renderer/src/styles/themes.css` (new, 13th import, after `tokens` and before `base`) holds four unlayered 18-key blocks.

**Verified in a real GPU-on window** (`gui-70.mjs`, seen red on `main` first): four distinct swatch paints, all four palettes painting the window differently pairwise, the neutrals moving through the untouched `var(--wash)` alias, **nothing left painting Frost's accent after switching away**, and the choice surviving a real restart. All four were eyeballed by hand — no test says whether a palette looks good.

Gate green — typecheck, build, **823 tests across 56 files** (802 → 823).

## Next ticket

**#71 — `gui-51`'s scrollbar-gutter tolerance is calibrated to the old default zoom.** Open, `ready-for-agent`, `blocked_by: 0`. **It is the only open issue in the tracker.**

The queue after it is dry unless the owner files something. **Do not treat "the batch is done" as "the queue is empty"** — that was the last leg's stated expectation and it was wrong; the frontier query is the authority, and it returns #71.

## Landmines

Full ledger in [[active-work]]. The ones that will bite #71:

- **The ticket's own diagnosis is flagged as UNCONFIRMED, by the ticket.** The probe div reads exactly `10px` while the two zoomed elements read `9` and `9.4` **and disagree with each other**, which zoom alone does not explain. **Run the decisive experiment first** — set `zoom-level-v2` to `1.1` before the rail mounts, re-run `gui-51`, record the result. Failing at both zoom levels means the diagnosis is wrong and the ticket needs re-writing, not patching.
- **Do NOT widen the tolerance until the numbers fit.** That is the exact move #65 existed to undo, and this queue authorises no pin retirement at all.
- **Whatever ships, `gui-51` must still fail if the global scrollbar rule is actually removed.** Mutate `base.css` to check — a driver that passes with the rule deleted is measuring nothing.
- **The real question is a design one:** should the *driver's expectation* be zoom-aware (read the applied zoom and scale `EXPECTED_GUTTER`, or measure device pixels), or should the *CSS* hold a true 10px gutter under zoom? That is what #51's one-global-rule contract means under a scaled renderer, and it is why this was never folded into #65.
- **`#71`'s last acceptance criterion is a documentation edit**: remove the standing-red note from this file and from `active-work.md`'s "Known issues". The note is in both.
- **`gui-51` is the ONE expected driver failure** and its signature has been byte-identical across #65, #66, #67, #69 and #70. A second failing driver, or a different signature, is a real regression and not this ticket.
- **`tests/scrollbar.test.ts` scans every line containing a scrollbar pseudo-element, comments included** — it is one of the three raw-text CSS readers, and the one most likely to be touched by a `base.css` edit. It does **not** strip comments (only `tests/theme.test.ts` does).
- **`--disable-gpu` is fine for `gui-51`** — it measures geometry, not material. Do not "standardise" `gui-69` or `gui-70` onto it, though: that flattens acrylic and photographs neither backdrop.
- **A screenshot cannot see the right ~20% of the layout** — measure with `getBoundingClientRect`, as this ticket already does.
- Everything from earlier legs still applies — the `@import` order IS the cascade (**thirteen** lines now, `tokens` → `themes` → `base` pinned), pins are mutation-verified and never "fixed" by editing an expectation, `src/` is CRLF, and never hardcode a model name.

## Baseline

`main` = `1769aa4` + this leg's `.context` commit. **Pushed.** No open branches. Trust `git log origin/main..main` over any note.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] — **#51, the contract #71 is really asking about**
- [[2026-07-31-a-driver-establishes-its-premise]] — #65's outcome, and why widening a tolerance is the wrong fix
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — #70, shipped; two amendments
- [[2026-07-31-backdrop-offers-mica-not-persistent-acrylic]] — #69, shipped as argued
- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — #66, the panel all three controls live in
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — #68, amended with the probe result
- [[2026-07-30-the-import-order-is-the-cascade]] — why `themes.css` sits where it does
