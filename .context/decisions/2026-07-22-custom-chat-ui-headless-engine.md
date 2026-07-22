---
type: decision
project: claude-wrapper
updated: 2026-07-22
tags: [context, decisions, ui]
---

# Custom chat UI over headless engine (not embedded terminal)

**Decision:** The app renders its own chat UI (bubbles, markdown, tool cards, permission buttons); Claude Code runs headless underneath. Rejected: xterm.js terminal embed, hybrid.
**Why:** The UI is the point of the product — a terminal embed would barely differ from a terminal. Cost accepted: we reimplement the UX surface (streaming, tools, permissions).
**Reversibility:** hard

## Related

- [[decisions]] — index
- [[2026-07-22-agent-sdk-engine]]
