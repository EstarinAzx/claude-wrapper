---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

## queue empty

**Chain 7 is finished.** Twelve legs, twelve tickets, zero human touches. Leg 12
landed **#140** as `2ab67f1` and closed it, and
`gh issue list --state open --label ready-for-agent` now returns `[]`.

That is the body-signaled done condition, so the chain set `stop: true` and fired
its successor: **`/relay N=1 /preset gauntlet`**, seeded fresh. If a gauntlet run
is live in `claude agents`, that is why.

**Verify rather than trust this file. It has been wrong before:**

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

| Order | # | Why here |
|---|---|---|
| ~~1–12~~ | ~~149, 146, 142, 148, 143, 147, 145, 150, 141, 138, 139, 140~~ | **DONE, legs 1–12** |

## Read this before the gauntlet run gets far

**The bar has an unsettled reference question, and the gauntlet seed reads it.**
Earlier `.context/` prose said the bar holds only five Linear references and that
the three docks therefore share the Sidebar's. But `.gauntlet/bar/README.md`'s own
"What each reference judges" table already assigns `linear/linear-features.png` to
*"Titlebar + docks"*. **Read the table, not the prose.** It is an owner-owned
artifact and #149 left the discrepancy open.

`.claude/gauntlet.md` was **archived to `.claude/gauntlet-core-surfaces.md`** so a
fresh run seeds instead of halting on the old `stop: true` at `plateau: 3`. Owner
calls 14 to 20 live in that archive and are worth reading — especially **14, the
stop signal**, which is the one that ended the previous run.

**A run cannot take all nine surfaces at once.** `pieces` is capped at 6 and fixed
at seed. That is a budget, not a claim that the unpicked surfaces lack a standard.

## What leg 12 added

