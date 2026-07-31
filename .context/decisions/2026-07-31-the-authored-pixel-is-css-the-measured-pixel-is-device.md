---
type: decision
project: claude-wrapper
date: 2026-07-31
updated: 2026-07-31
tags: [context, decision]
---

# The authored pixel is CSS, the measured pixel is device

**Decision:** #71 changes the **instrument**, not the CSS. `base.css` keeps one
global `::-webkit-scrollbar { width: 10px }` exactly as [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]]
settled it. `gui-51.mjs` stops asserting a CSS-pixel value and asserts a
**device-pixel** one: `gutter × devicePixelRatio` within 1 device px of
`10 × devicePixelRatio`.

**The measurement that decided it.** #71 shipped with its own diagnosis flagged
UNCONFIRMED, because the driver's probe div read exactly `10px` while
`.model-menu` read `9.4` and `.session-groups` read `9` — three numbers that
zoom alone does not explain, and that disagree with each other. Measured at
three zoom levels with un-rounded geometry:

| zoom | dpr | true gutter | old instrument reported |
|---|---|---|---|
| 1.0 | 1 | 10.0css / 10dev | 10 · 10 · 10 |
| 1.1 | 1.1 | ~9.99css / ~11dev | 10 · 10.18 · 10 |
| 1.25 | 1.25 | **9.6css / 12dev** | 10 · 9.4 · 9 |

The gutter is **the same on every surface at every zoom**. The disagreement was
never in the app — it was `offsetWidth - clientWidth`, both of which round to
whole CSS pixels, reporting one true value as three different numbers depending
on where each element's box happened to sit. The probe div's "exactly 10" was
rounding luck, not evidence the rule differed there.

**Why 9.6 is correct and not a defect.** Chromium lays the bar out in whole
DEVICE pixels. `10css × 1.25 = 12.5 → 12 device px → 9.6css`. At zoom 1.1,
`10 × 1.1 = 11.0` is already integral, so it stayed exactly 10 — which is
precisely why the ±0.5px tolerance survived until `ece7b9c` raised
`DEFAULT_ZOOM` from 1.1 to 1.25.

**Why the CSS was not touched.** The alternative #71 named was making the CSS
hold a true 10 CSS px gutter under zoom. It cannot: the snap is Chromium's, and
chasing it would mean varying the authored value per zoom level — a per-context
copy of the rule, which is the exact defect #51 deleted. **The authored value is
a design decision and belongs in CSS pixels; the physical bar is laid out in
device pixels, and only there is the expectation zoom-free.** A driver that
pins the derived CSS-pixel reading is pinning a number that legitimately moves.

**Why the tolerance was not simply widened.** Absorbing this by relaxing ±0.5
to ±1.5css would have made the numbers fit without explaining them — the move
[[2026-07-31-a-driver-establishes-its-premise]] exists to undo. Measuring the
content box exactly (a `width:100%` shim's rect, which is what `clientWidth`
rounds away) removes the rounding entirely, so the budget could stay tight at 1
device px rather than growing to hide it.

**The instrument keeps its teeth, verified by mutation.** Deleting the global
rule from `base.css` and rebuilding puts every surface at 15dev against an
expected 12.5 — 2.5× past the budget — and the driver fails on all three. A
`<textarea>` renders no element children, so its shim reads 0; that is detected
and falls back to the coarse reading, flagged `exact: false` and given back the
whole CSS pixel of rounding it carries.

**Verified zoom-independent, not re-tuned:** PASS at 1.0, 1.1, 1.25 and 1.5.

## Related

- [[2026-07-28-a-scrollbar-belongs-to-the-surface-not-the-component]] — #51, the contract this interprets under a scaled renderer
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, why a tolerance is never widened to fit
- [[decisions]] · [[active-work]] · [[pick-up]]
