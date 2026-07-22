---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg landed:** #4 (First chat turn end to end, text only) — squash-merged to main as `b60c0dd`, ticket closed with breadcrumb.

**Next ticket:** #5 — Tool cards (oldest unblocked `ready-for-agent`; #7 Stop button is also unblocked, #6 permissions hangs off #5, #8 polish off the batch).

**Landmines:**
- #5/#6 need new engine event kinds: extend the `EngineEvent` union in `src/shared/engine-types.ts` (currently `text-delta` / `turn-end` / `error`) — don't invent a second channel; `chat:event` carries everything.
- The engine forwards SDK messages in `src/main/engine.ts` — tool_use/tool_result arrive as SDK `assistant`/`user` messages (content blocks), NOT stream_events; the mapping switch needs new arms. `SdkMessage` is structural on purpose so `tests/engine.test.ts` can stub without SDK types.
- #6 (canUseTool) and #7 (interrupt) require the streaming-input engine rewrite — see `.context/decisions/2026-07-23-engine-per-turn-resume.md`. #5 alone does NOT: tool cards are display-only and per-turn query still emits tool events.
- Fake-engine seam: renderer tests script events via `tests/chat-harness.ts` `emit()`; keep new UI tests on that harness, no IPC mocks.
- Real-SDK manual run still pending (see Open questions in `active-work.md`) — first human `npm run dev` should verify CLI-login auth + streamed deltas.
- Fresh `npm install` may skip Electron's postinstall: `npm run dev` fails with "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- `vite` stays `^7`, `@vitejs/plugin-react` `^5`, TypeScript pinned exact `7.0.2` — don't bump any of them.
