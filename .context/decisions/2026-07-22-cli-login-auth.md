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

## Carve-out (2026-07-24): wisped-mode env passthrough (#17)

The Native ⇄ Wisped backend toggle ([[2026-07-24-click-flip-backend-toggle]], spec #16)
narrows "no API key handling" but does not overturn it. In **wisped** mode the
app snapshots `ANTHROPIC_API_KEY` (with `ANTHROPIC_BASE_URL` + the gateway flag)
from its **launch env** and forwards them into the Claude Code spawn's
`options.env`. The app never **solicits, prompts for, persists, or writes** a key
— the snapshot lives in main-process memory only and never crosses IPC to the
renderer (`backend-mode.ts`). In **native** mode those vars are stripped from the
spawn env so the host `~/.claude` login resolves to the real Anthropic endpoint.
The "no key UX, nothing on disk" spirit holds; the app merely relays an env var
the user already exported to a child process it already controls.

## Related

- [[decisions]] — index
- [[2026-07-22-agent-sdk-engine]]
