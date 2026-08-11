---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, gauntlet relay leg 3 (run 2, wave 2) — owner away_
_At commit: `dcef5be` on `gauntlet/docks-and-min-window`; `main` still at `46e2fce` plus this note_

> **Run-2 capture landmine.** `.gauntlet/waves/1/`…`5/` hold **run 1's git-tracked**
> captures, and `inspect.mjs` writes the **same filenames**. Run 2 therefore writes
> `.gauntlet/waves/docks-and-min-window/<N>/`. Following the gauntlet preset's flat
> `.gauntlet/waves/<N>/` would silently overwrite the archived run's evidence — do not
> "correct" the namespaced path back.

> **New driver as of leg 3: `gui-gauntlet-wave2.mjs`.** 15 checks across the three docks,
> each carrying the reconstructed OLD value beside the new one. It is auto-enumerated into
> the driver set, so it runs in `npm run test:dom` and reports as a **named skip** in the
> fast gate (this is the 36 -> 37 skip change; the test count is unchanged at 1406). It has
> no `.source.mjs` sidecar and needs none.

> **`gui-94` is red on purpose now — read the DOM-phase section before "fixing" it.**

## Current focus

**THE TICKET QUEUE IS DRY, and the successor is RUNNING. Gauntlet run 2
(`docks-and-min-window`) landed WAVE 2 as `dcef5be` on
`gauntlet/docks-and-min-window`.** Its record is `.claude/gauntlet.md` **on that
branch** — `main`'s copy is the seed's and is stale by design. Chain 7 finished at
leg 12 and fired `/relay N=1 /preset gauntlet`; that chain is at leg 4.

**Wave 2 was the first wave that built, and every named gap closed.** Four builders,
one pin agent, four cross-model critics, one smoothing pass. All four verdicts hold at
`BAR WINS`, **zero `SPEC BREAK`s**, 4/4 critics verified against a first-hand read to
have seen real pixels. Gate green **twice** (D7), before and after smoothing.

**The cross-piece lever wave 1 identified landed.** `AgentsDock` wrote a named two-line
clamp group in `shared.css`; `CommandsDock`, serialized behind it on the same file,
**joined it** rather than inventing a third treatment. Serializing those two is now
proven necessary rather than predicted.

**`plateau` is 1, and it is the failure run 1 predicted in advance.** 4/4 critics
answered BETTER; 0/4 verdicts moved, because the ordinal has three states and Linear is
a deliberately hard bar. Run 1 ruled ahead of time that this is **an owner call, not
something a leg may fix by adjusting the counter** — so the counter was incremented
honestly. Two more waves like this and the run halts at `plateau: 3` while still
improving. **Owner call 13** in the state file.

**The seed's named risk fired for the first time.** All three dock gaps now converge on
one systemic absence — the app has no icon vocabulary (header glyph group, leading row
icons, selection affordance). Three different elements, not the same defect, so the
decomposition still stands. What it means is that no existing piece owns the question,
which is why the smoothing pass's new piece was accepted: **`DocksAsOne`, five of six
slots used, critic-only on wave 3**, and its first verdict cannot count toward `plateau`.

Leg 1 landed **#149**, leg 2 **#146**, leg 3 **#142**, leg 4 **#148**, leg 5
**#143**, leg 6 **#147**, leg 7 **#145**, leg 8 **#150's work**, leg 9 **#141**,
leg 10 **#138**, leg 11 **#139**, leg 12 **#140**. Twelve legs, twelve tickets,
zero human touches.

`gh issue list --state open --label ready-for-agent` returns `[]`. Nothing else
is promotable by a leg — the remaining twelve open issues are eleven at
`needs-triage` plus **#150** at `needs-info`.

The queue was filled by an autonomous `/preset vibe` pass run under the owner's
AFK autonomy grant. Every ruling, warrant and cross-model objection is in
`.claude/vibe.md`; read it before overturning anything.

## State

- **In flight:** nothing. `ticket/140-session-stripe-exception` was squash-merged
  and deleted (content diffed empty against `main` first). Tree clean on `main`.
- **Landed 2026-08-11 (leg 12):** the whole of **#140** as `2ab67f1`. **#140 is
  CLOSED** — every acceptance criterion was dischargeable without a push. **No
  follow-up ticket filed**; nothing in the work produced one.
- **Open and agent-ready: NONE.** **#144, #151–#160 are `needs-triage`** and none
  may be promoted by a leg.
- **Next:** gauntlet run 2 **wave 3**, at `plateau: 1`. There is no next ticket.
- **Wave 2's fan-out shape was run 1's exact trap, and serializing worked.**
  **`CommandsDock` has NO stylesheet of its own** (zero `.commands-dock` rules in
  `styles/`); it rides the shared `agents-dock` shell in `rails.css`, which
  `AgentsDock` also owns. They were serialized inside the fan-out, exactly as run 1
  serialized Welcome/Chat on `chat.css`, **and the second builder joined the first's
  shared group instead of inventing a rival one** — which is the whole return on
  serializing rather than merely the collision avoided. **Any future wave touching both
  pieces must do the same.** `AppearanceDock` owns `appearance.css` and its 2
  `.agents-dock` refs were confirmed not to reach the shell (a comment and a
  resize-handle override); `WelcomeMinWindow` writes `Welcome.tsx` + `chat.css`.
