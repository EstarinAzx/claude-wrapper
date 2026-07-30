---
type: decision
project: claude-wrapper
updated: 2026-07-30
tags: [context, decisions, toolcards, renderer]
---

# Disclosure is retention plus a conditional mount

**Decision:** Tool cards keep the **complete** result text in renderer state and derive the collapsed one-line summary at **render** time. Expanded detail is **conditionally mounted** — never CSS-hidden, never wrapped in a closed native disclosure element. No wrapper-owned truncation cap in v1.

**Why:** Summarising happened on the way *into* state at two separate points (the replay conversion and the live event handler) while the raw text was already in hand at both — so the loss was gratuitous, not a transport limit, and no new IPC channel is needed to undo it. The mount rule is the load-bearing half: a CSS-hidden body or a closed `<details>` still leaves detail text in the rendered output, so the existing collapsed-card test would correctly go red. That test is a mechanism check, **not** a stale pin to retire — if it fails, the implementation is wrong. Measured against the local store (6,613 results, median 277 B, p95 7.3 KB, p99 16.6 KB, max 92 KB, heaviest session 480 KB) full retention costs low single-digit MB, so a cap would buy nothing and would make "non-lossy" a lie.

**Reversibility:** easy

## Related

- [[decisions]] — index
- [[2026-07-23-transcript-parser-pure-renderer-summarises]] — the seam this preserves: the parser stays raw, the renderer summarises
- [[2026-07-30-a-diff-without-a-baseline-is-worse-than-none]]
- [[active-work]]
