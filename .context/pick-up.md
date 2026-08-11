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

**Seven tickets left. Leg 1 landed #149, leg 2 #146, leg 3 #142, leg 4 #148,
leg 5 #143** (`1c42d3c`). **Next is #147.** Recommended order, and the reasons are
not cosmetic:

| Order | # | Why here |
|---|---|---|
| ~~1~~ | ~~149~~ | **DONE, leg 1.** Bar README + `SKILL.md` at nine surfaces, drift now gated |
| ~~2~~ | ~~146~~ | **DONE, leg 2.** Producers honour `SCREENSHOT_DIR` |
| ~~3~~ | ~~142~~ | **DONE, leg 3.** Workspace name pinned; `titlebar.png` is diffable |
| ~~4~~ | ~~148~~ | **DONE, leg 4.** Rail fixtured in `inspect.mjs` |
| ~~5~~ | ~~143~~ | **DONE, leg 5.** `gui-123` pins the rail it measures and counts its own budget |
| 6 | 147 | Private profile per driver, dedicated shared profile for the opt-out pair. **Leg 5 handed it a worked example — see below** |
| 7 | 145 | Quarantine accepted; phase must not report clean green |
| 8 | 150 | Headless-gate CI, must not read as full coverage |
| 9 | 141 | Build-artifact assertions; verify `gui-93` is already covered first |
| 10 | 138 | Type scale. **Gauntlet is confounded until this lands** |
| 11 | 139 | Tool-card label to 400 |
| 12 | 140 | Named scoped exception for the state stripe |

**No ticket in this queue carries a native blocking edge** — checked on all nine
at leg 3, and #148 and #143 closing changed none of them. The ordering above lives
only in this table, so it is the chain's plan rather than something the tracker
will enforce. Every leg so far has followed it.

**Five tickets sit at `needs-triage` and none may be promoted by a leg:** #144
(its settled half is #150 — closing it because #150 landed is the exact failure
the split was reviewed against), #151, and the three leg 5 filed: **#152**, **#153**,
**#154**.

## Before you trust a gate result

**`main` goes red on its own.** `tests/session-title-enrichment.test.tsx` fails
intermittently under full-suite load — **4 of 7** complete runs at leg 5,
including **one on the unmodified `main` tree with all work stashed**, and green
every time the file runs alone. Cause: a `findByText` on its 1000ms default while
100 sidebar rows render. Filed as **#153**.

**So a single red run is not evidence your change broke something.** Re-run. If it
is that test, stash and run against the bare tree — that is the measurement that
settles it, and it is what leg 5 did before landing.

## Next ticket, #147

DOM phase drivers share one Electron profile, so pinning bounds or zoom silently
reds later drivers.

**Leg 5 gave this ticket its sharpest example, measured.** The sessions rail's
scope toggle (`This project` / `All projects`) **persists across relaunch** — a
second launch, new process, brand-new workspace, still came up on `All projects`.
That one setting moved `gui-123`'s tab order from **17 focusables to 218** and was
the entire cause of #143.

**And `gui-123.mjs` now deliberately writes to that shared profile**, pinning
`This project` and leaving it there. Restoring the previous value was considered
and rejected: the only value there is to restore is the one that made the driver
red, and handing it to the next driver is the failure #147 is about. The comment
sits where the write happens. **A private profile per driver removes the need for
that pin** — but do not delete the pin's read-back when you do, because the
read-back is what catches a private profile that failed to apply.

**Scope, bounds and zoom are not the only persisted state.** #147's title names
bounds and zoom; leg 5 found a third. Look for what else the app persists before
assuming the list is two long.

## What leg 5 measured that changes how a fix gets proven

**A symptom that left is not a defect that was fixed.** The stock `gui-123`
**passed on first run** this leg. Closing on that green would have credited #148's
fix and left the driver's dependency on machine state in place with the ticket
marked done — which the triage had predicted and forbidden in advance.

The red was **reproduced on demand** instead: flip the persisted toggle, and the
original driver reds with the ticket's text verbatim while the new driver passes
from the identical state and reports the pin it applied.

**A check can run and still be blind in the configuration it runs in.** A reverted
60-press constant does not red the DOM phase on a normal machine. That is why the
rule went to the fast gate (`gui-123.source.mjs`), not the driver.

**Do not fix a load-sensitive read by lengthening the wait.** A pin written in the
wrong phase made phase 3 read a mid-transition `opacity: 0.823757`. Moving the pin
above every measurement removed the cause.

## What was decided while you were out, in one line each

- **#138** — restrike the em-set markdown headings onto the one ladder, document
  the rungs with roles, retire or re-point `--fs-display`.
- **#139** — **the tool-card label goes to 400, not the prose.** This reversed
  twice; read the ticket.
- **#140** — keep the stripe, amend the ban with a named scoped exception in
  #125's form.

