---
type: decision
project: claude-wrapper
date: 2026-08-12
updated: 2026-08-12
tags: [context, decision, instrument, drivers, gate, vacuity]
---

# A ban is satisfied by the absence of what it bans, and a guard outlives the thing it guarded against

## Decision

#154 (`454e8de`) ports #143's two moves into `gui-122.mjs` and adds
`gui-122.source.mjs`. Both halves landed, and both were changed on the way:

| half | shipped shape |
|---|---|
| derived budget | phase 5 counts the document's visible focusables and bounds the traversal by `focusables + 10`, replacing `i < 60`. Measured: **24 focusables, budget 34** |
| rail pin | phase 1b ported **as a premise check, not a repair** — pin scope, read the rail back, report `UNSCORED` if it is not empty |
| sidecar | judgement call answered **yes**, with **two** checks where `gui-123` has one |

The second sidecar check is the new thing:

```js
const presses = (src.match(/keyboard\.press\(\s*['"`]Tab['"`]\s*\)/g) ?? []).length
const derived = forHeaders(src).filter((h) => /<=?\s*[A-Za-z_$]/.test(h))
return { ok: presses > 0 && derived.length > 0, detail: { ... } }
```

## Why

**A criterion that forbids a shape is satisfied perfectly by a file that no longer
contains the thing the shape was attached to.** #143's criterion says "no Tab
traversal in this driver is bounded by a hardcoded number". Delete the
`keyboard.press('Tab')` line and leave the bound as `i < budget`, and it reports
`ok` forever — there are no traversals, so none of them is hardcoded. The keyboard
claim has left the file and the check that guards it is still green.

This was verified rather than reasoned about, because a vacuity argument is exactly
the kind that sounds right and is sometimes wrong. With the Tab press deleted:
criterion 1 **green**, criterion 2 **red** (`tabPresses: 0`). Without criterion 2
that mutation passes the gate. It is the same family as #145 (a quarantine the
verdict does not carry is a green) and #146 (a check nobody runs is not a check),
one turn further in: **a check that runs, and polices nothing.**

**The second half is that #143's guard had already outlived its trigger, and the
ticket did not know.** #154 says gui-122 "is one flip away from the identical red"
because the rail's scope toggle survives relaunch. That was true when #143 was
written. **#147 landed after it and closed the channel**: `profileArgs()` hands each
driver process a `--user-data-dir` that `mkdtemp` just made, and `dom-phase.mjs`
mints its own root per run, so the `localStorage` holding `sidebar-scope` is empty
at every launch and `Sidebar.tsx` falls back to `project`. Measured on the first run
of the ported driver: `RAILPIN {"scope":"This project","rows":0,"pinnedHere":false}`
— `pinnedHere: false`, meaning the driver found it already correct and had nothing
to click.

So the pin was ported for a **different reason than the one it was written for**:
not to defend against inherited state, but to stop the empty rail being something
the run inherited *silently*. It reads back, so a reverted #147 or a changed stored
default reports `UNSCORED` rather than being measured. Porting the block without
re-deriving its premise would have shipped a repair for a defect that no longer
exists, with prose asserting a hazard that had been closed — and nothing would have
caught it, because the block passes either way. This is the third instance of the
shape in [[2026-08-11-a-value-check-outlives-its-warrant-unless-the-warrant-is-checked-too]]
and [[2026-08-11-a-permission-outlives-the-thing-it-permits-unless-both-are-pinned]].

**#147 also makes the sidecar's argument stronger than gui-123's.** #143 justified
its sidecar by saying a reverted constant is *unlikely* to red the DOM phase, since
the rail is only long on a machine where somebody left the toggle flipped. After
#147 the rail is empty on **every** run of the phase, on every machine, so a
reverted constant is invisible there **by construction**. The sidecar is not a
belt-and-braces text check; it is the only thing that can catch it.

**The position of phase 1b is load-bearing, and the ticket does not mention it.**
#143's own comment records why: the block was written inside gui-123's traversal
phase first, and a phase *above* it then read a mid-transition opacity off a
renderer laying out a hundred rows it did not need. gui-122 has five live reads
below the pin (a 15s wait for the control, a clipboard round trip, a 2600ms wait for
the confirmation to fall back to rest, two geometry reads, a screenshot), so it
went at the top. Reading the commit for what it **did** rather than what the ticket
said it did is what surfaced this.

**The ticket's own survey was pattern-matched, not read, and checking it cost one
grep.** #154 says `gui-48`, `gui-52` and `gui-54` "also carry `i < 60` Tab loops"
and are worth a look. **None of them carry a Tab loop.** Nor does `gui-80`, a
fourth the ticket missed. All four have zero `keyboard.press('Tab')` calls; their
`i < 60` loops are `waitForTimeout` poll budgets — 60 × 1000ms or 60 × 2000ms —
waiting for a real CLI turn to finish or `.model-pill` to un-disable. A wall-clock
timeout is not a guess about a countable document, so there is nothing to derive it
from and nothing to fix. (`gui-48` has one such loop, not the two the ticket
claims.)

**Counting the population instead of trusting the list found the real remainder.**
Exactly **three** drivers tab-traverse — `gui-122`, `gui-123`, `gui-124` — and
`gui-124` bounds its traversal with `for (; hops < 12; hops += 1)`. Same class,
tighter constant, and unmentioned by either ticket. Filed as **#163** rather than
detoured into.

**One finding the new diagnostic exposed, and it narrows what the phase claims.**
`presses: 1`. Phase 3 leaves focus on the copy button it clicked, and
`document.body.focus()` does not move focus — `body` has no `tabindex`, so the call
is silently ignored — so the first Tab lands on the *other* markdown path's
`.code-copy` immediately. The ring assertion stays sound (either control is a
legitimate subject) and the behaviour is pre-existing, made visible rather than
introduced. But the derived budget is barely exercised in practice, and "keyboard
reachable" is a narrower claim than its wording. `gui-124` anchors its start at
`.message-input` and is the better model. Filed as **#164**.

**Evidence.** Baseline before the change: PASS, exit 0 — the defect was latent, as
the ticket says. Four mutations, four distinct reds: `i < 60` reds criterion 1;
deleting the Tab press reds criterion 2 **alone**; a nonexistent scope selector and
an inverted pin each red the driver `UNSCORED` and stop it before any measurement,
the latter reproducing #143's rail verbatim
(`RAILPIN {"scope":"All projects","rows":100,...}`). Every mutation restored from a
`cp` backup and hash-checked back to `1085b6b877bc4fa042bc721317f52506` /
`b164b2c8b0adfd4c168745dc2fde32c1`. Gate: typecheck clean, **96 files / 1408 passed
/ 43 skipped**, build clean with `index-DOI17h8g.css` unchanged. The
`+2 passed / -1 skipped` delta is exactly this change — two new sidecar tests, and
`gui-122.mjs` leaving the "no source-level sidecar" reported-skip list.

**The two sidecars duplicate `stripLineComments` and `forHeaders` deliberately.** A
shared helper would add a sixth non-driver `.mjs` to a directory whose file
inventory is itself checked by `drivers.manifest.mjs`, and cross-importing between
sidecars would make deleting `gui-123` break `gui-122`'s gate check. Twenty lines of
pure text scanning is the cheapest of the three. A third sidecar needing them is the
signal to revisit rather than duplicate again.

## Reversibility

**Easy.** Two files, one of them new, no `src/` change and no pixels moved
(`index-DOI17h8g.css` unchanged corroborates the byte check). Deleting
`gui-122.source.mjs` returns gui-122 to the reported-skip list and drops two gate
tests; reverting phase 5 restores the constant. The premise finding is the part
worth keeping even if the code goes: **#147 removed #143's trigger**, so anyone
porting this shape to `gui-124` (#163) must measure whether its traversal crosses
the rail at all rather than copying phase 1b on faith.

## Related

- [[decisions]] · [[active-work]] · [[overview]]
- [[2026-08-11-a-value-check-outlives-its-warrant-unless-the-warrant-is-checked-too]]
- [[2026-08-11-a-permission-outlives-the-thing-it-permits-unless-both-are-pinned]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
