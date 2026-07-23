---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decisions, renderer]
---

# Busy-switch = block while streaming, not graceful detach

**Decision (#14, `80591fb`):** The mid-stream-switch caveat #13 handed forward is resolved by **blocking**, the spec's other sanctioned option, rather than making `chat:target`'s teardown graceful. While a turn streams (`busy`), the Sidebar session rows and the New chat button are `disabled`, and `useChat.openSession`/`newChat` early-return on `busy` (belt-and-suspenders, `[busy]` in deps). Because a switch can't be initiated mid-stream, `chat:target` is never reached while `turnResolve` is set — so its unconditional `engine.close()` (and the `query closed` error that close emits mid-turn) is simply never triggered in that window. The existing Stop button is the escape hatch: stop the turn (→ `turn-aborted`, `busy` false), then switch. No main/preload/engine change was needed.

**Why:** "No half-streamed answer leaking into another pane" is the real acceptance bar. Blocking makes the leak *impossible by construction* — there is no concurrent stream to leak — whereas detach-with-guard would need the renderer to gate stragglers (late `text-delta`s + the `query closed` error) from the abandoned turn, an event-race surface with no test-visible benefit. The spec keeps one live engine / no concurrent streaming, so the user loses nothing by finishing or stopping first. Simplest option that fully satisfies the AC.

**Reversibility:** Easy, and the seam is small. To move to detach-with-notice later: drop the `disabled={busy}` on rows + New chat and the `if (busy) return` guards, make `chat:target` interrupt-then-rebuild instead of a bare `close()`, and add a renderer generation-guard so events from the abandoned turn are dropped. The block is a deliberate ceiling, not a dead end.

**Refresh half (same ticket):** `Sidebar` fetch is now a stable `refresh` callback (monotonic request-id ref drops stale responses) fired on mount + `[cwd, activeId]` (kept from #13) + `window` `focus` + a manual **Refresh sessions** button. This supersedes #13's refetch-on-`activeId`-only note in [[2026-07-23-resume-via-target-close-rebuild]].

## Related

- [[decisions]] — index
- [[2026-07-23-resume-via-target-close-rebuild]] — #13, which handed the mid-stream caveat + the refresh-supersede note to this ticket
