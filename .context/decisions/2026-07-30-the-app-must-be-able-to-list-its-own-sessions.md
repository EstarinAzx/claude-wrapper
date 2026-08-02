---
type: decision
project: claude-wrapper
date: 2026-07-30
tags: [decision, sessions, sdk]
---

# The app must be able to list its own sessions

> **AMENDED 2026-08-02 by #89 — the DECISION stands, one PREMISE sentence below
> is false.** "**This app writes `entrypoint: "sdk-ts"`**" is wrong in the
> common case. The value is a fact about the LAUNCH ENV, not about this app: the
> SDK's stamp is inherit-wins, so launched from a terminal Claude Code session
> the app writes **`sdk-cli`**, launched from outside any session it writes
> `sdk-ts`, and launched from a VS Code session it writes `claude-vscode` —
> which is **interactive** and not hidden by `false` at all. Two of the three are
> programmatic, so the conclusion (`includeProgrammatic: true` MUST stay) is
> unchanged and is now measured at the store level: 806 rows vs 567 here, a
> 239-row delta. The 112-row split quoted below is likewise still a real
> reading, just of a smaller store at an earlier date. See
> [[2026-08-02-the-entrypoint-is-a-fact-about-the-launch-env]] before citing any
> `entrypoint` claim on this page.

`src/main/session-store.ts` asks the SDK's store reader for everything it knows
and passes `includeProgrammatic: true`. It used to pass `false`.

## What was wrong

The SDK decides "programmatic" from the transcript's `entrypoint` field, matched
against `{sdk-cli, sdk-ts, sdk-py}` (`sdk.d.ts:980-990`, predicate `B1` at
`sdk.mjs:114`). **This app writes `entrypoint: "sdk-ts"`.** So every conversation
the wrapper authored was excluded from the wrapper's own listing.

Measured on the owner's store, for a session the user was sitting in at the time:

```
includeProgrammatic=false   560 rows   target ABSENT
includeProgrammatic=true    672 rows   target PRESENT, cwd recorded correctly
```

The 112-row delta is exactly 75 `sdk-cli` + 37 `sdk-ts`, and nothing else.

Nothing was ever wrong with the data. The `cwd` is recorded, the transcript
replays, and every OTHER path already resolved these sessions fine —
`resolveSessionDir` enumerates real directory and file names with no SDK filter
(`session-index.ts:66-98`), so `readTranscript`, `titleHint`, the watcher and
`resolveResumeTarget` all worked on them. Only the listing could not see them.

## Why it stayed invisible for two days

`ea7baaf` introduced `false` on 2026-07-28 ("parity with terminal `/resume`").
Until 2026-07-30 the rail was unscoped, so it was always full of terminal-CLI
sessions from 37 other projects and looked healthy. Project-scoping the rail is
what made the hole legible: open a folder whose ONLY sessions are the app's own,
and the rail correctly reports that it can see nothing. Two fresh directories
reproduced it.

The scope filter did not cause this and does not need reverting. It is the
diagnostic that found it.

## Why the recorded rationale inverts

`false` was a considered choice with its own comment, not an accident: it is
"what the SDK documents for IDE session pickers — parity with what terminal
`/resume` offers". That reasoning is sound for a picker that lists sessions some
OTHER program authored. It inverts for a client that authors the sessions it is
listing: parity for the terminal means the terminal shows its own work, so parity
for this app means this app shows its own. `false` gave us the opposite of the
principle it was named after.

`true` is also the SDK's documented default. The key stays explicit as a
statement of intent — a future default flip must not silently take this with it.

## The cost we accept

The flip admits 112 rows to surface the 37 this app authored. The other 75 are
`sdk-cli` headless automation, and the concentration is worst exactly where we
look first: ~20 of them are this repo's own GUI drivers, titled "say OK",
"reply with exactly: PONG". `#49`'s enrichment cannot help — `needsEnrichment`
requires a leading `/` (`session-titles.ts:18-21`) and these titles are prose.

Accepted anyway. Blindness to your own conversations is a correctness bug; a
noisy neighbour in a scratch repo is a papercut, and the noise is an artifact of
developing this app rather than something a real project carries. Filtering
`sdk-cli` is a separate ticket and needs a signal we do not currently have:
`SDKSessionInfo` carries no `entrypoint`, `origin` or `sessionKind`
(`sdk.d.ts:4327-4368`), so the field that decides the verdict is read from disk
and discarded before we see it. Re-deriving it client-side means re-opening ~680
JSONLs — precisely the per-file scan the SDK reader exists to avoid.

Listing cost, measured here, is not the objection: 450ms/560 rows → 495ms/672.

## The pin

`tests/session-store.test.ts:81` asserted
`toHaveBeenCalledWith({ includeProgrammatic: false })`. **That line is deleted,
not rewritten**, and this section is the argument required before the edit.

Deleting rather than rewriting to `true`: the SDK documents `true` as its
default, so `sdkListSessions({includeProgrammatic: true})` and
`sdkListSessions()` are behaviourally identical. A pin asserting the former
reddens on the latter — a test that fires on a no-op. Its predictable end is a
tidy-up removing the redundant key, the pin going red for no behavioural reason,
and being retired as stale, with the protection vanishing quietly. That is a
weakening dressed as a preservation.

Deleting it is not a retirement either. The test is named "asks the SDK for every
project — no dir scoping"; its comment block and its mutation-verified assertion
are both about `dir`. The `includeProgrammatic` clause was a rider on an
exact-match, authored by `63f12d55` in a commit that only removed `dir: cwd`.
Removing the rider leaves the test's own contract intact and still pinned by
`expect(sdkListSessions.mock.calls[0][0]).not.toHaveProperty('dir')`.

The contract it did describe is replaced by something **stronger**, per the bar
[[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] set for
itself: `tests/session-store-live.test.ts` mocks nothing and asserts the
OUTCOME — a transcript carrying `entrypoint: "sdk-ts"` is listable — against a
real temp store. That is unexpressible in `session-store.test.ts`, which mocks
the SDK module, so the flag's effect there is unobservable at any strength.

## Consequence: the active session became clickable

Until now the conversation you are in was never in the listing, so its row could
not exist. It renders in project scope now, and clicking it would run
`adoptSession` — stomping the live pane with a disk read. `useChat.openSession`
gains a same-id guard.

## Related

- [[2026-07-28-session-metadata-is-the-sdks-job]] — the ADR this reverses one line of
- [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] — the pin-retirement bar
- [[active-work]] · [[overview]]
