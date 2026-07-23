---
type: overview
project: claude-wrapper
updated: 2026-07-23
tags: [context, overview]
---

# Overview

**Project:** claude-wrapper
**One-liner:** Electron app that wraps the Claude Code CLI — Claude Code runs under the hood, a web UI replaces the raw terminal.

## Layout
- `src/main/` — Electron main process (window creation, acrylic config, IPC handlers)
- `src/preload/` — contextBridge `window.api` (+ `index.d.ts` global type, included by `tsconfig.web.json`)
- `src/renderer/` — React UI (`src/components/` Titlebar / Chat / InputBar, `styles.css` holds the OKLCH tokens in a Tailwind 4 `@theme` block + the custom component CSS)
- `tests/` — vitest + testing-library shell tests (jsdom, `vitest.config.ts`)
- `DESIGN.md` / `PRODUCT.md` — Frost Mono design system + product context (impeccable reads these)
- `docs/design/frost-mono-reference.png` — canonical visual reference

## How to run
- `npm run dev` — electron-vite dev (Electron window)
- `npm run typecheck` / `npm test` / `npm run build` — the merge gate

## Where to look first
- `.context/pick-up.md` — current frontier + landmines (currently: queue empty)
- Tracker: spec #1 (MVP, umbrella) and spec #9 (session history batch, closed —
  tickets #10–#14 all delivered) hold the history

## Conventions
- One ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green first
- `.context/` commits ride main only

## Map

- [[stack]] — languages, frameworks, env vars
- [[active-work]] — current handoff state
- [[pick-up]] — frontier ticket + landmines
- [[decisions]] — settled questions
- [[happy-path]] — golden-path MVD
