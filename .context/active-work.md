---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by Fable 5 (relay leg 3, auto)_
_At commit: b60c0dd on main_

## Current focus
Ticket loop running via `/relay N=1` (state: `.claude/relay/relay-leg.md`, body: `.claude/relay-leg.md`). Leg 3 landed #4; queue continues at #5.

## State
- **In flight:** nothing (leg boundary)
- **Done this leg:** #4 squash-merged as `b60c0dd`: first chat turn end to end (text only). Engine `src/main/engine.ts` wraps the Agent SDK (per-turn `query()` + `resume`, injectable `queryFn` for tests); `chat:send`/`chat:event` IPC; preload `sendPrompt`/`onChatEvent`; renderer `useChat` + streaming markdown (react-markdown + rehype-highlight, Frost Mono code styles) + typing dots + error rows + auto-scroll (`isNearBottom`). Shared event union in `src/shared/engine-types.ts`. Tests 27 across 5 files; fake-engine harness `tests/chat-harness.ts`.
- **Blocked:** nothing

## Pick up here
See [[pick-up]] — next frontier is issue #5 (Tool cards), oldest unblocked `ready-for-agent` (#7 also unblocked; #6 hangs off #5).

## Skills for next session
- superpowers TDD — leg 3 pattern held: Fable writes failing tests + shared types, Grok implements to spec, Fable reviews + gates
- wisp-slot — bind `haiku` → `xai/grok-4.5` (leg 3 ran two parallel Grok agents on one lease, clean bind/revert)
- impeccable — tool cards (#5) are a real design slice; DESIGN.md + `docs/design/frost-mono-reference.png` are the references

## Open questions
- Real-SDK manual run still unverified (needs a human at `npm run dev`): CLI-login auth through the SDK, and whether turns always produce stream deltas (engine forwards only deltas — a delta-less turn would render empty). Flagged in #4's close comment.

## Recent context
- Engine upgrade path: #6 (canUseTool) and #7 (interrupt) need streaming-input mode — see [[2026-07-23-engine-per-turn-resume]]; swap is contained inside `createEngine`
- Renderer tests drive the fake-engine seam via `tests/chat-harness.ts` (`fakeChatApi()` → `emit()` scripted events); engine SDK-mapping tests stub `QueryFn` (`tests/engine.test.ts`)
- `window.api` is still the single bridge (`WrapperApi`); vitest include is now `tests/**/*.test.{ts,tsx}`; `src/shared/` is in both tsconfig includes
- Gate for every leg: `npm run typecheck` + `npm test` + `npm run build`

## Related
- [[overview]]
- [[decisions]]
- [[happy-path]]
- [[pick-up]]
