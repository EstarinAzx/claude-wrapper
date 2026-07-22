---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by Fable 5 (relay leg 4, auto)_
_At commit: c5526a4 on main_

## Current focus
Ticket loop running via `/relay N=1` (state: `.claude/relay/relay-leg.md`, body: `.claude/relay-leg.md`). Leg 4 landed #5; queue continues at #6.

## State
- **In flight:** nothing (leg boundary)
- **Done this session:** #5 squash-merged as `c5526a4`: engine maps SDK `tool_use` / `tool_result` content blocks onto `chat:event`; renderer interleaves Frost Mono tool cards with streamed assistant segments and updates cards by tool-use id. Tool failure status is semantic, and result summaries are computed once at event ingestion. Tests: 47 across 7 files.
- **Blocked:** nothing

## Pick up here
See [[pick-up]] — next frontier is issue #6 (Permission allow/deny round-trip), now unblocked after #5 closed. It requires the planned engine streaming-input rewrite before wiring permission IPC and card actions.

## Skills for next session
- superpowers TDD — write fake-engine allow/deny tests before the streaming-input and IPC implementation
- wisp-slot — bind `haiku` to `xai/grok-4.5` for bounded grunt implementation, then restore after every agent finishes
- impeccable — Allow/Deny actions extend the ToolCard design slice; preserve Frost Mono hierarchy and accessibility

## Open questions
- Real-SDK manual run still unverified (needs a human at `npm run dev`): CLI-login auth, streamed deltas, and actual SDK assistant/user tool message shapes.

## Recent context
- #6 and #7 require streaming-input mode; see [[2026-07-23-engine-per-turn-resume]]. Keep the `Engine` boundary stable while replacing internals.
- Tool event path is complete: structural SDK mapping in `src/main/engine.ts`, shared discriminated union in `src/shared/engine-types.ts`, lazy text/tool segments in `useChat`, and fake-engine tests in `tests/toolcards.test.tsx`.
- Tool cards store compact result summaries rather than full tool output; permissions should update the existing card keyed by `toolUseId`, not create a second channel or parallel component.
- Gate for every leg remains `npm run typecheck` + `npm test` + `npm run build`.

## Related
- [[overview]]
- [[decisions]]
- [[happy-path]]
- [[pick-up]]
- [[2026-07-23-engine-per-turn-resume]]
