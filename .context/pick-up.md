---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

## Chain 7 is draining the queue, with gauntlet chained behind it

An autonomous `/preset vibe` pass ran while the owner was away, under an explicit
AFK autonomy grant. It ruled the three design questions, triaged the nine
follow-ups, filed one new ticket, and fired the execution chain. The full
reasoning, every warrant, and every cross-model objection is in `.claude/vibe.md`
— read that before overturning anything here.

**Verify rather than trust this file. It has been wrong before:**

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

## The queue

**Three tickets left. Leg 1 landed #149, leg 2 #146, leg 3 #142, leg 4 #148, leg
5 #143, leg 6 #147, leg 7 #145, leg 8 #150's work, leg 9 #141** (`388959b`,
**closed**). **Next is #138.**

| Order | # | Why here |
|---|---|---|
| ~~1–9~~ | ~~149, 146, 142, 148, 143, 147, 145, 150, 141~~ | **DONE, legs 1–9** |
| 10 | 138 | Type scale. **Gauntlet is confounded until this lands** |
| 11 | 139 | Tool-card label to 400 |
| 12 | 140 | Named scoped exception for the state stripe |

**No ticket in this queue carries a native blocking edge** — checked on all nine
at leg 3, and nothing closed since has changed that. The ordering lives only in
this table, so it is the chain's plan rather than something the tracker enforces.

**#150 is OPEN at `needs-info` and is NOT queue work.** Its code landed in full;
what it waits on is a human pushing and watching the first CI run. Leave it.

**Nine tickets sit at `needs-triage` and none may be promoted by a leg:** #144,
#151, #152, #153, #154, #155, #156, #157, and **#158** (new, leg 9).

## Next ticket, #138 — and it is the one the gauntlet is waiting on

The app paints **five** type sizes (11 / 13 / 15 / 17.25 / 46.26) against three
documented in `DESIGN.md`. **It already carries a ruling comment — read it, it
is more constraining than the body.**

**Ruled: restrike the markdown headings onto the one ladder, document the rungs
the app actually paints, retire or re-point `--fs-display`.**

**The rung count is not the violation.** `DESIGN.md` states the rule as a
*ratio* (~1.15), and all five sizes are legal rungs on it. The violation is that
there are **two scales**: markdown headings are set in `em` and render 16.5 /
18.75 against the 15px body, which are not ~1.15 rungs, and they ship on a
photographed surface. The bar's win condition requires *"one type scale holds
across all of them"*.

**The objection the ruling did NOT fully survive, and it constrains you:** a
cross-model adversary refuted it as *"the ratio statement does not authorize
documenting drift into compliance."* So —

- **Do not blanket-document five rungs.** Each new rung (17.25, 46.26) must be
  justified in the edit as serving a stated role, or removed. *"It renders,
  therefore it is spec"* is the move this repo forbids.
- The 17.25 rung sits **0.75px** from both markdown headings. Restriking must
  **resolve** that collision, not preserve it one step over.

**Four acceptance criteria, and the fourth is the expensive one:** headings on
the documented ladder with no second scale on any photographed surface;
`DESIGN.md` stating each rung with its role; `--fs-display` naming a size
something paints or gone; and **D4 — this moves rendered prose, so it owes a
driver pin that EXECUTES, naming which gate runs it.** jsdom loads no CSS and
structurally cannot see this, so the fast gate cannot be that gate.

**Read the D3 stylesheet landmines below before touching `styles/`.** They are
literal-text pins and they are brittle.

## Before you trust a gate result

**`main` goes red on its own.** `tests/session-title-enrichment.test.tsx` fails
intermittently under full-suite load — 4 of 7 complete runs at leg 5, including
one on the unmodified tree with all work stashed. Filed as **#153**. Green on
every run at legs 6, 7, 8 and 9, which is not evidence it is fixed.

**So a single red run is not evidence your change broke something.** Re-run, and
if it is that test, stash and run against the bare tree.

**`npm run test:dom` cannot be all-green while #155 is open**, because `gui-123`
honestly reports `UNSCORED`. A full run also reports `INCOMPLETE` — the accepted
`gui-119` quarantine stated rather than hidden. Both are correct readings.

**Do not run the fast gate concurrently with the DOM phase.** Leg 7 did, and it
cost two ambiguous reds and five attribution runs to unpick. The drivers time out
on `page.screenshot()` under load.

**`npm run x | tail` then `echo $?` gives you `tail`'s exit code.** Leg 8 did
this and briefly believed a gate result it had not read. Redirect to a file and
read `$?` on its own line.

