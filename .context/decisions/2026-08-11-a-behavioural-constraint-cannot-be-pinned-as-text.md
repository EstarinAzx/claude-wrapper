---
type: decision
project: claude-wrapper
date: 2026-08-11
updated: 2026-08-11
tags: [context, decision, gui-drivers, testing, instrument]
---

# A behavioural constraint cannot be pinned as text, so move the code to where it can run

## Decision

**#142 (`ef664cf`).** `inspect.mjs`'s fixture workspace has a fixed directory
name, `inspect-ws`, instead of `fs.mkdtempSync`. A directory that is already
there is **cleaned, not refused**, and the cleanup is announced through the
driver's own `log` vocabulary — **only when something was actually removed**.

The three lines that decide all of that live in
`.claude/skills/run-desktop/inspect-workspace.mjs`, a module the driver imports,
and `tests/inspect-fixture-workspace.test.ts` **runs them**.

`titlebar.png` is now byte-stable and belongs in a diff. It was the only capture
that moved.

## The defect, and why it hid

`Titlebar.tsx` renders `.session-title` as `basename(cwd)`, and the fixture
workspace **is** that cwd. `mkdtemp`'s six random characters changed every run,
so the PNG compressed differently every run — while the box stayed `0,0,1440,48`
and the text length stayed 43. Every signal the driver already printed said
nothing was moving. Only the bytes did.

Measured across seven runs of the unmodified driver: every other surface
byte-identical, this one spanning **8980 to 9538**. A byte-diff of it could never
be evidence, and a gauntlet wave comparing it across waves reads instrument noise
as a change in the UI — the trap `flatControl` already documents in the same
file.

## Refusing on collision was the obvious fix and it was wrong

A fixed name trades randomness for a collision. That is precisely what `mkdtemp`
was buying, so the natural response is to refuse when the directory is already
there.

Cross-model review killed it, and the reasoning generalises: **this instrument is
unattended.** A run that dies between `mkdirSync` and `cleanup()` leaves residue.
A refusal converts that residue into a **deterministic failure of every
subsequent run**, with no message a reader could act on and no reason to go
looking in a temp directory nobody told them about. One crash would take the
instrument off the air until a human guessed why.

So: clean when stale, and only then. Verified against the real driver rather than
only the unit — `%TEMP%/inspect-ws` was seeded with a stray `.jsonl` and a
subdirectory, and the run printed its `WORKSPACE ... cleaned stale directory`
line and **passed**, producing a byte-identical capture.

The report fires **only** on an actual removal. Removing and re-creating
unconditionally is simpler and would announce a cleanup on every run — at which
point the announcement carries no information, and genuine crash residue becomes
indistinguishable from the ordinary case.

## The transferable half: where the code lives is a testability decision

The other three `inspect-*.test.ts` files assert against `inspect.mjs` as **text**
and each says why: that module launches Electron at import. That reasoning is
sound and still holds.

But the constraint this ticket carries is **behavioural** — *do not refuse; clean
when stale, and only then* — and **"never refuses" is not a property source text
can honestly check.** Grepping for the absence of a `process.exit` proves nothing
about a refusal form nobody thought to grep for. The check would look like
coverage and be close to vacuous.

The answer is not a better regex. It is to **move the three lines out of the file
that cannot be imported**, into one that imports nothing from Electron. Then the
gate runs the real code path against a real temp directory.

Generalises as: when a contract is behavioural and the module holding it is
untestable for an incidental reason, the module boundary is the thing to change.
A text assertion standing in for an executable one is
[[2026-08-11-a-convention-nothing-executes-is-a-style-preference]] wearing a
test's clothes.

Which is also why the last two assertions in the new suite are **still text**:
they check that `inspect.mjs` actually calls `prepareWorkspace` and no longer
`mkdtemp`s. Without them the module would be dead code passing its own tests —
the two-copies-of-one-contract failure #132's sidecar convention exists to
prevent.

## One mutation exposed a check that was carrying nothing

Six mutations, six distinct reds, unmutated control green, verdicts **parsed from
the reporter output** rather than taken from an exit code (#125's trap).

The one worth recording: putting a random suffix back on `WORKSPACE_NAME` reded
only **one** test, not the two expected. `Math.random()` at module scope is
evaluated once, so it is stable *within* a process — and "the name is identical
across runs" therefore could not see it. A second mutation moving `mkdtemp`
**inside** `prepareWorkspace` reds four tests including that one.

Without the second mutation, that assertion would have been dead weight looking
exactly like coverage. **A mutation that reds fewer tests than expected is a
finding about the tests, not a pass.**

## The ceiling this knowingly buys

**Two concurrent runs now fight.** The second run's `prepareWorkspace` deletes the
first run's workspace out from under it, and the first run's `cleanup()` then
deletes the second's. Both produce garbage rather than an error.

There is no lock and none was asked for. `mkdtemp` was buying that isolation and
a fixed name cannot keep it; this is the honest price of a diffable capture. The
cost is written beside the code, not only here. **Run this instrument one at a
time.**

Only the workspace is pinned. `STORE_DIR` keeps its random suffix and should —
nothing renders it, so it is not a source of pixel drift, and the suffix still
keeps two runs' seeded transcripts apart.

## A false negative the next reader will hit

Across the four verification runs, `sidebar.png` and `window-session.png` were
**also** byte-identical. That is **not** evidence #148 is fixed, and running this
same check is the obvious way to conclude that it is.

#148's instability is across machines and across time, not run-to-run within one
sitting. Its premise is visible in the driver's own log instead: the sidebar
capture reports **7125 characters** of rail content against a fixture that seeds
exactly **one** session. The rest is the machine's real sessions. Noted on #148
so its acceptance is not written as "run it twice and diff", which passes today.

## Reversibility

**Reversible.** Reverting `ef664cf` restores `mkdtemp` and deletes both new
files. Nothing in `src/` was touched.

The part to leave alone is the clean-if-stale branch. Turning it into a refusal
is a three-line edit that looks safer and takes the instrument off the air on the
first crash.

## Related

- [[decisions]] · [[overview]] · [[active-work]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]] — #137 measured this
  exact cause and confirmed a fixed workspace makes `titlebar.png` byte-identical.
  This ticket is that measurement shipped, with the collision question answered.
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]] — the same
  family: there a convention nothing ran, here a constraint no text could check.
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]] — #132's sidecar convention,
  whose two-copies-of-one-contract argument is why the drift guard exists here.
