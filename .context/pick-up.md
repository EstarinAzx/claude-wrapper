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

**Gauntlet run 3 is fully wound up. Its code is on `origin/main`; its evidence is on
a closed-PR branch; nothing is queued.**

| commit | on `origin/main` | what |
|---|---|---|
| `1d919fb` | yes | the design pass over the five core surfaces — 9 files, +879 / −72 |
| `259b70e` | yes | wave 6's twelfth capture, `window-session-short.png` |

Both were verified **tree-identical** to `gauntlet/core-after-docks` before
committing — two-dot `git diff <branch> -- <paths>`, not three-dot. D7 gate green on
`1d919fb`: typecheck clean, **96 files / 1412 passed / 43 skipped**, build clean at
`index-B0MFIfz0.css` (seed was `index-DOI17h8g.css`, which independently confirms
`src/` moved).

**PR #171 is CLOSED, unmerged, on purpose**, with the reasoning recorded as a comment
on the PR itself. `gauntlet/core-after-docks` survives on the remote at `358ab96`
holding **357 capture PNGs** plus `.claude/gauntlet.md`. That branch is now the
run's only record — **do not delete it.** Merging it would have put ~24MB into
`main`'s history permanently and preserved nothing the branch does not already hold.

Run 3 ended on `max_waves`, **cut off not converged** — `plateau` finished at 0 and
never exceeded 2 in twelve waves:
[[2026-08-14-a-stop-signal-that-resets-on-grader-noise-can-never-fire]].

## The single next task

**Nothing is queued and nothing is blocked on code.** Two things you might pick up,
neither urgent:

1. **Triage the 19 open issues** (see below). Only the owner may promote to
   `ready-for-agent`.
2. **Start a gauntlet run 4** — but read the section below first; two of its
   preconditions are currently unmet.

Run 3's four leftovers (Welcome CTA padding ratio, Sidebar duplicate-refresh
affordance, Chat disclosure state model, whether the widened effort track overshot)
are recorded in `.claude/gauntlet.md` under `### 12.10` **on the branch, not on
`main`** — `git show gauntlet/core-after-docks:.claude/gauntlet.md`. All four are
owner or product calls.

## Two git-arithmetic traps this handoff already sprang

Both cost real time on 2026-08-19; neither is hypothetical.

- **"N commits ahead of `main`" does not predict a PR's size.** The prior baton said
  the branch was "13 commits ahead of `main`" — true against *local* main, which was
  then 60 commits unpushed. The PR measured against `origin/main` showed **72 commits
  / 703 files**. Run all three and say which you mean:
  `git rev-list --count origin/main..main`, `git rev-list --count main..HEAD`,
  `gh pr view N --json commits,changedFiles`.
- **Three-dot diffs measure from the merge base, which does not move when you push
  the base branch.** PR #171 kept displaying a full `src/` diff after that code was
  already identical on `main`, because its merge base stayed at `ce90dc7`. To ask
  "do these two trees agree?", use **two-dot**: `git diff origin/main <branch> -- src/`.
  The three-dot form answers a different question — "what did this branch do?"

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
- **The instrument on `main` now captures TWELVE files, not eleven.** Wave 6 added
  `window-session-short.png` — the same session with the transcript NOT overflowing,
  which is the only frame that can show the `TODAY` date divider (`linear-changelog`
  was picked to judge exactly that, and every other capture has it above the fold)
  and the only one that measures the scrollbar seam rather than modelling it. It ran
  green for seven consecutive waves (6–12, 12 PNGs each; wave 5 had 11). A null
  control against a run older than wave 6 compares 11 files, not 12.
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
