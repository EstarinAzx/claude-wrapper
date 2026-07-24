---
type: pick-up
project: claude-wrapper
updated: 2026-07-24
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

> **New batch ready — spec #20, tickets #21–#24.** Grilled + specced 2026-07-24
> (`/preset init`): Electron zoom (#21), resizable sidebar (#22), input-box model
> picker (#23), subagent viewer (#24) — all `ready-for-agent`, none blocked,
> quick-wins-first. **Drain with `/relay N=1 /preset ticket-loop`** (one ticket
> per leg, self-paced, unattended-bypass → #21 first, self-closes spec #20 when
> the queue empties). Decisions:
> [[2026-07-24-ui-polish-model-picker-subagent-viewer]]; details in
> [[active-work]]. The prior spec-#16 chain (#17→#19) + spec #9 (#10–#14) are
> closed; `.claude/relay/ticket-loop.md` still holds the old `stop: true` — a
> fresh `/relay` re-inits it.

**This leg landed #19 (`0660ce6`)** — click-to-flip backend toggle:
- Titlebar pill → `<button>`; clicking flips the backend via new guarded IPC
  **`backend:set-mode`**, which reuses the `chat:target` teardown and clears the
  resume target so the flip is a **fresh chat**. `wisped` is refused when the
  launch env lacked wisp routing (native-lock).
- Main **broadcasts `backend:changed`**; `App` subscribes on mount and the pill
  re-renders from the broadcast. The lazy `chat:send` rebuilds the engine → next
  turn spawns against the new mode via the #17 resolver.
- Pill `disabled` while `busy` (reuses #14 block) + when wisped unavailable. See
  [[2026-07-24-click-flip-backend-toggle]]. Gate green: typecheck · **137/137** ·
  build.

**Also landed (interactive, post-chain) — permission-mode toggle (`16b0884`):**
a second titlebar pill cycles **Bypass → Accept Edits → Ask**, pinning
`permissionMode` into SDK query options (`src/main/permission-mode.ts`, default
**bypass**). Guarded IPC `permission:set-mode` rebuilds the engine but resumes
the current session (conversation kept, unlike a backend flip). Reverses
[[2026-07-23-permission-inherits-host]] → [[2026-07-24-in-app-permission-mode-toggle]].
⚠️ **Default bypass = auto-run every tool, no confirmation.** Gate green
(153/153).

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
