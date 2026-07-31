---
type: overview
project: claude-wrapper
updated: 2026-07-30
tags: [context, overview]
---

# Overview

**Project:** claude-wrapper
**One-liner:** Electron app that wraps the Claude Code CLI — Claude Code runs under the hood, a web UI replaces the raw terminal.

## Layout
- `src/main/` — Electron main process (window creation, acrylic config, IPC handlers).
  `session-index.ts` owns store path resolution: session id → real project
  directory by enumeration. Nothing may derive a store path from `cwd`. It also
  owns the failure/absence line (#60): `unavailable` when the store will not
  enumerate, `not-found` when it enumerates fine and lacks the id — and a failed
  build is never cached. `session-store.ts` carries that outward as `null` vs
  `[]` on both `listSessions` and `readTranscript`; `?? []` at a new call site
  restores the silent-empty-state bug.
  `switch-workspace.ts` owns the atomic workspace transition as a function over
  injected ports (the entry module is untestable under vitest); `index.ts` holds
  only the binding to the real engine, broker and cwd. `transcript.ts` parses the
  native JSONL to the replay list and owns `sanitizeUserText`, the one place CLI
  markup is turned into readable text — anchored on the message's leading tag,
  never matched mid-string. `model-mode.ts` holds ONLY the pick state: the model
  list comes from the CLI (`engine.listModels()` → `supportedModels()`), and
  `picked` (which becomes `options.model`) is kept apart from `reported` (what
  the CLI says it is running, display only).
- `src/preload/` — contextBridge `window.api` (+ `index.d.ts` global type, included by `tsconfig.web.json`)
- `src/renderer/` — React UI (`src/components/` Titlebar / Chat / InputBar).
  `styles.css` is a **23-line entry file**: Tailwind layer setup plus eleven
  `@import`s. The rules live in `src/renderer/src/styles/` — `tokens` · `base`
  (reset + the app-wide scrollbar rule + reduced-motion, global on purpose and
  never scoped to a component) · `shared` · `titlebar` · `rails` · `agent-map` ·
  `chat` · `composer` · `tool-card` · `markdown` · `subagent`.
  **The import order IS the cascade**: `tokens` → `base` → `shared` must stay
  first, because the shared groups (truncation triad, focus ring, the two hover
  washes, micro-caps label) are single-class rules that every component override
  is at least as specific as. Reordering those lines silently restyles the app.
  Tailwind's role is the `@theme` token store and nothing else — **no utility
  class is used anywhere in the app**. Two tests read the stylesheet as raw
  TEXT (over the whole `styles/` directory), so `.bubble` and `.message-input`
  must stay ungrouped and no comment may name a scrollbar pseudo-element or
  contain a closing brace. See
  [[2026-07-30-the-import-order-is-the-cascade]] and
  [[2026-07-30-tailwind-here-is-a-token-system-not-a-utility-system]].
  `useChat.ts` stores a tool result **complete** on both write paths
  (`toChatMessage` for replay, the `tool-result` handler for live) — #61 moved
  summarising to render time in `ToolCard`, so re-adding `resultSummary` at
  either write point restores the lossy-card bug and no rendering test can see
  it. `toolSummaries.ts` owns the render-time derivation: `resultSummary` scans
  forward with `firstLineBounds` (never `split('\n')` — it runs on the full
  result every render), `hasHiddenOutput` gates the output affordance, and
  `inputEntries` (#62) builds the key-sorted argument list — sorted because live
  and replayed objects need not share insertion order, and called only from the
  mounted branch so a collapsed card pays no stringify. `lineDiff.ts` (#63) is
  the pure replacement-hunk diff: suffix-LCS matrix in a `Uint32Array`, forward
  walk whose `>=` tie-break is what keeps removals ahead of additions (there is
  deliberately no coalescing pass — it was provably unreachable), and a hard
  `DIFF_CELL_GUARD` of 1,000,000 cells above which it returns the exact texts
  unaligned. `ToolCard` owns **three** disclosure booleans, one per region
  (output / input / change); a pending permission card renders the input
  inspector and the diff with no toggle at all, and a Write card renders a
  labelled content preview and **never** a diff.
  `App.tsx` owns the workspace switch: the `ok` branch is where every
  workspace-scoped App state must be cleared, and `<InputBar key={cwd}>` covers
  everything living inside the composer. Both entry points — a foreign session
  row and the sidebar's "Open project" affordance — share that one reset via a
  nullable `resumeId`.
- `src/shared/` — types + pure modules both processes import. `session-groups.ts`
  owns the sessions rail's filter/group/cap order; `cwd-key.ts` is the one
  directory fold (comparison only, never a path); `session-titles.ts` holds the
  enrichment predicate and the measured "substantive prompt" rule, with the
  renderer's promise cache beside it in `src/renderer/src/enriched-titles.ts`.
  `session-watcher.ts` owns live-tail's main half: ONE directory-level watch at
  a time, filtered to `<id>.jsonl`, debounced, epoch-fenced, behind an injected
  `WatchIo`. It emits a signal and nothing else — transcripts never travel
  through it.
- `src/main/cli-path.ts` — WHICH Claude Code binary runs. The host `claude` on
  PATH when there is one, else the SDK's bundled copy. A PATH walk, never a
  `which` shell-out.
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
- `.context/pick-up.md` — current frontier + landmines (currently: **spec #64
  sliced into #65–#70, four unblocked**; take #65 first to restore the driver
  gate, then #68 because its scope is still open)
- Tracker: **spec #58 (non-lossy tool inspector) delivered and closed** with
  #59 (replay text-block joining), #60 (the store's three silent failures),
  #61 (full output disclosure), #62 (structured input inspector) and #63 (Edit
  hunk diff); **spec #55 (live-tail) delivered and closed with
  #56 (gui-55 driver, red-verified) and #57 (live-tail core)**; **#52 (model pill follows the CLI),
  #53 (CLI-sourced model list), #54 (no resume before the first turn), #50 and
  #51 closed**; **spec #64 (Appearance panel + session deletion) OPEN with
  #65–#70 — the current queue, four unblocked, #69 blocked by #66 and #70 by
  #66+#67**; spec #41 (Resume anything)
  **delivered and closed** with tickets #43–#49; #42 (multiline composer) closed
  standalone; specs #25 (Agents surface), #26 (Attachments) and #36 (slash
  commands) delivered and closed with tickets #27–#40; closed specs #9 / #16 /
  #20 hold the earlier history. **#54** closed; open: the unlabelled umbrella **#1**

## Conventions
- One ticket per branch `ticket/<id>-<slug>`, squash-merged to main, gate green first
- `.context/` commits ride main only

## Map

- [[stack]] — languages, frameworks, env vars
- [[active-work]] — current handoff state
- [[pick-up]] — frontier ticket + landmines
- [[decisions]] — settled questions
- [[happy-path]] — golden-path MVD
