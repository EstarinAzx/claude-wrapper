---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 11 — owner away_
_At commit: `ab7aee4` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 **#146**, leg 3 **#142**, leg 4 **#148**, leg 5
**#143**, leg 6 **#147**, leg 7 **#145**, leg 8 **#150's work**, leg 9 **#141**,
leg 10 **#138**, leg 11 **#139**. **ONE ticket remains at `ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/139-tool-card-label-weight` was squash-merged
  and deleted (content diffed empty against `main` first). Tree clean on `main`.
- **Landed 2026-08-11 (leg 11):** the whole of **#139** as `ab7aee4`. **#139 is
  CLOSED** — every acceptance criterion was dischargeable without a push.
  **Filed #160** at `needs-triage`.
- **Open and agent-ready (1):** **#140**, the last one.
  **#144, #151–#159 and #160 are `needs-triage`** and none may be promoted by a leg.
- **Next:** **#140** — the selected session row's mint side-stripe against the ban.
- **#150 is still OPEN at `needs-info` and is NOT queue work.** Its code landed
  in full at leg 8; it waits on a human pushing and watching the first CI run.
- **Gate on `main` after the merge:** typecheck clean, **95 files / 1398 passed +
  36 skipped** (was 95 / 1396 + 36). The +2 are exactly this ticket's two new
  source checks. Build clean. Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 22 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #139 changed, and the one thing worth carrying forward

The tool-card label went **600 → 400**, and the reason is a licence rather than a
taste. `DESIGN.md` grants 600 to exactly three roles — the app name, headings,
and bubble-less emphasis — and a tool-card label is none of them, so the 600 was
asserting a weight the document never gave that element.

**The transferable rule is about the SHAPE of the pin, not the weight.** The
value (`400`) rests on a warrant (`the label is none of the three roles`), and
the warrant is a **DOM fact a refactor can change without touching a
stylesheet**: `ToolCard` renders as a *sibling* of `.assistant-body` in
`Chat.tsx`. Move tool cards inside that region and the label becomes bubble-less
emphasis, 600 becomes licensed again, and the decision inverts. A check on the
value alone stays green through that. So the warrant is checked too:

| criterion | holds | gate |
|---|---|---|
| 7 | the label computes `400` | `npm run test:dom` |
| 8 | `400` and `600` are different renderings **here** | `npm run test:dom` |
| 9 | the label is none of the three licensed roles | `npm run test:dom` |
| 10 | every `font-weight` in `styles/` is `400` or `600` | `npm test` |
| 11 | `DESIGN.md` records size and colour as the replacement | `npm test` |

Full reasoning in
[[2026-08-11-a-value-check-outlives-its-warrant-unless-the-warrant-is-checked-too]].

## New landmines from this leg

**`styles/` may now contain only `400` and `600` as font-weights, keywords
included.** Criterion 10 matches `[^;}]+` rather than `\d+` on purpose —
**`bold` leaves the documented set without ever writing a number**. `700` reds
criterion 10 while criterion 2's `500` grep stays green, so neither subsumes the
other and both stay.

**`DESIGN.md`'s `## Type` section must keep a line naming the tool-card label,
its weight, and both size and colour.** Criterion 11 finds it by requiring
`weight` on the line, **not** `tool card` — the rung table already lists tool
cards as a 13px role, so a check keyed on the noun would pass against that row
and never see the sentence go.

**Criterion 11's limit is recorded, not hidden.** It reds when the sentence is
deleted and when `colour` leaves the line, but **not** when one of the line's two
`colour` mentions is reworded while the other survives. It pins that the claim is
present; it cannot grade how well it is argued.

**A weight claim on this machine is only real if the pixels move.** `500` renders
byte-identically to `600` (the family snaps to named instances). The technique
that settles it, reusable for any weight or size claim here: drive the element
through both values in-run and compare `getBoundingClientRect()` in **device**
pixels. Measured **29.94 at 400 against 31.17 at 600**, delta 1.234.

**`gui-96` now grows a tool card as a fixture and measures it.** Its
`tool-use` push (`name: 'Task'`) was already there for the subagent row, and
`.subagent-row` is a **child** of the card — so a present row is a present
`.tool-card-name`, measured before the drawer opens so nothing overlays it.

## Carried forward, unchanged

**#155 is the biggest open finding and it is not a driver bug.** On a profile the
app has never started in, **no message sends at all** — measured one variable at
a time. That is every new user's first launch. **What has not been done, and it
is one run:** open the app **by hand** on a clean profile and type a message.
Everything so far went through `playwright-core`, so nobody has ruled out the
harness.

**`main` is intermittently red on `session-title-enrichment` (#153)** — 4 of 7
full runs at leg 5, green on every run at legs 6 through 11. Not evidence it is
fixed. A single red is not evidence your change broke something.

**`npm run test:dom` cannot be all-green while #155 is open** (`gui-123` reports
`UNSCORED`), and a full run also reports `INCOMPLETE` — the accepted `gui-119`
quarantine stated rather than hidden, not a break.

