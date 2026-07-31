---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed last leg

**#74 — run the renderer sandboxed.** Merged as `07544e8`, ticket closed. Gate
green: typecheck clean, **843 tests across 57 files**, build ok. All **19**
drivers re-run green; `gui-74` joined the set.

The trap was in the driver set, not the app: every existing driver launches with
`--no-sandbox`, which disables OS sandboxing app-wide, so a `gui-74` that copied
the house launch line would have read the flag back as `true` off a renderer
Chromium had already been told not to sandbox. See
[[2026-07-31-the-renderer-is-sandboxed-and-the-driver-must-not-undo-it]].

## Frontier — #75, with five behind it

That leg emptied the tracker; a `/preset vibe` run then refilled it from the
set-aside work, under an **explicit owner autonomy grant** (quoted in
`.claude/vibe.md`). **Run the frontier query anyway** — this prose goes stale the
moment the owner files something, and that is the standing lesson of this
project's chains.

| # | Ticket | State |
|---|---|---|
| **#75** | Turn-end notification + taskbar flash when unfocused | **frontier**, unblocked |
| #76 | `gui-48`: drive the busy refusal instead of printing `SKIPPED` forever | unblocked |
| #77 | `gui-51`: drive every named surface into overflow | unblocked |
| #78 | Measure the launch artifact; gate `win.show()` only if objectionable | unblocked |
| #79 | The window remembers its size and position | **blocked by #78** |
| #80 | Type-while-busy composer with a queued send | unblocked, filed last on purpose |

**#76 and #77 are deliberately two tickets, not one.** They share only a theme;
bundling them lets one close while the other's holes still print, and the
record's precedent (#65, #71) is one driver per ticket.

**Read the ticket bodies before writing code.** They were written against an
adversarial pass that killed two proposals and reshaped three, so the known
collisions are already in them. Three worth knowing before you open one:

- **#79 must not use a main-side store.** The obvious argument for one — "main
  *reads* the bounds, so the ADR's own principle prescribes it" — was tested and
  is **wrong**: [[2026-07-31-a-preference-lives-where-it-is-read]] names "a small
  main-side store for *the main-process ones*" verbatim and rejects it, and
  `backgroundMaterial` is the shipped counterexample (applied by main, stored by
  the renderer). #79 amends **one** ADR sentence and reverses nothing.
- **#78 is a measurement ticket** whose fix is conditional, like #71. Its AC1 is
  the measurement, because the ADR says **"Build it only if measured."** Motivate
  it on the **zoom** reflow (universal, every launch), not the backdrop flash
  (opt-in) — the ADR ranks them explicitly and calls the other way round
  "backwards".
- **#80's substance is the state machine**, not the typing. Flushing on every
  `busy → false` is wrong: it resends after **Stop** and can spend the queued
  prompt on a **terminal** engine. And while busy the send button *becomes* Stop,
  so there is no button to press — that design hole is the ticket's to answer and
  no test can see it.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #74:

- **`gui-74` launches WITHOUT `--no-sandbox` on purpose**; standardising it onto
  the house launch args silently guts it — it would keep passing. Second
  deliberate divergence, after `gui-69` keeps the GPU on.
- **`sandbox: true` is invisible to vitest.** Flip it back and all 843 tests stay
  green. `gui-74` is the only thing that reddens.
- **Assert the EFFECT, not the request** — `getLastWebPreferences()` is what was
  *asked for*; `app.getAppMetrics()` joined by `getOSProcessId()` is what the OS
  *granted*.
- **A boolean that is false everywhere is not evidence** — the GPU process
  reading `sandboxed: true` is what proves the field is live on this platform.
- **A driver crash is not a driver failure.** `gui-73`'s batch red was
  `0xC0000142` from a collapsing process tree; the pid count (8 vs 1) was the tell.

Still true: **`resume` binds at query CONSTRUCTION** and `warmUp` TAKES the
target; **a stream dying BETWEEN turns emits nothing**; **`onTerminal` must never
fire for `close()`**; **a test asserting an ABSENCE is the one most likely to be
vacuous**; **no expected driver failure — any red is a real regression**; a driver
must ESTABLISH the state it asserts and be shown red first; **pins are
mutation-verified and never "fixed" by editing an expectation, and no pin
retirement is authorised**; **do not add a second busy flag**; **never un-key the
composer** (`<InputBar key={cwd}>` is the whole reset) and **anything
workspace-scoped must join the `ok` branch**; `tests/scrollbar.test.ts` scans
every line containing a scrollbar pseudo-element, comments included; `gui-51`
compares in **device** pixels; measure with `getBoundingClientRect`, not
screenshots; `--disable-gpu` flattens acrylic; `.titlebar-center` must stay IN
FLOW; `src/` is CRLF; a new `window.api` channel needs **all four** mock sites
plus `preload/index.d.ts`; never hardcode a model name.

## Baseline

`main` = `07544e8` + this leg's `.context` commits, pushed. No open branches.
Every driver green.

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
- [[2026-07-31-the-renderer-is-sandboxed-and-the-driver-must-not-undo-it]] — #74
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule #74 extended to the launch line
- [[2026-07-31-a-preference-lives-where-it-is-read]] — governs #78 and #79
- `.claude/vibe.md` — this batch's run: the autonomy grant, 9 proposals, 7 refuted
