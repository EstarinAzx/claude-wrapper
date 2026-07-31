---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decisions, css, titlebar, layout]
---

# The titlebar centre is a flex item, not an absolute overlay

**Decision:** `.titlebar-center` is `flex: 1; min-width: 0; display: flex;
justify-content: center` — in flow, between its two neighbours — and
`.session-title` gains `overflow: hidden; text-overflow: ellipsis; min-width: 0`.
The rejected alternative is keeping `position: absolute; left: 50%;
translateX(-50%)` and capping it with `max-width: calc(100% - 2 * <side>)`.
`pointer-events: none` stays on the slot either way; it is not decoration, it is
what keeps the centre inside the inherited `-webkit-app-region: drag`.

**Why:** The absolute slot was bounded by nothing, so the title grew
symmetrically from centre and slid *under* the pills and the dock buttons.
Measured on the built app at the four widths in #72: the title's rect was a
**constant 366.9css wide at every window width** — the signature of a box that
shrinks for nothing — and it crossed a neighbour at 819css and again at 688css,
where a **21-character** folder name was already enough.

The cap-with-a-magic-number variant works, and its number is the width of the
wider titlebar block (275css measured today). That number rots the moment a
control is added to or removed from the titlebar — which is *exactly* the
deferred work parked for the owner ("which of the 8 buttons should leave"). The
in-flow version has no such number: containment is structural, because a flex
item physically cannot reach its siblings.

**The span's `display` is never authored, and that is the mechanism.** Before,
`.session-title` was an inline box, and `overflow` / `text-overflow` are inert on
one — the driver read `display inline · overflow-x visible · text-overflow clip ·
clientWidth 0`. Becoming a flex item **blockifies** it, which is what makes those
two declarations start applying at all. Anyone "simplifying" `.titlebar-center`
back to a plain block, or moving the truncation onto the span alone, silently
undoes the fix.

**The rule that a new rule goes in the file that owns its surface held here, and
was load-bearing.** `.session-title` is the only title-ish element in the app
absent from the 13-selector truncation triad in `styles/shared.css`. Adding it to
that group would have been the smaller diff and would have repainted the sessions
rail and the agents dock at the same time — against a vitest suite that loads no
CSS, so nothing would have gone red.

**Known trade-off, deliberate and the owner's to revisit:** the title now centres
in the space *available* rather than in the *window*, so it sits off true centre
by half the difference between the two blocks (~15css today). Bounded by
`|left − right|`, and it self-corrects if the blocks are ever balanced. Recorded
in `.claude/vibe.md` under `## Needs you` as one of the four parked calls.

**Reversibility:** easy — revert the two rules and take the magic number instead.

## Related

- [[decisions]] — index
- [[2026-07-30-the-import-order-is-the-cascade]] — why the rule went in
  `titlebar.css` rather than into a shared group
- [[2026-07-31-a-driver-establishes-its-premise]] — `gui-72` was shown red on the
  unfixed tree before its green was believed
- [[active-work]] · [[pick-up]]
