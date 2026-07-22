---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by Fable 5 (relay leg 2, auto)_
_At commit: c6be38c on main_

## Current focus
Ticket loop running via `/relay N=1` (state: `.claude/relay/relay-leg.md`, body: `.claude/relay-leg.md`). Leg 2 landed #3; queue continues at #4.

## State
- **In flight:** nothing (leg boundary)
- **Done this leg:** #3 squash-merged as `c6be38c`: native folder dialog via `session:pick-folder` IPC handle, session cwd held in `src/main/session.ts` (get/set seam for the engine), `window.api.pickFolder()` on the preload bridge (interface renamed `WrapperApi`), renderer Welcome empty state until pick then folder basename in titlebar center (full path as hover title) and the static chat shell appears. Tests: `tests/session.test.tsx` (4) + `shell.test.tsx` reworked for the two-state shell.
- **Blocked:** nothing

## Pick up here
See [[pick-up]] — next frontier is issue #4 (First chat turn end to end, text only), the only unblocked `ready-for-agent` ticket.

## Skills for next session
- superpowers TDD — leg 2 pattern: Fable writes failing tests, Grok implements to spec, Fable reviews + gates
- wisp-slot — bind `haiku` → `xai/grok-4.5` for grunt implementation, restore after (leg 2 ran two parallel Grok agents on one lease, clean)
- impeccable — design context is `PRODUCT.md`/`DESIGN.md` at repo root

## Open questions
(none)

## Recent context
- `.claude/settings.json` now sets `worktree.bgIsolation: "none"` — background legs edit the shared checkout by design (serial chain); see [[2026-07-23-bg-isolation-none]]
- Typed vitest mocks needed for promise-returning `window.api` methods: `vi.fn<() => Promise<string | null>>()`, bare `vi.fn()` fails typecheck against `WrapperApi`
- Welcome/acrylic still unverified by eye; one manual `npm run dev` look worth it
- Gate for every leg: `npm run typecheck` + `npm test` + `npm run build`

## Related
- [[overview]]
- [[decisions]]
- [[happy-path]]
- [[pick-up]]
