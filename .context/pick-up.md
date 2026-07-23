---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg landed:** #8 (Frost Mono polish pass) — squash-merged to main as `a558efa`, ticket closed with breadcrumb. CSS-only; DESIGN.md synced.

**Next ticket:** queue empty. No open `ready-for-agent` issues remain; #1 (spec umbrella) is the only open issue and is not a work ticket. The relay chain's next leg should confirm this and stop.

**Leftovers for a human:**
- Real-SDK manual run (`npm run dev` with a live CLI login): verify auth shapes, streamed deltas, real permission prompts, real interrupt subtype, and #8's polish side-by-side with `docs/design/frost-mono-reference.png`.

**Landmines (for any future ticket):**
- Renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"/"Typing"), placeholder "Message Claude…", `.msg-notice` class, "Cancelled"/"Denied" strings, footer disclaimer text.
- Legible-error copy in `src/main/engine.ts` is pinned character-for-character by `tests/engine.test.ts`.
- Mint accent budget fully spent (logo, avatar, send/stop slot, list markers, typing dots); DESIGN.md motion section is now the sanctioned motion set.
- Fresh `npm install` may skip Electron's postinstall: `npm run dev` fails with "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- `vite` stays `^7`, `@vitejs/plugin-react` `^5`, TypeScript pinned exact `7.0.2` — don't bump any of them.
