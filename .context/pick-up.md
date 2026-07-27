---
type: pick-up
project: claude-wrapper
updated: 2026-07-27
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**#37 (`ab7835f`), #38 (`c077904`) and #39 (`0cb6e31`) are delivered** and
closed with breadcrumbs. Spec #36 has ONE ticket left: **#40 (frontier,
unblocked — #39 closed)**. When #40 lands, close spec #36. A
`/relay 10m N=8 /preset ticket-loop` chain is running — state in
`.claude/relay/ticket-loop.md`; check it before starting manual work.

## Next task — #40, "Composer slash-command autocomplete"

`gh issue view 40 --comments` for the full ticket. Typing `/` in the composer
opens a filtered popover of commands; picking one fills the input. Binding
decisions ([[2026-07-27-slash-commands-are-a-dumb-pipe]]): the wrapper still
never validates a command — autocomplete is typing help, not a gate.

## Landmines for #40 specifically

- **Enter interception is THE mutation-verified pin, both directions.**
  Autocomplete intercepts Enter *only* while its popover is open with a row
  highlighted; every other state falls through to submit. Backwards breaks
  sending entirely — worse than shipping no autocomplete. Pin both ways.
- **Reuse `window.api.listCommands()`** — the guarded channel from #39, mocked
  at all four sites already. No new IPC.
- InputBar already carries the `{text, nonce}` pending-insert effect (#39) —
  autocomplete insertion should compose with it, not fight it. The composer's
  `onKeyDown` currently submits on every Enter (`InputBar.tsx`).
- Composer test prior art: `tests/attachments-composer.test.tsx`
  (`createEvent.paste` + `Object.defineProperty`, `await act(async () => {})`);
  `tests/commands-dock.test.tsx` for the list-channel mock pattern.
- The dock and the popover are separate surfaces sharing one channel — the
  popover must not open the dock or care whether it is open.

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
