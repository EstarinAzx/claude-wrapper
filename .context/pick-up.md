---
type: pick-up
project: claude-wrapper
updated: 2026-07-27
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Queue refilled.** The board was clean after specs #25 and #26 closed. A
planning leg on 2026-07-27 produced **spec #36 (PRD C — slash commands)** and
tickets **#37–#40**, all `ready-for-agent`. Nothing is implemented — no
production file changed. Tree is at `3e67e07` on main plus this leg's `.context/`
commit.

## Next task — #37, "Render local command output live"

Three tickets are frontier-ready (#37, #38, #39 don't gate each other); only
**#40 is blocked by #39**. Work them in ID order — that is the intended delivery
sequence.

**#37 opens with a capture, not with code.** The live streamed shape of local
command output is unobserved: the exact subtype string, whether content arrives
wrapped in markup or already unwrapped, whether the invocation echo is a separate
message. jsdom will report green against a branch keyed on a subtype that never
arrives. Use the #27 pattern — call the SDK's `query()` from a script **outside**
the repo (import `node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs` by
absolute file URL, `engine.ts`'s exact options, async-generator prompt), send
`/context`, dump every message to JSONL. Record the shape in a comment on #37.
Must run **wisped**.

The bug itself is one line's worth of gap: `engine.ts:346` handles `system` by
calling `handleTaskMessage` and nothing else, so local command output and
informational banners are dropped wholesale.

Binding decisions live in [[2026-07-27-slash-commands-are-a-dumb-pipe]] — read it
before starting. Golden-path flows for all four tickets are in [[happy-path]].

## Landmines — new this leg

- **The persisted subtype is NOT the streamed subtype.** On disk:
  `system`/`local_command` (×29 across 80 transcripts). SDK streaming type:
  `local_command_output`. #37 keys on the streamed name, #38 on the persisted one.
  Never assume one is the other.
- **`local_command` carries two unrelated content shapes** — a
  `<local-command-stdout>` wrapper (**frequently empty**) or a `<command-name>` +
  `<command-message>` + `<command-args>` triple. This is exactly why replaying
  command *output* is deferred and only the invocation blob is fixed (#38).
- **`terminal_reason` is optional on `SDKResultSuccess`** (`sdk.d.ts:4277`), not a
  separate message. A bypassed local command still emits `result`/`success`, the
  turn ends, the composer re-arms. **Chased and cleared — don't re-investigate.**
- **`settingSources` is unset and that is correct** — the SDK loads all sources
  when omitted. Custom commands and skills already reach the CLI; only rendering
  was ever broken.
- **#39's warm-up must be inert on failure.** `close()` sets `terminalError`
  (`engine.ts:579`); `runTurn` then fails every send (`:549`). A tripped warm-up
  hands the user a dead composer having typed nothing.
- **#40's Enter interception is the mutation-verified pin** — popover open must
  accept, popover closed must send. Backwards breaks sending entirely, which is
  worse than shipping no autocomplete.
- **#36's peer-review automation sacrifices `fable`.** The rebind mutates routing
  globally while held: spawn → collect → restore, and the restore must survive a
  failed review or every later leg silently runs on the wrong model.

## Landmines — carried forward, still live

- **jsdom never loads an image, never applies CSP, and does no hit testing.**
  Anything needing real rendering wants a GUI pass; the suite greens regardless.
  `img-src 'self' data:` is granted; a NEW source (`blob:`, `file:`) needs its own
  grant and fails silently without one.
- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **#39 adds one.**
- **The transcript parser's array-of-only-text drop is deliberate.** 1375 such
  user messages are CLI noise. It looks like the data-loss bug #35 fixed and is
  not — pinned and mutation-verified. **#38 touches this parser; leave that pin
  alone.** Details in [[2026-07-25-replay-shows-markers-not-bytes]].
- **Replay must never carry the payload** — 2.17 MB of base64 replays as a 114 KB
  DOM. Six tests pin the absence.
- **A cancel-shaped no-op must return before the fold** — folding `[]` keeps the
  chips and silently wipes the rejection message.
- **`role="img"` on an interactive SVG hides its children** from assistive tech
  and testing-library will not catch it. Use `role="group"`.
- **A static `opacity` loses to any animation that keyframes `opacity`** — put the
  alpha in the colour.
- **A live nested agent reads as top-level** until its sidecar lands (accepted
  lag, by decision). **`parentAgentId` is on 0 of 28 real sidecars**, so a live GUI
  run renders flat and cannot exercise nesting.
- **The sessions rail renders `<li>` too** — scope dock assertions with
  `within(dock())`. The composer tray also renders `.attachment-chip`, so scope
  replay-chip assertions to `.msg-user`.
- **Never let the plain-string pin be "fixed" by updating its expectation.**
  `a text-only send keeps plain-string content` in `tests/engine.test.ts` is
  mutation-verified; if it reds, the bug is in `src/main/engine.ts`.
- **Absent must stay absent** in engine (`assignDefined`), merge and render, and
  in the transcript marker. Mutation-verified.
- **`taskToParent` is the `local_bash` filter, not just a lookup.**
- **`listSubagents` returns `SubagentInfo[] | null`** — `[]` none spawned
  (ENOENT), `null` could not read. The dock shows live rows even on `null`.
- **Don't re-simplify `SubagentDrawer`'s `sessionId` prop away.**
- **Wisp `options.model` = alias/family NAME, never a resolved model id** (hangs
  otherwise) — [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots every row and a
  held snapshot blocks the next `/slot` rebind. Always name the family; recover
  with `wisp snapshot revert <family>`. `wisp snapshot list` is **not** a
  subcommand.
- **Native backend is dead on this host** — with the wisp vars stripped the CLI
  answers `Not logged in · Please run /login`. Anything needing a real turn must
  run wisped.
- **Don't re-derive** (details in [[active-work]]): the #27 spike facts
  (`task_notification` is the completion signal · `task_updated` is terminal-only
  · one correlation key plus a separate `task_id` · `total_tokens` is cumulative
  context, labelled `ctx`); a sidecar's `model` is the family word asked for.
- Native store `~/.claude/projects/<enc-cwd>/…` (`encodeCwd`); resume ceiling
  (query built once, retarget = close + rebuild); `sessionId()` accessor;
  Tailwind `@theme` tokens (preflight off, accent `--color-mint`); engine
  legible-error copy char-pinned by `engine.test.ts`.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react ^5`,
  `typescript 7.0.2`.

## Test helpers worth reusing

- `tests/transcript.test.ts` — direct parser tests, no DOM. **#38's whole seam.**
  Home of the marker cases and the array-of-only-text pin.
- `tests/engine.test.ts` — `capturingStub()` / `sendOne(payload)` for send-shape
  assertions; `taskStarted()` / `taskProgress()` / `taskNotification()` for task
  messages. **#37's seam** for the new `system` branches.
- `tests/chat-harness.ts` — `fakeChatApi` + `harness.emit()` pushes events through
  the real hook. **#37's render seam, and #39/#40's.** Mock a new list channel the
  way `listModels` already is.
- `tests/attachments-composer.test.tsx` — composer testing prior art (**#40**):
  fake a paste with `createEvent.paste` + `Object.defineProperty`, and
  `pick(candidates)` → `await act(async () => {})` to flush before asserting.
- `tests/resume.test.tsx` — the replay seam: `harness.api.loadTranscript
  .mockResolvedValue([...])`, click the session row, assert what renders.
- `tests/agents-dock.test.tsx` — **#39's structural twin.** `showAgents(agents)` +
  `listRows()` helpers.
- `tests/live-agents.test.tsx` — `renderHook` for testing `useChat` state without
  rendering `App`.
- `tests/agent-layout.test.ts` — pure-data tree and geometry tests.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` — reads the titlebar pills
+ screenshots the built app (needs `npm run build` + `npm i --no-save
playwright-core`; both present in `node_modules` today).

**Driving the built app** (reusable — write the driver in a temp dir outside the
repo):

- **Importing `playwright-core` from outside the tree:** it is CJS with an exports
  map, so `import(pathToFileURL(…/index.js))` yields a module with **no
  `_electron`**. Use `createRequire(pathToFileURL(REPO + '/package.json'))` then
  `require('playwright-core')`.
- **Write the driver with forward slashes.** A heredoc'd `D:\\.claude\\…` loses
  its backslashes and Node dies on `Octal escape sequences are not allowed in
  strict mode`. Forward slashes work everywhere except the path handed to the
  stubbed dialog, which must be real Windows form because `encodeCwd` runs on it.
- Launch `node_modules/electron/dist/electron.exe` with `args: ['--no-sandbox',
  '--disable-gpu', '.']`, `cwd` = repo, `env: process.env`.
- Stub a dialog in MAIN: `app.evaluate(({dialog}, x) => {
  dialog.showOpenDialog = async () => ({canceled: false, filePaths: x}) })`. For
  the folder pick click **`.pick-folder-btn`**. The same stub drives `.attach-btn`.
- A real clipboard image is `clipboard.writeImage(nativeImage.createFromPath(…))`
  from main, then `page.keyboard.press('Control+V')` on the focused input.
- **Real attachment data is in this repo's own history.** Point the picker at the
  repo root; session **`49c1495a`** is **row 49 of 62** with six attachment
  messages. Rows are newest-first and 19 sessions share its title, so **click by
  index, not by text**. Densest agent session was row 52 (7 agents).
- **Measure in the DOM** (`getBoundingClientRect`, `getComputedStyle` via
  `page.evaluate`), never off the screenshot. **An image that renders is
  `naturalWidth > 0`** — a CSP block leaves a perfect DOM and a 0×0 image.
- **For a usable eyeball shot, shrink the window first** —
  `BrowserWindow.getAllWindows()[0].unmaximize(); setSize(1100, 780)` in main,
  then `scrollIntoViewIfNeeded()` before `page.screenshot()`.

**Instrumenting a real turn without the GUI** (what #27 used, and **what #37 needs
first**): call the SDK's `query()` directly from a script *outside* the repo,
importing `node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs` by absolute file
URL, with `engine.ts`'s exact options and an async-generator prompt. Dump every
message to JSONL. Cheaper than driving Electron and the tree stays clean by
construction.
