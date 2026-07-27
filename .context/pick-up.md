---
type: pick-up
project: claude-wrapper
updated: 2026-07-27
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**#37 (`ab7835f`) and #38 (`c077904`) are delivered** and closed with
breadcrumbs. Spec #36 has two tickets left: **#39 (frontier), then #40
(blocked by #39)**. A `/relay 10m N=8 /preset ticket-loop` chain is running —
state in `.claude/relay/ticket-loop.md`; check it before starting manual work.

## Next task — #39, "Commands dock"

`gh issue view 39 --comments` for the full ticket. Right dock lists the CLI's
commands via `supportedCommands()`; clicking a row fills the composer. The
binding decisions ([[2026-07-27-slash-commands-are-a-dumb-pipe]]): **no cache,
no push channel** (`supportedCommands()` tracks `commands_changed` internally,
`sdk.d.ts:2904` — fetch on open, forget on close, like the model pill);
**query built eagerly at folder-pick** so the list exists before the first
send; **insertion crosses into the composer by prop, not lifted state** — a
`{text, nonce}` pending-insert, nonce load-bearing (same row clicked twice
must fire twice).

## Landmines for #39 specifically

- **Warm-up must be inert on failure.** `close()` sets `terminalError` and
  `runTurn` then fails every send (search `engine.ts` for `terminalError` —
  #37 shifted line numbers). A tripped warm-up hands the user a dead composer
  having typed nothing.
- **New `window.api` channel → add to ALL FOUR mock sites**
  (`tests/chat-harness.ts` + inline mocks in `sidebar`/`session`/`shell`
  tests) or App-render tests throw. Guard the IPC with `isTrustedIpc`. Mock
  the list channel the way `listModels` already is in `chat-harness.ts`.
- **`ensureQuery` is called only from `runTurn`** — `currentQuery` is `null`
  until the first send today; that is exactly what the eager build changes.
  `chat:target` destroys the engine wholesale and rebuilds lazily, so an
  early-built query is discarded safely on a session switch.
- Background fact from #37's capture: the per-turn `system`/`init` message
  carries `slash_commands: string[]` (118 bare names, no `/`) — do NOT use it;
  the decision is `supportedCommands()` pull-only.
- `tests/agents-dock.test.tsx` is the structural twin (`showAgents(agents)` +
  `listRows()` helpers).

## Landmines — carried, still live

- Binding decisions: [[2026-07-27-slash-commands-are-a-dumb-pipe]] (amended
  with the #37 capture). Golden paths: [[happy-path]].
- **#40's Enter interception is the mutation-verified pin** — popover open
  accepts, closed sends. Backwards breaks sending entirely.
- **#36's peer-review automation sacrifices `fable`** — restore must survive a
  failed review. **Never run bare `wisp snapshot`**; recover with
  `wisp snapshot revert <family>`.
- **Wisp `options.model` = alias/family NAME, never a resolved id** (hangs) —
  [[2026-07-24-wisp-alias-routes-by-name]].
- **Native backend is dead on this host** — real turns must run wisped.
- **Never "fix" the plain-string pin** (`a text-only send keeps plain-string
  content` in `tests/engine.test.ts`) by updating its expectation.
- **Replay must never carry the payload**; **a cancel-shaped no-op returns
  before the fold**; **`role="group"` not `role="img"`**; **alpha in the
  colour, not static `opacity`**; **absent stays absent** (engine/merge/render);
  **`taskToParent` is the `local_bash` filter**; **`listSubagents` returns
  `[] | null`** with live rows on `null`; **sessions rail renders `<li>`** —
  scope dock asserts with `within(dock())`, replay chips to `.msg-user`.
- jsdom: no images, no CSP, no hit testing — new sources need their own CSP
  grant and fail silently.
- Don't re-derive: #27 task-message facts, sidecar `model` = family word,
  native store `encodeCwd`, resume ceiling, `sessionId()` accessor, Tailwind
  `@theme` (accent `--color-mint`), engine error copy char-pinned.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react
  ^5`, `typescript 7.0.2`.

## Test helpers worth reusing

- `tests/transcript.test.ts` — direct parser tests, no DOM. **#38's whole
  seam.** Marker cases + the array-of-only-text pin live here.
- `tests/engine.test.ts` — `capturingStub()` / `sendOne(payload)`;
  `taskStarted()` etc. for task messages; #37's local-command describe block
  shows the current system-branch fixtures.
- `tests/chat-harness.ts` — `fakeChatApi` + `harness.emit()`. **#39/#40's
  render seam.** Mock a new list channel the way `listModels` is.
- `tests/attachments-composer.test.tsx` — composer prior art (**#40**):
  `createEvent.paste` + `Object.defineProperty`, `await act(async () => {})`.
- `tests/resume.test.tsx` — the replay seam (**#38's render half**):
  `harness.api.loadTranscript.mockResolvedValue([...])`, click row, assert.
- `tests/agents-dock.test.tsx` — **#39's structural twin.**
- `tests/live-agents.test.tsx` — `renderHook` for `useChat` without `App`.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` (needs `npm run build`
+ playwright-core, both present). Driver recipe (write in a temp dir outside
the repo): `createRequire(pathToFileURL(REPO + '/package.json'))` then
`require('playwright-core')` (plain `import()` yields no `_electron`); forward
slashes everywhere except the dialog-stub path (real Windows form —
`encodeCwd` runs on it); launch `node_modules/electron/dist/electron.exe`
with `['--no-sandbox','--disable-gpu','.']`, `cwd` = repo, `env: process.env`;
stub `dialog.showOpenDialog` in MAIN, click `.pick-folder-btn`.

**New from #37's GUI pass:** Playwright's actionability "stable" wait hangs on
the app's CSS animations — `page.click`/`locator.scrollIntoViewIfNeeded` stall;
dispatch via `page.evaluate(() => document.querySelector(sel).click())` and DOM
`scrollIntoView` instead. `app.close()` can hang — add a hard
`setTimeout(process.exit)` timer. Measure in the DOM, never off screenshots;
shrink window (`unmaximize(); setSize(1100, 780)`) for eyeball shots. Real
attachment data: session `49c1495a`, row 49 of 62, click by index.

**Instrumenting a real turn without the GUI** (#27/#37 pattern): SDK `query()`
from a script outside the repo, `sdk.mjs` by absolute file URL, engine's exact
options, async-generator prompt, dump JSONL, **wisped**. #37's scripts:
`%LOCALAPPDATA%/Temp/spike37/` (capture.mjs, gui-check.mjs).
