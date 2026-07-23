---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg landed:** #7 (Stop button + legible failure) — squash-merged to main as `bb63e0d`, ticket closed with breadcrumb.

**Next ticket:** #8 — Frost Mono polish pass (last open `ready-for-agent`; after it the agent queue is empty — #1 is the spec umbrella, not a work ticket).

**Landmines:**
- #8 is a design pass: route through impeccable (gates already pass: PRODUCT.md + DESIGN.md real, register `product`). Reference is `docs/design/frost-mono-reference.png`; DESIGN.md is law (bans: side-stripes, gradient text, extra glass layers, card grids, em dashes).
- Mint accent budget is fully spent (logo, avatar, send/stop slot, list markers, typing dots). Polish adds zero new accent.
- The send button now morphs to Stop while busy (`InputBar.tsx`) — any send-button polish must handle both states; Stop stays enabled while the input is disabled.
- `turn-aborted` renders `.msg-notice` ("Stopped", centered, `--text-faint`) — distinct from `.msg-error`; keep the distinction.
- "No regressions" AC = the existing 75-test suite stays green; renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"), placeholder "Message Claude…", `.msg-notice` class, "Cancelled"/"Denied" strings. Don't rename those in polish.
- Motion rules: 150–250ms, ease-out (cubic-bezier(0.22, 1, 0.36, 1)), no layout-property animation, no load choreography.
- Legible-error copy in `src/main/engine.ts` is pinned character-for-character by `tests/engine.test.ts` — don't reword casually.
- Real-SDK manual run still pending (see Open questions in `active-work.md`).
- Fresh `npm install` may skip Electron's postinstall: `npm run dev` fails with "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- `vite` stays `^7`, `@vitejs/plugin-react` `^5`, TypeScript pinned exact `7.0.2` — don't bump any of them.
