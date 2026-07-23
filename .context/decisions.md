---
type: decisions-index
project: claude-wrapper
updated: 2026-07-23
tags: [context, decisions]
---

# Decisions

Settled questions. One file per decision in `decisions/`. Newest first.

<!-- one line per entry, newest at top -->
- [[2026-07-23-engine-terminal-on-stream-death]] — dead streaming query is terminal; recovery = new engine via folder pick
- [[2026-07-23-engine-per-turn-resume]] — engine MVP per-turn query+resume; streaming input deferred to #6/#7 (superseded by #6: streaming input landed)
- [[2026-07-23-bg-isolation-none]] — background legs edit the shared checkout (worktree.bgIsolation none)
- [[2026-07-22-glassy-acrylic-visual]] — glassy/acrylic visual identity (Win11 acrylic + glassmorphism)
- [[2026-07-22-dev-run-only]] — npm run dev only, no installer
- [[2026-07-22-react-vite-ts7]] — React + Vite + TypeScript 7.0.2 renderer
- [[2026-07-22-mvp-bare-core]] — v1 = folder picker + chat + tools + permissions + stop
- [[2026-07-22-cli-login-auth]] — reuse existing Claude Code CLI login, no API key
- [[2026-07-22-agent-sdk-engine]] — Claude Agent SDK in main process, not raw CLI spawn
- [[2026-07-22-custom-chat-ui-headless-engine]] — custom chat UI, not terminal embed

## Related

- [[overview]]