**The DOM phase's reds are attributed; do not re-investigate from scratch.**
`gui-95` and `gui-49` pre-existing and uninvestigated; `gui-123` is #155 working
as designed; `gui-94` a load artifact; `gui-91` intermittent ~1 in 7 (#156).
**Legs 8 through 11 ran no full phase** — leg 11 ran only `gui-96`, four times —
so the table is still leg 7's, and there is still **no full-phase baseline on an
unmodified tree**.

**A clean checkout runs FOUR FEWER TESTS than your working tree, forever**
(#157). `tests/transcript-rewind-real-store.test.ts` skips unless it finds a
stored transcript whose recorded `cwd` is this repo. Do not chase it.

**The bar discrepancy #149 left open is still open.** `.context/` prose has said
the three docks *"share the Sidebar's reference"*, but `.gauntlet/bar/README.md`'s
own "What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose.** Owner-owned artifact.
**Settle it before the gauntlet seed reads it.**

**Mutation testing is routine here, and the revert must be `cp` from a backup.**
`git checkout -- <file>` on an uncommitted tree destroys finished work; leg 10
lost two files that way. Leg 11 backed up to the job tmp dir and restored from
there, six mutations, no loss.

## Standing constraints for any leg touching the renderer

Unchanged, and all still hold: no em dashes in user-visible strings
(`tests/copy-em-dash.test.ts` compiles `src/`; comments are free, and so is
anything outside `src/`); the stylesheet pins are literal-text and brittle (D3),
so no comment in `styles/` may contain a closing brace; any CSS change owes a
driver pin that **runs** (D4) — jsdom loads no CSS, so neither the fast gate nor
CI can see layout; the titlebar's centring is load-bearing (#136); `DESIGN.md` is
read literally by `tests/subagent-material.test.ts`, which splits on
`\n## Bans in force\n` — **#140 edits that section, so the split token must
survive verbatim**.

**`DESIGN.md` is CRLF.** Any section regex needs `\r?\n`; an LF-only pattern
matches nothing and reports the content missing, which reads exactly like real
drift. Both `gui-138.source.mjs` and `gui-96.source.mjs` depend on this.

**Since #138:** `styles/` may contain **no `em` font-size at all**, and exactly
**one** literal px font-size, allow-listed by `file:line`. `DESIGN.md`'s
`## Type` section must name every `--text-*` value `tokens.css` defines.

Carried from earlier legs, unchanged:

- **`inspect.mjs`'s surface list is gated in three places** — `SURFACES`,
  `SKILL.md` **and** `.gauntlet/bar/README.md`, inside their
  `surfaces:begin` / `surfaces:end` markers.
- **A driver's capture destination is a checked property**
  (`tests/driver-screenshot-dir.test.ts`); `scripts/gui-*-shots/` stays narrowly
  gitignored — do not broaden it.
- **Run `inspect.mjs` one at a time.** Its workspace directory name is fixed.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are
  FIVE.** A `*.source.mjs` sidecar is exempt and needs no wiring.
- **Isolation is a property of the launch** (#147). New driver → spread
  `...profileArgs()` from `driver-profile.mjs`, or the fast gate reds it. **No
  opt-out list, and do not add one.**
- **A driver may decline to answer.** Exit 2 → `UNSCORED`.
- **A driver that pins persisted app state must read it back** (#143).
- **Do not read the phase's verdict off a compound command**, and do not read an
  exit code off a pipeline — `npm run x | tail` then `echo $?` gives you
  `tail`'s. Redirect to a file.
- **Do not run the fast gate concurrently with the DOM phase** (leg 7's cost).
- **A quarantine the verdict does not carry is a green** (#145).
- **Logic the fast gate must execute cannot live in `dom-phase.mjs`** or
  `inspect.mjs` — both spawn drivers at import. Put it in `drivers.manifest.mjs`.
- **Do not cite `DESIGN.md` by line number** (#138). Name the section.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**A third is still live and it is one command:** push `main` and watch
`fast-gate`, so #150 can close.

**#144 stands unanswered** and was deliberately not touched. **#151 through #160
are all `needs-triage`.** #155 remains the one worth reading first, and it needs a
human at a keyboard. **#160 is the newest and is the direct sequel to #139**:
is the 600 licence exhaustive or illustrative? Eight elements sit outside it on
the reading #139 used, and #138 widened this very line one commit earlier rather
than restriking code — so the precedents point opposite ways. **#159** is its
sibling one property over, for sizes.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-a-value-check-outlives-its-warrant-unless-the-warrant-is-checked-too]]
- [[2026-08-11-a-ratio-rule-is-tested-as-a-ratio-and-its-tolerance-is-set-by-the-rungs-it-already-admits]]
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
