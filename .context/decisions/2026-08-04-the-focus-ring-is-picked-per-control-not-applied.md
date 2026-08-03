---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# The focus ring is picked per control, not applied

**#93, shipped as `07c0068`.** Thirteen interactive controls rendered Chromium's
default `outline: auto 0.8px rgb(229, 151, 0)` on keyboard focus — including the
app's primary action, both titlebar state pills and the window controls.
`titlebar.css` authored **zero** `:focus-visible` rules while the other seven
style files authored seventeen between them. Gate green: typecheck clean,
**953 tests across 63 files** (baseline unchanged), `gui-93` PASS, and `gui-72` /
`gui-51` re-run green because this touched their stylesheets. All six edited
files verified 100% CRLF.

## Decision

**A control's focus treatment is decided by whether it authors a fill, not by
where it lives.**

- Authors a background in **any** state → **hairline only**
  (`outline: none; box-shadow: inset 0 0 0 1px var(--tint-6)`), the treatment
  already at `rails.css:311` and `:596`.
- Genuinely transparent **menu/list row** → the shared wash+hairline group in
  `shared.css`, beside the hover group it already joins.
- Never the mint outline — that belongs to card controls (`.chip-remove`,
  `.tool-card-toggle`, `.tool-perm-btn`, `.subagent-row`), and none of these are
  on cards.

Six rules, no new file, no new token, no JSX change, nothing altered at rest.

| file | selectors | treatment |
|---|---|---|
| `titlebar.css` | `.backend-pill` `.perm-pill` `.model-pill` `.agents-toggle` `.sidebar-toggle` `.win-btn` | hairline |
| `composer.css` | `.send-btn` `.attach-btn` | hairline |
| `chat.css` | `.pick-folder-btn` | hairline |
| `subagent.css` | `.subagent-drawer-close` | hairline |
| `rails.css` | `.session-delete` | hairline |
| `shared.css` | `.model-menu-item` `.command-option` | shared wash+hairline |

## Why

**The obvious fix is the regression.** The `shared.css` focus group sets
`background: var(--tint-3)` as well as the hairline. Adding thirteen selectors to
it would have **replaced authored fills on focus** — the mint on `.send-btn` and
`.pick-folder-btn`, the mint on `.backend-pill--wisped`, the danger fill on
`.perm-pill--bypass`, the red on `.win-btn-close`. The controls a keyboard user
reaches most would lose their accent at the moment of selection. The app already
had the correct treatment for that case; the work was classifying, not inventing.

**Icon buttons take the hairline even when transparent**, because a wash on a
40×40 glyph button is indistinguishable from its hover state — the ring would say
"hovered", not "focused".

**`.model-pill` is the interesting edge and it does not follow the letter of the
rule.** It carries no fill in any state (the three pills use
`filter: brightness(1.12)` on hover, not a background). By the rule's first arm it
is transparent; by its second arm it is not a menu or list row. It takes
hairline-only because it shares a base rule with two pills that *do* carry fills,
and washing one of three would visually split the group.

## What re-running the enumeration corrected

The ticket's own table said to verify each row against the CSS rather than trust
it. Doing so changed two rows:

- **`.session-delete-armed` authors no background.** It sets
  `color: var(--danger-text)` only; the fill it appears to carry comes from
  `.session-delete:hover`. So armed, cancel and ordinary are one rule on the base
  class, not three.
- **`.command-option--active` already paints `var(--tint-3)`** — the exact value
  the shared group applies — so routing it into the wash group replaces nothing
  even on the highlighted row.

## The criterion that needed a mutation

Acceptance criterion 2 — *no authored fill is replaced on focus* — **passed on all
13 controls against the broken build**. With no focus rule anywhere, a background
trivially cannot change on focus. An assertion that has never failed measures
nothing, so it was mutation-verified separately: adding
`background: var(--tint-3)` to the titlebar rule reds seven controls, including

```
.backend-pill: at rest oklch(0.87 0.07 180),      focused oklch(0.92 0.01 210 / 0.08)
.perm-pill:    at rest oklch(0.35 0.06 25 / 0.35), focused oklch(0.92 0.01 210 / 0.08)
```

Reversed with the same anchored edit; `git diff` empty afterwards and the rebuilt
CSS bundle hash identical to the committed one. **This is the general form: an
assertion of the shape "X did not change" is vacuous in exactly the build where
nothing could change it** — the #82 and #76 lesson, arriving this time inside a
new driver rather than an old one.

The driver run happened to be **wisped and in bypass**, so `.backend-pill--wisped`
and `.perm-pill--bypass` were live during the assertion — criterion 2 was tested
against real authored fills, not against transparent controls standing in for
them.

## Reversibility

Fully reversible — six CSS rules, deletable independently, nothing else reads
them. What is **not** cheap to redo is the classification: the mapping from
control to treatment is the deliverable, and re-deriving it means re-measuring
every modifier state. That mapping is recorded in the rules' own comments, at each
site, deliberately rather than centrally.

The rule itself is a constraint on future work: **a new control does not "join the
focus group" by default.** Ask what it paints first.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-30-the-import-order-is-the-cascade]] — why a new rule goes in the file
  that owns its surface, never in the entry; this added rules to five surface
  files and widened exactly one shared group, by two transparent rows
- [[2026-07-31-a-theme-is-a-re-hue-not-a-re-design]] — why the driver reads its
  expected ring and wash from a probe element given `var(--tint-6)` /
  `var(--tint-3)` rather than hardcoding a colour: four palettes ship, and a
  hardcoded expectation would red on three of them
- [[2026-07-31-a-driver-establishes-its-premise]] — `gui-93` collapses the
  sessions rail and widens the session scope itself; both are state it establishes
  rather than inherits
- [[2026-07-31-the-titlebar-centre-is-a-flex-item-not-an-overlay]] — the titlebar
  constraint this respected: a focus state on existing controls, no new control
  and no new affordance
