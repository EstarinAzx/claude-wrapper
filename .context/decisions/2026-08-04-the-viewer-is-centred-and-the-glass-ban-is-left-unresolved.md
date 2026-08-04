---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# The subagent viewer is centred, and the glass ban is left unresolved

**#98.** The subagent transcript viewer stops being a right-edge drawer and opens
as a centred popup. **`src/renderer/src/styles/subagent.css` is the only `src/`
file touched** — no JSX, no class rename, no keyframe rename, no new token. Plus
one new driver (`gui-98.mjs`), one added criterion in `gui-96.mjs`, and two stale
node labels in [[happy-path]]. Gate green: typecheck clean, **979 tests across 64
files** (unchanged), build clean, `gui-98` red-verified then green, `gui-95` and
`gui-96` green.

Placement was **decided by the owner**, verbatim: *"make the subagents chat view
a center pop up not a side panel one"*. This ticket is execution. Everything the
instruction did not state — size, motion, material, focus — was settled against
the record, and focus is deliberately **not** here (it is #99).

## Decision

**1 — The pane is 820px wide, and every term is read from a file.**

`820 = 760 + 48 + 2 + 10`: `.chat-column`'s `max-width` (`chat.css:13`), `.chat`'s
horizontal padding (`chat.css:9`), the pane's own hairline (it counts, because
`base.css` sets `box-sizing: border-box` on `*`), and the authored 10px gutter of
the app's overflow bar (`base.css:62-65`). That leaves 770 inside `.chat`:
overflowing, the bar spends its width and the column gets 760; not overflowing,
770 is free but `max-width` still renders the column at 760 and the spare falls
to `margin: 0 auto`. **The column measures 760 in both scroll states**, which is
what `gui-98` asserts in both, having established each state and verified it with
`scrollHeight > clientHeight`.

**760, 808 and 810 were each proposed and each wrong** — the last two for missing
the border-box hairline and the bar respectively. Do not simplify the number back.

Measured while driving it: at this window's 1.25 page zoom the bar spends **9.6
CSS px, not 10**, so the overflowing column has ~0.4px of slack and lands exactly
at zoom 1. The reading is 760 either way because `max-width` caps it. A narrower
pane spends that slack and drops below 760 — which is exactly what the red run
showed at 560px (501.6).

**2 — The root centres; `padding: 24px` is CHOSEN, not derived.**

Stated plainly rather than dressed up as a derivation. It is symmetric because
"center" is the one geometric thing the owner's instruction constrains, and
asymmetric padding would centre the pane low. There is deliberately **no titlebar
clearance**: this scrim already paints over the titlebar (`z-index: 20` against a
`position: relative` titlebar whose ancestors create no stacking context), so
there is nothing to clear. Changing the gutter is a one-declaration edit.

**3 — The entry becomes a Y rise. The keyframe keeps its name, so the axis needed
its own pin.**

`DESIGN.md`'s only documented entry is *"200ms fade + 4px rise, opacity/transform
only"*, and a centred pane arriving sideways is incoherent as well as off-spec.
Duration, easing and the keyframe **name** are unchanged — `gui-96` uses the name
as its premise and `gui-95`/`gui-93` select on the class names.

Keeping the name is what creates the gap: **`gui-96`'s premise and its 200ms
criterion both stay green whichever axis the body moves**, so nothing anywhere
pinned that the X slide was gone. `gui-96` gains criterion 6, a source-level
assertion that the `subagent-slide` body contains `translateY` and no
`translateX`. It extracts the body by **counting braces**, because `@keyframes`
bodies nest and the obvious lazy regex stops at the end of the `from` stop —
mutation-checked: an X translate reinstated in the `to` stop is caught by the
brace-matched version and **missed** by the lazy one.

**4 — The pane joins the app's existing floating-card idiom, and adds no
material.**

`var(--surface)`, `1px solid var(--border)`, `border-radius: var(--r-mark)`,
`box-shadow: 0 8px 28px oklch(0 0 0 / 0.35)` — the same treatment `.model-menu`
and `.command-popover` already define in `composer.css`, so no appearance is
invented. `overflow: hidden` clips the head's hairline to the radius; the inner
`.chat` keeps its own `min-height: 0` scroll. **No `backdrop-filter`, no blur, no
ply beyond `var(--surface)`** — asserted by `gui-98`'s criterion 5.

## The two ADRs that reasoned against a centred modal

