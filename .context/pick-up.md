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

## Ticket queue: ONE ticket, and CI is live now

**Triaged 2026-08-19.** 18 open issues: **1 `ready-for-agent`**, 1 `needs-info`, 16
`needs-triage`. Verify with the **API**, never the label filter (its search index
lags right after a close):

```bash
gh api "repos/EstarinAzx/claude-wrapper/issues?state=open&labels=ready-for-agent" --jq 'length'
```

- **#163 is the queue** — `gui-124`'s hardcoded 12-press Tab budget, the last of
  #143's class. Promoted because it carries **no open design question**: three
  enumerated moves, both precedents already on `main` (`1c42d3c` #143,
  `454e8de` #154). Everything else turns on a decision that is the owner's.
  Reverse with `gh issue edit 163 --add-label needs-triage --remove-label ready-for-agent`.
- **#155 is `needs-info` correctly** and is the highest-severity item open: a
  profile the app has never run in sends **no messages at all**, which is every new
  user's first launch. It is blocked on one thing only — *a human opening the app by
  hand on a clean profile*, since everything measured so far went through
  `playwright-core` with a stubbed dialog. One run decides whether it is a shipping
  bug or a harness artifact.
- **#150 CLOSED** — the `fast-gate` workflow was delivered and its acceptance 2
  ("confirm it actually runs rather than assuming it will") is now discharged by
  execution.

**Do not promote the other sixteen to refill this queue.** A chain's stop condition
is "queue empty"; promoting to keep it fed makes the stop unreachable by
construction. They are the owner's to triage.

## CI EXISTS NOW, AND IT CHANGES THE GATE

`.github/workflows/fast-gate.yml` runs `typecheck`, `test`, `build` on every push to
`main`. Before 2026-08-19 nothing had ever been pushed from this checkout, so it had
**never run**. It has now run five times.

- **The local gate is no longer the last word.** `.claude/skills/` is NOT outside the
  suite — `tests/inspect-published-list.test.ts` reads `inspect.mjs` and pins its
  `EXPECTED_FILES` expression against the counts quoted in `SKILL.md` **and**
  `.gauntlet/bar/README.md`. A commit that reasons "this path is outside tsconfig and
  vitest" instead of re-running `npm test` will red main. That happened at `259b70e`
  and was fixed at `d53fa22`. **Run the suite; do not deduce its coverage.**
- **CI runs four fewer tests than you do, by design.** Runner **1408 passed / 47
  skipped**; local **1412 / 43**; same 1455 total.
  `tests/transcript-rewind-real-store.test.ts` skips where there is no `~/.claude`
  store. Measured on run `32225857209`, not predicted. That is #157's subject.
- **CI does NOT cover the DOM phase**, and the job name says so. `npm run test:dom`
  is separately **already red on `main`'s lineage** for four environment reasons
  (`gui-49`, `gui-95`, `gui-94`, `gui-123`/#155) — see #168. **Re-baseline before
  blaming your change.**

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
