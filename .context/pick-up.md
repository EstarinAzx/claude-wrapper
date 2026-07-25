---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg (relay leg 2, `.claude/relay-leg.md`, N=1):** landed **#28**, the
Agents dock — the complete disk-fed tracer bullet for spec #25's surface. main is
at **`c02f482`** plus this leg's `.context/` commit. Gate green (typecheck ·
238/238 · build), tree clean, ticket closed, branch deleted.

Closing #28 **unblocked #30 and #31**.

Two things #28 established that later Agents tickets must not re-derive
(full detail in [[2026-07-25-agents-dock-disk-contract]] and
[[2026-07-25-sidecar-model-is-family-not-resolved]]):

- `listSubagents` returns `SubagentInfo[] | null` — `[]` means "none spawned"
  (ENOENT), `null` means "could not read". #30's live merge shares this list and
  must preserve the split, and must not zero-fill absent sidecar fields.
- A sidecar's `model` is the **family word asked for**, not what served the turn.
  Spec #25's Further Notes claim otherwise and are wrong.

## Next task — #29, then the frontier

```
#27 ✅──┐
        ├──> #30 live rows      ← unblocked
#28 ✅──┴──> #31 nesting ──> #33 map
                 ↑ unblocked

#29 ──> #32 paste ──┬──> #34 paperclip
                    └──> #35 replay chips
```

Unblocked now: **#29, #30, #31**. Frontier query (oldest open `ready-for-agent`
with `issue_dependencies_summary.blocked_by == 0`) picks **#29**. Full table in
[[active-work]].

**#29 is the regression-risk ticket** — it widens the core prompt path. Its guard
is a test asserting a text-only send still produces plain-string content. If that
test fails, the fix is the code, never the expectation. It is also a
four-mock-sites ticket.

## Landmines (still live)

- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **#29 and #34 trip this.** (#28 did not — it
  reused the existing `subagents:list` channel and added none.)
- **Wisp `options.model` = alias/family NAME, never a resolved model id** (hangs
  otherwise) — [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots every row, and
  a held `haiku` snapshot blocks the next `/slot` rebind. Always name the family;
  recover with `wisp snapshot revert <family>`. The retired
  `~/.claude/slot/lease-*.json` files are gone — the snapshot store is the only
  recovery record.
- **Native backend is dead on this host** — with the wisp vars stripped the CLI
  answers `Not logged in · Please run /login`. Anything needing a real turn must
  run wisped.
- **Don't re-simplify `SubagentDrawer`'s `sessionId` prop away.** It looks
  redundant next to `currentSessionId()`, but a session opened from the rail has
  no engine until the next turn, so the engine answers `null` and the drawer
  comes up empty — exactly the past-session case the dock opens.
- **#31 has no local fixtures.** `parentAgentId` appears on 0 of 28 real sidecars
  in this store, so the nesting path must be tested with fabricated ones.
- **Don't re-derive** (details in [[active-work]]): the #27 spike facts
  (`task_notification` is the completion signal · `task_updated` is
  terminal-only · filter `task_type === 'local_agent'` · nested agents are
  invisible to `parent_tool_use_id` · one correlation key + a separate `task_id`
  · `total_tokens` is cumulative context · `description` beats `summary` · the
  tool is named `Agent` · no `tool_progress` · `handleMessage` has no `system`
  branch); one persisted screenshot is 263 KB of base64; `SDKUserMessage.message`
  is a `MessageParam`, so image blocks are legal.
- Native store `~/.claude/projects/<enc-cwd>/…` (`encodeCwd`); resume ceiling
  (query built once, retarget = close + rebuild); `sessionId()` accessor (no
  `session-id` event); Tailwind `@theme` tokens (preflight off, accent
  `--color-mint`); engine legible-error copy is char-pinned by `engine.test.ts`.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react ^5`,
  `typescript 7.0.2`.

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
