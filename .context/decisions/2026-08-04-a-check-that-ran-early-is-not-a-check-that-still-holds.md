---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# A check that ran early is not a check that still holds

**#109, shipped as `74cbecf`.** `switchWorkspace` read `isBusy()` before
awaiting `resolveTarget`, then ran its mutations on the far side of that await —
so a turn beginning inside the window was torn down by `closeEngine()` while the
switch still reported `ok`. Gate green: typecheck clean, **1011 tests across 66
files** (+2), build clean. `src/main/switch-workspace.ts` is the only `src/`
file touched, by one statement and two comments.

## Decision

**Re-read `isBusy()` immediately after the await, before the first mutation —
and say in the comment why it is not redundant.**

```ts
if (target.status === 'unavailable') return { status: 'not-found' }
if (target.status !== 'ok') return { status: target.status }
if (ports.isBusy()) return { status: 'busy' }   // the await was a window
```

The pre-await checks are **byte-identical**: this is an addition, not a
reordering, and the fixed precedence (`busy` → `missing-cwd` → `not-found`) the
function's comment promises is untouched. No lock, no queue, no `switching`
flag, and no renderer change — one extra read of a value main already owns.

The re-check sits **after** the target checks, as the ticket specified, so a
post-await busy is reported after `not-found` rather than ahead of it. The two
precedences are therefore asymmetric on purpose. Both are rejections that mutate
nothing, and keeping the existing checks unmoved was worth more than symmetry.

## Why

The comment this ticket falsified was not careless. It was **true, and not the
guarantee it was read as**:

> Every check runs BEFORE the first mutation, which is what makes a rejection a
> no-op.

That is a claim about *ordering*, and the ordering was always correct — the
re-check added here also runs before the first mutation. What was missing is
that a check's **answer** can expire between running and being acted on. Main is
single-threaded, so nothing preempts the function; but `await` yields the loop,
and `chat:send` (`index.ts:701`) carries **no busy guard of any kind** — #108
established that, and it is re-asserted here. A turn started in the gap makes
`isBusy()` true while the local reasoning still believes the value it read.

**The generalisation: ordering a check before a mutation is necessary and not
sufficient. If an await separates them, the check must be re-read on the far
side.** This is the sibling of #107's rule — that one is about *where* a guard
lives, this one about *when* its answer was taken. Both failures look correct in
the source and are only visible against the interleaving.

**The premise was reproduced and the ticket's framing needed correcting —
sixth consecutive leg.** "Can enumerate the whole session store on a cold index"
implies a wide window. Measured against the real store (160 project dirs, 918
transcripts), seven paired runs:

| index | samples (ms) | median |
|---|---|---|
| **cold** | 18.9, 18.9, 18.7, 17.8, 17.9, 17.1, 18.2 | **18.2ms** |
| **warm** | 0.0 × 7 | **0.0ms** |

Two consequences, pointing opposite ways:

1. **The window is ~18ms, not hundreds.** Two independent *user* actions landing
   inside 18ms is not a realistic human sequence, so the plain "click a row, then
   press Enter" story does **not** reach this.
2. **Cold is the ORDINARY path, not the edge case.** `session:list` calls
   `resetSessionIndex()` (`index.ts:412`), and that same listing renders the row
   the user clicks to get here. Warm is 0.0ms — so **the window exists only
   because the rail's own refresh invalidates the index.** The feature that
   keeps the list honest is what opens the gap.

The plausible reachable path therefore has only **one** human-timed side: a #80
queued send flushing from its `turn-end` effect while the user clicks away as
the turn finishes. That was **not** driven end to end, and the entry does not
claim it was — an Electron harness hunting an 18ms race is disproportionate to a
one-line guard whose correctness does not depend on the window's width. Recorded
as plausible, not as measured.

**Mutation-verified twice, and the second mutation is the one that earns its
keep.** Removing the re-check reds both new tests. Moving it *after* the
mutations — the "tear down, then report busy" version the ticket warns about —
**passes the status assertion** and is caught only by
`expect(p.calls).not.toContain('closeEngine')`. That confirms mechanically what
the ticket asserted in prose: the no-mutation half is the contract, and a
status-only suite would have shipped the destructive version.

The ordinary-path test asserts `isBusy` was read **twice**, which pins the guard
as reached on the ok path rather than sitting behind a branch only the failing
case takes.

The ticket's stated baseline (979 tests across 64 files) was **stale for the
fourth consecutive ticket**; `main` was at 1009/66.

## Reversibility

Trivial. One statement in one pure function with one call site; deleting it
restores the previous behaviour exactly. The comment is the real durable
artifact — the next reader's obvious move is to delete a second read of the same
value as redundant, which is why the reason is stated at the site rather than
only here.

Left deliberately undone: `chat:send` still has no busy guard of its own (that
is #113's subject, not this one's), the `resumeId === null` path takes no
re-check because it performs no await, and no GUI driver was added — the whole
defect lives in a main-side pure module vitest already owns.

## Related

- [[decisions]]
- [[overview]] · [[active-work]] · [[pick-up]]
- [[2026-08-04-a-refusal-belongs-where-the-fact-lives]] — the sibling rule: that
  one is *where* a guard lives, this one is *when* its answer was taken
- [[2026-08-04-the-composer-is-held-shut-by-a-draft-clear-not-a-guard]] — #108,
  which established that `chat:send` carries no busy check at all
- [[2026-07-23-busy-switch-block-not-detach]] — the refusal this one repairs,
  and still the app's only reading of whether a turn runs
