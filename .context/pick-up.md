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

**Eight tickets left. Leg 1 landed #149, leg 2 landed #146, leg 3 landed #142,
leg 4 landed #148** (`f60b40a`) — the sessions rail is a fixture, both of its
lists replaced in main, and the rail is read back and compared before any
capture. **Next is #143.** Recommended order, and the reasons are not cosmetic:

| Order | # | Why here |
|---|---|---|
| ~~1~~ | ~~149~~ | **DONE, leg 1.** Bar README + `SKILL.md` at nine surfaces, drift now gated |
| ~~2~~ | ~~146~~ | **DONE, leg 2.** Producers honour `SCREENSHOT_DIR`; the phase no longer dirties the tree |
| ~~3~~ | ~~142~~ | **DONE, leg 3.** Workspace name pinned; `titlebar.png` is diffable |
| ~~4~~ | ~~148~~ | **DONE, leg 4.** Rail fixtured; the last known source of capture drift |
| 5 | 143 | Driver-first, and **now verifiable** — #148 has landed, so a green result is the driver's rather than the rail's |
| 6 | 147 | Private profile per driver, dedicated shared profile for the opt-out pair |
| 7 | 145 | Quarantine accepted; phase must not report clean green |
| 8 | 150 | Headless-gate CI, must not read as full coverage |
| 9 | 141 | Build-artifact assertions; verify `gui-93` is already covered first |
| 10 | 138 | Type scale. **Gauntlet is confounded until this lands** |
| 11 | 139 | Tool-card label to 400 |
| 12 | 140 | Named scoped exception for the state stripe |

**No ticket in this queue carries a native blocking edge** — checked on all nine
at leg 3, and #148 closing changed none of them. The ordering above lives only in
this table, so it is the chain's plan rather than something the tracker will
enforce. Every leg so far has followed it.

**#144 stays `needs-triage` on purpose.** Its settled half is #150. Closing #144
because #150 landed is the exact failure the split was reviewed against.

**#151 is new, also `needs-triage`, and must not be promoted by a leg.** Filed by
leg 4 from the wave-capture audit: the fixture workspace lives under the user
profile, so every rail capture renders a Windows username in its group heading.
It is a decision about *where the workspace lives* and every reliable fix is
platform-specific, so it is the owner's call.

## Next ticket, #143

`gui-123`: the reuse control is not reachable by keyboard, and the DOM phase is
red on it. Its failure text is #143 verbatim — *"the reuse control could not be
reached with Tab in 60 presses"* — so expect that red until it lands and do not
read it as a regression.

**Why the plan put it after #148.** The concern was that a keyboard-reachability
fix verified against an unstable rail could be credited to the wrong change. The
rail is now a fixture with five deterministic rows, so a tab order measured
through it is measuring the driver's own fix.

## What leg 4 measured that changes how a stability claim gets written

**Do not accept "run it twice and byte-compare" as evidence for any capture
surface.** It passes on unfixed code. Leg 3 ran `inspect.mjs` four times and
byte-compared everything, getting a clean result on a rail that was still listing
953 real sessions, because two runs minutes apart on one machine see the same
store.

Argue from **what feeds the surface**. For #148 that was the footer's real count
reading 950, 951, 952, 953 across waves 2 to 5 and **976** today, plus the
sidebar surface's own log inverting from **7125 characters** of rail content to
**550**.

**A capture surface fed by a stub says nothing about the stub's real channel.** A
green `sidebar.png` is no evidence `session:list` works, exactly as a green
`commands-dock.png` is none that the CLI serves commands.

## What was decided while you were out, in one line each

- **#138** — restrike the em-set markdown headings onto the one ladder, document
  the rungs with roles, retire or re-point `--fs-display`.
- **#139** — **the tool-card label goes to 400, not the prose.** `DESIGN.md`
  licenses 600 for the app name and bubble-less emphasis only, and a tool-card
  label is neither. This reversed twice; read the ticket.
- **#140** — keep the stripe, amend the ban with a named scoped exception in
  #125's form. #125 supplies the method; the grant supplies the authority.

## Still yours — nothing here blocks the chain

Both live entries are in `.claude/vibe.md` under `## Needs you`:

1. **Git history on the wave captures.** The repo is **public** and 35 wave PNGs
   are in `origin/main`. **Leg 4 finished the audit this call was waiting on** —
   all five waves opened, not just wave 5. Findings: **no real session title
   appears in any capture, in any wave**; the rail exists only in `sidebar.png`
   and `window-session.png`, and `window-welcome.png` has no rail at all. What is
   exposed is a **Windows username** in the fixture temp path (all five waves) and
   the foreign-session **count** (waves 2 to 5, now fixed forward). Fix-forward
   remains taken; a history rewrite is irreversible and outward-facing so it was
   **not** done. The residual username half is now tracked as **#151**.
