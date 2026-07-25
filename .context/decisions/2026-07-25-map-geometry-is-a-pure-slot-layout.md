---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision, agents, layout, design]
---

# Map geometry is a pure slot layout, and shape carries status as much as colour

## Decision

**#33 put the map's geometry in `src/shared/agent-layout.ts` beside the tree, as
`layoutAgentMap(rows)`.** It calls `buildAgentTree` and only places the result,
so parentage is still derived in exactly one place. It returns nodes with
coordinates, edges carrying both endpoints, and `width` / `height` /
`nodeRadius` in abstract viewBox units. Being pure, the map is testable as data.

The layout is a **tidy slot layout, not a physics solver and not a plain band**:

- Leaves take successive fixed slots; an internal node centres on the midpoint of
  its children. A parent therefore always sits over its own children, so a nested
  spine never draws a long diagonal across the panel.
- Slot width is `CONTENT_W / max(leafCount, MIN_SLOTS)`, with the content centred
  when there are fewer leaves than the floor. The floor is what stops a
  one-agent map from zooming to a giant circle; dividing a fixed canvas is what
  makes a wide fan fit without pan or zoom.
- Depth maps to a fixed band (`PAD_Y + (d + 1) * BAND_H`), the session occupying
  band 0. Depth therefore separates nodes by construction.
- Coordinates are abstract units and the SVG scales them into whatever width the
  panel has. **Nothing in the module knows the panel is 180–480px.**

**Visual encoding: shape = kind, colour = status.** Rounded square = session,
circle = agent, diamond = failed. Colour reinforces (mint running, muted-hollow
done, red failed, faint-dashed unknown) but never carries the signal alone, so a
failed agent is findable in greyscale and at a 4px node. Red-only would have
failed exactly the users the criterion is written for.

**The map carries no baked text.** Nothing legible fits at a 180px panel, so
identity lives in each node's `aria-label` and `<title>`. The list stays the
labelled view; the map is the shape view. Verified: a real 7-agent session
renders inside 155px of SVG at the 180px clamp floor with no scrollbar on either
axis.

## Why

The alternatives were considered and rejected:

- **A graph library or force simulation** — the ticket bans it and the observed
  shape (one root, a handful of children) is what a solver would spend its budget
  arranging into a semicircle. Slots are deterministic; a solver is not, and
  nodes that drift while you aim at one are worse than nodes that are merely
  plain.
- **A plain per-depth band** (lay out each depth globally, ignore parentage) —
  shorter, but a nested child can land far from its parent and the edges cross.
  Nesting is the one thing the map exists to show, so the case it fails is the
  headline case. Parent-centring costs about ten lines.
- **Wrapping a crowded band into a grid** — handles 28 agents more gracefully,
  but it makes "depth separates nodes" stop being obvious and buys little: the
  realistic ceiling fits.
- **Per-node captions** — cannot fit, and conditional labels would make the
  picture jump between agent counts.

Three defects in the generated draft are worth not re-introducing:

1. **`role="img"` on the map SVG** makes the whole subtree presentational and
   hides every node button from assistive tech. It is `role="group"`.
   Testing-library still finds the buttons under `role="img"`, so the test suite
   would not have caught it.
2. **`opacity` on the running halo is overridden** by the reused `subagent-pulse`
   keyframe, which animates opacity 1 → 0.35; the halo would have flashed
   near-solid mint. The alpha belongs in the fill (`color-mix`).
3. **Click-target sizing must be measured within a depth band.** A nested spine
   stacks parent and child on the same x, so measuring the gap across all nodes
   reads zero and collapses every hit circle to `r=0`, killing the mouse on the
   entire map. jsdom does no hit testing, so only an assertion on the radius
   itself catches it.

## Reversibility

**Easy.** The geometry is one pure exported function with no callers besides
`AgentMap.tsx`; a different layout is a rewrite of that function and its tests,
with no change to the tree, the dock, or the merge. The visual encoding is CSS
classes keyed on status. The one shortcut that has a named ceiling is marked
`ponytail:` in the module: the radius floors at 3 units, so past roughly 40
leaves the outermost nodes would clip the canvas — inset the slot span by the
radius if a fan-out ever gets that wide.

## Related

- [[decisions]]
- [[2026-07-25-agent-tree-edge-is-the-sidecar]] — the tree half this builds on
- [[active-work]] · [[pick-up]]
