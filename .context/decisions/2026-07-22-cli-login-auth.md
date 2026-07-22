---
type: decision
project: claude-wrapper
updated: 2026-07-22
tags: [context, decisions, auth]
---

# Auth via existing Claude Code CLI login

**Decision:** The wrapped CLI uses the machine's existing Claude Code login (subscription). No API key handling in the app.
**Why:** Personal tool; zero setup, no per-token API billing. Constraint accepted: app only works where `claude` is installed and logged in.
**Reversibility:** easy

## Related

- [[decisions]] — index
- [[2026-07-22-agent-sdk-engine]]
