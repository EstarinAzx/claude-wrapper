---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision, main, renderer, ipc, testing]
---

# A ref synced by an effect is late in both directions

**#113, shipped as `dadacbe`.** `chat:send` had **no busy check at all**, so a
second send under a live turn reached `runTurn`'s overlap branch, which answers
on the **second** caller's `onEvent` — a fresh closure in `index.ts` forwarding
to the same renderer, which treats every `error` as turn-terminal. The engine's
own refusal was therefore delivered as *"your turn ended"*: measured by #108 at
**518ms**, first turn still streaming, send slot back to "Send" with no Stop on
screen for it. Gate green: typecheck clean, **1044 tests across 70 files**
(+10), build clean.

## Decision

**Three parts, and only the first is the ticket's headline.**

**1 — `src/main/send-guard.ts`.** A port-injected `guardedSend(ports, payload)`
over `isBusy` / `startTurn`, refusing **before** the call site builds the
forwarding closure. `delete-guard.ts` and `switch-workspace.ts` are the
precedent: the electron entry cannot be imported under vitest, and what has to
be pinned is that `startTurn` was never **reached**.

The engine cannot fix this itself. It holds one callback and has no way to know
its caller is the second one, so the refusal has to happen a level up, before
the callback exists.

**2 — the orphan bubble is answered by not creating one.** `useChat.send`
appends the user's bubble *before* calling `sendPrompt`, so a silent main-side
refusal would strand it. The ticket allowed two answers; this takes the second.
The renderer declines to issue a second commit at all — **it already knows it
has a send in flight**, so it needs nothing back from main. The rejected
alternative (report the refusal, drop the bubble) needs a send id threaded both
ways, because by the time the refusal lands the trailing message may be an
assistant delta rather than the orphan. And since `useChat.send` is the only
code that appends a bubble, refusing there closes the case for **every** caller,
including the future shortcut or retry affordance the ticket worries about.

**3 — every write to `busy` goes through one `markBusy` helper.** Not the
ticket's ask; forced by part 2 and the more durable finding of the leg.

## Why the effect had to go

`busyRef` was synced by `useEffect(() => { busyRef.current = busy }, [busy])`.
That is **one tick late in both directions**, and each direction is a separate
bug.

**Late upward is #113 itself.** Two commits inside one task both read `busy` as
whatever the last render saw — false — which is exactly the only dispatch that
reaches main (#108 measured every other one refused by the emptied draft).

**Late downward is worse, because it broke something that already worked.**
#80's queued flush runs from **InputBar's** effect, and a child's effects run
**before its parent's**. So on `turn-end` the flush asked, the ref synced in App
still read `true`, and the queued prompt was refused by the guard meant for a
double send. `queued-composer.test.tsx` went red — four tests — and that is the
whole reason this part exists.

**The generalisation: a mirror maintained by an effect is not a mirror, it is a
mirror plus a window.** If any reader can run inside that window, the two
disagree exactly when it matters. Writing both through one function removes the
window rather than shrinking it. This is a near-sibling of
[[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]]: there an
`await` separated a check from its use, here a commit boundary separated a write
from its read, and in both cases the ordering *looked* right.

**No second busy flag was added.** `busyRef` is the same fact `busy` is, read
where React's committed state cannot answer, and the standing rule is intact —
`lastTurn` still records how a turn *ended*, a different question.

## The instrument was named for the world before the fix

`#108`'s harness has a field `busyClearedWhileTurnLive`, computed as
`atClear !== null && atClear.busy === false`. **It does not measure its own
name.** It is `busy went false`, and the poll loop breaks on the turn's ordinary
end just as readily as on the probe's error — so in a *fixed* app it is true for
the most boring reason available.

The first post-fix verdict was keyed on that field being false and duly scored a
working guard as a failure. The discriminating fact is the **overlap error's
absence**, corroborated by the retry immediately afterwards being **accepted
rather than refused**, which is main reporting that it no longer holds
`turnResolve`. The field now carries a comment saying what it does not measure;
#79 recorded the same trap pointing the other way, an instrument scoring a
gate's success as the artifact it was hunting.

Measured across three runs: the probe reaches main, **no overlap error is ever
rendered**, and the turn outlives the probe **4589–6151ms** against **518ms**
before. Busy still clears — at the turn's own end.

**The harness was taught the fix, per #112's landmine, in three places.** Phase
A's `rendererClearsBusyOnError` now matches `markBusy` too; reading only
`setBusy` would have reported a **rename as a fix**. C1's `refusedBy` became a
three-way choice the queued note cannot split — the ref guard raises no note and
appends no bubble, exactly like the emptied draft — and now names the ambiguity
instead of keeping an answer that had silently become false. C2 scores the fixed
state **positively**, because "not confirmed" cannot otherwise be told from a
run that measured nothing.

## Mutation evidence

| Mutation | Result |
|---|---|
| Refuse **after** calling `startTurn` (the trap AC4 names) | **4 of 5** guard tests red |
| Drop `busyRef.current` from the send condition | all 5 renderer tests red |
| Drop the synchronous write, keep the ref read | all 5 renderer tests red |

The renderer tests are non-vacuous only because the fake is wired to **main as
measured** — a second send that leaves the renderer costs the pane its Stop
button. Without that, "busy stayed true" was true for the wrong reason and
passed with every guard deleted.

## Reversibility

The guard: trivial to remove, and the four unit tests red immediately. The
`markBusy` consolidation should **not** be reverted independently — restoring
the effect reds #80's queued-flush pins, which is how it was found.

Left deliberately undone: main's refusal is **silent**. Reporting it needs a
channel, and the only one the renderer has is the event stream whose misreading
is the defect. Nothing consumes a return today; `chat:send` is
`ipcRenderer.send`, fire-and-forget.

**Adjacent, not detoured into:** one `SPIKE108_PHASES=AC` run died with
`electronApplication.evaluate: Resulting promise was garbage collected` mid-C1
and passed on re-run — the same shape as the observation #114 was filed for.

## Related

- [[decisions]]
- [[overview]] · [[active-work]] · [[pick-up]]
- [[2026-08-04-the-composer-is-held-shut-by-a-draft-clear-not-a-guard]] — #108,
  which measured this and filed it
- [[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]] — #109,
  the same shape with an `await` instead of a commit boundary
- [[2026-08-04-a-refusal-belongs-where-the-fact-lives]] — #107, the guard shape
  this one copies
- [[2026-08-04-the-wait-moved-it-did-not-vanish]] — #112, whose landmine about
  teaching a harness its own fix this leg had to apply three times
