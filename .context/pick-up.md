---
type: pick-up
project: claude-wrapper
updated: 2026-07-24
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last session (interactive):** delivered + CLOSED **spec #20** (all four slices
on main, gate-green) and hotfixed a shipped bug. main at **`f94f1a2`**.

- **#24 subagent viewer** → `76349e6`, live-eyeballed (row + drawer render under
  Wisped/Bypass). Spec #20 closed.
- **grok-alias hang HOTFIX** → `f94f1a2`: the model pill now sends the Wisp alias
  **name** as `options.model`, not the resolved id (a resolved id hangs the turn).
  See [[2026-07-24-wisp-alias-routes-by-name]].
- Subagent upstream-refusal question: **resolved, not our bug** — owner ran grok
  subagents fine via a `/slot` rebind. No tracker issue.

## Next task — markdown tables render as raw text (small, ~1 file)

`src/renderer/src/components/Chat.tsx:95` renders assistant markdown with
`<ReactMarkdown rehypePlugins={[rehypeHighlight]}>` and **no `remarkPlugins`**;
`remark-gfm` is **not** a dependency. react-markdown v10 needs `remark-gfm` for
GFM **tables** (and strikethrough / task-lists / autolinks), so a model emitting a
`| … | … |` table shows as raw inline pipes (owner hit this live). **Fix:** add
`remark-gfm` + `remarkPlugins={[remarkGfm]}`. This also fixes the **subagent
drawer** (it reuses `<Chat>`). Add a `tests/chat.test.tsx` case asserting a table
markdown renders a `<table>`. Owner floated "or a snippet block" — proper table
rendering is the cleaner call. Then run the gate (typecheck · test · build).

After that, **queue is empty** — new product work needs a fresh spec
(`/preset init` → to-spec → to-tickets); owner-pick, not agent auto-pick. Deferred
options in [[active-work]] (#24 follow-ons: historical/nested subagents, Agents
panel, live subagent streaming; plus spatial agents-view, N-concurrent engines,
fork-on-resume, global project switcher).

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