[[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — *"A centred modal is
the conventional shape, but it is a new overlay pattern, a new focus trap, and it
paints a decorative glass layer inside the window"* — and
[[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — *"No modal,
no `window.confirm`: the first paints a glass layer DESIGN.md bans"*.

**NEITHER IS SUPERSEDED. NEITHER GETS A BANNER.** One decides *where Appearance
lives*; the other decides *how deletion confirms*. Both conclusions stay active,
and a centred transcript viewer overturns neither **decision**. What this work
departs from is the **rationale they happened to share**, and only for a surface
that already ships as a scrimmed full-inset overlay. `docs/agents/domain.md`
obliges surfacing a real conflict, not manufacturing one out of shared reasoning.

Two of the three objections are spent for this surface: *"a new overlay pattern"*
— this has been a scrimmed full-inset overlay since it was built, and the
conversion **moves** an overlay rather than adding one; *"a new focus trap"* —
real, unspent, and the whole of #99.

## Left unresolved, on purpose

**Whether `DESIGN.md`'s glass ban reaches a `var(--surface)` pane at all.**

The anti-modal ADR calls a centred modal a "decorative glass layer"
unconditionally. Read literally, that already condemns the drawer that shipped on
`main` before this change, which no ADR has ever noticed. **This work does not
settle which reading is right, because it does not have to**: the conversion
changes no layer, no material and no opacity — only x and y — and the non-goal in
decision 4 holds under either reading. Recording it as unresolved is the point;
quietly settling it in passing would be the failure.

## The instrument, which is the part that transfers

**`gui-98`'s criterion 2 was vacuous until the red run exposed it.** Written with
a bare `.chat-column`, it read **760 and passed against the 560px edge-pinned
drawer** — because the app's own chat is still mounted behind the scrim, so
`querySelector` returned the **background** column, which is ~760 at any
comfortable window size no matter what the popup does. Both in-pane selectors are
now scoped to `.subagent-drawer`. #95's lesson was about matching class *tokens*
rather than substrings; this is the same failure one level up — **the right class
on the wrong element**. It also means: a driver measuring an overlay in this app
is always measuring against a live, similar-looking background.

**Two IPC stubs are needed to reach the chat inside the viewer, not one.** The
ticket prescribed replacing `subagents:transcript` main-side, because the real
handler reads the real disk and answers `[]` in a temp workspace — which renders
`.subagent-drawer-empty` and mounts neither `.chat` nor `.chat-column`. Measured
here: **that stub alone is never reached.** `SubagentDrawer` resolves a session
id first; `sessionId` comes from `activeSessionId`, which `useChat` writes only in
its `turn-end` branch, and the fallback `currentSessionId()` reaches
`engine.sessionId()`, which stays null until a turn has actually run
(`engine.ts:443`, `turnEverRun`). With a synthetic `chat:event` push and no real
turn **both are null** and the component short-circuits at `if (!sid)
setMessages([])`. So `chat:session-id` is stubbed too, and the pre-stub value is
reported rather than assumed. Both stubs are the last thing the window is asked
to do and the app closes immediately after.

**The window's size is borrowed state and had to be set.** The pane is
`min(820px, 100%)`, so anything under 868 CSS px of viewport squeezes it and the
column measures the squeeze. #79 persists bounds, and the size this run inherited
was **900x600 DIP — 720 CSS px at 1.25 zoom, well under the threshold**, so
without the resize criterion 2 would have failed for a purely environmental
reason. The driver sets the bounds, reads back the CSS width as a premise, and
restores the original with time to clear the 250ms persist debounce.

**A finished CSS animation leaves `getAnimations()`.** With no fill mode, "nothing
is running" is also what a pane carrying no entry at all reports, so that check
alone is vacuous. The premise is two halves: the computed `animationName` is
`subagent-slide` **and** nothing is still running. The in-flight sample right
after open is logged as an observation and deliberately **not** asserted — a slow
frame there would red a correct build for a timing reason.

## Related

- [[2026-07-31-appearance-is-a-dock-not-a-settings-modal]] — not superseded
- [[2026-07-31-deleting-a-session-is-scoped-confirmed-and-singular]] — not superseded
- [[2026-08-04-the-subagent-drawer-is-drivable-without-a-live-turn]] — #95, the
  synthetic push this driver opens the viewer with
- [[2026-08-04-an-unchanged-box-is-measured-in-run-not-across-the-edit]] — #96,
  the driver that gained the axis pin
- [[2026-07-31-a-driver-establishes-its-premise]] — the rule the vacuity broke
- [[2026-07-30-the-import-order-is-the-cascade]] — why `subagent.css` being last
  means nothing downstream can be broken by these rules
- [[happy-path]] — two node **labels** updated; the sequence is unchanged
- [[overview]] · [[pick-up]] · [[decisions]]
