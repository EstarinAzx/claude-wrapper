---
type: decision
project: claude-wrapper
updated: 2026-07-30
tags: [context, decisions, toolcards, renderer, testing]
---

# Two disclosures on one card means two booleans

**Decision:** #62's input inspector is a **second** piece of card state, not a
reuse of #61's `expanded`. Output disclosure stays gated on `hasHiddenOutput`;
input disclosure is gated only on the call having arguments. A **pending
permission card renders the inspector outright**, with no toggle at all.
Arguments are **key-sorted**, and non-string values are materialised with
`JSON.stringify(v, null, 2)`, falling back to `String(v)` for what JSON cannot
represent. Both mounts stay conditional.

**Why:** Sharing one flag passes every "is it visible" assertion and still
breaks the design. The output affordance is trustworthy only because its absence
means *there is genuinely nothing more* — a shared boolean puts a control back on
one-line-result cards, and it makes the existing `a genuinely one-line result
advertises no expansion` guard vacuous while leaving it green. Separate booleans
are also what let a pending card show its arguments without offering to "hide"
them: at approval time the arguments **are** the decision, so they cannot sit one
click behind it.

Sorting is not cosmetic. The same call reaches the card two ways — a live event
object and a replayed `JSON.parse` — and only a *derived* order is guaranteed to
agree, so insertion order would make live/replay parity depend on how the object
happened to be built. `JSON.stringify` answering `undefined` matters for the same
reason the ticket exists: an `undefined` React child renders **nothing**, so an
argument present in the call would be invisible in the inspector.

**Cost found in the doing:** a second control on the card **shadowed the first
one by selector**. `gui-61.mjs` queried the bare `.tool-card-toggle` and would
have driven input disclosure while asserting about output — passing or failing
for reasons unrelated to what it measures. Both drivers now name their control
(`.tool-card-toggle--input` / `--output`), and any third control needs the same
treatment plus an accessible name outside `tests/toolcards.test.tsx`'s `TOGGLE`
regex.

**Reversibility:** easy

## Related

- [[decisions]] — index
- [[2026-07-30-disclosure-is-retention-plus-conditional-mount]] — the mount rule
  this extends to a second region
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]] — #63 renders into
  this same card
- [[active-work]]
