---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 5 — owner away_
_At commit: `1c42d3c` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 **#146**, leg 3 **#142**, leg 4 **#148**, leg 5
**#143**. **Seven tickets remain at `ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/143-gui-123-keyboard-premise` was squash-merged
  and deleted (content diffed against `main` first — a squash merge does not mark
  a branch merged, so `git branch -d` refuses and the empty diff is what makes
  `-D` safe). Tree clean on `main`.
- **Closed 2026-08-11 (leg 5):** **#143** (`1c42d3c`). **Filed #152, #153, #154**
  at `needs-triage`, and commented on **#145**.
- **Open and agent-ready (7):** #138, #139, #140, #141, #145, #147, #150.
  **#144, #151, #152, #153, #154 are all `needs-triage`** and none may be
  promoted by a leg.
- **Next:** **#147** — DOM phase drivers share one Electron profile. Leg 5 handed
  it a measured example: the sessions rail's scope toggle persists across
  relaunch, and pinning it is now a documented write to that shared profile. See
  [[pick-up]].
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **93 files / 1362 passed + 35 skipped** (was 93 / 1361 + 36; the +1 test and
  −1 skip are exactly the new `gui-123.source.mjs` sidecar). Ran on the branch and
  again on `main`. **Read the number off `main`, never off this file.**
- **`main` is intermittently red, and it is not this leg's change.** See the
  warning below before trusting any gate result.
- **NOT PUSHED**, now 10 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## Read this before you trust a green gate

**`tests/session-title-enrichment.test.tsx` fails intermittently under full-suite
load — 4 of 7 complete runs, including one on the unmodified `main` tree with all
work stashed.** It passes every time the file is run alone. The cause is a
`findByText` on Testing Library's default 1000ms while the test renders a 100-row
sidebar page. Filed as **#153** at `needs-triage`.

Practical consequence for the next leg: **a single red run is not evidence your
change broke something.** Re-run, and if it is that test, stash and run against
the bare tree the way leg 5 did — that is the measurement that settles it.

## What #143 actually was

The driver spent a fixed 60 Tab presses hunting the reuse control and called it
unreachable if it had not landed. That budget was a guess about a document the
driver can count.

| rail scope | rows | focusables | control lands on press |
|---|---|---|---|
| `This project`, mkdtemp workspace | 0 | 17 | 16 |
| `All projects` | 100 | 218 | **218** |

The rail sits ahead of the transcript in tab order, caps at 100 rows, and carries
two stops per row. **The scope toggle persists across relaunch**, so the verdict
was a function of a setting left in the shared Electron profile.

`gui-123.mjs` now pins the rail and reads it back ahead of every measurement, and
derives its traversal budget per run. `gui-123.source.mjs` pins the derived-budget
rule in the fast gate.

## The transferable half

**A symptom that left is not a defect that was fixed.**

The stock driver **passed on the first run of this leg**. Closing on that green
would have been the phantom fix the triage explicitly forbade — #148 had just made
the rail deterministic elsewhere, so the green was #148's and the driver would
have kept its dependency on machine state with the ticket marked done.

The red was **reproduced on demand** instead: flip the persisted toggle, and the
original driver reds with the ticket's text verbatim while the new one passes from
the identical state. A defect whose symptom is controlled by state you can set is
one you can summon; until you have summoned it you do not know what you fixed.

Full reasoning in
[[2026-08-11-a-symptom-that-left-is-not-a-defect-that-was-fixed]].

## Two rules this leaves behind

**A check can run and still be blind in the configuration it runs in.** A reverted
60-press constant does not red the DOM phase on a normal machine, because at the
default scope the rail contributes 0 rows and 60 is generous. That is why the rule
moved to the fast gate rather than staying in the driver — the same argument
`tests/driver-screenshot-dir.test.ts` makes for output paths.

