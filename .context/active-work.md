---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 by Opus 5, relay chain 6 leg 6 — owner away_
_At commit: `b35e799` on `main`_

## Current focus

**None. The `ready-for-agent` queue is EMPTY and relay chain 6 has stopped.**

Leg 6 landed **#137** and closed it, which drained the frontier. That was the
chain's declared stop condition, so no leg 7 was spawned and
`.claude/relay/ticket-loop.md` carries `stop: true`.

**Everything still open needs a human before an agent can touch it.** Nine
tickets sit at `needs-triage` and three at `ready-for-human`. An agent picking
work from here would be choosing its own scope, which this batch bans.

## State

- **In flight:** nothing. `ticket/137-capture-welcome-minimum-window` was
  squash-merged and deleted. Tree clean on `main`.
- **Closed 2026-08-11 (leg 6):** **#137** (`b35e799`). **Filed: #148, #149**,
  both `needs-triage`.
- **Open:** #138, #139, #140 (`ready-for-human`) · #141–#149 (`needs-triage`).
  **Frontier: empty.**
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **89 files / 1329 passed + 36 skipped** (was 88 / 1325 + 36; the +1 file and
  +4 tests are exactly `tests/inspect-welcome-min.test.ts`). Ran on the branch
  and again on `main`. **Read the number off `main`, never off this file.**
- **DOM phase: 29/30**, the single red the documented `gui-123` (#143).
  `gui-69` and `gui-70` both pass — #147's private profile held.
- **NOT PUSHED. Nineteen commits sit local.** D6 stands. Read the real gap:
  `git rev-list --count origin/main..main`.

## What #137 actually was

The Welcome hero's layout is a height budget argued entirely in the `.welcome`
comment in `chat.css`, and **nothing had ever photographed it**.
`inspect.mjs` now writes an eleventh file, `welcome-min-window.png`, at the
window's enforced minimum.

| term | the comment claims | measured |
|---|---|---|
| pane | 432 | 640x**432** |
| padding top / bottom | 32 / 82 | 32 / **81.6** |
| content | 253 | **253.42** |
| **headroom** | **65** | **64.98** |

Drift **-0.02px**, identical across three runs. `scrollHeight == clientHeight`,
hero 32.48px clear at the top and 32.49 at the bottom. **The sum was right.**
AC4's disagreement clause did not fire.

The claim is now restated in the driver as `CLAIMED_HEADROOM_PX` and a
disagreement beyond 1px **fails the run**. That constant is a copy of prose and
copies drift: **never move it to match a measurement without moving the sum in
`chat.css` too**, or the check becomes a rubber stamp.

The size is **asked for**, via `getMinimumSize()`, not restated from
`src/main/index.ts`. The test asserts neither literal appears in the driver —
and it caught two of my own comments during the build.

## The finding, which is bigger than the ticket

**AC2 wanted every other surface byte-identical. Six runs of the UNMODIFIED
instrument show three of ten files already unstable** — not the one #142 names.

Pinning the fixture (fixed `SID`, fixed workspace path in place of `mkdtemp`)
makes `titlebar.png` byte-identical, **confirming #142's mechanism**.
`sidebar.png` still moves, so there is a second, independent source:

**The sessions rail is not fixture-driven, though `inspect.mjs`'s own header
says the whole instrument is.** `aside.sidebar` holds **100 rows, 99 of them
`session-row-btn-foreign`** — real sessions off the machine that ran it — and
the entire cross-run diff is four `.session-row-meta` spans ticking `8m`→`9m`,
`19m`→`20m`, `49m`→`50m`, `1h`→`2h`. **Identical character length**, which is
why the driver's own `textLength` guard read 7524 every run and saw nothing.
`window-session.png` inherits it. Filed **#148** — and it is a provenance leak
as much as an instability, because those two captures carry real session titles
and an absolute path into `.gauntlet/bar/` for a critic to read.

Three obvious answers were killed by measurement rather than argument:
byte-identical when shot twice 2.5s apart inside one run (not a settling race),
`animationName` `none` on every descendant (not `rails.css`'s `subagent-pulse`),
`scrollTop` 0 in both (not a scroll offset).

**Result: 8 of 10 byte-identical with the fixture pinned, `titlebar.png`
included; 2 excluded with a cause that predates the change.** 7 of 10 unpinned.
No capture was adjusted to green a hash.

## The correction to carry

**The DOM phase reported exit 0 while its own text said `DOM PHASE FAIL`, with
no pipe involved.** The command ended in `; echo`.

Leg 5 recorded this as *"do not pipe the phase through `tail`"*. That is
narrower than the defect: **any trailing command replaces the status**,
including the `echo` you added to print it. Read `$?` on its own line, or grep
the redirected file. The phase exits 1 correctly and always did.

## Pick up here

**There is no agent-ready work.** Confirm rather than trust that:

```text
gh issue list --state open --label ready-for-agent
```

Empty means the batch is done and the next move is a human's. The three
`ready-for-human` tickets (**#138–#140**) are design rulings, and the
`needs-triage` pile has grown to nine — **#141** through **#149** — which is
itself worth reading as a signal: five of them (#142, #144, #145, #146, #147,
plus now #148) are about the instruments rather than the app.

Restarting quality work needs **#138–#140** answered plus the gauntlet
stop-signal question recorded as owner call 14 in `.claude/gauntlet.md`. Do not
restart the gauntlet before that: it carries `stop: true` at `plateau: 3` and
would halt at its own seed guard, correctly.

## Standing constraints for any leg touching the renderer

Unchanged from leg 5, and all still hold: no em dashes in user-visible strings
(`tests/copy-em-dash.test.ts` compiles `src/`); the stylesheet pins are
literal-text and brittle (D3); any CSS change owes a driver pin that **runs**,
naming which gate runs it (D4) — jsdom loads no CSS, so the fast gate
structurally cannot see layout; the titlebar's centring is load-bearing (#136);
the identity mark is solid by design; colour and translucency are instrument
artifacts in any capture; `DESIGN.md` is read literally by
`tests/subagent-material.test.ts`. Full text in [[pick-up]].

Two additions from this leg:

- **A driver that resizes the window owes a restore in a `finally`** — and that
  is a promise, not a guarantee, since it does not run if the process dies.
  #147's private `--user-data-dir` is the real fix and now has one more reason.
- **`inspect.mjs` publishes its surface list in three places and two are
  stale** (#149). The header in the driver is the accurate one.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken. **SEVEN older ones live in
`.claude/vibe-130.md`** — every reference pointing at `.claude/vibe.md` for those
is stale. Plus **#138–#140** and the gauntlet stop-signal question in
`.claude/gauntlet.md`.

**#144 stands unanswered and is now the sharpest of them.** #137 added a
measurement that only the DOM phase can run, and nothing runs the DOM phase
because the repo has no CI. The executing pins exist; the thing that would make
them bite on every push does not.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-the-noise-floor-is-part-of-the-instrument]]
- [[2026-08-11-the-batch-is-the-instrument-and-a-teardown-is-a-promise]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
