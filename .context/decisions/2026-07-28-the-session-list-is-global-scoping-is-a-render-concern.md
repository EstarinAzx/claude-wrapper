---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# The session list is global; scoping is a rendering concern

**Decision:** #45 removed the `dir` option from `listSessions`, so the main
process returns **every** session in the store. Nothing in the main process
narrows the list any more. The renderer groups by project, filters client-side,
caps what it renders, and marks rows outside the open workspace inert. Grouping,
filtering and the cap are a pure shared module, `src/shared/session-groups.ts`.

**Why:** spec #41's framing is that session history is the entry point to a
workspace. A list scoped by the workspace you are already in cannot be that
entry point. The SDK gives global for free — omitting `dir` is the entire
implementation — so the alternative would be re-scoping in main and asking the
renderer to request other projects one at a time, which is a second protocol for
data already in hand.

**The absence of `dir` is the requirement, and it needs its own pin.** A
cwd-scoped call returns a list of exactly the same shape, same fields, same
ordering, silently missing 36 of 37 projects. No assertion on the *result* can
tell the two apart on a machine where the current project has sessions. The test
therefore asserts the call: `expect(calls[0][0]).not.toHaveProperty('dir')`.
This is the same family as #43's no-JSONL-read pin and #44's names-only pin.

**This settles `includeWorktrees`,** which #43 flagged as an open call and left
defaulting to `true`. The SDK applies it **only when `dir` is given**, so a
global list can neither widen nor narrow by it. The question is dissolved rather
than answered, and it cannot come back while the list stays global.

**Order is a contract, not an implementation detail:** filter the complete
loaded metadata → sort and group the matches → render the newest N matches. Two
inversions are tempting and both are wrong:

- **Cap before filter.** A match older than N newer non-matches disappears, and
  the rail reads as *empty* rather than *truncated*. The filter would silently
  lie about the store.
- **Cap per group.** At 37 projects a per-group cap of 100 is 3700 rows. The cap
  is global; a group emptied by it is simply not rendered.

Groups are emitted in first-appearance order over a newest-first page, which
*is* "by most recent session, newest group first" with no second sort.

**A foreign row is rendered and inert.** Listing it is the point of the ticket;
opening it is #47's job. Until the main-process transaction (#46) and the
renderer reset (#47) both exist, selecting one produces project B's sidebar
beside project A's conversation. The pin is not that the button looks disabled —
it clicks a foreign row and asserts `loadTranscript` was never called.

**One fold, two processes.** `cwdKey`'s string fold moved to
`src/shared/cwd-key.ts`; the main-side `cwdKey` still `resolve()`s first and
then folds. The renderer's cwds arrive from the store already absolute, so it
needs the fold alone. Two spellings of one directory must produce one heading,
and the store really does hold both. `cwdKey` remains comparison-only — never
join it into a path, per
[[2026-07-28-storage-location-is-an-index-not-an-encoding]].

**`SessionMeta.cwd` is optional and absent-not-empty.** A session with no
recorded cwd is the "Unknown project" group, which `resolveResumeTarget` already
rejects as `missing-cwd`, and which is never marked as the current workspace
even when one is open.

**Two tests were deliberately replaced, not weakened.** `scopes the list to the
cwd…` and `no cwd yields the empty list…` encoded the contract this ticket
reverses by name. They were removed in favour of the stronger no-`dir` pin. This
is the one shape of red pin that is legitimate to retire: the *ticket* changes
the contract the pin describes. A pin going red because the change broke it is
still the change being wrong.

**Reversibility:** Low for the global list (re-scoping re-breaks the spec's
premise). Moderate for the cap size and page size, which are one constant.
Verified live against the real store: 495 sessions, 61 directories, 9 groups in
the first page, cap engaged at exactly 100, 64 rows enabled and 36 inert,
clicking a foreign row leaves the pane untouched. Five mutations were run, each
killed by exactly its target test.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] — supplies the
  typed `missing-cwd` rejection behind the "Unknown project" group, and the
  comparison-only rule this decision reuses
- [[2026-07-28-session-metadata-is-the-sdks-job]] — #43 moved the list to the
  SDK and left `includeWorktrees` open; this dissolves it
