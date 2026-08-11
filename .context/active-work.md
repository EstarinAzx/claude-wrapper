---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 8 — owner away_
_At commit: `622bb8d` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 **#146**, leg 3 **#142**, leg 4 **#148**, leg 5
**#143**, leg 6 **#147**, leg 7 **#145**, leg 8 **#150's work**. **Four tickets
remain at `ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/150-fast-gate-ci` was squash-merged and deleted
  (content diffed empty against `main` first). Tree clean on `main`.
- **Landed 2026-08-11 (leg 8):** the whole of **#150** as `622bb8d`.
  **Filed #157** at `needs-triage`.
- **#150 is still OPEN, at `needs-info`, and that is deliberate** — see the next
  section. It is off the queue; do not pick it up.
- **Open and agent-ready (4):** #138, #139, #140, #141.
  **#144, #151, #152, #153, #154, #155, #156, #157 are `needs-triage`** and none
  may be promoted by a leg.
- **Next:** **#141** — execute the two build-artifact driver assertions in the
  gate. Verify `gui-93` is not already covered before writing anything.
- **Gate on `main` after the merge:** typecheck clean, **95 files / 1382 passed +
  35 skipped** (was 94 / 1373 + 35). The +1 file and +9 tests are exactly the new
  `fast-gate` pin. Build clean. Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 16 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## This repo now has CI, and it has never been observed running

`.github/workflows/fast-gate.yml` — on push, `windows-latest`, running exactly
`npm run typecheck`, `npm test`, `npm run build`.

**Nothing has ever been pushed from this checkout, so no run exists.** That is
the entire reason #150 stayed open: its acceptance 2 asks for the workflow
*confirmed running*, which needs a push, and **D6 forbids a leg pushing on its
own initiative**. Everything verifiable without one was verified — fresh clone of
`main`, `npm ci` from the lockfile on a bare tree, the three commands in workflow
order, all green; the YAML parsed rather than eyeballed; both action major tags
resolved live (`actions/checkout@v7`, `actions/setup-node@v7` — the obvious guess
`v5` is two majors stale).

**One action closes it, and it is the owner's:** `git push origin main`, watch
the first `fast-gate` run, close #150 on green.

**The coverage boundary lives in the job name**, not only in a summary page —
`fast gate (typecheck, test, build) — does NOT cover the DOM phase` is what
renders beside the tick, and the tick is what gets read as "the repo is fine".
Full reasoning in [[2026-08-11-a-tick-must-carry-its-own-boundary]].

## Two new landmines from this leg

**`tests/fast-gate-workflow.test.ts` pins the workflow as text.** Editing the job
name, the command set, the `always()` on the summary step, or adding `test:dom`
to *any* workflow, reds the fast gate in milliseconds. That is the point — the
boundary is one careless edit from gone — but it will surprise someone editing
YAML who does not expect a test to care. The command set is pinned as a **set,
not an order**; reordering is free.

**A clean checkout runs FOUR FEWER TESTS than your working tree, forever.**
Measured at the same commit on the same machine: working tree **1382 passed + 35
skipped**, fresh clone **1378 passed + 39 skipped**, one whole file skipped.
Cause: `tests/transcript-rewind-real-store.test.ts` ends in
`describe.skipIf(real === null)` and looks for a stored transcript whose recorded
`cwd` is **this repo path** — a clone sits elsewhere, and a CI runner has no
`~/.claude` store at all. The test is working as designed. Filed as **#157**;
deliberately not named in the workflow's boundary statement, under #145's rule
that a deficit nobody can close is wallpaper.

**And one process trap this leg walked into itself:** `npm run x | tail` then
`echo $?` reports **`tail`'s** exit code, not npm's. Same class as the standing
warning about the DOM phase verdict on a compound command. Redirect to a file and
read `$?` on its own line.

## Carried forward, unchanged

**#155 is the biggest open finding and it is not a driver bug.** On a profile the
app has never started in, **no message sends at all** — measured one variable at
a time (not the zero-turn trick, not the Enter path, not zoom, not localStorage).
A profile the app has never started in is every new user's first launch. **What
has not been done, and it is one run:** open the app **by hand** on a clean
profile and type a message. Everything so far went through `playwright-core` with
a stubbed `dialog.showOpenDialog`, so nobody has ruled out the harness.

