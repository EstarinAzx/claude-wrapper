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

**Target ticket: #11** (list sessions in a left sidebar) — oldest unblocked
`ready-for-agent`. Batch = spec **#9**. After #11: #12 → #13 → #14 as blockers
clear.

**Queue (spec #9):**
- ~~**#10** Engine surfaces `session_id` + accepts resume~~ — **DONE** `67a22c5`
  (`sessionId()` accessor + `runTurn(..., resume)`; 81/81).
- **#11** List sessions in a left sidebar — *unblocked* (store reader + pure `summary()` + sidebar)
- **#12** Open a past session — replay transcript — blocked by #11 (pure lenient parser)
- **#13** Resume — continue a reopened session *(MVD)* — blocked by #10 (done), #12
- **#14** Refresh + busy-switch polish — blocked by #13

**Done last leg (#10, `67a22c5`):** engine session-aware — see
[[2026-07-23-session-id-accessor-not-event]]. Accessor not event; resume binds
at query construction. `EngineEvent` + renderer untouched.

**Landmines (carry into every ticket):**
- Reuse test seams: engine `queryFn` stub (`tests/engine.test.ts` `streamingStub`,
  inspect `calls[].options`); one NEW pure parser seam (fixture JSONL string →
  messages, no fs); renderer sidebar via existing testing-library seam
  (`tests/session.test.tsx`, `chat-harness.ts`).
- Native store is source of truth: `~/.claude/projects/<enc-cwd>/*.jsonl`.
  `enc` = every non-alphanumeric char → `-` (verified `D---claude-...-4`).
  Applied forward only (cwd→dir); never reversed. Parser is **lenient** — map
  known line types, skip unknown, never throw.
- Engine now exposes `sessionId(): string | null` + `runTurn(prompt, onEvent,
  resume?)`. #11 wiring for the live-row highlight can read `sessionId()`; do
  NOT reintroduce a `session-id` event (accessor was deliberate — see decision).
- Renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"/"Typing"),
  placeholder "Message Claude…", classes `.tool-card` / `.tool-card-error` /
  `.assistant-body` / `.msg-notice` / `.msg-error`. Sidebar ADDS labels, never
  renames these.
- Legible-error copy in `src/main/engine.ts` is character-pinned by
  `tests/engine.test.ts`.
- Don't add `permissionMode` / `settingSources` — wrapper inherits host
  permissions by design ([[2026-07-23-permission-inherits-host]]).
- Tailwind 4 `@theme` tokens in `src/renderer/src/styles.css`; preflight OFF.
  Change values in `@theme`, not the `:root` aliases. UI slices run impeccable
  vs `docs/design/frost-mono-reference.png`.
- Fresh `npm install` may skip Electron postinstall → `node node_modules/electron/install.js`.
  Pins that must not move: `vite ^7`, `@vitejs/plugin-react ^5`, `typescript 7.0.2`.
