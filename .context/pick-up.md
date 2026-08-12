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

## Next: gauntlet **run 3** is seeded and its wave 1 leg is running

**`/relay N=1 /preset gauntlet` is live.** Chain 8 drained the ticket queue in three
legs and fired its `then:` as its last act; that successor seeded **run 3, slug
`core-after-docks`**, at `ea37a10` and spawned leg 2 for wave 1.

- Run state: **`.claude/gauntlet.md` on `gauntlet/core-after-docks`** — the run's
  memory, and the file to read before touching anything. The seed commit is on
  `main` too, so a leg booting on `main` cannot re-seed; **`main`'s copy goes stale
  the moment wave 1 commits.**
- Relay machinery: `.claude/relay/gauntlet.md`. Closed chains (run 2's gauntlet,
  chain 8's ticket-loop, the older relay-leg chain) were moved to
  `.claude/relay/archive/` so boot cannot match a stopped chain and **`/relay stop`
  with no slug unambiguously stops the live run.**
- Pieces: **Welcome, Titlebar, Sidebar, Chat, InputBar.** The sixth slot is
  deliberately empty — the smoothing pass's one-new-piece budget is where run 2's
  only verdict movements from a builder-less piece came from.

**Why re-grading run 1's five surfaces is legitimate, and how it was established.**
Run 1 closed all five at `BAR WINS` with `plateau: 3`, so this needed proof rather
than an argument. The instrument was controlled first: chain 8's tickets touched no
`src/`, so a fresh capture of `main` should reproduce run 2 wave 12 exactly — **all
eleven files came back SHA256-identical**, across a rebuild and two days, which is
cross-run determinism run 2 had only ever shown *within* a run. Against that
control, all five surfaces differ from the pixels run 1 judged: **the sessions rail
narrowed 254 → 248px**, chat and input-bar each absorbed the 6px, and Welcome and
Titlebar changed content inside unchanged boxes. Full derivation in
`.claude/gauntlet.md` under "Why this run exists"; **do not re-derive it.**

**`AgentsDock` and `DocksAsOne` are excluded on purpose** — both blocked on **owner
call 19**, whose default is *build nothing*, and they cost run 2 **six consecutive
waves** of pixel-identical captures and restated gaps.

## The one rule the loop body will try to break

**The critic must not be a Claude family, and the builder never grades.** Everything
this preset is worth rests on that one separation. Two ways it breaks quietly:

1. **`binary:` falling back to `claude`.** A fresh relay init that auto-detects
   instead of reading the pin bypasses the Wisp gateway, and the "cross-model"
   critic silently becomes a Claude model. `binary: claude-wisp` is pinned in
   `.claude/relay/gauntlet.md`; verified at seed (`$env:CLAUDE_BINARY`,
   `claude-wisp.cmd` present, gateway live on `127.0.0.1:41184`).
2. **Carrying `critic:` forward instead of re-resolving it.** It is a *rule* —
   `wisp routing` live, first non-Anthropic family — not the value `sonnet`. It
   landed on `codex/gpt-5.6-sol` at seed and in both prior runs; that is luck, and
   the routes have moved in under a day.

**Second rule, and run 2 lost five waves to it: a critic's named gap is not an
instruction.** When it collides with `DESIGN.md`, the gap loses — that is what owner
call 19 *is*. And per the bar, **a critic may not rule on colour, translucency or
material** (the wash is composited by Windows over OS acrylic; no driver sees it).
A builder handed a colour gap drifts the app off its identity floor, which is a
failed wave even if it looks better.

## Ticket queue: still dry, and no leg may refill it

**`ready-for-agent` is empty.** Fifteen issues open — thirteen `needs-triage`, two
`needs-info`; five of the thirteen were filed *by* legs (#162–#166). **Promoting any
of them makes a chain's stop condition unreachable by construction.** They are the
owner's to triage.

Verify rather than trust this file — **it has been wrong before** (claimed 12 open
issues when there were 13, 24 commits ahead when there were 34). Use the **API**,
not the label filter:

```bash
gh api "repos/EstarinAzx/claude-wrapper/issues?state=open&labels=ready-for-agent" --jq 'length'
git rev-list --count origin/main..main
```

`gh issue list --state open --label ready-for-agent` is **not trustworthy right
after a close** — measured returning a `CLOSED` issue inside a `--state open` query,
because the label filter reads GitHub's search index and that index lags.

## Chain rules

- **Never apply the `ready-for-human` label.** Standing owner ban recorded in memory
  (`afk-autonomy-grant.md`). `/preset ticket-loop` steps 4 and 6 both tell you to;
  the body ranks **below** this rule. Instead: `needs-info` + a comment + a
  `PushNotification` + **stop the chain**.
- **Do not push on your own initiative** (D6). Not `main`, not a gauntlet branch,
  not when a ticket's own acceptance asks for it — leg 8 hit exactly that and left
  the ticket open instead. D6 was written and pressure-tested *under* the AFK grant,
  so the grant does not override it.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.**
- **`.context/` commits ride `main`; wave commits ride the gauntlet branch.** Leave
  the tree on the branch when spawning a wave leg.
- **A capture is evidence, never an assertion**, and a missing capture is a **failed
  run**, not an absent surface — `inspect` prints `CAPTURED n/11`; if a file is
  absent, read the output rather than judging the surface.
- **An unproven fix to an intermittent is worse than the intermittent** (#156: 28
  runs bought no reproduction, so no fix was claimed). Closing a ticket must not
  retire live tracking — close what was proven, re-file the rest (#165).
- **Read a cited claim for what it DID, not what it said.** #156 named two candidate
  causes and measurement refuted both; #154 named three drivers as carrying Tab
  loops and none did; run 2's "the app has no icon vocabulary" is measurably false.

## What chain 8 landed

| leg | ticket | landed on `main` |
|---|---|---|
| 1 | #153 | `5267ede` |
| 2 | #154 | `454e8de` |
| 3 | #156 | `0e63253` |

**#156 closed on its blast-radius half only.** A stalled screenshot in `gui-91` now
costs the artifact and nothing else; the unreproduced stall itself moved to **#165**
rather than dying with the ticket, and the repo-wide version is **#166**. The part
worth carrying: **the renderer cannot see a stalled compositor** — with frames
withheld the page still reports `visibilityState: "visible"` and fires `rAF` at 0ms;
only `win.isVisible()` in **main** moved. That killed the leg's own first candidate
remedy before it shipped. Full reasoning:
[[2026-08-12-evidence-may-not-destroy-the-verdict-and-the-renderer-cannot-see-a-stalled-compositor]].

## Related

- [[active-work]] · [[overview]] · [[decisions]] · [[stack]]
