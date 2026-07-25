---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Queue empty.** The `/relay` chain that drained specs #25 and #26 finished at
leg 9. Last leg landed **#35** (attachments survive replay) as **`ae81ab6`** on
main, gate green (typecheck · 396/396 · build), tree clean, branch deleted, and
closed spec **#26**. Both specs are delivered and closed; tickets #27–#35 are
all closed.

**Nothing is labelled `ready-for-agent`.** The only open issue is **#1**, the
unlabelled MVP umbrella, which was never part of the agent queue. A frontier
query today returns nothing — that is the correct, finished state, not a stall.

## Next task — there isn't one yet

New work needs a spec before an agent loop has anything to drain:

```
idea → grill-me → /hp MVD → to-spec → to-tickets → /relay
```

The deferred list in [[active-work]] is the candidate pool. The nearest things
to shovel-ready, all previously scoped out on purpose:

- **Lazy full-image fetch on replay** — the #35 marker contract already allows
  it with no change; replayed chips would become real thumbnails on demand.
- **Drag-and-drop attachments** and a **multiline composer** — both out-of-scope
  leftovers from #26, and the attachment fold they'd plug into is one route.
- **Busy-switch: block → detach-with-notice**
  ([[2026-07-23-busy-switch-block-not-detach]]).
- **Agent control (kill/retry)** and **map pan/zoom** — leftovers from #25.

## Landmines (still live)

- **jsdom never loads an image, never applies CSP, and does no hit testing.**
  Anything that depends on the browser actually rendering needs a GUI pass; the
  suite reports green regardless. **A `data:` URL is already granted** —
  `img-src 'self' data:` — but any NEW source (`blob:`, `file:`) needs its own
  grant and fails silently without one. Neither #34 nor #35 needed one.
- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`.
- **The transcript parser's array-of-only-text drop is deliberate.** 1375 such
  user messages exist and are CLI noise (skill injections, `[Request interrupted
  by user]`). It looks like the data-loss bug #35 fixed and is not — pinned by
  `array of only text blocks still parses to nothing` and mutation-verified.
  Details in [[2026-07-25-replay-shows-markers-not-bytes]].
- **Replay must never carry the payload.** One real session holds 2.17 MB of
  base64 across six messages; the marker contract is what keeps the reopened
  DOM at 114 KB. Six tests pin the absence.
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
  with `within(dock())` or it double-counts. The composer tray also renders
  `.attachment-chip`, so scope replay-chip assertions to `.msg-user`.
- **Never let the plain-string pin be "fixed" by updating its expectation.**
  `a text-only send keeps plain-string content` in `tests/engine.test.ts` is
  mutation-verified; if it reds, the bug is in `src/main/engine.ts`.
- **Absent must stay absent** in engine (`assignDefined`), merge and render, and
  now in the transcript marker too. Mutation-verified.
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
  is cumulative context, labelled `ctx`); a sidecar's `model` is the family word
  asked for, not what served the turn.
- Native store `~/.claude/projects/<enc-cwd>/…` (`encodeCwd`); resume ceiling
  (query built once, retarget = close + rebuild); `sessionId()` accessor (no
  `session-id` event); Tailwind `@theme` tokens (preflight off, accent
  `--color-mint`); engine legible-error copy is char-pinned by `engine.test.ts`.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react ^5`,
  `typescript 7.0.2`.

## Test helpers worth reusing

- `tests/transcript.test.ts` — direct parser tests, no DOM. Now also the home of
  the marker cases and the array-of-only-text pin.
- `tests/resume.test.tsx` — the replay seam: `harness.api.loadTranscript
  .mockResolvedValue([...])`, click the session row, assert what renders. Scope
  chip assertions to `.msg-user`.
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
playwright-core`; both are present in `node_modules` today).

**Driving the built app** (refined again this leg, reusable — write the driver in
a temp dir outside the repo):

- **Importing `playwright-core` from outside the tree:** it is CJS with an
  exports map, so `import(pathToFileURL(…/index.js))` yields a module with **no
  `_electron`**. Use `createRequire(pathToFileURL(REPO + '/package.json'))` then
  `require('playwright-core')`. (A driver *inside* the tree can just
  `import { _electron } from 'playwright-core'`.)
- **Write the driver with forward slashes.** A heredoc'd `D:\\.claude\\…` string
  loses its backslashes and Node dies on `Octal escape sequences are not allowed
  in strict mode`. Forward slashes work everywhere except the path handed to the
  stubbed dialog, which must be the real Windows form because `encodeCwd` runs
  on it.
- Launch `node_modules/electron/dist/electron.exe` with `args: ['--no-sandbox',
  '--disable-gpu', '.']`, `cwd` = repo, `env: process.env`.
- Stub a dialog in MAIN: `app.evaluate(({dialog}, x) => {
  dialog.showOpenDialog = async () => ({canceled: false, filePaths: x}) })`.
  For the folder pick click **`.pick-folder-btn`** (not
  `text=Pick a project folder` — that clicked without firing the handler). The
  **same stub drives `.attach-btn`**, and because only the dialog is faked, the
  real `attachments:pick` handler runs.
- A real clipboard image is `clipboard.writeImage(nativeImage.createFromPath(…))`
  from main, then `page.keyboard.press('Control+V')` on the focused input.
- **Real attachment data is in this repo's own history.** Point the picker at the
  repo root; session **`49c1495a`** is **row 49 of 62** and has six attachment
  messages, one carrying two images. Rows are newest-first and 19 sessions share
  its title, so **click by index, not by text**. For agents, the densest session
  at leg 7 was row 52 with 7 agents.
- **Measure in the DOM** (`getBoundingClientRect`, `getComputedStyle` via
  `page.evaluate`), never off the screenshot: `--disable-gpu` flattens the
  acrylic, and **both `page.screenshot({clip})` and `locator.screenshot()`
  mis-frame** a window wider than the viewport. **An image that renders is
  `naturalWidth > 0`** — a CSP block leaves a perfect DOM and a 0×0 image.
- **For a usable eyeball shot, shrink the window first** —
  `BrowserWindow.getAllWindows()[0].unmaximize(); setSize(1100, 780)` in main,
  then `scrollIntoViewIfNeeded()` on the target before `page.screenshot()`.

**Instrumenting a real turn without the GUI** (what #27 used, reusable): call the
SDK's `query()` directly from a script *outside* the repo, importing
`node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs` by absolute file URL, with
`engine.ts`'s exact options and an async-generator prompt. Dump every message to
JSONL. Cheaper than driving Electron and the tree stays clean by construction.
