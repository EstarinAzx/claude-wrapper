---
type: stack
project: claude-wrapper
updated: 2026-07-23
tags: [context, stack]
---

# Stack

## Languages & runtime
- TypeScript 7.0.2 (native compiler, pinned exact — deliberate, don't loosen)
- Electron ^43 (main: CJS output, no `"type": "module"` in package.json)
- Node.js (Electron main / tooling)

## Frameworks
- React 19 renderer, electron-vite 5 build (vite pinned `^7` — electron-vite 5 peers ^5–^7, vite 8 breaks; `@vitejs/plugin-react` `^5` to match)
- vitest 4 + @testing-library/react + jsdom for the shell tests

## Key libraries
- Claude Agent SDK (`@anthropic-ai/claude-agent-sdk` ^0.3.217) — the engine, wrapped in `src/main/engine.ts` (see [[2026-07-23-engine-per-turn-resume]])
- `react-markdown` ^10 + `rehype-highlight` ^7 — assistant markdown + code highlighting in the renderer

## Env vars
- `ELECTRON_RENDERER_URL` — set by electron-vite dev, main loads it over the built file

## Gotchas
- Fresh install may skip Electron's postinstall → "Error: Electron uninstall" on `npm run dev`; fix with `node node_modules/electron/install.js`

## Related

- [[overview]] — project shape
- [[2026-07-22-react-vite-ts7]] — stack decision
