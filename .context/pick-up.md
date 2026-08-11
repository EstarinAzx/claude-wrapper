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

**Five tickets left. Leg 1 landed #149, leg 2 #146, leg 3 #142, leg 4 #148, leg 5
#143, leg 6 #147, leg 7 #145** (`40135ec`). **Next is #150.** Recommended order:

| Order | # | Why here |
|---|---|---|
| ~~1–7~~ | ~~149, 146, 142, 148, 143, 147, 145~~ | **DONE, legs 1–7** |
| 8 | 150 | Headless-gate CI, must not read as full coverage. **Leg 7 gave it a rule it must not break — read the next section** |
| 9 | 141 | Build-artifact assertions; verify `gui-93` is already covered first |
| 10 | 138 | Type scale. **Gauntlet is confounded until this lands** |
| 11 | 139 | Tool-card label to 400 |
| 12 | 140 | Named scoped exception for the state stripe |

**No ticket in this queue carries a native blocking edge** — checked on all nine
at leg 3, and nothing closed since has changed that. The ordering lives only in
this table, so it is the chain's plan rather than something the tracker enforces.

**Seven tickets sit at `needs-triage` and none may be promoted by a leg:** #144
(its settled half is #150), #151, #152, #153, #154, #155, and **#156** (new,
leg 7).

## Next ticket, #150 — and leg 7 handed it a hard constraint

#150 wires CI for the headless gate only and documents the DOM phase as a local
win32 step.

**The DOM phase now has THREE verdicts, and CI must read the word, not just
`$?`:**

| verdict | means | exit |
|---|---|---|
| `DOM PHASE PASS` | everything the phase covers ran, and passed | 0 |
| `DOM PHASE INCOMPLETE` | nothing that ran broke, but a contract was never checked | 0 |
| `DOM PHASE FAIL` | something that ran broke | 1 |

`INCOMPLETE` deliberately exits **0**. A batch can never hand a driver the desktop
foreground, so failing on it would make the phase red permanently, and an exit
code that is always 1 carries as much information as one always 0. The full
argument — and how to overturn it in one line, if #150 decides CI needs exit 2 —
is in [[2026-08-11-a-deficit-a-reader-cannot-close-is-furniture]].

**The other half #150 owns is the same one #144 raised: a green CI badge must not
read as full coverage.** The headless gate is `npm test` + `npm run typecheck`;
it structurally cannot see CSS or layout (jsdom loads none) and never launches
Electron. #145 just built the vocabulary for exactly this shape of claim at the
phase level — reuse it rather than inventing a second protocol.

## Before you trust a gate result

**`main` goes red on its own.** `tests/session-title-enrichment.test.tsx` fails
intermittently under full-suite load — 4 of 7 complete runs at leg 5, including
one on the unmodified tree with all work stashed, and green every time it runs
alone. Cause: a `findByText` on its 1000ms default while 100 sidebar rows render.
Filed as **#153**. Green on all three full runs at leg 6 and both at leg 7, which
is not evidence it is fixed.

**So a single red run is not evidence your change broke something.** Re-run, and
if it is that test, stash and run against the bare tree.

**`npm run test:dom` cannot be all-green while #155 is open**, because `gui-123`
honestly reports `UNSCORED`. That is the correct reading, not a broken gate.

## The DOM phase's current reds, already attributed

Do not re-investigate these from scratch.

