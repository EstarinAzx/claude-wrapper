---
type: pick-up
project: claude-wrapper
updated: 2026-07-24
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

> **Queue empty — relay chain finished.** The `relay-leg` chain drained the
> spec #9 batch (legs 1–5: #10 → #11 → #12 → #13 → #14) and signalled
> `stop: true`; there is no leg 6 and nothing is running in the background. Spec
> #9 is closed. Do **not** restart the chain — there is no ticket for it to pick.

**This leg landed #14 (`80591fb`)** — refresh + busy-switch polish, renderer-only:
- Sidebar refreshes on window focus + a manual **Refresh sessions** button
  (stale-drop via a monotonic request-id ref); external-terminal sessions now
  appear without an app restart.
- Mid-stream switching is **blocked**: session rows + New chat are `disabled`
  while `busy`, and `useChat.openSession`/`newChat` guard on `busy` — no
  half-streamed answer can leak into another pane. Stop is the escape hatch. See
  [[2026-07-23-busy-switch-block-not-detach]].
- Gate green: typecheck · **109/109** · build.

**Also landed (interactive, post-chain) — #15 (`31e7910`):** the visible
busy-state affordance #14 lacked. Disabled session rows + New chat now dim to
0.55 + `pointer-events: none` while a turn streams (active mint bar stays,
dimmed); head glyph gap 2px→4px. CSS-only, via impeccable/polish vs Frost Mono;
closed the #11 sidebar-eyeball loose end. Gate green (109/109).

**Next unblocked `ready-for-agent` ticket:** none — **queue empty.** The only
open issue is **#1** (original MVP umbrella spec, unlabelled), which is not
agent-ready. New work needs a fresh spec.

**If you want to continue the product:** pick from Deferred in [[active-work]]
(spatial agents-view, live-tail external sessions, N-concurrent engines,
fork-on-resume, global project switcher) and run the normal
`/preset init` → to-spec → to-tickets flow to seed a new batch. This is a human
call, not an agent auto-pick.

**Landmines carried forward (for whoever builds next):**
- **Resume ceiling:** the streaming query is built once and cached
  (`ensureQuery` early-returns once the queue exists). Retargeting `resume` on a
  live engine = rebuild the query — that's why `chat:target` does `close()` +
  fresh engine. #14 did **not** remove that; it blocked switching *while busy* so
  the mid-stream `close()` is never hit. See
  [[2026-07-23-resume-via-target-close-rebuild]] +
  [[2026-07-23-busy-switch-block-not-detach]].
- Engine exposes `sessionId(): string | null` + `runTurn(prompt, onEvent,
  resume?)`. Do NOT reintroduce a `session-id` event (accessor was deliberate).
  Renderer reads the id via `window.api.currentSessionId()` on `turn-end`.
- **Renderer state:** `activeSessionId` lives in `useChat`; the Sidebar takes it
  as `activeId` and highlights the matching row (`aria-current="true"` +
  `.session-row-btn-active`). Head buttons: `aria-label` `"Refresh sessions"`,
  `"New chat"`, `"Collapse sessions"`/`"Expand sessions"`, all in
  `.sidebar-head-actions`.
- **Native store is source of truth:** `~/.claude/projects/<enc-cwd>/*.jsonl`.
  `enc` = every non-alphanumeric char → `-` (see `encodeCwd`). `listSessions`
  re-reads the dir each call — that's what refresh leans on.
- Main process holds the session cwd and owns fs; IPC returns data, the renderer
  never gets raw fs access. Guard every new channel with `isTrustedIpc`.
- Renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"/"Typing"/
  "Minimize"/"Maximize"/"Close", sidebar "Collapse sessions"/"Expand sessions"/
  "New chat"/"Refresh sessions"/"Sessions" landmark), placeholder
  "Message Claude…", classes `.tool-card` / `.tool-card-error` /
  `.assistant-body` / `.msg-notice` / `.msg-error` / `.session-row` /
  `.session-row-btn` / `.session-row-btn-active`. ADD labels, never rename.
  **Every `window.api` mock** (inline in tests + `tests/chat-harness.ts`) must
  include `listSessions`, `loadTranscript`, `targetSession`, and
  `currentSessionId` or an App-render test throws.
- Legible-error copy in `src/main/engine.ts` is character-pinned by
  `tests/engine.test.ts`.
- Don't add `permissionMode` / `settingSources` — wrapper inherits host
  permissions ([[2026-07-23-permission-inherits-host]]).
- Tailwind 4 `@theme` tokens in `src/renderer/src/styles.css`; preflight OFF.
  Change values in `@theme`, not the `:root` aliases. The one accent is
  `--color-mint`. UI slices use the Frost Mono system vs
  `docs/design/frost-mono-reference.png`.
- Fresh `npm install` may skip Electron postinstall → `node node_modules/electron/install.js`.
  Pins that must not move: `vite ^7`, `@vitejs/plugin-react ^5`, `typescript 7.0.2`.
