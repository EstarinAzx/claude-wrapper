---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Next: #127 — the last unblocked slice

Confirm rather than trust this line — it has been wrong before:

```text
gh issue list --state open --label ready-for-agent
```

**#127 is the only unblocked slice left.** #128 (the 1.0.0 bump) waits on all
seven and is last by the owner's explicit instruction — **it still wears
`ready-for-agent`, so the frontier query returns it.** The ordering lives in the
ticket body and in `.claude/relay-leg.md`, not in a label. So the leg after #127
does #128 **and closes spec #120** in the same leg.

**#127 is a SPIKE. It measures and builds nothing** — expect no `src/` diff, and
do not let the absence of a diff read as an unfinished leg.

**The owner is away and banned the `ready-for-human` label for this batch.** Do
not apply it. Use `needs-info` + a comment + a `PushNotification`, and let the
chain continue. A call you cannot make goes in `.claude/vibe.md` under
`## Needs you`, not onto a label.

## Landed last leg

**#126 — the subagent map reads as objects, not a wire sketch.** `0628745` on
`main`, squash-merged, branch deleted, ticket closed.

Geometry (still one pure function, no dependency): `R_MAX` 9 to 14, `BAND_H` 46
to 62, `PAD_Y` 22 to 30, edge endpoints inset to each node's rim plus a gap, and
`sessionRadius` returned so the root is the largest mark. Paint: settled marks
(`done`, and the session) are **solid** and lighter than the panel, **hollow is
now reserved for `unknown`**, the edge takes `--text-faint` at 1.4 viewBox units,
and the SVG caps its rendered width at 280px and centres.

New files: `tests/agent-map-visual.test.ts` (9), `.claude/skills/run-desktop/gui-126.mjs`,
three screenshots under `docs/design/`. Also touched: `AgentMap.tsx`,
`agent-map.css`, `agent-layout.ts`, `tests/agent-layout.test.ts`.

**Every acceptance criterion on #126 was already green before a line changed** —
the driver was written first and run against unmodified `main`. The ticket was
looks and nothing else, and the risk was breaking a pinned criterion while
chasing them, not failing to meet one. Worth copying: writing the gate first
told the leg what it was actually allowed to touch.

## Baseline — READ IT, do not trust it

