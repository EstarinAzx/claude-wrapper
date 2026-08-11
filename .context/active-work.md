---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 9 — owner away_
_At commit: `388959b` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 **#146**, leg 3 **#142**, leg 4 **#148**, leg 5
**#143**, leg 6 **#147**, leg 7 **#145**, leg 8 **#150's work**, leg 9 **#141**.
**Three tickets remain at `ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/141-declared-build-requirement` was
  squash-merged and deleted (content diffed empty against `main` first). Tree
  clean on `main`.
- **Landed 2026-08-11 (leg 9):** the whole of **#141** as `388959b`. **#141 is
  CLOSED** — unlike #150, everything it asked for was verifiable without a push.
  **Filed #158** at `needs-triage`.
- **Open and agent-ready (3):** #138, #139, #140.
  **#144, #151, #152, #153, #154, #155, #156, #157, #158 are `needs-triage`** and
  none may be promoted by a leg.
- **Next:** **#138** — the type scale. It is also the ordering constraint on the
  gauntlet, see below.
- **#150 is still OPEN at `needs-info` and is NOT queue work.** Its code landed
  in full at leg 8; it waits on a human pushing and watching the first CI run.
- **Gate on `main` after the merge:** typecheck clean, **95 files / 1393 passed +
  36 skipped** (was 95 / 1382 + 35). The +11 tests are the ten new `#141`
  assertions plus the partial-coverage pin; the +1 skip is a swap, not a new
  hole — `gui-75` left the no-sidecar list and gained two narrower named skips.
  Build clean. Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 18 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #141 changed, and the one thing worth carrying forward

**A sidecar check may now declare the build artifact it reads:**

```js
needsBuild: { artifact: 'out/main/index.js', covers: ['src/main'] }
```

`npm test` reports it as a named skip carrying its artifact **and where it does
run**; `npm run test:dom` executes it, after proving the artifact is at least as
new as everything under `covers`. **The gate still does not build** — that was
the ruling, not an omission.

```bash
npm run test:dom -- --build-only     # seconds, no Electron. Refuses to combine with --only.
```

**The finding is not the feature.** The test written for the recursive mtime
walk compared two real paths in the repo — and **passed with the recursion
deleted**, because a directory's own mtime moves when entries are added or
removed rather than when a file inside is edited. It was measuring the checkout,
not the function. Rebuilt on a fixture with a stamped far-future mtime so the
assertion is an equality against a number the test chose.

**Carry the habit, not just the fix: mutation-verify the TEST, not only the
code.** Full reasoning in
[[2026-08-11-a-test-built-on-ambient-state-measures-the-ambient-state]].

## New landmines from this leg

**`gui-75` is the first driver with a sidecar that is ALSO in `DOM_SKIP`.**
Until #141 those were the same claim. Its §0 now executes; everything else in it
drives real CLI turns and stays `api-cost` skipped. There is a dedicated named
skip and a pin (`the partially-covered set is exactly gui-75`) so the set cannot
empty by accident — un-skipping `gui-75`, or deleting its sidecar, reds that.

**`tests/gui-source-assertions.test.ts` now loads checks through the manifest**
(`loadChecks()`), not by its own glob-and-import. Two enumerations of the check
set is how the gate and the phase would drift; the driver list already worked
this way and now the check list does too.

**`--build-only` plus `--only` is refused, deliberately.** It used to print
`BUILD REQUIREMENTS PASS (0 checked)`. If you want a scoped run and the build
checks, that is two commands.

**Leg 8's workflow pin was NOT touched.** No npm script and no workflow were
added, because the ruling was that the gate stays build-free. `GATE` in
`tests/fast-gate-workflow.test.ts` is unedited — a red from that file still
means someone touched CI.

## Carried forward, unchanged

**#155 is the biggest open finding and it is not a driver bug.** On a profile the
app has never started in, **no message sends at all** — measured one variable at
a time (not the zero-turn trick, not the Enter path, not zoom, not localStorage).
A profile the app has never started in is every new user's first launch. **What
has not been done, and it is one run:** open the app **by hand** on a clean
profile and type a message. Everything so far went through `playwright-core` with
a stubbed `dialog.showOpenDialog`, so nobody has ruled out the harness.

**`main` is intermittently red on `session-title-enrichment` (#153)** — 4 of 7
full runs at leg 5, green on every run at legs 6, 7, 8 and 9. Not evidence it is
fixed. A single red is not evidence your change broke something.

**`npm run test:dom` cannot be all-green while #155 is open** (`gui-123` reports
`UNSCORED`), and a full run also reports `INCOMPLETE` — the accepted `gui-119`
quarantine stated rather than hidden, not a break.

**The DOM phase's reds are attributed; do not re-investigate from scratch.**
`gui-95` and `gui-49` pre-existing and uninvestigated; `gui-123` is #155 working
as designed; `gui-94` a load artifact; `gui-91` intermittent ~1 in 7 (#156).
**Leg 9 ran no full phase** — only `gui-93` alone, twice (red under mutation,
green restored) — so the table has not moved since leg 7, and there is still
**no full-phase baseline on an unmodified tree**.

**A clean checkout runs FOUR FEWER TESTS than your working tree, forever**
(#157). `tests/transcript-rewind-real-store.test.ts` skips unless it finds a
stored transcript whose recorded `cwd` is this repo. Do not chase it.

**The bar discrepancy #149 left open is still open.** `.context/` prose has said
the three docks *"share the Sidebar's reference"*, but `.gauntlet/bar/README.md`'s
own "What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose.** Owner-owned artifact.
**Settle it before the gauntlet seed reads it.**

**#138 before the gauntlet seed** is now the sharpest ordering constraint AND the
next ticket: `bar_win` requires *"one type scale holds across all of them"* and
the app ships two, so every per-surface verdict is confounded until #138 lands.

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
  `SKILL.md` is pinned; the rest is free, and legs 8 and 9 both edited the rest.
- **A driver's capture destination is a checked property**
  (`tests/driver-screenshot-dir.test.ts`); `scripts/gui-*-shots/` stays narrowly
  gitignored — do not broaden it.
- **Run `inspect.mjs` one at a time.** Its workspace directory name is fixed.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are
  FIVE.** A `*.source.mjs` sidecar is exempt, which is why #141 added one with no
  wiring anywhere.
- **Isolation is a property of the launch** (#147). New driver → spread
  `...profileArgs()` from `driver-profile.mjs`, or the fast gate reds it. **No
  opt-out list, and do not add one.** The profile is per driver **PROCESS**.
- **A driver may decline to answer.** Exit 2 → `UNSCORED`.
- **A driver that pins persisted app state must read it back** (#143).
- **Do not read the phase's verdict off a compound command**, and do not read an
  exit code off a pipeline — `npm run x | tail` then `echo $?` gives you
  `tail`'s. Redirect to a file.
- **A quarantine the verdict does not carry is a green** (#145).
- **Logic the fast gate must execute cannot live in `dom-phase.mjs`** or
  `inspect.mjs` — both spawn drivers at import. Put it in `drivers.manifest.mjs`.
  #141 followed this: the staleness comparator lives in the manifest, which is
  the only reason the gate can red-verify it.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**A third is still live and it is one command:** push `main` and watch
`fast-gate`, so #150 can close.

**#144 stands unanswered** and was deliberately not touched. **#151, #152, #153,
#154, #155, #156, #157 and #158 are all `needs-triage`.** #155 remains the one
worth reading first, and it needs a human at a keyboard. **#158 is the newest**
and is a question about what a green tick claims, which is why a leg did not
answer it.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
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