**`main` is intermittently red on `session-title-enrichment` (#153)** — 4 of 7
full runs at leg 5, green on all three at leg 6, both at leg 7 and both at leg 8.
Not evidence it is fixed. A single red is not evidence your change broke
something.

**`npm run test:dom` cannot be all-green while #155 is open** (`gui-123` reports
`UNSCORED`), and since leg 7 a full run also reports `INCOMPLETE` — the accepted
`gui-119` quarantine stated rather than hidden, not a break.

**The DOM phase's reds are attributed; do not re-investigate from scratch.**
`gui-95` and `gui-49` pre-existing and uninvestigated; `gui-123` is #155 working
as designed; `gui-94` a load artifact; `gui-91` intermittent ~1 in 7 (#156).
`gui-93` and `gui-124` flipped green at leg 7 unexplained, and there is still
**no full-phase baseline on an unmodified tree**. **Leg 8 did not run the phase**
— #150 touched no renderer code — so none of this moved.

**The bar discrepancy #149 left open is still open.** `.context/` prose has said
the three docks *"share the Sidebar's reference"*, but `.gauntlet/bar/README.md`'s
own "What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose.** Owner-owned artifact.
**Settle it before the gauntlet seed reads it.**

**#138 before the gauntlet seed** remains the sharpest ordering constraint:
`bar_win` requires *"one type scale holds across all of them"* and the app ships
two, so every per-surface verdict is confounded until #138 lands.

## Standing constraints for any leg touching the renderer

Unchanged, and all still hold: no em dashes in user-visible strings
(`tests/copy-em-dash.test.ts` compiles `src/`; comments are free, and so is
anything outside `src/`); the stylesheet pins are literal-text and brittle (D3);
any CSS change owes a driver pin that **runs** (D4) — jsdom loads no CSS, so
neither the fast gate nor CI can see layout; the titlebar's centring is
load-bearing (#136); `DESIGN.md` is read literally by
`tests/subagent-material.test.ts`, which splits on `\n## Bans in force\n` — #140
edits that section, so the split token must survive verbatim. Full text in
[[pick-up]].

Carried from earlier legs, unchanged:

- **`inspect.mjs`'s surface list is gated in three places** — `SURFACES`,
  `SKILL.md` **and** `.gauntlet/bar/README.md`, inside their
  `surfaces:begin` / `surfaces:end` markers. Only that delimited region of
  `SKILL.md` is pinned; the rest is free, and leg 8 edited the rest.
- **A driver's capture destination is a checked property**
  (`tests/driver-screenshot-dir.test.ts`); `scripts/gui-*-shots/` stays narrowly
  gitignored — do not broaden it.
- **Run `inspect.mjs` one at a time.** Its workspace directory name is fixed.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are
  FIVE.** A `*.source.mjs` sidecar is exempt.
- **Isolation is a property of the launch** (#147). New driver → spread
  `...profileArgs()` from `driver-profile.mjs`, or the fast gate reds it. **No
  opt-out list, and do not add one.** The profile is per driver **PROCESS**.
- **A driver may decline to answer.** Exit 2 → `UNSCORED`.
- **A driver that pins persisted app state must read it back** (#143).
- **Do not read the phase's verdict off a compound command.**
- **A quarantine the verdict does not carry is a green** (#145).
- **Logic the fast gate must execute cannot live in `dom-phase.mjs`** or
  `inspect.mjs` — both spawn drivers at import. Put it in `drivers.manifest.mjs`.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**A third is now live and it is one command:** push `main` and watch `fast-gate`,
so #150 can close.

**#144 stands unanswered** and was deliberately not touched — closing it on the
back of #150 is the failure mode that split was reviewed against. **#151, #152,
#153, #154, #155, #156 and #157 are all `needs-triage`.** #155 remains the one
worth reading first, and it needs a human at a keyboard.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
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
