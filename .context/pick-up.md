---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed last leg

**#78 — the launch artifact measured, and the `win.show()` gate DECLINED.**
Merged as `51ea6d5`, ticket closed. **No `src/` change** — the whole ticket is
`gui-78.mjs` plus its two probe halves, an ADR amendment and a decision record.
Gate green: typecheck clean, **864 tests across 58 files** (unchanged, as
expected), build ok.

The ADR made the gate conditional on a measurement it had never taken ("Build it
only if measured"). The condition did not fire. Five runs, two profiles, all
times relative to the instant the window becomes visible:

| | first-ever launch | every launch after |
|---|---|---|
| viewport at first painted frame | 1100css @ dpr 1 | **880css @ dpr 1.25** |
| zoom reflows seen after the window is visible | **1** | **0** |
| window transparent-and-empty for | 41–61ms | 38–55ms |
| UI on screen at the wrong zoom for | 11–13ms | — |
| UI on screen in the wrong palette for | — | 2–12ms |
| material corrected at | n/a (default) | 40–45ms |

**The headline is that the ADR's own motivation is false after the first
launch.** It ranks zoom above the material flash because zoom reflows "every
launch, for every user" — but **Chromium persists the zoom factor per origin
inside `userData`** and restores it at document commit, so the second launch
paints its first frame already at 1.25, and `dom-ready` reads
`getZoomFactor() === 1.25` a full 41–44ms *before* the renderer's `zoom:set`
arrives. The reflow is **once per install**. #71's shape again: the measurement
removed its own motivation.

**The largest visible component is not a preference at all.** `ready-to-show`
fires on the first paint of the **still-empty document**, so the window is on
screen 38–61ms before React commits anything — a transparent frame (`body`
computes `rgba(0, 0, 0, 0)`), i.e. the bare backdrop material, not a white flash.

See [[2026-07-31-the-window-is-shown-before-the-app-exists]] and the new
`## Amendment (#78, …)` block in
[[2026-07-31-a-preference-lives-where-it-is-read]].

## Frontier — #79, with #80 beside it

**Run the frontier query anyway.** This table is a summary and goes stale the
moment the owner files something — that is this project's standing lesson, from
the leg that wrote "closing #70 empties the queue" while #71 sat unblocked.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | Ticket | State |
|---|---|---|
| **#79** | The window remembers its size and position | **frontier**, unblocked (`blocked_by: 0`, verified live this leg — #78 closing released it) |
| #80 | Type-while-busy composer with a queued send | unblocked, filed last on purpose |

**#79 must not use a main-side store.** The obvious argument for one — "main
*reads* the bounds, so the ADR's own principle prescribes it" — was tested and is
**wrong**: [[2026-07-31-a-preference-lives-where-it-is-read]] names "a small
main-side store for *the main-process ones*" verbatim and rejects it, and
`backgroundMaterial` is the shipped counterexample (applied by main, stored by
the renderer). Renderer `localStorage` + an IPC push on mount and on change,
exactly as `useBackdrop` ships. #79 amends **one** ADR sentence and reverses
nothing.

**#79 must NOT read #78's decline as "no gate needed".** The gate was declined
for *today's* artifact, whose worst remaining component is ≤1 frame. Bounds are
different in kind: a **window-manager move and resize** landing 38–55ms after the
window is already on screen. Nothing measured says that is tolerable.
**Re-run `gui-78.mjs` with bounds applied and decide on those numbers** — it is
the instrument, and the decision record states what a gate would have to beat.

**#80's substance is the state machine**, not the typing. Flushing on every
`busy → false` is wrong: it resends after **Stop** and can spend the queued
prompt on a **terminal** engine. And while busy the send button *becomes* Stop,
so there is no button to press — that design hole is the ticket's to answer and
no test can see it.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #78, all of it
relevant to #79 because #79 measures the same launch:

- **Chromium persists the zoom factor per origin, in `userData`.** A launch
  measurement against the real profile opens at the stored zoom and reports no
  artifact — an inherited pass. `gui-78` gives every launch a fresh `userData`
  via `app.setPath` **before `ready`**, which also means it never touches the
  user's real localStorage.
- **Playwright CANNOT measure a launch.** Under `_electron.launch()` the window
  never emits `ready-to-show`, so it is never shown, never painted, and
  `getEntriesByType('paint')` is **empty**. Fine for the other 19 drivers (they
  drive the DOM over CDP, which needs no visibility) and fatal for anything about
  paint, visibility or timing.
- **`NODE_OPTIONS=--require` never reaches Electron** (`NODE_OPTIONS` reads back
  `null` in main) and **`context.addInitScript()` is too late** — `launch()`
  resolves at ~380ms with the window already loading. The hook that works is
  being the **entry point**: `gui-78-probe.cjs` hooks, then `require`s
  `out/main/index.js`.
- **In this background session the app's window never paints with GPU
  compositing on** — no `ready-to-show`, `isVisible()` false after 20s — while a
  standalone `BrowserWindow` with identical options paints fine. `gui-78` passes
  `--disable-gpu`; the cost is that it flattens acrylic, so it judges no material
  visually.
- **`ready-to-show` fires on the first paint of the still-EMPTY document.** Do
  not assume the UI is in the frame the window is first shown with.
- **`getZoomFactor()` at window construction reads 1.0 even on a warm profile**
  (the persisted zoom is restored at document *commit*), so a premise check on it
  is vacuous. Read the first **painted** frame's `devicePixelRatio` instead.

Still true: **`resume` binds at query CONSTRUCTION** and `warmUp` TAKES the
target; **a stream dying BETWEEN turns emits nothing**; **`onTerminal` must never
fire for `close()`**; **`win.isFocused()` alone is not "someone is looking"**;
**`app.setAppUserModelId` cannot be read back at runtime**; **opening a past
session CLOSES the engine** (`openSession` → `targetSession`, after which
`listModels()`/`listCommands()` answer `[]` by contract — reach them first);
**`.model-menu` always renders one static "default" row**; **a test asserting an
ABSENCE is the one most likely to be vacuous**; **no expected driver failure —
any red is a real regression**; a driver must ESTABLISH the state it asserts and
be shown red first; **pins are mutation-verified and never "fixed" by editing an
expectation, and no pin retirement is authorised**; **do not add a second busy
flag**; **never un-key the composer** (`<InputBar key={cwd}>` is the whole reset)
and **anything workspace-scoped must join the `ok` branch**;
`tests/scrollbar.test.ts` scans every line containing a scrollbar
pseudo-element, comments included; `gui-51` compares in **device** pixels;
measure with `getBoundingClientRect`, not screenshots; `.titlebar-center` must
stay IN FLOW; `src/` is CRLF; a new `window.api` channel needs **all four** mock
sites plus `preload/index.d.ts`; never hardcode a model name.
**`gui-75` is focus-dependent** — red in two consecutive batch runs and green
solo both times. A batch that reds only there is a green batch; re-run it alone
before writing anything down.

## Baseline

`main` = `51ea6d5` + this leg's `.context` commit, pushed. No open branches.
**20** assertion drivers now (`gui-78` is new). The full batch was deliberately
**not** re-run this leg — #78's diff is three new files under
`.claude/skills/run-desktop/` and nothing under `src/`, so no existing driver
could regress from it; `gui-69` was re-run green as a harness sanity check.

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
- [[2026-07-31-the-window-is-shown-before-the-app-exists]] — #78
- [[2026-07-31-a-preference-lives-where-it-is-read]] — amended by #78; governs #79
- [[2026-07-31-a-drivers-own-setup-can-revoke-what-it-measures]] — #77
- [[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]] — #76
- [[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]] — #75
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule #74 extended to
  the launch line, #75 to the window's own focus state, #76 to a skip whose
  reason expired, #77 to the driver's own setup order, and #78 to the launch
  profile
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — #71,
  the other ticket whose measurement changed its own answer
- `.claude/vibe.md` — this batch's run: the autonomy grant, 9 proposals, 7 refuted
