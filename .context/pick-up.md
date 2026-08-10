---
type: pick-up
project: claude-wrapper
updated: 2026-08-10
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Where the chain is

**#131 landed, the ticket queue is empty, and the quality pass is armed.**

`ticket-loop` signalled done on a dry frontier — empty on two reads, and there is
**no open issue at all**. That is the designed stop, not a failure. The relay
state file `.claude/relay/ticket-loop.md` carries `stop: true` and the successor
it fired: **`/relay N=1 /preset gauntlet`**.

**Do not re-run `ticket-loop`.** Re-invoking it against that file **re-inits** the
chain and spins a leg with nothing to do. And do not invent a ticket to restart
it — the stop condition is an empty `ready-for-agent` frontier, so a leg filing
its own follow-up there makes the condition unreachable by construction.

Confirm rather than trust this, on two reads — the tracker has returned a false
empty here before:

```text
gh issue list --state open --label ready-for-agent
gh issue list --state open
```

## Landed this leg

**#131 — the consolidated `inspect:` command.** `4a80989` on `main`,
squash-merged, branch deleted, ticket closed. **No `src/` diff** — it builds the
instrument that judges the UI; it does not touch the UI.

```
SCREENSHOT_DIR=<dir> node .claude/skills/run-desktop/inspect.mjs
```

Seven files: `welcome` · `titlebar` · `sidebar` · `chat` · `input-bar`, plus
`window-welcome` and `window-session` as whole-window frames, because a surface
clipped to its own bounding box cannot answer a composition question and every
reference in `.gauntlet/bar/linear/` is a whole-page frame.

