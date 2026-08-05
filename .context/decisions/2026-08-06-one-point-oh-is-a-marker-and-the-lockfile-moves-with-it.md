---
type: decision
project: claude-wrapper
date: 2026-08-06
updated: 2026-08-06
tags: [context, decision, release, tooling]
---

# 1.0.0 is a marker, not a release — and the lockfile moves with it

## Decision

**#128 bumped `package.json` from `0.1.0` to `1.0.0` and closed spec #120.**
Landed as `024361a`. Two things are settled by it.

**First: the version number here is a marker with no release mechanism behind
it.** Nothing publishes. `git tag` count is **0**, there is **no
electron-builder config**, and the standing decision is still
[[2026-07-22-dev-run-only]] — `npm run dev`, no installer. Nothing in `src/` or
`electron.vite.config.ts` reads the version: `getVersion`, `__APP_VERSION__` and
any `package.json` read all return **zero matches**.

The strongest evidence is free and came from the gate itself. The post-bump
build emitted **byte-identical asset hashes** to the pre-bump build —
`index-DbK37Ya4.js`, `index-BA2EmCiB.css`. A content hash cannot be identical
across a change the bundle observed, so the version demonstrably does not enter
it. That is a stronger claim than the grep, and it costs nothing because the
gate builds anyway.

**Second: a version bump in this repo touches two files, not one.** The ticket
predicted a one-line diff. `package-lock.json` is **tracked** and mirrors the
version in **two** places — its root object and its `packages.""` entry. So the
bump went through the standard tool:

```
npm version 1.0.0 --no-git-tag-version
```

which moves both files, and creates **no tag and no commit of its own** (`git
tag` asserted still `0` afterwards). Diff: three lines, two files, no dependency
entry changed.

## Why

**On the marker.** "1.0.0" reads as a release to anyone arriving later, and the
natural next thoughts — tag it, publish it, add an About box showing it — are
all things this repo deliberately does not do. Recording the bump *without*
recording that nothing publishes would leave the record implying a release that
never happened. #128's own body warned against the scope creep; this entry is
what stops it being re-proposed from a blank slate.

The bump was still worth taking on its own terms: it was the owner's ask, placed
"towards the end" by their own instruction, and the tracker enforced that
ordering with seven native blocking edges rather than with prose.

**On the lockfile.** Bumping `package.json` alone would not have been wrong so
much as **half-done**: the next `npm install` anyone ran would have silently
rewritten the lockfile, turning a clean one-line bump into a spurious diff
landing in some later leg's working tree, attributed to whatever they were
actually doing. The deviation from the ticket's "one line" is the same fact
recorded in the two files npm keeps in sync — not scope creep, and reaching for
npm's own tool rather than hand-editing is what keeps them in sync without
anyone having to remember the second file exists.

**On the gate.** The ticket's real substance was never the edit — it was the
precondition. A 1.0.0 shipped on a red gate is worse than no bump. So the gate
ran **twice**: on `main` before the bump, and again on `main` after the merge
rather than inferred from the branch. Typecheck clean, **1246 tests / 82
files**, build clean, both times. Baseline unchanged from #126 and #127, which
is correct — a spike and a version bump add no tests.

## Reversibility

**Trivial.** Three lines across two npm-managed files, revertible with one
`npm version 0.1.0 --no-git-tag-version`. No tag was cut, nothing was published,
no consumer exists, and no code path reads the value — the identical build
hashes prove the last point rather than assuming it.

What is *not* free to reverse is the reading: once a repo says 1.0.0, later work
tends to assume a release process exists. That is why this entry exists rather
than just the commit.

## Related

- [[decisions]]
- [[2026-07-22-dev-run-only]] — the standing no-installer decision this rests on
- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]] — the spike that filed #129, the work that outlives this spec
- [[active-work]] · [[pick-up]]
