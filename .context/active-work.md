---
type: active-work
project: claude-wrapper
updated: 2026-08-12
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-12 by Opus 5, relay chain 8 leg 3 — owner away_
_At commit: `0e63253` on `main`_

## Current focus

**Relay chain 8 is DONE. The `ready-for-agent` queue is DRY, and that is the
chain's stop signal — so leg 3 set `stop: true` and fired its `then:`, a fresh
gauntlet run (`/relay N=1 /preset gauntlet`), as its last act.**

Three legs, three tickets: **#153**, **#154**, **#156**, every leg gate-green.
All of it was instrument work, which was true of the whole queue: **nothing in
chain 8 changed the app.** Every user-facing item in the tracker is a design call
and they sit with the owner. The visible change is meant to come from the
gauntlet now running behind this queue, not from these legs.

Verify rather than trust this file:

```bash
gh api "repos/EstarinAzx/claude-wrapper/issues?state=open&labels=ready-for-agent" --jq 'length'
git rev-list --count origin/main..main
```

**Use the API, not `gh issue list`, for the frontier query.** Measured this leg:
`gh issue list --state open --label ready-for-agent` returned a **CLOSED** issue
seconds after it was closed — GitHub's search index lags, and the label filter
reads that index. The API call above answered `0` correctly at the same moment.

## State

- **In flight:** nothing. `ticket/156-gui-91-screenshot-stall` was squash-merged
  after `git diff --quiet` confirmed it byte-identical to `main`, then deleted.
  Tree clean.
- **Landed 2026-08-12 (chain 8 leg 3):** **#156** as `0e63253`, **CLOSED on its
  blast-radius half only**. One driver file plus a harness; no `src/` change.
  Full reasoning in
  [[2026-08-12-evidence-may-not-destroy-the-verdict-and-the-renderer-cannot-see-a-stalled-compositor]].
- **Landed 2026-08-12 (chain 8 leg 2):** **#154** as `454e8de`, **CLOSED**.
- **Landed 2026-08-12 (chain 8 leg 1):** **#153** as `5267ede`, **CLOSED**.
- **Filed by legs, all at `needs-triage`, none promotable by a leg:** **#162**
  (leg 1), **#163** and **#164** (leg 2), **#165** and **#166** (leg 3). Keeping
  them off `ready-for-agent` is what makes a chain's stop condition reachable.
