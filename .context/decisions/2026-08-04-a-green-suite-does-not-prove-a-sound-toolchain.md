---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision, testing, environment]
---

# A green suite does not prove a sound toolchain

Mid-way through #112's leg, `npm test` stopped running at all:

```text
⎯⎯⎯⎯⎯⎯⎯ Startup Error ⎯⎯⎯⎯⎯⎯⎯⎯
SyntaxError: Unexpected token ')'
    at compileSourceTextModule (node:internal/modules/esm/utils:344:16)
```

No file name, no line, no test executed — and the same suite had passed
**1034/68** forty minutes earlier with no dependency installed in between.

## What it actually was

**One byte in a dependency had flipped.** In
`node_modules/@vitest/mocker/dist/chunk-hoistMocks.js:583`, a TAB inside the
indentation had become `)`:

```text
\t\t\tconst { argument } = node;      ← correct
\t)\tconst { argument } = node;       ← on disk
```

Not a tracked file, not touched by any command this leg ran, `mtime` still the
July install date. `npm test`, `npm run typecheck` and `npx vitest --version` all
behaved differently, which is what made it look like a code problem.

## Decision

**When the toolchain fails in a way your change could plausibly have caused,
separate the two before debugging either: stash everything and run the suite on
the clean tree.**

```bash
git stash push -u -m wip && npm test    # clean tree still red → not your change
```

That one command turned "my new module broke vitest" into "this machine broke
vitest", and it costs one minute. Everything after it — bisecting to the failing
import chain, then `node --check` over the candidate packages until one file
named itself — only made sense once the change was excluded.

The repair was the single byte, verified three ways: `node --check` on the file,
then the full suite on the **clean tree** reproducing the recorded baseline
exactly (**1026/67**), then the suite on the working tree (**1034/68**).
Reproducing the recorded baseline is the part that matters — it is the positive
control that says the repair restored the prior state rather than merely stopping
the error.

## Why this is worth a page

**A green suite is evidence about the code, conditional on the runner being
sound.** This repo leans hard on that suite: every ticket lands on "gate green",
and mutation testing infers the *test's* sensitivity from the same runner. A
corrupted runner does not fail gracefully into "0 tests passed" — here it failed
into a syntax error that pointed nowhere and looked authored.

Two things follow, both cheap:

- **A test count that moves for no reason is a signal.** The recorded baselines
  (`1026/67` → `1034/68`) are what made "the clean tree reproduces exactly"
  checkable at all. `.context/`'s habit of writing the exact count down stopped
  being bookkeeping this leg.
- **Silent corruption is not necessarily syntactic.** One flipped byte inside a
  string or an identifier would parse fine and change behaviour with no error.
  The suite passing is the practical check that the loaded tree is sane; it is
  not a proof, and if results ever look impossible, suspect the tree before the
  logic.

## Reversibility

The repaired file is inside `node_modules/` and is **not** in version control —
a fresh `npm ci` replaces it, and any clone is unaffected. The corrupt original
was kept outside the repo for the duration of the leg only. Nothing in `src/`,
`tests/` or the lockfile changed for this.

## Related

- [[decisions]]
- [[overview]] · [[active-work]] · [[pick-up]]
- [[2026-08-04-the-wait-moved-it-did-not-vanish]] — the same leg's ticket, whose
  before/after was re-measured on this machine rather than compared against a
  committed artifact, for the same reason this page exists
