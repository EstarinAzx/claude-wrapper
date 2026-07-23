---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decisions, engine, renderer]
---

# Resume/switch = close the engine + rebuild with `resume`; renderer owns the active id

**Decision (#13, `053ea95`):** Continuing a reopened session is wired as an explicit *retarget*, not a per-send flag. The renderer holds `activeSessionId` in `useChat`. Opening a sidebar row (`openSession`) replays the transcript **and** calls `window.api.targetSession(id)`; the main process `chat:target` handler `engine.close()`s the live engine, `cancelAll()`s pending permissions, sets `engine = null`, and stashes `pendingResume = id`. The next `chat:send` lazily rebuilds the engine and threads `pendingResume` into `runTurn(text, cb, resume)`, so `ensureQuery` binds `options.resume` on the fresh query's first (and only) construction. `New chat` = `targetSession(null)` (fresh, no resume). The renderer learns a freshly-earned id by calling `window.api.currentSessionId()` (invoke → `engine.sessionId()`) on `turn-end`; the Sidebar refetches on `activeId` change, which is how a new session joins the list and gets highlighted (`aria-current` + mint bar).

**Why:** The streaming query is built once and cached ([[2026-07-23-session-id-accessor-not-event]] flagged this exact constraint to #13). Retargeting `resume` on a *live* engine is impossible without rebuilding, so a switch **must** tear the engine down and build a new one — `chat:target` makes that the explicit switch action instead of inferring it by diffing ids inside `chat:send`. Keeping the resume target in main (`pendingResume`) rather than passing it on every send means 2nd+ turns of a live session don't re-thread a stale resume (and `ensureQuery` early-returns anyway). The id is read back through the **accessor over IPC**, honouring the "no `session-id` event" decision — no new `EngineEvent`, the pinned event-array tests stay untouched.

**Reversibility:** Easy. The seam is `chat:target` + `pendingResume` + `activeSessionId`. **Caveat handed to #14:** `chat:target` closes the engine *unconditionally*, so switching mid-stream tears down the running turn (renderer sees a `query closed` error). #14 owns busy-switch polish — detach/finish the foreground turn gracefully before retargeting — plus manual refresh + refresh-on-focus (which supersede the current refetch-on-`activeId`).

## Related

- [[decisions]] — index
- [[2026-07-23-session-id-accessor-not-event]] — the accessor + the resume-rebuild constraint this implements
- [[2026-07-23-transcript-parser-pure-renderer-summarises]] — the replay seam #13 builds continue-in-place onto
