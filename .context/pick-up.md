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

The diff is the one line the ticket predicted — `sandbox: false` → `sandbox:
true` on the app's only `BrowserWindow`. Nothing in the preload, the mocks or the
types moved, and `isTrustedIpc` is untouched: the **process** boundary moved, the
trust boundary did not.

**The sharp part was in the driver set, not the app.** Every existing driver
launches with `--no-sandbox`, which disables OS sandboxing app-wide — so a
`gui-74` written by copying the house launch line would have read the flag back
as `true` off a renderer Chromium had already been told not to sandbox, and
passed with nothing proven. See
[[2026-07-31-the-renderer-is-sandboxed-and-the-driver-must-not-undo-it]].

## Frontier — the tracker is EMPTY

`gh issue list --state open` returns **`[]`**. No `ready-for-agent`, no
`ready-for-human`, nothing blocked, no open spec. Nothing is stuck; the queue was
drained.

**Run the query anyway** — this prose goes stale the moment the owner files
something, and that is the standing lesson of this project's chains: a leg once
wrote that closing #70 would empty the queue and was wrong, because #71 had been
unblocked the whole time.

### If it is still empty, there are three honest moves

Filing work is not the same as deciding it. In order of ripeness:

1. **Ask the owner, or run `/preset vibe init`** — the autonomous funnel that
   produced #73 and #74 by probing four hypotheses and killing three of them. Its
   record is `.claude/vibe.md`.
2. **Take an Open question from [[active-work]]** if the owner picks a direction.
   **Tailwind's fate is the longest-waiting and is unblocked** — #72 was the last
   natural test of the utilities premise and shipped without a single utility
   class. **Read its amendment first:** dropping Tailwind turns the theme
   override from order-*proof* into order-*dependent*, and `tests/theme.test.ts`'s
   import-position pin silently stops being a tidiness check and becomes the
   whole safety argument.
3. **File the two driver-hygiene holes #74 observed and deliberately did not fix**
   (one ticket per leg): `gui-48` prints `SKIPPED the busy refusal (needs a real
   streaming turn)`, and `gui-51` prints four `NOT DRIVEN` lines for surfaces that
   were not overflowing. Both still PASS, and neither is reachable by a
   process-sandbox flag — but **a SKIPPED line is a hole in the gate, not an
   environment note**, and these are the same shape as #65 and #71.

## Landmines

Full ledger in [[active-work]] — it is long and it is load-bearing. New this leg:

- **`gui-74` launches WITHOUT `--no-sandbox` on purpose**, and standardising it
  onto the house launch args silently guts it — it would keep passing. Second
  deliberate divergence in the set, after `gui-69` keeps the GPU on.
- **`sandbox: true` is invisible to vitest.** Flip it back and all 843 tests stay
  green and the build stays clean. `gui-74` is the only thing that reddens.
- **Assert the EFFECT, not the request.** `getLastWebPreferences().sandbox` is
  what the window was *constructed with*; `app.getAppMetrics()` is what the OS
  *granted*. Join them to your own renderer with `getOSProcessId()` or a
  sandboxed utility process answers for it.
- **A boolean that is false everywhere is not evidence.** The GPU process reading
  `sandboxed: true` in every run is what proves the field is live on this
  platform rather than uniformly false.
- **`ProcessMetric.sandboxed` is macOS/Windows only** — on Linux it may read
  `undefined`, a driver limit rather than an unsandboxed renderer.
- **A driver crash is not a driver failure.** `gui-73` came back red in the batch
  run: `execFileSync('powershell.exe')` exiting `0xC0000142` right after
  `taskkill /F /T` on **8** claude.exe trees while the parent session was being
  torn down. Clean foreground re-run found **one** child and passed everything.
  The pid count was the tell.
- **A preload that starts needing Node is a decision, not a fix** — ADR with the
  measured reason, never a quiet `sandbox: false`. Check the **built** bundle.

Still true from earlier legs: **`resume` binds at query CONSTRUCTION** and
`warmUp` TAKES the target; **a stream dying BETWEEN turns emits nothing**;
**`onTerminal` must never fire for `close()`**; **a session IS resumable after an
abnormal death** (measured with `taskkill /F`); **a test asserting an ABSENCE is
the one most likely to be vacuous**; **there is no expected driver failure — any
red is a real regression**; a driver must ESTABLISH the state it asserts and be
shown red before it is believed; **pins are mutation-verified and never "fixed"
by editing an expectation, and no pin retirement is authorised**;
`tests/scrollbar.test.ts` scans every line containing a scrollbar
pseudo-element, comments included; `gui-51` compares in **device** pixels; a
screenshot cannot see the right ~20% of the layout, so measure with
`getBoundingClientRect`; `--disable-gpu` flattens acrylic, so leave `gui-69` /
`gui-70` on the GPU; `.titlebar-center` must stay IN FLOW; `src/` is CRLF; a new
`window.api` channel needs **all four** mock sites plus `preload/index.d.ts`; and
never hardcode a model name.

## Baseline

`main` = `07544e8` + this leg's `.context` commit, pushed. No open branches.
Every driver in the set was re-run this leg and is green.

## Do not decide these

**Seven owner calls are parked in `.claude/vibe.md` under `## Needs you`** —
Tailwind's fate, which titlebar buttons leave, whether the dock toggles collapse,
#72's centring trade-off, whether the window should remember its geometry, which
daily-driver polish item comes next, and whether a renderer error boundary is
wanted. All reversible, all with a default already taken. **A leg may not decide
them.**

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-07-31-the-renderer-is-sandboxed-and-the-driver-must-not-undo-it]] — #74's design record
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, the rule #74 extended to the launch line
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73's design record
- `.claude/vibe.md` — the run that filed #73 and #74; 4 hypotheses probed, 3 killed
