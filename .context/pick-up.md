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

**Target ticket: #14** (refresh + busy-switch polish) — the **last** open
`ready-for-agent` in batch spec **#9**. Its blocker #13 is closed. After #14 the
spec #9 queue is empty → the relay body signals `stop: true` (no leg 6).

**Queue (spec #9):**
- ~~**#10** Engine surfaces `session_id` + accepts resume~~ — **DONE** `67a22c5`
- ~~**#11** List sessions in a left sidebar~~ — **DONE** `f6644c2`
- ~~**#12** Open a past session — replay transcript~~ — **DONE** `bb94e3d`
- ~~**#13** Resume — continue a reopened session (MVD)~~ — **DONE** `053ea95`
- **#14** Refresh + busy-switch polish — *unblocked, next (last)*

**Done last leg (#13, `053ea95`):** reopening a session continues it in place
(resume, not fork). Renderer owns `activeSessionId` (`useChat`); `openSession`
replays + `targetSession(id)`; `newChat` clears + `targetSession(null)`; the live
row is highlighted; main `chat:target` closes+rebuilds the engine with `resume`,
`chat:session-id` exposes the live id via the accessor. See
[[2026-07-23-resume-via-target-close-rebuild]].

**#14 shape (two halves):**
1. **Refresh:** the Sidebar list must refresh on window focus + via a manual
   control, so a session created in an external terminal appears without an app
   restart. Today `Sidebar.tsx` only fetches on `[cwd, activeId]` — generalise
   that. Keep the live-row highlight correct across refreshes.
2. **Busy-switch (the real carry from #13):** switching sessions / New chat
   *mid-stream* must be predictable (detach-with-notice or block) — no
   half-streamed answer leaking into another pane. Today `chat:target` in
   `src/main/index.ts` `engine.close()`s **unconditionally**, so a mid-stream
   switch tears down the running turn and the renderer sees a raw `query closed`
   error. Spec keeps **one live engine** (no concurrent streaming).

**Landmines (carry into #14):**
- **Resume ceiling:** the streaming query is built once and cached
  (`ensureQuery` early-returns once the queue exists). Retargeting `resume` on a
  live engine = rebuild the query (that's why `chat:target` does `close()` +
  fresh engine). Keep that; the #14 work is making the *mid-stream* teardown
  graceful, not removing the close. See
  [[2026-07-23-resume-via-target-close-rebuild]] +
  [[2026-07-23-session-id-accessor-not-event]].
- Engine exposes `sessionId(): string | null` + `runTurn(prompt, onEvent,
  resume?)`. Do NOT reintroduce a `session-id` event (accessor was deliberate).
  Renderer reads the id via `window.api.currentSessionId()` on `turn-end`.
- **Renderer state:** `activeSessionId` lives in `useChat`; the Sidebar takes it
  as `activeId` and highlights the matching row (`aria-current="true"` +
  `.session-row-btn-active`). `New chat` button = `aria-label="New chat"` in
  `.sidebar-head-actions`.
- **Native store is source of truth:** `~/.claude/projects/<enc-cwd>/*.jsonl`.
  `enc` = every non-alphanumeric char → `-` (see `encodeCwd`). `listSessions`
  already re-reads the dir each call — refresh is just calling it again.
- Main process holds the session cwd and owns fs; IPC returns data, the renderer
  never gets raw fs access. Guard every new channel with `isTrustedIpc`.
- Renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"/"Typing"/
  "Minimize"/"Maximize"/"Close", sidebar "Collapse sessions"/"Expand sessions"/
  "New chat"/"Sessions" landmark), placeholder "Message Claude…", classes
  `.tool-card` / `.tool-card-error` / `.assistant-body` / `.msg-notice` /
  `.msg-error` / `.session-row` / `.session-row-btn` / `.session-row-btn-active`.
  ADD labels, never rename. **Every `window.api` mock** (inline in tests +
  `tests/chat-harness.ts`) must include `listSessions`, `loadTranscript`,
  `targetSession`, and `currentSessionId` or an App-render test throws.
- Legible-error copy in `src/main/engine.ts` is character-pinned by
  `tests/engine.test.ts`.
- Don't add `permissionMode` / `settingSources` — wrapper inherits host
  permissions ([[2026-07-23-permission-inherits-host]]).
- Tailwind 4 `@theme` tokens in `src/renderer/src/styles.css`; preflight OFF.
  Change values in `@theme`, not the `:root` aliases. The one accent is
  `--color-mint`. UI slices use the existing Frost Mono system vs
  `docs/design/frost-mono-reference.png`.
- Fresh `npm install` may skip Electron postinstall → `node node_modules/electron/install.js`.
  Pins that must not move: `vite ^7`, `@vitejs/plugin-react ^5`, `typescript 7.0.2`.
