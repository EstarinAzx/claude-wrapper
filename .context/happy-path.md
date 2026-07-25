---
type: happy-path
project: claude-wrapper
updated: 2026-07-25
tags: [happy-path, mvd]
---
# Happy Paths (MVD)

## One chat turn, folder to answer
- **Idea:** Electron glassy chat UI over Claude Agent SDK — a Claude Code session without the terminal.  **Mode:** ux+beat  **Actor:** the developer (app owner)  **Goal:** ask Claude Code something about a project and read the finished answer, approving one tool call on the way
- **Updated:** 2026-07-22

```mermaid
flowchart LR
  launch([Glassy shell opens]) -->|click Pick folder · native dialog| folder[Folder chosen]
  folder -->|shown as session header · cwd set for SDK| chat[Empty chat + input]
  chat -->|type prompt, Enter · IPC → main: sdk query starts| streaming[Assistant bubble grows]
  streaming -->|SDK emits tool_use · IPC → renderer| toolcard[Tool card appears]
  toolcard -->|click Allow · canUseTool resolves| toolrun[Card shows tool result]
  toolrun -->|SDK streams final text| answer[Finished markdown answer]
  answer -->|turn ends · input re-armed| done([Ready for next prompt])
```

Assumption noted, not drawn: Stop button exists in the core UI but interrupts a turn — it is an exit ramp, not part of the success spine.

## Watch agents work live (PRD A)
- **Idea:** a right-dock Agents panel — list ⇄ map — showing every subagent this session spawned, live.  **Mode:** ux+beat  **Actor:** the developer, mid-turn  **Goal:** see what each agent is doing and read one agent's full transcript without leaving the chat
- **Updated:** 2026-07-25

```mermaid
flowchart LR
  turn([Turn running, Task card visible]) -->|click Agents · titlebar toggle| dock[Right dock opens, list mode]
  dock -->|task_started · row per agent| rows[Rows: type · description · running]
  rows -->|task_progress · every tick| live[Tokens · tool_uses · elapsed · last tool]
  live -->|click Map| map[SVG fan: session node → agent nodes]
  map -->|click a node · subagents:transcript| drawer[Drawer: that agent's conversation]
  drawer -->|Esc · task_updated completed| settled([Dock shows finished agents, chat still visible])
```

Assumptions noted, not drawn: the spike that proves this CLI build emits `task_*` messages runs before any of this; nested agents indent via `parentAgentId` but nesting is 1-in-185 in practice, so the common map is a flat fan.

## Review a past session's agents (PRD A)
- **Idea:** the same panel, hydrated from disk, for a session opened out of the sidebar.  **Mode:** ux+beat  **Actor:** the developer, no turn running  **Goal:** reopen yesterday's session and read what its agents did
- **Updated:** 2026-07-25

```mermaid
flowchart LR
  pick([Click a session in the sidebar]) -->|transcript replays| replay[Chat shows past turn + Task cards]
  replay -->|click Agents · subagents:list reads meta sidecars| hydrated[Rows: type · description · model · depth]
  hydrated -->|click a row · reads agent-id.jsonl| drawer([Drawer: that agent's conversation])
```

Assumption noted, not drawn: disk rows carry no token numbers — usage lives only in live `task_progress`.

## Send a screenshot and a file (PRD B)
- **Idea:** paste an image, attach a file, ask about both in one prompt.  **Mode:** ux+beat  **Actor:** the developer at the input bar  **Goal:** get an answer that accounts for a screenshot and a project file
- **Updated:** 2026-07-25

```mermaid
flowchart LR
  input([Input focused]) -->|Ctrl+V image · size + type checked| thumb[Thumbnail chip in tray]
  thumb -->|click paperclip · dialog.showOpenDialog| picked[File chips, by absolute path]
  picked -->|type question, Enter · sendPrompt text + attachments| sent[User bubble with thumbnails]
  sent -->|image block in MessageParam · paths in text| model[Model sees image, Reads the file]
  model -->|answer streams| answer([Reply covering both])
```

Assumption noted, not drawn: on replay the same bubble shows `📎 image/png` chips, not thumbnails — the parser drops `source.data`.
