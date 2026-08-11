---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, design-system, type, testing]
---

# A value check outlives its warrant unless the warrant is checked too

## Decision

#139 (`ab7aee4`) takes the tool-card label from 600 to 400, and pins **three** things
rather than one:

| criterion | what it holds | gate |
|---|---|---|
| 7 | the label computes `400` | `npm run test:dom` |
| 8 | `400` and `600` are different renderings **on this machine** | `npm run test:dom` |
| 9 | the label is none of the three roles 600 is licensed for | `npm run test:dom` |
| 10 | every `font-weight` in `styles/` is `400` or `600` | `npm test` |
| 11 | `DESIGN.md` records the replacement (size and colour) | `npm test` |

Criterion 7 is the value the ruling lands on. **Criteria 8 and 9 exist because
criterion 7 alone is green in two situations where the decision it encodes is dead.**

## Why

**The ticket inverted, and the inversion is the point.** It was filed as a missing
weight step: prose at 15/400 against labels at 13/600 delivers a ratio of 1.208, where
this app's own 400-to-600 step measures 1.391 at a constant size. Three review waves
raised it. Every available fix (350, 500, 700) left the documented `{400, 600}` set, so
it needed a ruling rather than a builder.

The ruling read `DESIGN.md`'s licence as **exhaustive** — 600 is granted to the app
name, headings, and bubble-less emphasis — and observed that a tool-card label is none
of them. So the off-spec element was never the prose at 400. It was the **label**,
asserting a weight the document had not granted it. The fix is to stop asserting it,
not to widen the set.

**The warrant is load-bearing and mutable, which is why it is measured.** `ToolCard` is
rendered as a *sibling* of `.assistant-body` in `Chat.tsx`, never inside it. Move tool
cards into that region — an ordinary refactor — and the label becomes bubble-less
emphasis, 600 becomes licensed again, and this whole decision inverts. Criterion 7 would
stay green through that. Criterion 9 reds. **A check on a value survives the death of
its reason unless the reason is also checked**, and here the reason is a DOM fact that a
refactor can change without touching a stylesheet.

**Criterion 8 answers the ticket's own trap.** `500` renders byte-identically to `600`
here, because the family snaps to named instances — so anyone "fixing" this at 500
changes zero pixels while believing otherwise, and the ticket says to assume the same
hazard below 400. Criterion 7 reads the computed value, which is the declaration handed
back, so it inherits that hazard whole. So the label is driven through both weights
in-run and the widths compared in device pixels: **29.94 at 400 against 31.17 at 600, a
delta of 1.234 device px**. Non-zero, so the fix moved real pixels. A zero there would
have meant a green criterion 7 over a no-op.

**Discharging a stop gate means reading the population, not the element.** Acceptance 1
required confirming the reading against rendered elements, and doing that honestly meant
mapping every `font-weight` in `styles/` to a licensed role. The same reading that
condemns this label condemns **eight more** (`.pick-folder-btn`, `.control-value`,
`.reject-name`, `.tool-card-arg-key`, `.subagent-row-type`, `.subagent-row-open`,
`.model-pill`, `.tool-perm-btn`). That is a design question with a live counter-precedent
one commit away — #138 **widened this same line** rather than restriking code, adding
`headings` — so it was filed as **#160** at `needs-triage` rather than ruled by a leg.
#139's own warrant holds under either answer, which is why it closed anyway.

**One correction to the ruling's premise, which changes nothing.** The ruling quotes the
licence as two roles. `b2a3fd0` landed after it was written and made it three. Criterion
9 tests all three rather than the two that were argued, because a check whose name is
wider than what it checks is the gap it was written to close.

**Criterion 10 reads the value, not a value.** Criterion 2 (from #96) bans `500`
specifically, which is the one drift that had happened. The acceptance is wider — the
set is `{400, 600}` and no rung may be added — so criterion 10 matches `[^;}]+` rather
than `\d+`: **`bold` leaves the documented set without ever writing a number**, and a
digit-only pattern would not see it. Both were mutation-verified, and `700` reds
criterion 10 while criterion 2 stays green, which is the demonstration that one does not
subsume the other.

**Every new check was mutation-verified, carrying leg 9's habit.** Red-verified on the
unmodified tree (7 failed at 600; 8 and 9 passed, which is what made the fix worth
making rather than a no-op). Then: `700` and `bold` each red criterion 10; deleting the
`DESIGN.md` sentence reds criterion 11, and so does stripping `colour` from its line;
pointing criterion 9's ancestry probe at a real ancestor reds it, **which is what proves
its negative is a measured negative rather than a query returning null forever**.

**A limit was recorded rather than hidden.** Criterion 11 does not red when one of the
line's two `colour` mentions is reworded while the other survives. That is the honest
reading — the claim is still on the record — but it is a keyword check on prose, so it
pins that the claim is *present* and cannot grade how well it is argued. Tightening it to
exact wording would buy that at the price this repo already pays for its literal-text
pins (D3).

**No new driver.** `gui-96` already owned computed `font-weight` as a subject and already
grew a tool card as a fixture (`.subagent-row` is a child of the card), so the whole
rendered half cost one `page.evaluate` and no second Electron launch.

## Reversibility

**Reversible, and cheaply.** The pixel change is one declaration. If #160 rules that the
licence was illustrative rather than exhaustive, the honest response is to widen the
`DESIGN.md` line — #138's precedent — and this leg's paragraph and criteria 7 and 9 come
out together. Criteria 8, 10 and 11 stand either way: 8 is a fact about the font on this
machine, 10 pins a set nobody proposes to change, and 11 pins that whatever is decided
stays written down.

The one thing that should **not** be reverted quietly is criterion 9. Deleting it leaves
criterion 7 asserting a value whose reason nothing checks.

## Related

- [[decisions]] · [[active-work]] · [[overview]]
- [[2026-08-11-a-ratio-rule-is-tested-as-a-ratio-and-its-tolerance-is-set-by-the-rungs-it-already-admits]] — #138, which widened this same licence line and set the counter-precedent #160 turns on
- [[2026-08-11-a-test-built-on-ambient-state-measures-the-ambient-state]] — #141, the mutation-verify-the-test habit this leg used to prove criterion 9's negative
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
