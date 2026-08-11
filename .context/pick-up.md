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

**Six tickets left. Leg 1 landed #149, leg 2 #146, leg 3 #142, leg 4 #148, leg 5
#143, leg 6 #147** (`81de29d`). **Next is #145.** Recommended order:

| Order | # | Why here |
|---|---|---|
| ~~1–6~~ | ~~149, 146, 142, 148, 143, 147~~ | **DONE, legs 1–6** |
| 7 | 145 | Quarantine accepted; phase must not report clean green. **Leg 6 changed what this ticket decides against — read the next section first** |
| 8 | 150 | Headless-gate CI, must not read as full coverage |
| 9 | 141 | Build-artifact assertions; verify `gui-93` is already covered first |
| 10 | 138 | Type scale. **Gauntlet is confounded until this lands** |
| 11 | 139 | Tool-card label to 400 |
| 12 | 140 | Named scoped exception for the state stripe |

**No ticket in this queue carries a native blocking edge** — checked on all nine
at leg 3, and nothing closed since has changed that. The ordering lives only in
this table, so it is the chain's plan rather than something the tracker enforces.

**Six tickets sit at `needs-triage` and none may be promoted by a leg:** #144
(its settled half is #150), #151, #152, #153, #154, and **#155** (new, leg 6).

## Next ticket, #145 — and leg 6 handed it a third option

#145 asks whether `gui-119` gets made batch-safe or accepted into the
`desktop-exclusive` quarantine, and it owns the broader question of what the DOM
phase may report as clean.

**The framing has changed and you must read this before ruling.**

`gui-123.mjs` now emits **`UNSCORED` (exit 2)** — the first driver in the set ever
to do so. `dom-phase.mjs` has always defined that verdict and **no driver
produced one**, so every broken precondition in the whole set has historically
been reported as a `FAIL` about the thing the run never reached.

That gives #145 an option its framing did not have: a driver that cannot reach
its subject can now **say so** without being quarantined and without lying. Ask
explicitly whether `gui-119` in a batch is a *quarantine* case or an *UNSCORED*
case — they are different claims, and the second is cheaper and more honest.

**Consequence you will hit immediately: `npm run test:dom` cannot be all-green**
while #155 is open, because one driver honestly cannot score. That is the correct
reading, not a broken gate, and #150's CI wiring must not read a non-zero exit as
"quarantine it".

## Before you trust a gate result

**`main` goes red on its own.** `tests/session-title-enrichment.test.tsx` fails
intermittently under full-suite load — 4 of 7 complete runs at leg 5, including
one on the unmodified tree with all work stashed, and green every time it runs
alone. Cause: a `findByText` on its 1000ms default while 100 sidebar rows render.
Filed as **#153**. It passed on all three full runs at leg 6, which is not
evidence it is fixed.

**So a single red run is not evidence your change broke something.** Re-run, and
if it is that test, stash and run against the bare tree.

## The DOM phase's current reds, already attributed

Do not re-investigate these from scratch. Each was run alone at HEAD and on the
branch at leg 6:

| driver | HEAD | isolated | verdict |
|---|---|---|---|
| `gui-95` | FAIL | FAIL | **pre-existing**, untouched, uninvestigated |
| `gui-49` | FAIL | FAIL | **pre-existing**, untouched, uninvestigated |
| `gui-93` | PASS | PASS | passes alone both ways, red in the batch |
| `gui-124` | FAIL | **PASS** | isolation fixed it alone; still red in the batch |
| `gui-123` | PASS | **UNSCORED** | **#155** |

A full batch on `main` at leg 6 was **25/30**. There is still **no full-phase
baseline taken on an unmodified tree**, so the batch-only behaviour of `gui-93`
and `gui-124` is unexplained rather than attributed.

## #155 is the biggest thing leg 6 found, and it is not a driver bug

On a profile the app has never started in, **no message sends at all**. Measured
one variable at a time: not the driver's zero-turn trick (reproduces with the
`chat:send` listener intact), not the Enter key path (the Send button is equally
dead in the same run), not zoom (forcing the factor to 1 changes nothing), not
localStorage (seeding all four keys the warm and cold profiles disagreed about
changes nothing).

**A profile the app has never started in is every new user's first launch.**

**What has NOT been done, and it is one run:** open the app **by hand** on a
clean profile and type a message. Everything above went through `playwright-core`
with a stubbed `dialog.showOpenDialog`, so nobody has ruled out the harness. That
single run decides whether #155 is a shipping bug or an artifact.

## Landmines

