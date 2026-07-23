---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decisions, transcript, replay]
---

# Transcript replay: pure main parser → shared TranscriptMessage; renderer summarises tool results

**Decision:** Session replay (#12, `bb94e3d`) is a **pure** main-process function `parseTranscript(raw): TranscriptMessage[]` in `src/main/transcript.ts` (no fs). `TranscriptMessage` is a new shared union (`user` / `assistant` / `tool`) in `src/shared/session-types.ts` — the renderer's `ChatMessage` minus its transient fields (`id`, `permission`). `readTranscript(cwd,id)` (session-store, fs) feeds the parser; `session:transcript` IPC + `loadTranscript(id)` preload surface it; `useChat.replay()` maps `TranscriptMessage[]` → `ChatMessage[]`, assigning fresh ids and `permission: null`. Tool-result text is left **raw** by the parser and **summarised in the renderer** (`resultSummary`, in `useChat.toChatMessage`) — the same point the live `tool-result` event is summarised. Replay is **read-only**: clicking a row replaces the pane but does not arm the input.

**Why:** Keeping the parser pure (string in, array out, no fs, no presentation) makes it fixture-testable exactly like `summary()` and keeps the lenient line-skip logic in one place — the format-risk mitigation lives centrally. Summarising in the renderer (not the parser) means a replayed tool card is byte-identical to a live one and the parser owns no presentation concern; a future consumer wanting full result text gets the raw string off `TranscriptMessage`. The shared type (vs reusing `ChatMessage`) avoids leaking renderer-only fields across the IPC boundary and keeps main free of React types.

**Reversibility:** easy. The read-only boundary is the seam #13 (resume) extends — rows already load + replay; #13 adds arming the input to continue-in-place via `sessionId()` + `runTurn(...,resume)`. Moving summarisation into the parser later is a local change if a raw-text consumer never materialises.

## Related

- [[decisions]] — index
- [[2026-07-23-session-id-accessor-not-event]] — the resume seam #13 pairs with this replay seam
- [[2026-07-23-bg-isolation-none]]
