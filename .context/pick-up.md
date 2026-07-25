---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg (relay leg 6, `.claude/relay-leg.md`, N=1):** landed **#32**, paste an
image and send it. main is at **`3b7a77c`** plus this leg's `.context/` commit.
Gate green (typecheck · 345/345 · build), tree clean, ticket closed, branch
deleted. A live GUI pass caught two defects the suite reported as green — see
[[2026-07-25-attachment-policy-and-the-csp-that-blocked-it]].

Closing #32 unblocked **#34** and **#35**. Every open ticket is now unblocked.

## Next task — #33, then #34, then #35

```
#27 ✅──┐
        ├──> #30 ✅
#28 ✅──┴──> #31 ✅──> #33 map          ← next is #33
#29 ✅──> #32 ✅──┬──> #34 paperclip
                  └──> #35 replay chips
```

Frontier query (oldest open `ready-for-agent` with
`issue_dependencies_summary.blocked_by == 0`, **ignoring the two spec parents
#25/#26**, which are labelled the same and are older) picks **#33 — Map mode for
the Agents panel**. Full table in [[active-work]].

## What #33 must not re-derive

Full detail in [[2026-07-25-agent-tree-edge-is-the-sidecar]] (its `## For #33`
block is written for this ticket):

- **Call `buildAgentTree` from `src/shared/agent-layout.ts`.** That module exists
  to be the one traversal; #33 adds the **geometry half** beside the tree half.
  Do not derive parentage again.
- **`spawnDepth` is not tree depth.** `AgentNode.depth` is computed by the walk.
- **`flattenAgentTree` is pre-order**, so a walk matching list order is free.
- **Orphans, self-parents and cycle members degrade to roots** — preserve that in
  the map; a missing node is worse than a mis-placed one.
- **Test geometry as data** in `tests/agent-layout.test.ts` (pure, fast), not by
  scraping coordinates out of rendered SVG.
- **No new dependency** — hand-rolled SVG, no graph lib, no force simulation, no
  animation loop. Deterministic slots by depth.
- **Visual treatment goes through impeccable** (the ticket says so explicitly);
  the Frost Mono reference is `docs/design/frost-mono-reference.png`, and the
  design engine reads `PRODUCT.md` + `DESIGN.md` from the repo root.
- Selection is **shared** between list and map, not duplicated; live rows from
  #30 must show in map mode too.

## Landmines (still live)

- **A live nested agent reads as top-level** until its sidecar lands (accepted
  lag, by decision) — the map inherits this, it is not a bug to chase.
- **`parentAgentId` is on 0 of 28 real sidecars**, so a live GUI run renders flat
  and cannot exercise nesting. #33's nesting path is fabricated-fixture
  territory; a GUI pass can still check the flat map and the narrow-width case.
- **The sessions rail renders `<li>` too** — scope any dock list-item assertion
  with `within(dock())` or it double-counts.
- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **#34 trips this; #33 should not need a channel.**
- **jsdom never loads an image, and never applies CSP.** Anything visual that
  depends on the browser actually rendering (image decode, CSP grants, layout at
  a real width) needs the GUI pass below — the suite will report green regardless.
  New image sources (`blob:`, `file:`) need their own `img-src` grant.
- **Never let the plain-string pin be "fixed" by updating its expectation.**
  `a text-only send keeps plain-string content` in `tests/engine.test.ts` is
  mutation-verified; if it reds, the bug is in `src/main/engine.ts`.
- **Absent must stay absent** in engine (`assignDefined`), merge and render.
  Mutation-verified both ways.
- **`taskToParent` is the `local_bash` filter, not just a lookup.** Register ids
  only from a `local_agent` `task_started`; drop any message whose `task_id` is
  unregistered.
- **`listSubagents` returns `SubagentInfo[] | null`** — `[]` none spawned
  (ENOENT), `null` could not read. The dock shows live rows even on the `null`
  branch; preserve that.
- **Don't re-simplify `SubagentDrawer`'s `sessionId` prop away.** A session opened
  from the rail has no engine until the next turn, so the engine answers `null`.
- **Wisp `options.model` = alias/family NAME, never a resolved model id** (hangs
  otherwise) — [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots every row, and
  a held `haiku` snapshot blocks the next `/slot` rebind. Always name the family;
  recover with `wisp snapshot revert <family>`. `wisp snapshot list` is **not** a
  subcommand; the retired `~/.claude/slot/lease-*.json` files are gone.
- **Native backend is dead on this host** — with the wisp vars stripped the CLI
  answers `Not logged in · Please run /login`. Anything needing a real turn must
  run wisped.
- **Don't re-derive** (details in [[active-work]]): the #27 spike facts
  (`task_notification` is the completion signal · `task_updated` is
  terminal-only · one correlation key plus a separate `task_id` · `total_tokens`
  is cumulative context, labelled `ctx` · the tool is named `Agent`); a sidecar's
  `model` is the family word asked for, not what served the turn.
- Native store `~/.claude/projects/<enc-cwd>/…` (`encodeCwd`); resume ceiling
  (query built once, retarget = close + rebuild); `sessionId()` accessor (no
  `session-id` event); Tailwind `@theme` tokens (preflight off, accent
  `--color-mint`); engine legible-error copy is char-pinned by `engine.test.ts`.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react ^5`,
  `typescript 7.0.2`.

## Test helpers worth reusing

- `tests/agent-layout.test.ts` — pure-data tree tests; **#33 extends these** for
  geometry rather than testing the map through the DOM.
- `tests/agents-dock.test.tsx` — `liveEvent(over)` builds a widened `subagent`
  event; `harness.emit()` pushes it through the real hook; the `nesting` block
  has `showAgents(agents)` + `listRows()` helpers.
- `tests/live-agents.test.tsx` — `renderHook` pattern for testing `useChat`
  state directly, without rendering `App`.
- `tests/attachments-composer.test.tsx` (new) — how to fake a paste: build the
  event with `createEvent.paste`, then `Object.defineProperty(event,
  'clipboardData', …)` because jsdom supplies none. Also the CSP pin.
- `tests/engine.test.ts` — `capturingStub()` / `sendOne(payload)` for send-shape
  assertions; `taskStarted()` / `taskProgress()` / `taskNotification()` for live
  task-message work.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` — reads the titlebar pills
+ screenshots the built app (needs `npm run build` + `npm i --no-save
playwright-core`). **#33 is a good candidate** (the map is geometry at a real
width, and jsdom can't lay out SVG).

**Driving the built app** (refined this leg, reusable — write the driver in a
temp dir outside the repo and import `playwright-core` by absolute file URL off
`node_modules`, so the tree stays clean):

- Launch `node_modules/electron/dist/electron.exe` with `args: ['--no-sandbox',
  '--disable-gpu', '.']`, `cwd` = repo, `env: process.env`.
- Stub the picker in MAIN: `app.evaluate(({dialog}, dir) => {
  dialog.showOpenDialog = async () => ({canceled: false, filePaths: [dir]}) })`,
  then click **`.pick-folder-btn`**. Do **not** use `text=Pick a project folder`
  — that selector clicked without triggering the handler and cost a debug cycle.
- A real clipboard image is `clipboard.writeImage(nativeImage.createFromPath(…))`
  from main, then `page.keyboard.press('Control+V')` on the focused input. That
  is a genuine paste, not a synthetic event.
- **Measure geometry in the DOM** (`getBoundingClientRect` via `page.evaluate`),
  never off the screenshot: `--disable-gpu` flattens the acrylic, and
  `page.screenshot()` clips a window wider than the viewport, which reads as
  overflow that isn't there.

**Instrumenting a real turn without the GUI** (what #27 used, reusable): call the
SDK's `query()` directly from a script *outside* the repo, importing
`node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs` by absolute file URL, with
`engine.ts`'s exact options and an async-generator prompt. Dump every message to
JSONL. Cheaper than driving Electron and the tree stays clean by construction.
