---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 3 — owner away_
_At commit: `ef664cf` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 landed **#146**, leg 3 landed **#142**. **Nine
tickets remain at `ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/142-fixture-workspace-pin` was squash-merged
  and deleted (content diffed against `main` first — a squash merge does not mark
  a branch merged, so `git branch -d` refuses and the empty diff is what makes
  `-D` safe). Tree clean on `main`.
- **Closed 2026-08-11 (leg 3):** **#142** (`ef664cf`). Nothing filed; one comment
  left on **#148** warning about a false negative it will otherwise hit.
- **Open and agent-ready (9):** #138, #139, #140, #141, #143, #145, #147, #148,
  #150. **#144 stays `needs-triage` deliberately** — its settled half is #150, and
  closing #144 because #150 landed is the exact failure the split was reviewed
  against.
- **Next:** **#148** — fixture the sessions list. See [[pick-up]]; leg 3 measured
  something that changes how its acceptance must be written.
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **92 files / 1348 passed + 36 skipped** (was 91 / 1340; the +1 file and +8 tests
  are exactly `tests/inspect-fixture-workspace.test.ts`). Ran on the branch and
  again on `main`. **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 6 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #142 actually was

`inspect.mjs` opened its fixture workspace with `fs.mkdtempSync`. The app renders
`.session-title` as `basename(cwd)` and that directory **is** the cwd, so six
random characters changed `titlebar.png`'s pixels every run.

The reason it hid for two tickets: **the box stayed `0,0,1440,48` and the text
length stayed 43.** Every signal the driver already printed said nothing was
moving. Only the bytes did — 8980 to 9538 across seven runs, against every other
surface byte-identical.

The name is now fixed at `inspect-ws`, and a directory that is already there is
**cleaned, not refused**.

## The transferable half

**Where the code lives is a testability decision.**

The other three `inspect-*.test.ts` files assert against `inspect.mjs` as *text*,
and each says why: it launches Electron at import. That is sound and still true.
But this ticket's constraint is behavioural — *do not refuse; clean when stale,
and only then* — and **"never refuses" is not a property source text can honestly
check.** Grepping for the absence of a `process.exit` proves nothing about a
refusal form nobody thought to grep for; it would look like coverage and be close
to vacuous.

The fix is not a better regex. It is to move the three deciding lines **out of the
file that cannot be imported** into `inspect-workspace.mjs`, which imports nothing
from Electron, so the gate runs the real path against a real temp directory.

The two remaining text assertions exist only as the drift guard — that
`inspect.mjs` actually calls it and no longer `mkdtemp`s. Without them the module
would be dead code passing its own tests, which is the two-copies-of-one-contract
failure #132's sidecar convention exists to prevent.

## Why refusing on collision was rejected

It is the obvious reading of "fixed name" and cross-model review killed it.

**This instrument is unattended.** A run that dies between `mkdirSync` and
`cleanup()` leaves residue, and a refusal converts that residue into a
deterministic failure of *every later run*, with no message a reader could act on
and no reason to go looking in a temp directory nobody told them about. One crash
takes the instrument off the air until a human guesses why.

The cleanup is announced through the driver's own `log` vocabulary and **only when
something was actually removed**. Removing and re-creating unconditionally is
simpler and would announce a cleanup on every run — at which point the
announcement carries no information and real crash residue is indistinguishable
from the ordinary case.

## The mutation worth carrying

Six mutations, six distinct reds, control green, verdicts **parsed from the
reporter output** rather than read off an exit code (#125's trap).

Restoring the random suffix reded **one** test, not the two expected:
`Math.random()` at module scope is evaluated once, so it is stable *within* a
process and the identity check could not see it. A second mutation moving
`mkdtemp` **inside** the function reds four, including that one.

**A mutation that reds fewer tests than expected is a finding about the tests, not
a pass.** Without the second one, that assertion was dead weight that looked
exactly like coverage.

## Carried forward for the next leg

**A false negative that is easy to walk into.** Across leg 3's four verification
runs, `sidebar.png` and `window-session.png` were **also** byte-identical. That is
not evidence #148 is fixed, and "run it twice and diff" is the natural check to
reach for there. #148's instability is across machines and across time. Its
premise shows in the driver's own log instead: the sidebar capture reports **7125
characters** of rail content against a fixture that seeds exactly **one** session.
A comment saying so is on the ticket.

**The bar discrepancy #149 left open is still open.** `.context/` prose has said
the three docks *"share the Sidebar's reference"*, but `.gauntlet/bar/README.md`'s
own "What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks: control grouping, iconography"*. **Read the table, not the
prose.** The table is the owner-confirmed half of a human-owned artifact, so no
agent has rewritten it. **Settle it before the gauntlet seed reads it**, since the
seed picks references from that table.

**The `pieces` cap is a budget, not a scope statement.** Nine captured surfaces,
`pieces` capped at 6 and fixed at seed, so one run cannot take all nine. A seed
picking a subset is not evidence the unpicked surfaces lack a standard.

## Pick up here

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

The tracker is the authority; this file has been wrong before. Recommended order
and its reasons are in [[pick-up]]. **#138 before the gauntlet seed** remains the
sharpest ordering constraint: `bar_win` requires *"one type scale holds across all
of them"* and the app ships two, so every per-surface verdict is confounded until
#138 lands.

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

Carried from earlier legs, unchanged:

- **`inspect.mjs`'s surface list is gated in three places.** Adding or removing a
  surface means editing `SURFACES`, `SKILL.md` **and** `.gauntlet/bar/README.md`,
  inside their `surfaces:begin` / `surfaces:end` markers. The bar's edit is a
  deliberate change to the standard, not bookkeeping.
- **A driver's capture destination is a checked property.**
  `tests/driver-screenshot-dir.test.ts` reds if any driver hardcodes its output
  or defaults it back inside the repo. A new driver must use
  `process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.
- **`scripts/gui-*-shots/` is gitignored, narrowly and on purpose.** Do not
  broaden it to `scripts/**/*.png` — that swallows `scripts/spike-117-shots/`,
  which two findings files cite by path.

New from this leg:

- **Run `inspect.mjs` one at a time.** Its workspace directory name is now fixed,
  so two concurrent runs delete each other's workspace. There is no lock; this
  was accepted knowingly as the price of a diffable capture, and it is recorded
  beside the code in `inspect-workspace.mjs`.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files in that
  directory** so their absence from the driver set is a decision on the record. A
  new `.mjs` there that is neither a `gui-*` driver nor a `*.source.mjs` sidecar
  gets a line in that comment.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**#144 stands unanswered**, and #150 is its settled half sitting in the queue.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-behavioural-constraint-cannot-be-pinned-as-text]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
