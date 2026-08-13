---
type: pick-up
project: claude-wrapper
updated: 2026-08-14
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

**Landmines, gate shapes and standing constraints live in [[active-work]]**, not
here. This file is the baton: what just finished, and what is next.

## What just finished

**Gauntlet run 3 — twelve waves over the five core surfaces — is closed, committed,
pushed and PR'd.**

- Commit `358ab96` on `gauntlet/core-after-docks`, 13 commits ahead of `main`.
- **PR #171** open against `main`. Not merged.
- `stop: true` in **both** `.claude/gauntlet.md` and `.claude/relay/gauntlet.md`.
  **No leg 14 will spawn**, and re-invoking `/relay N=1 /preset gauntlet` will not
  resume this run.

**The run ended on its budget, not on plateau — cut off, not converged.** The
`plateau` counter finished at 0 and never exceeded 2 in twelve waves. That is the
run's headline and it is about the instrument, not the app:
[[2026-08-14-a-stop-signal-that-resets-on-grader-noise-can-never-fire]].

Final wave landed one code change — `.effort-range` **68px → 130px** — on the
owner's explicit go, after being shown that wave 12's critic asked for the opposite
of what wave 11's critic had asked for.

## The single next task

**Nothing is queued. The next move is the owner's, on PR #171.** Three shapes, and
they are genuinely different decisions:

1. **Merge it** — takes the design pass plus 24MB of run evidence onto `main`.
2. **Merge the code only** — cherry-pick or squash `src/` + `tests/` and leave the
   `.gauntlet/` record on the branch. The real diff is **9 files, +879 / −72**:
   `git diff main...gauntlet/core-after-docks -- src/ tests/`
3. **Close it** and keep the branch as the record.

If the owner asks to act on the run's leftovers instead, all four open items are in
[[active-work]] under "Open" — every one is an owner or product call, **none is
blocked on code**, and none has a ticket yet.

## Before starting a gauntlet run 4

Two things that will waste a night if skipped:

- **Check the non-Anthropic quotas are live**, not just `wisp routing`. Run 3's
  closing wave ran `critic_degraded: true` because grok and codex were exhausted —
  the routing table looked like drift and was actually a deliberate allocation. A
  run whose critic is same-vendor throughout cannot make the claim the preset exists
  to make.
- **Budget `max_waves` as the real stop condition.** `plateau >= 3` has now failed
  to fire across two consecutive runs; do not plan around it.

## One measurement trap worth carrying

**A byte-identical control is not a bit-exact instrument.** Re-capturing an unchanged
tree moves ~3 pixels by ±1 on one channel, and those pixels **round-trip** to their
exact prior values while real content does not. Diff RGB with a tolerance; do not
read one byte of PNG size drift as evidence something changed, and do not read a
clean sha256 as a promise it stays clean.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
