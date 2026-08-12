---
type: pick-up
project: claude-wrapper
updated: 2026-08-12
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

## Queue: three tickets, and they are all instrument work

A triage pass ran over the **whole** open queue on 2026-08-12 under an explicit
owner grant, using `vibe`'s machinery — grep-verified warrants, a cross-model
adversary, one rebuttal round. Full record and the numbers: `.claude/vibe.md`.

| Order | # | Why it promoted |
|---|---|---|
| 1 | **#153** | `main` is intermittently red and this very file used to *instruct* readers to discount a red. Fix shape named in the ticket. |
| 2 | **#154** | Mechanical port of a move already shipped and pinned in `gui-123.mjs` (`1c42d3c`). |
| 3 | **#156** | The project rule is measure-before-fix; the measurement *is* the work. Budget for run counts — the defect is ~1 in 7. |

**Verify rather than trust this file. It has been wrong before, twice in the last
pass alone** (it claimed 12 open issues when there were 13, and 24 commits ahead
when there were 34):

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

**Say it out loud at boot if it is still true: all three are instrument and test
quality. None changes the app.** Every user-facing item in the tracker is a design
call, and nine of them are sitting on the owner. That is not a queue failure — the
record genuinely cannot settle them, and a cross-model adversary killed every
attempt to — but this chain will not ship a visible change. The visible change is
meant to come from the **gauntlet chained behind it**.

## The one rule the loop body will try to break

**Never apply the `ready-for-human` label.** The owner banned it while away and the
ban is recorded in memory (`afk-autonomy-grant.md`): *"never tag anything ready for
human as i will be away from home"*.

**`/preset ticket-loop` steps 4 and 6 both tell you to apply it** — on a branch
collision and on a failed gate. The body ranks **below** this rule. It is pinned
here rather than in a leg file because a fresh chain writes a fresh leg file and
loses the override; step 1 of every firing reads *this* file.

Instead: label **`needs-info`**, comment with exactly where you stopped and what a
cold reader needs, `PushNotification`, and **stop the chain**. The relabel only ever
existed to stop the next leg re-picking a stuck ticket forever — stopping the chain
achieves that without the banned label.

## What changed on main just now, and it is the biggest item

**`gauntlet/docks-and-min-window` was merged into `main` as `25d13e0`.** Twelve
waves of design work across six components and six stylesheets, plus `inspect.mjs`
and eight `gui-gauntlet-wave*.mjs` driver pins. Automatic merge, zero conflicts.

**Why it needed doing:** `main` held six commits *narrating* waves 1-12 in
`.context/` while the waves themselves lived only on the branch. Every future ticket
branch was cutting from the half without the work.

**How that run really ended, because the merge message is the only place it is
stated plainly:** it stopped on its `max_waves` backstop at wave 12 with
`plateau: 2` — cut off, **not** converged. One verdict moved *backwards* at wave 7.
Waves 8 through 12 were pixel-identical critic-only stalls. `CommandsDock` reached
`YOURS WINS` and closed; `AgentsDock` held `BAR WINS` the whole run.

**The branch is not deleted.** Each wave is its own commit, so "take wave 7 instead"
is a checkout.

`.claude/gauntlet.md` was **archived to `.claude/gauntlet-docks-and-min-window.md`**.
Required, not tidiness: it carries `wave: 12 / max_waves: 12 / stop: true`, so a
chained gauntlet would seed-guard onto the closed run and halt immediately.

**Gate on merged `main` at `25d13e0` is green:** typecheck clean, 96 files / 1406
passed / 44 skipped, build clean.

## Before you trust a gate result

**A gate can go RED with ZERO failing tests. This is new and it will be seen again.**
Measured today on this tree: 95 of 96 files reporting, one worker process exited
unexpectedly (`Worker exited unexpectedly` / `[vitest-pool]`), `npm test` exit 1, and
**no `FAIL` line anywhere**. The immediate re-run was 96 of 96, 1406 passed, exit 0.
The default reporter does not name the file that vanished — you need
`--reporter=json` or a file-count diff against the 96 on disk to find it.

