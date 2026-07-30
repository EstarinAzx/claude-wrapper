---
type: decision
project: claude-wrapper
updated: 2026-07-30
tags: [context, decision]
---

# Tailwind here is a token system, not a utility system

**Decision:** `styles.css` is deduplicated **in place** and keeps every semantic class name; Tailwind's role stays exactly what [[2026-07-23-tailwind4-tokens]] set it to — an `@theme` token store — and is now used for that properly rather than nominally. Seven new token families absorb the repeated literals (`--ease-snap` for 37 copies of one cubic-bezier, `--color-tint-1…7` for 31 raw `oklch(0.92 0.01 210 / …)` alphas, `--font-mono` for 7 copies of the Cascadia stack, `--color-well` for the verbatim-data ground, `--color-danger-*` where the error hue actually repeats), and ~20 near-identical rule blocks collapse into shared selector groups (the two rails and their heads/grips/empties/lists, the three row shells and their hovers, six identical focus rings into one, the two pop-up menus, the two status dots, the three verbatim wells, thumbs/chips, the two icon toggles, the two retry buttons, a 14-way truncation triad). Declarations **1159 → 968 (−16.5%)**, compiled bundle **40,082 → 35,262 B (−12%)**, no JSX touched, no test touched.

**Why:** The request was "migrate the CSS to Tailwind — we already have it," and the premise did not survive contact. **Nothing in the app uses a Tailwind utility**: all ~200 `className` values across the renderer are semantic, so eight specs after the 2026-07-23 ADR promised "new/evolving UI uses utilities," that promise has never once been exercised — having Tailwind installed is therefore not an argument for migrating *to* it. Meanwhile a full utility rewrite would delete the app's actual safety net: **~60 distinct class selectors are pinned** across 52 test files (725 tests) and 5 `gui-*.mjs` drivers, and the pin-retirement allowance is **spent**. Third, the clutter was measured before it was treated, and it is **duplication, not syntax** — utilities-in-markup would have fixed the syntax and left the design language with no enforceable home (`DESIGN.md` describes tokens, not utility strings). `@apply` was rejected as worst-of-both: identical line count, duplication untouched, and discouraged by Tailwind's own docs.

**How equivalence was proven:** jsdom loads no CSS, so the 725-test suite is **structurally blind** to every change in this diff and its green means nothing here. Both compiled bundles were parsed with every `var()` resolved and diffed as *effective declarations per selector*: **304 selectors before, 304 after, none added or removed**. The only 14 differences are minifier serialization — `var()` is opaque to the optimizer, so it can no longer reorder the `animation` shorthand (name-last vs name-first, order-independent), unquote multi-word font names (equivalent per spec; Chromium's computed value confirmed identical via `gui-61`), or fold `background-clip` into the `background` shorthand (same origin/clip pair either way). Nine GUI drivers pass. `gui-45` fails, **pre-existing** — rebuilt against the original file it fails identically; it is a stale driver asserting the pre-#47 rule that foreign rows are disabled.

**Constraints kept:** Two selectors must stay **ungrouped** and two blocks must stay structurally intact — see the landmines in [[active-work]]. Computed values are unchanged everywhere, including the two accidental drifts preserved on purpose (tint steps 1 and 2 differ by 0.01 alpha for no recorded reason — rows took one, icon buttons the other) and one latent bug left **unfixed and flagged** rather than smuggled into a refactor: `.command-row-btn` is the only row button without `font: inherit`, and adding it would repaint `.command-row-desc` from the UA button font to `--font`.

**Reversibility:** Easy, and the direction of travel is now explicit. If utilities are ever genuinely wanted, this refactor **helps** rather than blocks: the tokens it added are real `@theme` entries, so `ease-snap`, `font-mono`, `bg-well` and `bg-tint-3` all generate today. The open question the ADR left — whether Tailwind should be a utility system here at all, or whether two unused deps should simply go — is still open and is now the honest one to ask.

## Related

- [[decisions]]
- [[2026-07-23-tailwind4-tokens]] — the ADR this sharpens; its "new UI uses utilities" intent never materialised
- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] — the global rule this refactor had to route around
- [[2026-07-22-glassy-acrylic-visual]] · [[active-work]]
