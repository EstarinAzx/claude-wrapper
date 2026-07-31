---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed last leg

**#75 — turn-end notification and taskbar flash when the window is unfocused.**
Merged as `9905e1d`, ticket closed. Gate green: typecheck clean, **864 tests
across 58 files** (was 843/57), build ok. All **19** assertion drivers re-run
green; `gui-75` joined the set.

**The ticket's own prescribed instrument was wrong, and probing it first is the
carry-forward.** The AC said "`win.isFocused()` is the check". Measured on
Electron 43 / Windows 11 before any code was written: `win.blur()` moves
`isFocused()` not at all and fires no `blur` event, and a **minimised** window
still reports `isFocused() === true`. The prescribed one-liner would have been
silent for the plainest form of walking away. Shipped as `isLooking(win) =
isFocused() && !isMinimized()`. See
[[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]].

## Frontier — #76, with four behind it

**Run the frontier query anyway.** This table is a summary and goes stale the
moment the owner files something — that is this project's standing lesson, from
the leg that wrote "closing #70 empties the queue" while #71 sat unblocked.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | Ticket | State |
|---|---|---|
| **#76** | `gui-48`: drive the busy refusal instead of printing `SKIPPED` forever | **frontier**, unblocked |
| #77 | `gui-51`: drive every named surface into overflow | unblocked |
| #78 | Measure the launch artifact; gate `win.show()` only if objectionable | unblocked |
| #79 | The window remembers its size and position | **blocked by #78** (`blocked_by: 1`, re-verified live this leg) |
| #80 | Type-while-busy composer with a queued send | unblocked, filed last on purpose |

**#76 and #77 are deliberately two tickets, not one.** They share only a theme;
bundling them lets one close while the other's holes still print, and the
record's precedent (#65, #71) is one driver per ticket.

**Read the ticket bodies before writing code.** They were written against an
adversarial pass that killed two proposals and reshaped three, so the known
collisions are already in them. Three worth knowing before you open one:

- **#76's premise is now known-good.** Its stated reason for the skip ("needs a
  real streaming turn") expired when `gui-73` shipped — and `gui-75` has since
  driven **three** real turns including one killed mid-flight with the Stop
  button, so the mechanics of starting, waiting on, and aborting a turn from a
  driver are all worked examples in the set now. Reuse them rather than
  inventing a fourth.
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

**#79 must not use a main-side store.** The obvious argument for one — "main
*reads* the bounds, so the ADR's own principle prescribes it" — was tested and is
**wrong**: [[2026-07-31-a-preference-lives-where-it-is-read]] names "a small
main-side store for *the main-process ones*" verbatim and rejects it, and
`backgroundMaterial` is the shipped counterexample. #79 amends **one** ADR
sentence and reverses nothing.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #75:

- **`win.isFocused()` alone is not "someone is looking"** — a minimised window
  reports `true`. `isLooking` is the app's answer; simplifying it back leaves all
  864 tests green and the feature silent.
- **`app.setAppUserModelId` cannot be read back at runtime.** Delete it and the
  toast simply stops appearing, with no error. `gui-75` greps the **built**
  bundle for it and labels that a static check.
- **Patch `Notification.prototype.show`, never the class** — the bundle captures
  the constructor at load, so a class swap records nothing while the app
  notifies.
- **`gui-75` minimises rather than blurs, and `hide()` is not a substitute** — a
  hidden window has no taskbar button for the flash to land on. Third deliberate
  driver divergence after `gui-69`'s GPU and `gui-74`'s missing `--no-sandbox`.
- **`announceTurn`'s second `turn-aborted` guard is deliberate**, and it masks
  half of an abort-guard mutation (`newFlashes: 1`, `newNotifications: 0`).
  Measured and commented; not dead code.
- **`gui-scope-zoom-pill` prints no PASS/FAIL line** — it is observational
  (readings + screenshots), exits 0, and is not a failing driver. Do not "fix"
  it into a verdict driver as part of another ticket.

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

`main` = `9905e1d` + this leg's `.context` commits, pushed. No open branches.
Every assertion driver green.

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
- [[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]] — #75
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule #74 extended to
  the launch line and #75 extended to the window's own focus state
- [[2026-07-31-a-preference-lives-where-it-is-read]] — governs #78 and #79
- `.claude/vibe.md` — this batch's run: the autonomy grant, 9 proposals, 7 refuted
