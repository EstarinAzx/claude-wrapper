---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by Fable 5 (relay leg 6, auto)_
_At commit: bb63e0d on main_

## Current focus
Ticket loop running via `/relay N=1` (state: `.claude/relay/relay-leg.md`, body: `.claude/relay-leg.md`). Leg 6 landed #7; queue continues at #8 (last agent ticket).

## State
- **In flight:** nothing (leg boundary)
- **Done this session:** #7 squash-merged as `bb63e0d`: engine `interrupt()` on the long-lived streaming query; post-interrupt result (any subtype) maps to `turn-aborted`, rendered as a quiet centered `Stopped` notice (`.msg-notice`), not an error; send button morphs in place to an enabled Stop while busy; `chat:stop` IPC (isTrustedIpc-gated) also `cancelAll()`s pending permissions so `canUseTool` never parks; legible error copy for ENOENT / signed-out CLI / `error_max_turns` / `error_during_execution` / idle stream end. Tests: 75 across 12 files.
- **Blocked:** nothing

## Pick up here
See [[pick-up]] — next frontier is issue #8 (Frost Mono polish pass), unblocked. After #8 the agent queue is empty (only #1, the spec umbrella, stays open).

## Skills for next session
- impeccable — #8 is the design pass itself; PRODUCT.md/DESIGN.md gates already pass, register: product, reference `docs/design/frost-mono-reference.png`
- wisp-slot — optional for grunt slices; leg 6 pattern (bind `haiku` → `xai/grok-4.5`, restore after agents finish) worked cleanly
- superpowers TDD — #8's "no regressions" AC leans on the existing 75-test suite; new behavior (motion, indicators) still gets tests first where testable

## Open questions
- Real-SDK manual run still unverified (needs a human at `npm run dev`): CLI-login auth shapes, streamed deltas, real permission prompts, real interrupt result subtype. Engine's auth-error copy is pattern-matched best effort until then.

## Recent context
- Engine event vocabulary now: text-delta / tool-use / tool-result / permission-request / turn-end / turn-aborted / error (`src/shared/engine-types.ts`); `Engine.interrupt()` is part of the interface.
- Interrupt design: `interrupting` flag set in `interrupt()`, consumed on the next `result` message regardless of subtype, reset in `finishTurn` so stream death can't leak it. Same query keeps serving later turns; terminal-on-stream-death decision unchanged ([[2026-07-23-engine-terminal-on-stream-death]]).
- Legible-failure copy lives in `src/main/engine.ts` (`mapStreamError` / `mapResultError`) and is pinned character-for-character by `tests/engine.test.ts`.
- Mint accent budget (send/stop slot, logo, avatar, list markers, typing dots) is fully spent — #8 must polish within it, not add accent.
- Gate for every leg remains `npm run typecheck` + `npm test` + `npm run build`.

## Related
- [[overview]]
- [[decisions]]
- [[happy-path]]
- [[pick-up]]
- [[2026-07-23-engine-terminal-on-stream-death]]
