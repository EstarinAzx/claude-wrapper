---
type: pick-up
project: claude-wrapper
updated: 2026-08-12
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

**Landmines, gate shapes and standing constraints live in [[active-work]]**, not here.
This file is the baton: what just landed, what is next, and the one rule the loop body
will try to break.

## Next: #156 — and it is the LAST ticket in the queue

**`gui-91` intermittently times out on `page.screenshot()`, about 1 run in 7.** After it
the `ready-for-agent` queue is dry, which is this chain's stop signal — set `stop: true`,
then fire `then:` (`/relay N=1 /preset gauntlet`) and clear it in the same edit.

Two rules collide on this ticket and the order matters:

- **An unproven fix to an intermittent is worse than the intermittent**, because it
  retires the ticket that was tracking it. Say how many runs were taken and what the rate
  was, or say the fix is unproven. #153 set the bar: 6 of 6 sequential suites against a
  prior 4-in-7, stated with the caveat that the two run sets were on different trees.
- **A ~1-in-7 rate needs a lot of runs to move**, and `gui-91` is a full Electron launch,
  not a vitest file. Budget for that before starting, and if the run count needed is out
  of reach, say so on the ticket rather than shipping a green you cannot support.

Verify rather than trust this file. **It has been wrong before** — a prior pass claimed 12
open issues when there were 13, and 24 commits ahead when there were 34:

```bash
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

## The one rule the loop body will try to break

**Never apply the `ready-for-human` label.** The owner banned it while away and the ban is
recorded in memory (`afk-autonomy-grant.md`): *"never tag anything ready for human as i
will be away from home"*.

**`/preset ticket-loop` steps 4 and 6 both tell you to apply it** — on a branch collision
and on a failed gate. The body ranks **below** this rule. It is pinned here rather than in
a leg file because a fresh chain writes a fresh leg file and loses the override; step 1 of
every firing reads *this* file.

Instead: label **`needs-info`**, comment with exactly where you stopped and what a cold
reader needs, `PushNotification`, and **stop the chain**. The relabel only ever existed to
stop the next leg re-picking a stuck ticket forever — stopping the chain achieves that
without the banned label.

## What leg 2 landed

**#154 as `454e8de` on `main`, CLOSED.** `gui-122`'s Tab budget is now counted off the
document (**24 focusables, budget 34**) instead of hardcoded at 60, plus a new
`gui-122.source.mjs` pinning that in the fast gate. Two driver files, no `src/` change.

**The part worth carrying:** the ticket was wrong about two things and both were only
findable by reading rather than trusting.

1. **A ban is satisfied by the absence of what it bans.** #143's criterion "no Tab
   traversal is bounded by a hardcoded number" reports `ok` forever in a driver that no
   longer traverses. Deleting the `keyboard.press('Tab')` line leaves criterion 1 green
   and reds only #154's new criterion 2. **`gui-123` has this hole today (#164).**
2. **#143's rail pin had already outlived its trigger.** #147 landed after it and gave
   every driver process a `mkdtemp` profile, so the scope toggle can no longer arrive
   pre-flipped. Phase 1b was ported as a **premise check**, not a repair — and #147 makes
   the sidecar's argument *stronger*, since a reverted constant is now invisible to the
   DOM phase by construction.

Full reasoning: [[2026-08-12-a-ban-is-satisfied-by-the-absence-of-what-it-bans]].

**Evidence:** baseline PASS before the change (the defect was latent, as the ticket said);
four mutations, four distinct reds, the inverted pin reproducing #143's 100-row rail
verbatim; every file `cp`-restored and hash-checked. Gate: typecheck clean, **96 files /
1408 passed / 43 skipped**, build clean with `index-DOI17h8g.css` unchanged. The `+2 / -1`
delta against leg 1 is exactly this change.

**Two follow-ups filed at `needs-triage`: #163** (`gui-124` still hardcodes `hops < 12` —
the last of the class) and **#164** (the traversal starts beside its target; gui-123's
missing vacuity guard). **A leg must not promote either.**

**`overview.md` corrected:** the sidecar enumeration gained `gui-122`, and the
"Where to look first" pointer stopped claiming "chain 7 is COMPLETE — the queue is DRY",
which it had asserted through two later chains.

## Chain rules

- **Do not push on your own initiative** (D6). Not even when a ticket's own acceptance
  asks for it — leg 8 hit exactly that and left the ticket open instead.
- **Do not apply `ready-for-human`** — see above. Standing owner ban, not a preference.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting its own
  follow-up makes the chain's stop condition unreachable by construction.
- **A leg may leave a ticket open or close it.** Landing the work and closing the ticket
  are separate decisions: close when everything the acceptance asks for was verifiable
  without a push.
- **An acceptance criterion written as a stop gate is read first and answered with
  evidence.** Discharging it honestly may widen the finding beyond the ticket — **file the
  widening, do not detour into it.** #153 → #162 and #154 → #163/#164 are the instances.
- **Read a cited form for what it DID, not only what it said** — and extend that to the
  ticket's own claims. #154 named three drivers as carrying Tab loops; none of them did,
  and one grep settled it. The same read found the real remainder (`gui-124`) and found
  that #147 had removed the premise #154 was arguing from.
- **An unproven fix to an intermittent is worse than the intermittent.** Directly relevant
  to #156, which is the remaining one.

## For the gauntlet run chained behind this queue

`then: /relay N=1 /preset gauntlet` fires on exactly one exit path — the queue going dry,
which is **one ticket away**. Its preconditions were checked at seed and legs 1-2 changed
none of them: `.claude/gauntlet.md` is absent (archived to
`.claude/gauntlet-docks-and-min-window.md`, which carries `stop: true`), the bar in
`.gauntlet/bar/` is intact with its `inspect:` command, and the run seeds off merged
`main` so it grades an app already carrying run 2's twelve waves. **Clear `then:` in the
state file before spawning the successor**, so a revived chain cannot fire it twice.

Read the run-2 record and the archived owner calls before wave 1 — especially the
adjudication recording the collision between the critic's repeated ask and `DESIGN.md`'s
rails group, which is what stalled five waves. The refuted claims and the settled bar
reference are listed in [[active-work]] under **Open questions**.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
