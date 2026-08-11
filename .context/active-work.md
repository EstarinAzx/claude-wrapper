---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 4 — owner away_
_At commit: `f60b40a` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 landed **#146**, leg 3 landed **#142**, leg 4 landed
**#148**. **Eight tickets remain at `ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/148-fixture-sessions-list` was squash-merged and
  deleted (content diffed against `main` first — a squash merge does not mark a
  branch merged, so `git branch -d` refuses and the empty diff is what makes `-D`
  safe). Tree clean on `main`.
- **Closed 2026-08-11 (leg 4):** **#148** (`f60b40a`). **Filed #151** at
  `needs-triage` — the fixture workspace lives under the user profile, so every
  rail capture carries a Windows username.
- **Open and agent-ready (8):** #138, #139, #140, #141, #143, #145, #147, #150.
  **#144 stays `needs-triage` deliberately** — its settled half is #150, and
  closing #144 because #150 landed is the exact failure the split was reviewed
  against. **#151 is new and also `needs-triage`.**
- **Next:** **#143** — the reuse control is not reachable by keyboard. The plan
  deliberately ordered it *after* #148 so the fix is proven to be the driver's
  rather than the rail's. See [[pick-up]].
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **93 files / 1361 passed + 36 skipped** (was 92 / 1348; the +1 file and +13
  tests are exactly `tests/inspect-sessions-fixture.test.ts`). Ran on the branch
  and again on `main`. **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 8 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #148 actually was

`inspect.mjs`'s header claims the whole instrument is fixture-driven. The sessions
rail was the one surface where that was false — it read `session:list`, which
enumerates this machine's real store.

Both of the rail's lists are now replaced in main: the stored transcripts, and the
CLI's live agent view (`background-sessions:list`, whose `[]` was only ever an
accident of the fixture workspace being fresh, and which renders a *failed look*
on a machine with no `claude` on PATH).

The decision lives in **`inspect-sessions.mjs`**, not the driver — #142's split
applied a second time, because the driver launches Electron at import and nothing
in it can be run by the fast gate.

## The transferable half

**The premise is what feeds the surface, not what two runs agree on.**

The obvious acceptance here — run it twice and byte-compare — **passes on unfixed
code**. #142's leg ran exactly that, four times, and got a clean result off a rail
still listing 953 real sessions. Two runs minutes apart on one machine see the
same store; the instability is across machines and across time.

So the premise was measured off what supplies the surface:

- The footer's real count reads **950, 951, 952, 953** in waves 2 to 5, and
  **976** on a run today. Wave 4's value was predicted before opening it.
- The sidebar surface's own log inverts from **7125 characters** of rail content
  to **550**.

Three clean runs afterwards gave 11/11 byte-identical captures. That is recorded
as corroboration and explicitly **not** as the evidence, because it is the same
check that passed on the defect.

## Which check catches what, measured rather than assumed

The driver reads the rail back and compares it to the fixture **before any
capture**. Disabling the stub showed the four checks are not interchangeable:

- The **row count** catches a stub that did not install (red at 1 row against 5,
  footer reading 976).
- The **stray-title** check — which my first draft of the ticket comment called
  *"the one that matters"* — **never fires there**. Under `project` scope the real
  store can only contribute the seeded session, whose title the fixture also
  carries. It guards the **scope pin** instead, and the comment was corrected to
  what the red run showed.
- The **footer** catches a list of the right length and the wrong set.
- The **background rows** catch the second stub alone.

## Two rules this leaves behind

**A relative age needs an offset, not a timestamp.** A fixed epoch renders a
different string every day. Every fixture row sits ≥20 minutes from its `relTime`
bucket edge, and the seeded row is deliberately **not `now`** — a 60-second
bucket is the one label a slow run ticks through under itself, and it is exactly
what the old seeded row rendered.

**A fixture must not leave the surface less representative than what it
replaced.** The rail carries five rows rather than one, because it is
photographed to be judged on row rhythm. Shrinking what a surface can be graded
on would look exactly like the fix working.

## Carried forward for the next leg

**#143 is next and the plan put it here on purpose.** Verifying it after #148 is
what makes a green result attributable to the driver rather than to the rail.
`gui-123` is currently red in the DOM phase with #143's text verbatim; that is
expected, not a regression.

**The bar discrepancy #149 left open is still open.** `.context/` prose has said
the three docks *"share the Sidebar's reference"*, but `.gauntlet/bar/README.md`'s
own "What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks: control grouping, iconography"*. **Read the table, not the
prose.** The table is the owner-confirmed half of a human-owned artifact, so no
agent has rewritten it. **Settle it before the gauntlet seed reads it**, since the
seed picks references from that table.

**Wave captures across the #148 boundary compare two different fixtures.** Waves
1 to 5 photographed a one-row rail fed by the real store; every future wave
photographs the five-row fixture. That is the intended trade — before it, those
two files could not be compared at all — but a wave-to-wave diff spanning the
boundary is meaningless for those two surfaces.

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
- **Run `inspect.mjs` one at a time.** Its workspace directory name is fixed, so
  two concurrent runs delete each other's workspace. No lock, accepted knowingly.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files** in that
  directory so their absence from the driver set is a decision on the record.
  There are now **four**.

New from this leg:

- **The rail's two IPC channels are stubbed, so a capture says nothing about
  them.** A green `sidebar.png` is no evidence that `session:list` works, exactly
  as a green `commands-dock.png` is none that the CLI serves commands. The real
  listing is covered by `tests/session-store.test.ts`,
  `tests/session-store-live.test.ts` and **`gui-63.mjs`**, which drives the built
  app through the real handler with no stub.
- **The stubs install before `app.firstWindow()`.** A renderer that called
  `session:list` earlier than that would paint once from the real list. It does
  not today, and the read-back would catch it. Written beside the code.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**#144 stands unanswered**, and #150 is its settled half sitting in the queue.
**#151 is new** and overlaps the first owner call above: the exposure it names is
the one already recorded there, now measured across all five waves rather than
wave 5 alone.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-the-premise-is-what-feeds-the-surface-not-what-two-runs-agree-on]]
- [[2026-08-11-a-behavioural-constraint-cannot-be-pinned-as-text]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
