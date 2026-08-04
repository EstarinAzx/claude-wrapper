---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# The composer is held shut by a draft clear, not by a guard

**#108 — spike, no `src/` diff.** Two claims, both confirmed by reading and
neither established as reachable. The spike separates *the mechanism is real*
from *a user can trigger it*, and the two claims came apart in opposite
directions.

## Claim 1 — the consequence is real; the user path is not

A second `chat:send` arriving while the first turn holds `turnResolve` is
answered by `runTurn`'s overlap branch with `onEvent({ type: 'error' })` — on the
**second** caller's `onEvent`, which `index.ts` forwards to the same renderer —
and the renderer treats every `error` as turn-terminal.

Driven in the built app over its own IPC:

- `busy` cleared **~508ms** after the probe, reproduced in four runs, with the
  bubble reading *"A turn is already running"*, so the clear is **attributed**
  rather than coincidental.
- **main still held the turn**: a real prompt sent from the composer immediately
  afterwards was refused with the same overlap error.
- The send slot read **"Send"** again — no Stop on screen for a turn that is
  still running, and the obvious recovery is the failure a second time.

**But no user can currently produce the second send.** Counted at the IPC
boundary with a second `ipcMain.on('chat:send')` listener in main:

| dispatch | sends reaching main | refused by |
|---|---|---|
| two Enter keydowns in ONE task | **2** | nothing — both commits sent |
| two Enter keydowns in back-to-back macrotasks | 1 | **the emptied draft** |
| Enter + Send click in ONE task | **2** | nothing — both commits sent |
| Enter while a turn runs | 0 | #80's queue |

**The last column is the finding.** The realistic case is not stopped by the busy
flag at all — `InputBar.submit` clears `value` on the first commit, so the second
Enter returns on `!text.trim()` before the busy branch is consulted. The queued
note is absent in that run, which is how the harness can tell the two same-commit
returns apart.

So the protection is a **draft clear that exists for UI reasons**, inside the
renderer, and `chat:send` in main has no check at all (`isBusy()` appears nowhere
in its handler). It holds only while `useChat.send` remains the single caller of
`window.api.sendPrompt` — true today, pinned by nothing. **Filed as a follow-up
on that warrant**, not on the user path.

## Claim 2 — mechanism real, hang not observed. Half closed.

`interrupt()` sets a flag, calls the SDK and completes nothing locally, so a CLI
that accepts an interrupt and never answers would leave the UI busy until a
restart. Driven at the SDK in both cases the ticket names, fresh query per
repeat: **every driven interrupt was answered**, mid-stream text and
mid-tool-call alike, at **single-digit to low-hundreds of milliseconds**. None
was refused.

Closed on the measurement rather than on taste: #73's `onTerminal` already covers
the realistic way a CLI stops answering — the stream dying — and what remains is
"alive, accepted, never answers", which the harness could not produce. Re-open on
`hung > 0` or a stuck Stop in the wild.

**The subtype after an interrupt is not a reliable abort marker.** Both
`error_during_execution` (`is_error: true`) and `success` (`is_error: false`)
followed genuine interrupts. `engine.ts` keying on its own `interrupting` flag
rather than on the subtype is therefore correct, and anything that later keys on
the subtype will be wrong intermittently.

## Three instrument bugs, each of which produced a plausible answer first

1. **The synthetic/real split was classified by case NAME.** `enter+click` reads
   like a user story and is a same-task dispatch, so the first run reported a
   real user path that does not exist. Classify by **dispatch mode**, which is
   the property that decides it.
2. **An idle UI is not an idle engine.** Once a case triggers the overlap error
   the renderer reports idle while main still holds `turnResolve`, so the next
   case measured a *rejection* while believing it measured a *send*. The
   send count at the boundary survived it; the premises did not.
3. **The pane is a one-directional witness.** "Stopped growing" was read as "turn
   ended" until a run measured **116 → 116** characters on a turn the engine then
   refused a send for. A pane that is not growing is a pane between two deltas.

The generalisation: **ask the process that holds the fact.** `turnResolve` lives
in main, so main's own overlap refusal answers "is the turn still live" directly,
where rendered characters only correlate with it. The same move fixed the
`-821ms` interrupt — a latency measured against a result that predated its own
interrupt — by re-checking the premise at the moment of interrupting rather than
before the settle.

**And ordering beats waiting.** The queue case is the only one needing the
renderer to *know* a turn is running, and every other case can destroy that
state. It now runs first, which removes the dependency instead of managing it.

## Reversibility

Fully reversible: nothing shipped. Harness and findings are additive files under
`scripts/`; `git diff --stat -- src/` is empty. Re-running phase C2 after the
follow-up lands is the fix's end-to-end evidence — `busy` should stop clearing
under the probe.

## Related

- [[decisions]] · [[overview]] · [[pick-up]]
- [[2026-08-04-a-refusal-belongs-where-the-fact-lives]] — #107, the same principle
  one ticket earlier: the guard belongs where its fact lives
- [[2026-08-04-an-empty-list-is-attributed-not-observed]] — the other spike whose
  value was the attribution rather than the confirmation
- [[2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding]] —
  reachability as the finding, and the harness-is-production-code lesson
