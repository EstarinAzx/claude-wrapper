---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decisions, engine]
---

# Engine surfaces session_id via an accessor, not a new EngineEvent

**Decision:** `createEngine` captures the SDK `session_id` into closure state and exposes it through `sessionId(): string | null` on the `Engine` interface. It does **not** emit a `session-id` `EngineEvent`. `runTurn` gained `resume?: string`, threaded into the SDK query `options.resume` and set only when provided (#10, `67a22c5`).
**Why:** The engine tests assert exact event arrays with `toEqual` after pushing an `init` (system) message. Emitting a new event into that stream would have reordered ~8 pinned expectations and forced churn across them for no behavioural gain. An accessor leaves the event stream — and therefore the renderer's `useChat` event switch — untouched, and reads back the live id whenever a caller needs it (e.g. main reads it after a turn to register a new session row for #11's sidebar). Resume binds at query construction because the streaming query is built once and cached; that is exactly the open-past-session → resume → continue-live flow.
**Reversibility:** easy — an event can be added later if a push-based consumer appears; the accessor stays. The one real constraint this hands to **#13**: retargeting resume on a *live* engine means rebuilding the cached query (or `close()` + a fresh engine on foreground switch), since `ensureQuery` early-returns once `queue` exists.

## Related

- [[decisions]] — index
- [[2026-07-23-engine-per-turn-resume]] — superseded MVP; resume now rides the streaming query
- [[2026-07-22-agent-sdk-engine]]
