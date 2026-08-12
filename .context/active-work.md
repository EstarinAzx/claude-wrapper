---
type: active-work
project: claude-wrapper
updated: 2026-08-12
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-12 by Opus 5, relay chain 8 leg 2 — owner away_
_At commit: `454e8de` on `main`_

## Current focus

**Relay chain 8 is draining the three-ticket queue a 2026-08-12 triage pass promoted,
one ticket per leg (`N=1`), with a fresh gauntlet run chained behind it via `then:`.**

Legs 1-2 landed **#153** and **#154**. **One ticket left: #156**, then the queue is dry
and `then:` fires the gauntlet. All of it is instrument work. Say it out loud, because
it sets expectations for the whole chain: **nothing in this queue changes the app.**
Every user-facing item in the tracker is a design call and they sit with the owner. The
visible change is meant to come from the gauntlet chained behind this queue, not from
these legs.

Verify rather than trust this file:

```bash
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

## State

- **In flight:** nothing. `ticket/154-gui-122-derived-tab-budget` was squash-merged and
  deleted after `git diff --quiet` confirmed it byte-identical to `main`. Tree clean.
- **Landed 2026-08-12 (chain 8 leg 2):** **#154** as `454e8de`, **CLOSED**. Two driver
  files, one of them new; no `src/` change. Full reasoning in
  [[2026-08-12-a-ban-is-satisfied-by-the-absence-of-what-it-bans]].
- **Landed 2026-08-12 (chain 8 leg 1):** **#153** as `5267ede`, **CLOSED**. One line of
  one test file; no source change. Full reasoning in
  [[2026-08-12-awaiting-the-mechanism-is-half-a-fix-and-the-timeout-is-bounded-at-both-ends]].
- **Filed by legs so far, all at `needs-triage`:** **#162** (the repo-wide version of
  #153's cause), **#163** (`gui-124` still hardcodes a 12-press Tab budget — the last of
  #143's class), **#164** (the Tab-reach drivers start beside their target, and
  `gui-123`'s sidecar has no vacuity guard). **A leg must not promote any of them**; that
  is what makes the chain's stop condition reachable.
- **Open and agent-ready:** **#156** only. Nothing else is promotable by a leg.
- **Gate on `main` at `454e8de`:** typecheck clean, **96 files / 1408 passed + 43
  skipped**, build clean (`index-DOI17h8g.css` unchanged). The `+2 / -1` against leg 1's
  1406/44 is exactly #154 — two new sidecar tests, and `gui-122.mjs` leaving the "no
  source-level sidecar" reported-skip list. **Read the number off `main`, never off this
  file.**
- **NOT PUSHED**, 54 commits ahead at the time of writing. D6 stands, and the count in
  this sentence is already stale — read it with the command above.
- **Gauntlet run 2 is over and merged.** `docks-and-min-window` merged as `25d13e0`,
  stopped on its `max_waves` backstop at wave 12 with `plateau: 2` — **cut off, not
  converged.** One verdict moved backwards at wave 7; waves 8-12 were pixel-identical
  critic-only stalls. `CommandsDock` and `WelcomeMinWindow` and `IconHousing` reached
  `YOURS WINS`; `AgentsDock` held `BAR WINS` the whole run. The branch is **not deleted**
  and each wave is its own commit, so "take wave 7 instead" is a checkout. Record:
  `.claude/gauntlet-docks-and-min-window.md`. `.claude/gauntlet.md` is **archived** so a
  chained run cannot seed-guard onto the closed one.

## What #154 changed, and the two things worth carrying forward

**A ban is satisfied by the absence of what it bans.** #143's text criterion says "no Tab
traversal in this driver is bounded by a hardcoded number". Delete the
`keyboard.press('Tab')` line and leave the bound derived, and it reports `ok` forever —
there are no traversals, so none is hardcoded. Proven rather than argued: criterion 1
stays **green** under that mutation and only #154's new criterion 2 reds
(`tabPresses: 0`). Same family as #145 and #146, one turn further — a check that runs and
polices nothing. **`gui-123` carries this hole today (#164).**

**A guard outlives the thing it guarded against, and porting it means re-deriving its
premise.** #154's ticket says gui-122 is "one flip away" from #143's red because the
rail's scope toggle survives relaunch. **#147 landed after #143 and closed that channel.**
`profileArgs()` gives each driver process a `--user-data-dir` that `mkdtemp` just made,
and `dom-phase.mjs` mints its own root per run, so the `localStorage` holding
`sidebar-scope` is empty at every launch and `Sidebar.tsx` falls back to `project`. First
run of the ported driver: `RAILPIN {"scope":"This project","rows":0,"pinnedHere":false}` —
nothing to click. So phase 1b is a **premise check, not a repair**. Third instance of
[[2026-08-11-a-value-check-outlives-its-warrant-unless-the-warrant-is-checked-too]].

## New landmines from this leg

**`document.body.focus()` DOES NOT MOVE FOCUS.** `body` has no `tabindex`, so the call is
silently ignored and `activeElement` stays wherever the phase above left it. Both
`gui-122` and `gui-123` "reset" focus this way before a Tab traversal and neither reset
does anything. In gui-122 that means phase 3's clicked copy button still holds focus and
the first Tab lands on the *other* path's `.code-copy` — `presses: 1`. The ring assertion
survives it; the reachability wording does not. #164.

**A driver's Electron profile is a THROWAWAY, per process, and that is a premise other
checks rest on.** `profileDir()` returns `DOM_DRIVER_PROFILE` when set (dom-phase mints
`mkdtemp` per run, one dir per driver) and otherwise `mkdtemp`s its own and removes it on
exit. So **no persisted renderer state survives into any driver run** — no zoom, no
window bounds, no `localStorage`. Any driver comment claiming it inherits or contaminates
persisted state is pre-#147 and stale.

**Only THREE drivers tab-traverse: `gui-122`, `gui-123`, `gui-124`.** An `i < 60` loop is
not a Tab loop — `gui-48`, `gui-52`, `gui-54` and `gui-80` all carry one and none of them
presses Tab at all; theirs are `waitForTimeout` poll budgets (60 × 1000ms or 60 × 2000ms)
waiting on a real CLI turn or on `.model-pill` to un-disable. A wall-clock timeout has
nothing countable to derive from. **Do not re-open those four**; #154's comment records
the measurement.

**`waitFor` and `findBy*` share one timeout budget, and vitest's `testTimeout` caps
both.** Any new async wait in this repo lives inside 1000ms by default and inside 5000ms
absolutely. A per-assertion timeout at or above 5000ms is not "generous", it is
unreachable, and it trades the assertion's own error message for a useless one.

**390 async waits across 34 test files all sit on that same 1000ms default**, there are
**zero `configure()` calls anywhere in the repo**, and `vitest.config.ts` has **no
`setupFiles`** for a global Testing Library config to live in. So there is currently no
one-line lever for this class. **#162.**

**`.appearance-field--stacked` no longer exists** anywhere in `src/`. Gauntlet wave 4
deleted it and `25d13e0` merged that; `overview.md` was corrected this leg. The current
vocabulary is `.appearance-field` with its `--control` modifier plus the
`.appearance-choices` cards.

## Before you trust a gate result

**A gate can go RED with ZERO failing tests.** Measured 2026-08-12: 95 of 96 files
reporting, one worker process exited unexpectedly (`Worker exited unexpectedly` /
`[vitest-pool]`), `npm test` exit 1, and **no `FAIL` line anywhere**. The immediate
re-run was 96 of 96. The default reporter does not name the file that vanished — use
`--reporter=json` or diff the file count against the 96 on disk. **It did not recur once
across this leg's six sequential runs.**

With #153 fixed, that worker-crash shape is now the **only** known "red that is not your
change" in the fast gate. Re-run before believing it.

**`npm run test:dom` cannot be all-green while #155 is open** — `gui-123` honestly
reports `UNSCORED`, and a full run also reports `INCOMPLETE` for the accepted `gui-119`
quarantine. Both are correct readings, not breaks.

**Do not run the fast gate concurrently with the DOM phase** (leg 7 paid two ambiguous
reds and five attribution runs for this).

**`npm run x | tail` then `echo $?` gives you `tail`'s exit code.** Redirect to a file
and read `$?` on its own line. **Do not read the DOM phase's verdict off a compound
command** — it has reported exit 0 while its own text said `DOM PHASE FAIL`.

**A clean checkout runs four fewer tests than your working tree**, forever (#157):
`tests/transcript-rewind-real-store.test.ts` skips without a stored transcript whose
`cwd` is this repo. Not a regression, do not chase it.

**Never revert a mutation with `git checkout -- <file>` on an uncommitted tree.** Leg 10
lost two finished files that way. Back up with `cp` and restore from the backup, then
hash-check. Mutation testing is routine here and this leg hash-checked its source back to
`96fc85738a447b0c6659f77b9cd1c012`.

**A squash merge does not mark the branch merged**, and it makes the branch hash a **dead
reference** — the squash creates a new commit on `main`, so the branch hash is reachable
from nothing once deleted. Read the hash off `main` after merging:
`git log --oneline -1 main`. Leg 12 cited a branch hash in seven places before catching
this.

## The DOM phase's current reds, already attributed

Still leg 7's table. The wave commits merged into `main` did move pixels, so it is now
also **pre-merge** evidence. #153 was a test-only change and moved none.

| driver | in batch | alone | verdict |
|---|---|---|---|
| `gui-95` | FAIL | FAIL | **pre-existing**, uninvestigated |
| `gui-49` | FAIL | FAIL | **pre-existing**, uninvestigated |
| `gui-123` | UNSCORED | UNSCORED | **#155**, working as designed |
| `gui-94` | FAIL | **PASS** | load artifact, plus a second deliberate cause (below) |
| `gui-91` | FAIL | **FAIL 1x, PASS 3x** | **#156**, intermittent ~1 in 7 |
| `gui-93` | **PASS** | PASS | green; red-verified under mutation |
| `gui-124` | **PASS** | PASS | was batch-red at leg 6, unexplained |
| `gui-96` | — | **PASS** (ALL GREEN) | 11 criteria, all mutation-verified |

There is still **no full-phase baseline on an unmodified tree.**

**`gui-122` was run standalone at `454e8de` and PASSes** — twice unmodified (once before
the change, once after), plus four mutation runs that each red as intended. It is not in
the table above and did not join it. Its run now also prints a `--- source-level ---`
block, because the driver drives the same `checks` array the fast gate does.

**`gui-94` reds for a second, deliberate reason.** Gauntlet wave 2 gave
`.command-row-desc` a two-line clamp and new leading, changing a box `#94` pinned as
no-change: line box `12px -> 31.9px`, row height `60px -> 65.1px`. Its guarding half
still passes (AC1, AC2, surface 2), so the composer's slash popover is untouched.
**Reverting the line-height alone does not clear it**, and clearing it means abandoning
the CommandsDock work. Owner call 12. Do not "fix" it by rebuilding its probe — binding
constraint 5 forbids softening a check to clear a red.

