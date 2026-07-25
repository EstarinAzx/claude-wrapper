---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg (relay leg 7, `.claude/relay-leg.md`, N=1):** landed **#33**, map mode
for the Agents panel. main is at **`c357ed7`** plus this leg's `.context/`
commit. Gate green (typecheck · 364/364 · build), tree clean, ticket closed,
branch deleted. A GUI pass on the built app measured the map at both ends of the
resize range, and computed styles confirmed every status colour.

**#33 was the last ticket of spec #25, so #25 is now closed too.** Only spec
**#26 Attachments** is open, owing **#34** and **#35**. Both are unblocked.

## Next task — #34, then #35

```
#27 ✅──┐
        ├──> #30 ✅
#28 ✅──┴──> #31 ✅──> #33 ✅        spec #25 CLOSED
#29 ✅──> #32 ✅──┬──> #34 paperclip  ← next is #34
                  └──> #35 replay chips
```

Frontier query (oldest open `ready-for-agent` with
`issue_dependencies_summary.blocked_by == 0`, **ignoring the spec parent #26**,
which is labelled the same and is older) picks **#34 — Paperclip: file picker
and by-path attachments**. Full table in [[active-work]]. **#35 empties the
queue**, and landing it should close #26.

## What #34 must not re-derive

- **The policy module already covers #34.** `judgeAttachment` routes an item
  that is too big to embed, or not an embeddable image, to the **by-path** route
  whenever a `path` is present. Do not add a second policy path; see
  [[2026-07-25-attachment-policy-and-the-csp-that-blocked-it]].
- **`normalizeSendPayload` is the trust boundary on `chat:send`** and stays one.
- **A rejection must not consume the count budget** — the fold lives in the
  policy module, not the composer. Mutation-verified.
- **#34 adds a `window.api` channel** (the native file picker), which trips the
  four-mock-site landmine below. This is the ticket that needs it.

## Landmines (still live)

- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **#34 trips this.**
- **jsdom never loads an image, never applies CSP, and does no hit testing.**
  Anything that depends on the browser actually rendering needs a GUI pass; the
  suite reports green regardless. New image sources (`blob:`, `file:`) need their
  own `img-src` grant.
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

- `tests/agent-layout.test.ts` — pure-data tree **and geometry** tests. The
  geometry block shows the pattern: assert layout as data (bounds, separation,
  determinism), never by scraping rendered SVG.
- `tests/agents-dock.test.tsx` — `liveEvent(over)` builds a widened `subagent`
  event; `harness.emit()` pushes it through the real hook; the `nesting` and
  `map mode` blocks have `showAgents(agents)` + `listRows()` helpers.
- `tests/live-agents.test.tsx` — `renderHook` pattern for testing `useChat`
  state directly, without rendering `App`.
- `tests/attachments-composer.test.tsx` — how to fake a paste: build the event
  with `createEvent.paste`, then `Object.defineProperty(event, 'clipboardData',
  …)` because jsdom supplies none. Also the CSP pin. **#34 and #35 live here.**
- `tests/engine.test.ts` — `capturingStub()` / `sendOne(payload)` for send-shape
  assertions; `taskStarted()` / `taskProgress()` / `taskNotification()` for live
  task-message work.

## GUI check

`node .claude/skills/run-desktop/driver.mjs [--cycle]` — reads the titlebar pills
+ screenshots the built app (needs `npm run build` + `npm i --no-save
playwright-core`). **#34 is a good candidate** (a native file dialog is exactly
what jsdom cannot exercise).

**Driving the built app** (refined again this leg, reusable — write the driver in
a temp dir outside the repo and import `playwright-core` by absolute file URL off
`node_modules`, so the tree stays clean):

- Launch `node_modules/electron/dist/electron.exe` with `args: ['--no-sandbox',
  '--disable-gpu', '.']`, `cwd` = repo, `env: process.env`.
- Stub the picker in MAIN: `app.evaluate(({dialog}, dir) => {
  dialog.showOpenDialog = async () => ({canceled: false, filePaths: [dir]}) })`,
  then click **`.pick-folder-btn`**. Do **not** use `text=Pick a project folder`
  — that selector clicked without triggering the handler and cost a debug cycle.
  **#34 will want this same stub for its own picker.**
- A real clipboard image is `clipboard.writeImage(nativeImage.createFromPath(…))`
  from main, then `page.keyboard.press('Control+V')` on the focused input.
- **Real agent data is in this repo's own history.** Pointing the picker at the
  repo root and walking `.session-row` finds sessions with real sidecars; the
  densest at leg 7 was **row 52 with 7 agents** (of 60). Rows are newest-first,
  so the dense ones are old and far down. Clicking a row and counting
  `.agents-dock .agent-row` is the cheapest way to find one.
- **Measure in the DOM** (`getBoundingClientRect`, `getComputedStyle` via
  `page.evaluate`), never off the screenshot: `--disable-gpu` flattens the
  acrylic, and **both `page.screenshot({clip})` and `locator.screenshot()`
  mis-frame** a window wider than the viewport. `getComputedStyle` is also how to
  verify CSS that jsdom cannot resolve (`var()`, `color-mix`, dash arrays) — and
  a class can be forced onto a live node with `setAttribute` to probe a state the
  data does not currently produce.

**Instrumenting a real turn without the GUI** (what #27 used, reusable): call the
SDK's `query()` directly from a script *outside* the repo, importing
`node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs` by absolute file URL, with
`engine.ts`'s exact options and an async-generator prompt. Dump every message to
JSONL. Cheaper than driving Electron and the tree stays clean by construction.
