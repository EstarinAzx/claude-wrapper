---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 6 — owner away_
_At commit: `81de29d` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 **#146**, leg 3 **#142**, leg 4 **#148**, leg 5
**#143**, leg 6 **#147**. **Six tickets remain at `ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/147-private-profile-per-driver` was
  squash-merged and deleted (content diffed against `main` first — a squash merge
  does not mark a branch merged, so `git branch -d` refuses and the empty diff is
  what makes `-D` safe). Tree clean on `main`.
- **Closed 2026-08-11 (leg 6):** **#147** (`81de29d`). **Filed #155** at
  `needs-triage`, and commented on **#145**.
- **Open and agent-ready (6):** #138, #139, #140, #141, #145, #150.
  **#144, #151, #152, #153, #154, #155 are all `needs-triage`** and none may be
  promoted by a leg.
- **Next:** **#145** — `gui-119`'s batch quarantine. Leg 6 changed what this
  ticket is deciding against; see below and [[pick-up]].
- **Gate on `main` after the merge:** typecheck clean, **94 files / 1368 passed +
  35 skipped** (was 93 / 1362 + 35). The +1 file and +6 tests are exactly
  `tests/driver-profile.test.ts`. Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 12 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## The one thing that changes what the next ticket means

**`npm run test:dom` cannot be all-green, and that is now the honest reading
rather than a broken gate.**

`gui-123.mjs` reports **`UNSCORED` (exit 2)** — the first driver in the set ever
to emit it. `dom-phase.mjs` has always defined that verdict and no driver
produced one, so every broken precondition in the set has historically been
reported as a `FAIL` about the thing the run never got to look at.

**#145 is the next ticket and it owns exactly this question** — what the phase
may report as clean, and how high the bar is for the `desktop-exclusive`
category. Two consequences to carry into it:

1. `UNSCORED` and `FAIL` are now different claims **in practice**, not just in
   the harness. Any CI wiring (#150) must not read a non-zero exit as "quarantine
   it".
2. A driver that cannot reach its subject has a way to say so that is not a
   quarantine. That is a third option #145's framing did not have.

## What #147 actually was

Every driver launched against the machine's real `userData`. Bounds and the
per-origin zoom factor outlive a process, so a driver pinning either handed it to
everything that ran next.

**The triage's own option could not be built, and that is measured.** The phase
spawns `node gui-<n>.mjs`; the driver owns the Electron argv. An env-only
redirect would have needed no driver to cooperate —
`scripts/spike-147-driver-profile-isolation.mjs` gap **B**: Chromium resolves
`appData` through the shell's known-folder API and **ignores `APPDATA`**. So
isolation appears in 36 driver argvs and needs a gate, not a convention.

**There is no opt-out list.** `gui-78`, `gui-79` and `gui-110` already mint their
own `mkdtemp` profile in their probe, and `setPath('userData')` beats the switch
(gap **C**). That answers cross-model review's objection that opt-outs would
preserve the very channel being closed.

## The transferable half

**A green inherited from the machine is not evidence.**

`gui-123` had always passed. Under isolation it cannot score: on a profile the
app has never started in, **no message sends at all**. Its green was never
evidence about the reuse control — it was evidence that this machine had been
used before.

Full reasoning in
[[2026-08-11-a-green-inherited-from-the-machine-is-not-evidence]].

## Two rules this leaves behind

**A driver's profile is per PROCESS, not per launch.** `gui-69`, `gui-70` and
`gui-110` each launch three times and assert on what launch N+1 inherits. A fresh
directory per call would isolate those drivers from themselves and make every
persistence assertion a vacuous first-launch reading.

**Reproduce the contamination, do not infer it.** `gui-72` checked out in place:
at HEAD it **PASSES and writes to the real profile**; with the helper, same
verdict, profile untouched. A *passing* driver contaminating is the ticket's
"silent at the source" property, summoned rather than argued.

## Carried forward for the next leg

**Three DOM-phase reds are NOT this leg's and were not investigated.** Attributed
by running each alone at HEAD and on the branch:

| driver | HEAD | isolated | |
|---|---|---|---|
| `gui-95` | FAIL | FAIL | pre-existing |
| `gui-49` | FAIL | FAIL | pre-existing |
| `gui-93` | PASS | PASS | batch-only, both arms |
| `gui-124` | **FAIL** | **PASS** | isolation fixed it |
| `gui-123` | PASS | UNSCORED | #155 |

**The nine `DOM_SKIP` drivers took the change and nothing ran it.** One import
and one spread, textually identical to the 30 that did run and pinned by the fast
gate — but not executed. `gui-119` can be run alone on an idle desktop if a leg
wants to close that.

**#155 is the biggest thing this leg found and it is not a driver bug.** If a
first-run profile really cannot send, that is every new user's first message. It
was measured only through the driver harness with a stubbed dialog — **opening
the app by hand on a clean profile is the one run that settles it**, and no agent
has done it.

**The bar discrepancy #149 left open is still open.** `.context/` prose has said
the three docks *"share the Sidebar's reference"*, but `.gauntlet/bar/README.md`'s
own "What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose.** Owner-owned artifact;
no agent has rewritten it. **Settle it before the gauntlet seed reads it.**

**Wave captures across the #148 boundary compare two different fixtures.** And
`inspect.mjs` now launches on a private profile (#147), so a wave's captures no
longer inherit whatever zoom or bounds the machine last had — another boundary,
and a deliberate one.

**#138 before the gauntlet seed** remains the sharpest ordering constraint:
`bar_win` requires *"one type scale holds across all of them"* and the app ships
two, so every per-surface verdict is confounded until #138 lands.

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
  `surfaces:begin` / `surfaces:end` markers.
- **A driver's capture destination is a checked property**
  (`tests/driver-screenshot-dir.test.ts`), and `scripts/gui-*-shots/` stays
  narrowly gitignored — do not broaden it to `scripts/**/*.png`.
- **Run `inspect.mjs` one at a time.** Its workspace directory name is fixed.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are now
  FIVE**, `driver-profile.mjs` being the newest. A `*.source.mjs` sidecar is
  exempt.
- **The rail's two IPC channels are stubbed in `inspect.mjs`**, so a capture says
  nothing about them; the real listing is covered by `session-store.test.ts`,
  `session-store-live.test.ts` and **`gui-63.mjs`**.
- **A driver that pins persisted app state must read it back** (#143). Still true,
  and now doing a second job: the read-back is what would catch a private profile
  failing to apply.

New from this leg:

- **A driver may decline to answer.** Exit 2 → `UNSCORED`. Use it when the
  premise broke and the run never reached its subject; a `FAIL` there is a claim
  about something that was never measured.
- **Isolation is a property of the launch.** New driver → spread
  `...profileArgs()` from `driver-profile.mjs` into its args, or the fast gate
  reds it.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**#144 stands unanswered**, and #150 is its settled half sitting in the queue.
**#151, #152, #153, #154 and #155 are all `needs-triage`.** #155 is new this leg
and is the one worth reading first.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-green-inherited-from-the-machine-is-not-evidence]]
- [[2026-08-11-a-symptom-that-left-is-not-a-defect-that-was-fixed]]
- [[2026-08-11-the-premise-is-what-feeds-the-surface-not-what-two-runs-agree-on]]
- [[2026-08-11-a-behavioural-constraint-cannot-be-pinned-as-text]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
