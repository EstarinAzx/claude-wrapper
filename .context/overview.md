---
type: overview
project: claude-wrapper
updated: 2026-07-28
tags: [context, overview]
---

# Overview

**Project:** claude-wrapper
**One-liner:** Electron app that wraps the Claude Code CLI — Claude Code runs under the hood, a web UI replaces the raw terminal.

## Layout
- `src/main/` — Electron main process (window creation, acrylic config, IPC handlers).
  `session-index.ts` owns store path resolution: session id → real project
  directory by enumeration. Nothing may derive a store path from `cwd`.
  `switch-workspace.ts` owns the atomic workspace transition as a function over
  injected ports (the entry module is untestable under vitest); `index.ts` holds
  only the binding to the real engine, broker and cwd.
- `src/preload/` — contextBridge `window.api` (+ `index.d.ts` global type, included by `tsconfig.web.json`)
- `src/renderer/` — React UI (`src/components/` Titlebar / Chat / InputBar, `styles.css` holds the OKLCH tokens in a Tailwind 4 `@theme` block + the custom component CSS).
  `App.tsx` owns the workspace switch: the `ok` branch is where every
  workspace-scoped App state must be cleared, and `<InputBar key={cwd}>` covers
  everything living inside the composer. Both entry points — a foreign session
  row and the sidebar's "Open project" affordance — share that one reset via a
  nullable `resumeId`.
- `src/shared/` — types + pure modules both processes import. `session-groups.ts`
  owns the sessions rail's filter/group/cap order; `cwd-key.ts` is the one
  directory fold (comparison only, never a path).
- `tests/` — vitest + testing-library shell tests (jsdom, `vitest.config.ts`)
- `DESIGN.md` / `PRODUCT.md` — Frost Mono design system + product context (impeccable reads these)
- `docs/design/frost-mono-reference.png` — canonical visual reference

## How to run
- `npm run dev` — electron-vite dev (Electron window)
- `npm run typecheck` / `npm test` / `npm run build` — the merge gate
- **GUI check (agent/headless):** `run-desktop` skill —
  `node .claude/skills/run-desktop/driver.mjs [--cycle]` launches the built app,
  reads the titlebar pills, screenshots the window (needs `npm run build` +
  `npm i --no-save playwright-core`)

## Where to look first
- `.context/pick-up.md` — current frontier + landmines (currently: **spec #41,
  Resume anything** — #49 is the last open ticket)
- Tracker: open spec #41 (Resume anything, ticket #49 open, #43 + #44 + #45 +
  #46 + #47 + #48 closed); #42 (multiline
  composer) closed standalone; specs #25 (Agents surface), #26 (Attachments)
  and #36 (slash commands) delivered and closed with tickets #27–#40; closed
  specs #9 / #16 / #20 and the unlabelled umbrella #1 hold the history

## Conventions
- One ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green first
- `.context/` commits ride main only

## Map

- [[stack]] — languages, frameworks, env vars
- [[active-work]] — current handoff state
- [[pick-up]] — frontier ticket + landmines
- [[decisions]] — settled questions
- [[happy-path]] — golden-path MVD
