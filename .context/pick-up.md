---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed last leg

**#76 — `gui-48` drives the busy refusal instead of printing `SKIPPED` forever.**
Merged as `c9114a5`, ticket closed. **No `src/` change** — the whole ticket is
the driver plus a decision record. Gate green: typecheck clean, **864 tests
across 58 files** (unchanged, as expected), build ok. All **19** assertion
drivers re-run green.

**The carry-forward is about assertions, not about the app: destruction is
quiet.** The refusal was mutation-verified by weakening `switchWorkspace`'s
`isBusy` guard so the switch went through under a live turn. Three assertions
reddened — no refusal shown, the workspace moved, no further assistant text.
**Two did not:** "the turn completed" and "no new `.msg-error`" both stayed
green, because a switch that should have been refused *clears the pane and
rebuilds the engine*, and finished-promptly-with-nothing-to-complain-about is
exactly what the wreckage looks like. Only measuring the protected thing
**continuing** (+272 chars green, 0 red) discriminated. Both vacuous assertions
were kept for the different regression they guard, with the measurement written
beside them. See
[[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]].

Second, smaller: **a skip's stated reason has a shelf life and nobody re-reads
it.** `gui-48`'s said "needs a real streaming turn against a real CLI", which
was true when written and false from the moment `gui-73` shipped.

## Frontier — #77, with three behind it

**Run the frontier query anyway.** This table is a summary and goes stale the
moment the owner files something — that is this project's standing lesson, from
the leg that wrote "closing #70 empties the queue" while #71 sat unblocked.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | Ticket | State |
|---|---|---|
| **#77** | `gui-51`: drive every surface it names into overflow, so `NOT DRIVEN` stops being reachable | **frontier**, unblocked (`blocked_by: 0`, verified live this leg) |
| #78 | Measure the launch artifact; gate `win.show()` only if objectionable | unblocked |
| #79 | The window remembers its size and position | **blocked by #78** (`blocked_by: 1`, re-verified live this leg) |
| #80 | Type-while-busy composer with a queued send | unblocked, filed last on purpose |

**#77 is #76's sibling and the closing comment on #76 is the cheapest thing to
read first.** Same shape — a driver printing a standing hole above a `PASS` —
and two rules transfer:

- **Do not widen the gutter budgets** to fit a newly measured surface. #77's own
  body says it, and #71 measured the headroom that makes the tight budget
  meaningful (deleting the global rule puts every surface at 15dev against an
  expected 12.5, i.e. 2.5× margin). A failure there is a finding, not a
  tolerance problem.
- **Assert the protected thing continuing, not the symptom being absent.** #76's
  mutation is the worked example.

Also true of #71's instrument, which #77 inherits: **`gui-51` compares in DEVICE
pixels**, the shim's zero-reading guard is load-bearing (a `<textarea>` renders
no element children), and `offsetWidth - clientWidth` must never be used to
measure a gutter again.

**#78 is a measurement ticket** whose fix is conditional, like #71 — AC1 is the
measurement, because the ADR says **"Build it only if measured."** Motivate on
the **zoom** reflow (universal, every launch), not the backdrop flash (opt-in);
the ADR ranks them and calls the other way round "backwards".

**#80's substance is the state machine**, not the typing. Flushing on every
`busy → false` is wrong: it resends after **Stop** and can spend the queued
prompt on a **terminal** engine. And while busy the send button *becomes* Stop,
so there is no button to press — that design hole is the ticket's to answer and
no test can see it.

**#79 must not use a main-side store.** The obvious argument for one — "main
*reads* the bounds, so the ADR's own principle prescribes it" — was tested and is
**wrong**: [[2026-07-31-a-preference-lives-where-it-is-read]] names "a small
main-side store for *the main-process ones*" verbatim and rejects it, and
`backgroundMaterial` is the shipped counterexample. #79 amends **one** ADR
sentence and reverses nothing.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #76:

- **`gui-48` now costs one real CLI turn and waits up to 600s.** Its busy section
  runs last, from inside the temp workspace the earlier switch moved into.
- **Its survival assertion is `replyChars > 0`, sampled BEFORE the click.**
  Sampling after narrows the window to nothing. `completed` and `newErrors` are
  **measured vacuous** for that branch and kept for another — do not cite them as
  covering the refusal, and do not delete them as dead.
- **The premise wait is 60s and earned it** — a green run really did fail its own
  premise at 20s, because the turn starts in a brand-new temp workspace and the
  CLI is cold.
- **The "Open project" affordance must stay reachable while busy** — now pinned
  by a driver (dialog opens exactly once during the refused switch), not just by
  a comment.
- **`gui-75` is focus-dependent and unreliable inside a long batch.** It came
  back red in this leg's 19-driver batch with `could not drive: the window lost
  focus during the second turn` (`focusedAtEnd: false`) and **green re-run alone**
  (`focusedAtEnd: true`). Read the FAIL line before believing the red:
  `could not drive:` is the driver reporting its own setup, which is #65's rule
  working. Same class as the `gui-73` batch red a previous leg diagnosed.

Still true: **`resume` binds at query CONSTRUCTION** and `warmUp` TAKES the
target; **a stream dying BETWEEN turns emits nothing**; **`onTerminal` must never
fire for `close()`**; **`win.isFocused()` alone is not "someone is looking"**;
**`app.setAppUserModelId` cannot be read back at runtime**; **a test asserting an
ABSENCE is the one most likely to be vacuous**; **no expected driver failure — any
red is a real regression**; a driver must ESTABLISH the state it asserts and be
shown red first; **pins are mutation-verified and never "fixed" by editing an
expectation, and no pin retirement is authorised**; **do not add a second busy
flag**; **never un-key the composer** (`<InputBar key={cwd}>` is the whole reset)
and **anything workspace-scoped must join the `ok` branch**;
`tests/scrollbar.test.ts` scans every line containing a scrollbar
pseudo-element, comments included; `gui-51` compares in **device** pixels;
measure with `getBoundingClientRect`, not screenshots; `--disable-gpu` flattens
acrylic; `.titlebar-center` must stay IN FLOW; `src/` is CRLF; a new
`window.api` channel needs **all four** mock sites plus `preload/index.d.ts`;
never hardcode a model name.

## Baseline

`main` = `c9114a5` + this leg's `.context` commits, pushed. No open branches.
Every assertion driver green (`gui-75` green on a clean solo re-run).

## Do not decide these

**Nothing — the list is empty.** All seven previously parked owner calls were
resolved on 2026-07-31 under the grant quoted in `.claude/vibe.md`. Note what the
grant did **not** do: it removed *ownership* as a ground for deferring, not the
requirement for evidence. Two calls were deliberately left **half**-decided
because the record would not carry the other half — Tailwind is **not dropped**
but the adopt-utilities question **stays open**, and the titlebar's control count
**does not change** while the aesthetic question **stays the owner's**.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]] — #76
- [[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]] — #75
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule #74 extended to
  the launch line, #75 to the window's own focus state, and #76 to a skip whose
  reason expired
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — #71,
  the instrument #77 inherits
- [[2026-07-31-a-preference-lives-where-it-is-read]] — governs #78 and #79
- `.claude/vibe.md` — this batch's run: the autonomy grant, 9 proposals, 7 refuted
