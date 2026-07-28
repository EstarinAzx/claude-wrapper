---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# A session's storage location is an index lookup, never an encoded cwd

**Decision:** #44 deleted `encodeCwd` and introduced `src/main/session-index.ts`,
which maps session id → physical project directory by **enumerating**
`~/.claude/projects` — directory and file names only, no JSONL opened.
`readTranscript`, `listSubagents` and `readSubagentTranscript` resolve through it.
The session's reported `cwd` is now a **display value and a duplicate-id
tie-break hint only**; it is never joined into a storage path.

**Why:** `encodeCwd(cwd) = cwd.replace(/[^a-zA-Z0-9]/g, '-')` is lossy, and its
failure mode is silence. A synthesized directory that does not exist reads back
as an empty transcript, which is indistinguishable from a session that has no
messages. Measured live at the time of the change: the store held 494 sessions
across 61 directories, and encoding would have missed **45 of them** — mostly
drive-letter case drift (`d:\…` vs `D:\…`). The index resolved **494 of 494**.
Spec #41's "6 of 37 directories" is the same defect counted per-directory on a
smaller store; per-session it is an order of magnitude worse.

The ticket named the tempting wrong fix, and it is worth keeping named: **making
the comparison case-insensitive**. That patches exactly the drive-letter cases
and leaves every other lossy collision live — the encoding maps many distinct
paths onto one string, and no comparison can pull those apart afterwards. The
only sound key is the name that is actually on disk.

Three sub-decisions a future agent will be tempted to undo:

- **A miss is a value, not an exception.** `resolveSessionDir` returns
  `{status:'ok',dir} | {status:'not-found'}`. A session can legitimately vanish
  between a list and a click; that is not exceptional.
- **`missing-cwd` is a separate, typed rejection** (`resolveResumeTarget`), for
  the 6 sessions the store records with no cwd at all. It is deliberately not an
  empty result, and the lossy directory name must **never** be decoded back into
  a cwd to paper over it. This is the backing state for #45's "Unknown project"
  group and #46's refusal to resume.
- **A miss rebuilds once and retries once, then stops.** Enough to pick up a
  session created since the last refresh; incapable of spinning.

**Cost accepted:** an enumeration instead of a string concatenation. Measured at
**12ms** for 61 directories / 589 entries, which is why the index can be dropped
and lazily rebuilt on every session-list refresh rather than cached with an
invalidation protocol. `resetSessionIndex()` on `session:list` is the whole
freshness story.

**Duplicate ids are handled but unobserved** (0 of 494). Detection is free
(names only); the tie-break — read the first record carrying a `cwd` from each
candidate, prefer the match, else newest mtime — is the only path that opens a
transcript, and it is unit-tested rather than live-verified. Never pick
arbitrarily there: an arbitrary pick is the silent-wrong-transcript bug again,
wearing a different hat.

**Reversibility:** Low. Restoring `encodeCwd` restores a silent-wrong-answer bug
that grows with the store. Five mutations were run against the suite, each
killing exactly one intended test — including reverting `readTranscript` to the
encoded path, which turns two tests red rather than passing green.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-28-session-metadata-is-the-sdks-job]] — #43 moved the *list* off the
  encoded path; this one finishes the job for the *read* paths it left behind