**Every driver now launches on a private `userData`** (#147). New driver → spread
`...profileArgs()` from `driver-profile.mjs` into its `electron.launch({ args })`,
or `tests/driver-profile.test.ts` reds it. **There is no opt-out list and do not
add one** — `gui-78`/`gui-79`/`gui-110` already mint their own profile and
`setPath('userData')` beats the switch, so an opt-out would reopen the exact
channel the ticket closed.

**The profile is per driver PROCESS, not per launch.** `gui-69`, `gui-70` and
`gui-110` launch three times each and assert on what launch N+1 inherits.

**A cold profile is not the same app as a warm one.** Leg 6's whole finding. If a
driver behaves differently than you expect, ask what the profile used to be
carrying before you blame your change.

**`main` is intermittently red on `session-title-enrichment` (#153).**

**Do not read the DOM phase's verdict off a compound command.** It has reported
**exit 0 while its own text said `DOM PHASE FAIL`** — any trailing command
replaces the status. Read `$?` on its own line, or grep the redirected file.

**A driver that pins persisted app state must READ IT BACK** (#143). Still true,
and the read-back is now also what catches a private profile failing to apply.

**A byte comparison that passes is not evidence a capture is stable** (#148).

**Run `inspect.mjs` one at a time** (#142). Its workspace directory name is fixed.

**Point `SCREENSHOT_DIR` outside the repo** when running `inspect.mjs`.

**A squash merge does not mark the branch merged.** `git branch -d` refuses after
one. Diff the branch against `main` first, and let an empty diff authorise `-D`.

**A driver copied outside the repo cannot resolve `playwright-core`.** To run an
old version, check it out **in place** with `git checkout HEAD -- <path>` and
restore afterwards. Leg 6 used this for every attribution run.

**`.context/` picks up line-ending churn.** Leg 6 found `decisions.md` staged with
no content diff. Keep `.context/` off the ticket branch and check
`git diff --cached --name-only` before committing.

## Standing constraints for the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles
`src/`; comments are free). D3 — the stylesheet pins are literal-text and
brittle: no comment in `styles/` may contain a closing brace, `.bubble` and
`.message-input` stay ungrouped, `.bubble {` must stay the first literal
occurrence in `chat.css`, exactly one `backdrop-filter` in all of `styles/`, and
the `@import` order in `styles.css` IS the cascade. D4 — any CSS change owes a
driver pin that **executes**, naming which gate runs it; jsdom loads no CSS. The
titlebar's centring is load-bearing (#136). `DESIGN.md` is read literally by
`tests/subagent-material.test.ts`, which splits on `\n## Bans in force\n` — #140
edits that section, so the split token must survive verbatim.

`CLAIMED_HEADROOM_PX` in `inspect.mjs` is a copy of a sum argued in prose in
`chat.css`. **Never move it to match a measurement without moving that sum too.**

**Adding or removing a capture surface costs three edits** (#149): `SURFACES` in
`inspect.mjs`, the `surfaces:begin`/`surfaces:end` region in
`.claude/skills/run-desktop/SKILL.md`, and the same region in
`.gauntlet/bar/README.md`.

**A new driver's capture destination is gated** (#146): use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.
**Do not broaden the `scripts/gui-*-shots/` ignore rule.**

**`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are FIVE**
(#147 added `driver-profile.mjs`). A `*.source.mjs` sidecar needs no wiring.

**Anything the fast gate must RUN has to live outside `inspect.mjs`** (#142,
#148). The driver launches Electron at import.

## Still yours — nothing here blocks the chain

Both live entries are in `.claude/vibe.md` under `## Needs you`:

1. **Git history on the wave captures.** The repo is **public** and 35 wave PNGs
   are in `origin/main`. Leg 4's audit found no real session title in any capture;
   what is exposed is a **Windows username** in the fixture temp path and the
   foreign-session **count**. Fix-forward taken; the residual half is **#151**.
2. **gauntlet owner call 14, the stop signal.** Two agent-reachable answers were
   attempted and both were refuted cross-model as post-hoc goalpost movement.

Seven older owner-calls remain in `.claude/vibe-130.md`. **#152** and **#155** are
new and both are yours in spirit — 208 rail tab stops ahead of the transcript is
a design decision, and #155 needs one manual run only a human can do properly.

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

**`inspect.mjs` now launches on a private profile** (#147), so a wave's captures
no longer inherit whatever zoom or bounds the machine last had. Another boundary
across which byte comparison is not meaningful — and a deliberate one.

## Chain rules

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
