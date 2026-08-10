---
type: active-work
project: claude-wrapper
updated: 2026-08-11
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-11 01:20 by Opus 5, relay chain 6 leg 2 — owner away_
_At commit: `5e1b6b0` on `main`_

## Current focus

**#133 landed: `inspect.mjs` now photographs the three right-hand docks.** The
instrument captured five surfaces and could not reach Agents, Commands or
Appearance at all — a visible third of the window's chrome that no automated
check and no reviewer ever looked at, while `DESIGN.md` defines the Agents dock
as the sessions rail's *mirror*. Five gauntlet waves photographed the rail every
time and the dock never once.

The chain continues. **Four tickets are unblocked**: closing #133 released #137.

## State

- **In flight:** nothing. `ticket/133-inspect-right-hand-docks` was
  squash-merged and deleted. Tree clean on `main`.
- **Closed 2026-08-11:** **#133** (`5e1b6b0`). **Filed:** **#142** at
  `needs-triage` — `titlebar.png` is not byte-stable, cause identified.
- **Open:** #134, #135, #136, #137 (`ready-for-agent`) · #138, #139, #140
  (`ready-for-human`) · #141, #142 (`needs-triage`). **Frontier: #134, #135,
  #136, #137** — nothing is blocked any more.
- **Gate on `main` after the merge:** typecheck clean, build clean,
  **87 files / 1313 passed + 36 skipped** (was 86 / 1301 + 36). Ran on the branch
  and again on `main`. **Read the number off `main`, never off this file.**
- **NOT PUSHED. Ten commits sit local.** D6 stands: **a leg does not push on its
  own initiative.** Read the real gap rather than this number, it has drifted
  every leg: `git rev-list --count origin/main..main`.

## What #133 delivered, and the shape to copy

Three `stage: 'dock'` surfaces driven through their titlebar toggles, producing
`agents-dock.png`, `commands-dock.png`, `appearance-dock.png`. `EXPECTED_FILES`
is `SURFACES.length + 2`, so it went 7 → 10 with no number edited by hand.

**Three rules, and the third outlives this file:**

1. **Docks are captured LAST**, after the window frames. A dock is an *in-flow*
   aside, so an open one takes width out of `main.chat`.
2. **Docks are selected by `aria-label`, never class.** All three asides wear
   `agents-dock`; a class selector matches whichever is open and files it under
   the wrong name.
3. **An instrument must not force the app into a state the app calls
   impossible** — see below.

## The zoom finding, which is the transferable half

`useZoom` applies its persisted level on mount (`DEFAULT_ZOOM` 1.25). The driver
then called `setZoomFactor(1)` *afterwards*. So the window rendered at 1 (1440
CSS px, visible in every capture) while the app still believed 1.25 — a state
`useZoom` calls impossible in its own words: *"the readout can never disagree
with the window"*.

**Nothing photographed the disagreement for two tickets.** Then #133 added the
Appearance dock, whose stepper prints that number, and the first capture read
**"125%" over a demonstrably 100% window** — a critic cannot tell that from a
real defect. Fixed by seeding `zoom-level-v2` to `1` and reloading before the
folder pick. *Seeded*, not stepped: `nextZoom(level, 'reset')` returns
DEFAULT_ZOOM, not 1.

## Pick up here

**Run the frontier query first — it is the authority, and this file has been
wrong before:**

```text
gh issue list --state open --label ready-for-agent
```

Then read the **"Blocked by"** section in the chosen issue body. Edges are prose,
not native tracker links.

**#137 is the natural next one** — it is the direct continuation (same file, same
capture stage, and #133 was its declared blocker), and #133 just built the
`stage`/`requires`/loud-failure machinery it extends. **But read the #142 warning
below before starting it.** #134 is older and free if you prefer strict age order.

## Skills for next session

- **Do not push on your own initiative.** See State.
- **Do not apply `ready-for-human`** — banned for this batch. A blocker becomes
  `needs-info` + a comment + a `PushNotification`.
- **File follow-ups at `needs-triage`, never `ready-for-agent`.** This chain
  stops on an empty frontier; a leg promoting its own follow-up there makes the
  stop condition unreachable by construction. #132's leg filed #141, #133's
  filed #142, both correctly.

## Open questions

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken. **SEVEN older ones live in
`.claude/vibe-130.md`** — every reference pointing at `.claude/vibe.md` for those
is stale. Plus **#138–#140** (`ready-for-human`) and the gauntlet stop-signal
question recorded as owner call 14 in `.claude/gauntlet.md`.

## Recent context

- **#137's AC2 as written cannot be satisfied, and #142 is why.** It asks that
  every other surface be **byte-identical**, *"proved with a hash comparison, not
  an eyeball"*. `titlebar.png` is not byte-stable: `.session-title` renders
  `basename(cwd)` and the fixture workspace is `mkdtemp`'d, so six random
  characters move the pixels while the box and text length (43) stay fixed.
  Measured across seven runs, and the **unmodified** driver spreads *wider*
  (9084 / 9538 / 9083) than the modified one — this predates #133. The leg taking
  #137 should hash the other six and treat titlebar by box and content, or
  resolve #142 first. Do not silently "fix" a red hash by adjusting the capture.
- **The instrument is fixture-driven end to end, and now says so per surface.**
  Chat replays a seeded transcript (since #131), Agents reads seeded `.meta.json`
  sidecars on its **real** disk path, Commands has its IPC handler **replaced in
  main** because `commands:list` needs a live query. So **a green
  `commands-dock.png` says nothing about whether the CLI serves commands** —
  gui-51 and gui-94 own that against a warm engine.
- **The obvious coverage check was wrong.** Grepping `tests/` for
  `aria-label="Agents"` returns nothing, so the aside labels look unpinned.
  Mutating one reds **six** existing tests: they pin it via
  `getByRole('complementary', { name: 'Commands' })`. An accessible-name query
  pins a label without ever spelling it as an attribute — worth remembering
  before concluding anything from a grep for an attribute.
- Both new failure paths red-verified in one run (renamed toggle + empty command
  list): exit 1, each failure naming its surface, `CAPTURED 8/10 files`, and the
  third dock still captured.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-11-an-instrument-may-not-photograph-a-state-the-app-calls-impossible]]
- [[2026-08-11-a-check-nobody-runs-is-not-a-check]]
