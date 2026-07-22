---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg landed:** #5 (Tool cards) — squash-merged to main as `c5526a4`, ticket closed with breadcrumb.

**Next ticket:** #6 — Permission allow/deny round-trip (oldest unblocked `ready-for-agent`; #7 Stop button and #8 Frost Mono polish are also unblocked).

**Landmines:**
- #6 requires replacing per-turn `query()` + `resume` with one long-lived streaming-input query; read `.context/decisions/2026-07-23-engine-per-turn-resume.md` before touching `src/main/engine.ts`. Keep the public `Engine` interface and `chat:event` boundary stable.
- SDK `canUseTool` exists only with streaming input. Permission response must hold the callback open across IPC, then resolve Allow/Deny without killing the session. Deny must let Claude continue to a text answer.
- Extend existing tool card keyed by `toolUseId`; do not create a permission-only event channel/component. Tool cards now store compact result summaries at event ingestion.
- Fake-engine seam: renderer tests script events via `tests/chat-harness.ts` `emit()`; permission tests should exercise the pending callback through the public preload API, not mock component internals.
- Real-SDK manual run still pending (see Open questions in `active-work.md`) — first human `npm run dev` should verify CLI-login auth, streamed deltas, SDK tool message shapes, and permission behavior.
- Fresh `npm install` may skip Electron's postinstall: `npm run dev` fails with "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- `vite` stays `^7`, `@vitejs/plugin-react` `^5`, TypeScript pinned exact `7.0.2` — don't bump any of them.