- **Open and agent-ready: NOTHING.** 15 open issues, 13 `needs-triage` +
  2 `needs-info` (#155, #150).
- **Gate on `main` at `0e63253`:** typecheck clean, **96 files / 1408 passed + 43
  skipped**, build clean (`index-DOI17h8g.css` unchanged). **Zero delta against
  leg 2** — correct, because a driver change and a `scripts/` harness are both
  invisible to the fast gate, and `gui-91` has no sidecar. **Read the number off
  `main`, never off this file.**
- **NOT PUSHED.** D6 stands. Any count written here is stale on sight — run the
  command above.
- **Gauntlet run 2 is over and merged** (`docks-and-min-window` as `25d13e0`),
  stopped on its `max_waves` backstop at wave 12 with `plateau: 2` — **cut off,
  not converged.** One verdict moved backwards at wave 7; waves 8–12 were
  pixel-identical critic-only stalls. `CommandsDock`, `WelcomeMinWindow` and
  `IconHousing` reached `YOURS WINS`; `AgentsDock` held `BAR WINS` the whole run.
  The branch is **not deleted** and each wave is its own commit, so "take wave 7
  instead" is a checkout. Record: `.claude/gauntlet-docks-and-min-window.md`.
  `.claude/gauntlet.md` is **archived** so the newly-chained run cannot seed-guard
  onto the closed one.

## What #156 changed, and the two things worth carrying forward

**A capture can be evidence rather than an assertion, and then it must not be
able to destroy the verdict.** Nothing in `gui-91`'s `bad` array ever read
`shotEmpty` or `shotRows`. But the call was a bare `await` in a top-level-await
module, so a throw aborted the run: phases 2 and 3 never executed, and **one
missing artifact cost eight assertions it has no bearing on**. With no verdict
line printed, `dom-phase.mjs` classified it as plain `FAIL` —
indistinguishable from a real product break, which is exactly the harm #156 was
filed over. The fix is not a retry: one attempt, the stall recorded and
attributed, the run continuing; `bad` read **first** so a real red is never
softened; only-evidence-lost **declines to score** (exit 2) rather than claiming
a `PASS` that has silently stopped producing screenshots.

**The renderer cannot see a stalled compositor, so no renderer-side wait can fix
one.** With the window's frames withheld, the capture hangs for its full budget
while the page reports `visibilityState: "visible"`, `document.hidden: false` and
fires `requestAnimationFrame` at **0ms**. `win.isVisible()` in **main** was the
only witness that moved. This killed the leg's own first candidate remedy —
awaiting a real frame before capturing — *before it shipped*. Validate a detector
against a deliberately induced instance before building a guard on it, or you
ship [[2026-08-12-a-ban-is-satisfied-by-the-absence-of-what-it-bans]] in a new
costume.

## New landmines from this leg

**Every driver inherits playwright-core's 30000ms default action timeout.**
`DEFAULT_PLAYWRIGHT_TIMEOUT = 3e4`, and **0 of 55 drivers call
`setDefaultTimeout`**. So any driver operation without an explicit `timeout:`
has 30 seconds. Corollary worth internalising: **a `page.screenshot()` here costs
32–41ms idle and 40–60ms with eleven cores saturated**, so a capture measured in
*seconds* is hung, not slow — there is no middle. Load moves capture cost by tens
of milliseconds, never tens of seconds.

**`document.visibilityState` and `requestAnimationFrame` are NOT liveness
witnesses for an Electron window on Windows.** Both reported perfectly healthy
(`"visible"`, `hidden: false`, rAF at 0ms) while the window was minimised and
`Page.captureScreenshot` was blocking. Anything that needs to know whether the
window can actually paint must ask **main**.

**A minimised window reports `isFocused: true`.** Reproduced independently this
leg (`{isVisible:false, isMinimized:true, isFocused:true}`), which is #75's
`isLooking` finding arrived at from the other direction. `isVisible()` is the
discriminator; `isFocused()` is not.

**`isVisible()` catches a minimise but would NOT catch an occlusion.** A window
fully covered by another still reports `isVisible: true` while Chromium may stop
compositing it. So the witness that caught the deterministic reproduction is not
known to cover the wild trigger — see #165 before building on it.

**Mutating a driver: build the mutant OUTSIDE the driver directory.** Better than
`cp`-and-restore, because there is nothing to restore and no window in which the
original is wrong. Copy the driver to a temp dir and re-root its three
environment-dependent lines — `APP_DIR`, the `./driver-profile.mjs` import, and
the bare `playwright-core` import, both rewritten to absolute `file://` URLs.
This matters here specifically: a stray `gui-*.mjs` in the driver directory is
picked up by `tests/driver-profile.test.ts`, `tests/driver-screenshot-dir.test.ts`
**and** `drivers.manifest.mjs`'s non-driver enumeration, so a mutant left in
place reds the gate for reasons that have nothing to do with the mutation. The
original's md5 was still hash-checked after every mutant build.

**A driver reporting `UNSCORED` must not print a line starting with `FAIL`.**
`dom-phase.mjs` classifies with `lied = code === 0 && !!failLine` over
`/^FAIL\b/`, then `code === 0 ? PASS : code === 2 ? UNSCORED : FAIL`. So exit 2
with no `FAIL`-prefixed line is a clean `UNSCORED`, and a real red must exit 1
*and* print `FAIL:` to be quoted in the phase's summary.

Carried, still true:

**A gate can go RED with ZERO failing tests.** One worker process exiting
unexpectedly (`Worker exited unexpectedly` / `[vitest-pool]`), `npm test` exit 1,
and no `FAIL` line anywhere; the immediate re-run was 96 of 96. The default
reporter does not name the file that vanished — use `--reporter=json` or diff the
file count against the 96 on disk. **Did not recur across this leg's runs.** With
#153 fixed, that worker-crash shape is the **only** known "red that is not your
change" in the fast gate.

**`npm run test:dom` cannot be all-green while #155 is open** — `gui-123` honestly
reports `UNSCORED`, and a full run also reports `INCOMPLETE` for the accepted
`gui-119` quarantine. Both are correct readings, not breaks.

**Do not run the fast gate concurrently with the DOM phase** (leg 7 paid two
ambiguous reds and five attribution runs for this).

**`npm run x | tail` then `echo $?` gives you `tail`'s exit code.** Redirect to a
file and read `$?` on its own line. **Do not read the DOM phase's verdict off a
compound command** — it has reported exit 0 while its own text said
`DOM PHASE FAIL`.

**A clean checkout runs four fewer tests than your working tree**, forever
(#157): `tests/transcript-rewind-real-store.test.ts` skips without a stored
transcript whose `cwd` is this repo. Not a regression, do not chase it.

**A squash merge does not mark the branch merged**, and it makes the branch hash a
**dead reference**. Read the landed hash off `main` after merging
(`git log --oneline -1 main`) — which is how `0e63253` was recorded rather than
the branch's `8b666fb`.

## The DOM phase's current reds, already attributed

Still leg 7's table, with #156's row rewritten. The wave commits merged into
`main` did move pixels, so it is also **pre-merge** evidence. #153 and #156 were
both instrument-only and moved none.

| driver | in batch | alone | verdict |
|---|---|---|---|
| `gui-95` | FAIL | FAIL | **pre-existing**, uninvestigated |
| `gui-49` | FAIL | FAIL | **pre-existing**, uninvestigated — and `gui-49:158` is on #166's bare-capture list, so it cannot presently be told apart from a capture stall without a re-run |
| `gui-123` | UNSCORED | UNSCORED | **#155**, working as designed |
| `gui-94` | FAIL | **PASS** | load artifact, plus a second deliberate cause (below) |
| `gui-91` | FAIL | **FAIL 1x, PASS 3x** | was #156. **A stall here now reports `UNSCORED` with the window state attached instead of a bare `FAIL`.** Cause still unknown → **#165** |
| `gui-93` | **PASS** | PASS | green; red-verified under mutation |
| `gui-124` | **PASS** | PASS | was batch-red at leg 6, unexplained |
| `gui-96` | — | **PASS** (ALL GREEN) | 11 criteria, all mutation-verified |

There is still **no full-phase baseline on an unmodified tree.**

**`gui-91` was run standalone at `0e63253` and PASSes**, plus two mutation runs
that red as intended (`UNSCORED` and `FAIL`). **`gui-122` was run standalone at
`454e8de` and PASSes** — twice unmodified plus four mutation runs.

**`gui-94` reds for a second, deliberate reason.** Gauntlet wave 2 gave
`.command-row-desc` a two-line clamp and new leading, changing a box `#94` pinned
as no-change: line box `12px -> 31.9px`, row height `60px -> 65.1px`. Its guarding
half still passes (AC1, AC2, surface 2), so the composer's slash popover is
untouched. **Reverting the line-height alone does not clear it**, and clearing it
means abandoning the CommandsDock work. Owner call 12. Do not "fix" it by
rebuilding its probe — binding constraint 5 forbids softening a check to clear a
red.

## Standing constraints for any leg touching the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles
`src/`; comments are free, and so is anything outside `src/`). D3 — the stylesheet
pins are literal-text and brittle: no comment in `styles/` may contain a closing
brace, `.bubble` and `.message-input` stay ungrouped, `.bubble {` must stay the
first literal occurrence in `chat.css`, exactly one `backdrop-filter` in all of
`styles/`, and the `@import` order in `styles.css` **is** the cascade. D4 — any
CSS change owes a driver pin that **executes**, naming which gate runs it; jsdom
loads no CSS, so neither the fast gate nor CI can see layout. The titlebar's
centring is load-bearing (#136).

Note `styles/` means `src/renderer/src/styles/`. A grep against a bare `styles/`
path silently finds nothing.

**Stylesheet value bans.** Only `400` and `600` font-weights, keywords included
(#139). No `em` font-size and exactly **one** literal px font-size, allow-listed
by exact `file:line` (#138). Exactly **one** box-shadow with a nonzero horizontal
offset (#140), the mint stripe in `rails.css` — the `inset 0 0 0 1px` hairline
idiom is unaffected, offset zero is the discriminator, and a `box-shadow` the
parser cannot read (`var(--x)`) **reds** rather than being skipped.

**`DESIGN.md` is read by five checks and each wants something different.**
`## Type` must name every `--text-*` value `tokens.css` defines (#138) **and**
keep the tool-card weight sentence (#139). `## Bans in force` must survive as a
split token and keep its glass exception (#125), its side-stripe ban, and #140's
exception with surface, declaration, scope and precedent disclaimer — **#140's
exception sits INSIDE that section**, and the split terminates on `\n## `, so a
new `##` heading above it would hide it. **It is CRLF**: a section regex needs
`\r?\n`. Do not cite `DESIGN.md` by line number (#138); name the section.

**`.context/` is LF while `DESIGN.md` is CRLF — do not normalise either to match
the other.** Keep `.context/` off the ticket branch and check
`git diff --cached --name-only` before committing.

**A grouped selector defeats the `.subagent-drawer` extractor idiom** (#140).
`^\.class\s*\{` matches nothing when the class is paired with its `:hover`. Use
`^\.class(?![\w-])[^{]*\{([^}]*)\}`, strip comments first, and prove it with a
rename probe.

**A content-hashed build artifact is a cheap second witness that no pixels moved**
(#140): `npm run build` keeping the same `index-*.css` filename corroborates a git
byte-identity check independently.

Carried from earlier legs, unchanged:

- **`inspect.mjs`'s surface list is gated in three places** — `SURFACES`,
  `run-desktop/SKILL.md` **and** `.gauntlet/bar/README.md`, inside their
  `surfaces:begin` / `surfaces:end` markers (#149). **`CLAIMED_HEADROOM_PX` in
  `inspect.mjs` is a copy of a sum argued in prose in `chat.css`** — never move it
  to match a measurement without moving that sum too.
- **A driver's capture destination is a checked property** (#146): use
  `process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`;
  `scripts/gui-*-shots/` stays narrowly gitignored.
- **Run `inspect.mjs` one at a time** (#142) and point `SCREENSHOT_DIR` outside
  the repo.
- **`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are
  FIVE.** A `*.source.mjs` sidecar is exempt and needs no wiring — do not re-glob
  sidecars.
- **Logic the fast gate must execute cannot live in `dom-phase.mjs`** or
  `inspect.mjs` — both spawn drivers at import (#142, #148). Put it in
  `drivers.manifest.mjs`.
- **Isolation is a property of the launch** (#147). New driver → spread
  `...profileArgs()` from `driver-profile.mjs`. **No opt-out list, and do not add
  one.** The profile is per driver **process**, not per launch — which is why a
  repetition harness that reuses one profile across its iterations measures a
  *different* premise from run 2 onward (warm bounds and zoom, which #79's show
  gate reads). Mint a fresh one per iteration.
- **A cold profile is not the same app as a warm one** — leg 6's whole finding,
  and #155 is the consequence.
- **A driver may decline to answer** (exit 2 → `UNSCORED`). **A driver that pins
  persisted app state must read it back** (#143). **A quarantine the verdict does
  not carry is a green** (#145). **A byte comparison that passes is not evidence a
  capture is stable** (#148). **`gui-75` is the first driver with a sidecar that
  is ALSO in `DOM_SKIP`** (#141) — "has a sidecar" and "is executed somewhere" are
  different claims.
- **The workflow is pinned as text** (#150). `tests/fast-gate-workflow.test.ts`
  reds on a changed job name, a changed command **set** (order is free), losing
  `if: always()` on the summary step, or **any** workflow invoking `test:dom`.
- **`document.body.focus()` DOES NOT MOVE FOCUS** — `body` has no `tabindex`, so
  the call is silently ignored. Both `gui-122` and `gui-123` "reset" focus this
  way before a Tab traversal and neither reset does anything. #164.
- **Only THREE drivers tab-traverse: `gui-122`, `gui-123`, `gui-124`.** An
  `i < 60` loop is not a Tab loop — `gui-48`, `gui-52`, `gui-54` and `gui-80` all
  carry one and none presses Tab; theirs are `waitForTimeout` poll budgets. **Do
  not re-open those four**; #154's comment records the measurement.
- **`waitFor` and `findBy*` share one timeout budget, and vitest's `testTimeout`
  caps both.** Any new async wait lives inside 1000ms by default and 5000ms
  absolutely. A per-assertion timeout at or above 5000ms is not "generous", it is
  unreachable, and it trades the assertion's own error message for a useless one.
  **390 async waits across 34 files** sit on that 1000ms default, there are
  **zero `configure()` calls**, and `vitest.config.ts` has **no `setupFiles`**. So
  there is no one-line lever for this class. **#162.**
- **`.appearance-field--stacked` no longer exists** anywhere in `src/`.

## Open questions

**Nine tickets sit with the owner**, each with the choice narrowed on the ticket
itself; `.claude/vibe.md` is only the index. **#155 is the most serious open
finding** — one by-hand run on a cold profile decides whether every new user's
first launch is broken, and the discriminator is simply whether the composer
cleared. **#150 is one `git push origin main` plus watching the first `fast-gate`
run.** **#161** is a live user-facing defect (Commands dock stuck empty). Then
**#152**, **#151**, **#159** and **#160** (two separate questions, not one),
**#157**, **#144**.

**Five tickets were filed by legs, all at `needs-triage`, none promotable by a
leg.** **#162** (leg 1): whether the repo should set a global `asyncUtilTimeout`;
needs infrastructure that does not exist (a `setupFiles` entry). **#163** (leg 2):
`gui-124` still bounds its Tab traversal with `hops < 12`, the last of #143's
class — mechanical, but whether it also wants the phase-1b rail check must be
measured rather than copied. **#164** (leg 2): the Tab-reach traversals start one
stop from their target, and `gui-123`'s sidecar has no vacuity guard.
**#165** (leg 3): `gui-91`'s capture stall has **no cause** and did not reproduce
in 28 runs; the question is how much machine time an unreproduced ~3% instrument
stall is worth, with the reversible default (accept it, wait for a real
occurrence, which now arrives self-attributing) recorded rather than taken.
**#166** (leg 3): **26 of 39** capture calls across the driver corpus are bare
`await`s with the same blast-radius hole — but whether each capture is *evidence*
or *feeds an assertion* was verified only for `gui-91`, and where the bytes feed
an assertion, continuing past a stall would be **worse** than throwing. Not a
mechanical sweep.

**CI exists, has never run, and `main` has never been pushed.**
`.github/workflows/fast-gate.yml`, on push, `windows-latest`, exactly `typecheck`
+ `test` + `build`. **Do not push on your own initiative** (D6) — leg 8 tested
this against a ticket whose own acceptance asked for a push and left the ticket
open rather than push. D6 was written and pressure-tested *under* the AFK grant,
so the grant does not override it. When the first run happens, expect the
worker-crash red; re-run the job before concluding anything about the runner.

**Gauntlet owner call 14 — the stop signal — is still unanswered and still (a).**
Two agent-reachable answers were attempted and both were refuted cross-model as
post-hoc goalpost movement. Under (a), run 2 was cut off by budget rather than
converged. Owner calls 12–13 live in the archived run record; 14–20 in
`.claude/gauntlet-core-surfaces.md`.

**Two claims run 2 already refuted or refused — do not act on either.** *"The app
has no icon vocabulary"* is **false** (measured 1:1 viewBox-to-pixel at
`strokeWidth 1.4` across every dock icon, counts identical at the seed).
*"Group the commands by purpose / give each row a leading icon"* is **not
buildable** — no category field exists and the captured list is a hand-authored
fixture chosen for row shape. Owner call 15.

**The bar's reference question (#149) is SETTLED by the artifact, against the
prose.** `.gauntlet/bar/README.md`'s "What each reference judges" table assigns
`linear/linear-features.png` to *"Titlebar + docks"*. Earlier `.context/` prose
claimed the docks shared the Sidebar's reference. **Read the table.** The bar is
intact: five `linear/` references, two `identity/`, plus `manifest.json`.

**A gauntlet run cannot take all nine surfaces at once.** `pieces` is capped at 6
and fixed at seed — a budget, not a claim that the unpicked surfaces lack a
standard.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-12-evidence-may-not-destroy-the-verdict-and-the-renderer-cannot-see-a-stalled-compositor]]
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
