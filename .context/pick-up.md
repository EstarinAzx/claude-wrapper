---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed last leg

**#79 — the window remembers its size and position, and the `win.show()` gate
#78 declined was BUILT here.** Merged as `03ab834`, ticket closed. Gate green:
typecheck clean, **887 tests across 60 files** (was 864/58), build ok, and the
**full driver batch 21/21** — it was re-run in full because #79 changes
`src/main/index.ts`'s window-show path.

Shape: renderer `localStorage` (`window-bounds-v1`) → IPC push on mount → main
`setBounds` before the window is ever shown. **No main-side store**, exactly as
[[2026-07-31-a-preference-lives-where-it-is-read]] prescribes; it amends one
sentence of that ADR and reverses nothing.

**Why building the gate is consistent with #78 declining it.** #78 declined it
*as specified* — "the renderer's first preference push" is a race between two
independent messages and misses a third preference that crosses no boundary at
all. Bounds are **one named message with one meaning**, so the protocol #78
priced collapses to a `let` and a 1500ms timeout. Measured A/B on one build
(`gui-79.mjs`, five runs; the probe defeats the gate by showing on
`ready-to-show`, the line the app used to run):

| | gated (shipped) | gate defeated |
|---|---|---|
| visible at the WRONG bounds | **0ms, 5/5 runs** | 0–49ms, on **4/5 runs** |
| on-screen move+resize | **0** | 1, intermittently |
| appears after construction | 139–149ms | 102–138ms |

**The ungated artifact is intermittent, and that is what settled it** — a window
that lands somewhere different depending on machine load is worse than one that
reliably takes 7–45ms longer to appear.

See [[2026-07-31-the-window-waits-until-it-knows-where-to-be]] and the new
`## Amendment (#79, …)` block in
[[2026-07-31-a-preference-lives-where-it-is-read]].

## Frontier — #80, and it is the LAST ticket in this batch

**Run the frontier query anyway.** This section is a summary and goes stale the
moment the owner files something — the standing lesson of this project's chains,
from the leg that wrote "closing #70 empties the queue" while #71 sat unblocked
the whole time.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

| # | Ticket | State |
|---|---|---|
| **#80** | Type-while-busy composer with a queued send | **frontier**, unblocked (`blocked_by: 0`, verified live this leg) |

**#80's substance is the state machine, not the typing.** Flushing on every
`busy → false` is wrong: it resends after **Stop** and can spend the queued
prompt on a **terminal** engine. And while busy the send button *becomes* Stop,
so there is no button to press — that design hole is the ticket's to answer and
no test can see it.

**If the frontier query comes back empty, the queue is drained** and the batch
#75–#80 is complete. The relay body's step 1 then applies: rewrite this file to
"queue empty", commit `.context/` on main, signal the relay stop, spawn nothing.

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #79:

- **A zero-arg `vi.fn()` mock makes its own `mock.calls[0][0]` a TYPE error.**
  `vitest` infers an empty argument tuple, so a test reaching for the callback
  main was handed does not typecheck — **while `npm test` passes, because
  `vitest run` does not typecheck.** Type a mock with the real signature. A
  loosely typed mock is not neutral; it is wrong in a direction. **Relevant to
  #80**, which will likely need a mock for whatever the queued send calls.
- **An instrument can report a gate's SUCCESS as the artifact it measures.**
  `boundsChangesWhileVisible` compared each visible sample against the previous
  sample regardless of *that* sample's visibility, so a window shown
  already-correct scored 1 for doing its job. Both samples must be visible
  before a difference between them is something anyone saw.
- **The window is no longer shown on `ready-to-show` alone.** Anything touching
  the launch path must keep BOTH conditions: Chromium has something to paint,
  and the renderer has pushed bounds (or the 1500ms timeout fired). Deleting the
  mount push in `useWindowBounds`, or mounting the hook below `App`, makes every
  launch wait out the timeout — and `bounds:set` must keep releasing the gate on
  a `null` or invalid payload, or every first-ever launch does.
