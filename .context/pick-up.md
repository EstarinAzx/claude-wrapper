---
type: pick-up
project: claude-wrapper
updated: 2026-07-27
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**#37 is delivered** (`ab7835f` on main, closed with breadcrumbs). Spec #36 has
three tickets left: **#38 (frontier), #39, then #40 (blocked by #39)**. Work in
ID order. A `/relay 10m N=8 /preset ticket-loop` chain may be running —
check `.claude/relay/ticket-loop.md` before starting manual work.

## Next task — #38, "Unwrap command invocations on replay"

`gh issue view 38 --comments` for the full ticket. The seam is
`src/main/transcript.ts` (plain strings taken verbatim at `transcript.ts:77`)
and `tests/transcript.test.ts` — direct parser tests, no DOM. A slash-command
invocation persists as a `user` message whose plain-string content is
`<command-name>/context</command-name><command-message>…</command-message>
<command-args>…</command-args>` markup; every session that used one renders raw
markup today. Real specimens: 29 × `system`/`local_command` across 80
transcripts in the native store, plus the sidebar observation below.

## Landmines for #38 specifically

- **The array-of-only-text drop is deliberate** — 1375 such user messages are
  CLI noise and must keep parsing to nothing. Pinned and mutation-verified. It
  looks like the #35 data-loss bug and is not. You are editing this parser —
  **leave that pin alone.** Details in [[2026-07-25-replay-shows-markers-not-bytes]].
- **The persisted subtype (`local_command`) is NOT the streamed shape.** Live,
  command output arrives as synthetic `assistant` messages
  (`message.model === "<synthetic>"`) — #37 captured this; see its ticket
  comment. #38 keys on the **persisted** forms only.
- **`local_command` carries two unrelated content shapes** — a
  `<local-command-stdout>` wrapper (frequently empty) or the `<command-name>`
  triple. Replaying command *output* is deliberately deferred (#36) — only the
  invocation blob is in scope.
- **Sidebar session titles render the raw markup too** (observed live in #37's
  GUI pass: `<local-command-caveat>Caveat: T…`). Check whether the title path
  shares `parseTranscript` or needs its own unwrap — breadcrumb on #37's close
  comment.

## Landmines — carried, still live

- Binding decisions: [[2026-07-27-slash-commands-are-a-dumb-pipe]] (amended
  with the #37 capture). Golden paths: [[happy-path]].
- **#39's warm-up must be inert on failure** — `close()` sets `terminalError`
  and `runTurn` then fails every send (search engine.ts; #37 shifted line
  numbers). Tripped warm-up = dead composer.
- **#39 adds a `window.api` channel → add to ALL FOUR mock sites**
  (`tests/chat-harness.ts` + inline in `sidebar`/`session`/`shell` tests) or
  App-render tests throw. Guard IPC with `isTrustedIpc`.
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
