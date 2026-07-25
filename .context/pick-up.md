---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg (relay leg 3, `.claude/relay-leg.md`, N=1):** landed **#29**, the
send-payload prefactor — the pipe from composer to engine now carries text +
attachments instead of a bare string, and the renderer sends an empty list, so
nothing about the UI changed. main is at **`397c0a1`** plus this leg's
`.context/` commit. Gate green (typecheck · 248/248 · build), tree clean, ticket
closed, branch deleted.

Closing #29 **unblocked #32**.

The one thing #29 settled that #32 must not re-derive (full detail in
[[2026-07-25-send-payload-encoding-lands-in-the-prefactor]]): **the attachment
encoding already exists.** #29 shipped both branches, not just the empty one, so
#32 needs the composer and the policy module and **no engine work**. The
embeddable media-type allowlist lives in `src/shared/attachment-types.ts` as
`EMBEDDABLE_IMAGE_TYPES` — import it, don't restate it.

## Next task — #30, then the frontier

```
#27 ✅──┐
        ├──> #30 live rows      ← next
#28 ✅──┴──> #31 nesting ──> #33 map

#29 ✅──> #32 paste ──┬──> #34 paperclip
             ↑         └──> #35 replay chips
          unblocked
```

Unblocked now: **#30, #31, #32**. Frontier query (oldest open `ready-for-agent`
with `issue_dependencies_summary.blocked_by == 0`) picks **#30**. Full table in
[[active-work]].

**#30 is the biggest ticket in the batch** and the one with a live gate inside
it: its first acceptance criterion is to read #27's finding and re-scope if the
spike disconfirmed. **It did not disconfirm** — all the task messages arrive
(see the #27 facts in [[active-work]]), so #30 keeps full scope: live tokens,
tool count, elapsed, last tool name. Do not turn on `forwardSubagentText` or
`agentProgressSummaries` — both stay off. The engine's existing `subagent` event
is **widened, not duplicated**: still exactly one event type, keyed by the
spawning tool-use id.

Note that `handleMessage` has no `type: 'system'` branch and today drops every
task message it receives — that is where #30 starts.

## Landmines (still live)

- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **Only #34 still trips this** — #29 added no
  channel (it changed the *shape* `sendPrompt` carries, and the three inline
  mocks are bare `vi.fn()`), and #30 adds none either.
- **Never let the plain-string pin be "fixed" by updating its expectation.**
  `a text-only send keeps plain-string content` in `tests/engine.test.ts` is
  mutation-verified; if it goes red the bug is in `src/main/engine.ts`.
- **Wisp `options.model` = alias/family NAME, never a resolved model id** (hangs
  otherwise) — [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — with no family it snapshots every row, and
  a held `haiku` snapshot blocks the next `/slot` rebind. Always name the family;
  recover with `wisp snapshot revert <family>`. `wisp snapshot list` is **not** a
  subcommand (only `snapshot [row]` / `snapshot revert [row]`); the retired
  `~/.claude/slot/lease-*.json` files are gone — the snapshot store is the only
  recovery record.
- **Native backend is dead on this host** — with the wisp vars stripped the CLI
  answers `Not logged in · Please run /login`. Anything needing a real turn must
  run wisped.
- **`listSubagents` returns `SubagentInfo[] | null`** — `[]` none spawned
  (ENOENT), `null` could not read. #30's live merge shares this list, must
  preserve the split, and must not zero-fill absent sidecar fields.
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
  branch); a sidecar's `model` is the family word asked for, not what served the
  turn; one persisted screenshot is 263 KB of base64.
- Native store `~/.claude/projects/<enc-cwd>/…` (`encodeCwd`); resume ceiling
  (query built once, retarget = close + rebuild); `sessionId()` accessor (no
  `session-id` event); Tailwind `@theme` tokens (preflight off, accent
  `--color-mint`); engine legible-error copy is char-pinned by `engine.test.ts`.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react ^5`,
  `typescript 7.0.2`.

## Test helpers worth reusing

`tests/engine.test.ts` now has **`capturingStub()`** (streamingStub plus a
capture of every user message pushed into the prompt stream) and
**`sendOne(payload)`** (run one turn, hand back what was pushed). #30's
engine-seam tests drive fabricated task messages through `push()` from the same
stub; #32's Seam-1 assertions should use these rather than re-inlining a capture.

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
