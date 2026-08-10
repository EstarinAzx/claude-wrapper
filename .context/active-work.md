---
type: active-work
project: claude-wrapper
updated: 2026-08-10
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-10 by Opus 5, relay chain 5 leg 1 — the only leg, owner away_
_At commit: `4a80989` on `main`_

## Current focus

**#131 landed and the ticket queue is empty again — but this chain does NOT stop
here.** `ticket-loop` signalled done on a dry frontier, and the relay state file
carries an armed successor: **`then: /relay N=1 /preset gauntlet`**. The quality
pass is what runs next, against the bar the owner confirmed on 2026-08-10.

This is a different shape of stop from chains 3 and 4. Those ended with nothing
queued and nothing chained — the next move had to come from a person. Here the
correct-axis work is finished and the *better*-axis work is armed and waiting.

## State

- **In flight:** nothing. `ticket/131-inspect-command` was squash-merged and
  deleted. Tree clean on `main`.
- **Closed 2026-08-10:** **#131** the consolidated `inspect:` command
  (`4a80989`), **no `src/` diff**.
- **Open: NONE.** Not "none `ready-for-agent`" — none at all, on two reads.
- **Gate on `main`:** typecheck clean, build clean, **1295 tests / 85 files**.
  Ran on the branch and **again on `main` after the merge**. **Unchanged from the
  2026-08-08 baseline, and that is correct** — #131 adds no `src/` code and no
  test; its instrument is a driver, and no driver runs in `npm test`.
  **Read the number off `main`, never off this file.**
- **NOT PUSHED. Five commits sit local** (`05512aa`, `fc96974`, `97a5de4`,
  `3fb7a0f`, `4a80989`). D6 stands: **a leg does not push on its own
  initiative.** The two pushes on record (2026-08-06, 2026-08-08) were explicit
  one-off owner instructions, a pattern of the owner asking rather than a
  standing grant. Read the gap rather than trusting this number — it has drifted
  three legs running before: `git rev-list --count origin/main..main`.

## What #131 delivered

`SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/inspect.mjs` — the
consolidated `inspect:` command, and the thing `/preset gauntlet` refuses to run
without. `driver.mjs` never picked a project folder, so it reached Welcome and
Titlebar and nothing else; nine of eleven surfaces were unreachable by any single
command.

Seven files per run: `welcome` · `titlebar` · `sidebar` · `chat` · `input-bar`,
plus `window-welcome` and `window-session`. The two window frames are **not**
extra surfaces — a surface clipped to its own bounding box cannot answer a
composition question, and every reference in `.gauntlet/bar/linear/` is a
whole-page frame, so a critic comparing composition needs a comparable unit.

**A harvest, exactly as the ticket said.** Nothing here is a new mechanism: the
folder-picker stub in main (gui-129, gui-123), a transcript seeded straight into
the CLI store (gui-63), DOM-dispatched clicks because Playwright's actionability
wait hangs on the intro animation, `setZoomFactor(1)` (gui-124, gui-126).

**Zero CLI turns.** The chat carries two user turns, three assistant replies and
two tool cards because the transcript is a **fixture on disk** the app replays —
so the same five surfaces come out on a machine with no session, no network and
no API key. Determinism also needed the window pinned to 1440x900 with the zoom
factor forced to 1: both are otherwise remembered across launches and would
silently change the scale of every capture.

Red-verified three ways, each with a distinct message, each mutation on a **copy**
of the driver and each verdict **parsed from output rather than taken from the
exit code**: a fixture not bound to the open workspace, a surface selector that
matches nothing, and a surface that renders but is empty.

## The instrument lesson, and it is the transferable half

**A blank capture is proven in the DOM, not in the pixels** — see
[[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]].

The obvious way to catch a blank surface is to floor the screenshot at some
bytes-per-kilopixel. That reasoning is wrong twice, and **both refutations came
from measuring it**:

1. A **fixed floor** scored `.welcome-mark` — a 44x44 solid mint fill, about as
   blank as this app gets — at **403.93 bytes/kpx, the highest reading of the
   run**. PNG's ~700 bytes of fixed overhead *is* the measurement over two
   kilopixels.
2. A **per-run negative control at 2x** then failed **WELCOME**, a legitimately
   sparse hero clearing pure background by only **34%** (14.47 vs 10.77). That
   would have shipped the tenth instance of this repo's oldest failure — an
   instrument artifact reported as a finding — inside a file whose own header
   warns about it.

So the ratio is **1**, nothing more is claimed, and the DOM assertions carry the
guarantee: every surface declares what makes it that surface, asserted in its own
subtree before it is photographed. Generalises as **an instrument's threshold is
a measurement, not a constant.**

## Pick up here

**The successor is armed and should be allowed to fire.**
`.claude/relay/ticket-loop.md` carries `stop: true` with
`then: /relay N=1 /preset gauntlet` — fired by this leg on a clean body-signalled
done, which is the one exit path `then:` is permitted on.

What the gauntlet run needs to know, none of which lives in the tracker:

1. **Read `.gauntlet/bar/README.md` first.** Its `inspect:` field now points at
   the real command and limit 1 is marked CLOSED. **Limit 2 is permanent** — no
   driver can see the DWM acrylic backdrop, so every capture shows a flat ground
   where the running app is translucent. **Colour, translucency and material are
   out of scope for any verdict taken from these files.**
2. **The identity mark is SOLID BY DESIGN.** No glyph, ever. A wave may question
   the fill's *depth*; it may not add content to it.
3. **`.claude/vibe.md` binds the chain.** D3 lists the brittle literal-text
   stylesheet pins a builder must be handed (nine tests read `styles/` as raw
   TEXT; three scan the whole directory). D4: any CSS change owes a driver pin,
   because jsdom loads no CSS and an unknown `var()` resolves silently to
   nothing. D7: the gate is all three commands green. D6: no pushing.
4. **If a file you expected is missing from the capture directory, the run
   failed** — read its output rather than judging the surface.

## Skills for next session

- **Do not push on your own initiative.** See State.
- **Do not apply `ready-for-human`** — the owner banned it for this batch. A
  blocker becomes `needs-info` + a comment + a `PushNotification`.
- **Do not invent a ticket to restart `ticket-loop`.** The stop condition is an
  empty `ready-for-agent` frontier, and a leg filing its own follow-up there
  makes that condition unreachable by construction. #131's leg filed nothing.
- The six non-core surfaces (AgentsDock, AppearanceDock, CommandsDock, AgentMap,
  SubagentDrawer, ToolCard) are still unreachable by `inspect.mjs`, **as
  scoped** — `pieces` is capped at 6 and fixed at seed, so they are a second
  gauntlet run under a separate slug, never a widening inside this one.

## Open questions

**TWO** live owner-calls, both in `.claude/vibe.md` under `## Needs you`, both
reversible with the default already taken:

1. **May a gauntlet wave commit RED on `gauntlet/<slug>`?** Default taken: no —
   a wave must be green on the same three commands before it commits, and a red
   wave reverts its piece and records the gap. Matters because the D3 stylesheet
   pins are brittle and literal, so a wave that genuinely improved a surface can
   still red the suite on a comment brace or a moved `.bubble {`.
2. **Is the identity mark's solidity deliberate identity, or unfinished?**
   Default taken: leave it solid, no glyph. The record leans hard this way and is
   verified three ways; only the *preference* is the owner's.

**SEVEN older owner-calls live in `.claude/vibe-130.md`, not in `.claude/vibe.md`**
— they moved there when that file was archived, and every reference pointing at
`.claude/vibe.md` for them is stale. They are unresolved, not closed. The
longest-standing live one is **#127's Remote Control question**.

## Related

- [[overview]] · [[pick-up]] · [[decisions]] · [[stack]] · [[happy-path]] · [[flows]]
- [[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]]
- [[2026-08-08-a-checkpoint-outlives-its-process-and-rewindability-tracks-position]]