## Still yours — nothing here blocks the chain

Both live entries are in `.claude/vibe.md` under `## Needs you`:

1. **Git history on the wave captures.** The repo is **public** and 35 wave PNGs
   are in `origin/main`. Leg 4's audit found **no real session title in any
   capture in any wave**; what is exposed is a **Windows username** in the fixture
   temp path and the foreign-session **count**. Fix-forward taken; a history
   rewrite is irreversible and outward-facing so it was **not** done. The residual
   username half is **#151**.
2. **gauntlet owner call 14, the stop signal.** Two agent-reachable answers were
   attempted and both were refuted cross-model as post-hoc goalpost movement.

Seven older owner-calls remain in `.claude/vibe-130.md`, unchanged. **#152** is
new and also yours in spirit: 208 rail tab stops ahead of the transcript is a
design decision, not a bug.

## Gauntlet

`.claude/gauntlet.md` was **archived to `.claude/gauntlet-core-surfaces.md`** so a
fresh run seeds instead of halting on the old `stop: true` at `plateau: 3`. That
file is five waves of adjudication and is worth reading before the next run —
especially owner calls 14 to 20.

**One reference question is still open, and it is an owner call.** Earlier
`.context/` prose said the bar holds only five Linear references and that the
three docks therefore share the Sidebar's. But `.gauntlet/bar/README.md`'s own
"What each reference judges" table already assigns `linear/linear-features.png` to
*"Titlebar + docks"*. **Read the table, not the prose**, and if the table is wrong
that is yours to say. New bar references cannot be invented by an agent.

**A run cannot take all nine surfaces at once.** `pieces` is capped at 6 and fixed
at seed. That is a budget, not a statement that the unpicked surfaces lack a
standard.

**Wave-to-wave byte comparison is meaningful for all nine surfaces, but not across
the #148 boundary:** waves 1 to 5 photographed a one-row rail fed by the real
store, and every future wave photographs the five-row fixture.

## Landmines

**`main` is intermittently red on `session-title-enrichment` (#153).** Re-run
before believing it, and stash-and-compare before blaming your change.

**Do not read the DOM phase's verdict off a compound command.** It has reported
**exit 0 while its own text said `DOM PHASE FAIL`**, with no pipe involved — the
command merely ended in `; echo`. **Any trailing command replaces the status.**
Read `$?` on its own line, or grep the redirected file.

**A driver that pins persisted app state must READ IT BACK** (#143). Pinning
without a read-back is how a driver silently measures the machine anyway. The
read-back is also what would catch #147's private profile failing to apply.

**A byte comparison that passes is not evidence a capture is stable** (#148). Two
runs on one machine share the machine. Argue from what feeds the surface.

**Run `inspect.mjs` one at a time** (#142). Its workspace directory name is fixed,
so a second concurrent run deletes the first's workspace.

**Cleaning `scripts/` after a phase run is no longer needed** (#146, `ed9a490`).
Any doc still telling you to run `git checkout -- scripts/` is stale.

**Point `SCREENSHOT_DIR` outside the repo** when running `inspect.mjs`.

**A squash merge does not mark the branch merged.** `git branch -d` refuses after
one. Diff the branch against `main` first, and let an empty diff authorise `-D`.

**A 0-byte subagent transcript is not a dead agent.** The file flushes only at
completion.

**A mutation that reds fewer tests than you expected is a finding about the
tests** (#142), not a pass.

**A driver copied outside the repo cannot resolve `playwright-core`** and its
`APP_DIR` (computed from `import.meta.url`) points at the wrong tree. To run an
old version of a driver, check it out **in place** with
`git checkout HEAD -- <path>` and restore afterwards. Leg 5 lost a 6-minute
timeout learning this.

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

**Adding or removing a capture surface costs three edits, and the gate says so**
(#149): `SURFACES` in `inspect.mjs`, the `surfaces:begin` / `surfaces:end` region
in `.claude/skills/run-desktop/SKILL.md`, and the same region in
`.gauntlet/bar/README.md`. The bar's copy is hand-authored on purpose.

**A new driver's capture destination is gated** (#146):
`tests/driver-screenshot-dir.test.ts` reds on a hardcoded output path *and* on a
fallback that points back inside the repo. Use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.
**Do not broaden the `scripts/gui-*-shots/` ignore rule** to `scripts/**/*.png`.

**A new `.mjs` in `.claude/skills/run-desktop/` that is neither a `gui-*` driver
nor a `*.source.mjs` sidecar gets a line in `drivers.manifest.mjs`** (#142). There
are **four**. A sidecar needs no wiring at all — `gui-source-assertions.test.ts`
globs `*.source.mjs`, and the phase's own accounting proves it is not miscounted
as a driver.

**Anything the fast gate must RUN has to live outside `inspect.mjs`** (#142,
#148). The driver launches Electron at import.

## Chain rules

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
