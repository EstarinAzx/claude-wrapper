---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# Session metadata is the SDK's job, and `messageCount` is gone

**Decision:** #43 replaced the hand-rolled store scan with the SDK's top-level
`listSessions({ dir: cwd, includeProgrammatic: false })`. `SessionMeta` is now
exactly what that returns, renamed: `sessionId → id`, `summary → title`,
`lastModified → lastUpdated`. The line-parsing `summary()` reader and its
`extractText` helper are **deleted**, and `messageCount` is **removed from the
product** — not recomputed, not approximated by `fileSize`, not preserved behind
a lazy read.

**Why:** The old reader read and line-parsed every JSONL in the project
directory, and `Sidebar` re-ran it on mount, on cwd change, on active-session
change and on **every window focus**. The SDK does the same work as one
filesystem pass — measured live on this project after the change: 64 sessions in
199ms.

Two sub-decisions are the load-bearing ones, because both are things a future
agent will be tempted to "fix":

- **The title is `summary` verbatim.** No `customTitle ?? summary` coalesce. The
  SDK already coalesces custom title → auto-summary → first prompt into
  `summary`, and of 325 sessions carrying a `customTitle`, **0 diverge** from it.
  A re-added coalesce is invisible against real data forever — which is why the
  suite carries a synthetic divergent fixture instead.
- **`messageCount` was deleted rather than kept.** `SDKSessionInfo` has no such
  field, and the only way to keep the number is to keep the per-file parse — i.e.
  to keep the entire cost this change exists to remove. Losing a visible field
  was the accepted price; the sidebar row meta is now the relative time alone.

**Free win:** 0 of 490 sessions carry raw `<local-command-caveat>` /
`<command-name>` markup in `summary`, so the raw-markup sidebar-title defect
disappears with this path. Confirmed again post-change: 0 of the 64 titles for
this project. **Replay is a different code path and still parses transcripts** —
`readTranscript` and `encodeCwd` are untouched, and #49's title-enrichment
ticket is about the *sidebar* path, which this one just moved.

**Open flag for #45:** `ListSessionsOptions.includeWorktrees` defaults to
`true`, so a project inside a git repo now also lists sessions recorded under
its worktree paths. Left at the default because #43 specified only
`includeProgrammatic`, but it is a real (small) widening of "cwd-scoped" and
deserves an explicit call when #45 introduces global listing and filtering.

**Reversibility:** Low, deliberately. Reversing means restoring a per-file
parser, and the two mutation-verified tests exist specifically to make a partial
reversal (SDK call *plus* a lingering read) fail loudly rather than pass green.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-23-transcript-parser-pure-renderer-summarises]] — the replay path
  this decision deliberately does **not** touch