- **A `bar_win` clause no wave can currently judge:** empty states. `AgentsDock` has
  three `agents-dock-empty` branches (`AgentsDock.tsx:307`, `:311`, `:315`) and a
  `background-tasks` footer (`:407`), but **the instrument photographs only the
  populated state**, so no critic has ruled or can rule on them. Closing that needs an
  instrument change — a ticket, not a wave.
- **#150 is still OPEN at `needs-info` and is NOT queue work.** Its code landed
  in full at leg 8; it waits on a human pushing and watching the first CI run.
- **Gate on `main` after the merge:** typecheck clean, **96 files / 1406 passed +
  36 skipped** (was 95 / 1398 + 36). The +1 file and +8 tests are exactly this
  ticket's new test file. Build clean. Ran on the branch and again on `main`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED**, now 24 commits ahead. D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #140 changed, and the one thing worth carrying forward

The selected session row's mint stripe **stays**, and `## Bans in force` gained
one named, scoped exception beside #125's glass exception. The stripe itself is
untouched — this was a document edit plus a test.

**The transferable rule is about which direction an amendment protects.** Prose
protects the stripe from a conformance pass, which is the direction #125 argued
and it is real here: two reviewers have now read this stripe against the spec,
one backwards as a full outline and one correctly as a spec break.

The other direction was wide open. **Before this commit nothing in the repo
asserted the stripe existed** — `rails.css:548` was its only occurrence, read by
no test and no driver. Delete the rule and every check stays green while
`DESIGN.md` goes on granting an exception for a declaration that is gone.

`subagent-material.test.ts` already names that failure for #125 in its own
comment: rule-without-amendment and amendment-without-rule must **both** red. So
"in #125's form" was read to include its **pin**, not only its sentence.

| half | holds | gate |
|---|---|---|
| code | the row declares `inset 2px 0 0 0 var(--color-mint)` over `--mint-wash` | `npm test` |
| scope | exactly ONE box-shadow in `styles/` has a nonzero horizontal offset | `npm test` |
| anti-vacuity | every `box-shadow` value is one the parser can actually read | `npm test` |
| document | the ban survives, and names surface + declaration + scope + not-a-precedent | `npm test` |

Full reasoning in
[[2026-08-11-a-permission-outlives-the-thing-it-permits-unless-both-are-pinned]].
It is the sibling of #139's rule one turn out: there a value's *reason* went
unchecked, here a permission's *subject* does.

## New landmines from this leg

**`styles/` may now contain exactly ONE box-shadow with a nonzero horizontal
offset**, and it is `rails.css`'s mint stripe. Any second surface growing a side
stripe reds `tests/session-stripe-exception.test.ts`. The `inset 0 0 0 1px`
hairline idiom is unaffected — its offset is zero, which is the whole
discriminator.

**A `box-shadow` that check cannot parse also reds.** Writing
`box-shadow: var(--some-stripe)` fails the anti-vacuity test rather than being
skipped. If a token-indirected shadow is ever genuinely wanted, the check must be
widened deliberately; deleting it silently stops the scope scan covering anything.

