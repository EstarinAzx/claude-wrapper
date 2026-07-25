---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg (relay leg 4, `.claude/relay-leg.md`, N=1):** landed **#30**, live
agent rows. The engine had no `type: 'system'` branch and dropped the entire task
lifecycle; it now has one, and the single `subagent` event was **widened, not
duplicated**. main is at **`f869f1f`** plus this leg's `.context/` commit. Gate
green (typecheck · 291/291 · build), tree clean, ticket closed, branch deleted.

Closing #30 unblocked nothing new — **#31 and #32 were already unblocked.**

## Next task — #31, then the frontier

```
#27 ✅──┐
        ├──> #30 ✅
#28 ✅──┴──> #31 nesting ──> #33 map     ← next
#29 ✅──> #32 paste ──┬──> #34 paperclip
                      └──> #35 replay chips
```

Unblocked now: **#31, #32**. Frontier query (oldest open `ready-for-agent` with
`issue_dependencies_summary.blocked_by == 0`) picks **#31**. Full table in
[[active-work]].

## What #31 must not re-derive

Full detail in [[2026-07-25-live-rows-two-sources-one-event]] and
[[2026-07-25-task-messages-confirmed-live-shape]]:

- **The tree cannot be built from forwarded traffic.** A nested subagent's
  traffic is *never* forwarded — every forwarded message stays tagged with the
  **outer** agent's id. The nested agent surfaces only through its own task
  messages, plus the `Agent` tool_use block (inside a message tagged with the
  outer agent's id) that names the nested task's `tool_use_id`. That block is the
  parent edge. **No depth field exists on any message.**
- **`taskToParent` in `src/main/engine.ts` is the hook** — it already maps
  `task_id` → spawning tool_use id, and it is the bash filter, so don't bypass
  it. `subagentEvent()` is the single builder; add nested fields there and they
  reach the panel for free.
- **`tests/engine.test.ts > engine task messages`** holds the real wire shapes
  (from the #27 spike JSONL) as reusable fixtures — `taskStarted()`,
  `taskProgress()`, `taskNotification()` all take overrides.
- **#31 has no local fixtures.** `parentAgentId` appears on **0 of 28** real
  sidecars in this store, so the nesting path must be tested with fabricated
  ones.
- `mergeAgents(disk, live)` in `src/shared/subagent-types.ts` is pure and
  unit-tested — extend it rather than adding a second merge.

## Landmines (still live)

- **`taskToParent` is the `local_bash` filter, not just a lookup.**
  `task_progress`/`task_updated` carry no `task_type`, so a per-message
  `task_type` check cannot work. Register ids only from a `local_agent`
  `task_started`; drop any message whose `task_id` is unregistered.
- **Absent must stay absent** in engine (`assignDefined`), merge and render.
  Mutation-verified both ways: writing `?? 0` in the engine reds the
  absent-usage tests, opening the `local_agent` filter reds the Bash test. If
  either goes red, the bug is in the code — never "fix" the expectation.
- **Never let the plain-string pin be "fixed" by updating its expectation.**
  `a text-only send keeps plain-string content` in `tests/engine.test.ts` is
  mutation-verified; if it goes red the bug is in `src/main/engine.ts`.
- **The sessions rail renders `<li>` too** — scope any dock list-item assertion
  with `within(dock())` or it double-counts. (Cost leg 4 one red test.)
- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **Only #34 still trips this** — #30 added none.
- **Wisp `options.model` = alias/family NAME, never a resolved model id** (hangs
  otherwise) — [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots every row, and
  a held `haiku` snapshot blocks the next `/slot` rebind. Always name the family;
  recover with `wisp snapshot revert <family>`. `wisp snapshot list` is **not** a
  subcommand; the retired `~/.claude/slot/lease-*.json` files are gone — the
  snapshot store is the only recovery record.
- **Native backend is dead on this host** — with the wisp vars stripped the CLI
  answers `Not logged in · Please run /login`. Anything needing a real turn must
  run wisped.
- **`listSubagents` returns `SubagentInfo[] | null`** — `[]` none spawned
  (ENOENT), `null` could not read. The dock now shows live rows even on the
  `null` branch; preserve that.
- **Don't re-simplify `SubagentDrawer`'s `sessionId` prop away.** A session opened
  from the rail has no engine until the next turn, so the engine answers `null`
  and the drawer comes up empty.
- **Don't re-derive** (details in [[active-work]]): the #27 spike facts
  (`task_notification` is the completion signal · `task_updated` is
  terminal-only · filter `task_type === 'local_agent'` · one correlation key plus
  a separate `task_id` · `total_tokens` is cumulative context, labelled `ctx` ·
  `description` beats `summary` · the tool is named `Agent`); a sidecar's `model`
  is the family word asked for, not what served the turn; one persisted
  screenshot is 263 KB of base64.
- Native store `~/.claude/projects/<enc-cwd>/…` (`encodeCwd`); resume ceiling
  (query built once, retarget = close + rebuild); `sessionId()` accessor (no
  `session-id` event); Tailwind `@theme` tokens (preflight off, accent
  `--color-mint`); engine legible-error copy is char-pinned by `engine.test.ts`.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react ^5`,
  `typescript 7.0.2`.

## Test helpers worth reusing

- `tests/engine.test.ts` — **`capturingStub()`** (streamingStub + a capture of
  every user message pushed into the prompt stream) and **`sendOne(payload)`**
  for #32; **`taskStarted()` / `taskProgress()` / `taskNotification()`** for #31.
- `tests/agents-dock.test.tsx` — `liveEvent(over)` builds a widened `subagent`
  event; `harness.emit()` pushes it through the real hook.
- `tests/live-agents.test.tsx` — `renderHook` pattern for testing `useChat`
  state directly, without rendering `App`.

## GUI check
`node .claude/skills/run-desktop/driver.mjs [--cycle]` — reads the titlebar pills
+ screenshots the built app (needs `npm run build` + `npm i --no-save
playwright-core`; `--no-save` leaves package.json and the lockfile untouched).

**Driving a real disk-hydrated session** (what #28 used, reusable): launch the
built app, stub `dialog.showOpenDialog` in the MAIN process via Playwright
`app.evaluate` to return this repo, click "Pick a project folder", then click a
`.session-row-btn` — the rail's sessions have real subagent sidecars on disk.
Import `playwright-core` by absolute file URL off `node_modules` so the driver
can live outside the repo and keep the tree clean. Two traps: `page.reload()`
resets the renderer's `cwd` and dumps you back to Welcome (remount components
instead), and **measure geometry in the DOM, not off a screenshot** — a scaled
screenshot made the titlebar look like it overflowed when it fit exactly.

**Instrumenting a real turn without the GUI** (what #27 used, reusable): call the
SDK's `query()` directly from a script *outside* the repo, importing
`node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs` by absolute file URL, with
`engine.ts`'s exact options and an async-generator prompt. Dump every message to
JSONL. Cheaper than driving Electron and the tree stays clean by construction.
