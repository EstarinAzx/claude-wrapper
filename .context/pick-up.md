---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg (relay leg 8, `.claude/relay-leg.md`, N=1):** landed **#34**, the
paperclip file picker and by-path attachments. main is at **`b374f23`** plus
this leg's `.context/` commit. Gate green (typecheck · 384/384 · build), tree
clean, ticket closed, branch deleted. A GUI pass on the built app drove the real
`attachments:pick` handler with the main-side dialog stubbed.

**#35 is the last ticket in the queue.** Landing it closes spec **#26**, which
is the only open spec, and empties the chain.

## Next task — #35, then the queue is empty

```
#27 ✅──┐
        ├──> #30 ✅
#28 ✅──┴──> #31 ✅──> #33 ✅        spec #25 CLOSED
#29 ✅──> #32 ✅──┬──> #34 ✅
                  └──> #35 replay chips  ← last one
```

Frontier query (oldest open `ready-for-agent` with
`issue_dependencies_summary.blocked_by == 0`, **ignoring the spec parent #26**,
which is labelled the same and is older) picks **#35 — Attachments survive
replay**. Full table in [[active-work]]. **After #35 the queue is empty: close
#26 and stop the chain.**

## What #35 must not re-derive

- **The parser is `parseTranscript` in `src/main/transcript.ts`**, pure and
  main-side; the renderer summarises. Today it keeps text blocks and **silently
  drops everything else** — that is the bug.
- **The payload is deliberately NOT forwarded.** One persisted screenshot
  measured 263 KB of base64; replayed messages show chips, live ones show real
  thumbnails from data the renderer already holds. This is settled in
  [[2026-07-25-attachments-embed-images-paths-for-files]] — do not "improve" it
  into passing data through, and do not add a `blob:`/`file:` thumbnail route.
- **#35 needs no new `window.api` channel**, so the four-mock-sites landmine
  should not fire. If you find yourself adding one, re-read the ticket.
- **The send side is already pinned**, including mixing: `tests/engine.test.ts >
  a mixed message keeps images as blocks and paths in the one text block`.
- **Chips already exist** in the composer tray (`.attachment-chip`,
  `.chip-name`, `.chip-thumb`) and thumbnails in the transcript
  (`.bubble-thumb`). Replay chips should reuse that vocabulary, not invent one.

## Landmines (still live)

- **jsdom never loads an image, never applies CSP, and does no hit testing.**
  Anything that depends on the browser actually rendering needs a GUI pass; the
  suite reports green regardless. **A `data:` URL is already granted** —
  `img-src 'self' data:` — but any NEW source (`blob:`, `file:`) needs its own
  grant and fails silently without one. #34 needed none.
- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`.
- **A cancel-shaped no-op must return before the fold, not fold an empty batch**
  — folding `[]` keeps the chips and silently wipes the rejection message.
  Mutation-verified in `tests/attachments-composer.test.tsx`.
- **`role="img"` on an interactive SVG hides its children from assistive tech**
  and testing-library will not catch it. Use `role="group"`.
- **A static `opacity` loses to any animation that keyframes `opacity`** — put
  the alpha in the colour instead.
- **A live nested agent reads as top-level** until its sidecar lands (accepted
  lag, by decision) — list and map both inherit this, it is not a bug to chase.
- **`parentAgentId` is on 0 of 28 real sidecars**, so a live GUI run renders flat
  and cannot exercise nesting anywhere.
- **The sessions rail renders `<li>` too** — scope any dock list-item assertion
  with `within(dock())` or it double-counts.
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

- `tests/transcript.test.ts` — **#35's home**. Direct parser tests, no DOM.
- `tests/attachments-composer.test.tsx` — how to fake a paste: build the event
  with `createEvent.paste`, then `Object.defineProperty(event, 'clipboardData',
  …)` because jsdom supplies none. Also the CSP pin, and `pick(candidates)` —
  set `harness.api.pickFiles.mockResolvedValue`, click, then
  `await act(async () => {})` to flush the fold before asserting.
- `tests/engine.test.ts` — `capturingStub()` / `sendOne(payload)` for send-shape
  assertions; `taskStarted()` / `taskProgress()` / `taskNotification()` for live
  task-message work.
- `tests/agent-layout.test.ts` — pure-data tree **and geometry** tests: assert
  layout as data (bounds, separation, determinism), never by scraping rendered
  SVG.
- `tests/agents-dock.test.tsx` — `liveEvent(over)` builds a widened `subagent`
  event; `harness.emit()` pushes it through the real hook; `showAgents(agents)`
  + `listRows()` helpers.
- `tests/live-agents.test.tsx` — `renderHook` pattern for testing `useChat`
  state directly, without rendering `App`.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` — reads the titlebar pills
+ screenshots the built app (needs `npm run build` + `npm i --no-save
playwright-core`). **#35 is a fair candidate**: replay chips on a real session
are exactly what jsdom's blind image handling hides, and this repo's own history
has sessions with attachments.

**Driving the built app** (refined again this leg, reusable — write the driver in
a temp dir outside the repo):

- **Importing `playwright-core` from outside the tree:** it is CJS with an
  exports map, so `import(pathToFileURL(…/index.js))` yields a module with **no
  `_electron`**. Use
  `createRequire(pathToFileURL(REPO + '/package.json'))` then
  `require('playwright-core')`. (A driver *inside* the tree can just
  `import { _electron } from 'playwright-core'`.)
- Launch `node_modules/electron/dist/electron.exe` with `args: ['--no-sandbox',
  '--disable-gpu', '.']`, `cwd` = repo, `env: process.env`.
- Stub a dialog in MAIN: `app.evaluate(({dialog}, x) => {
  dialog.showOpenDialog = async () => ({canceled: false, filePaths: x}) })`.
  For the folder pick click **`.pick-folder-btn`** (not
  `text=Pick a project folder` — that clicked without firing the handler). The
  **same stub drives `.attach-btn`**, and because only the dialog is faked, the
  real `attachments:pick` handler runs — that is how #34's main-side code got
  covered with no Electron test harness. Capture the options the stub received
  to assert what the app asked the dialog for.
- A real clipboard image is `clipboard.writeImage(nativeImage.createFromPath(…))`
  from main, then `page.keyboard.press('Control+V')` on the focused input.
- **Real agent data is in this repo's own history.** Pointing the picker at the
  repo root and walking `.session-row` finds sessions with real sidecars; the
  densest at leg 7 was **row 52 with 7 agents** (of 60). Rows are newest-first,
  so the dense ones are old and far down.
- **Measure in the DOM** (`getBoundingClientRect`, `getComputedStyle` via
  `page.evaluate`), never off the screenshot: `--disable-gpu` flattens the
  acrylic, and **both `page.screenshot({clip})` and `locator.screenshot()`
  mis-frame** a window wider than the viewport. **An image that renders is
  `naturalWidth > 0`** — a CSP block leaves a perfect DOM and a 0×0 image, so
  assert the decode, not the `src`.

**Instrumenting a real turn without the GUI** (what #27 used, reusable): call the
SDK's `query()` directly from a script *outside* the repo, importing
`node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs` by absolute file URL, with
`engine.ts`'s exact options and an async-generator prompt. Dump every message to
JSONL. Cheaper than driving Electron and the tree stays clean by construction.