**A clean checkout runs four fewer tests than your working tree** — 1378 vs 1382
at leg 8's commit — because `tests/transcript-rewind-real-store.test.ts` skips
without a stored transcript whose `cwd` is this repo. **#157.** Not a regression.

## What leg 9 added to the gate (#141)

**A sidecar check may declare the build artifact it reads:**

```js
needsBuild: { artifact: 'out/main/index.js', covers: ['src/main'] }
```

`npm test` reports it as a named skip carrying its artifact **and where it does
run**; `npm run test:dom` executes it, after proving the artifact is at least as
new as everything under `covers`. **The gate still does not build** — that is the
ruling, not an omission.

```bash
npm run test:dom -- --build-only     # seconds, no Electron. Refuses to combine with --only.
```

**Carry the habit this leg learned: mutation-verify the TEST, not only the
code.** The test written for the recursive mtime walk compared two real repo
paths and **passed with the recursion deleted** — it was measuring the checkout,
not the function. Rebuilt on a fixture with a stamped mtime. Full reasoning in
[[2026-08-11-a-test-built-on-ambient-state-measures-the-ambient-state]]. #138
owes an executing driver pin, so this applies directly to it.

## CI exists, and has still never run

`.github/workflows/fast-gate.yml`, on push, `windows-latest`, exactly
`typecheck` + `test` + `build`. **Nothing has ever been pushed from this
checkout.** That is why #150 is open.

**#158 (new) asks whether CI should also host the build-artifact checks** —
`--build-only` needs no Electron and no key, but the workflow pin bans any
workflow invoking `test:dom`, a fourth command reds the command-set pin, and the
job name is the coverage boundary. Three standing decisions collide, so a leg
filed it rather than answering it.

## The DOM phase's current reds, already attributed

**Legs 8 and 9 ran no full phase** — leg 9 ran only `gui-93` alone, twice — so
this table is leg 7's and nothing has moved it.

| driver | in batch | alone | verdict |
|---|---|---|---|
| `gui-95` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-49` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-123` | UNSCORED | UNSCORED | **#155**, working as designed |
| `gui-94` | FAIL | **PASS** | load artifact, not filed |
| `gui-91` | FAIL | **FAIL 1×, PASS 3×** | **#156**, intermittent ~1 in 7 |
| `gui-93` | **PASS** | PASS (leg 9, twice) | green; red-verified under mutation |
| `gui-124` | **PASS** | PASS | was batch-red at leg 6, unexplained |

There is still **no full-phase baseline on an unmodified tree**, so the
batch-only behaviour in this set stays unattributed rather than understood.

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
**#141 did not touch it** — no npm script and no workflow were added.

