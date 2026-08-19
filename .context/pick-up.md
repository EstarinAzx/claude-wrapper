---
type: pick-up
project: claude-wrapper
updated: 2026-08-19
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

**Landmines, gate shapes and standing constraints live in [[active-work]]**, not
here. This file is the baton: what just finished, and what is next.

## Read this on `main`, and only on `main`

**A baton committed to `main` is invisible to a session sitting on a branch.** The
previous pick-up cost a session exactly that: `gauntlet/core-after-docks` still
carries the *seed-time* baton claiming "wave 1 is running", nine waves after wave 1
finished. If you booted on a branch, `git show main:.context/pick-up.md` before
believing anything.

## What just finished

**Gauntlet run 3's code pass is landed on local `main` as `1d919fb`.**

The twelve-wave design pass over the five core surfaces squashed to what it actually
changed in the app: **9 files, +879 / −72**, tree-identical to
`gauntlet/core-after-docks` for `src/` and `tests/`. D7 gate green on the commit —
typecheck clean, **96 files / 1412 passed / 43 skipped**, build clean at
`index-B0MFIfz0.css` (seed was `index-DOI17h8g.css`, which independently confirms
`src/` moved).

**The run evidence was deliberately NOT merged.** ~694 files of captured PNGs and
wave state stay on `gauntlet/core-after-docks`, which is pushed. Merging them would
put ~24MB into `main`'s history permanently and preserve nothing the branch does not
already hold.

Run 3 ended on `max_waves`, **cut off not converged** — `plateau` finished at 0 and
never exceeded 2 in twelve waves:
[[2026-08-14-a-stop-signal-that-resets-on-grader-noise-can-never-fire]].

## The single next task

**Two owner calls, both about publishing. Nothing is blocked on code.**

1. **`main` is 61 commits ahead of `origin/main` and has never been pushed.** That
   is not new breakage — it predates run 3 by 60 commits — but `1d919fb` now sits on
   top of it. **D6: no agent pushes on its own initiative.**
2. **PR #171 is still open**, and its meaning has changed. Its code is now redundant
   with `main`; what remains is purely the evidence bundle. Close it, or leave it as
   the record of the run.

**Beware the commit arithmetic on that PR.** The old baton said the branch was "13
commits ahead of `main`" — true against *local* main. PR #171 on GitHub is measured
against `origin/main`, so it shows **72 commits / 703 files / +46,741 −2,261**. The
number that describes the design work is neither: it is 9 files, +879 / −72.

## Ticket queue: dry, and no leg may refill it

**`ready-for-agent` = 0**, verified via the API, not the label filter:

```bash
gh api "repos/EstarinAzx/claude-wrapper/issues?state=open&labels=ready-for-agent" --jq 'length'
```

**19 issues open**, all `needs-triage` / `needs-info`, several filed by legs
(#162–#167). **They are the owner's to triage — promoting any of them makes a
chain's stop condition unreachable by construction.**

Run 3's four leftovers (Welcome CTA padding ratio, Sidebar duplicate-refresh
affordance, Chat disclosure state model, whether the widened effort track overshot)
were **deliberately not filed as tickets** — 19 untriaged issues already exist, and
adding four more to a queue nobody is draining is noise, not progress. They are
recorded in `.claude/gauntlet.md` under `### 12.10`.

## Before starting a gauntlet run 4

Two things that will waste a night if skipped:

- **Check the non-Anthropic quotas are live**, not just `wisp routing`. Run 3's
  closing wave ran `critic_degraded: true` because grok and codex were exhausted —
  the routing table looked like drift and was actually a deliberate allocation. A
  run whose critic is same-vendor throughout cannot make the claim the preset exists
  to make.
- **Budget `max_waves` as the real stop condition.** `plateau >= 3` has now failed
  to fire across two consecutive runs; do not plan around it.
- Run 4 means a **fresh slug and a fresh `/preset bar` decision**. `stop: true` is
  set in both `.claude/gauntlet.md` and `.claude/relay/gauntlet.md`; run 3 cannot be
  revived.

## One measurement trap worth carrying

**A byte-identical control is not a bit-exact instrument.** Re-capturing an unchanged
tree moves ~3 pixels by ±1 on one channel, and those pixels **round-trip** to their
exact prior values while real content does not. Diff RGB with a tolerance; do not
read one byte of PNG size drift as evidence something changed, and do not read a
clean sha256 as a promise it stays clean.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
