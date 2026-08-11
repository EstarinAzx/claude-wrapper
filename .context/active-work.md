---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 7 — owner away_
_At commit: `40135ec` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 **#146**, leg 3 **#142**, leg 4 **#148**, leg 5
**#143**, leg 6 **#147**, leg 7 **#145**. **Five tickets remain at
`ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/145-uncovered-contract-deficit` was
  squash-merged and deleted (content diffed against `main` first — a squash merge
  does not mark a branch merged, so `git branch -d` refuses and the empty diff is
  what makes `-D` safe). Tree clean on `main`.
- **Closed 2026-08-11 (leg 7):** **#145** (`40135ec`). **Filed #156** at
  `needs-triage`.
- **Open and agent-ready (5):** #138, #139, #140, #141, #150.
  **#144, #151, #152, #153, #154, #155, #156 are all `needs-triage`** and none
  may be promoted by a leg.
- **Next:** **#150** — CI for the headless gate only. Leg 7 changed what this
  ticket must not do; see below.
- **Gate on `main` after the merge:** typecheck clean, **94 files / 1373 passed +
  35 skipped** (was 94 / 1368 + 35). The +5 tests are exactly the new
  `#145` describe block. Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 15 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #145 built, and the one line #150 must not get wrong

The `desktop-exclusive` quarantine for `gui-119` is **accepted**. What the ticket
actually delivered is the half the cross-model objection asked for: the deficit
moved **into** the verdict rather than being printed under it.

**The phase now has three verdicts, and only one is a defect:**

| verdict | means | exit |
|---|---|---|
| `DOM PHASE PASS` | everything the phase covers ran, and passed | 0 |
| `DOM PHASE INCOMPLETE` | nothing that ran broke, but a contract was never checked | 0 |
| `DOM PHASE FAIL` | something that ran broke | 1 |

**#150 must read the verdict WORD, not just `$?`.** `INCOMPLETE` deliberately
exits 0 — a batch can never hand a driver the desktop foreground, so failing on
it would make the phase red permanently, and an exit code that is always 1
carries as much information as one always 0. Full reasoning, including how to
overturn it in one line, in
[[2026-08-11-a-deficit-a-reader-cannot-close-is-furniture]].

**Only `desktop-exclusive` counts toward the deficit.** A deficit a reader can
close is a deficit; one they cannot is wallpaper. `api-cost` is a standing
decision about money and credentials; `no-verdict` has no contract to leave
uncovered.

**`npm run test:dom -- --only gui-119.mjs` is now a named release step** in
`SKILL.md`, and it is the only way this phase's report reaches a clean
`DOM PHASE PASS`.

## The DOM phase's current reds — one is new and one is now filed

A full run on the branch was **25/30**, same count as leg 6 but a **different
set**:

| driver | this leg, in batch | this leg, alone | verdict |
|---|---|---|---|
| `gui-95` | FAIL | — | pre-existing, uninvestigated |
| `gui-49` | FAIL | — | pre-existing, uninvestigated |
| `gui-123` | UNSCORED | — | **#155**, as designed |
| `gui-94` | FAIL | **PASS** | load artifact, not filed |
| `gui-91` | FAIL | **FAIL once, then PASS ×3** | **#156, intermittent ~1 in 7** |
| `gui-93` | **PASS** | — | was batch-red at leg 6 |
| `gui-124` | **PASS** | — | was batch-red at leg 6 |

**A confound this leg introduced, stated rather than buried:** a batch of five
single-file vitest mutation runs ran concurrently with part of that phase. That
is load, and both new reds are `TimeoutError` on `page.screenshot()`. The
`gui-91` isolated failure happened afterwards with nothing else running, which is
why it is filed and `gui-94` is not.

**`gui-93` and `gui-124` flipping to green without explanation** is the standing
gap: there is still **no full-phase baseline on an unmodified tree**, so
batch-only behaviour in this set remains unattributed rather than understood.

## Carried forward, unchanged from leg 6

