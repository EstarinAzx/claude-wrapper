---
type: flows
project: claude-wrapper
updated: 2026-08-04
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

### Name collision — this dock is NOT the CLI's "agent view"

Claude Code has its own feature called **agent view**, opened with `←` on an
empty prompt, `claude agents`, or `/bg`. The names collide and the scopes are
close to **inverses**, so "the agents view" is ambiguous in any ticket, comment
or handoff note about this app — say which one.

| | this app's Agents dock | the CLI's agent view |
|---|---|---|
| shape | in-flow `<aside>`, chat narrows beside it | takes over the whole terminal |
| unit | subagents **inside** one open session | whole **background sessions**, each a full conversation |
| lists subagents? | **yes — that is the point** | **no.** Subagents and teammates a session spawns are explicitly not rows |
| scope | the one session on screen | all sessions, all projects, unless `--cwd` scopes it |
| shell jobs | `local_bash` in the Background strip | `!` / `--bg --exec` jobs appear as their own rows |

Two consequences worth carrying:

- ~~**This app has no equivalent of agent view.**~~ **No longer true as of #91
  (`5e6699b`, 2026-08-04).** The app now lists live background *sessions* — as a
  **section in the sessions rail**, above the stored transcripts: read-only,
  workspace-scoped, refreshed only by its own button or a workspace change. It
  did not need a new top-level surface after all, because #86 owner call 1 was
  answered "a section in an existing surface", and a section needs no titlebar
  toggle. See
  [[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]].
  **The collision it creates is now on screen**, which makes the table above
  load-bearing rather than merely informative: live background sessions sit
  directly above stored transcripts in one rail, while the Agents dock lists
  subagents inside the open session. Three meanings of "agent", two of them
  visible in the same component.
- **"Agent" now carries a third meaning here.** `background-tasks.ts` already
  reconciles two CLI vocabularies (the level's `local_agent` discriminant vs
  `BackgroundTaskSummary`'s friendly `subagent` label); the CLI's session-level
  "agent" is a third. If a rename in this area is ever proposed, this is the
  argument for it — and the reason not to reuse the bare word in new code.

Measured against the docs on 2026-08-03 ([interactive-mode](https://code.claude.com/docs/en/interactive-mode),
[agent-view](https://code.claude.com/docs/en/agent-view)); agent view is
research preview, v2.1.139+, and this host runs 2.1.220, so it is available
here. ~~Read from the docs, **not** exercised.~~ **Exercised since:** #90 ran
`claude agents --json` against this machine (6 active rows, 18 with `--all`,
median 893ms per call) and #91 now runs it from main on every look, so the table
above is measured behaviour rather than documentation.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-04-the-agent-view-costs-a-process-so-the-user-pays-for-it]] — **#91, the section that closed the "no equivalent" gap**
- [[2026-08-03-background-sessions-are-reachable-at-one-process-per-look]] — #90, the numbers behind it
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83, the background-tasks level
- [[2026-08-01-nesting-happens-in-the-render-not-the-model]] — #85, the nest-or-fallback split
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84, where the parentage comes from
