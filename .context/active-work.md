---
type: active-work
project: claude-wrapper
updated: 2026-07-23
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-23 by Fable 5 (relay leg 5, auto)_
_At commit: 5206ee1 on main_

## Current focus
Ticket loop running via `/relay N=1` (state: `.claude/relay/relay-leg.md`, body: `.claude/relay-leg.md`). Leg 5 landed #6; queue continues at #7.

## State
- **In flight:** nothing (leg boundary)
- **Done this session:** #6 squash-merged as `5206ee1`: engine swapped to one long-lived streaming-input SDK query with `canUseTool`; permission requests render Allow/Deny on the existing tool card (upsert by `toolUseId`); responses flow preload → IPC → main permission broker; deny returns `interrupt:false` so the turn continues. Also: IPC sender/navigation trust checks, engine terminal-on-stream-death, queue end on close. Tests: 64 across 10 files.
- **Blocked:** nothing

## Pick up here
See [[pick-up]] — next frontier is issue #7 (Stop button + legible failure), unblocked. #8 (Frost Mono polish) is blocked by #7.

## Skills for next session
- superpowers TDD — fake-engine interrupt tests before wiring `Query.interrupt()`
- wisp-slot — bind `haiku` to `xai/grok-4.5` for bounded grunt implementation, restore after agents finish
- impeccable — Stop button joins the input bar slice; Frost Mono, accent budget already spent on send

## Open questions
- Real-SDK manual run still unverified (needs a human at `npm run dev`): CLI-login auth, streamed deltas, real permission prompt shapes, gated-tool end-to-end.

## Recent context
- Engine now holds the live `Query` (`currentQuery` in `src/main/engine.ts`) — #7's `interrupt()` is a small addition, but `runTurn` rejects overlapping turns, so Stop must resolve the active turn cleanly.
- Dead stream = terminal engine by decision [[2026-07-23-engine-terminal-on-stream-death]]; recovery is a fresh engine via folder pick.
- Permission machinery: `src/main/permission-broker.ts` (pending map, abort→deny, cancelAll), `src/main/navigation.ts` (renderer URL trust), `chat:permission-response` IPC gated by `isTrustedIpc`.
- Tool cards: permission state lives on the tool message (`permission: 'pending' | 'denied' | null`); terminal error cancels unresolved cards ('Cancelled'); denied cards ignore the follow-up denial tool-result.
- Gate for every leg remains `npm run typecheck` + `npm test` + `npm run build`.

## Related
- [[overview]]
- [[decisions]]
- [[happy-path]]
- [[pick-up]]
- [[2026-07-23-engine-terminal-on-stream-death]]