## Standing constraints for any leg touching the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles `src/`;
comments are free, and so is anything outside `src/`). D3 — the stylesheet pins are
literal-text and brittle: no comment in `styles/` may contain a closing brace, `.bubble`
and `.message-input` stay ungrouped, `.bubble {` must stay the first literal occurrence
in `chat.css`, exactly one `backdrop-filter` in all of `styles/`, and the `@import` order
in `styles.css` **is** the cascade. D4 — any CSS change owes a driver pin that
**executes**, naming which gate runs it; jsdom loads no CSS, so neither the fast gate nor
CI can see layout. The titlebar's centring is load-bearing (#136).

Note `styles/` means `src/renderer/src/styles/`. A grep against a bare `styles/` path
silently finds nothing.

**Stylesheet value bans.** Only `400` and `600` font-weights, keywords included (#139).
No `em` font-size and exactly **one** literal px font-size, allow-listed by exact
`file:line` (#138). Exactly **one** box-shadow with a nonzero horizontal offset (#140),
the mint stripe in `rails.css` — the `inset 0 0 0 1px` hairline idiom is unaffected,
offset zero is the discriminator, and a `box-shadow` the parser cannot read
(`var(--x)`) **reds** rather than being skipped.

**`DESIGN.md` is read by five checks and each wants something different.** `## Type`
must name every `--text-*` value `tokens.css` defines (#138) **and** keep the tool-card
weight sentence (#139). `## Bans in force` must survive as a split token and keep its
glass exception (#125), its side-stripe ban, and #140's exception with surface,
declaration, scope and precedent disclaimer — **#140's exception sits INSIDE that
section**, and the split terminates on `\n## `, so a new `##` heading above it would
hide it. **It is CRLF**: a section regex needs `\r?\n`. Do not cite `DESIGN.md` by line
number (#138); name the section.

**`.context/` is LF while `DESIGN.md` is CRLF — do not normalise either to match the
other.** Keep `.context/` off the ticket branch and check `git diff --cached --name-only`
before committing.

**A grouped selector defeats the `.subagent-drawer` extractor idiom** (#140).
`^\.class\s*\{` matches nothing when the class is paired with its `:hover`. Use
`^\.class(?![\w-])[^{]*\{([^}]*)\}`, strip comments first, and prove it with a rename
probe.

**A content-hashed build artifact is a cheap second witness that no pixels moved**
(#140): `npm run build` keeping the same `index-*.css` filename corroborates a git
byte-identity check independently.

Carried from earlier legs, unchanged:

- **`inspect.mjs`'s surface list is gated in three places** — `SURFACES`,
  `run-desktop/SKILL.md` **and** `.gauntlet/bar/README.md`, inside their
  `surfaces:begin` / `surfaces:end` markers (#149). **`CLAIMED_HEADROOM_PX` in
  `inspect.mjs` is a copy of a sum argued in prose in `chat.css`** — never move it to
  match a measurement without moving that sum too.
- **A driver's capture destination is a checked property** (#146): use
  `process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`;
  `scripts/gui-*-shots/` stays narrowly gitignored.
- **Run `inspect.mjs` one at a time** (#142) and point `SCREENSHOT_DIR` outside the repo.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are FIVE.** A
  `*.source.mjs` sidecar is exempt and needs no wiring — do not re-glob sidecars.
- **Logic the fast gate must execute cannot live in `dom-phase.mjs`** or `inspect.mjs` —
  both spawn drivers at import (#142, #148). Put it in `drivers.manifest.mjs`.
- **Isolation is a property of the launch** (#147). New driver → spread `...profileArgs()`
  from `driver-profile.mjs`. **No opt-out list, and do not add one.** The profile is per
  driver **process**, not per launch.
- **A cold profile is not the same app as a warm one** — leg 6's whole finding, and #155
  is the consequence.
- **A driver may decline to answer** (exit 2 → `UNSCORED`). **A driver that pins
  persisted app state must read it back** (#143). **A quarantine the verdict does not
  carry is a green** (#145). **A byte comparison that passes is not evidence a capture is
  stable** (#148). **`gui-75` is the first driver with a sidecar that is ALSO in
  `DOM_SKIP`** (#141) — "has a sidecar" and "is executed somewhere" are different claims.
- **The workflow is pinned as text** (#150). `tests/fast-gate-workflow.test.ts` reds on a
  changed job name, a changed command **set** (order is free), losing `if: always()` on
  the summary step, or **any** workflow invoking `test:dom`.

## Open questions

**Nine tickets sit with the owner**, each with the choice narrowed on the ticket itself;
`.claude/vibe.md` is only the index. **#155 is the most serious open finding** — one
by-hand run on a cold profile decides whether every new user's first launch is broken,
and the discriminator is simply whether the composer cleared. **#150 is one
`git push origin main` plus watching the first `fast-gate` run.** **#161** is a live
user-facing defect (Commands dock stuck empty). Then **#152**, **#151**, **#159** and
**#160** (two separate questions, not one), **#157**, **#144**.

**Three tickets were filed by legs, all at `needs-triage`, and none is promotable by a
leg.** **#162** (leg 1): whether the repo should set a global `asyncUtilTimeout`, three
options on the ticket; it needs infrastructure that does not exist (a `setupFiles` entry),
which is why it is an owner call. **#163** (leg 2): `gui-124` still bounds its Tab
traversal with `hops < 12`, the last of #143's class — mechanical, but whether it also
wants the phase-1b rail check is a real question, since its traversal may not cross the
rail at all and that must be measured rather than copied. **#164** (leg 2): two findings
about what the Tab-reach checks *claim* — the traversal starts one stop from its target
(`document.body.focus()` is a no-op), and `gui-123`'s sidecar has no vacuity guard.

**CI exists, has never run, and `main` has never been pushed.**
`.github/workflows/fast-gate.yml`, on push, `windows-latest`, exactly `typecheck` +
`test` + `build`. **Do not push on your own initiative** (D6) — leg 8 tested this against
a ticket whose own acceptance asked for a push and left the ticket open rather than push.
D6 was written and pressure-tested *under* the AFK grant, so the grant does not override
it. When the first run happens, expect the worker-crash red; re-run the job before
concluding anything about the runner.

**Gauntlet owner call 14 — the stop signal — is still unanswered and still (a).** Two
agent-reachable answers were attempted and both were refuted cross-model as post-hoc
goalpost movement. Under (a), run 2 was cut off by budget rather than converged. Owner
calls 12-13 live in the archived run record; 14-20 in
`.claude/gauntlet-core-surfaces.md`.

**Two claims run 2 already refuted or refused — do not act on either.** *"The app has no
icon vocabulary"* is **false** (measured 1:1 viewBox-to-pixel at `strokeWidth 1.4` across
every dock icon, counts identical at the seed). *"Group the commands by purpose / give
each row a leading icon"* is **not buildable** — no category field exists and the captured
list is a hand-authored fixture chosen for row shape. Owner call 15.

**The bar's reference question (#149) is SETTLED by the artifact, against the prose.**
`.gauntlet/bar/README.md`'s "What each reference judges" table assigns
`linear/linear-features.png` to *"Titlebar + docks"*. Earlier `.context/` prose claimed
the docks shared the Sidebar's reference. **Read the table.** The bar is intact: five
`linear/` references, two `identity/`, plus `manifest.json`.

**A gauntlet run cannot take all nine surfaces at once.** `pieces` is capped at 6 and
fixed at seed — a budget, not a claim that the unpicked surfaces lack a standard.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-12-a-ban-is-satisfied-by-the-absence-of-what-it-bans]]
- [[2026-08-12-awaiting-the-mechanism-is-half-a-fix-and-the-timeout-is-bounded-at-both-ends]]
- [[2026-08-11-a-permission-outlives-the-thing-it-permits-unless-both-are-pinned]]
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
