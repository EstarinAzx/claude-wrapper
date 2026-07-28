---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# Lazy title enrichment is a mount, and "substantive" is measured

**Decision:** #49 enriches a session row whose recorded title is a bare slash
command by reading that one session's transcript, on a channel of its own
(`session:title-hint` → preload `titleHint(id, cwd)` → `titleHint()` in
`session-store.ts`). Three things are load-bearing:

1. **The trigger is a row MOUNTING**, which is why the row became a component
   (`SessionRow` in `Sidebar.tsx`). Off-page rows and a collapsed rail cost
   nothing without a single explicit check — laziness is structural, not a
   guard someone can forget.
2. **Results are cached as promises**, keyed by session id, in
   `src/renderer/src/enriched-titles.ts` (`resetEnrichedTitles()` for tests).
   A resolved `null` — "no substantive prompt" or "transcript would not load" —
   is a cached ANSWER, not a miss, and a rejected IPC folds into the same null.
3. **"Substantive" is defined by what the store actually contains**, not by the
   ticket's prose read literally.

**Why a channel of its own.** `session:transcript` already reads transcripts,
and reusing it was the lazy-looking option. It would have left the call-count
assertion this feature is pinned on with **two** possible causes — opening a
session and enriching a row are indistinguishable in a single counter — and it
would have shipped a whole parsed transcript across IPC to derive one line of
text. The new handler returns at most one string; the transcript never crosses
the boundary.

**Why the promise, not the value.** The rail re-renders constantly — on window
focus, on filter, on workspace change. Caching the resolved value still lets a
row that unmounts and remounts mid-read start a second one, and "read once" has
to include the in-flight window or it is not a bound at all.

**Why "substantive" had to be measured.** Implementing the ticket's definition —
"the first user message that is neither a slash-command invocation nor a
`<local-command-caveat>` block" — literally would have made the list **worse**.
Measured over the 65 qualifying rows in the real 499-session store:

- A slash-command invocation persists in **two** shapes. `parseTranscript`'s
  unwrapper only recognises `<command-message>`-first; the `<command-name>`-first
  shape is the common one and arrives as raw markup. Taking the first non-caveat
  message verbatim relabels **59 of 65** rows with a wall of XML.
- `<local-command-stdout>` is command output carrying ANSI escapes, not a prompt.
- The CLI's skill-body injection (`Base directory for this skill:`) accounted for
  **12 of the 15** otherwise-derivable labels, all sharing a ~40-character
  identical prefix — accepting it leaves the rows exactly as mutually
  indistinguishable as the bare commands did, which is the defect being fixed.

After those exclusions most qualifying rows have no substantive prompt at all and
keep the title they already had. That is the contract's "if no such message
exists" branch being the **common** case rather than an edge, and it is the
correct outcome: those sessions genuinely contain only commands.

**Consequence for future work:** never enrich a row that has not rendered, and
never derive a label during filtering — `groupSessions`' `labels` option matches
what is already cached and derives nothing, because a keystroke that scans the
store is the whole-store re-read #43 deleted, arriving by a different door. The
enrichment is display-only: it does not touch the store and never sets a
`customTitle`. One imperfection is knowingly left standing — a `/context`
invocation's markdown output (`## Context Usage …`) carries no
`<local-command-*>` tag and can become a label; it is 1 of 15, it differs per
row, and excluding it would mean hardcoding a second literal with no general
rule behind it.

**Reversibility:** High. The channel, the cache module and the `labels` option
are additive; deleting the three and reverting `SessionRow` to inline JSX returns
the rail to bare SDK summaries. The measured exclusion list is the part worth
keeping even if the mechanism changes — it is the expensive half.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-28-session-metadata-is-the-sdks-job]] — #43 moved titles to the SDK's
  `summary` and deleted the per-file parse this must not reinstate
- [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] — the page
  cap that makes "rendered" a much smaller set than "in the store"
- [[2026-07-27-slash-commands-are-a-dumb-pipe]] — the wrapper never learns what a
  slash command is, which is why these titles look the way they do
