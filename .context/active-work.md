---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-12 by Opus 5, gauntlet relay leg 7 (run 2, wave 6) — owner away_
_At commit: `8048c8e` on `gauntlet/docks-and-min-window`; `main` still at `46e2fce` plus these notes_

> **This note covers waves 5 AND 6. Leg 6 never committed a `.context/` update**, so
> `main`'s newest context commit before this one was `95b289b` (wave 4) while the branch
> had already landed wave 5 as `4219912`. If a leg's `.context/` commit is missing, the
> branch log is the authority.

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

> **Second new driver as of leg 4: `gui-gauntlet-wave3.mjs`.** 9 checks across Welcome
> and two docks, each carrying its reconstructed OLD value. **Red-verified by three
> mutations producing three distinct targeted reds.** Same auto-enumeration as its wave-2
> sibling, so it is the **37 -> 38 skip change**; test count still 1406. No sidecar, needs
> none. It measures Welcome FIRST, before a folder is opened, because that surface stops
> existing afterwards.

> **"The app has no icon vocabulary" (recorded by wave 2) is REFUTED.** Every icon in the
> three docks renders **1:1 viewBox-to-pixel at `strokeWidth 1.4`**, and the dock icon
> counts were **identical at the seed commit**, so wave 2 added none. What actually
> differed was button **chrome**. A mechanical sweep check now enforces the vocabulary —
> **8 icons before wave 4, 11 after, all uniform.**

> **Third new driver as of leg 5: `gui-gauntlet-wave4.mjs`.** 14 checks across Welcome and
> two docks, each carrying its reconstructed OLD value. **Red-verified by three mutations
> producing three distinct targeted red sets.** Same auto-enumeration, so it is the
> **38 -> 39 skip change**; test count still 1406. Two hard-won facts live in its header:
> `.agent-row-btn` does not exist without a session (push `subagent:changed` from MAIN), and
> **`model`/`spawnDepth` can never arrive from a live push** — `mergeAgents` takes both from
> the disk sidecar only.

> **A CSS font stack fails SILENTLY.** `getComputedStyle` returns the **authored** stack,
> never the face that won, so a `font-family` naming a missing family passes every string
> check while rendering identically to before. Wave 4's `W3` compares the headline's rendered
> advance width under both optical masters **and** requires the title's own box to move when
> forced back. As first written it compared two detached probes — which measures whether the
> font is *installed*, not whether the element wears it — and it stayed green under the
> mutation that deleted the rule.

## Current focus

**THE GAUNTLET IS RUNNING AND A VERDICT HAS MOVED BACKWARDS FOR THE FIRST TIME.** Run 2
(`docks-and-min-window`) landed **WAVE 5** as `4219912` and **WAVE 6** as `8048c8e` on
`gauntlet/docks-and-min-window`, now at **`plateau: 1`**. Its record is
`.claude/gauntlet.md` **on that branch** — `main`'s copy is the seed's and is stale by
design. Chain 7 fired `/relay N=1 /preset gauntlet`; that chain is at leg 8.

**Wave 5 moved a SECOND verdict up** (`AppearanceDock` `BAR WINS` -> `TOO CLOSE`, from a
piece that did have a builder). **Wave 6 moved one DOWN** — `DocksAsOne` `TOO CLOSE` ->
`BAR WINS`, the first regression in either run — and since no piece improved, `plateau`
went 0 -> 1 on the preset's literal rule. **Six waves of budget remain** (`max_waves: 12`)
and the halt is two waves away at the earliest.

**THE REGRESSION IS THE THING TO UNDERSTAND, AND ITS STATED REASON IS PARTLY FALSE.**
`DocksAsOne` had no builder; what moved it was `CommandsDock` closing its own gap with a
resting row shell, which the cross-dock critic read as a third row grammar. **Measured at
leg 7: Agents and Appearance are the SAME treatment at two tokens** —
`.agent-row--selected` fills `--tint-3`, `.appearance-choice[aria-checked]` fills
`--mint-wash`, both fill-only with no boundary. One list of four differs, not three.
**Do not hand that gap to a builder as written.** Two structural bounds: `App.tsx:54`
holds `openDock` as a single nullable state, so the three docks can never be co-resident
and the critic compared a composite a user cannot see; and `--tint-2` (0.06) sits
deliberately below `--border` (0.08).

**Three consecutive waves have had a per-dock build move `DocksAsOne` — up, held, down.
The per-dock and cross-dock critics are trading against each other. That is owner call 19
and it needs a human.**

> **STANDING INSTRUCTION, new at wave 6: run EVERY gauntlet driver every wave, not only
> the one the leg wrote.** `gui-gauntlet-wave2.mjs` C2b had been **red since wave 5** and
> went unreported for a whole wave, because legs had only ever run their own driver. A pin
> an older driver holds over ground a later wave moved is invisible otherwise.

