---
type: decision
project: claude-wrapper
date: 2026-08-05
updated: 2026-08-05
tags: [context, decision, agents, layout, design]
---

# The map is objects on a ground, and hollow is reserved for absence

## Decision

**#126 gave `AgentMap` a visual pass inside the encoding
[[2026-07-25-map-geometry-is-a-pure-slot-layout]] pins, and refined exactly one
line of that ADR's prose.** Landed as `0628745`.

The ADR refuses four named alternatives (graph library, plain per-depth band,
wrapped grid, per-node captions) plus baked text, and its Reversibility section
says the layout itself is a rewrite of one pure function. This change stays
inside all of that: still one pure function, still no dependency, still
`role="group"`, still no text, shape still carries kind and colour still only
reinforces status.

**Geometry** — `R_MAX` 9 to 14, `BAND_H` 46 to 62, `PAD_Y` 22 to 30; edge
endpoints inset to each node's rim plus a gap; `sessionRadius` returned so the
root is the largest mark.

**Paint** — settled marks (`done`, and the session) are **solid** and sit
lighter than the panel; **hollow is now reserved for `unknown`**; the edge takes
`--text-faint` at 1.4 viewBox units; the SVG caps its rendered width at 280px
and centres.

**The one prose refinement:** the ADR described `done` as "muted-hollow". It is
now a solid neutral disc. The *rule* the ADR states is untouched — shape carries
kind, colour reinforces — and the greyscale spread of the four statuses is
**wider** after this change, not narrower. What changed is which status gets to
be an outline: a finished agent is inert, not missing, and `unknown` is the only
status that genuinely means an absence of information.

## Why

The map's problem was entirely how it looked, and that is worth stating
precisely because it shaped the work: **`gui-126.mjs` was written first and run
against unmodified `main`, and every acceptance criterion on the ticket came
back green before a line changed.** The risk was therefore breaking a pinned
criterion while chasing looks, not failing to meet one.

Measured before, at the 180px clamp floor: a 155x118px drawing in a 623px pane,
with three specific defects.

1. **`stroke-width` in an SVG is in VIEWBOX UNITS.** The viewBox is 240 wide
   scaled into ~151px there, so the edges' `stroke-width: 1` rendered at roughly
   **0.6 of a device pixel** and read as scratches. This is the kind of value
   that looks right in CSS and is wrong by a scale factor.
2. **A tint-ladder step cannot carry a structural line here.** The ladder tops
   out at 20% alpha of a near-white over a near-black ground. No stroke width
   fixes that, which is why the edge left the ladder for `--text-faint`.
   Nesting is the one thing this view exists to show, so its edges are content,
   not chrome.
3. **`done` and `unknown` were both outlines** and near-indistinguishable at
   that size, in a map where `done` is the commonest state.

**Two darker fills were tried on the real window and rejected there, not on
paper.** A tint-ladder step reads as a hole punched in the surface. `--bubble`
does too: nominally lighter than `--surface` at OKLCH 0.27 vs 0.19, it
composites to roughly the panel's own value once the wash beneath it is counted,
so a "lighter neutral" chosen by reading the token file is not necessarily
lighter on screen. `--text-faint` is the quietest opaque value in the system
that actually lifts.

**`R_MAX` was raised rather than `R_MIN`, deliberately.** A cap only binds while
`slotW * R_RATIO` exceeds it, so raising one can only change fans **below 8
leaves** (at 8, `slotW * R_RATIO` is already exactly 9). From 8 leaves up the
geometry is byte-identical. That is what keeps the module's named `ponytail:`
ceiling from moving: the floor, and therefore the widest fan that fits the
canvas, is untouched. A test asserts a 28-wide fan still comes out at radius 3.

**The edge inset lives in the pure function, not the renderer**, so it is
testable as data — the ADR's whole reason for putting geometry there. It is a
pure-y inset and that is exact rather than an approximation: the curve's control
points sit directly above and below its endpoints, so it leaves both of them
vertically. `fromX`/`toX` therefore still equal the nodes' x.

## What pins it

`tests/agent-map-visual.test.ts` (9 tests) is a **gate-run** raw-text pin,
added for the reason [[2026-08-05-the-owner-named-the-surface-so-the-ban-takes-one-exception]]
added its twin: no `gui-*` driver runs in `npm test`, so a pass whose only pin
is a driver is protected by a check nobody runs. The named risk is a tidy-up
pulling this paint back onto the tint ladder — which is what made it unreadable,
and which would look like a **conformance improvement** in review. One of the
nine is a discrimination pin: filling every glyph would satisfy the other eight
while collapsing the distinction they exist to protect, so `unknown` is pinned
hollow.

Nine mutations were run against these pins, all caught by their named test, with
an unmutated control green before and after, verdicts parsed from the result
rather than the exit code.

`gui-126.mjs` asserts every acceptance criterion on the live window and was
**red-verified**: under two mutations in one build cycle the shape criterion
FAILed and the halo criterion returned **UNSCORED**, because the mutation made
the halo's fill identical to the glyph's and the discrimination control refused
to score rather than reporting a false pass.

## Reversibility

**Easy, and unchanged from the ADR.** The geometry is still one pure exported
function with `AgentMap.tsx` its only caller; the paint is still CSS classes
keyed on status. Reverting the prose refinement means restoring `fill: none` on
`.agent-map-node--done .agent-map-glyph`, which reds one named test rather than
failing silently.

## Related

- [[decisions]]
- [[2026-07-25-map-geometry-is-a-pure-slot-layout]] — the encoding this works inside
- [[2026-08-05-esm-freezes-every-js-seam-so-measure-the-process]] — the instrument-trap lineage
- [[active-work]] · [[pick-up]]
