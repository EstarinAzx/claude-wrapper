---
type: pick-up
project: claude-wrapper
updated: 2026-07-31
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Landed last leg

**#73 — recovering from a terminal stream death keeps the conversation.** Merged
as `6b4a831`, ticket closed. Gate green: typecheck clean, **843 tests across 57
files**, build ok.

It shipped the control the ADR endorsed but never built, and on the way it
uncovered and fixed a **second, unfiled defect**: `resume` binds at query
*construction*, and the switch transaction called `warmUp()` bare, so the
rebuilt engine ran a **fresh session while the pane, refilled from disk, looked
perfectly correct**. That also repaired the foreign-session switch path.

## Frontier — #74, and it is the whole queue

`gh issue list --state open` returns **#74 only**, `ready-for-agent`,
`blocked_by: 0`. **Run the query anyway** — this prose goes stale the moment the
owner files something, and that is the standing lesson of this project's chains.

### #74 — run the renderer sandboxed

`sandbox: false` at `src/main/index.ts` buys nothing: the preload imports only
`contextBridge`/`ipcRenderer` plus type-only imports, and the **built** bundle
`out/preload/index.js` contains exactly one require, `require("electron")`.
Verified across every `.md` in the repo that **no ADR or note ever argued the
flag** — an unrevisited default, not a decision to overturn.

The flag is one line; the work is **proving nothing broke**. **A vitest suite
cannot observe `sandbox`**, so the evidence must be a `gui-*.mjs` driver that
establishes the state it asserts, is shown **red first** (flip the flag back),
is mutation-verified, and completes a **real turn** through the bridge — a
window that merely opens does not prove the preload survived.

**#73 is the argument for that bar, freshly made.** 843 unit tests passed while
the engine was demonstrably on the wrong session; only a driver that
interrogated the real thing found it. For #74 the equivalent trap is a driver
that proves the window opened rather than that the bridge still works. Note that
the preload gained one method last leg (`onEngineTerminal`), so the bridge under
test is one channel wider than the ticket was written against.

## Landmines

Full ledger in [[active-work]] — it is long and it is load-bearing. New this leg:

- **`resume` binds at query CONSTRUCTION**, and `ensureQuery` returns early ever
  after. Whatever builds the query owns the resume; on the switch path that is
  `warmUp`, which now TAKES the target. Removing that argument silently puts the
  engine on a fresh session with a correct-looking pane, and no unit test sees
  it.
- **A stream dying BETWEEN turns emits nothing.** The engine only emits into an
  active turn, so the pane stays silent until a prompt is spent on a dead
  engine. That is why the terminal signal is an out-of-band broadcast and not an
  `EngineEvent` — an event would be dropped in exactly that case.
- **`onTerminal` must never fire for `close()`**, which main calls on every
  workspace switch, model pick and permission cycle.
- **A session IS resumable after an abnormal death** — measured with
  `taskkill /F`: the SDK accepts the id and reports the same id back. Do not
  re-open the honest-restart degradation.
- **A test asserting an ABSENCE is the one most likely to be vacuous.**
  `streamingStub`'s handle has no `close()`, so a `close()` test built on it
  never runs the branch it names. Mutation-verify absences first.

Still true from earlier legs: **there is no expected driver failure — every
driver is green, so any red is a real regression**; a driver must ESTABLISH the
state it asserts and be shown red before it is believed; **pins are
mutation-verified and never "fixed" by editing an expectation, and no pin
retirement is authorised**; a failure-path test must assert the **emptiness** of
the rejection path and the call ORDER; `tests/scrollbar.test.ts` scans every line
containing a scrollbar pseudo-element, comments included; `gui-51` compares in
**device** pixels; a screenshot cannot see the right ~20% of the layout, so
measure with `getBoundingClientRect`; `--disable-gpu` flattens acrylic, so leave
`gui-69` / `gui-70` on the GPU; `.titlebar-center` must stay IN FLOW; `src/` is
CRLF; a new `window.api` channel needs **all four** mock sites plus
`preload/index.d.ts`; and never hardcode a model name.

## Baseline

`main` = `6b4a831` + this leg's `.context` commit, pushed. No open branches.
Drivers re-run green this leg: `gui-73` (new), plus `gui-47`, `gui-48` and
`gui-54` for the shared switch/resume path.

## Do not decide these

**Seven owner calls are parked in `.claude/vibe.md` under `## Needs you`** —
Tailwind's fate, which titlebar buttons leave, whether the dock toggles
collapse, #72's centring trade-off, whether the window should remember its
geometry, which daily-driver polish item comes next, and whether a renderer
error boundary is wanted. All reversible, all with a default already taken.
**A leg may not decide them.**

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73's design record
- [[2026-07-23-engine-terminal-on-stream-death]] — amended by #73
- `.claude/vibe.md` — the run that filed #73 and #74; 4 hypotheses probed, 3 killed
