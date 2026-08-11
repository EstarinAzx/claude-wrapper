---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, testing, gui-drivers, dom-phase]
---

# A deficit a reader cannot close is furniture

## Decision

**#145 (`40135ec`).** The `desktop-exclusive` quarantine for `gui-119` is
accepted as-is, and the DOM phase gains a third verdict so that accepting it
does not launder a green.

| verdict | means | exit |
|---|---|---|
| `DOM PHASE PASS` | everything the phase covers ran, and passed | 0 |
| `DOM PHASE INCOMPLETE` | nothing that ran broke, but a contract was never checked | 0 |
| `DOM PHASE FAIL` | something that ran broke | 1 |

The deficit appears in the count line —
`25/30 passed + 1 uncovered contract (gui-119.mjs, desktop-exclusive)` — in an
`UNCOVERED` row that prints the command clearing it, and in the last line. It is
never printed *beneath* a green line.

**Only the `desktop-exclusive` category counts toward the deficit.** `api-cost`
and `no-verdict` remain listed as named skips and do not enter the verdict.

**An `--only` run reports no deficit at all**, being scoped by construction.

`phaseVerdict()` and `uncoveredContracts()` live in `drivers.manifest.mjs`, not
in `dom-phase.mjs`.

## Why

**The objection that shaped this came with the acceptance, not against it.**
Cross-model review on the triage: *"a printed postscript converts a failing phase
assertion into optional operator behaviour and launders the main phase green."*
Listing the skip under a `DOM PHASE PASS` is precisely that postscript. Option 3
was the right call — options 1 and 2 both rest on a cause the ticket itself
records as never diagnosed past *"a prior Electron app had just closed"*, and the
project rule is build only if measured — but accepting a quarantine without
moving the deficit into the verdict would have bought honesty on paper and lost
it in the output a human actually reads.

**The one-category rule is the load-bearing half, and it is a claim about
readers rather than about categories.** A deficit a reader can close is a
deficit; one they cannot is wallpaper. `desktop-exclusive` closes with a single
command on an idle desktop. `api-cost` is a standing decision about money,
credentials and network — nobody clears it by remembering. `no-verdict` has no
contract to leave uncovered, because the driver computes no pass/fail at all.
Counting all nine skips would print a number on the last line that nobody can
ever drive to zero, and a warning nobody can clear stops being read. That is the
same failure this ticket exists to close, wearing the opposite costume.

**This makes `INCOMPLETE` reachable, which is what stops it being decoration.**
`npm run test:dom -- --only gui-119.mjs` is now a named release step in
`SKILL.md`, and running it is the only way this phase's report reaches a clean
`DOM PHASE PASS`. The deficit has an exit.

**The composition sits in the manifest for the reason #142 and #148 both hit.**
`dom-phase.mjs` spawns drivers at import, so the fast gate cannot execute a line
of it. A rule the gate cannot run is a rule that goes quietly wrong — which is
the entire subject of the phase this rule governs. Two pure exports put it under
`npm test` instead.

**Five mutations produced five distinct reds**, so the tests discriminate rather
than merely pass: collapsing `INCOMPLETE` into `PASS` reds the hazard test alone;
silencing `uncoveredContracts()` to `[]` (an opt-out by another name) reds the
set test and the `gui-119` test; swapping the precedence reds the precedence test
alone; widening the category to every skip reds the set test alone; lifting the
quarantine reds the `gui-119` test plus two pre-existing accounting tests.

## The exit code answers a narrower question than the word above it

**`INCOMPLETE` keeps exit 0, deliberately.** This is the part most likely to be
re-proposed, so the reasoning is recorded rather than left implied.

The triage's requirement is written entirely about the report — *"summary states
the uncovered contract as an explicit deficit … rather than printing a note
beneath a green line"*, *"a reader skimming the last line must see that something
was not checked"* — and is discharged by the text.

Extending it to the exit code would fail differently. A batch can **never** hand
a driver the desktop foreground; that is structural, not a backlog item. So a
non-zero `INCOMPLETE` would make this phase red permanently, and an exit code
that is always 1 carries exactly as much information as one that is always 0.
That is this ticket's own laundering hazard running backwards.

The exit code answers *did anything that ran break*. The verdict word answers
*was everything checked*. Two questions, and #145 is about the second.

## Reversibility

**Cheaply reversible in every direction, and each direction is one edit.**

- Want exit 2 for `INCOMPLETE`? One line in `dom-phase.mjs`'s final `process.exit`
  and one test. Flagged in-file for **#150**, which will wire CI and must read
  the verdict word rather than only `$?`.
- Want a different set of categories counted? `UNCOVERED_CATEGORY` in
  `drivers.manifest.mjs`, plus the set test that asserts what it resolves to.
- Want the quarantine lifted entirely? Removing `gui-119` from `DOM_SKIP` reds
  three tests by design, so it cannot happen quietly.

What is **not** free to reverse is the vocabulary. `INCOMPLETE` now sits beside
the driver-level `UNSCORED` introduced by #147, and the two are deliberately the
same shape of claim at different scopes: *this contract was not measured*.
Removing one without the other leaves the phase able to say it at the driver
level and not at its own.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-a-green-inherited-from-the-machine-is-not-evidence]] — #147, which
  gave `UNSCORED` its first producer. This entry is the same claim one scope up:
  the driver learned to say "I could not measure this", and now the phase can.
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — #132's rule, applied to
  this ticket's own logic: the verdict composition moved to the manifest solely
  so the fast gate could execute it.
