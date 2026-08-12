---
type: pick-up
project: claude-wrapper
updated: 2026-08-12
tags: [context, pick-up]
---

# Pick up

Start: read [[overview]] + [[active-work]].

**Landmines, gate shapes and standing constraints live in [[active-work]]**, not
here. This file is the baton: what just landed, what is next, and the one rule the
loop body will try to break.

## Next: `queue empty` — and the successor is already running

**The `ready-for-agent` queue is DRY.** Chain 8 drained it in three legs — #153
(`5267ede`), #154 (`454e8de`), #156 (`0e63253`) — and leg 3 set `stop: true` and
fired its `then:` as its last act: **`/relay N=1 /preset gauntlet`**, a fresh
gauntlet run. So **the next session is most likely a gauntlet leg, not a ticket
leg**, and the section below is for it.

**No leg may promote a ticket to refill this queue.** Fifteen issues are open;
thirteen sit at `needs-triage` and two at `needs-info`, and five of the thirteen
were filed *by* legs (#162, #163, #164, #165, #166). Promoting any of them makes
a chain's stop condition unreachable by construction. They are the owner's to
triage.

Verify rather than trust this file. **It has been wrong before** — a prior pass
claimed 12 open issues when there were 13, and 24 commits ahead when there were
34. And use the **API**, not the label filter:

```bash
gh api "repos/EstarinAzx/claude-wrapper/issues?state=open&labels=ready-for-agent" --jq 'length'
git rev-list --count origin/main..main
```

**`gh issue list --state open --label ready-for-agent` is not trustworthy
immediately after a close.** Measured this leg: it returned #156 as `CLOSED`
*within* a `--state open` query, because the label filter reads GitHub's search
index and that index lags. The API call above answered `0` correctly at the same
moment.

## The one rule the loop body will try to break

**Never apply the `ready-for-human` label.** The owner banned it while away and
the ban is recorded in memory (`afk-autonomy-grant.md`): *"never tag anything
ready for human as i will be away from home"*.

**`/preset ticket-loop` steps 4 and 6 both tell you to apply it** — on a branch
collision and on a failed gate. The body ranks **below** this rule. It is pinned
here rather than in a leg file because a fresh chain writes a fresh leg file and
loses the override; step 1 of every firing reads *this* file.

Instead: label **`needs-info`**, comment with exactly where you stopped and what a
cold reader needs, `PushNotification`, and **stop the chain**. The relabel only
ever existed to stop the next leg re-picking a stuck ticket forever — stopping the
chain achieves that without the banned label.

## What leg 3 landed

**#156 as `0e63253` on `main`, CLOSED on its blast-radius half only.** A stalled
screenshot in `gui-91` now costs the artifact and nothing else. One driver file
plus a harness; no `src/` change.

**The part worth carrying:** the defect that was *provable* is not the one the
ticket describes, and finding that out cost nothing but reading.

1. **A capture here is evidence, never an assertion.** Nothing in `bad` reads
   either screenshot — yet the bare `await` threw in a top-level-await module and
   aborted the run, so **one missing artifact cost eight assertions it has no
   bearing on**, and with no verdict line printed `dom-phase.mjs` read it as a
   plain `FAIL`, indistinguishable from a real product break. That is the harm the
   ticket was actually filed over.
2. **The renderer cannot see a stalled compositor.** With frames withheld the
   capture hangs for 30000ms while the page reports `visibilityState: "visible"`,
   `document.hidden: false` and fires `requestAnimationFrame` at **0ms**. Only
   `win.isVisible()` in **main** moved. This **killed the leg's own first candidate
   remedy** — awaiting a real frame — before it shipped. Validate a detector
   against a deliberately induced instance before you build a guard on it.
3. **Both directions the ticket proposed are refuted.** A working capture costs
   32–41ms idle and 40–60ms with eleven cores saturated, against a **30000ms**
   inherited default — so ~500x, and load moves the cost by tens of milliseconds,
   never tens of seconds. A 30000ms capture is a different *mode*, not this
   distribution's tail.

Full reasoning:
[[2026-08-12-evidence-may-not-destroy-the-verdict-and-the-renderer-cannot-see-a-stalled-compositor]].

**Evidence:** baseline `PASS`/exit 0 with both captures written; frames withheld
for the first capture only → `UNSCORED`/exit 2 **with all eight assertions still
run** and the window state reported; that stall compounded with a real assertion
failure → `FAIL`/exit 1, stall still reported, product red winning. Mutants built
**outside the repo** with re-rooted imports so no glob or manifest could see a
stray `gui-*.mjs`; `gui-91.mjs` hash-checked unchanged after each. Gate: typecheck
clean, **96 files / 1408 passed / 43 skipped** (zero delta — a driver and a
`scripts/` harness are invisible to the fast gate), build clean with
`index-DOI17h8g.css` unchanged.

**Two follow-ups filed at `needs-triage`: #165** (the stall has no cause and did
not reproduce in 28 runs; the open question is how much machine time an
unreproduced ~3% instrument stall is worth) and **#166** (26 of 39 capture calls
repo-wide share the hole — but *not* a mechanical sweep: where a capture's bytes
feed an assertion, continuing past a stall would be worse than throwing). **A leg
must not promote either.**