`main` = `0628745`. typecheck clean, build clean, **1246 tests / 82 files**
(was `1234 / 81` before #126). #127 is a spike and may add none, so this number
may be unchanged next leg — that is expected, not a missed step.

**`origin/main` is 8 commits behind `main`.** This chain has landed every leg
locally and pushed none; legs 1-6 all did. Nothing is lost, but the tracker's
commit references do not resolve on GitHub — which is also why #126's screenshots
are cited as in-repo paths rather than attached to the ticket. Left as-is
deliberately: pushing is outward-facing and the owner has not asked for it.
**Worth raising when they are back.**

## What #126 measured that the next legs need

- **SVG `stroke-width` IS IN VIEWBOX UNITS.** `agent-map.css` had
  `stroke-width: 1` on the edges; the viewBox is 240 wide scaled into ~151px at
  the dock's clamp floor, so it rendered at roughly **0.6 of a device pixel**.
  Any SVG length authored with a CSS-pixel intuition is wrong by the viewBox
  scale. Applies to every `gui-*` driver that reads an SVG dimension too.
- **THE TINT LADDER CANNOT CARRY A STRUCTURAL LINE.** It tops out at 20% alpha
  of a near-white over a near-black ground; no stroke width fixes that. The map
  edge left the ladder for `--text-faint`. Conversely, **a "lighter" neutral read
  off the token file is not necessarily lighter on screen**: `--bubble` is OKLCH
  0.27 against `--surface` 0.19 and still composites to roughly the panel's own
  value once the wash beneath it is counted. Both candidates were rejected **on
  the real window**, not on paper.
- **THE DOCK'S DISK HALF IS GATED ON A SESSION ID.** `activeSessionId` stays null
  until a turn ends or a session is adopted, so patching the `subagents:list`
  handler does nothing until a driver clicks a `.session-row-btn`. Without it the
  map renders live-only rows, which carry **no `parentAgentId`** (so no nesting)
  and fall back to the literal `agentType` `'Agent'`. Cost one confused run.
- **Status and parentage come from DIFFERENT SOURCES.** `parentAgentId` is
  disk-only; `status` is live-only. A full Agents-dock fixture needs both
  channels — `subagents:list` re-registered on `ipcMain`, and `subagent:changed`
  pushed from main. Neither alone draws the map.
- **Reopening a dock resets its mode to `list`.** A driver that waits on
  `.agent-map-svg` before re-clicking Map view hangs.
- **A DISCRIMINATION CONTROL EARNS ITS KEEP UNDER MUTATION, WHICH IS THE ONLY
  TIME YOU FIND OUT.** `gui-126`'s halo criterion returned **UNSCORED** under a
  red run — the mutation made the halo's fill identical to the glyph's, and the
  control refused to score rather than reporting a false pass. Same family as
  #125's 5b.
- **A GATE-RUN TWIN IS THE ANSWER TO "PROTECTED BY A CHECK NOBODY RUNS."** No
  `gui-*.mjs` runs in `npm test`, so `tests/agent-map-visual.test.ts` exists for
  the same reason `subagent-material.test.ts` does. Its named risk is specific
  and worth repeating: **a tidy-up that pulls the paint back onto the tint ladder
  would look like a conformance improvement in review** and would silently undo
  the pass.

## Landmines this batch will hit

- **#127 lives or dies on probing by CALLING.** Never by grepping a bundle or
  reading a `.d.ts`: a declared wire type is not a callable route (#115), and a
  callable route is not an effective one (#117). **A negative claim needs
  negative-shaped evidence** — "channel X is outbound" does not prove no inbound
  route exists, and that error is why #127 exists at all. **An absence must be
  counted, not assumed**, and **every control-protocol probe needs a bogus-subtype
  negative control.**
- **`/rewind` and `/bg` are NOT CLI commands here.** Measured: 121 advertised
  commands, neither present. `/bg` is one of three ways to OPEN the CLI's agent
  view — a terminal takeover. Do not build a UI wrapper for either.
- **UNSCORED IS NOT REFUTED**, hit from four sides now: #122's clipboard spike
  (a swallowed gesture error), #124's three instrument traps, #125's own
  verification harness (a reporter flag that does not exist), and #126's halo
  control. Score "did the trial run" separately from "did the thing work".
- **A VERIFICATION HARNESS IS A THING THAT CAN FAIL.** Take the verdict from the
  **parsed result**, never the exit code — an exit code conflates *the code
  failed* with *the harness failed*, the two outcomes a mutation run exists to
  separate. An unparseable result is **UNSCORED, not RED**. Give any runner a
  `control` mode that runs the suite unmutated and demands green, before **and**
  after. **Refuse a mutation that changes no bytes** — a GREEN verdict is
  otherwise ambiguous between a gap in the test and a mutation that did nothing.
- **The acrylic exception is #125's and it is ONE PANE.** `.model-menu`,
  `.command-popover`, `.file-popover` and the Appearance dock stay flat.
  Generalising it is an **open owner call**; `gui-98`'s criterion 5c and
  `tests/subagent-material.test.ts` both red if you take it. **#126 did not touch
  it** — the map takes no glass.
- **`gui-98` criterion 5 is POSITIVE.** It asserts the material is present.
  Removing the material reds it, which is correct. Do not soften it back.
- **Screenshots need the zoom factor.** `capturePage` takes window DIP while
  `getBoundingClientRect()` gives the ZOOMED page's CSS pixels, and
  `el.screenshot()` inherits the defect. **Normalise with
  `webContents.setZoomFactor(1)` before any pixel measurement** — `gui-126` does
  this first and it is why its element shots are usable.
- **`getComputedStyle(el, '::pseudo')` does not read that pseudo-element** in
  Chromium; it returns the element's own style. **A pixel probe needs a positive
  control.**
- **A computed-style read beats a source grep** and works where pixels do not: a
  grep is green on a rule the cascade drops, and `getComputedStyle` resolves
  without rasterising, so `--disable-gpu` cannot reach it.
- **A value read behind a transition is not a settled one** (#123).
- **A driver never seen failing proves nothing — and its red path must fail
  CLEANLY.** `gui-122`'s first red run threw an uncaught `TimeoutError`, skipped
  its summary and leaked the Electron process. `gui-126` wraps its body in
  try/finally for exactly that.
- **A GUI driver can cost ZERO CLI turns** — adopt a session, patch handlers,
  push events.

## Stylesheet rules that bind more than one slice

- **Stylesheets are read as raw TEXT by EIGHT tests now** — `scrollbar.test.ts`,
  `theme.test.ts`, `multiline-composer.test.tsx`, `markdown-tables.test.tsx`,
  `code-copy.test.tsx`, `reuse-message.test.tsx`, `subagent-material.test.ts` and
  **`agent-map-visual.test.ts` (new)**. **Three** scan the whole `styles/`
  directory. No comment may contain a closing brace; no scrollbar rule may be
  component-scoped; **`base.css` warns that even NAMING the scrollbar
  pseudo-element in a comment trips the scan**; `.bubble` and `.message-input`
  stay ungrouped, and **`.bubble {` must stay the FIRST literal match of that
  string in `chat.css`**.
- **`agent-map-visual.test.ts` pins things a tidy-up would undo**: the edge is
  `--text-faint` and **not** a tint step, its width is at least 1.4 units,
  `done` and the session take a solid `--text-faint` fill, `unknown` stays
  hollow **and dashed**, the SVG keeps `max-width` + `margin-inline: auto`, and
  the halo tints through `color-mix` and never through `opacity`. Its rule
  matcher is anchored on `(^|})` and assumes **bodies in that sheet do not
  nest** — adding a nested at-rule there needs the matcher revisited.
- **`markdown.css` may only author DESCENDANT rules.** **The `@import` order in
  `styles.css` IS the cascade** — add rules inside a file, never reorder.
- **Focus rings are picked per control, not applied.**
- **jsdom loads no CSS.** A raw-text pin proves a rule was written, never that it
  works. Six routes exist now: #121's (render measured markup in a real Electron
  window), #122's (drive the app, read `getComputedStyle` off the focused
  control), #123's (read the same value twice around a transition), #124's
  (sample the element's own pixels at zoom 1 behind a positive control), #125's
  (read the computed value off the mounted element behind a discrimination
  control) and **#126's (feed the real component a synthetic fixture through the
  app's own IPC channels, then read computed style AND census the DOM)**.

## Process landmines from this batch

- **A loop body is an artefact of an earlier leg, not an instruction from the
  owner.** If `.claude/relay-leg.md` disagrees with the tracker or with this
  file, **they win**, and fix that file in your wrap-up.
- **Measure before you ask an agent.**
- **Never `git checkout <file>` to undo a mutation on uncommitted work** — it
  reverts to HEAD and drops every edit since the branch point. Back up outside
  the repo and restore from the backup; #126's mutation runner did, and the
  restored build hashed identically to the pre-mutation one, which is the check
  that proves the restore was clean.
- **Squash-merged ticket branches need `git branch -D`.**

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`.
- **`setBackgroundMaterial` has NO runtime whitelist** — `src/shared/backdrop.ts`'s
  compare-never-coerce guard is the only one. `src/shared/effort.ts` is the same
  pattern, except it REJECTS rather than defaulting.
- **ESM freezes every JS seam a driver might patch** — `sdk.query` cannot be
  monkey-patched and `child_process.spawn` cannot either. The route that works is
  the OS: read the child's command line via `Win32_Process`. **Any probe that
  installs something must read the installation back** — `gui-126` reads its own
  `ipcMain` patch back for this reason.
- **`ConvertTo-Json` over `Win32_Process` is not safe** — read tab-delimited
  lines with `[\x00-\x1F]` stripped.
- **`effort` and `model` both ride `Options`, so both bind at query
  CONSTRUCTION.** A setter that only stores changes nothing.
- **A renderer-side message edit cannot persist** — the pane is a projection of
  the CLI's file (#123).
- **An event handler in main must not be able to throw** — Electron turns it into
  a modal error dialog over the app.
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need `node --experimental-strip-types`
  on this Node (22.17). Use `fileURLToPath`, never `URL.pathname` — this repo's
  path contains a space.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`). Electron's own
  `electron.exe` under `node_modules/electron/dist/` is a real exe and spawns fine.
- **`core.autocrlf` is `true` here: every blob in the repo is LF and the working
  tree is CRLF.** So new files need no hand-conversion — git normalises on
  commit. What bites is the other direction: **anything that READS A FILE FROM
  DISK must expect `\r\n`.** `/^## Heading$/m` matches nothing in this repo.
  Test fixtures, raw-text stylesheet scans and any `readFileSync` regex are the
  affected class. (No `.gitattributes`, so this depends on local git config —
  verify with `git config core.autocrlf` rather than assuming.)
- Never hardcode a model name, and never hardcode an effort level list. Never
  read `~/.claude/daemon/roster.json`.

## Do not decide these

The five standing calls are unchanged. **#126 added none and resolved none by
decision.** It shipped entirely inside the map ADR's own Reversibility clause
("a different layout is a rewrite of that function and its tests"), and the one
piece of ADR *prose* it refined — `done` was described as "muted-hollow", it is
now a solid disc — leaves the ADR's stated **rule** untouched: shape carries
kind, colour reinforces, and the greyscale spread of the four statuses is wider
after the change, not narrower.

Four open owner-calls live in `.claude/vibe.md` under `## Needs you`. The count
stands at four.

**What #126 decided that the owner may want to revisit:** the `280px` render cap
on the map SVG is a **judgement, not a measurement** — it stops a 480px dock
inflating a seven-node tree into fifty-pixel blobs, but nobody has said what the
right size is at that width. It is a one-line edit. Likewise the map still
occupies only its natural block at the top of a tall panel; **filling the pane
was considered and deliberately not done**, because a tree hangs from its root
and centring a two-band map in 623px reads as untethered rather than composed.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-05-the-map-is-objects-and-only-absence-is-hollow]]
- [[2026-07-25-map-geometry-is-a-pure-slot-layout]]