- **Main reports `getNormalBounds()`, never `getBounds()`.** Swapping it makes
  maximising overwrite the remembered size with a full-screen one.
- **`gui-75` was GREEN in this leg's full batch** after two consecutive batch
  reds, which confirms its red is focus theft rather than a regression. Still
  re-run it alone before believing a batch red there.

Still true: **`resume` binds at query CONSTRUCTION** and `warmUp` TAKES the
target; **a stream dying BETWEEN turns emits nothing**; **`onTerminal` must
never fire for `close()`**; **`win.isFocused()` alone is not "someone is
looking"** (a minimised window reports itself focused);
**`app.setAppUserModelId` cannot be read back at runtime**; **opening a past
session CLOSES the engine** (`openSession` → `targetSession`, after which
`listModels()`/`listCommands()` answer `[]` by contract — reach them first);
**`.model-menu` always renders one static "default" row**; **a test asserting an
ABSENCE is the one most likely to be vacuous**; **no expected driver failure —
any red is a real regression**; a driver must ESTABLISH the state it asserts and
be shown red first; **pins are mutation-verified and never "fixed" by editing an
expectation, and no pin retirement is authorised**; **do not add a second busy
flag** (sharply relevant to #80); **never un-key the composer**
(`<InputBar key={cwd}>` is the whole reset) and **anything workspace-scoped must
join the `ok` branch**; `tests/scrollbar.test.ts` scans every line containing a
scrollbar pseudo-element, comments included; `gui-51` compares in **device**
pixels; measure with `getBoundingClientRect`, not screenshots;
`.titlebar-center` must stay IN FLOW; **`src/` is CRLF**; a new `window.api`
channel needs **all four** mock sites plus `preload/index.d.ts`; never hardcode
a model name.

From #78, still binding on anything that measures a launch: **Playwright cannot
measure a launch** (under `_electron.launch()` the window never emits
`ready-to-show`); **`NODE_OPTIONS=--require` never reaches Electron** and
`addInitScript()` is too late — be the **entry point**; **`--disable-gpu` is
load-bearing in a background session** or the app's window never paints;
**Chromium persists the zoom factor per origin inside `userData`**, so an
un-isolated launch is an inherited pass.

## Baseline

`main` = `03ab834` + this leg's `.context` commit, pushed. No open branches.
**21** assertion drivers (`gui-79` is new), plus the observational
`gui-scope-zoom-pill`. Full batch re-run this leg: **21/21 green**.

## Do not decide these

**Nothing — the list is empty.** All seven previously parked owner calls were
resolved on 2026-07-31 under the grant quoted in `.claude/vibe.md`. The grant
removed *ownership* as a ground for deferring, not the requirement for evidence.
Two calls were deliberately left **half**-decided because the record would not
carry the other half — Tailwind is **not dropped** but the adopt-utilities
question **stays open**, and the titlebar's control count **does not change**
while the aesthetic question **stays the owner's**.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-the-window-waits-until-it-knows-where-to-be]] — #79
- [[2026-07-31-a-preference-lives-where-it-is-read]] — amended by #78 and again
  by #79; the ADR that governs where any preference goes
- [[2026-07-31-the-window-is-shown-before-the-app-exists]] — #78
- [[2026-07-31-a-drivers-own-setup-can-revoke-what-it-measures]] — #77
- [[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]] — #76
- [[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]] — #75
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74 to the
  launch line, #75 to the window's focus state, #76 to an expired skip reason,
  #77 to setup order, #78 to the launch profile, and #79 to a pristine
  `userData` plus a construction-time 1100×780
- [[2026-07-31-the-authored-pixel-is-css-the-measured-pixel-is-device]] — #71,
  the other ticket whose measurement changed its own answer
- `.claude/vibe.md` — this batch's run: the autonomy grant, 9 proposals, 7 refuted
