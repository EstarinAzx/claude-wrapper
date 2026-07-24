---
type: decision
project: claude-wrapper
date: 2026-07-24
tags: [context, decision, ui, model-picker, subagents]
---

# UI polish + model picker + subagent viewer (batch)

One spec, 4 independent vertical slices, quick-wins-first order. Grilled 2026-07-24.

## Slice 1 — Zoom / bigger UI
Electron `webContents` zoom; default bumped ~1.1 (starts zoomed-in). `Ctrl/Cmd +/-/0`
live adjust; level persisted via `localStorage`.

## Slice 2 — Resizable sidebar
Drag right edge, bounds ~180–480px, disabled while collapsed. Width persisted via
`localStorage`. **First `localStorage` use** — new rule: UI-layout prefs persist,
engine-intent state (backend/permission/model) stays in-memory.

## Slice 3 — Model picker (input box)
Pill bottom-right of input bar → SDK `options.model`. List = families + custom
aliases, **dynamic** from `wisp routing --json`, **mode-aware** (Wisped →
families+aliases; Native → 4 families only). Switch **keeps conversation**
(rebuild+resume, like the permission pill); disabled while busy. In-memory, no
persist, rides CLI default. New `model-mode.ts` (mirrors `permission-mode.ts`) +
guarded IPC `model:list` / `model:set`. Reverses nothing — net-new.

## Slice 4 — Subagent working-list + preview
**Hybrid**: live list from default stream heartbeat (subagent tool_use/tool_result
carry `parent_tool_use_id`); click → full transcript on demand from disk via SDK
`getSubagentMessages(sessionId, agentId)` (`listSubagents` to enumerate). UI: Task
`ToolCard` grows live "N agents working" list; click → slide-over **drawer** reusing
chat/ToolCard rendering, read-only. Scope: **live turn only** (history later),
**flat one level** (nested deferred). Dedicated Agents panel = deferred alternative.

## Landmines
- Correlate live `parent_tool_use_id` ↔ persisted `agentId` (SubagentStart/Stop
  hooks carry `agent_id`; main-jsonl sidechain records also carry `agentId`).
- Verify a Wisp **alias** (e.g. `grok`) routes when passed as `options.model` —
  families documented to resolve, aliases need a build-time check.
- New `window.api` channels must be added to every mock (tests + `chat-harness.ts`)
  or App-render tests throw. Guard every IPC channel with `isTrustedIpc`.

## Related
- [[2026-07-24-in-app-permission-mode-toggle]] — the store/IPC pattern slice 3 mirrors
- [[2026-07-24-click-flip-backend-toggle]] — the rebuild-teardown precedent
