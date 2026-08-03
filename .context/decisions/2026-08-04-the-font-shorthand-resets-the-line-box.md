---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# The `font` shorthand resets the line box, so the neutraliser goes on the parent

**#94, shipped as `e1a2c31`.** `.command-row-btn` was the last row button in the
app without `font: inherit`, so the Commands dock painted its descriptions in
Chromium's UA button font — **Arial 13.3333px** on this platform — while every
sibling row used `--font`. Deferred in the #79 dedup refactor (whose contract was
zero visual change) and flagged ever since. Gate green: typecheck clean, **953
tests across 63 files** (baseline unchanged), `gui-94` PASS, and `gui-51` /
`gui-93` re-run green because they own the two surfaces this touched. Both edited
files verified 100% CRLF.

## Decision

**When `font: inherit` is added to neutralise a UA font, the line-height it also
resets is neutralised on the SAME element — not on the children that visibly
moved.**

```css
.session-row-btn,
.agent-row-btn,
.command-row-btn {
  font: inherit;
}

.command-row-btn {
  line-height: normal;
}
```

Plus exactly one child pin, on the only child whose own family changed:

```css
.command-row-desc {
  line-height: 1.1;
}
```

## Why

`font` is a **shorthand**. It resets `line-height` along with `font-family`, and
this subtree had nowhere to absorb that: `rails.css` declares **zero**
line-heights, `body` sets `1.6` (`base.css:25`), and a `<button>`'s UA
`line-height: normal` does not inherit. So the naive join moved **all three**
`.command-row-*` children, including the two that set their own `font-family` and
therefore look immune:

| | pre-fix | `font: inherit` alone | shipped |
|---|---|---|---|
| `.command-row-name` | 15.2px | 20.8px (**+5.6**) | 15.2px (0) |
| `.command-row-hint` | 12.8px | 17.6px (**+4.8**) | 12.8px (0) |
| `.command-row-desc` | 12px | 17.6px (**+5.6**) | 12.1px (+0.1) |
| `.command-row-btn` | **60px** | **76px** (**+16**) | 60.1px (+0.1) |

**The obvious remedy was the trap, twice over.** The ticket prescribed pinning all
three children to their measured pixel values. Both halves of that are wrong:

1. **`.command-row-name` and `.command-row-hint` are not the dock's to pin.** They
   render a second time in the composer's slash popover (`InputBar.tsx:483`),
   inside `.command-option`. `font: inherit` never reaches that surface — but a
   pin on the shared class does. The two surfaces agree today only because
   `.command-option` sets `font-family: inherit`, the **longhand**, leaving its
   line-height at the same UA `normal`; that coincidence is what would have made
   the pin look green while redefining the popover's metrics from the dock's
   measurements.
2. **A px pin measured on one machine is a shift on another.** 15.2px and 12.8px
   are Cascadia Code's `normal` at 13px and 11px. `--mono` is a fallback *list*;
   wherever it resolves to Consolas or `ui-monospace` those numbers are simply
   wrong, and the pin would **introduce** the shift it was written to prevent.

Restoring `normal` on the parent avoids both: one declaration, the whole subtree,
and still font-relative — every child keeps resolving `normal` from its own
family and size, so the fix survives a token change or a different font stack.

**`.command-row-desc` is the exception because it is the one child whose family
actually changes.** `normal` is resolved from the family's metrics, so the
intended repaint alone grew its box 12px → 14.4px (Arial ≈1.09 → Segoe UI
Variable Text ≈1.31). Unitless `1.1` holds the row and still tracks
`--fs-micro`. It is unitless because **the app has 19 line-height declarations
and not one of them is a px** — a px here would have been the first, and would
have stopped tracking the token it depends on.

## The rest of the shorthand, enumerated

The ADR this ticket corrects was wrong *by not enumerating*, so the enumeration is
part of the record. `font` also resets `font-style`, `font-variant`,
`font-weight`, `font-stretch` and `font-size`. Measured on the live button
against `body`: **400 / normal / normal / 100% on both sides**, so the shorthand
moves none of them. `font-size` is immune because all three children set their own
px token. `gui-94` re-measures this every run rather than trusting this paragraph.

## AC3 was vacuous until it was mutated

The interesting criterion — *all three children's line-height is unchanged* —
passes **trivially** on `main`, where no rule exists that could move them. This is
the **fourth** instance of that shape in this project after #76, #82 and #93, and
the second inside a brand-new driver. It only means something because `font:
inherit` was applied **alone** first, without the neutraliser, which reddened all
three children by 5–7× the tolerance.

Two smaller measurement notes worth keeping:

- **`.command-list`'s height is not a useful measure.** It read 548px in every
  run including the 76px-row mutation, because it is `max-height`-bound and
  scrolls. The *row* height is the sensitive number.
- **`gui-94` hardcodes no measurement.** It reads the UA button font off a bare
  `<button>`, `--font` / `--mono` off a token probe, and rebuilds the pre-fix row
  from a replica wearing that UA font whose children carry the **authored**
  declarations (`var(--mono)`, `var(--fs-ui)`, `var(--fs-micro)`) — never the live
  computed values, which move with the fix. Four palettes ship; a literal would
  have redded on three.

## Reversibility

**Cheap, and cheap in both directions.** Two declarations in one file. Removing
`.command-row-btn` from the `font: inherit` group restores the UA font exactly;
removing the two line-height lines is what the mutation run already measured, so
the cost of getting it wrong is known to the pixel rather than guessed.

`gui-94` is the only guard in either direction — nothing in `tests/` and none of
the other 24 drivers pins the command-row font, and jsdom cannot see a computed
family or a line box. Deleting the driver silently removes all coverage of this.

## Left open, deliberately

**Whether 12px is the right line box for 11px muted description text is a taste
call and stays the owner's.** The geometry this ticket preserves is *Arial's*
metric — an artifact of the very bug being fixed. Segoe's own `normal` (14.4px,
≈1.31) sits closer to the app's other micro text, which runs 1.3–1.45. Loosening
it is a visual change with no ticket behind it, so the shipped fix holds the old
geometry and leaves the question on the record. Nothing blocks on it.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]] — **AMENDED
  by this entry.** Its "would repaint `.command-row-desc`" names one child; the
  blast radius is three children and a 27% taller row.
- [[2026-07-30-the-import-order-is-the-cascade]] — where a new CSS rule goes
- [[2026-08-04-the-focus-ring-is-picked-per-control-not-applied]] — #93, the other
  half of the 2026-08-04 owner grant, and the previous instance of a no-change
  criterion needing a mutation to mean anything
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74–#81, #93
  and now #94
