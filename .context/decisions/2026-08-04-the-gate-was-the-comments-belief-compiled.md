---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision, engine, subagents, testing]
---

# The gate was the comment's belief, compiled

**#111, shipped as `d572bb4`.** `close()` gated `drainSubagents()` on
`turnResolve`, so an engine torn down **between** turns left every open subagent
pulsing "running…" forever — and the CLI process is gone by then, so #104's
`onSubagent` terminal edge can never arrive either. Gate green: typecheck clean,
**1026 tests across 67 files** (+2), build clean. `src/main/engine.ts` is the
only `src/` file touched, by one moved line and two comments.

## Decision

**Move `drainSubagents()` above the `if (turnResolve)` block, matching
`onBackgroundTasks([])` one line up.**

```ts
onBackgroundTasks([])          // per-process level: already unconditional
drainSubagents()               // #111 — same fact, same teardown
if (turnResolve) {
  emit({ type: 'error', message: 'query closed' })
  finishTurn()
}
```

`close()` is the funnel **all six** engine-discard paths pass through, so one
line covers workspace switch, session target, backend flip, permission cycle,
model pick and the switch transaction. No new port, no call-site copy, no
`src/` change anywhere else.

`onTerminal` still does **not** fire for `close()`, and the `result` handler's
success branch is untouched — #104's ban on draining there stands. The asymmetry
between the three ports is deliberate and now has all three cases stated at the
site.

## Why

**The gate was not an oversight. It was the docstring, compiled.** Directly
above `drainSubagents` sat:

> Only called on the failure paths; a successful turn has already drained them
> via the Task tool_results.

Both halves are false, and the `if (turnResolve)` gate is exactly what that
sentence implies you should write. If the drain only matters on failure paths,
and a turn is always in flight on a failure path, then gating on `turnResolve`
costs nothing. The belief and the code were written together and were wrong
together, which is why the gate reads as deliberate rather than as a bug.

What made it false is #104, which landed *after*: a successful turn now
**deliberately** leaves a running agent open, because the `Agent` tool is async
and the agent may still complete and send its own terminal edge. So "between
turns" is precisely where an open agent lives — and `close()` is where its
process dies.

**This is the fourth consecutive leg where a comment claimed more than the code
delivered, and the first where the comment caused the defect rather than
merely overstating a correct one.** #109's was true of the ordering and read as
the guarantee; #110's was simply false about the debounce; this one was a
*justification*. The distinction matters for where to look: an overclaiming
comment is found by testing the code, but a justifying comment has to be
re-derived against its dependencies, because the code agrees with it perfectly.

**The remedy is only reachable because of #104.** Before it, draining in
`close()` would have emitted into a null `activeOnEvent` and reached nobody, so
the gate hid nothing observable. The port is what makes the fix have an effect —
and mutation M4 below is what proves the test knows that.

## A passing mutation proves the code, not the test

The ticket asked for a check before assuming this was a one-liner: an
unconditional call must not double-emit when a turn *is* in flight. Four
mutations:

| # | Mutation | Result |
|---|---|---|
| M1 | The gate restored (i.e. `main`) | criterion 1 **RED** — last port event `running` |
| M2 | `drainSubagents()` called twice on the in-flight path | **GREEN** |
| M3 | M2 **plus** `subagentParents.clear()` removed | criterion 3 **RED**, two `failed` |
| M4 | drain emits via `emit()` instead of `emitSubagent()` | criterion 1 **RED** |

**M2 passing is the trap.** It answers the ticket's question positively — the
second call really is a no-op — and it is tempting to write that down as the
exactly-once test being mutation-verified. It is not. A mutation the code
survives says nothing whatever about whether the *test* can fail; the test could
have asserted a constant and scored identically. Only the **compound** M3 reds
it, and in doing so names the mechanism: `subagentParents.clear()` is what makes
the second call a no-op, not the shape of the call site.

**The generalisation: when a mutation survives, the next move is a compound
mutation that removes the reason it survived.** Otherwise a robustness result
gets recorded as a sensitivity result, and the test is never established as able
to fail at all. This is the near-sibling of
[[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] and points the other
way: there the survivor meant the *code* was decoration, here it means the code
is genuinely robust and the *test* is still unproven. Both start from the same
observation, and neither conclusion may be assumed from it.

M4 earns its keep separately: routing the drain through `emit()` reds criterion
1 because between turns `activeOnEvent` is null. That pins the assertion as
being about **port delivery** rather than about any event reaching anywhere.

## Reversibility

Trivial — one line moves back inside the block. Do not: the between-turns test
reds immediately, and the restored gate would carry back the belief the
docstring no longer states.

Left deliberately undone: **no GUI driver.** Unlike #110, whose defect was a
message never sent and therefore left no artifact anywhere, this one is a port
vitest injects directly, so the cheap instrument is the honest one. The ticket's
stated baseline (995 across 64 files) was **stale for the fifth consecutive
ticket**; `main` was at 1024/67.

## Related

- [[decisions]]
- [[overview]] · [[active-work]] · [[pick-up]]
- [[2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding]] —
  #104, which both made this reachable and made it fixable
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — §3, the unconditional
  `onBackgroundTasks([])` this now matches
- [[2026-07-30-a-mutation-that-kills-nothing-is-an-answer]] — the same
  observation with the opposite conclusion
- [[2026-08-04-a-scheduled-report-is-not-a-sent-one]] — #110, the previous
  comment that claimed more than the code did
