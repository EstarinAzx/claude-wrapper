---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, testing, dom-phase, gate]
---

# A test built on ambient state measures the ambient state

## Decision

**#141 (`388959b`).** A sidecar check may declare the build artifact it reads:

```js
needsBuild: { artifact: 'out/main/index.js', covers: ['src/main'] }
```

The fast gate reports such a check as a **named skip carrying its artifact and
where it does run**; the DOM phase **executes** it, after proving the artifact is
at least as new as everything under `covers`.

**The gate still does not build, and that is the ruling rather than an
omission.** Building inside `npm test` taxes every run for two assertions, and a
separate `test:built` script nobody is forced to run rebuilds the exact hole
#132 exists to close, one level up. Declaring a requirement is the third option:
the check stays in one place and the two runners read the declaration in
opposite directions.

## The finding, which is not the decision

The rule above is unremarkable. What this leg actually learned came out of
mutation-verifying it.

`covers` is walked recursively — naming `src/main/index.ts` alone would let an
edit to any sibling module count as a fresh build. The test written for that
recursion compared two real paths in the repo:

```ts
expect(latestMtime('src/main')).toBeGreaterThanOrEqual(latestMtime('src/main/index.ts'))
```

**Delete the recursion and that test still passes.** A directory's own mtime
moves when entries are added or removed, not when a file inside is edited, so on
this particular checkout the directory happened to be new enough for the
comparison to hold. The test was measuring the state of the working tree, not
the behaviour of the function. It would have gone on passing until the day the
tree happened to look different, and then reddened for a reason nobody could
reproduce.

**Five mutations were run and four reddened.** The fifth is the one worth
keeping: an assertion can be perfectly correct, perfectly readable, sit right
next to the code it names, and still measure nothing — because its inputs came
from the environment rather than from the test.

The fix is not a better comparison. It is refusing to source the inputs
ambiently at all: a temp fixture with **one nested file stamped to a fixed
far-future mtime**, so the assertion is an equality against a number the test
chose, and deleting the recursion cannot produce it.

## Why this generalises here

This repo keeps rediscovering the same shape one level out each time.

| ticket | the green that measured nothing |
|---|---|
| #132 | assertions that ran only when a human remembered |
| #135 | a phase that could silently omit a driver |
| #145 | a quarantine listed beneath a verdict instead of carried by it |
| #150 | a tick whose name did not say what it covered |
| **#141** | **a test whose inputs came from the tree it was testing** |

The first four are about a check nobody runs. This one is about a check that
runs, is green, and is empty — which is strictly worse, because the other four
are visible in a list and this one is not visible anywhere.

**So: mutation-verify the test, not only the code.** "I wrote an assertion for
it" and "the assertion can fail" are different claims, and only the second is
worth anything. This is the same standard the drivers already hold themselves to
— `gui-93`'s header records a red-verification against `main` before the fix,
and `gui-75`'s records two absence assertions mutation-verified — now applied to
the gate's own tests.

## Consequences

- **`gui-93` was never in scope**, measured rather than read: its built-CSS
  assertion is inline in the driver, the driver is launched by the phase, and
  deleting the inset ring from the **built** stylesheet turns the phase red
  naming the rule. Already covered; not duplicated.
- **`gui-75` is the first driver with a sidecar that is also in `DOM_SKIP`.**
  Until now "has a sidecar" and "is executed somewhere" were the same claim.
  They are now different, and its browser half is still executed nowhere, so it
  carries its own named skip rather than dropping out of the no-sidecar list.
  Pinned, so the set cannot empty by accident.
- **`STALE` and `MISSING` are distinct statuses**, because they need different
  actions from the person reading them.
- **`--build-only` exists** because these checks take milliseconds and the phase
  around them takes twenty minutes. It refuses to combine with `--only`, which
  printed `BUILD REQUIREMENTS PASS (0 checked)` — a green word over an empty
  set, found while reviewing the diff rather than by a test.
- **CI is untouched**, and the question of whether it *should* host these is
  filed as **#158** rather than decided by a leg: `--build-only` needs no
  Electron and no key, but the workflow pin bans any workflow invoking
  `test:dom`, a fourth command reds the command-set pin, and the job name is the
  coverage boundary. Three standing decisions collide and at least two are
  load-bearing.

## Related

- [[2026-08-11-a-tick-must-carry-its-own-boundary]] — the same discipline one level out
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
- [[2026-08-11-a-deficit-a-reader-cannot-close-is-furniture]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[active-work]] · [[pick-up]]
