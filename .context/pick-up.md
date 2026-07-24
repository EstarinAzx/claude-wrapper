---
type: pick-up
project: claude-wrapper
updated: 2026-07-24
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last session (interactive):** fixed the markdown-tables bug and CLOSED the
one remaining standalone task. main was at **`fd178b1`**; this session's fix
commits on top.

- **markdown tables render as raw text → FIXED.** Added `remark-gfm@^4.0.1` +
  `remarkPlugins={[remarkGfm]}` to `Chat.tsx`. GFM tables/strikethrough/
  task-lists/autolinks now render in the main chat **and** the subagent drawer
  (reuses `<Chat>`). New `tests/chat.test.tsx` case asserts a `| … |` table
  renders a `<table>`. Gate green: typecheck · **215/215** test · build.

## Next task — NONE queued; needs a fresh spec

**Queue is empty.** All specs closed (#9, #16, #20), no open `ready-for-agent`
tickets. New product work needs a fresh spec — **owner-pick, not agent
auto-pick**. Run `/preset init` (→ grill → `/hp` → to-spec → to-tickets) on
whatever the owner chooses.

Deferred options to draw from (all in [[active-work]]): #24 follow-ons —
historical/nested subagents, dedicated Agents panel, live subagent token
streaming (`forwardSubagentText`); plus spatial agents-view, live-tail external
sessions, N-concurrent engines, fork-on-resume, global project switcher,
busy-switch detach-with-notice.

## Landmines (still live)

- **Wisp `options.model` = alias/family NAME, never a resolved model id** (hangs
  otherwise) — [[2026-07-24-wisp-alias-routes-by-name]].
- **New `window.api` channel → add to ALL FOUR mock sites** (`chat-harness.ts` +
  inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`.
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
