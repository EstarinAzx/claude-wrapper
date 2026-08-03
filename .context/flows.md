---
type: flows
project: claude-wrapper
updated: 2026-08-03
tags: [flows]
---

# Flows

## Agents dock — opening it, and where background tasks render

- **Question:** how the Agents dock opens and where background agents/tasks render — from titlebar button through preload to the renderer dock  **Lens:** understand
- **Summary:** The titlebar's three-node graph button toggles App's single-slot `openDock` state to `'agents'`, mounting `AgentsDock` — which lists subagents merged from disk sidecars plus the live stream, and renders background tasks either nested under their owning agent or in a separate "Background" strip below.
- **Entry:** `src/renderer/src/App.tsx:224` — `onToggleAgents={cwd ? … : undefined}`, the gate that makes the button exist at all
- **Key files:** `src/renderer/src/App.tsx` · `src/renderer/src/components/Titlebar.tsx` · `src/renderer/src/components/AgentsDock.tsx` · `src/renderer/src/useChat.ts` · `src/main/engine.ts`
- **Notes for the next pass:**
  - The button is gated on `cwd`, so **no folder open means no button** — the commonest "where is it".
  - `openDock` is **one slot**: agents / commands / appearance swap rather than stack.
  - `backgroundTasks` is a **separate prop** from `liveAgents` all the way to the DOM (`App.tsx:346`) — a merged row would claim a shell command ran as an agent.
  - The set is held in `useChat` (`useChat.ts:111`, `:301`), **not** in the dock — the dock unmounts on every close and the level only re-fires on a membership change.
  - `nonAgentTasks` (`AgentsDock.tsx:216`) drops `local_agent`, else every subagent appears twice under two names.
  - Owned tasks nest under their agent's `<li>` (`AgentsDock.tsx:380`); everything else falls to the "Background" section (`AgentsDock.tsx:406`), which renders **only** when non-empty and is **non-interactive** — no sidecar, no transcript.
  - Three tagged `DockState` values, so "none spawned" and "could not read" stay different facts (`AgentsDock.tsx:26-29`).
- **Confirmed on screen 2026-08-03** by `.claude/skills/run-desktop/gui-agents-dock.mjs` — 13/13 checks, exit 0, no CLI turns. The background half is driven by a **synthetic** `tasks:changed` push from main, so it measures the *renderer's* draw of a pushed set and says nothing about whether the CLI emits the level (that is #81's separate measurement).
- **Instrument note, unresolved:** at the app's persisted 688×640 bounds the dock photographs fine. Enlarge the window mid-run and the DOM still reports `.agents-dock` and both titlebar toggles present while the **frame shows neither** — pixels and DOM disagree microseconds apart, under `--disable-gpu`. Treated as an instrument/compositor artifact, **not** verified as either that or an app defect. A driver that resizes therefore revokes what it measures (#77) — `gui-agents-dock.mjs` collapses the sessions rail instead of resizing. Anyone shooting a wide window should settle this first.
- **Not verified:** `mergeAgents` / `buildAgentTree` internals; the disk-read path and `subagent-store.ts`; whether the wide-window paint gap is real.
- **Updated:** 2026-08-03

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83, the background-tasks level
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — #85, the nest-or-fallback split
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84, where the parentage comes from
