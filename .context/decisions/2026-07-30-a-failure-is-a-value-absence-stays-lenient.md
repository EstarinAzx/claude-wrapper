---
type: decision
project: claude-wrapper
updated: 2026-07-30
tags: [context, decisions, session-store, error-states]
---

# A store failure is a value; absence stays lenient

**Decision:** #60 splits the session store's read paths into a **typed failure** and a **lenient absence**, and draws the line at *the mechanism*, not at *the outcome*.

- `listSessions()` → `SessionMeta[] | null`. `null` = the SDK listing threw. `[]` = the store holds no sessions.
- `resolveSessionDir()` gains a third status, `unavailable`, for a store root that will not enumerate. `not-found` is unchanged and stays lenient.
- `readTranscript()` → `TranscriptMessage[] | null`. `null` = unenumerable store **or** unreadable file. `[]` = the store no longer holds this id, **or** the file read fine and holds no messages.
- `build()` returns `null` rather than an empty map on a failed root read, and a failed build is **never installed in the cache**.

The rail and the pane each render the failure with a **Retry**; both empty states stay quiet and offer **no** button. Live-tail steps over a failed read with `continue` and announces nothing.

**Why:** All four outcomes used to be `[]`, so a listing that blew up said "No sessions yet" — the words a fresh install gets — and a corrupt or permission-blocked session rendered as an empty conversation. Neither says anything is wrong and neither offers a way back.

The line had to sit at the mechanism because the two halves of the requirement pull against each other: "a session directory that cannot be resolved" is a failure, yet "a genuinely deleted session still takes the lenient path" — and a deleted session *is* an unresolvable directory. They reconcile exactly one way. The store failing to enumerate is the error; the store enumerating fine and simply not holding the id is ordinary absence. Putting the distinction in `build()` rather than in how `readTranscript` treats `not-found` satisfies both without turning a legitimately deleted session into an error.

Not caching a failed build is the same idea one layer down: an empty index is indistinguishable from an empty store, and caching it would let one transient failure answer every later lookup until the next `resetSessionIndex()`.

Three places deliberately keep the lenient collapse, because a distinction with nowhere to go is noise:

- **`titleHint`** — a rail label has no retry affordance, so a failure there can only be silence.
- **`switch-workspace`** — maps `unavailable` onto `not-found`; a refused switch is already visible, so a new `SwitchStatus` and new renderer copy would buy nothing.
- **live-tail's reload** — a tail re-reads what is already on screen, so the honest response to a failed read is to decline to overwrite, not to raise a notice that would flap.

The `continue` in that reload is load-bearing and not interchangeable with `break` or with letting `null.length` throw: an exception unwinds past the trailing re-run, losing a queued write, which is precisely the staleness live-tail exists to fix. The first "keeps the pane" assertion cannot catch this — a throw also leaves the pane alone — so a second test drives the queued re-run.

**On the three tests whose expectations changed:** `an unreadable store degrades to the empty list instead of throwing`, `an unreadable store is not-found, not a throw`, and `a cwd that resolves to nothing is not-found` encoded the behaviour this ticket exists to change. None is a commented behaviour pin, and the contract each *names* still holds — nothing throws, the failure is merely typed now. The alternative considered and rejected was keeping a vestigial test-only `listSessions` alias so the old assertion stayed green; that would have left a pin green for a function nothing calls, which is the worse violation of the same rule.

**Reversibility:** easy per call site. The durable parts are the mechanism-vs-outcome line and "a failure only earns a distinct value where the UI can act on it" — reversing either re-opens the silent-empty-state bug.

## Related

- [[decisions]] — index
- [[2026-07-29-live-tail-is-a-signal-not-a-stream]] — the reload loop this guards
- [[2026-07-28-storage-location-is-an-index-not-an-encoding]] — the index that now reports its own failure
- [[active-work]]
