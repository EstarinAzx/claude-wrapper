---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision, engine]
---

# A terminal death is a signal, not an event — and resume binds at construction

**Decision:** #73's way out of a terminal stream death is a control that calls
the EXISTING `switchWorkspace(activeSessionId, cwd)`. Two things make it work,
and neither is the control itself:

1. **The terminal/per-turn distinction travels out of band** — an injected
   `onTerminal` callback on the engine, broadcast as `engine:terminal`, NOT a
   field on the `{ type: 'error' }` event.
2. **The resume target is handed to `warmUp`**, because the streaming query
   binds `resume` at construction and is then cached.

## Why the distinction is not an EngineEvent

`mapStreamError` (terminal) and `mapResultError` (per-turn) both leave the
engine as `{ type: 'error', message }`. The renderer cannot tell them apart, and
it must: a per-turn error is already recoverable by sending another prompt, so a
control that rebuilds the engine there would discard a conversation that was
never in danger.

The obvious fix — add `terminal?: boolean` to the error event — was rejected on
a **measured** ground, not a stylistic one. `emit()` only reaches
`activeOnEvent`, which is null outside a turn, and the stream-death branches
emit only `if (turnResolve)`. So **a stream dying between turns emits nothing**:
the app is silent until the user spends a prompt on a dead engine. This was not
predicted from the code — `gui-73`'s first run killed the CLI between turns and
failed at its own premise with `{"errorShown":false}`, which is how it was
found. An event-shaped signal would be dropped in exactly one of the two cases
it exists for.

This is [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]]'s `onModelReport`
reasoning, reused for the same reason and now with a second worked example: when
main knows something the renderer needs and the knowing does not coincide with a
turn, it is a broadcast, not an EngineEvent.

**A second, cheaper argument, on record so it is not re-litigated:** five
existing assertions pin terminal error events with exact `toEqual` objects.
Adding a field reddens all five and the only repair is editing expectations —
which this codebase forbids. A design that leaves every pin byte-identical is
worth preferring when it is also the more correct one.

**Payload-free by design.** The error TEXT already travels on `chat:event`; the
only thing missing downstream is which KIND it was, and that is one bit. The
session id is fetched separately over the existing `chat:session-id`.

## The id is re-read from main, and that is load-bearing

`activeSessionId` in the renderer is only written at **turn-end**. A stream that
dies mid first-turn leaves it null while main has held the id since `init`
(the engine captures it from any message once a turn has run). Trusting the
local null offers "there is nothing to resume" for a conversation that resumes
perfectly — the #54 fallback firing on a case it is not for. So the terminal
handler re-asks main. Mutation-verified: removing that re-read kills exactly one
test, and every other assertion in the file stays green.

## Resume binds at construction — the bug that only a real CLI could show

`switchWorkspace` set `pendingResume` and then called `warmUp()` **bare**. The
warm-up is what CONSTRUCTS the query, `options.resume` binds there, and
`ensureQuery` returns early ever after — so the later turn's own `resume`
argument was silently dropped. The rebuilt engine ran a **fresh session while
the pane, refilled from disk, looked perfectly correct.**

Every unit test passed with this in place: `setResume` was called, the order was
right, the status was `ok`. It took `gui-73` asking the resumed engine for a
number planted before the death — `"No number in this conversation. You never
gave me one to remember"` — to see it. That is precisely why #73's AC3 demanded
both halves be asserted, and the demand earned its keep.

The fix moves the knowledge into the **tested** surface: `SwitchPorts.warmUp`
now takes the resume target, so `switch-workspace.test.ts` can pin the argument.
`index.ts` is unreachable under vitest, which is the whole reason the transaction
lives apart from it — a contract hidden in the entry module is a contract
nothing can hold.

**This was not scope creep.** Without it #73 fails its own AC3. It also repairs
the foreign-session switch path, which had the same silent defect.

**Reversibility:** easy. The signal is one injected callback and one channel; the
warm-up argument is one parameter with the transaction's test pinning it.

## Related

- [[decisions]] — index
- [[2026-07-23-engine-terminal-on-stream-death]] — amended by #73; its premise held and its reversibility clause is now spent
- [[2026-07-28-the-model-is-the-clis-fact-not-the-pills]] — the out-of-band idiom this reuses
- [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] — why the contract belongs in the ports, not the entry
- [[2026-07-23-engine-per-turn-resume]] — why resume binds where it does