**So there are now two independent "red that is not your change" shapes**: the one
above, and #153's `session-title-enrichment` 1000ms `findByText` under full-suite
load (4 of 7 runs at leg 5, including one on a stashed unmodified tree). Re-run
before believing either. If it is #153's test, stash and run against the bare tree.

**`npm run test:dom` cannot be all-green while #155 is open**, because `gui-123`
honestly reports `UNSCORED`. A full run also reports `INCOMPLETE` — the accepted
`gui-119` quarantine stated rather than hidden. Both are correct readings.

**Do not run the fast gate concurrently with the DOM phase.** Leg 7 did, and it cost
two ambiguous reds and five attribution runs to unpick.

**`npm run x | tail` then `echo $?` gives you `tail`'s exit code.** Redirect to a
file and read `$?` on its own line.

**A clean checkout runs four fewer tests than your working tree** because
`tests/transcript-rewind-real-store.test.ts` skips without a stored transcript whose
`cwd` is this repo. **#157**, still open and still a live owner call. Not a regression.

**Never revert a mutation with `git checkout -- <file>` on an uncommitted tree.**
Leg 10 did and lost two finished files mid-run. Back up with `cp` and restore from
that. Mutation testing is routine here — leg 12 ran thirteen and hash-checked every
file back.

**Do not read the DOM phase's verdict off a compound command.** It has reported
**exit 0 while its own text said `DOM PHASE FAIL`**.

## The DOM phase's current reds, already attributed

Legs 8 through 12 ran no full phase — leg 11 ran only `gui-96`, leg 12 none at all,
correctly, since #140 moved no pixels. This table is leg 7's and nothing has moved it.
**The wave commits just merged did move pixels, so it is now also pre-merge evidence.**

| driver | in batch | alone | verdict |
|---|---|---|---|
| `gui-95` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-49` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-123` | UNSCORED | UNSCORED | **#155**, working as designed |
| `gui-94` | FAIL | **PASS** | load artifact, not filed |
| `gui-91` | FAIL | **FAIL 1×, PASS 3×** | **#156**, intermittent ~1 in 7 |
| `gui-93` | **PASS** | PASS (leg 9, twice) | green; red-verified under mutation |
| `gui-124` | **PASS** | PASS | was batch-red at leg 6, unexplained |
| `gui-96` | — | **PASS** (leg 11, ALL GREEN) | 11 criteria, all mutation-verified |

There is still **no full-phase baseline on an unmodified tree.**

## CI exists, has still never run, and main has never been pushed

**Do not trust a commit-count written in this file.** It increments with every
commit, including the commit that corrects it — an earlier draft said 35, then 49,
and both were stale before the file was saved. Read it:

```bash
git rev-list --count origin/main..main
```

It was in the high forties when this baton was written.

`.github/workflows/fast-gate.yml`, on push, `windows-latest`, exactly `typecheck` +
`test` + `build`. **Nothing has ever been pushed from this checkout.** That is why
#150 is open, and closing it is one owner command.

**Do not push on your own initiative** (D6). Leg 8 tested this against a ticket whose
own acceptance asked for a push and left the ticket open rather than push. D6 was
written and pressure-tested *under* the AFK grant, so the grant does not override it.

**When the first CI run happens, expect the worker-crash red above.** `fast-gate`
runs `npm test`. Re-run the job before concluding anything about the runner.

## The nine that are yours, indexed

Every one has the choice narrowed to a short list **on the ticket itself** — the
issue comment is the artifact, `.claude/vibe.md` is only the index.

- **#155** — one by-hand run on a cold profile decides whether every new user's first
  launch is broken. Moved `needs-triage` -> `needs-info`. **Still the most serious
  open finding.** Report only whether the composer cleared; that is the discriminator.
- **#150** — one `git push origin main`, then watch the first `fast-gate` run.
- **#161** — live user-facing defect (Commands dock stuck empty). Three fix shapes;
  two need an engine-ready signal that `src/main` does not have.