2. **gauntlet owner call 14, the stop signal.** Two agent-reachable answers were
   attempted and both were refuted cross-model as post-hoc goalpost movement, so
   the criterion was left **untouched**. The genuine (a)/(b)/(c) choice is still
   yours.

Seven older owner-calls remain in `.claude/vibe-130.md`, unchanged.

## Gauntlet

`.claude/gauntlet.md` was **archived to `.claude/gauntlet-core-surfaces.md`** so a
fresh run seeds instead of halting on the old `stop: true` at `plateau: 3`. That
file is five waves of adjudication and is worth reading before the next run —
especially owner calls 14 to 20.

The chained run is intended to cover **all nine captured surfaces**, not the five
the last run used. Since #149 the bar names all nine in its own list, so the seed
no longer has to infer them.

**One reference question is still open, and it is an owner call.** Earlier
`.context/` prose said the bar holds only five Linear references and that the
three docks therefore share the Sidebar's. But `.gauntlet/bar/README.md`'s own
"What each reference judges" table already assigns `linear/linear-features.png`
to *"Titlebar + docks"*. **Read the table, not the prose**, and if the table is
wrong that is yours to say. New bar references cannot be invented by an agent —
the bar is human-owned.

**A run cannot take all nine at once.** `pieces` is capped at 6 and fixed at
seed, so a seed picks a subset. That is a budget, not a statement that the
unpicked surfaces lack a standard; the bar README now says so in the file.

**Wave-to-wave byte comparison of the captures is now meaningful for all nine
surfaces** — #142 pinned the titlebar and #148 pinned the rail. **But not across
the #148 boundary:** waves 1 to 5 photographed a one-row rail fed by the real
store, and every future wave photographs the five-row fixture. Comparing
`sidebar.png` or `window-session.png` across that line compares two different
fixtures.

## Landmines

**Do not read the DOM phase's verdict off a compound command.** It has reported
**exit 0 while its own text said `DOM PHASE FAIL`**, with no pipe involved — the
command merely ended in `; echo`. **Any trailing command replaces the status.**
Read `$?` on its own line, or grep the redirected file.

**A byte comparison that passes is not evidence a capture is stable** (#148).
Two runs on one machine share the machine. Argue from what feeds the surface.

**Run `inspect.mjs` one at a time** (#142). Its workspace directory name is fixed
now, so a second concurrent run deletes the first's workspace and the first's
`cleanup()` then deletes the second's. Both produce garbage rather than an error.

**Cleaning `scripts/` after a phase run is no longer needed** (#146, `ed9a490`).
Every driver honours `SCREENSHOT_DIR`, the phase writes only under
`%TEMP%/claude-wrapper-dom-phase/<driver>/`, and `scripts/gui-*-shots/` is
gitignored. Any doc still telling you to run `git checkout -- scripts/` is stale.

**Point `SCREENSHOT_DIR` outside the repo** when running `inspect.mjs`.

**`gui-123` is red in the DOM phase and it is not your change.** Its failure text
is #143 verbatim. Expect it until #143 lands.

**A squash merge does not mark the branch merged.** `git branch -d` refuses after
one. Diff the branch against `main` first, and let an empty diff be what
authorises `-D`.

**A 0-byte subagent transcript is not a dead agent.** The file flushes only at
completion, so "not started yet" and "died on spawn" look identical by size.

**A mutation that reds fewer tests than you expected is a finding about the
tests** (#142), not a pass. Read what the mutation actually mutated before
scoring it.

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
`.gauntlet/bar/README.md`. The bar's copy is hand-authored on purpose — a
standard generated from the code it polices inherits that code's omissions — so
editing it is a deliberate change to the standard, not bookkeeping.

**A new driver's capture destination is gated** (#146):
`tests/driver-screenshot-dir.test.ts` reds on a hardcoded output path *and* on a
fallback that points back inside the repo. Use
`process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')`.
**Do not broaden the `scripts/gui-*-shots/` ignore rule** to `scripts/**/*.png` —
that swallows `scripts/spike-117-shots/`, which two findings files cite by path.

**A new `.mjs` in `.claude/skills/run-desktop/` that is neither a `gui-*` driver
nor a `*.source.mjs` sidecar gets a line in `drivers.manifest.mjs`** (#142). There
are now **four**: `driver.mjs`, `inspect.mjs`, `inspect-workspace.mjs` and
`inspect-sessions.mjs`.

**Anything the fast gate must RUN has to live outside `inspect.mjs`** (#142,
#148). The driver launches Electron at import, so a behavioural constraint stated
inside it can only ever be pinned as text — and "never refuses" or "this age
renders a stable label" are not properties source text can honestly check.

## Chain rules

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
