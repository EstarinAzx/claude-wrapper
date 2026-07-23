---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Target ticket: #10** (oldest unblocked `ready-for-agent`). Batch = spec **#9**
(session history / switching / agents view). Frontier: **#10 and #11 are both
unblocked** — pick #10 first (N=1, oldest). Then #11, then #12 → #13 → #14 as
blockers clear.

**Queue (spec #9):**
- **#10** Engine surfaces `session_id` + accepts resume — *no blockers* (prefactor, engine seam)
- **#11** List sessions in a left sidebar — *no blockers* (store reader + pure `summary()` + sidebar)
- **#12** Open a past session — replay transcript — blocked by #11 (pure lenient parser)
- **#13** Resume — continue a reopened session *(MVD)* — blocked by #10, #12
- **#14** Refresh + busy-switch polish — blocked by #13

**Done since last leg:** interrupt (old #4) verified by owner at `npm run dev`
(Stop mid-stream → "Stopped", no red card). MVP spine fully closed.

**Landmines (carry into every ticket):**
- Reuse test seams: engine `queryFn` stub (`tests/engine.test.ts` `streamingStub`,
  inspect `calls[].options`) for session_id + `resume`; one NEW pure parser seam
  (fixture JSONL string → messages, no fs); renderer sidebar via existing
  testing-library seam (`tests/session.test.tsx`, `chat-harness.ts`).
- Native store is source of truth: `~/.claude/projects/<enc-cwd>/*.jsonl`.
  `enc` = every non-alphanumeric char → `-` (verified `D---claude-...-4`).
  Applied forward only (cwd→dir); never reversed. Parser is **lenient** — map
  known line types, skip unknown, never throw.
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
- Not pushed: local `main` is 3 commits ahead of `origin/main`.
