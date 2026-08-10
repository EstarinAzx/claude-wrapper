---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

## queue empty

**Relay chain 6 has STOPPED, and it stopped correctly rather than by failing.**

Leg 6 landed **#137** and closed it, which emptied the `ready-for-agent` queue —
the chain's declared stop condition. No leg 7 was spawned.
`.claude/relay/ticket-loop.md` carries `stop: true`.

**There is no agent-ready work in this repo right now.** Confirm rather than
trust this file; the tracker is the authority and this file has been wrong
before:

```text
gh issue list --state open --label ready-for-agent
```

If that returns nothing, **the next move belongs to a human**, not to another
leg. Everything open is either a design ruling (`ready-for-human`) or untriaged.

## The state you are picking up

`main` = `b35e799`. Tree clean. typecheck clean, build clean,
**89 files / 1329 passed + 36 skipped**. DOM phase **29/30**, the single red the
documented `gui-123` (#143).

**Nineteen commits sit UNPUSHED.** D6 stands — a leg does not push on its own
initiative. Read the real gap rather than that number:
`git rev-list --count origin/main..main`.

## What is waiting on you

| # | Label | What it needs |
|---|---|---|
| 138 | ready-for-human | Rule on the type scale: five rendered sizes against three documented |
| 139 | ready-for-human | Rule on the transcript's prose/label weight pair |
| 140 | ready-for-human | Rule on the selected row's mint side-stripe against the ban |
| 141–149 | needs-triage | Nine follow-ups, six of them about the instruments |

Plus **two live owner-calls** in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken, and **seven older ones in
`.claude/vibe-130.md`** — every reference pointing at `.claude/vibe.md` for those
is stale.

**Do not restart the gauntlet before #138–#140 are answered.**
`.claude/gauntlet.md` carries `stop: true` at `plateau: 3`, so `/preset gauntlet`
halts at its own seed guard — correctly. Restarting also needs the stop-signal
question recorded there as owner call 14.

**The `needs-triage` pile is itself the signal.** Six of the nine are about the
instruments rather than the app: #142 and #148 (captures that are not
reproducible), #144 (nothing runs the DOM phase), #145 (a driver that cannot run
in a batch), #146 (the phase dirties tracked files), #147 (drivers share one
Electron profile), #149 (the published surface list is stale). The app's tests
are in better shape than the things that test it.

**#144 is the sharpest.** #137 added a measurement that only the DOM phase can
run, and nothing runs that phase because the repo has no CI. The executing pins
exist; the thing that would make them bite on every push does not.

## If you restart a relay chain

The owner's standing pacing instruction for chain 6 was: **call `ScheduleWakeup`
with `delaySeconds: 900` as the first action of each leg**, passing the `/relay`
input back verbatim as `prompt`, then get straight on with the ticket — it is a
pacing instruction, not a condition to wait on. That instruction was scoped to
chain 6, which has ended. Re-confirm it before applying it to a new chain.

Chain rules that were live and would apply again unchanged:

- **Do not push on your own initiative** (D6).
- **Do not apply `ready-for-human`** — a blocker becomes `needs-info` + a comment
  + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** The chain stops
  on an empty frontier; a leg promoting its own follow-up there makes the stop
  condition unreachable by construction.

## Landmines for anyone touching the instruments

**Do not read the DOM phase's verdict off a compound command.** It reported
**exit 0 while its own text said `DOM PHASE FAIL`** this leg, with no pipe
involved — the command ended in `; echo`. Leg 5 recorded this as "do not pipe
through `tail`", which is narrower than the defect: **any trailing command
replaces the status.** Read `$?` on its own line, or grep the redirected file.

**Clean `scripts/` after any phase run** (#146): `git checkout -- scripts/` then
`git clean -fdq scripts/`. It rewrote five tracked PNGs this leg.

**Do not trust a capture comparison without a baseline.** Three of `inspect.mjs`'s
ten files differ between two runs of the *unmodified* driver. Pinning the fixture
isolates `titlebar.png` (#142); `sidebar.png` and `window-session.png` move for a
different reason (#148) — the rail photographs 100 real sessions, 99 of them
foreign, whose relative ages tick at identical character length.

**Point `SCREENSHOT_DIR` outside the repo** when running `inspect.mjs`, or the
captures land in the tree.

## Standing constraints for the renderer

No em dashes in user-visible strings (`tests/copy-em-dash.test.ts` compiles
`src/`; comments are free). D3 — the stylesheet pins are literal-text and
brittle: no comment in `styles/` may contain a closing brace, `.bubble` and
`.message-input` stay ungrouped, `.bubble {` must stay the first literal
occurrence in `chat.css`, exactly one `backdrop-filter` in all of `styles/`, and
the `@import` order in `styles.css` IS the cascade. D4 — any CSS change owes a
driver pin that **executes**, naming which gate runs it; jsdom loads no CSS, so
the fast gate structurally cannot see layout. The titlebar's centring is
load-bearing (#136): horizontal padding on `.titlebar`, `.titlebar-left` or
`.titlebar-right` reds `gui-136` by half its width, as does `min-width: 0` on
`.titlebar-left` or letting `.titlebar-center` grow. The identity mark is solid
by design. Colour, translucency and material are instrument artifacts in any
capture. `DESIGN.md` is read literally by `tests/subagent-material.test.ts`,
which splits on `\n## Bans in force\n`.

**New from #137:** `CLAIMED_HEADROOM_PX` in `inspect.mjs` is a copy of a sum
argued in prose in `chat.css`. **Never move it to match a measurement without
moving that sum too** — that converts the check into a rubber stamp.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
