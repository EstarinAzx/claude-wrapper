---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 7 leg 10 — owner away_
_At commit: `b2a3fd0` on `main`_

## Current focus

**Chain 7 is draining a ticket queue, with `/preset gauntlet` chained behind it.**
Leg 1 landed **#149**, leg 2 **#146**, leg 3 **#142**, leg 4 **#148**, leg 5
**#143**, leg 6 **#147**, leg 7 **#145**, leg 8 **#150's work**, leg 9 **#141**,
leg 10 **#138**. **Two tickets remain at `ready-for-agent`.**

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/138-one-type-scale` was squash-merged and
  deleted (content diffed empty against `main` first). Tree clean on `main`.
- **Landed 2026-08-11 (leg 10):** the whole of **#138** as `b2a3fd0`. **#138 is
  CLOSED** — all four acceptance criteria were dischargeable without a push.
  **Filed #159** at `needs-triage`.
- **Open and agent-ready (2):** #139, #140.
  **#144, #151–#158 and #159 are `needs-triage`** and none may be promoted by a leg.
- **Next:** **#139** — the tool-card prose/label weight pair.
- **The gauntlet's ordering constraint is now CLEARED.** #138 was the ticket
  `bar_win`'s *"one type scale holds across all of them"* clause was waiting on.
  Per-surface verdicts are no longer confounded by two scales.
- **#150 is still OPEN at `needs-info` and is NOT queue work.** Its code landed
  in full at leg 8; it waits on a human pushing and watching the first CI run.
- **Gate on `main` after the merge:** typecheck clean, **95 files / 1396 passed +
  36 skipped** (was 95 / 1393 + 36). The +3 are exactly this ticket's three
  source checks. Build clean. Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 20 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #138 changed, and the one thing worth carrying forward

**The app now paints seven distinct sizes where it painted eight**, and every one
is a rung:

| k | px | authored as | where |
|---|---|---|---|
| -2 | 11 | `--fs-micro` | divider, footer, meta |
| -1 | 13 | `--fs-ui` | UI labels, code |
| -1 | 13.3333 | *nothing* | `.win-btn`, Chromium's UA default — **#159** |
| 0 | 15 | `--fs-body` | prose, markdown `h3` |
| 1 | 17.25 | `calc(var(--fs-body) * 1.15)` | Welcome hint, markdown `h2` |
| 2 | 19.8375 | `calc(var(--fs-body) * 1.15 * 1.15)` | markdown `h1` |
| 2 | 20 | literal | `.subagent-drawer-close` glyph, allow-listed |
| 8 | 46 | `--fs-display` | `.welcome-title` |

**The rule is a ratio, not a list**, and its tolerance is fixed by the rungs it
already admits rather than chosen: 11 sits 0.34px off `15/1.15²`, so nothing
tighter than that can keep `--fs-micro` on the scale that documents it. That is
why `.win-btn` at 0.29px **cannot** be called a violation — it is closer to its
rung than a documented rung is to its own.

Full reasoning in
[[2026-08-11-a-ratio-rule-is-tested-as-a-ratio-and-its-tolerance-is-set-by-the-rungs-it-already-admits]].

## New landmines from this leg

**`git checkout -- <file>` during mutation testing destroys uncommitted work.**
This leg lost two finished files that way mid-run and had to re-apply them.
Mutating and reverting is routine here; on an **uncommitted** tree the revert
must be `cp` from a backup, never `git checkout`. Nothing was lost permanently
because the mutation output made it obvious, but it cost a rebuild.

**`DESIGN.md` is CRLF in this checkout.** A section regex written `\n## Type\n`
finds nothing and reports every rung missing — a red for the wrong reason that
reads exactly like real drift. Use `\r?\n`.

**`path.relative()` answers backslashes on win32.** Any check comparing its
output against a hand-written `a/b/c.css:12` allow-list silently never matches,
so the exception excuses nothing and the check reds on the line it was written
to permit. Normalise with `.split(path.sep).join('/')`.

**Four `src/` comments cited `DESIGN.md` by LINE NUMBER** and this edit moved
them all. They now name the **section**. Do not reintroduce line citations into
a file whose sections grow.

**`CLAIMED_HEADROOM_PX` stays 65 and the `chat.css` sum moved first.** The title
went 46.26 → 46, so its line box lost 0.33px and the content total went 253.4 →
253.1 — both still read 253 at whole-pixel terms. The landmine is one-directional:
never move the number to match a measurement; moving the sum and finding the
number still holds is the correct order.

## Carried forward, unchanged

**#155 is the biggest open finding and it is not a driver bug.** On a profile the
app has never started in, **no message sends at all** — measured one variable at
a time. That is every new user's first launch. **What has not been done, and it
is one run:** open the app **by hand** on a clean profile and type a message.
Everything so far went through `playwright-core`, so nobody has ruled out the
harness.

**`main` is intermittently red on `session-title-enrichment` (#153)** — 4 of 7
full runs at leg 5, green on every run at legs 6 through 10. Not evidence it is
fixed. A single red is not evidence your change broke something.

**`npm run test:dom` cannot be all-green while #155 is open** (`gui-123` reports
`UNSCORED`), and a full run also reports `INCOMPLETE` — the accepted `gui-119`
quarantine stated rather than hidden, not a break.

**The DOM phase's reds are attributed; do not re-investigate from scratch.**
`gui-95` and `gui-49` pre-existing and uninvestigated; `gui-123` is #155 working
as designed; `gui-94` a load artifact; `gui-91` intermittent ~1 in 7 (#156).
**Legs 8, 9 and 10 ran no full phase** — leg 10 ran only `gui-138`, four times —
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

## Standing constraints for any leg touching the renderer

Unchanged, and all still hold: no em dashes in user-visible strings
(`tests/copy-em-dash.test.ts` compiles `src/`; comments are free, and so is
anything outside `src/`); the stylesheet pins are literal-text and brittle (D3);
any CSS change owes a driver pin that **runs** (D4) — jsdom loads no CSS, so
neither the fast gate nor CI can see layout; the titlebar's centring is
load-bearing (#136); `DESIGN.md` is read literally by
`tests/subagent-material.test.ts`, which splits on `\n## Bans in force\n` — #140
edits that section, so the split token must survive verbatim.

**New since #138:** `styles/` may contain **no `em` font-size at all**, and
exactly **one** literal px font-size, allow-listed by `file:line`. Both are gated
in the fast gate. `DESIGN.md`'s `## Type` section must name every `--text-*`
value `tokens.css` defines, so a token moving without the document following is
a red.

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
- **A quarantine the verdict does not carry is a green** (#145).
- **Logic the fast gate must execute cannot live in `dom-phase.mjs`** or
  `inspect.mjs` — both spawn drivers at import. Put it in `drivers.manifest.mjs`.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken: the git history on the wave captures
(the repo is public), and gauntlet owner call 14, the stop signal. **SEVEN older
ones live in `.claude/vibe-130.md`.** Owner calls 14–20 are in
`.claude/gauntlet-core-surfaces.md`, the archived five-wave run.

**A third is still live and it is one command:** push `main` and watch
`fast-gate`, so #150 can close.

**#144 stands unanswered** and was deliberately not touched. **#151 through #159
are all `needs-triage`.** #155 remains the one worth reading first, and it needs a
human at a keyboard. **#159 is the newest** — whether a painted size may be
inherited from the user agent at all, which #138 named but did not answer.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
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
