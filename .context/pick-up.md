---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg landed:** #3 (Folder pick → session start) — squash-merged to main as `c6be38c`, ticket closed with breadcrumb.

**Next ticket:** #4 — First chat turn end to end, text only (only unblocked `ready-for-agent`; #5–#7 hang off it, #8 off the batch).

**Landmines:**
- Fresh `npm install` may skip Electron's postinstall: `npm run dev` then fails with "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- `vite` must stay `^7` while `electron-vite` is v5 (peer range); `@vitejs/plugin-react` pinned `^5` to match. Don't bump vite to 8.
- TypeScript pinned exact `7.0.2` (native compiler) — deliberate, don't loosen or downgrade.
- Preload surface is `window.api` (`WrapperApi` in `src/preload/index.d.ts`); extend it there for engine IPC, don't invent a second bridge. Promise-returning mocks in tests need `vi.fn<() => Promise<...>>()` or web typecheck fails.
- Session cwd for the engine: `getSessionCwd()` from `src/main/session.ts` — set by the `session:pick-folder` handler; #4 should read it, not re-plumb.
- `Chat.tsx` is still the static sample conversation — #4 replaces it with real message state; it only renders once a session started (`App` gates on `cwd`), tests start sessions via the `startSession` helper pattern in `tests/shell.test.tsx`.
- #4 needs `@anthropic-ai/claude-agent-sdk` added as a dependency (engine in main process per spec #1); the fake-engine seam from the spec's Testing Decisions is the test boundary, not IPC mocks.
