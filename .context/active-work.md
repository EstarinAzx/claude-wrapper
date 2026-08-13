---
type: active-work
project: claude-wrapper
updated: 2026-08-14
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-14 by Opus 5, relay chain gauntlet leg 13 — owner present_
_At commit: `358ab96` on `gauntlet/core-after-docks`, pushed, PR #171 open_

## Current focus

**Gauntlet run 3 is DONE and the chain is stopped.** Twelve waves over the five core
surfaces, closed at wave 12 on the `max_waves` budget backstop. `stop: true` is set in
**both** `.claude/gauntlet.md` and `.claude/relay/gauntlet.md`, so no leg 14 spawns and
re-invoking `/relay N=1 /preset gauntlet` will not resume this run.

**The run was cut off, not converged** — say it that way. It never plateaued: the
counter finished at **0** and never exceeded 2. Run 2 ended the same way. Full
reasoning in
[[2026-08-14-a-stop-signal-that-resets-on-grader-noise-can-never-fire]] and in
`.claude/gauntlet.md` § 12.10.

**Nothing is in flight.** The next move is the owner's: merge, revise or close PR #171.

Verify rather than trust this file:

```bash
gh pr view 171 --json state,mergeable -q '.'
git log --oneline main..gauntlet/core-after-docks | wc -l   # expect 13
git diff main...gauntlet/core-after-docks --stat -- src/ tests/
```

## State

- **In flight:** nothing. Tree clean on `gauntlet/core-after-docks`, pushed, upstream
  tracked, local and remote both at `358ab96`.
- **Open PR:** **#171** — `design: twelve-wave gauntlet pass over the five core
  surfaces`, base `main`. **Not merged, not requested to merge.**
- **Landed 2026-08-14 (wave 12, final):** `composer.css` `.effort-range`
  **68px → 130px**, one declaration plus its derivation comment. Six stops, 10px thumb,
  travel 120, **24.00px per interval** — which is already the app's base interval
  (`chat.css` line 74). Owner said land it after being shown the disagreement below.
- **Landed waves 1–11 (2026-08-12 → 08-13):** the rest of the design pass. Two
  behavioural changes across the whole run — `avatarRun` grouping in `Chat.tsx` (one
  avatar per turn, continuation rows keep the avatar's *box* so `.assistant-body`'s
  `max-width: 75%` still resolves against a full-width row), and `--mark-depth` as a
  composed layer token in `tokens.css` covering all three mark sizes. Everything else
  is spacing, rhythm and type.

## The review surface is not the branch

The branch carries **24MB across 632 files under `.gauntlet/`** — twelve waves of
captures, critic reports and a ~4,300-line adjudication log. That is evidence, not
change. The code is **9 files, +879 / −72**:

```bash
git diff main...gauntlet/core-after-docks -- src/ tests/
```

## Gate at close

`npm run typecheck` clean · `npm test` **96 files / 1412 passed / 43 skipped** ·
`npm run build` clean · `npm run test:dom` **36/39** with the same three standing
non-PASS this branch inherited (`gui-94`, `gui-95` FAIL, `gui-123` UNSCORED) plus the
accounted `gui-119` UNCOVERED. **No new failures.**

⚠️ **One deviation, recorded rather than papered over:** wave 12 built *before* taking
its own `test:dom` PRE baseline, so that 36/39 is a **post-only** reading compared
against wave 11's standing figure, not a matched pair. The change is CSS-only and
`npm test` came back identical to the builder's own pre-edit run, so the comparison
holds — but it is not the control waves 8–11 ran.

## Two instrument findings that outlive this run

1. **`plateau >= 3` is not a reachable stop condition here.** Seven of twelve waves had
   the counter reset by a verdict that moved on a byte-identical or ±1-pixel-identical
   capture. Budget `max_waves` as the real stop; do not plan around plateau.
2. **The `inspect.mjs` capture pipeline is NOT bit-exact.** Rebuilding an unchanged tree
   moved 6 RGB pixels, every delta ±1 on one channel, and they **round-trip** to
   byte-identical values. Content does not round-trip; rasterisation noise does. Diff
   RGB **with a tolerance** — a clean sha256 is not a guarantee it stays clean, and one
   byte of PNG drift is not evidence anything changed.

## Open, and all of it is owner or product calls — none blocked on code

| item | shape |
|---|---|
| Welcome CTA pill padding-to-label ratio | **New axis**, arrived on the last wave with no wave left to test it. ~200×52px pill around a ~13px label. |
| Sessions rail offers refresh twice | Icon in the `SESSIONS` title row, plus a "Refresh" button ~30px below. New and fair; product call which survives. |
| Chat disclosure rows at rest | Asked **four** times (9.7, 10.7, 11.7, 12.7). Needs a `ToolCard.tsx` state decision — it is JSX and state, not CSS. |
| Is the widened effort track right? | Wave 12 built exactly what wave 11's critic asked; wave 12's critic then asked for **half** the width. Confounded by the vendor change, **unresolvable without a wave 13**. |

## Landmines

**Do not re-seed run 3.** `.claude/gauntlet.md` has `stop: true`. A run 4 means a fresh
`slug` and a fresh `/preset bar` decision, not a revival — and `/preset gauntlet` refuses
to start without a bar, by design.

**A gauntlet run cannot take all nine surfaces at once.** `pieces` is capped at 6 and
fixed at seed — a budget, not a claim that the unpicked surfaces lack a standard.

**The cross-vendor critic depends on quota.** Run 3's closing wave ran degraded because
grok and codex were exhausted. Before starting a run 4, check `wisp routing` **and**
whether the non-Anthropic quotas are live — a run whose critic is same-vendor throughout
cannot make the claim the preset is built on.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-14-a-stop-signal-that-resets-on-grader-noise-can-never-fire]]
- [[2026-08-12-evidence-may-not-destroy-the-verdict-and-the-renderer-cannot-see-a-stalled-compositor]]
- [[2026-08-12-a-ban-is-satisfied-by-the-absence-of-what-it-bans]]
- [[2026-08-12-awaiting-the-mechanism-is-half-a-fix-and-the-timeout-is-bounded-at-both-ends]]
- [[2026-08-11-a-permission-outlives-the-thing-it-permits-unless-both-are-pinned]]
- [[2026-08-11-a-value-check-outlives-its-warrant-unless-the-warrant-is-checked-too]]
- [[2026-08-11-a-ratio-rule-is-tested-as-a-ratio-and-its-tolerance-is-set-by-the-rungs-it-already-admits]]
- [[2026-08-11-a-test-built-on-ambient-state-measures-the-ambient-state]]
- [[2026-08-11-a-tick-must-carry-its-own-boundary]]
- [[2026-08-11-a-deficit-a-reader-cannot-close-is-furniture]]
- [[2026-08-11-a-green-inherited-from-the-machine-is-not-evidence]]
- [[2026-08-11-a-symptom-that-left-is-not-a-defect-that-was-fixed]]
- [[2026-08-11-the-premise-is-what-feeds-the-surface-not-what-two-runs-agree-on]]
- [[2026-08-11-a-behavioural-constraint-cannot-be-pinned-as-text]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