Zero CLI turns — the chat is a **fixture seeded into the CLI store** and replayed
(gui-63's mechanism), so it carries real message rhythm and two tool cards on a
machine with no session and no API key. Window pinned to 1440x900 with
`setZoomFactor(1)`, since both are otherwise remembered across launches and would
silently change every capture's scale.

New files: `.claude/skills/run-desktop/inspect.mjs`. Updated:
`.gauntlet/bar/README.md` (`inspect:` repointed, limit 1 marked CLOSED),
`.claude/skills/run-desktop/SKILL.md`. New decision:
`.context/decisions/2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels.md`.

## Baseline — READ IT, do not trust it

`main` = `4a80989`. typecheck clean, build clean, **1295 tests / 85 files** —
**unchanged**, and that is correct: #131 adds no `src/` code and no test, and no
driver runs in `npm test`. The gate ran on the branch and **again on `main` after
the merge**.

**Five commits sit UNPUSHED** (`05512aa`, `fc96974`, `97a5de4`, `3fb7a0f`,
`4a80989`). D6 stands — **a leg does not push on its own initiative**; the two
pushes on record were explicit one-off owner instructions. Read the real gap,
this number has drifted three legs running before:
`git rev-list --count origin/main..main`.

## Pick up here — the gauntlet run

1. **Read `.gauntlet/bar/README.md` before touching any surface.** Its `inspect:`
   field now points at the real command. **Limit 1 is CLOSED; limit 2 is
   permanent** — no driver can see the DWM acrylic backdrop, so every capture has
   a flat ground where the running app is translucent. **Colour, translucency and
   material are out of scope for any verdict taken from these files.**
2. **THE IDENTITY MARK IS SOLID BY DESIGN.** No wave may add a glyph. A wave may
   question the fill's *depth*; that is a different question and is fair game.
3. **`.claude/vibe.md` binds this chain** — six decisions stand after cross-model
   attack. Load-bearing for a builder: **D3** (the brittle literal-text
   stylesheet pins), **D4** (any CSS change owes a driver pin — jsdom loads no
   CSS, so an unknown `var()` resolves silently to nothing), **D7** (the gate is
   all three commands green), **D6** (no pushing).
4. **If an expected capture file is missing, the run failed** — read its output
   rather than judging the surface. A green run asserts it wrote all seven; a
   failing one prints `CAPTURED n/7`.

## The landmine this leg paid

**AN INSTRUMENT'S THRESHOLD IS A MEASUREMENT, NOT A CONSTANT.** The obvious guard
against a blank screenshot is a bytes-per-kilopixel floor. It is wrong twice, and
both refutations came from measuring rather than reasoning:

- A **fixed floor** scored `.welcome-mark` — a 44x44 solid mint fill, about as
  blank as this app gets — at **403.93 bytes/kpx, the highest reading of the
  run**. PNG's ~700 bytes of fixed overhead *is* the measurement at that area.
- A **per-run negative control at 2x** then failed **WELCOME**, a legitimately
  sparse hero clearing pure background by only **34%**. Shipping that would have
  been the **tenth** instance of this repo's oldest failure — an instrument
  artifact reported as a finding — in a file whose own header warns about it.

The ratio is now 1, the thin margin is written down as thin, and **the DOM
assertions carry the guarantee**: a chat that replayed nothing has no `.msg-user`
to find, whatever its pixels compress to.

## Landmines this repo keeps paying for

- **UNSCORED IS NOT REFUTED**, now from nine sides — and the blank-capture
  threshold above is the tenth near-miss of the artifact-as-finding family.
- **AN UNAPPLIED MUTATION READS EXACTLY LIKE A CAUGHT ONE.** Take the verdict
  from the **parsed result**, never the exit code. #131's three mutations were
  each read out of the printed FAIL line.
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point. #129, #130 and
  #131 all mutated a **copy** instead.
- **A driver's RED path must fail cleanly**, or it leaks the Electron process.
  Verified across 7 runs of `inspect.mjs`: no leaked process, no leftover store,
  no leftover workspace, on both paths.
- **Screenshots need the zoom factor** — `setZoomFactor(1)`. Chromium persists
  per-origin zoom in `userData` **and** the renderer keeps its own in
  localStorage, so a previous run's zoom survives into this one.
- **A value read behind a transition is not a settled one** (#123) — and neither
  is a photograph of one. Motion here is 150ms transitions, 200ms entries.
- **Playwright's actionability wait hangs on the intro animation** — dispatch
  clicks from the DOM.
- **Stylesheets are read as raw TEXT by NINE tests**, three scanning the whole
  `styles/` directory. No comment may contain a closing brace; `.bubble` and
  `.message-input` stay ungrouped; **`.bubble {` must stay the FIRST literal
  match of that string in `chat.css`**.
- **The `@import` order in `styles.css` IS the cascade** — add rules inside a
  file, never reorder. **The token names are `--fs-micro` and `--danger-text`.**
- **The acrylic exception is ONE PANE** (#125), pinned twice; criterion 5 is
  **positive** — do not soften it to fix a red.
- **`core.autocrlf` is `true`** — anything reading a file from disk must expect
  `\r\n`, and `/^## Heading$/m` matches nothing here.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`);
  `node_modules/electron/dist/electron.exe` is a real exe.
- Harness scripts importing `.ts` from `src/` need
  `node --experimental-strip-types`, which resolves no extensionless relative
  imports. Use `fileURLToPath`, never `URL.pathname` — this repo's path contains
  a space.
- **`issue_dependencies_summary` is EVENTUALLY CONSISTENT** — read twice. The
  frontier query itself has returned a false empty.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- **A loop body is an artefact of an earlier leg, not an instruction from the
  owner.** If `.claude/relay-leg.md` disagrees with the tracker or with this
  file, **they win**.

## Do not decide these

**TWO** live owner-calls in `.claude/vibe.md` under `## Needs you`, both
reversible with the default taken: whether a gauntlet wave may commit RED on
`gauntlet/<slug>` (default: no), and whether the identity mark's solidity is
deliberate (default: leave it solid).

**SEVEN older ones live in `.claude/vibe-130.md`**, not in `.claude/vibe.md` —
they moved when that file was archived, and every reference pointing at
`.claude/vibe.md` for them is stale. Unresolved, not closed. The longest-standing
live one is **#127's Remote Control question**.

**Not calls, but waiting:** the repo reads 1.0.0 while nothing publishes. `git
tag` is empty, there is no electron-builder config, and the post-bump build
emitted byte-identical asset hashes, so the version never enters the bundle.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-10-a-blank-capture-is-proven-in-the-dom-not-in-the-pixels]]
- [[2026-08-08-a-checkpoint-outlives-its-process-and-rewindability-tracks-position]]
