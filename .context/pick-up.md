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

**Four tickets left. Leg 1 landed #149, leg 2 #146, leg 3 #142, leg 4 #148, leg 5
#143, leg 6 #147, leg 7 #145, leg 8 #150's work** (`622bb8d`). **Next is #141.**

| Order | # | Why here |
|---|---|---|
| ~~1–8~~ | ~~149, 146, 142, 148, 143, 147, 145, 150~~ | **DONE, legs 1–8** |
| 9 | 141 | Build-artifact assertions. **Leg 8 landed something that constrains it — read the next section** |
| 10 | 138 | Type scale. **Gauntlet is confounded until this lands** |
| 11 | 139 | Tool-card label to 400 |
| 12 | 140 | Named scoped exception for the state stripe |

**No ticket in this queue carries a native blocking edge** — checked on all nine
at leg 3, and nothing closed since has changed that. The ordering lives only in
this table, so it is the chain's plan rather than something the tracker enforces.

**#150 is OPEN at `needs-info` and is NOT queue work.** Its code landed in full;
what it waits on is a human pushing and watching the first CI run. Leave it.

**Eight tickets sit at `needs-triage` and none may be promoted by a leg:** #144
(its settled half was #150), #151, #152, #153, #154, #155, #156, and **#157**
(new, leg 8).

## Next ticket, #141 — and leg 8 handed it a hard constraint

#141 executes the two build-artifact driver assertions (`gui-75` §0, `gui-93`)
that read `out/` rather than `src/`. It is explicitly **triage, not a spec**: it
offers three shapes and asks which. It already carries **one comment — read it.**

**Leg 8 changed the calculus of all three options, because this repo now has CI.**

`.github/workflows/fast-gate.yml` runs `npm run typecheck`, `npm test`,
`npm run build` on push — and **`tests/fast-gate-workflow.test.ts` pins that
command set**. So:

- **Option 2 (a separate `test:built` script)** is no longer defeated by "nothing
  forces anyone to run it" — CI can. But CI currently runs `build` **last**, so a
  `test:built` step has to come after it, and **that is a fourth command, which
  reds the pin**.
- **The pin is meant to be updated deliberately, not worked around.** If #141
  decides the gate grows, edit `GATE` in `tests/fast-gate-workflow.test.ts` and
  say why in the commit. Do not delete the assertion to make a red go away —
  that assertion exists so the gate cannot quietly grow into claiming more than
  it covers.
- **A red from `fast-gate-workflow.test.ts` after touching CI is the pin working**,
  not a regression you introduced elsewhere.

Note the ticket's own closing warning still stands: the `gui-<n>.source.mjs`
convention does **not** fit as-is, because `run()` is specified pure with no
`out/` artifact. Extending it is part of the design, not an afterthought.

## Before you trust a gate result

**`main` goes red on its own.** `tests/session-title-enrichment.test.tsx` fails
intermittently under full-suite load — 4 of 7 complete runs at leg 5, including
one on the unmodified tree with all work stashed. Filed as **#153**. Green on all
runs at legs 6, 7 and 8, which is not evidence it is fixed.

**So a single red run is not evidence your change broke something.** Re-run, and
if it is that test, stash and run against the bare tree.

**`npm run test:dom` cannot be all-green while #155 is open**, because `gui-123`
honestly reports `UNSCORED`. A full run also reports `INCOMPLETE` — the accepted
`gui-119` quarantine stated rather than hidden. Both are correct readings, not
broken gates.

**Do not run the fast gate concurrently with the DOM phase.** Leg 7 did, and it
cost two ambiguous reds and five attribution runs to unpick. The drivers time out
on `page.screenshot()` under load.

**`npm run x | tail` then `echo $?` gives you `tail`'s exit code.** Leg 8 did this
and briefly believed a gate result it had not actually read. Redirect to a file
and read `$?` on its own line — same class as the standing warning about the DOM
phase verdict on a compound command.

## CI exists now, and has never once run

`.github/workflows/fast-gate.yml`, on push, `windows-latest`, exactly
`typecheck` + `test` + `build`. **Nothing has ever been pushed from this
checkout, so no run has ever happened.** That is why #150 is open.

**A clean checkout runs four fewer tests than your working tree** — 1378 vs 1382,
one whole file. `tests/transcript-rewind-real-store.test.ts` skips unless it
finds a stored transcript whose recorded `cwd` is this repo, and a clone (or a
runner) has none. Working as designed; filed as **#157**. Do not chase it as a
regression.

## The DOM phase's current reds, already attributed

**Leg 8 did not run the phase** — #150 touched no renderer code — so this table
is leg 7's and nothing has moved it.

| driver | in batch | alone | verdict |
|---|---|---|---|
| `gui-95` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-49` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-123` | UNSCORED | UNSCORED | **#155**, working as designed |
| `gui-94` | FAIL | **PASS** | load artifact, not filed |
| `gui-91` | FAIL | **FAIL 1×, PASS 3×** | **#156**, intermittent ~1 in 7 |
| `gui-93` | **PASS** | PASS | was batch-red at leg 6, unexplained |
| `gui-124` | **PASS** | PASS | was batch-red at leg 6, unexplained |

There is still **no full-phase baseline on an unmodified tree**, so the batch-only
behaviour in this set stays unattributed rather than understood.

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

**A quarantine the verdict does not carry is a green** (#145). A skip category a
human can close with one command belongs in `UNCOVERED_CATEGORY` in
`drivers.manifest.mjs`; one they cannot does not.

**Logic the fast gate must execute cannot live in `dom-phase.mjs`** — it spawns
drivers at import, same rule as `inspect.mjs` (#142, #148). Put it in
`drivers.manifest.mjs`, which both sides already import.

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
by `tests/inspect-published-list.test.ts`; the rest is free to edit, and legs 7
and 8 both did.

**A new driver's capture destination is gated** (#146): use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.
**Do not broaden the `scripts/gui-*-shots/` ignore rule.**

**`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are FIVE.**
A `*.source.mjs` sidecar needs no wiring.

## Still yours — nothing here blocks the chain

Live entries in `.claude/vibe.md` under `## Needs you`:

1. **Git history on the wave captures.** The repo is **public** and 35 wave PNGs
   are in `origin/main`. Leg 4's audit found no real session title in any capture;
   what is exposed is a **Windows username** in the fixture temp path and the
   foreign-session **count**. Fix-forward taken; the residual half is **#151**.
2. **gauntlet owner call 14, the stop signal.** Two agent-reachable answers were
   attempted and both were refuted cross-model as post-hoc goalpost movement.

**New, and it is one command:** `git push origin main`, then watch the first
`fast-gate` run and close **#150** on green. `main` is 16 commits ahead and has
never been pushed.

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

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
