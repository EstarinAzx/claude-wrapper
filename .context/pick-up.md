---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg (relay leg 5, `.claude/relay-leg.md`, N=1):** landed **#31**, nested
agents as a tree. Nesting comes from the sidecar's `parentAgentId` **alone** —
the live `taskToParent` / `Agent`-block edge that #30's decision nominated was
declined ([[2026-07-25-agent-tree-edge-is-the-sidecar]]). main is at
**`1888440`** plus this leg's `.context/` commit. Gate green (typecheck ·
310/310 · build), tree clean, ticket closed, branch deleted.

Closing #31 unblocked **#33** (map mode).

## Next task — #32, then the frontier

```
#27 ✅──┐
        ├──> #30 ✅
#28 ✅──┴──> #31 ✅──> #33 map
#29 ✅──> #32 paste ──┬──> #34 paperclip     ← next is #32
                      └──> #35 replay chips
```

Unblocked now: **#32, #33**. Frontier query (oldest open `ready-for-agent` with
`issue_dependencies_summary.blocked_by == 0`) picks **#32 — Paste an image and
send it**. Full table in [[active-work]].

## What #32 must not re-derive

Full detail in [[2026-07-25-send-payload-encoding-lands-in-the-prefactor]] and
[[2026-07-25-attachments-embed-images-paths-for-files]]:

- **The engine half is already built.** #29 shipped both branches of the
  encoding, so **#32 is composer + policy module only — no engine work.** Do not
  re-open `src/main/engine.ts` to "add" image blocks; they already send.
- **`EMBEDDABLE_IMAGE_TYPES` lives in `src/shared/attachment-types.ts`** —
  import it into the policy module, don't restate the allowlist.
- **`normalizeSendPayload` is the trust boundary on `chat:send`.** The policy
  module enforces caps in the renderer *before* IPC; the boundary check stays.
- **`tests/engine.test.ts` has `capturingStub()` and `sendOne(payload)`** — the
  engine-seam assertions (one image, several images) reuse them rather than
  re-inlining a capture.
- Caps are order-of: 5 MB decoded per image, 10 attachments per message. Exact
  numbers are tunable; that they live in **one pure module** with direct tests
  per outcome is the fixed part.
- The composer stays a **single-line input**. No model-capability gating — a
  text-only provider's error surfaces through the engine's existing
  legible-error mapping.

## Landmines (still live)

- **Never let the plain-string pin be "fixed" by updating its expectation.**
  `a text-only send keeps plain-string content` in `tests/engine.test.ts` is
  mutation-verified; if it reds, the bug is in `src/main/engine.ts`. #32's own
  acceptance list repeats this as a criterion.
- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **#34 trips this; #32 should not need a channel**
  — a paste is renderer-local.
- **One persisted screenshot measured 263 KB of base64** — which is why replay
  shows chips, not thumbnails (#35's problem, not #32's).
- **`spawnDepth` is not tree depth** (new, #31). It is sidecar metadata;
  `AgentNode.depth` is computed by `buildAgentTree`. #33 must not confuse them.
- **#33 must call `buildAgentTree` from `src/shared/agent-layout.ts`** rather
  than deriving parentage again — that module exists to be the one traversal.
  `flattenAgentTree` is pre-order. Orphans, self-parents and cycle members
  degrade to roots; preserve that in the map.
- **The `parentAgentId` passthrough in `mergeAgents` is mutation-verified** —
  deleting it reds `tests/agents-merge.test.ts` and the three-deep test in
  `tests/agents-dock.test.tsx`.
- **`taskToParent` is the `local_bash` filter, not just a lookup.**
  `task_progress`/`task_updated` carry no `task_type`, so a per-message
  `task_type` check cannot work. Register ids only from a `local_agent`
  `task_started`; drop any message whose `task_id` is unregistered.
- **Absent must stay absent** in engine (`assignDefined`), merge and render.
  Mutation-verified both ways — if either reds, the bug is in the code, never
  the expectation.
- **The sessions rail renders `<li>` too** — scope any dock list-item assertion
  with `within(dock())` or it double-counts.
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
  (ENOENT), `null` could not read. The dock shows live rows even on the `null`
  branch; preserve that.
- **Don't re-simplify `SubagentDrawer`'s `sessionId` prop away.** A session opened
  from the rail has no engine until the next turn, so the engine answers `null`.
- **Don't re-derive** (details in [[active-work]]): the #27 spike facts
  (`task_notification` is the completion signal · `task_updated` is
  terminal-only · filter `task_type === 'local_agent'` · one correlation key plus
  a separate `task_id` · `total_tokens` is cumulative context, labelled `ctx` ·
  the tool is named `Agent`); a sidecar's `model` is the family word asked for,
  not what served the turn; `parentAgentId` is on 0 of 28 real sidecars, so
  anything testing nesting needs fabricated fixtures.
- Native store `~/.claude/projects/<enc-cwd>/…` (`encodeCwd`); resume ceiling
  (query built once, retarget = close + rebuild); `sessionId()` accessor (no
  `session-id` event); Tailwind `@theme` tokens (preflight off, accent
  `--color-mint`); engine legible-error copy is char-pinned by `engine.test.ts`.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react ^5`,
  `typescript 7.0.2`.

## Test helpers worth reusing

- `tests/engine.test.ts` — **`capturingStub()`** and **`sendOne(payload)`** for
  #32; **`taskStarted()` / `taskProgress()` / `taskNotification()`** for live
  task-message work.
- `tests/agent-layout.test.ts` — pure-data tree tests; extend these for #33's
  geometry rather than testing the map through the DOM.
- `tests/agents-dock.test.tsx` — `liveEvent(over)` builds a widened `subagent`
  event; `harness.emit()` pushes it through the real hook; the `nesting` block
  has `showAgents(agents)` + `listRows()` helpers.
- `tests/live-agents.test.tsx` — `renderHook` pattern for testing `useChat`
  state directly, without rendering `App`.

## GUI check
`node .claude/skills/run-desktop/driver.mjs [--cycle]` — reads the titlebar pills
+ screenshots the built app (needs `npm run build` + `npm i --no-save
playwright-core`; `--no-save` leaves package.json and the lockfile untouched).
**#32 is a good candidate for a real GUI pass** (paste is a live browser event);
#31 was not, because nothing on disk is nested.

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
