---
type: decision
project: claude-wrapper
updated: 2026-07-22
tags: [context, decisions, engine]
---

# Engine = Claude Agent SDK in Electron main process

**Decision:** `@anthropic-ai/claude-agent-sdk` drives Claude Code from the Electron main process. Rejected: hand-spawning `claude -p --output-format stream-json`.
**Why:** Typed message stream, session resume, `canUseTool` callback maps 1:1 to UI permission buttons — no hand-parsed JSON protocol or process lifecycle code. SDK spawns the CLI internally.
**Reversibility:** easy

## Related

- [[decisions]] — index
- [[2026-07-22-cli-login-auth]]
