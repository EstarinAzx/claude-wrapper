---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed last leg

**#77 — `gui-51` drives every surface it names into overflow.** Merged as
`88c1e3f`, ticket closed. **No `src/` change** — the whole ticket is the driver
plus a decision record. Gate green: typecheck clean, **864 tests across 58
files** (unchanged, as expected), build ok. All **19** assertion drivers re-run;
see the `gui-75` note below before reading its batch red as a regression.

Seven surfaces now measured, none inherited, no `NOT DRIVEN` line left:

```
probe div          9.6css / 12dev
.command-popover   9.6css / 12dev
.command-list      9.6css / 12dev
.model-menu        9.6css / 12dev
.message-input     9css / 11.25dev (coarse)
.session-groups    9.6css / 12dev
.chat              9.6css / 12dev
```

**The carry-forward is about setup order, not about CSS: a driver's own setup
can revoke the capability it is about to measure.** Measured in screen order,
`gui-51` came back with a **1-row** model picker and two command surfaces that
**never mounted** — indistinguishable from a dead CLI. The CLI was fine:
`openSession` calls `targetSession`, which **closes the engine**, so
`listModels()` and `listCommands()` answer `[]` **by contract** from that moment
on. **Order setup steps by what each one takes away, not by what it needs.**

Two smaller ones worth carrying:

- **An empty list beside a static row looks populated.** The picker always
  renders the "default" pick before the CLI's list, so an empty fetch renders as
  a plausible one-item menu. Reason about what the list was supposed to *add*.
- **`.session-groups` was passing by inheritance** — it overflowed only because
  this machine's store holds ~490 sessions. Seeded now. Converting a quiet note
  into a failure is what exposes that class of pass.

See [[2026-07-31-a-drivers-own-setup-can-revoke-what-it-measures]].

## Frontier — #78, with two behind it

**Run the frontier query anyway.** This table is a summary and goes stale the
moment the owner files something — that is this project's standing lesson, from
the leg that wrote "closing #70 empties the queue" while #71 sat unblocked.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | Ticket | State |
|---|---|---|
| **#78** | Measure the launch artifact; gate `win.show()` only if it is objectionable | **frontier**, unblocked (`blocked_by: 0`, verified live this leg) |
| #79 | The window remembers its size and position | **blocked by #78** (`blocked_by: 1`, re-verified live this leg) |
| #80 | Type-while-busy composer with a queued send | unblocked, filed last on purpose |

**#78 is a measurement ticket and #71 is its shape: AC1 is the measurement, and
the fix is conditional on it**, because the ADR says **"Build it only if
measured."** If the artifact turns out not to be objectionable, saying so with
numbers **is** the delivery — do not build the gate to have built something.

**Motivate on the zoom reflow, not the backdrop flash.** The zoom reflow happens
on **every** launch; the backdrop flash is opt-in. The ADR ranks them in that
order and calls the other way round "backwards".

**#71 and #77 both bear on how to measure it.** Measure with
`getBoundingClientRect` and in **device** pixels where a snapped physical
quantity is involved; never `offsetWidth - clientWidth`; never off a screenshot
(a capture cannot see the right ~20% of the layout at zoom 1.25). And if the
measurement needs a driver, **#77's ordering rule applies**: reach anything
CLI-sourced before opening a session.

**#79 must not use a main-side store.** The obvious argument for one — "main
*reads* the bounds, so the ADR's own principle prescribes it" — was tested and is
**wrong**: [[2026-07-31-a-preference-lives-where-it-is-read]] names "a small
main-side store for *the main-process ones*" verbatim and rejects it, and
`backgroundMaterial` is the shipped counterexample. #79 amends **one** ADR
sentence and reverses nothing.

**#80's substance is the state machine**, not the typing. Flushing on every
`busy → false` is wrong: it resends after **Stop** and can spend the queued
prompt on a **terminal** engine. And while busy the send button *becomes* Stop,
so there is no button to press — that design hole is the ticket's to answer and
no test can see it.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #77:

- **Opening a past session CLOSES the engine** (`openSession` →
  `targetSession`), after which `listModels()` / `listCommands()` return `[]` by
  contract. Any driver needing the model picker, the slash popover or the
  Commands dock must reach them **first**. Nothing throws.
- **`.model-menu` always renders one static "default" row** — a count of 1 means
  the fetched list was empty, not that the CLI offers one model.
- **`gui-51` now seeds its own store** (24 sessions + one 30-turn session in
  `~/.claude/projects/gutter51-<uuid8>/`) and picks a temp workspace, not the
  repo. Do not "simplify" it back to picking `APP_DIR`.
- **`.message-input` must read `exact: false`** — the textarea's shim reads 0 and
  the coarse fallback is what measures it. The driver FAILS on an exact reading.
- **The coarse budget is spent, not spare**: 11.25dev vs 12.5 expected is 1.25
  off, past the exact budget of 1 and inside the coarse 2.25. Tightening it
  reddens a healthy composer. **The budgets were not moved and must not be.**
- **`gui-51` must not touch the stylesheet** — `tests/scrollbar.test.ts` scans
  every line naming a scrollbar pseudo-element, comments included.
- **`gui-75` has now gone red in TWO consecutive batch runs and green solo both
  times** (`could not drive: the window would not take focus` this leg). A batch
  that reds only there is a green batch — re-run it alone before writing
  anything down.

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

`main` = `88c1e3f` + this leg's `.context` commits, pushed. No open branches.
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
- [[2026-07-31-a-drivers-own-setup-can-revoke-what-it-measures]] — #77
- [[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]] — #76
- [[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]] — #75
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule #74 extended to
  the launch line, #75 to the window's own focus state, #76 to a skip whose
  reason expired, and #77 to the driver's own setup order
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — #71,
  the instrument #77 kept byte-identical
- [[2026-07-31-a-preference-lives-where-it-is-read]] — governs #78 and #79
- `.claude/vibe.md` — this batch's run: the autonomy grant, 9 proposals, 7 refuted
