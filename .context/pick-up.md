---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Queue refilled — two tickets, both `ready-for-agent`

A `/preset vibe init` run on **"improve the wrapper and make it production ready"**
filed **#73** and **#74** and fired a fresh relay chain over them. Trust the
frontier query (`gh issue list --state open`) over this prose — that is the
standing lesson of the last chain.

**Take the lowest-numbered unblocked ticket. There is no blocking edge between
them** — they touch different processes and different files, so either order works.

### #73 — recovering from a terminal stream death discards the conversation

`chooseWorkspace` calls `switchWorkspace(null, choice.cwd)` with `resumeId`
hardcoded `null`, so the recovery the app's own error copy instructs
("Pick the folder again to restart") starts a fresh SDK session and empties the
pane. **That is the exact consequence `2026-07-23-engine-terminal-on-stream-death`
invoked as its reason for rejecting auto-restart** — so there is no
conversation-preserving way out of `terminalError` today, on a state reachable by
routine auth expiry, a network drop, or the CLI crashing.

The fix stays **user-initiated**, so the ADR is not reversed, and the ADR
pre-costs it under Reversibility ("capture `session_id` and rebuild with `resume`
… the terminal flag is one variable"). The machinery already exists:
`App.switchWorkspace(id, target)` with a non-null `id` already gives
`setResume(id)` + `adoptSession(id)`.

**#73's AC1 is BLOCKING and comes first:** nothing measured says a session is
resumable after an *abnormal* stream death. Prove it before building on it; if it
falsifies, degrade to an honest restart and amend the ADR (#68 is the precedent —
its probe falsified its premise and "The scope did not widen"). **Do not skip
this to get to the code.**

The other real problem inside #73: **the renderer cannot currently tell a terminal
error from a per-turn one** — `mapStreamError` and `mapResultError` both arrive as
`{ type: 'error' }`. The control must not attach to the per-turn ones, which are
already recoverable. That distinction belongs in main, where it is already known.

### #74 — run the renderer sandboxed

`sandbox: false` at `src/main/index.ts:135` buys nothing: the preload imports only
`contextBridge`/`ipcRenderer` plus type-only imports, and the **built** bundle
`out/preload/index.js` contains exactly one require, `require("electron")`.
Verified across every `.md` in the repo that **no ADR or note ever argued the
flag** — it is an unrevisited default, not a decision to overturn.

The flag is one line; the work is proving nothing broke. **A vitest suite cannot
observe `sandbox`**, so the evidence must be a driver that establishes the state
it asserts, is shown red first, is mutation-verified by flipping the flag back,
and completes a **real turn** through the bridge — a window that merely opens does
not prove the bridge survived.

## Landmines

Full ledger in [[active-work]] — it is long and it is load-bearing. The ones this
run measured, which are new:

- **Unhandled promise rejections in main do NOT crash this app.** Probed on
  Electron 43 / Node 24: `--unhandled-rejections=warn` is in force, so a raw
  `Promise.reject` warns and the process survives. `shell.openExternal` on an
  unregistered scheme does not even reject. **Do not file or "fix" a crash-handler
  ticket on the opposite assumption** — five `void`-ed promises in main are fine.
- **`void watchSession(...)` is deliberate and already guarded** (`try { … } catch
  { handle = null }`), and its comment names the bare-`void` call site. Its stated
  reason ("an escaping rejection would take the process down") is the thing the
  probe above falsified, but the guard makes it moot. Not a defect.
- **A main-side preference store is forbidden in those words** —
  `2026-07-31-a-preference-lives-where-it-is-read` says "No preferences file, no
  main-side store", and the reason is that a second store makes every later
  preference open with a store-selection argument. Adding one is a **reversal**
  that must say so out loud, not a gap-fill.
- **Every `catch` in `src/` is deliberate and carries a comment naming its
  contract.** There is no silent-swallow cleanup to do.

Still true from earlier legs: **there is no expected driver failure — every driver
is green, so any red is a real regression**; a driver must ESTABLISH the state it
asserts and be shown red before it is believed; **pins are mutation-verified and
never "fixed" by editing an expectation, and no pin retirement is authorised**; a
failure-path test must assert the **emptiness** of the rejection path and the call
ORDER, because a result-only test passes while the bug ships; `tests/scrollbar.test.ts`
scans every line containing a scrollbar pseudo-element, comments included; `gui-51`
compares in **device** pixels; a screenshot cannot see the right ~20% of the layout,
so measure with `getBoundingClientRect`; `--disable-gpu` flattens acrylic, so leave
`gui-69` / `gui-70` on the GPU; `.titlebar-center` must stay IN FLOW; `src/` is CRLF;
and never hardcode a model name.

## Baseline

`main` = `56b11b4` + this run's `.context` commit, pushed. No open branches.
Gate measured green before anything was filed: typecheck clean, **823 tests across
56 files**.

## Do not decide these

**Seven owner calls are parked in `.claude/vibe.md` under `## Needs you`** — four
carried from the titlebar run (Tailwind's fate, which titlebar buttons leave,
whether the dock toggles collapse, #72's centring trade-off) and three new
(whether the window should remember its geometry, which daily-driver polish item
comes next, whether a renderer error boundary is wanted). All seven are reversible
and all seven have a default already taken. **A leg may not decide them.**

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- `.claude/vibe.md` — this run's full record: 4 hypotheses probed, 3 killed
- `.claude/vibe-2026-07-31-titlebar.md` — the previous run, archived