> **Fourth new driver as of leg 6, fifth as of leg 7: `gui-gauntlet-wave5.mjs` and
> `gui-gauntlet-wave6.mjs`.** Both auto-enumerated, so they are the **39 -> 40 -> 41 skip
> change**; test count still **1406**. Wave 6's driver is 12 checks, and **seven of them
> carry a LIVE reconstruction that is itself asserted to fail**, so they re-prove their own
> falsifiability on every run rather than relying on a one-time mutation.

> **A CHECK CAN GO WRONG IN FOUR DISTINCT WAYS, and this run has now hit all four.**
> (1) it measures a proxy for its premise rather than the premise (wave 4 B5: a column
> width standing in for a line count); (2) it is phrased against a state the pre-wave tree
> already satisfied — a tie (wave 5 W6) or a boundary (wave 6 B2, where a 2x threshold was
> met exactly by the design being replaced); (3) its RECONSTRUCTION breaks rather than its
> assertion, when it reverts one declaration of a multi-declaration change (wave 5 W6 at
> wave 6, reasoning about `[24, 8, 32]`, a state no wave ever had); (4) it cannot fail at
> all (wave 6 D7: `agents-dock` matched `.agents-dock-head`). **Every one was found by a
> probe. None was found by reading the code.**

> **Builder figures and driver figures are different quantities**, the same trap as the
> documented critic-vs-CSS one, a layer down. Wave 6's B2 took a 2x threshold the builder
> derived **ink to ink** and applied it to a **box to box** measurement, where the pre-wave
> ratio is exactly 2.0.

**The critics' change-answer column was tested with a NULL CONTROL, and wave 3's reading of
it is corrected.** `commands-dock.png` is **byte-identical across waves 2, 3 and 4**
(verified with `cmp`). Wave 3's critic answered **BETTER** on those unmoved pixels; wave 4's
answered **SAME**. So wave 3's "3/4 BETTER" contained a false BETTER, and that column is
usable **only** with an explicit anti-inference clause in the critic prompt plus the unbuilt
control. Keep CommandsDock's capture as that control for as long as it stays unbuilt.

**Wave 4's result is one verdict movement, one refused `SPEC BREAK`, and three closed gaps.**
Three builders, six cross-model critics, one smoothing pass — **ten agents, zero errors**.
**6/6 critics verified against a first-hand read** to have seen real pixels. The `SPEC BREAK`
(AgentsDock's metadata-less row) was **refused on four grounds**, the decisive one found
while building the driver: `model`/`spawnDepth` are **disk-only**, so a live agent
legitimately has no metadata line.
Gate green (D7).

**`CommandsDock` got no builder, and that is owner call 15.** Its gap asked to group
commands by purpose and give each a leading icon; both need a semantic taxonomy the data
cannot supply. `SlashCommandInfo` has no category field, the list comes from an external
CLI a user or plugin can extend, and **the seven commands are a hand-authored fixture**
whose own header calls it *"the one surface whose content this file cannot reach
honestly"* and states it is chosen for **row shape**. Authoring groups in would photograph
a structure the real app cannot produce. `commands-dock.png` is byte-identical, which
corroborates the refusal independently.

**A critic named a measurably false gap and it was caught before a builder saw it.** The
`DocksAsOne` baseline claimed Commands "breaks the shared type scale"; all three docks'
primary names are `var(--fs-ui)` and the difference is `var(--mono)`, which is deliberate
and grouped. **A critic's perception can be real while its stated cause is wrong.**

**`plateau` is 2, but the scale behaved BETTER than wave 2.** Wave 2 was 4/4 BETTER with
nothing moving — the shape that made the counter look broken. Wave 3 is **3/4 BETTER +
1/4 SAME**, so the critics' own change answers are converging with the counter. That is
evidence the plateau is becoming **real** rather than an instrument artifact. The counter
was still not adjusted. **Owner call 13 is updated, not re-raised.**

**The piece list is now FULL at six of six.** The smoothing pass spent the last slot on
**`IconHousing`** — the shared 28px icon button and its three glyph grids across five
surfaces, a rule **no existing piece can see**. Critic-only on wave 4; its first verdict
is a baseline and cannot count toward `plateau`. No further piece may be proposed.

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
- **Next:** gauntlet run 2 **wave 5**, at `plateau: 0` after the wave-4 reset. There is no
  next ticket. Wave 5's shape is worked out in `.claude/relay/gauntlet.md`: **five builders,
  one critic-only.** `AgentsDock` gets no builder (its gap is refused as unbuildable);
  `IconHousing` becomes buildable and is **owner call 16** — its gap moves 7 of 13 tenants
  and the `D4.8` sweep check must move with it, so serialize it against the dock builders.
- **Merge-time follow-up (do NOT fix early):** `.context/overview.md:215` names
  `.appearance-field--stacked`. Wave 4 deleted that class **on the branch only** — on `main`
  it still exists, so the line is correct today and goes stale the moment the branch merges.
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
