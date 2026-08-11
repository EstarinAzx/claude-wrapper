---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, gui-drivers, testing, repo-hygiene]
---

# A convention nothing executes is a style preference

## Decision

**#146 (`ed9a490`).** Every GUI driver writes its captures where `SCREENSHOT_DIR`
tells it to, `scripts/gui-*-shots/` is gitignored, and the five PNGs that were
tracked there are deleted. `tests/driver-screenshot-dir.test.ts` holds the
property.

The committed captures are settled as **leftovers, not a reference**. Two
independent sources of run-to-run drift are already recorded (#142's random
fixture workspace name, #148's real sessions in the rail), and a capture nobody
can diff is not a baseline. The captures a critic actually grades come from
`inspect.mjs` into `SCREENSHOT_DIR`; a driver's guarantee is its assertions.

## Why the test exists at all, which is the transferable half

The canonical line was **already unanimous in thirty-four driver files** and
still drifted in four. Nothing executed it, so it was not a contract — it was a
house style, and house style is what a new file copies from whichever sibling
it was pasted from.

This is [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
one level down. There, a list restated in prose rotted against the code it
described. Here, a *line* copied between files rotted against its own intent.
Same failure, different granularity: the repeated thing had no single place that
could be wrong, so it was wrong in four places for as long as nobody looked.

## The second assertion is the one worth defending

The test holds two defects apart rather than one:

1. a driver that ignores `SCREENSHOT_DIR`;
2. a driver that honours it but **defaults back inside the repo**.

(2) reads as redundant and is not. Mutation proved it: rewriting a driver as
`process.env.SCREENSHOT_DIR || path.join(APP_DIR, 'scripts', ...)` **passes (1)
and reds only (2)**. That form satisfies every word of the ticket and
reintroduces the tree churn for every manual run. A single combined assertion
would have blessed it.

Reverting a driver to the plain hardcoded path reds both, and a discrimination
control fails first if the parse itself breaks — otherwise an empty scan passes
by finding nobody to accuse, which is the vacuous-green shape this repo has
already been bitten by.

## The ordering constraint earned its keep

Cross-model review required: fix producers, **then** prove nothing consumes the
old paths, **then** delete. The middle step is what found that
`scripts/spike-117-shots/` **is** consumed — `spike-117-findings.json` cites all
four of its PNGs by path and `spike-117-findings.md` tabulates them, as the
evidence behind a recorded finding.

That also resolved a wrong number in the ticket's own body. It said nine tracked
files; five were tracked under `gui-*-shots`. The nine folded in spike-117's
four, which must stay. **The ruling's instruction to keep the ignore rule narrow
is what protected them** — a tidier `scripts/**/*.png` would have concealed live
evidence, and would have looked like better housekeeping while doing it.

Deleting first would have destroyed cited evidence and left two findings
pointing at nothing. The hazard was named in advance and was real.

## Verified by running the phase, not by reading it

`gui-122` and `gui-124` green; `gui-119` green standalone (it is batch-skipped,
so the phase never launches it); `gui-123` red on **exactly its own open ticket**
(#143, the reuse control is not keyboard reachable), with its `SHOTS` line
printing the clean temp path — which is the better evidence of the two, since it
shows the fix holding on a failing run.

Three phase runs left `git status` on `scripts/` clean. Exit codes read on their
own line, never off a trailing command.

## A correct expression that stopped being correct

The four drivers logged their destination through
`path.relative(APP_DIR, SHOT_DIR)`. That was right while the destination sat
inside the repo. Once it moves to `%TEMP%`, the same expression prints a
`../../..` chain that **reads as a repo-relative path and is not one**. Fixing
the write without the log would have traded a dirty tree for a misleading
pointer, and the `SHOTS` line is how a human finds the captures.

Worth generalising: a path expression is only as correct as the assumption about
where the path lives, and that assumption is usually unwritten.

## Reversibility

**Reversible.** Deleting the test and reverting `ed9a490` restores the prior
behaviour. The deleted PNGs are recoverable from history (`ed9a490^`) if anyone
later argues they were a reference after all — that argument now has to defeat
#142 and #148, not just assert.

The narrow ignore rule is the part to leave alone. Broadening it to
`scripts/**/*.png` is a one-word edit that silently swallows spike-117's cited
evidence, so the reasoning is written into `.gitignore` beside the rule rather
than kept here.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]] —
  the same rot one level up, in prose rather than in a copied line.
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — #132's finding that the
  drivers' assertions never executed. This is its hygiene twin: there the
  *checks* did not run, here the *convention* did not.
