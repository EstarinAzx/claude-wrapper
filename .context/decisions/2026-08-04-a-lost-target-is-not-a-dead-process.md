---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision, engine, spike, instrument]
---

# A lost target is not a dead process

**Decision:** #114 closes as **NOT REPRODUCED**, with **no `src/` diff**. Closing
a live, warmed, never-run engine and constructing another in the same tick did
not kill any host process in **76 scored pairs** across bare Node and the built
app. The ticket's own out-of-scope list holds: `ensureListEngine`,
`discardEngine` and `close()` are untouched.

The premise is **unreproduced rather than disproved**, and the difference is the
point — a rare event that did not recur in a bounded run has not been shown to be
absent. What the spike *can* settle positively, it did, and the answers moved the
question rather than confirming it.

| run | phases | scored pairs | host |
|---|---|---|---|
| 1 | B only, 18 per shape | 18 bare + 18 pair+read | survived, exit 0 |
| 2 | A B C (the committed `spike-114-findings.json`) | 8 bare + 8 pair+read + 11 app | survived |
| 3 | C only, 14 iterations | 13 app | survived |
| | | **52 bare Node + 24 app = 76** | **no death** |

An iteration counts only if `listModels()` answered non-empty **and** the OS
agreed a CLI child existed; the three unscored iterations are the first pick of
each phase-C run, where no engine exists yet by construction. The committed
findings file is **run 2** — one run, not the total, and it says so in its own
counts.

## `close()` does not kill the child, so the framing had no agent in it

The premise reads as "main closed a live pipe under itself and spawned another in
the same tick". Read against the SDK (0.3.220), the first half does not happen.
`ProcessTransport.close()` **ends stdin and returns**. Any kill is deferred behind
timers, and on win32 both of them:

| step | delay | action |
|---|---|---|
| `close()` | 0ms | `processStdin.end()` — a request, not a signal |
| outer timer | 2000ms | still alive? → enter the win32 arm |
| inner timer | +5000ms | still alive? → `kill("SIGKILL")` |

So the "same tick" contains no kill at all. Main asks the child to finish and
walks away, and the child exits on its own EOF long before the 7000ms backstop —
**measured**: across 8 consecutive pairs the closed child was still alive both
immediately after the pair and 1200ms later (`cli 2→2`, every iteration), then
gone by the next iteration's gate. The app therefore runs with **two overlapping
CLI children for a second or two after every pick**, which is a real fact nobody
had written down, and is *not* a crash mechanism.