- **#152** — 208 tab stops ahead of the transcript. One of four.
- **#151** — Windows username in committed captures. One of three.
- **#159** / **#160** — **two separate questions**, not one. The old note's "same
  question one property apart" was a prior leg's shorthand and was refuted cross-model.
- **#157** — should a skip CI can never satisfy be stated at all.
- **#144** — what forces anyone to run the DOM phase. Option 4 is what the project
  already lives, unstated.

## Landmines

**The workflow is pinned as text** (#150). `tests/fast-gate-workflow.test.ts` reds on:
a changed job name, a changed command **set** (order is free), losing `if: always()`
on the summary step, or **any** workflow invoking `test:dom`.

**`styles/` may contain only `400` and `600` font-weights** (#139), keywords included;
**no `em` font-size and exactly ONE literal px font-size** (#138), allow-listed by
exact `file:line`; and **exactly ONE box-shadow with a nonzero horizontal offset**
(#140), the mint stripe in `rails.css`. The `inset 0 0 0 1px` hairline idiom is
unaffected — offset zero is the discriminator. A `box-shadow` the parser cannot read
(`var(--x)`) reds rather than being skipped.

**`DESIGN.md` is read by five checks** and each wants something different. `## Type`
must name every `--text-*` value `tokens.css` defines (#138) **and** keep the
tool-card weight sentence (#139); `## Bans in force` must survive as a split token and
keep its glass exception (#125), its side-stripe ban, and #140's exception with
surface, declaration, scope and precedent disclaimer. **The #140 exception sits INSIDE
that section** — the split terminates on `\n## `, so a new `##` heading above it would
hide it. **It is CRLF** (verified 110/110, zero bare CR or LF): a section regex needs
`\r?\n`, though both DESIGN.md-reading test files normalise first.

**`.context/` is LF while `DESIGN.md` is CRLF — do not normalise either to match the
other.** Keep `.context/` off the ticket branch and check
`git diff --cached --name-only` before committing.

**Do not cite `DESIGN.md` by line number** (#138). Name the section.

**A grouped selector defeats the `.subagent-drawer` extractor idiom** (#140).
`^\.class\s*\{` matches nothing when the class is paired with its `:hover`. Use
`^\.class(?![\w-])[^{]*\{([^}]*)\}`, strip comments first, and prove it with a rename
probe rather than trusting it.

**`CLAIMED_HEADROOM_PX` in `inspect.mjs` is a copy of a sum argued in prose in
`chat.css`.** Never move it to match a measurement without moving that sum too.

**`gui-75` is the first driver with a sidecar that is ALSO in `DOM_SKIP`** (#141).
"Has a sidecar" and "is executed somewhere" are now different claims.

**The check set is enumerated ONCE**, in `drivers.manifest.mjs` (`loadChecks()`), which
also enumerates the non-driver `.mjs` files — **there are FIVE**. A `*.source.mjs`
sidecar needs no wiring. Do not re-glob sidecars in the test file.

**Logic the fast gate must execute cannot live in `dom-phase.mjs`** — it spawns drivers
at import, same rule as `inspect.mjs` (#142, #148). Put it in `drivers.manifest.mjs`.

**Every driver launches on a private `userData`** (#147). New driver → spread
`...profileArgs()` from `driver-profile.mjs`. **No opt-out list, do not add one.** The
profile is per driver PROCESS, not per launch.

**A cold profile is not the same app as a warm one.** Leg 6's whole finding, and #155
is the consequence.

**A quarantine the verdict does not carry is a green** (#145). **A driver that pins
persisted app state must READ IT BACK** (#143). **A byte comparison that passes is not
evidence a capture is stable** (#148). **Run `inspect.mjs` one at a time** (#142) and
point `SCREENSHOT_DIR` outside the repo.

**A squash merge does not mark the branch merged**, and it makes the branch hash a
**dead reference** — the squash creates a new commit on `main`, so deleting the branch
leaves its hash reachable from nothing. Leg 12 cited a branch hash in seven places
before catching it. Record the hash read off `main` AFTER the merge:

```bash
git log --oneline -1 main
```

## Standing constraints for the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles `src/`;
comments are free, and so is anything outside `src/`). D3 — the stylesheet pins are
literal-text and brittle: no comment in `styles/` may contain a closing brace,
`.bubble` and `.message-input` stay ungrouped, `.bubble {` must stay the first literal
occurrence in `chat.css`, exactly one `backdrop-filter` in all of `styles/`, and the
`@import` order in `styles.css` IS the cascade. D4 — any CSS change owes a driver pin
that **executes**, naming which gate runs it; jsdom loads no CSS, so neither the fast
gate nor CI can see layout. The titlebar's centring is load-bearing (#136).

**A content-hashed build artifact is a cheap second witness that no pixels moved**
(#140): `npm run build` keeping the same `index-*.css` filename corroborates a git
byte-identity check independently.

**Adding or removing a capture surface costs three edits** (#149): `SURFACES` in
`inspect.mjs`, the `surfaces:begin`/`surfaces:end` region in
`.claude/skills/run-desktop/SKILL.md`, and the same region in `.gauntlet/bar/README.md`.

**A new driver's capture destination is gated** (#146): use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.

## For the gauntlet run chained behind this queue

**The bar's reference question (#149) is SETTLED — by the artifact, against the
prose.** `.gauntlet/bar/README.md`'s own "What each reference judges" table assigns
`linear/linear-features.png` to *"Titlebar + docks"*. Earlier `.context/` prose claimed
the docks shared the Sidebar's reference. **Read the table.** Verified 2026-08-12, and
the bar is intact: five Linear references, two identity references, plus `manifest.json`.

**Owner call 14 — the stop signal — is still unanswered and still (a).** Two
agent-reachable answers were attempted and both were refuted cross-model as post-hoc
goalpost movement. Under (a), run 2 was cut off by its budget rather than converged.

**Two claims run 2 already refuted or refused. Do not act on either:**
- *"The app has no icon vocabulary"* is **false** — measured 1:1 viewBox-to-pixel at
  `strokeWidth 1.4` across every dock icon, counts identical at the seed.
- *"Group the commands by purpose / give each row a leading icon"* is **not
  buildable** — no category field exists and the captured list is a hand-authored
  fixture chosen for row shape. Owner call 15.

**A run cannot take all nine surfaces at once.** `pieces` is capped at 6 and fixed at
seed. That is a budget, not a claim that the unpicked surfaces lack a standard. Run 1
took the five core surfaces; run 2 took the four the earlier run could not see.

Owner calls 14 to 20 live in `.claude/gauntlet-core-surfaces.md`; run 2's adjudications
live in `.claude/gauntlet-docks-and-min-window.md`. Read both before wave 1 —
especially the adjudication recording the collision between the critic's repeated ask
and `DESIGN.md`'s rails group, which is what stalled five waves.

## Chain rules

These governed chain 7 and should govern the next one.

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — see the pinned rule above; it is a standing
  owner ban, not a preference.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting its
  own follow-up makes the chain's stop condition unreachable by construction.
- **A leg may leave a ticket open** (leg 8's precedent, #150) or close it. Landing the
  work and closing the ticket are separate decisions: close when everything the
  acceptance asks for was verifiable without a push.
- **An acceptance criterion written as a stop gate is read first and answered with
  evidence** (leg 11, #139 acceptance 1). Discharging it honestly may widen the finding
  beyond the ticket — file the widening, do not detour into it.
- **Read a cited form for what it DID, not only what it said** (leg 12, #140
  acceptance 2).
- **An unproven fix to an intermittent is worse than the intermittent**, because it
  retires the ticket that was tracking it. #153 and #156 are both intermittents; say
  how many runs were taken and what the rate was, or say the fix is unproven.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