**The mint side-stripe stays, and the ban gained one named, scoped exception**
(#140) beside #125's glass exception, stating it is not a precedent. The stripe
itself is untouched — a document edit plus a test.

**The transferable rule: an amendment protects one direction only.** Prose stops a
conformance pass deleting the stripe. It does nothing the other way, and that way
was wide open — **nothing in the repo asserted the stripe existed.**
`rails.css:548` was its only occurrence, read by no test and no driver, so
deleting the rule left every check green while `DESIGN.md` went on granting an
exception for a declaration that was gone.

`subagent-material.test.ts` already names that failure for #125: rule-without-
amendment and amendment-without-rule must **both** red. So "in #125's form" was
read to include its pin, not just its sentence.

```bash
npx vitest run tests/session-stripe-exception.test.ts
```

## Before you trust a gate result

**`main` goes red on its own.** `tests/session-title-enrichment.test.tsx` fails
intermittently under full-suite load — 4 of 7 complete runs at leg 5, including
one on the unmodified tree with all work stashed. Filed as **#153**. Green on
every run at legs 6 through 12, which is not evidence it is fixed.

**So a single red run is not evidence your change broke something.** Re-run, and
if it is that test, stash and run against the bare tree.

**`npm run test:dom` cannot be all-green while #155 is open**, because `gui-123`
honestly reports `UNSCORED`. A full run also reports `INCOMPLETE` — the accepted
`gui-119` quarantine stated rather than hidden. Both are correct readings.

**Do not run the fast gate concurrently with the DOM phase.** Leg 7 did, and it
cost two ambiguous reds and five attribution runs to unpick.

**`npm run x | tail` then `echo $?` gives you `tail`'s exit code.** Redirect to a
file and read `$?` on its own line.

**A clean checkout runs four fewer tests than your working tree** because
`tests/transcript-rewind-real-store.test.ts` skips without a stored transcript
whose `cwd` is this repo. **#157.** Not a regression.

**Never revert a mutation with `git checkout -- <file>` on an uncommitted tree.**
Leg 10 did and lost two finished files mid-run. Back up with `cp` and restore
from that. Mutation testing is routine in this chain — leg 12 ran thirteen and
hash-checked every file back.

## CI exists, and has still never run

`.github/workflows/fast-gate.yml`, on push, `windows-latest`, exactly
`typecheck` + `test` + `build`. **Nothing has ever been pushed from this
checkout.** That is why #150 is open. `main` is **24 commits ahead**.

## The DOM phase's current reds, already attributed

**Legs 8 through 12 ran no full phase** — leg 11 ran only `gui-96`, and leg 12
ran none at all, correctly, since #140 moved no pixels. This table is leg 7's and
nothing has moved it.

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

## #155 is still the biggest open finding, and it needs a human

On a profile the app has never started in, **no message sends at all**. Measured
one variable at a time: not the driver's zero-turn trick, not the Enter key path,
not zoom, not localStorage.

**A profile the app has never started in is every new user's first launch.**

**What has NOT been done, and it is one run:** open the app **by hand** on a
clean profile and type a message. Everything above went through `playwright-core`
with a stubbed `dialog.showOpenDialog`, so nobody has ruled out the harness.

## Landmines

**The workflow is pinned as text** (#150). `tests/fast-gate-workflow.test.ts`
reds on: a changed job name, a changed command **set** (order is free), losing
`if: always()` on the summary step, or **any** workflow invoking `test:dom`.

**`styles/` may contain only `400` and `600` font-weights** (#139), keywords
included; **no `em` font-size and exactly ONE literal px font-size** (#138),
allow-listed by exact `file:line`; and **exactly ONE box-shadow with a nonzero
horizontal offset** (#140), the mint stripe in `rails.css`. The `inset 0 0 0 1px`
hairline idiom is unaffected — offset zero is the discriminator. A `box-shadow`
the parser cannot read (`var(--x)`) reds rather than being skipped.

**`DESIGN.md` is read by five checks now** and each wants something different:
`## Type` must name every `--text-*` value `tokens.css` defines (#138) **and**
keep the tool-card weight sentence (#139); `## Bans in force` must survive as a
split token and keep its glass exception (#125), its side-stripe ban, and #140's
exception with surface, declaration, scope and precedent disclaimer. **The #140
exception sits INSIDE that section** — the split terminates on `\n## `, so a new
`##` heading above it would hide it. **It is CRLF** (verified 110/110, zero bare
CR or LF): a section regex needs `\r?\n`, though both DESIGN.md-reading test files
normalise first and are not exposed.

**A grouped selector defeats the `.subagent-drawer` extractor idiom** (#140).
`^\.class\s*\{` matches nothing when the class is paired with its `:hover`. Use
`^\.class(?![\w-])[^{]*\{([^}]*)\}`, strip comments first, and prove it with a
rename probe rather than trusting it.

**`CLAIMED_HEADROOM_PX` in `inspect.mjs` is a copy of a sum argued in prose in
`chat.css`.** Never move it to match a measurement without moving that sum too.

**`gui-75` is the first driver with a sidecar that is ALSO in `DOM_SKIP`** (#141).
"Has a sidecar" and "is executed somewhere" are now different claims.

**The check set is enumerated ONCE**, in `drivers.manifest.mjs` (`loadChecks()`).
Do not re-glob sidecars in the test file.

**A quarantine the verdict does not carry is a green** (#145).

**Logic the fast gate must execute cannot live in `dom-phase.mjs`** — it spawns
drivers at import, same rule as `inspect.mjs` (#142, #148). Put it in
`drivers.manifest.mjs`.

**Every driver launches on a private `userData`** (#147). New driver → spread
`...profileArgs()` from `driver-profile.mjs`. **No opt-out list, do not add one.**
The profile is per driver PROCESS, not per launch.

**A cold profile is not the same app as a warm one.** Leg 6's whole finding.

**Do not read the DOM phase's verdict off a compound command.** It has reported
**exit 0 while its own text said `DOM PHASE FAIL`**.

**A driver that pins persisted app state must READ IT BACK** (#143).

**A byte comparison that passes is not evidence a capture is stable** (#148).

**Run `inspect.mjs` one at a time** (#142). Point `SCREENSHOT_DIR` outside the repo.

**A squash merge does not mark the branch merged.** `git branch -d` refuses after
one. Diff the branch against `main` first, and let an empty diff authorise `-D`.

**`.context/` picks up line-ending churn.** `.context/` is **LF** while
`DESIGN.md` is **CRLF** — do not normalise either to match the other. Keep
`.context/` off the ticket branch and check `git diff --cached --name-only`
before committing.

**Do not cite `DESIGN.md` by line number** (#138). Name the section.

## Standing constraints for the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles
`src/`; comments are free, and so is anything outside `src/`). D3 — the
stylesheet pins are literal-text and brittle: no comment in `styles/` may contain
a closing brace, `.bubble` and `.message-input` stay ungrouped, `.bubble {` must
stay the first literal occurrence in `chat.css`, exactly one `backdrop-filter` in
all of `styles/`, and the `@import` order in `styles.css` IS the cascade. D4 —
any CSS change owes a driver pin that **executes**, naming which gate runs it;
jsdom loads no CSS, so neither the fast gate nor CI can see layout. The
titlebar's centring is load-bearing (#136).

**A content-hashed build artifact is a cheap second witness that no pixels
moved** (#140): `npm run build` keeping the same `index-*.css` filename
corroborates a git byte-identity check independently.

**Adding or removing a capture surface costs three edits** (#149): `SURFACES` in
`inspect.mjs`, the `surfaces:begin`/`surfaces:end` region in
`.claude/skills/run-desktop/SKILL.md`, and the same region in
`.gauntlet/bar/README.md`.

**A new driver's capture destination is gated** (#146): use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.

**`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are FIVE.**
A `*.source.mjs` sidecar needs no wiring.

## Still yours — and with the queue dry, this is the whole list

Live entries in `.claude/vibe.md` under `## Needs you`:

1. **Git history on the wave captures.** The repo is **public** and 35 wave PNGs
   are in `origin/main`. Leg 4's audit found no real session title in any capture;
   what is exposed is a **Windows username** in the fixture temp path and the
   foreign-session **count**. Fix-forward taken; the residual half is **#151**.
2. **gauntlet owner call 14, the stop signal.** Two agent-reachable answers were
   attempted and both were refuted cross-model as post-hoc goalpost movement.

**Still one command:** `git push origin main`, then watch the first `fast-gate`
run and close **#150** on green. `main` is **24 commits ahead** and has never
been pushed.

Seven older owner-calls remain in `.claude/vibe-130.md`. **#152** and **#155** are
yours in spirit. **#159** and **#160** are the same question one property apart:
may a painted value sit outside the documented set because nothing ever licensed
it, or does the document owe an amendment? #159 is sizes, #160 is weights.

**Twelve issues are open and none is agent-ready.** Eleven sit at `needs-triage`
(#144, #151–#160) and **#150** at `needs-info`. Promoting any of them to
`ready-for-agent` is an owner decision — a leg doing it makes the chain's own
stop condition unreachable, which is why none did.

## Chain rules

These governed chain 7 and should govern the next one.

- **Do not push on your own initiative** (D6). Leg 8 tested this against a ticket
  whose own acceptance asked for a push, and left the ticket open rather than
  push — D6 was written and pressure-tested *under* the AFK grant, so the grant
  does not override it.
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.
- **A leg may leave a ticket open** (leg 8's precedent, #150) or close it (legs 9
  through 12 closed #141, #138, #139 and #140). Landing the work and closing the
  ticket are separate decisions: close when everything the acceptance asks for was
  verifiable without a push.
- **An acceptance criterion written as a stop gate is read first and answered
  with evidence** (leg 11, #139 acceptance 1). Discharging it honestly may widen
  the finding beyond the ticket — file the widening, do not detour into it.
- **Read a cited form for what it DID, not only what it said** (leg 12, #140
  acceptance 2). "In #125's form" turned out to include #125's pin, because that
  is what #125 actually shipped.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
