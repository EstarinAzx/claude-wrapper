---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg landed:** #2 (Scaffold + Frost Mono acrylic shell) — squash-merged to main as `5e019a9`, ticket closed with breadcrumb.

**Next ticket:** #3 — Folder pick → session start (only unblocked `ready-for-agent`; #4–#8 hang off it and #2).

**Landmines:**
- Fresh `npm install` may skip Electron's postinstall: `npm run dev` then fails with "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- `vite` must stay `^7` while `electron-vite` is v5 (peer range); `@vitejs/plugin-react` pinned `^5` to match. Don't bump vite to 8.
- TypeScript pinned exact `7.0.2` (native compiler) — deliberate, don't loosen or downgrade.
- Preload surface is `window.api` (`src/preload/index.d.ts`); extend it there for session/engine IPC, don't invent a second bridge.
- `Chat.tsx` is a static sample conversation — #4 replaces it with real state; #3 likely adds the session header (chosen folder) around it.
