---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 2 — owner away_
_At commit: `ed9a490` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 landed **#146**. **Ten tickets remain at
`ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/146-screenshot-dir` was squash-merged and
  deleted (content diffed against `main` first — a squash merge does not mark a
  branch merged, so `git branch -d` refuses and the diff is what makes `-D`
  safe). Tree clean on `main`.
- **Closed 2026-08-11 (leg 2):** **#146** (`ed9a490`). Nothing filed.
- **Open and agent-ready (10):** #138, #139, #140, #141, #142, #143, #145, #147,
  #148, #150. **#144 stays `needs-triage` deliberately** — its settled half is
  #150, and closing #144 because #150 landed is the exact failure the split was
  reviewed against.
- **Next:** **#142** — pin the fixture workspace directory name. It carries a
  ruling with a design-changing constraint; see [[pick-up]].
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **91 files / 1340 passed + 36 skipped** (was 90 / 1337; the +1 file and +3
  tests are exactly `tests/driver-screenshot-dir.test.ts`). Ran on the branch and
  again on `main`. **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 4 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #146 actually was

Four drivers — `gui-119`, `gui-122`, `gui-123`, `gui-124` — hardcoded their
captures to `scripts/gui-<n>-shots/` while the other **thirty-four** read
`SCREENSHOT_DIR`. Those directories were tracked, so one `npm run test:dom`
rewrote committed PNGs, and the standing workaround was a note in the skill
telling humans to `git checkout -- scripts/` before committing anything else.

The captures are settled as **leftovers, not a reference.** #142 and #148
establish two independent sources of run-to-run drift, and a capture nobody can
diff is not a baseline.

## The transferable half

**A convention nothing executes is a style preference.** The canonical line was
already unanimous in thirty-four files and still drifted in four, because nothing
ran it. A new driver copies whichever sibling it was pasted from.

That is #149's lesson one granularity down: there a list restated in prose
drifted from the code, here a **line copied between files** drifted from its own
intent. The repeated thing had no single place that could be wrong, so it was
wrong in four places for as long as nobody looked.

**The second assertion is the one worth defending.** The test holds two defects
apart: a driver that ignores `SCREENSHOT_DIR`, and one that honours it but
defaults back inside the repo. Mutation proved (2) is not redundant —
`process.env.SCREENSHOT_DIR || path.join(APP_DIR, 'scripts', ...)` **passes (1)
and reds only (2)**, a form that satisfies every word of the ticket and
reintroduces the churn for every manual run.

**The mandated ordering earned its keep.** Proving no consumer *before* deleting
found that `scripts/spike-117-shots/` **is** consumed — cited by path in
`spike-117-findings.json` and `spike-117-findings.md` as the evidence behind a
recorded finding. That also resolved a wrong number in the ticket body: it said
nine tracked files, five were tracked under `gui-*-shots`, and the nine folded in
spike-117's four. The ruling's instruction to keep the ignore rule narrow is what
protected them; `scripts/**/*.png` would have concealed live evidence while
looking like tidier housekeeping.

## Carried forward for the next leg

**The bar discrepancy #149 deliberately left open is still open.** `.context/`
prose has said the three docks *"share the Sidebar's reference"*, but
`.gauntlet/bar/README.md`'s own "What each reference judges" table already
assigns `linear/linear-features.png` to *"Titlebar + docks: control grouping,
iconography"*. **Read the table, not the prose.** The table is the owner-confirmed
half of a human-owned artifact, so no agent has rewritten it. **Settle it before
the gauntlet seed reads it**, since the seed picks references from that table.

**The `pieces` cap is a budget, not a scope statement.** Nine captured surfaces,
`pieces` capped at 6 and fixed at seed, so one run cannot take all nine. A seed
picking a subset is not evidence the unpicked surfaces lack a standard.

## The correction to carry

**A correct expression can stop being correct without changing.** The four
drivers logged their destination through `path.relative(APP_DIR, SHOT_DIR)`,
right while the destination sat inside the repo. Once it moves to `%TEMP%` the
same expression prints a `../../..` chain that **reads as a repo-relative path
and is not one**. Fixing the write without the log trades a dirty tree for a
misleading pointer.

## Pick up here

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

The tracker is the authority; this file has been wrong before. Recommended order
and its reasons are in [[pick-up]]. **#138 before the gauntlet seed** remains the
sharpest ordering constraint: `bar_win` requires *"one type scale holds across
all of them"* and the app ships two, so every per-surface verdict is confounded
until #138 lands.

## Standing constraints for any leg touching the renderer

Unchanged, and all still hold: no em dashes in user-visible strings
(`tests/copy-em-dash.test.ts` compiles `src/`); the stylesheet pins are
literal-text and brittle (D3); any CSS change owes a driver pin that **runs**,
naming which gate runs it (D4) — jsdom loads no CSS, so the fast gate
structurally cannot see layout; the titlebar's centring is load-bearing (#136);
the identity mark is solid by design; colour and translucency are instrument
artifacts in any capture; `DESIGN.md` is read literally by
`tests/subagent-material.test.ts`, which splits on `\n## Bans in force\n` — #140
edits that section, so the split token must survive verbatim. Full text in
[[pick-up]].

Carried from leg 1, unchanged:

- **`inspect.mjs`'s surface list is gated in three places.** Adding or removing a
  surface means editing `SURFACES`, `SKILL.md` **and** `.gauntlet/bar/README.md`,
  inside their `surfaces:begin` / `surfaces:end` markers. The bar's edit is a
  deliberate change to the standard, not bookkeeping.

New from this leg:

- **A driver's capture destination is now a checked property.**
  `tests/driver-screenshot-dir.test.ts` reds if any driver hardcodes its output
  or defaults it back inside the repo. A new driver must use
  `process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.
- **`scripts/gui-*-shots/` is gitignored, narrowly and on purpose.** Do not
  broaden it to `scripts/**/*.png` — that swallows `scripts/spike-117-shots/`,
  which two findings files cite by path. The reasoning lives beside the rule in
  `.gitignore`.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**#144 stands unanswered**, and #150 is its settled half sitting in the queue.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
