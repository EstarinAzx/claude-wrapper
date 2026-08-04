---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision, engine, main, instruments]
---

# The wait moved; it did not vanish

**#112, shipped as `e05f400`.** Picking a model, flipping permission or flipping
backend calls `discardEngine` and rebuilds nothing, while `commands:list` and
`model:list` were answered straight off that handle — so both went empty and
stayed empty until the next send. Gate green: typecheck clean, **1034 tests
across 68 files** (+8), build clean. New file `src/main/list-engine.ts`; the two
read handlers in `src/main/index.ts` are the only other `src/` change.

## Decision

**Rebuild lazily at the two READ handlers, never eagerly in `discardEngine`.**

```ts
export const ensureListEngine = <E>(ports: ListEnginePorts<E>): E => {
  const live = ports.live()
  if (live) return live
  const rebuilt = ports.make()
  ports.set(rebuilt)
  ports.warmUp(rebuilt, ports.resume() ?? undefined)
  return rebuilt
}
```

`discardEngine` and all three writers are **untouched** — phase B of the #105
harness still reads them as "discards, rebuilds nothing", which is the point:
the asymmetry between a cheap discard and a lazy rebuild is now the design
rather than an accident.

The resume target travels **into** `warmUp` because `resume` binds when the query
is CONSTRUCTED (#73). `discardEngine` already stores the right value per path —
the session id for a model or permission pick, `null` for the backend flip's
deliberate fresh start — so reading `pendingResume` here handles all three
writers uniformly *because* that asymmetry is already encoded there.

## Why the cost is the interesting part

The ticket priced the rejected alternative (rebuild+warm inside `discardEngine`)
and this leg re-measured it: **median 6138ms per pill click** on this machine.
What the ticket did not state, and what this leg measured, is the other half:

| | first list read after a writer | answer |
|---|---|---|
| before | **0–1ms** | empty — wrong |
| after | **median 5480–5766ms** | 15 models / 119 commands — right |
| either | 1ms | on a live engine |

**The wait did not disappear. It moved** — off the click, onto the menu open, and
off every user onto the one who actually opens a menu. That is the trade the
ticket chose and it still holds, but the durable fact is that opening the model
menu after a pill click is now a **five-second wait**, and phase A attributes
almost all of it to `supportedCommands` (4.5–5.5s), not to query construction
(`supportedModels` answers in 0ms on the same warm query). Anyone adding a third
consumer of a list read inherits that wait and should know it is one CLI call,
not the rebuild.

**A fix that relocates a cost has to say where it went.** "Instant and empty" is
a worse product than "correct in five seconds", so this is the right trade — but
a reader of the diff alone would see a bug removed and no cost at all.

## The no-cache contract, demonstrated rather than asserted

Caching the last non-empty list stays rejected, and this run measured *why*
rather than citing the comment: the backend flip answers **15 → 5**, not
15 → 15. `wisped -> native` legitimately offers fewer models, so getting the
**smaller** number back is positive evidence the rebuild used the new mode's
spawn env. A cache would have answered 15 and been confidently wrong.

## The differential was re-measured, not compared

The committed `spike-105-findings.json` already held a pre-fix measurement from
the #105 leg. It was **not** used as the "before": the pre-fix `index.ts` was
stashed, rebuilt and re-run on this machine minutes before the post-fix run.

| build | runs | commands emptied | first read |
|---|---|---|---|
| pre-#112 | 2 | **6/6** | 0–1ms |
| post-#112 | 4 | 0/6 | ~5.5s |

Comparing against a committed artifact from another session would have shared no
machine, no CLI version and no hour with the "after" — and this leg's own
toolchain incident (below) is the standing proof that a machine can change
underneath a measurement without anyone touching the code.

## A spike harness must be taught the fix, or it reports the fix as failure

Phase B asserted the three **writers** call `discardEngine` and rebuild nothing.
The remedy is in the **readers**, which phase B could not see — so a correctly
fixed app printed `PREMISE: NOT CONFIRMED as stated`, which reads exactly like a
spike that measured nothing.

Phase B now also reads `commands:list` and `model:list` for `ensureListEngine(`,
and the verdict line distinguishes the two states in words:

> NOT REPRODUCIBLE, AND EXPLAINED: the read handlers rebuild the engine lazily
> (#112 landed) … revert that fix and phase B flips `readersRebuildLazily` to
> false and this line back to CONFIRMED.

That is a drift alarm as well as a caption. **Any harness whose premise a later
ticket fixes needs this**, or its own success is indistinguishable from its
failure the next time someone runs it.

## The install step is a port so that omitting it is visible

`ensureListEngine` takes five ports for five lines, and `set` is separate from
`make` deliberately. A version that rebuilds without installing **answers the
current read correctly** and spawns a second process on the next one — invisible
to any assertion on the return value. Mutation evidence, three mutations and
three distinct reds:

| # | Mutation | Result |
|---|---|---|
| M1 | `warmUp(rebuilt, undefined)` — resume dropped | the two conversation-keeping writers **RED**; the non-empty pins stay **GREEN** |
| M2 | `ports.set(rebuilt)` removed | the second-read pin **RED** |
| M3 | early return removed | the live-engine pin **RED** |

**M1 is the ticket's own warning, reproduced**: counting rebuilds — or asserting
the list came back non-empty — passes while the conversation is silently lost.

## Reversibility

Easy: delete the module, restore `engine?.listCommands() ?? []`. Don't — the
premise reproduces immediately, and phase B now says so out loud.

Deliberately not done: no eager rebuild, no cache, no unification of the three
writers, no GUI driver (phase C of the #105 harness drives the built app over its
own IPC already, so a driver would duplicate it).

## Related

- [[decisions]]
- [[overview]] · [[active-work]] · [[pick-up]]
- [[2026-08-04-a-green-suite-does-not-prove-a-sound-toolchain]] — the same leg's
  other lesson, and why the "before" was re-measured here
- [[2026-08-04-an-empty-list-is-attributed-not-observed]] — #105, which measured
  this premise and priced this remedy
- [[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]] — #109,
  the other leg where `pendingResume` and a rebuilt engine had to agree
