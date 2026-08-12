---
type: pick-up
project: claude-wrapper
updated: 2026-08-12
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

**Landmines, gate shapes and standing constraints now live in [[active-work]]**, not
here. This file is the baton: what just landed, what is next, and the one rule the loop
body will try to break.

## Next: #154

**`gui-122` carries the same hardcoded 60-press Tab budget #143 just removed from
`gui-123`.** A mechanical port of a move already shipped and pinned, which is why it
promoted.

The budget is at `.claude/skills/run-desktop/gui-122.mjs:313` — verified present this
leg. `#143`'s shipped shape is in `gui-123.mjs` (`1c42d3c`): count the budget off the
document rather than hardcoding it. **Read what `1c42d3c` DID, not only what the ticket
says it did** — that is leg 12's rule and it has caught a mismatch before.

After #154: **#156** (`gui-91` intermittently times out on `page.screenshot()`, ~1 run in
7). Then the queue is dry, which is the chain's stop signal.

Verify rather than trust this file. **It has been wrong before** — a prior pass claimed
12 open issues when there were 13, and 24 commits ahead when there were 34:

```bash
gh issue list --state open --label ready-for-agent
git rev-list --count origin/main..main
```

## The one rule the loop body will try to break

**Never apply the `ready-for-human` label.** The owner banned it while away and the ban
is recorded in memory (`afk-autonomy-grant.md`): *"never tag anything ready for human as
i will be away from home"*.

**`/preset ticket-loop` steps 4 and 6 both tell you to apply it** — on a branch collision
and on a failed gate. The body ranks **below** this rule. It is pinned here rather than
in a leg file because a fresh chain writes a fresh leg file and loses the override; step
1 of every firing reads *this* file.

Instead: label **`needs-info`**, comment with exactly where you stopped and what a cold
reader needs, `PushNotification`, and **stop the chain**. The relabel only ever existed to
stop the next leg re-picking a stuck ticket forever — stopping the chain achieves that
without the banned label.

## What leg 1 landed

**#153 as `5267ede` on `main`, CLOSED.** One line of one test file, no source change. The
#49 enrichment pin now awaits the mechanism (`titleHint` called with `('cmd', FOLDER)`)
instead of the rendered label, with an explicit 3000ms timeout.

**The part worth carrying:** `waitFor` and `findBy*` share one 1000ms `asyncUtilTimeout`,
so swapping one for the other does not remove a fixed window — it only shrinks the work
inside it. And a per-assertion timeout is bounded **above** by vitest's 5000ms
`testTimeout` as well as below by the window it replaces: a first attempt at 5000ms lost
the diagnostic entirely, degrading a named assertion failure into a bare `Test timed out`
at the test declaration. Full reasoning:
[[2026-08-12-awaiting-the-mechanism-is-half-a-fix-and-the-timeout-is-bounded-at-both-ends]].

**Evidence, because an unproven fix to an intermittent is worse than the intermittent:**
mutation-verified both directions, and **6 of 6 sequential full suites green** (96 files /
1406 passed / 44 skipped) against a prior rate of 4 reds in 7. The two run sets are on
different trees, so it is not a controlled comparison — stated on the ticket rather than
buried.

**#162 filed at `needs-triage`:** the repo-wide version of the same cause. 390 async waits
across 34 files on the same 1000ms default, zero `configure()` calls, and no `setupFiles`
in `vitest.config.ts` for a global config to live in. **A leg must not promote it.**

**`overview.md` corrected:** `.appearance-field--stacked` no longer exists in `src/` —
wave 4 deleted it and `25d13e0` merged that. Leg 12 flagged the line as a merge-time
follow-up; this leg discharged it.

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
  widening, do not detour into it.** #153 → #162 is this leg's instance.
- **An unproven fix to an intermittent is worse than the intermittent**, because it
  retires the ticket that was tracking it. Say how many runs were taken and what the rate
  was, or say the fix is unproven. **#156 is the remaining intermittent.**
- **Read a cited form for what it DID, not only what it said.** Directly relevant to #154,
  which is a port of `1c42d3c`.

## For the gauntlet run chained behind this queue

`then: /relay N=1 /preset gauntlet` fires on exactly one exit path — the queue going dry.
Its preconditions were checked at seed and still hold: `.claude/gauntlet.md` is absent
(archived to `.claude/gauntlet-docks-and-min-window.md`, which carries `stop: true`), the
bar in `.gauntlet/bar/` is intact with its `inspect:` command, and the run seeds off
merged `main` so it grades an app already carrying run 2's twelve waves.

Read the run-2 record and the archived owner calls before wave 1 — especially the
adjudication recording the collision between the critic's repeated ask and `DESIGN.md`'s
rails group, which is what stalled five waves. The refuted claims and the settled bar
reference are listed in [[active-work]] under **Open questions**.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