## Chain rules

- **Do not push on your own initiative** (D6). Not even when a ticket's own
  acceptance asks for it — leg 8 hit exactly that and left the ticket open instead.
- **Do not apply `ready-for-human`** — see above. Standing owner ban, not a
  preference.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** A leg promoting
  its own follow-up makes the chain's stop condition unreachable by construction.
- **A leg may leave a ticket open or close it.** Landing the work and closing the
  ticket are separate decisions.
- **Closing a ticket must not retire live tracking.** #156's own text warned that
  an unproven fix to an intermittent is *worse* than the intermittent, because it
  retires the ticket that was tracking it. Both obvious readings were wrong:
  closing outright retires the tracking, and leaving it `ready-for-agent` refills
  the queue the chain stops on and hands the next leg unreproducible work. The way
  out is that the halves are separable — close what was proven, re-file the rest
  under text that matches what is actually known (#165).
- **An acceptance criterion written as a stop gate is read first and answered with
  evidence.** Discharging it honestly may widen the finding beyond the ticket —
  **file the widening, do not detour into it.** #153 → #162, #154 → #163/#164,
  #156 → #165/#166.
- **Read a cited form for what it DID, not only what it said** — and extend that to
  the ticket's own claims. #156 named two candidate causes and measurement refuted
  both; #154 named three drivers as carrying Tab loops and none did.
- **An unproven fix to an intermittent is worse than the intermittent.** #156 was
  the instance: 28 runs bought no reproduction, so no fix was claimed.

## For the gauntlet run now chained behind this queue

**`then:` has FIRED.** `/relay N=1 /preset gauntlet` was spawned by leg 3 and
`then:` was cleared in `.claude/relay/ticket-loop.md` in the same edit, so a
revived ticket-loop chain cannot fire it twice.

Its preconditions were checked at seed and **legs 1–3 changed none of them** —
all three touched only test and driver files:

- **`.claude/gauntlet.md` is absent** — archived to
  `.claude/gauntlet-docks-and-min-window.md` (`wave: 12`, `max_waves: 12`,
  `stop: true`). Left in place it would seed-guard the new run onto the closed one
  and halt it immediately.
- **`.gauntlet/bar/` exists and is intact** — `README.md`, five `linear/`
  references, two `identity/` references, `manifest.json`.
- **The `inspect:` command is present** in `.gauntlet/bar/README.md`.
- **The new run seeds off merged `main`**, which carries run 2's twelve waves
  (`25d13e0`), so unlike run 2 it grades an app that already has that work in it.

Read the run-2 record and the archived owner calls before wave 1 — especially the
adjudication recording the collision between the critic's repeated ask and
`DESIGN.md`'s rails group, which is what stalled five waves. The refuted claims
and the settled bar reference are listed in [[active-work]] under **Open
questions**; **owner call 14, the stop signal, is still unanswered and still (a)**,
so run 2 was cut off by budget rather than converged.

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
