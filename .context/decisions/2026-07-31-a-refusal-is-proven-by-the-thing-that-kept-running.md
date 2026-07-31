---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decisions, testing, drivers, workspace-switch]
---

# A refusal is proven by the thing that kept running

**Decision:** `gui-48` drives the `busy` refusal (#76) instead of printing a
standing `SKIPPED`. It starts a real turn in the temp workspace, waits for
`.model-pill` to go `disabled` — the in-flight idiom `gui-54`, `gui-73` and
`gui-75` already share — attempts the workspace switch, and asserts the
**user-visible** consequence: the dialog still opens, the busy refusal is what
the user sees, the workspace does not move, and the turn that was streaming
**keeps producing assistant text and finishes**. It never reaches into main to
read `isBusy`; the transaction's unit tests own the flag.

**Why now:** the skip's stated reason — "needs a real streaming turn against a
real CLI" — was true when written and **expired when `gui-73` shipped**, which
drives a real turn and kills the CLI under it mid-flight. A `SKIPPED` line is a
hole in the gate ([[2026-07-31-a-driver-establishes-its-premise]]), and this one
covered the single most consequential branch in the surface. **Re-read a skip's
stated reason before accepting it; the repo moves underneath it.**

**The finding, and the reason this note exists: destruction is quiet, so an
assertion phrased as an absence measures nothing.** The refusal was
mutation-verified by weakening `switchWorkspace`'s `isBusy` guard so the switch
went through under a live turn. Three assertions reddened — no refusal shown,
the workspace moved, no further assistant text. **Two did not:**

| assertion | refusal working | refusal broken |
|---|---|---|
| the turn completed | true | **true** |
| no new `.msg-error` | 0 | **0** |
| assistant text grew | +272 chars | **0** |

A switch that should have been refused **clears the pane and rebuilds the
engine**, so "the turn finished promptly" and "nothing errored" are both exactly
what destruction looks like. The tempting phrasings — *did it break?*, *did it
complain?* — are satisfied by the wreckage. Only a measurement of the protected
thing **continuing** tells the two apart.

Generalised: **when a guard exists to protect something, assert that the
protected thing went on living, not that no symptom appeared.** This is
[[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] with a sharper edge —
there, a mutation killing nothing suggested dead code; here the code is alive and
the *assertion* was dead, because the failure mode it was written against
produces silence rather than noise.

The two vacuous assertions were **kept, not deleted**, with the measurement
written beside them: they guard a different regression (a refusal that hangs the
turn or errors it out) and are honest about not covering this one.

**A premise wait is a measurement too.** The first green run failed its own
premise — the turn never went in flight inside 20s, because it starts in the
brand-new temp workspace the switch above just moved into and the CLI is cold.
Widened to 60s, and the failure line now distinguishes a send that never reached
the pane (no `.msg-user`) from a CLI that never started. **One FAIL string for
two causes is how a driver wastes an afternoon.**

**The dialog must still open while busy**, and that is asserted at one call.
The affordance is deliberately not busy-gated — main owns the busy decision and
a disabled button would make its refusal unreachable, the same reasoning the
foreign session row carries. That assertion did not redden under this mutation
either; it guards the opposite mistake.

**Reversibility:** easy — the section is additive and self-contained, and no
existing `gui-48` assertion was edited to make room for it.

## Related

- [[decisions]] — index
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule that makes a
  `SKIPPED` line a hole rather than a note
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — the reflex this
  sharpens
- [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] — the
  transaction whose `busy` rejection this finally drives
- [[2026-07-23-busy-switch-block-not-detach]] — why the switch blocks rather
  than detaching, i.e. why there is a refusal to drive at all
- [[active-work]] · [[pick-up]]
