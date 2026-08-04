---
type: active-work
project: claude-wrapper
updated: 2026-08-04
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-08-04 by Opus 5 (auto), chain 3 relay leg 7 (`relay-leg`)_
_At commit: `795be69` on `main`, pushed and level with `origin/main`_

## Current focus

**#104 landed and closed.** A subagent's terminal status now travels on its own
injected port (`onSubagent` → `subagent:changed`), so an edge arriving after
`result/success` reaches the renderer instead of a null `activeOnEvent`. Next
frontier is **#105**, a spike: does picking a model leave the model menu and
slash commands empty until the next send?

## State

- **In flight:** nothing. Ticket branch squash-merged and deleted; only this
  `.context/` handoff is pending.
- **Done this session:** #104 as `795be69`. New `EnginePorts.onSubagent`,
  `subagent:changed` IPC channel, `useChat` subscription, and
  `scripts/spike-104-late-subagent.mjs` + scrubbed findings.
- **Gate:** typecheck clean; **995 tests across 64 files** green (+5); build clean.
- **Mutation evidence:** routing the port through `emit` reds the two ordering
  pins; `drainSubagents()` on the success branch reds **seven** tests; dropping
  the renderer subscription reds the dock test; pointing `drainSubagents` back at
  `emit` reds both new drain pins.
- **Filed this session:** **#111** — `close()` still gates its drain on
  `if (turnResolve)`, stranding an open subagent when the engine is torn down
  between turns. Pre-existing; #104 is what makes it fixable.
- **Queue:** seven open, #105 through #111, all `ready-for-agent`; none
  `ready-for-human`. #105's live `blocked_by` is 0.
- **Blocked:** nothing.

## Pick up here

Take **#105** after re-running the frontier query. It is a **SPIKE and must stay
one** — harness, findings, recommendation, **no `src/` diff**. Killing its own
premise is a successful outcome, and the premise is genuinely doubtful:
`commands:list`'s own comment calls the empty answer "the dock's honest empty
state", and `gui-52` is a standing environmental red for an empty CLI model list,
so an empty list in this sandbox is **indistinguishable from a null engine**.

Copy `scripts/spike-104-late-subagent.mjs` for the harness shape. Two of its
lessons transfer directly:

- **A single-shot instrument cannot measure a race or an intermittent state.**
  Run the path several times and report how many attempts it took, rather than
  reporting one sample as the answer.
- **Review the instrument as production code.** #104's harness shipped two bugs
  that each would have produced a confident wrong answer — a null status counted
  as terminal, and a filter on a field that was never recorded.

## Skills for next session

- `superpowers:systematic-debugging` — #105 is a measurement, and its stated
  premise may be false. Measure before concluding.
- `superpowers:verification-before-completion` — full test/typecheck/build gate
  before landing, even for a no-`src/`-diff spike.

## Open questions

None for #105 beyond what the spike exists to answer. `ready-for-human` remains
forbidden while the owner is AFK.

## Recent context

- The #104 ordering is a **race, not a rule**: three runs gave LATE 14519ms,
  early 1699ms, LATE 13126ms on one prompt and binary. The `Agent` tool is async
  (#81 finding 6), so parent and subagent settle independently.
- Because it is a race, the answerable question is **reachability**, and one
  observation settles it. An all-early run does not refute the finding — the
  harness says so in its own output rather than leaving a reader to infer it.
- `drainSubagents()` remains forbidden on the success branch. Run 1's still-open
  agent completed, so draining would report a live agent as failed.
- Every pre-existing subagent drain test builds the engine **portless**, so it
  exercises the fallback branch main never uses. Two port-wired drain tests were
  added for that reason; anything touching the drain paths should keep both.
- `gui-75` and `gui-52` still carry standing environmental reds. Reproduce solo
  on clean `main` before treating either as a regression.

## Related

- [[overview]]
- [[pick-up]]
- [[decisions]]
- [[2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding]]
