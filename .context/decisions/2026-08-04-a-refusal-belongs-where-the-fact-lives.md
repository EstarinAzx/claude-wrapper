---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# A refusal belongs where the fact lives

**#107, shipped as `7e62f9e`.** The rail could delete the session a turn was
streaming into, during that session's first turn — the batch's only data-loss
defect, and the only one that destroys a transcript **while it is being
written**. Gate green: typecheck clean, **1009 tests across 66 files** (+11),
build clean. `src/main/delete-guard.ts` is new; `src/main/index.ts` and
`src/renderer/src/App.tsx` are the other two `src/` files touched.

## Decision

**The busy refusal moves to main, because main is the only process that holds
the in-flight session id at the moment it matters.**

`src/main/delete-guard.ts` is `guardedDelete(ports, id)` over `isBusy` /
`runningId` / `remove`; the `session:delete` handler binds it to
`engine?.isBusy()`, `engine?.sessionId()` and `session-store.ts`'s
`deleteSession`. It refuses **only** the running id — a foreign session stays
deletable mid-turn, because that turn appends to its own transcript and no
other.

It lives apart from `index.ts` on `switch-workspace.ts`'s precedent: the
electron entry cannot be imported under vitest, and this is precisely the logic
that has to be unit-tested.

The rail's `disabled={active && busy}` is **unchanged** and stays a visible
affordance rather than the authority. `tests/sidebar.test.tsx` needed no edit,
which is AC4 satisfied literally rather than argued.

## Why

The `index.ts` comment that had to be rewritten was not careless — it was
**reasoning from a premise that was true everywhere except the one window that
matters**:

> Carries NO busy check. Refusing the in-flight session is the rail's disabled
> control … re-deciding it here would be a second busy source that could only
> disagree.

Two busy sources *can* only disagree — when both hold the same fact. Here they
do not. `active` is `s.id === activeId`, where `activeId` is `useChat`'s
`activeSessionId`, and that value is written **only** at `turn-end`
(`useChat.ts:241`) and on engine-terminal (`:283`). Through the whole **first
turn of a fresh conversation** the renderer holds null: the just-created session
appears in the rail as an ordinary non-active row with a live trash button, and
the delete unlinks a `.jsonl` the CLI is still appending to. The CLI recreates
the file on its next write, the row returns as a stub, and everything written
before the delete is gone.

So this is not a second opinion on a decision the rail already makes. It is the
**only** place the decision can be made at all during turn 1 — main has held the
id since `init`, which is the same asymmetry `useChat.ts:275-279` already
documents for the engine-death case. The comment is rewritten rather than
deleted, because the next reader would otherwise re-derive the old conclusion
from the same plausible argument.

**The generalisation: a guard has to live where its fact lives.** Placing it
where the *control* lives is the intuitive choice and it is what created this
bug — the rail owns the button, so the rail was given the refusal, and the rail
turned out not to own the information the refusal needs.

**AC3 turned out to be reachable past the busy window, which is the finding
worth carrying.** The ticket framed the renderer's null as a mid-turn condition,
but `turn-aborted` and `error` clear `busy` **without** reading the id back from
main — only `turn-end` and engine-terminal do. So the pane can sit on a
conversation whose id exists only in main while nothing is running: a delete
main now *permits*, that still leaves the app pointed at a transcript it just
destroyed. `App.deleteSession` therefore asks main only when the renderer has
nothing:

```ts
if (id === (activeSessionId ?? (await window.api.currentSessionId()))) newChat()
```

The local value stays preferred — writing main's id into `activeSessionId`
early is the bug class this closes, not a shortcut through it (the ticket's
first landmine), and asking second costs no IPC on the ordinary path.

**The tests put the real guard behind the IPC.** A renderer test whose
`deleteSession` mock returns `'failed'` on command passes with
`delete-guard.ts` deleted — it asserts the harness. `tests/delete-busy.test.tsx`
binds `guardedDelete` to a scripted engine instead, so the refusal it observes
is the shipped decision.

**The assertions are on whether `remove` was REACHED**, never only on the
status. A guard that answered `'failed'` after unlinking the file would satisfy
every status-only test while destroying the transcript it exists to protect.

**The premise was reproduced before it was fixed — fifth consecutive leg.**
`tests/delete-busy.test.tsx`'s first test asserts the live row's trash button is
enabled during its first turn and that the click really reaches the destructive
call. It reads the same before and after the fix, which is AC4 from the other
side.

**Mutation-verified twice** (AC5): dropping the refusal reds *refuses the
session the engine is currently running* and *main refuses it while the
renderer's active id is still null*; widening it to `if (ports.isBusy())` reds
*allows a different session while that same turn runs*, *a null running id
refuses nothing* and *a foreign row still deletes during that same turn*. AC3's
own evidence is its red-before-green — the single failure in the new file until
the `App.tsx` line landed.

The ticket's stated baseline (979 tests) was **stale for the third consecutive
ticket**; `main` was at 998.

## Reversibility

Cheap. The guard is one branch in one small module with one call site; deleting
it restores the previous behaviour exactly, and the rail's control never moved.
The `App.tsx` change is one line and one extra IPC read on a path that only runs
after a confirmed delete.

Left deliberately undone: nothing writes `activeSessionId` earlier, no GUI
driver was added (the whole path is React state over channels jsdom already
mocks, plus a main-side pure module), and `deleteSession` in `session-store.ts`
is untouched — the bug was upstream of it.

## Related

- [[decisions]]
- [[overview]] · [[active-work]] · [[pick-up]]
- [[2026-08-04-a-failure-flattened-into-a-value-is-judged-as-one]] — the same
  shape one layer over: a fact that never reached the code deciding on it
- [[2026-07-23-busy-switch-block-not-detach]] — the other refusal keyed on
  `Engine.isBusy()`, and still the app's only reading of whether a turn runs