The obvious crash theory has no foothold either. An `error` event on a stream with
no listener is an uncaught exception in Node — the single most plausible way a
host dies with nothing in its own code throwing. All three listeners are present:
`processStdin.on("error")`, `stderr.on("error")`, and the child object's own
`on("error")`. (`processStdout` has no direct listener; recorded as an
**observation only** — an absence assertion with no positive control measures
nothing (#76), and the three listeners above are that scan's positive control.)

## The pair costs a stall, and the stall is not ours

Decomposed, the "same tick" pair is not three cheap calls:

| call | median |
|---|---|
| `engine.close()` | **0ms** |
| `makeEngine()` | **0ms** |
| `engine.warmUp()` | **~1.2s** |

That is straight-line time between two `Date.now()` reads with no `await`
between them, so it is the **event loop blocked**, and in the app that loop is
Electron's main process. Every `session:pick-folder`, and every lazy list rebuild
#112 introduced, freezes main for over a second.

**Attributed, not guessed.** Timed with the engine removed entirely — a bare SDK
`query({...})` construction and nothing else — the constructor alone took
**1163ms and 1168ms** in two independent child processes. `warmUp()` is a thin
wrapper; the second belongs to the SDK spawning the CLI child inline inside its
constructor rather than deferring it. This is worth knowing precisely because it
is **not a fix this repo can make**.

In the built app the whole pick-plus-read round trip runs at a median **6.2s**
(min 5.9s, max 7.6s over 12 iterations), which independently corroborates #112's
"the wait moved, it did not vanish" — the ~1.2s stall above is main's share of
it, and the rest is the rebuilt handle's first list read.

## The finding that reframes the ticket

The observation #114 was filed from is "every later `page.evaluate` failed with
`Target page, context or browser has been closed`". That is **playwright
reporting its own connection**, and it is equally true of a dead main, a dead
renderer, and a main that is merely wedged — which the paragraph above measures
this exact path doing for over a second at a stretch.

**The record cannot tell those apart.** `spike-105`'s `reportAppDeath` prints the
exit code to the console and branches on `appExit === null ? 'still registered as
running' : …`, and **none of it is written into the committed findings JSON**. So
what those two runs actually printed is not recoverable, and "Electron's main
process simply gone" may be an inference from playwright's message rather than a
reading of an exit code. This is **not** a claim that main was alive — it is a
claim that the record does not say, which is a different and checkable thing.

`spike-114` closes that gap for anything that comes after it: on any failure it
asks **main directly** for its own pid, and records `processExited`,
`mainAnsweredAfter` and `pageClosed` as three separate facts. A death and a
driver artefact now have different verdicts (`REPRODUCED` vs
`DRIVER ARTEFACT`), and a run that reaches neither says so as
`NOT REPRODUCED in N scored pairs` with N printed.

## Three instrument bugs, all caught before they became findings

- **The harness read its own breakage as the phenomenon.** A phase-B child that
  exited 1 because its bundle failed to resolve scored `REPRODUCED — a host
  process died`. Fixed by making the verdict key on `diedWhileScoring` — a death
  with at least one *scored* pair behind it — never on a bare non-zero exit. The
  same class as #79's `boundsChangesWhileVisible`, which scored a gate's success
  as the artifact it measured.
- **The window gate scored every iteration dead.** `onModelReport` looks like the
  proof that a query is live, and `engine.ts`'s own comment says the `init`
  carrying the first model "arrives during `warmUp()`". Probed: in 20s of warm-up
  this CLI emitted only `hook_started`/`hook_response` and **no `init` at all**.
  The gate is now `listModels()` answering non-empty — `supportedModels()` over
  the control protocol, which no merely-spawned process can do, and which is the
  literal content of "a live, warmed, never-run query".
- **The teardown reported itself as the death.** Phase C read `appExit` *after*
  `app.close()`, which fires the same exit handler; and phase B's `rmSync` of the
  cwd threw EBUSY because a CLI child still held it — for exactly the reap window
  this file documents. Both would have manufactured the result they went looking
  for.

## What was NOT measured

- **Nothing died, so the ticket's question (2) — what actually dies — is
  unanswered by measurement.** Only the mechanism half is settled, and only
  negatively: `close()` cannot be the agent, because it does not kill.
- **The run counts are bounded and the base rate is unknown.** The original
  sighting was 2 in ~6 runs and then 0 in 4 more; a clean bounded run is weak
  evidence against a rare event, and the verdict string says so in those words.
- The `SPIKE108_PHASES=AC` sighting (`Resulting promise was garbage collected`)
  was **not** driven here. It shares "main went away quietly" with the others and
  little else, and it is now one more symptom the blocked-main reading explains
  without a death.

## Recommendation

1. **Close #114.** No `src/` change. The premise as stated has no mechanism, and
   the symptom has a better-supported explanation.
2. **File the 1.2s main-thread stall separately if the queue reopens.** It is
   real, reproducible on every run, and unrelated to the crash question — but it
   is an SDK cost, so the remedy is a deferred spawn or an off-thread warm-up,
   not a change to `engine.ts`.
3. **Any future harness that reports an app death must record the exit code in
   its committed findings**, not print it. That one line is the whole difference
   between this spike and a second round of the same question.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-08-04-the-wait-moved-it-did-not-vanish]] — #112, which introduced the
  routine rebuild this spike interrogates
- [[2026-08-04-an-empty-list-is-attributed-not-observed]] — #105, whose harness
  produced the observation and whose findings omit the exit code
- [[2026-08-04-a-late-subagent-edge-is-a-race-and-reachability-is-the-finding]] —
  #104, the reachability-is-the-finding shape this follows