**`gui-75` is the first driver with a sidecar that is ALSO in `DOM_SKIP`** (#141).
"Has a sidecar" and "is executed somewhere" are now different claims. It carries
its own named skip plus a pin; un-skipping it or deleting its sidecar reds that.

**The check set is enumerated ONCE**, in `drivers.manifest.mjs` (`loadChecks()`).
Do not re-glob sidecars in the test file — that is how the gate and the phase
drift, and it is the same rule the driver list already follows.

**A quarantine the verdict does not carry is a green** (#145). A skip category a
human can close with one command belongs in `UNCOVERED_CATEGORY` in
`drivers.manifest.mjs`; one they cannot does not.

**Logic the fast gate must execute cannot live in `dom-phase.mjs`** — it spawns
drivers at import, same rule as `inspect.mjs` (#142, #148). Put it in
`drivers.manifest.mjs`, which both sides already import. #141's staleness
comparator lives there for exactly this reason.

**Every driver launches on a private `userData`** (#147). New driver → spread
`...profileArgs()` from `driver-profile.mjs` into its `electron.launch({ args })`,
or `tests/driver-profile.test.ts` reds it. **There is no opt-out list and do not
add one.**

**The profile is per driver PROCESS, not per launch.** `gui-69`, `gui-70` and
`gui-110` launch three times each and assert on what launch N+1 inherits.

**A cold profile is not the same app as a warm one.** Leg 6's whole finding.

**`main` is intermittently red on `session-title-enrichment` (#153).**

**Do not read the DOM phase's verdict off a compound command.** It has reported
**exit 0 while its own text said `DOM PHASE FAIL`**.

**A driver that pins persisted app state must READ IT BACK** (#143).

**A byte comparison that passes is not evidence a capture is stable** (#148).

**Run `inspect.mjs` one at a time** (#142). Its workspace directory name is fixed.

**Point `SCREENSHOT_DIR` outside the repo** when running `inspect.mjs`.

**A squash merge does not mark the branch merged.** `git branch -d` refuses after
one. Diff the branch against `main` first, and let an empty diff authorise `-D`.

**A driver copied outside the repo cannot resolve `playwright-core`.** Check it
out in place with `git checkout HEAD -- <path>`, or `git stash` to compare
against HEAD wholesale.

**`.context/` picks up line-ending churn.** Keep `.context/` off the ticket branch
and check `git diff --cached --name-only` before committing.

## Standing constraints for the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles
`src/`; comments are free, and so is anything outside `src/` — including
`.github/` and `tests/`). D3 — the stylesheet pins are literal-text and brittle:
no comment in `styles/` may contain a closing brace, `.bubble` and
`.message-input` stay ungrouped, `.bubble {` must stay the first literal
occurrence in `chat.css`, exactly one `backdrop-filter` in all of `styles/`, and
the `@import` order in `styles.css` IS the cascade. D4 — any CSS change owes a
driver pin that **executes**, naming which gate runs it; jsdom loads no CSS, so
neither the fast gate nor CI can see layout. The titlebar's centring is
load-bearing (#136). `DESIGN.md` is read literally by
`tests/subagent-material.test.ts`, which splits on `\n## Bans in force\n` — #140
edits that section, so the split token must survive verbatim.

`CLAIMED_HEADROOM_PX` in `inspect.mjs` is a copy of a sum argued in prose in
`chat.css`. **Never move it to match a measurement without moving that sum too.**

**Adding or removing a capture surface costs three edits** (#149): `SURFACES` in
`inspect.mjs`, the `surfaces:begin`/`surfaces:end` region in
`.claude/skills/run-desktop/SKILL.md`, and the same region in
`.gauntlet/bar/README.md`. **Only that delimited region of `SKILL.md` is pinned**
by `tests/inspect-published-list.test.ts`; the rest is free to edit, and legs 7,
8 and 9 all did.

**A new driver's capture destination is gated** (#146): use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.
**Do not broaden the `scripts/gui-*-shots/` ignore rule.**

**`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are FIVE.**
A `*.source.mjs` sidecar needs no wiring — which is why #141 added one and
touched no list.

## Still yours — nothing here blocks the chain

Live entries in `.claude/vibe.md` under `## Needs you`:

1. **Git history on the wave captures.** The repo is **public** and 35 wave PNGs
   are in `origin/main`. Leg 4's audit found no real session title in any capture;
   what is exposed is a **Windows username** in the fixture temp path and the
   foreign-session **count**. Fix-forward taken; the residual half is **#151**.
2. **gauntlet owner call 14, the stop signal.** Two agent-reachable answers were
   attempted and both were refuted cross-model as post-hoc goalpost movement.

**Still one command:** `git push origin main`, then watch the first `fast-gate`
run and close **#150** on green. `main` is **18 commits ahead** and has never
been pushed.

Seven older owner-calls remain in `.claude/vibe-130.md`. **#152** and **#155** are
yours in spirit — 208 rail tab stops ahead of the transcript is a design decision,
and #155 needs one manual run only a human can do properly.

**One call leg 8 made that is cheap to overturn:** the CI runner is
`windows-latest`, because win32 is the only platform this suite has ever been
observed green on and there is no WSL or Docker here to measure linux. Move it to
`ubuntu-latest` once anyone has run the three commands there once. One line.

## Gauntlet

`.claude/gauntlet.md` was **archived to `.claude/gauntlet-core-surfaces.md`** so a
fresh run seeds instead of halting on the old `stop: true` at `plateau: 3`.
Especially worth reading: owner calls 14 to 20.

**One reference question is still open, and it is an owner call.** Earlier
`.context/` prose said the bar holds only five Linear references and that the
three docks therefore share the Sidebar's. But `.gauntlet/bar/README.md`'s own
"What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose.**

**A run cannot take all nine surfaces at once.** `pieces` is capped at 6 and fixed
at seed. That is a budget, not a statement that the unpicked surfaces lack a
standard.

## Chain rules

- **Do not push on your own initiative** (D6). Leg 8 tested this against a ticket
  whose own acceptance asked for a push, and left the ticket open rather than
  push — D6 was written and pressure-tested *under* the AFK grant, so the grant
  does not override it.
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.
- **A leg may leave a ticket open** (leg 8's precedent, #150) or close it (leg
  9's, #141). Landing the work and closing the ticket are separate decisions:
  close when everything the acceptance asks for was verifiable without a push.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
