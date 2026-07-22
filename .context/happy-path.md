---
type: happy-path
project: claude-wrapper
updated: 2026-07-22
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