| driver | in batch | alone | verdict |
|---|---|---|---|
| `gui-95` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-49` | FAIL | FAIL (leg 6) | **pre-existing**, uninvestigated |
| `gui-123` | UNSCORED | UNSCORED | **#155**, working as designed |
| `gui-94` | FAIL | **PASS** | load artifact, not filed |
| `gui-91` | FAIL | **FAIL 1×, PASS 3×** | **#156**, intermittent ~1 in 7 |
| `gui-93` | **PASS** | PASS | was batch-red at leg 6, unexplained |
| `gui-124` | **PASS** | PASS | was batch-red at leg 6, unexplained |

**Leg 7 introduced a confound and owns it:** a batch of five single-file vitest
mutation runs ran concurrently with part of that phase. Both new reds are
`TimeoutError` on `page.screenshot()`, which is a load shape. `gui-91` is filed
because it also failed **isolated, with nothing else running**; `gui-94` is not.

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

**A quarantine the verdict does not carry is a green** (#145). A skip category
that a human can close with one command belongs in `UNCOVERED_CATEGORY` in
`drivers.manifest.mjs`; one they cannot close does not, because a number nobody
can drive to zero stops being read.

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
**exit 0 while its own text said `DOM PHASE FAIL`** — any trailing command
replaces the status. Read `$?` on its own line, or grep the redirected file.

**A driver that pins persisted app state must READ IT BACK** (#143).

**A byte comparison that passes is not evidence a capture is stable** (#148).

**Run `inspect.mjs` one at a time** (#142). Its workspace directory name is fixed.

**Point `SCREENSHOT_DIR` outside the repo** when running `inspect.mjs`.

**A squash merge does not mark the branch merged.** `git branch -d` refuses after
one. Diff the branch against `main` first, and let an empty diff authorise `-D`.

**A driver copied outside the repo cannot resolve `playwright-core`.** To run an
old version, check it out **in place** with `git checkout HEAD -- <path>` and
restore afterwards. To compare against HEAD wholesale, `git stash` is cleaner and
leg 7 used it.

**`.context/` picks up line-ending churn.** Keep `.context/` off the ticket branch
and check `git diff --cached --name-only` before committing.

## Standing constraints for the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles
`src/`; comments are free, and so is anything outside `src/`). D3 — the
stylesheet pins are literal-text and brittle: no comment in `styles/` may contain
a closing brace, `.bubble` and `.message-input` stay ungrouped, `.bubble {` must
stay the first literal occurrence in `chat.css`, exactly one `backdrop-filter` in
all of `styles/`, and the `@import` order in `styles.css` IS the cascade. D4 —
any CSS change owes a driver pin that **executes**, naming which gate runs it;
jsdom loads no CSS. The titlebar's centring is load-bearing (#136). `DESIGN.md`
is read literally by `tests/subagent-material.test.ts`, which splits on
`\n## Bans in force\n` — #140 edits that section, so the split token must survive
verbatim.

`CLAIMED_HEADROOM_PX` in `inspect.mjs` is a copy of a sum argued in prose in
`chat.css`. **Never move it to match a measurement without moving that sum too.**

**Adding or removing a capture surface costs three edits** (#149): `SURFACES` in
`inspect.mjs`, the `surfaces:begin`/`surfaces:end` region in
`.claude/skills/run-desktop/SKILL.md`, and the same region in
`.gauntlet/bar/README.md`. **Only that delimited region of `SKILL.md` is pinned**
by `tests/inspect-published-list.test.ts`; the rest of the document is free to
edit, and leg 7 did.

**A new driver's capture destination is gated** (#146): use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.
**Do not broaden the `scripts/gui-*-shots/` ignore rule.**

**`drivers.manifest.mjs` enumerates the non-driver `.mjs` files. There are FIVE.**
A `*.source.mjs` sidecar needs no wiring.

**Anything the fast gate must RUN has to live outside `inspect.mjs`** (#142,
#148) **and outside `dom-phase.mjs`** (#145).

## Still yours — nothing here blocks the chain

Both live entries are in `.claude/vibe.md` under `## Needs you`:

1. **Git history on the wave captures.** The repo is **public** and 35 wave PNGs
   are in `origin/main`. Leg 4's audit found no real session title in any capture;
   what is exposed is a **Windows username** in the fixture temp path and the
   foreign-session **count**. Fix-forward taken; the residual half is **#151**.
2. **gauntlet owner call 14, the stop signal.** Two agent-reachable answers were
   attempted and both were refuted cross-model as post-hoc goalpost movement.

Seven older owner-calls remain in `.claude/vibe-130.md`. **#152** and **#155** are
yours in spirit — 208 rail tab stops ahead of the transcript is a design decision,
and #155 needs one manual run only a human can do properly.

**One call leg 7 made that is cheap to overturn:** `DOM PHASE INCOMPLETE` exits
**0**. If you want CI to treat an unchecked contract as a hard stop, it is one
line in `phaseVerdict`'s caller and one test. The reasoning for 0 is in the
decision entry.

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

**`inspect.mjs` launches on a private profile** (#147), so a wave's captures no
longer inherit whatever zoom or bounds the machine last had. Another boundary
across which byte comparison is not meaningful — and a deliberate one.

## Chain rules

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
