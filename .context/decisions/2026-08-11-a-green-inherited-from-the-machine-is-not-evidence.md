---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, testing, gui-drivers, instrument, isolation]
---

# A green inherited from the machine is not evidence

## Decision

**#147 (`81de29d`).** Every DOM-phase driver launches against a `userData`
directory of its own. `dom-phase.mjs` mints one per driver and removes it after;
`driver-profile.mjs` is the single place that decides where a profile lives; each
of the 36 inline drivers spreads `...profileArgs()` into its
`electron.launch({ args })`. A driver run by hand mints a throwaway, so a manual
run never writes into the profile the human's own app uses. `inspect.mjs` takes
one too — not a driver, but it normalises zoom and resizes the window.

**There is no opt-out list**, and that is the part worth remembering.

## Why the triage's own option could not be built

The triage said the phase should "pass a private `--user-data-dir` per driver by
default". The phase does not launch Electron — it spawns `node gui-<n>.mjs`, and
the driver owns the argv. The way out would have been an environment variable
that moves `userData` with no argv change at all, needing no driver to cooperate
and no gate to enforce anything.

`scripts/spike-147-driver-profile-isolation.mjs` measured it, control first:

| gap | verdict |
|---|---|
| **D** control — two bare launches share a profile, launch 2 reads launch 1's marker | **YES** |
| **A** `--user-data-dir` moves `app.getPath('userData')` | **YES** |
| **B** an env-only redirect (`APPDATA`) moves it | **NO** |
| **C** a probe's `setPath('userData')` beats the switch | **YES** |

**B is the whole shape of the change.** Chromium resolves `appData` through the
shell's known-folder API and ignores the variable, so isolation cannot be
injected from outside — it has to appear in each driver's argv, and therefore
needs a gate rather than a convention.

A, B and C were gated on D scoring, for #129's reason: an ungated arm reading a
dead handle answers confidently and wrongly.

## The opt-out list that was expected, and why there is none

The triage exempted `gui-79` and `gui-110` because they "measure the remembered
profile", and cross-model review objected that this would be fatal:

> the opt-outs preserve shared mutable state, so the default isolation does not
> eliminate the original cross-driver channel

The objection is correct and the exemption was unnecessary. `gui-78`, `gui-79`
and `gui-110` **already mint their own `mkdtemp` profile** inside their probe —
`gui-110`'s is shared across *its own three launches*, which is the entire point
of it. None of the three ever read this machine's real profile. Gap C then proves
a phase-level switch cannot disturb them.

So the channel is closed for the whole set instead of bounded to a named pair,
and there is no second `DOM_SKIP` for a future driver to be quietly added to.

## The property that is easy to get wrong

**The directory is per driver PROCESS, not per launch.** `gui-69`, `gui-70` and
`gui-110` each launch Electron three times in one run and assert on what launch
N+1 inherits. A fresh directory per call would isolate those drivers from
themselves and turn every persistence assertion into a vacuous first-launch
reading. A module-level memo is what makes the helper safe for them.

## Head to head, and the aid that proved itself unasked

`gui-72`, checked out in place: at HEAD it **PASSES and writes to the real
profile**; with the helper, same verdict, profile untouched, 14 entries in its
private directory. The first row is "silent at the source" reproduced on demand —
a *passing* driver contaminating.

The attribution aid (the ticket's option 4) fingerprints `Preferences` +
`Local Storage` around each driver and names any that wrote. Across a full
30-driver run the list was **empty**; across the five attribution runs it printed
for **every** HEAD arm and **no** branch arm. Five positive and five negative
controls nobody designed.

It reports rather than fails, because the human's own app writes to that
directory too.

## What isolation revealed, which is the transferable half

`gui-123` had always passed. Under isolation it cannot score: on a profile the
app has never started in, **no message sends at all**. Not the driver's zero-turn
trick (reproduces with the `chat:send` listener intact), not the Enter path (the
Send button is equally dead), not zoom (forcing the factor to 1 changes nothing),
not localStorage (seeding all four keys the two profiles disagreed about changes
nothing). Filed as **#155**.

That green was never evidence about the reuse control. It was evidence that the
machine had been used before. A test whose pass depends on state it did not set
is reporting the state, not the subject — and the only way to find out which is
to take the state away.

## And so a driver may now decline to answer

`gui-123` reports **`UNSCORED` (exit 2)** when no user message renders at all,
and keeps `FAIL` for a message that rendered without the control. It is the first
driver in the set to emit exit 2 — the verdict `dom-phase.mjs` has always read
and no driver produced. A `FAIL` there would have been a claim about a control
the run never reached.

`npm run test:dom` therefore cannot be all-green while #155 is open. That is the
honest reading, not a broken gate.

## Reversibility

**Reversible.** Dropping `...profileArgs()` and deleting the helper returns the
previous behaviour; `tests/driver-profile.test.ts` would then be dead and go with
it. `gui-123`'s `UNSCORED` branch is independent of the rest and reverts on its
own.

**Stated ceiling:** the nine drivers in `DOM_SKIP` took the same two-line change
and **nothing executed it** — the phase never launches them. It is one import and
one spread, textually identical to the 30 that ran and pinned by the fast gate,
but it was not run. `gui-49`, `gui-93` and `gui-95` are pre-existing reds this
ticket did not touch and did not investigate.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-a-symptom-that-left-is-not-a-defect-that-was-fixed]] — #143, whose
  reproduce-on-demand rule is what the `gui-72` head to head applies here, and
  whose accepted ceiling (the pin writing to the shared profile) this entry
  removes.
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]] — the
  hazard's shape; isolation is the fix that does not depend on a teardown running.
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — why the convention had to
  reach the fast gate rather than stay in prose.
- [[2026-08-11-the-premise-is-what-feeds-the-surface-not-what-two-runs-agree-on]] —
  the same argument about what a surface is fed, applied there to a fixture and
  here to a profile.
