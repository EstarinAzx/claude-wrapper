---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**No open work ticket.** This session ran the real-SDK manual verification and landed a
Tailwind 4 + darker-palette change (`c7e06d5` on main, gate green). Two carried-forward
items below; neither is started.

**Carried forward (pick either, or ask the owner):**
- **Interrupt (#4)** — the one manual-run spine step still unverified. Needs a human at
  `npm run dev`: send a long prompt, click **Stop** mid-stream, confirm it shows
  "Cancelled" / turn-aborted, not a red error card. Pure verification, no code expected.
- **Persistent acrylic-on-blur** — deferred with a documented trade-off
  ([[2026-07-23-persistent-glass-deferred]]). Only pick up if the owner wants to spend a
  native/FFI dep (keep exact glass, drag-lag cost) or switch to Mica (native, stable,
  loses blur-behind). Main-process work (`src/main/index.ts:38`), NOT impeccable.

**Landmines (unchanged + new):**
- Renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"/"Typing"), placeholder
  "Message Claude…", and classes `.tool-card` / `.tool-card-error` / `.assistant-body` /
  `.msg-notice` / `.msg-error`. Don't rename them.
- Legible-error copy in `src/main/engine.ts` is pinned character-for-character by
  `tests/engine.test.ts`.
- **Tailwind 4 is in.** Tokens live in the `@theme` block in `src/renderer/src/styles.css`;
  preflight is deliberately OFF (turning it on clobbers the mint markdown/list markers and
  button styling). Legacy `--wash` / `--mint` / `--r-bubble` names are `:root` aliases of
  the `--color-*` / `--radius-*` `@theme` vars — change a value in `@theme`, not the alias.
  See [[2026-07-23-tailwind4-tokens]].
- **Don't "fix" the missing permission card.** The wrapper inherits host Claude Code
  permissions on purpose; no Allow/Deny card fires under the host's `bypassPermissions`.
  See [[2026-07-23-permission-inherits-host]]. Do not add `permissionMode`/`settingSources`.
- Mint accent budget is fully spent; `DESIGN.md` motion section is the sanctioned motion set.
- Fresh `npm install` may skip Electron's postinstall → `npm run dev` fails with
  "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- Pins that must not move: `vite ^7`, `@vitejs/plugin-react ^5`, `typescript 7.0.2`.
- Not pushed. Local main is 3 commits ahead of `origin/main`. Branch
  `feat/tailwind4-frost-dark` still exists (merged, safe to delete).
