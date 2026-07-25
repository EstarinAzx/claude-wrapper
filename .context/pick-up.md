---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg (relay leg 1, `.claude/relay-leg.md`, N=1):** landed **#27**, the
spike gating #25's live-metrics half. **No production commits** — a spike's
deliverable is a finding, so the ticket branch had zero commits and was deleted.
main stays at **`02b0cd5`** plus this leg's `.context/` commit. Gate was green
(typecheck · 215 tests / 28 files · build) and the tree is clean.

Verdict: **the CLI does emit `task_started` / `task_progress` / `task_updated`**
— #30 keeps full scope, nothing is struck. Evidence lives on #25
(`issues/25#issuecomment-5077330745`); the constraints it puts on #30/#31 are in
[[2026-07-25-task-messages-confirmed-live-shape]] and the "Facts established by
the spike" block of [[active-work]]. **Read those before starting #30 or #31** —
the obvious nesting implementation does not work.

## Next task — #28, then the frontier

```
#27 ✅ ──┐
         ├──> #30 live rows
#28 ─────┴──> #31 nesting ──> #33 map

#29 ──> #32 paste ──┬──> #34 paperclip
                    └──> #35 replay chips
```

Unblocked now: **#28** (Agents dock, hydrated from disk) and **#29**. Take
**#28** — it unblocks two tickets, #29 unblocks one. Frontier query for every
later firing: oldest open `ready-for-agent` issue with
`issue_dependencies_summary.blocked_by == 0`. Full table in [[active-work]].

**#28 is the four-mock-sites ticket.** It adds a `window.api` channel for disk
hydration; miss one mock site and every App-render test throws.

## Landmines (still live)

- **New `window.api` channel → add to ALL FOUR mock sites** (`tests/chat-harness.ts`
  + inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **#28, #29 and #34 all trip this.**
- **Wisp `options.model` = alias/family NAME, never a resolved model id** (hangs
  otherwise) — [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — it snapshots every row, and a held
  `haiku` snapshot blocks the next `/slot` rebind. Always name the family;
  recover with `wisp snapshot revert <family>`. The retired
  `~/.claude/slot/lease-*.json` files are gone — the snapshot store is the only
  recovery record.
- **Native backend is dead on this host** — with the wisp vars stripped the CLI
  answers `Not logged in · Please run /login`. Anything needing a real turn must
  run wisped.
- **#29 touches the core prompt path.** Its guard is a test asserting a
  text-only send still produces plain-string content. If that test fails, the
  fix is the code, never the expectation.
- **Don't re-derive** (details in [[active-work]]): the ten spike facts
  (`task_notification` is the completion signal · `task_updated` is
  terminal-only · filter `task_type === 'local_agent'` · nested agents are
  invisible to `parent_tool_use_id` · one correlation key + a separate `task_id`
  · `total_tokens` is cumulative context · `description` beats `summary` · the
  tool is named `Agent` · no `tool_progress` · `handleMessage` has no `system`
  branch); sidecars carry six fields and `parseMeta` keeps two; nesting is
  1-in-185 so design for a flat fan; one persisted screenshot is 263 KB of
  base64; `SDKUserMessage.message` is a `MessageParam`, so image blocks are legal.
- **Subagent viewer:** correlate live `parent_tool_use_id` ↔ persisted `agentId`
  via `agent-<id>.meta.json` `toolUseId`; `parseTranscript(raw, {
  includeSidechain: true })` for a subagent's own (all-sidechain) file. `<Chat>`
  is reused read-only in the drawer — a replayed subagent tool card has no
  `subagent` field, so no nested drawer (flat one level, by design).
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
playwright-core`). To eyeball a real turn / subagent, stub `dialog.showOpenDialog`
via Playwright `app.evaluate`, pick a folder, then drive the input.

**Instrumenting a real turn without the GUI** (what #27 used, reusable): call the
SDK's `query()` directly from a script *outside* the repo, importing
`node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs` by absolute file URL, with
`engine.ts`'s exact options and an async-generator prompt. Dump every message to
JSONL. Cheaper than driving Electron and the tree stays clean by construction.