**#155 is the biggest open finding and it is not a driver bug.** On a profile the
app has never started in, **no message sends at all** — measured one variable at
a time (not the zero-turn trick, not the Enter path, not zoom, not localStorage).
A profile the app has never started in is every new user's first launch. **What
has not been done, and it is one run:** open the app **by hand** on a clean
profile and type a message. Everything so far went through `playwright-core` with
a stubbed `dialog.showOpenDialog`, so nobody has ruled out the harness.

**`main` is intermittently red on `session-title-enrichment` (#153)** — 4 of 7
full runs at leg 5, green on all three at leg 6 and both at leg 7. Not evidence
it is fixed. A single red is not evidence your change broke something.

**The bar discrepancy #149 left open is still open.** `.context/` prose has said
the three docks *"share the Sidebar's reference"*, but `.gauntlet/bar/README.md`'s
own "What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose.** Owner-owned artifact.
**Settle it before the gauntlet seed reads it.**

**#138 before the gauntlet seed** remains the sharpest ordering constraint:
`bar_win` requires *"one type scale holds across all of them"* and the app ships
two, so every per-surface verdict is confounded until #138 lands.

**Wave captures across the #148 and #147 boundaries compare different fixtures
and different profiles.** Byte comparison is not meaningful across either.

## Pick up here

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

The tracker is the authority; this file has been wrong before. Recommended order
and its reasons are in [[pick-up]].

## Standing constraints for any leg touching the renderer

Unchanged, and all still hold: no em dashes in user-visible strings
(`tests/copy-em-dash.test.ts` compiles `src/`); the stylesheet pins are
literal-text and brittle (D3); any CSS change owes a driver pin that **runs**
(D4) — jsdom loads no CSS, so the fast gate structurally cannot see layout; the
titlebar's centring is load-bearing (#136); the identity mark is solid by design;
colour and translucency are instrument artifacts in any capture; `DESIGN.md` is
read literally by `tests/subagent-material.test.ts`, which splits on
`\n## Bans in force\n` — #140 edits that section, so the split token must survive
verbatim. Full text in [[pick-up]].

Carried from earlier legs, unchanged:

- **`inspect.mjs`'s surface list is gated in three places** — `SURFACES`,
  `SKILL.md` **and** `.gauntlet/bar/README.md`, inside their
  `surfaces:begin` / `surfaces:end` markers. Only that delimited region of
  `SKILL.md` is pinned; the rest of the document is free.
- **A driver's capture destination is a checked property**
  (`tests/driver-screenshot-dir.test.ts`), and `scripts/gui-*-shots/` stays
  narrowly gitignored — do not broaden it to `scripts/**/*.png`.
- **Run `inspect.mjs` one at a time.** Its workspace directory name is fixed.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are
  FIVE.** A `*.source.mjs` sidecar is exempt.
- **Isolation is a property of the launch** (#147). New driver → spread
  `...profileArgs()` from `driver-profile.mjs`, or the fast gate reds it. **No
  opt-out list, and do not add one.** The profile is per driver **PROCESS**, not
  per launch.
- **A driver may decline to answer.** Exit 2 → `UNSCORED`. Use it when the premise
  broke and the run never reached its subject.
- **A driver that pins persisted app state must read it back** (#143).
- **Do not read the phase's verdict off a compound command.** It has reported
  exit 0 while its text said `DOM PHASE FAIL` — any trailing command replaces the
  status.

New from this leg:

- **A quarantine that the verdict does not carry is a green.** If a future skip
  category becomes closeable by a human, it belongs in `UNCOVERED_CATEGORY` in
  `drivers.manifest.mjs` — and if it is not closeable, it does not.
- **Logic the fast gate must execute cannot live in `dom-phase.mjs`.** Same rule
  as `inspect.mjs` (#142, #148): the file spawns drivers at import. Put it in
  `drivers.manifest.mjs`, which both sides already import.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**#144 stands unanswered**, and #150 is its settled half, now at the front of the
queue. **#151, #152, #153, #154, #155 and #156 are all `needs-triage`.** #155
remains the one worth reading first, and it needs a human at a keyboard.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
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
