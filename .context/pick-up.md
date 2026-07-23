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

**Target ticket: #13** (resume — continue a reopened session, MVD) — oldest open
unblocked `ready-for-agent`. Batch = spec **#9**. After #13: #14 by creation
order (oldest-first frontier; no native dependency edges, so honour this order).

**Queue (spec #9):**
- ~~**#10** Engine surfaces `session_id` + accepts resume~~ — **DONE** `67a22c5`
- ~~**#11** List sessions in a left sidebar~~ — **DONE** `f6644c2`
- ~~**#12** Open a past session — replay transcript~~ — **DONE** `bb94e3d`
  (`transcript.ts` pure `parseTranscript`; `TranscriptMessage` shared type;
  `readTranscript` + `session:transcript` IPC + `loadTranscript` preload;
  sidebar rows → buttons → `useChat.replay`; 99/99)
- **#13** Resume — continue a reopened session *(MVD)* — *unblocked, next*
- **#14** Refresh + busy-switch polish

**Done last leg (#12, `bb94e3d`):** clicking a sidebar row replays its
transcript into the chat (read-only). Seam for #13 is ready:
`window.api.loadTranscript(id)` → `TranscriptMessage[]` → `useChat.replay()`
renders it, but the input is **not** yet armed to continue.

**#13 shape:** on opening a row, remember its `id`; sending should route through
the engine with that `id` as `resume` so appended turns land in the same
`*.jsonl`. Add a "New chat" control (fresh session, no resume).

**Landmines (carry into every ticket):**
- **Resume ceiling:** the streaming query is built once and cached
  (`ensureQuery` early-returns once the queue exists), so retargeting `resume`
  on a *live* engine means rebuilding the query (or `close()` + a fresh engine
  on foreground switch). See [[2026-07-23-session-id-accessor-not-event]].
- Engine exposes `sessionId(): string | null` + `runTurn(prompt, onEvent,
  resume?)`. Do NOT reintroduce a `session-id` event (accessor was deliberate).
- **Replay seam (#12):** `parseTranscript` is a NEW **pure** main function
  (fixture JSONL string → `TranscriptMessage[]`, no fs) — reuse it, don't
  re-parse. Tool results are summarised in the renderer (`resultSummary` in
  `useChat.toChatMessage`), NOT in the parser (parser keeps raw text). See
  [[2026-07-23-transcript-parser-pure-renderer-summarises]].
- **Native store is source of truth:** `~/.claude/projects/<enc-cwd>/*.jsonl`.
  `enc` = every non-alphanumeric char → `-` (see `encodeCwd`). Forward only.
- Main process holds the session cwd and owns fs; IPC returns data, the renderer
  never gets raw fs access. Guard every new channel with `isTrustedIpc`.
- Renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"/"Typing"/
  "Minimize"/"Maximize"/"Close", plus sidebar's "Collapse sessions"/"Expand
  sessions"/"Sessions" landmark), placeholder "Message Claude…", classes
  `.tool-card` / `.tool-card-error` / `.assistant-body` / `.msg-notice` /
  `.msg-error` / `.session-row` / `.session-row-btn`. ADD labels, never rename.
  Every `window.api` mock (inline in tests + `tests/chat-harness.ts`) must now
  include **both** `listSessions` and `loadTranscript` or an App-render test
  throws.
- Legible-error copy in `src/main/engine.ts` is character-pinned by
  `tests/engine.test.ts`.
- Don't add `permissionMode` / `settingSources` — wrapper inherits host
  permissions ([[2026-07-23-permission-inherits-host]]).
- Tailwind 4 `@theme` tokens in `src/renderer/src/styles.css`; preflight OFF.
  Change values in `@theme`, not the `:root` aliases. UI slices use the existing
  Frost Mono system vs `docs/design/frost-mono-reference.png`.
- Fresh `npm install` may skip Electron postinstall → `node node_modules/electron/install.js`.
  Pins that must not move: `vite ^7`, `@vitejs/plugin-react ^5`, `typescript 7.0.2`.
