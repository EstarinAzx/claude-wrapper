---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, gauntlet, testing, documentation]
---

# A standard generated from the code it polices inherits its omissions

## Decision

**#149 (`6067a12`).** `inspect.mjs` publishes its surface list in three places
and two of them had drifted to five against nine. The list is restated correctly
in both, and `tests/inspect-published-list.test.ts` now reds when any of the
three disagrees.

**The obvious fix was rejected, and the objection is the whole shape of the
change.** The ticket originally proposed deriving both documents from the
`SURFACES` array so they would stop restating it. That inverts the contract:
deleting a driver entry would silently delete the obligation to meet a standard
on that surface. `.gauntlet/bar/README.md` is a **standard**, and a standard
generated from the implementation it polices can no longer catch that
implementation — it fails in exactly the direction that matters, silently and in
the direction of less coverage.

So the two documents are treated differently, on a stated principle:

- **`SKILL.md` follows the instrument.** It documents `inspect.mjs`, so tracking
  `SURFACES` is correct there.
- **`.gauntlet/bar/README.md` keeps its own hand-authored list**, and now says in
  the file why. A surface leaving the code does not leave the bar until a human
  takes it out of the list.

The test asserts only that the three **agree**. Neither side may silently define
the other, and a removal reds the gate until a human makes the same removal
deliberately, in the standard.

**Membership is held; order is not.** The bar's order is wave order, and the
driver's is a capture order constrained by cost — the docks come last because a
dock is an in-flow aside and opening one narrows `main.chat`. Requiring one to
match the other would force an unrelated constraint onto a human document.

## Why

**The drift was invisible for two tickets because a list in prose does not run.**
#133 added the three right-hand docks and #137 added `welcome-min-window`. Both
updated the driver's own header — because that is the file being edited — and
neither touched the two documents that publish the same list.

The cost is not cosmetic. Both documents are read by whoever decides what a
gauntlet wave can address, so **a surface that exists but is not published is a
surface no wave scopes itself to**, which lands in the same place as never having
photographed it. #133 existed to end exactly this drift one layer in.

**Verified by two mutations, and the second is the one that earns the design.**
Adding a surface to `SURFACES` reds both documents plus the file count. Renaming
one *out* of `SURFACES` while the bar still lists it reds the same three — the
standard catching the implementation, demonstrated rather than argued. The suite
opens with a **discrimination control**, because a parse that silently returned
nothing would otherwise pass by agreeing all three publish an empty set, which is
the same shape of failure the ticket is about.

**The regions are delimited rather than scanned whole.** `.gauntlet/bar/` names
plenty of PNGs that are not surfaces — five Linear references, the identity
floor, the before-shot — so a file-wide scan for `*.png` would fold the
references into the surface set.

**A count sitting beside a list is what rots.** Four further stale counts were
found in the driver's own comments while restoring the file after the first
mutation: the section header, the zero-CLI-turns claim, the commands-fixture
note, and a runtime failure message reading *"four of the five surfaces only
exist once a folder is open"*. All were written at five surfaces or eight, and
both #133 and #137 walked past every one. Three are now **numeral-free rather
than corrected** — deleting the thing that rots beats re-pinning it — and the
failure message names the two Welcome captures as the exception, which is the
fact it was trying to convey and does not go stale when a surface is added.

**One discrepancy was deliberately not resolved.** `.context/pick-up.md` says the
three docks *"share the Sidebar's reference"*, while this README's own reference
table already assigns `linear/linear-features.png` to *"Titlebar + docks"*. The
table is the owner-confirmed half of a human-owned artifact, so it was left
untouched and raised on the ticket instead. Silently rewriting a reference
mapping to match a note is not a documentation fix.

## Reversibility

**Easy.** The test is one file and the documents are prose. Reversing the
*principle* — letting the bar generate its list from `SURFACES` — is the thing to
weigh, and it is what this entry exists to make someone argue against rather than
rediscover, since it is the obvious-looking fix twice over.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-an-instrument-may-not-photograph-a-state-the-app-calls-impossible]] — #133, which added the docks this list had lost
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]] — #137, which added the ninth surface and filed this ticket
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — the same failure one layer in: a contract with no consumer accumulates violations that look like compliance
