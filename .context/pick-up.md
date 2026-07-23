---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Queue empty — relay chain closed.** Leg 8 (2026-07-23) verified the tracker:
only #1 (spec umbrella) remains open, and it is not a work ticket. MVP vertical
slices #3–#8 all landed on main (last: #8, Frost Mono polish, `a558efa`). The
relay state file (`.claude/relay/relay-leg.md`) is set `stop: true`; no next
leg was spawned.

**Leftovers for a human:**
- Real-SDK manual run (`npm run dev` with a live CLI login): verify auth
  shapes, streamed deltas, real permission prompts, real interrupt subtype,
  and #8's polish side-by-side with `docs/design/frost-mono-reference.png`.
- Close #1 once the manual run is accepted, or cut new tickets from it.

**Landmines (for any future ticket):**
- Renderer tests pin aria-labels ("Send"/"Stop"/"Allow"/"Deny"/"Typing"), placeholder "Message Claude…", `.msg-notice` class, "Cancelled"/"Denied" strings, footer disclaimer text.
- Legible-error copy in `src/main/engine.ts` is pinned character-for-character by `tests/engine.test.ts`.
- Mint accent budget fully spent (logo, avatar, send/stop slot, list markers, typing dots); DESIGN.md motion section is the sanctioned motion set.
- Fresh `npm install` may skip Electron's postinstall: `npm run dev` fails with "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- `vite` stays `^7`, `@vitejs/plugin-react` `^5`, TypeScript pinned exact `7.0.2` — don't bump any of them.
