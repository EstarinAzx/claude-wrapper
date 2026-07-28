---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# A scrollbar belongs to the surface, not the component

**Decision:** #51 deletes the four component-scoped `::-webkit-scrollbar` blocks
in `styles.css` and replaces them with **one global rule**, placed after the
reset. No scrollbar rule may be scoped to a selector — `tests/scrollbar.test.ts`
fails if one is.

**Why the report understated the defect.** The owner reported the model picker
dropdown showing Chromium's raw Windows bar. It was four scrollables:
`.model-menu`, `.command-list`, `.command-popover` and the composer textarea
(`.message-input`, scrolling past #42's 8-line cap) all shipped the default.

**Why it happened, which is the part worth keeping.** `DESIGN.md` had asserted
"never Chromium's default bar" from the first pass — but wrote it as *"Chat
scrollbar: …"*. Describing a surface-wide property as one component's detail is
what licensed a per-component implementation, and a per-component implementation
is copy-paste with no mechanism keeping the copies honest. They did not stay
honest: `.chat` was 10px/3px while the three rails were 8px/2px. The wording in
`DESIGN.md` is corrected as part of this change, because leaving it would
reproduce the drift on the next scrollable.

**Why global rather than a shared class.** A class (`.scroll-thin`) still has to
be *remembered* at every new overflow container, which is the same failure mode
with an extra step — the four missing containers each had a developer who did
not remember. A bare `::-webkit-scrollbar` needs nothing at the call site and
covers containers that do not exist yet. The cost is that it applies everywhere,
which in a single-window app with one visual language is the intent.

**Sizing.** 10px gutter / 3px transparent inset over the rails' 8px/2px. Both
render an identical **4px** visible thumb — the inset is a transparent border
with `background-clip: padding-box` — so nothing already styled changes
appearance; 10px is simply the larger drag target, and the size `DESIGN.md`
documents. Sized on **both axes**: `width` alone leaves horizontal bars default.

**Two details that are not optional:**

- `::-webkit-scrollbar-button { display: none }` — Chromium draws stepper arrows
  even on an otherwise-styled bar. Those arrows are what the report showed.
- `::-webkit-scrollbar-corner` must be transparent, or a both-axes container
  paints an opaque square where the bars meet.

**Do not mix in `scrollbar-width` / `scrollbar-color`.** The standard properties
suppress the `::-webkit-` pseudo-elements, so adding them silently discards this
rule. It is one vocabulary or the other.

**Verification.** Pinned on the mechanism — "no component-scoped selector exists"
— rather than on appearance, because a screenshot of one container passing says
nothing about the next scrollable added. Four mutations, each killed by its own
test. Measured in the real built window (`gui-51.mjs`) in the DOM: **10px** on a
probe element, **10.18px** on the reported model menu, against a ~15-17px Windows
default. The probe is the claim, not a proxy for it: an arbitrary element
inheriting the rule is precisely what "global" asserts.

**Reversibility:** High. One CSS block; reverting restores per-component rules,
and the pin would immediately go red, which is the point.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-22-glassy-acrylic-visual]] — the acrylic identity the opaque default
  bar was breaking
- [[2026-07-28-composer-height-is-css-not-state]] — #42's 8-line cap is what makes
  the composer textarea a scroll container at all