**Do not fix a load-sensitive read by lengthening the wait.** The pin was written
inside phase 4 first, and phase 3 then read a mid-transition `opacity: 0.823757`
under hover on a renderer still laying out 100 rail rows. Moving the pin above
every measurement removed the cause; no wait was lengthened, and the settle after
the scope click is a `waitForFunction` on the state the run needs.

## Carried forward for the next leg

**#147 is next, and leg 5 fed it evidence.** `gui-123.mjs` now deliberately writes
`This project` into the shared profile and says so where it happens. Restoring the
previous value was considered and rejected — the only value there is to restore is
the one that made the driver red. A private profile per driver is #147's fix.

**#154 says the same defect is still live in `gui-122.mjs:292`**, which tabs to
`.code-copy`, also behind the rail, on the identical `i < 60` budget. It is passing
today for the same reason gui-123 was passing today. `gui-48.mjs` (two loops),
`gui-52.mjs` and `gui-54.mjs` also carry `i < 60` Tab loops and were **not**
examined.

**#152 is the product question #143 refused to answer with an instrument.** The
control is reachable; whether 208 rail tab stops ahead of the transcript is
acceptable is a design decision.

**The bar discrepancy #149 left open is still open.** `.context/` prose has said
the three docks *"share the Sidebar's reference"*, but `.gauntlet/bar/README.md`'s
own "What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose.** It is the
owner-confirmed half of a human-owned artifact, so no agent has rewritten it.
**Settle it before the gauntlet seed reads it.**

**Wave captures across the #148 boundary compare two different fixtures.** Waves
1–5 photographed a one-row rail fed by the real store; every future wave
photographs the five-row fixture.

**The `pieces` cap is a budget, not a scope statement.** Nine captured surfaces,
`pieces` capped at 6 and fixed at seed.

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
  `surfaces:begin` / `surfaces:end` markers. The bar's edit is a deliberate change
  to the standard, not bookkeeping.
- **A driver's capture destination is a checked property.**
  `tests/driver-screenshot-dir.test.ts` reds if any driver hardcodes its output or
  defaults it back inside the repo.
- **`scripts/gui-*-shots/` is gitignored, narrowly and on purpose.** Do not
  broaden it to `scripts/**/*.png`.
- **Run `inspect.mjs` one at a time.** Its workspace directory name is fixed, so
  two concurrent runs delete each other's workspace.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files.** There are
  **four**. A `*.source.mjs` sidecar is exempt — it is globbed by
  `tests/gui-source-assertions.test.ts` and needs no wiring anywhere.
- **The rail's two IPC channels are stubbed in `inspect.mjs`, so a capture says
  nothing about them.** The real listing is covered by
  `tests/session-store.test.ts`, `tests/session-store-live.test.ts` and
  **`gui-63.mjs`**.

New from this leg:

- **A driver may pin persisted app state, and if it does it must read it back.**
  `gui-123.mjs` is the worked example: pin, read back, halt loudly if the pin did
  not take. Pinning without reading back is how a driver silently measures the
  machine.
- **The DOM phase defines an `UNSCORED` verdict (exit 2) that no driver emits.**
  All 39 end `process.exit(fails.length === 0 ? 0 : 1)`, so a premise failure
  reads as FAIL. Noted on **#145**, which already owns what the phase may report
  as clean.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**#144 stands unanswered**, and #150 is its settled half sitting in the queue.
**#151, #152, #153 and #154 are all new and all `needs-triage`.** #151 overlaps
the first owner call above; #152 is a product a11y decision; #153 is why `main`
goes red without anyone changing it; #154 is #143's defect still live one driver
over.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-symptom-that-left-is-not-a-defect-that-was-fixed]]
- [[2026-08-11-the-premise-is-what-feeds-the-surface-not-what-two-runs-agree-on]]
- [[2026-08-11-a-behavioural-constraint-cannot-be-pinned-as-text]]
- [[2026-08-11-a-convention-nothing-executes-is-a-style-preference]]
- [[2026-08-11-a-standard-generated-from-the-code-it-polices-inherits-its-omissions]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
