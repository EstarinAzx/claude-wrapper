---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by Fable 5 (relay leg 8, auto)_
_At commit: e103a41 on main_

## Current focus

**Relay chain closed.** Leg 8 confirmed queue empty (only #1, the spec umbrella, remains open) and set `stop: true` in `.claude/relay/relay-leg.md`. No next leg spawned. MVP slices #3–#8 all landed. Remaining work is human-only: the real-SDK manual run (see [[pick-up]]).

## State

- **In flight:** nothing (chain closed)
- **Done this session:** #8 squash-merged as `a558efa`: CSS-only Frost Mono polish through impeccable. Markdown ul gets mint en-dash markers (ol markers mint via `::marker`), typing dots pulse with 150ms stagger, messages/tool cards enter with 200ms fade + 4px rise, send/stop press scale 0.92, input pill focus-within hairline brighten, thin neutral chat scrollbar, `prefers-reduced-motion` guard. Dead `.assistant-list` CSS deleted. DESIGN.md motion/layout synced. No TSX changes; 75/75 tests, typecheck, build green.
- **Blocked:** nothing

## Pick up here

See [[pick-up]] — queue empty. MVP vertical slices #3 through #8 all landed.

## Skills for next session

- impeccable — any further visual work must re-run the loader; DESIGN.md motion section now documents the full sanctioned motion set.

## Open questions

- Real-SDK manual run still unverified (needs a human at `npm run dev`): CLI-login auth shapes, streamed deltas, real permission prompts, real interrupt result subtype, and now the side-by-side visual check of #8's polish against the reference.

## Recent context

- Mint accent budget unchanged and fully spent: logo, avatar, send/stop slot, list markers, typing dots. Markdown list markers were already inside the budget.
- Motion vocabulary is now law in DESIGN.md: 150ms transitions / 200ms entries, ease-out cubic-bezier(0.22, 1, 0.36, 1), state-conveying only, reduced-motion disables all.
- Legible-failure copy in `src/main/engine.ts` remains pinned character-for-character by `tests/engine.test.ts`.
- Gate for every leg remains `npm run typecheck` + `npm test` + `npm run build`.

## Related

- [[overview]]
- [[decisions]]
- [[happy-path]]
- [[pick-up]]
- [[2026-07-22-glassy-acrylic-visual]]
