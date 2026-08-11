---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

## Chain 7 is running a twelve-ticket queue, with gauntlet chained behind it

An autonomous `/preset vibe` pass ran while the owner was away, under an explicit
AFK autonomy grant. It **ruled the three design questions**, **triaged the nine
follow-ups**, filed one new ticket, and fired the execution chain. The full
reasoning, every warrant, and every cross-model objection is in `.claude/vibe.md`
— read that before overturning anything here.

**Verify rather than trust this file. It has been wrong before:**

```text
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

## The queue

**Eleven tickets left. Leg 1 landed #149** (`6067a12`) — the bar README's surface
list restated, and a test that reds when it drifts from the driver's `SURFACES`.
**Next is #146.** Recommended order, and the reasons are not cosmetic:

| Order | # | Why here |
|---|---|---|
| ~~1~~ | ~~149~~ | **DONE, leg 1.** Bar README + `SKILL.md` at nine surfaces, drift now gated |
| 2 | 146 | Producers must honour `SCREENSHOT_DIR` before anything else touches captures |
| 3 | 142 | Fixture pin; independent and measured |
| 4 | 148 | Fixture the sessions list; removes the second instability source |
| 5 | 143 | Driver-first, but **verify AFTER 148** so the fix is the driver's, not the rail's |
| 6 | 147 | Private profile per driver, dedicated shared profile for the opt-out pair |
| 7 | 145 | Quarantine accepted; phase must not report clean green |
| 8 | 150 | Headless-gate CI, must not read as full coverage |
| 9 | 141 | Build-artifact assertions; verify `gui-93` is already covered first |
| 10 | 138 | Type scale. **Gauntlet is confounded until this lands** |
| 11 | 139 | Tool-card label to 400 |
| 12 | 140 | Named scoped exception for the state stripe |

**#149 left one thing for whoever seeds the gauntlet, deliberately unresolved.**
The line below saying the three docks *"share the Sidebar's reference"* is
contradicted by `.gauntlet/bar/README.md`'s own "What each reference judges"
table, which already assigns `linear/linear-features.png` to *"Titlebar + docks:
control grouping, iconography"*. The table is the owner-confirmed half of a
human-owned artifact, so leg 1 raised it on the ticket rather than silently
rewriting it. **Settle it before the seed reads the table.**

**#144 stays `needs-triage` on purpose.** Its settled half is #150. Closing #144
because #150 landed is the exact failure the split was reviewed against.

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
   are in `origin/main`. Checked against the pixels rather than the issue text:
   what is actually rendered is a Windows username in a fixture temp path plus a
   session count, **not** the hundred project names #148 implied. Fix-forward
   taken; a history rewrite is irreversible and outward-facing so it was **not**
   done. Verified on wave 5 only; #148 carries the audit of the other 34.
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

**Two things about references, and they conflict — settle before seeding.** This
file previously said the bar holds only five Linear references and that the three
docks therefore share the Sidebar's on the strength of `DESIGN.md` specifying
them as *"mirroring the Sessions rail"*, labelled as the weaker comparison it is.
But `.gauntlet/bar/README.md`'s own table already assigns
`linear/linear-features.png` to *"Titlebar + docks"*. **Read the table, not this
paragraph**, and if the table is wrong that is an owner call. New bar references
cannot be invented by an agent — the bar is human-owned.

**A run cannot take all nine at once.** `pieces` is capped at 6 and fixed at
seed, so a seed picks a subset. That is a budget, not a statement that the
unpicked surfaces lack a standard; the bar README now says so in the file.

## Landmines, carried forward unchanged

**Do not read the DOM phase's verdict off a compound command.** It has reported
**exit 0 while its own text said `DOM PHASE FAIL`**, with no pipe involved — the
command merely ended in `; echo`. **Any trailing command replaces the status.**
Read `$?` on its own line, or grep the redirected file.

**Clean `scripts/` after any phase run** (#146): `git checkout -- scripts/` then
`git clean -fdq scripts/`.

**Point `SCREENSHOT_DIR` outside the repo** when running `inspect.mjs`.

**A 0-byte subagent transcript is not a dead agent.** This run diagnosed one that
way and was wrong: the file flushes only at completion, so "not started yet" and
"died on spawn" look identical by size. Cost two wasted spawns.

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

**Adding or removing a capture surface now costs three edits, and the gate says
so** (#149): `SURFACES` in `inspect.mjs`, the `surfaces:begin` / `surfaces:end`
region in `.claude/skills/run-desktop/SKILL.md`, and the same region in
`.gauntlet/bar/README.md`. The bar's copy is hand-authored on purpose — a
standard generated from the code it polices inherits that code's omissions — so
editing it is a deliberate change to the standard, not bookkeeping.

## Chain rules

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