**`DESIGN.md`'s `## Bans in force` now has FOUR pinned properties**, and they
are split across two files. `subagent-material.test.ts` holds the glass half
(#125); `session-stripe-exception.test.ts` holds the side-stripe ban itself plus
the new exception's surface, declaration, scope phrase and precedent disclaimer.

**The `.subagent-drawer` extractor idiom does not transfer to grouped selectors.**
`.session-row-btn-active` is paired with its `:hover`, so the anchored
`^\.class\s*\{` pattern matches nothing — the next character is a comma. Use
`^\.class(?![\w-])[^{]*\{([^}]*)\}` and strip comments first. Two probes prove it
reads the real rule: renaming the class reds, and `.session-row-btn-active-x` is
refused by the lookahead.

**A content-hashed build artifact is a second witness that no pixels moved.**
`npm run build` kept `index-B83pCap1.css`, which corroborated the git byte-identity
check independently and is cheap to read off the build log.

## Carried forward, unchanged

**#155 is the biggest open finding and it is not a driver bug.** On a profile the
app has never started in, **no message sends at all** — measured one variable at
a time. That is every new user's first launch. **What has not been done, and it
is one run:** open the app **by hand** on a clean profile and type a message.
Everything so far went through `playwright-core`, so nobody has ruled out the
harness.

**`main` is intermittently red on `session-title-enrichment` (#153)** — 4 of 7
full runs at leg 5, green on every run at legs 6 through 12. Not evidence it is
fixed. A single red is not evidence your change broke something.

**`npm run test:dom` cannot be all-green while #155 is open** (`gui-123` reports
`UNSCORED`), and a full run also reports `INCOMPLETE` — the accepted `gui-119`
quarantine stated rather than hidden, not a break.

**The DOM phase's reds are attributed; do not re-investigate from scratch.**
`gui-95` and `gui-49` pre-existing and uninvestigated; `gui-123` is #155 working
as designed; `gui-91` intermittent ~1 in 7 (#156).

**`gui-94` NOW REDS FOR A SECOND, DELIBERATE REASON — measured at gauntlet leg 3, not
predicted.** It was previously listed here as a load artifact. It now also **exits 1 on
AC3 and AC4**: `.command-row-desc` line box `12px -> 31.9px`, row height `60px -> 65.1px`.
Gauntlet wave 2 gave that description a two-line clamp and a new leading, which is a
deliberate change to the box `#94` pinned as no-change. **Its guarding half still passes**
— AC1, AC2 and surface 2 are green, so the composer's slash popover is untouched and
`#94`'s actual promise held. **Reverting the line-height alone does NOT clear it**: AC3
measures element height, so a two-line clamp at 1.1 is still ~24.2px against a 12px probe.
Clearing it means reverting the clamp, i.e. abandoning the CommandsDock piece. **Owner
call 12** in `.claude/gauntlet.md` on the branch. Do not "fix" `gui-94` by rebuilding its
probe — its own header names that trap, and binding constraint 5 forbids softening a check
to clear a red.
**Legs 8 through 12 ran no full phase** — leg 11 ran only `gui-96`, and leg 12
ran none at all, correctly: #140 moved no pixels, so D4 was not engaged. The
table is still leg 7's, and there is still **no full-phase baseline on an
unmodified tree**.

**A clean checkout runs FOUR FEWER TESTS than your working tree, forever**
(#157). `tests/transcript-rewind-real-store.test.ts` skips unless it finds a
stored transcript whose recorded `cwd` is this repo. Do not chase it.

**The bar discrepancy #149 left open is SETTLED, and the prose above it was the
wrong half.** `.context/` prose said the three docks *"share the Sidebar's
reference"*; `.gauntlet/bar/README.md`'s "What each reference judges" table assigns
`linear/linear-features.png` to *"Titlebar + docks"*, and `linear/manifest.json`
carries the **same `judges` string independently**. Two artifacts agree against the
prose, so this is settled by evidence rather than by preference. **Read the table.**
The run-2 seed and wave 1 both took this reading; do not reopen it.

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
read literally by **two** tests now, `tests/subagent-material.test.ts` and
`tests/session-stripe-exception.test.ts`, both splitting on
`\n## Bans in force\n` — **that token must survive verbatim, and #140's exception
sits INSIDE the section rather than under a new `##` heading**, since the split
also terminates on `\n## `.

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

**TWO NEW OWNER CALLS from gauntlet wave 2**, both in `.claude/gauntlet.md` **on the
branch**, both with a reversible default already taken:

- **Owner call 12 — `gui-94` is red and there is no cheap fix.** Default taken: keep the
  work, leave the driver red, record it. The honest resolution is to retire AC3/AC4 as a
  no-change criterion that has been deliberately superseded while keeping AC1, AC2 and the
  popover surface, which all still pass. Editing the probe is forbidden; reverting the
  clamp costs the CommandsDock piece.
- **Owner call 13 — the verdict scale has stopped resolving real progress.** 4/4 critics
  said BETTER, 0/4 verdicts moved, `plateau` rose on a wave where every gap closed. Two
  more like it and the run halts while still improving. Options, none taken: widen the
  ordinal, count the critics' own change answer, or accept that halting-while-improving is
  what an unreachable bar is for. **The counter was not adjusted** — run 1 named this as
  the owner's call specifically so a leg could not quietly rule on it.

**#161 is new**, filed by leg 3 at `needs-triage`: `CommandsDock` fetches once on mount
with no retry, so a dock opened before the CLI handshake shows **0 rows while a direct
`listCommands()` returns 126**, and stays empty for as long as it is open. Found by the
gauntlet instrument; not fixable by a wave, since gauntlet grades design and this is
correctness.

**#144 stands unanswered** and was deliberately not touched. **#151 through #161
are all `needs-triage`, and with the queue dry they are the whole remaining
backlog** — promoting any of them is an owner decision, never a leg's. #155
remains the one worth reading first, and it needs a human at a keyboard. **#160
is the direct sequel to #139**:
is the 600 licence exhaustive or illustrative? Eight elements sit outside it on
the reading #139 used, and #138 widened this very line one commit earlier rather
than restriking code — so the precedents point opposite ways. **#159** is its
sibling one property over, for sizes.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
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
