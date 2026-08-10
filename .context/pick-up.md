---
type: pick-up
project: claude-wrapper
updated: 2026-08-11
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Where the chain is

**The gauntlet run is FINISHED and merged. The ticket queue has been REFILLED
from what it found. `ticket-loop` is armed and should run.**

This supersedes the previous baton, which said *"do not re-run ticket-loop"*.
That instruction was correct against an **empty** queue — its whole concern was
spinning a leg with nothing to do. **Six `ready-for-agent` tickets are open now**,
so the condition it guarded against no longer holds. Re-invoking `/relay N=1
/preset ticket-loop` against a state file carrying `stop: true` **re-inits** the
chain, which is the documented boot path and is what we want here.

Confirm rather than trust this, on two reads — the tracker has returned a false
empty here before:

```text
gh issue list --state open --label ready-for-agent
gh issue list --state open
```

## The queue, and where it came from

Nine issues were filed on 2026-08-11 from the `core-surfaces` gauntlet run's
findings. **Six are agent work; three need the owner and `ticket-loop` will not
pick them up.**

| # | Label | What |
|---|---|---|
| 132 | ready-for-agent | Execute the source-level GUI driver assertions in the test gate |
| 133 | ready-for-agent | Extend `inspect.mjs` to reach the three right-hand docks |
| 134 | ready-for-agent | Remove em dashes from user-visible copy |
| 135 | ready-for-agent | Run the DOM-level driver assertions; resolve the red empty-state check — **blocked by #132** |
| 136 | ready-for-agent | Centre the session title in the titlebar — **blocked by #132** |
| 137 | ready-for-agent | Capture the Welcome pane at the minimum window size — **blocked by #133** |
| 138 | ready-for-human | Rule on the type scale: five rendered sizes ship against three documented |
| 139 | ready-for-human | Rule on the transcript's prose/label weight pair |
| 140 | ready-for-human | Rule on the selected session row's mint side-stripe |

**The frontier is #132, #133, #134** — those three have no blockers. Blocking
edges are stated in each issue body, not as native links; **read the "Blocked by"
section before starting a ticket** rather than assuming any open ticket is free.

**#132 is the most valuable and should go first if you are choosing.** Nothing
currently executes the 38 `gui-*.mjs` drivers, so the project's "any CSS change
owes a driver pin" rule has been discharged all run by checks that never run. One
assertion has been red for three waves while three consecutive gates reported
green.

## Landed since the last baton

**The `core-surfaces` gauntlet run, waves 1–5**, merged to `main` as `4c3386d`
(`--no-ff`, branch `gauntlet/core-surfaces` retained). 809 insertions across 9
renderer files: Titlebar, Sidebar, InputBar and four stylesheets. Every wave was
gate-green and D3/D4 pins were checked mechanically twice per wave.

**The run stopped itself at `plateau: 3`** — the preset's expected exit, not a
crash. No verdict improvement survived five waves, and the one provisional
`YOURS WINS` was retracted by a retest on **byte-identical pixels**. Full record
in `.claude/gauntlet.md`; captures in `.gauntlet/waves/1-5/`.

**Do not restart the gauntlet.** `.claude/gauntlet.md` carries `stop: true`, so
`/preset gauntlet` halts at its seed guard — correctly. Restarting means the owner
first answering **#138–#140**, and specifically the open question of whether
verdict movement is the right stop signal at all (recorded as owner call 14 in
that file, with the wave-5 evidence attached).

### Four findings that outlive the run

1. **Critic pixel figures are ink-and-leading; CSS figures are boxes; the two
   differ by ~5–6px.** Any numeric target quoted from a design review needs that
   translation before a builder acts on it. A "12–16px" ask means ~7–11px of box.
2. **A reviewer prescribing something that already ships happened three times.**
   Twice a builder caught it and refused; once a builder nearly "fixed" a value to
   itself. Ask for the *current measured value* alongside any target.
3. **`font-weight: 500` renders byte-identically to `600`** on this machine — the
   family snaps to named instances. A "fix" at 500 changes zero pixels.
4. **Measured refusals are worth more than edits, repeatedly.** Three of the run's
   strongest results were builders declining with numbers.

## Baseline — READ IT, do not trust it

`main` = `4c3386d`. typecheck clean, build clean, **1295 tests / 85 files** —
unchanged from before the merge, and that is correct: the gauntlet added no test
and no driver runs in `npm test`, which is exactly what #132 exists to fix.

Gate ran on the branch and **again on `main` after the merge**.

**Commits sit UNPUSHED.** D6 stands — **a leg does not push on its own
initiative**; the pushes on record were explicit one-off owner instructions. Read
the real gap rather than a number, it has drifted every leg:
`git rev-list --count origin/main..main`.

## Standing constraints for any leg touching the renderer

1. **D3 — the stylesheet pins are literal-text and brittle.** Three tests scan the
   whole `styles/` directory; **no comment anywhere in `styles/` may contain a
   closing brace**; `.bubble` and `.message-input` stay ungrouped; **`.bubble {`
   must stay the FIRST literal occurrence of that string in `chat.css`** (the pin
   is "first occurrence", not a line number — it moved from 84 to 119 legally);
   **exactly ONE `backdrop-filter` in all of `styles/`**; the `@import` order in
   `styles.css` IS the cascade, so add rules inside a file and never reorder.
2. **D4 — any CSS change owes a driver pin**, because jsdom loads no CSS and an
   unknown `var()` resolves silently to nothing. **Know that nothing executes
   those drivers today** — cite the asserting line or say plainly that nothing
   pins it. Do not claim D4 discharged on a driver that merely renders the surface.
3. **The identity mark is SOLID BY DESIGN.** No glyph, ever.
4. **Colour, translucency and material are instrument artifacts in any capture** —
   the authored wash is composited by Windows over OS acrylic and no driver can
   see a DWM backdrop. A flat ground in a screenshot is not a defect.
5. **`.claude/vibe.md` binds this chain** — six decisions stand after cross-model
   attack. Two live owner-calls sit there under `## Needs you`; **seven older ones
   are in `.claude/vibe-130.md`**, and every reference pointing at `.claude/vibe.md`
   for those is stale.
