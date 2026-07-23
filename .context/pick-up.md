---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

> **Relay chain LIVE.** `relay-leg` chain is running in the background and is
> draining the spec #9 queue by itself, one ticket per leg. Only pick up
> manually if the chain died (not in `claude agents`, or
> `.claude/relay/relay-leg.md` shows `stop: true` before the queue emptied).
> Kill it with `/relay stop relay-leg`.

**Target ticket: #12** (open a past session — replay transcript) — oldest open
unblocked `ready-for-agent`. Batch = spec **#9**. After #12: #13 → #14 by
creation order (oldest-first frontier; no native dependency edges, so honour
this order).

**Queue (spec #9):**
- ~~**#10** Engine surfaces `session_id` + accepts resume~~ — **DONE** `67a22c5`
- ~~**#11** List sessions in a left sidebar~~ — **DONE** `f6644c2`
  (`session-store.ts`: `encodeCwd` + pure `summary()` + `listSessions()`;
  `session:list` IPC; `Sidebar`; 90/90).
- **#12** Open a past session — replay transcript — *unblocked, next* (new pure
  lenient transcript parser + make sidebar rows openable)
- **#13** Resume — continue a reopened session *(MVD)* — consumes `sessionId()`
  + `runTurn(..., resume)`
- **#14** Refresh + busy-switch polish

**Done last leg (#11, `f6644c2`):** past sessions list in a collapsible left
sidebar. Read seam for #12 is ready: `window.api.listSessions()` →
`SessionMeta[]`; `SessionMeta.id` = filename stem == sessionId = the join key to
load one session's `*.jsonl`. Sidebar rows are read-only (`.session-row`) — #12
makes them openable.

**Landmines (carry into every ticket):**
- **#12 parser:** reuse the lenient line-parse shape from `summary()` in
  `src/main/session-store.ts` — split lines, `JSON.parse` in try/catch, map
  known types (`user`/`assistant`, `message.content` is string OR an array of
  `{type:'text',text}` blocks; also tool_use/tool_result blocks), skip unknown,
  never throw. Keep it a NEW **pure** seam (fixture JSONL string → messages, no
  fs) so it's fixture-testable like `tests/session-store.test.ts`.
- **Native store is source of truth:** `~/.claude/projects/<enc-cwd>/*.jsonl`.
  `enc` = every non-alphanumeric char → `-` (see `encodeCwd`). Applied forward
  only; never reversed.
- Main process holds the session cwd and owns fs; IPC returns data, the renderer
  never gets raw fs access. Guard every new channel with the existing
  `isTrustedIpc` check.
- Engine exposes `sessionId(): string | null` + `runTurn(prompt, onEvent,
  resume?)`. Do NOT reintroduce a `session-id` event (accessor was deliberate —
  [[2026-07-23-session-id-accessor-not-event]]).
- Renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"/"Typing"/
  "Minimize"/"Maximize"/"Close", plus sidebar's "Collapse sessions"/"Expand
  sessions"/"Sessions" landmark), placeholder "Message Claude…", classes
  `.tool-card` / `.tool-card-error` / `.assistant-body` / `.msg-notice` /
  `.msg-error` / `.session-row`. ADD labels, never rename these. Every
  `window.api` mock (inline in tests + `tests/chat-harness.ts`) must include
  `listSessions` or an App-render test throws.
- Legible-error copy in `src/main/engine.ts` is character-pinned by
  `tests/engine.test.ts`.
- Don't add `permissionMode` / `settingSources` — wrapper inherits host
  permissions ([[2026-07-23-permission-inherits-host]]).
- Tailwind 4 `@theme` tokens in `src/renderer/src/styles.css`; preflight OFF.
  Change values in `@theme`, not the `:root` aliases. UI slices use the existing
  Frost Mono system vs `docs/design/frost-mono-reference.png`.
- Fresh `npm install` may skip Electron postinstall → `node node_modules/electron/install.js`.
  Pins that must not move: `vite ^7`, `@vitejs/plugin-react ^5`, `typescript 7.0.2`.
