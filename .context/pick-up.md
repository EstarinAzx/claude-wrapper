---
type: pick-up
project: claude-wrapper
updated: 2026-08-05
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## The tracker is EMPTY — zero open issues

Nothing is queued and nothing is blocked. Confirm rather than trust this line —
it has been wrong before (leg 5 of an earlier chain wrote that the queue would be
empty while #71 was unblocked the whole time):

```text
gh issue list --state open
```

A new idea starts at `/preset init`.

## Shipped 2026-08-05

| # | what | commit |
|---|---|---|
| 116 | spike — `@` reachability. `@path` already resolves; the CLI's suggester is reachable but not a picker | `bd0fed5` |
| 117 | spike — every win32 backdrop route, priced. Adopted nothing | `50b6a8d` |
| **118** | **`@` file references in the composer** — typing assistance only | **`8a58686`** |
| **119** | **acrylic keeps its blur through a focus loss** — no dependency | **`403d761`** + `e0b8855` |

Spec **#115** is closed. All six of its owner calls are answered.

Gate at `e0b8855`: typecheck clean, **1122 tests / 74 files**, build clean,
`gui-118` PASS, `gui-119` PASS including 8/8 stress trials (4/4 under focus churn).

## Two things worth a ticket, neither filed — the owner's call

1. **The Acrylic option's copy is now stale.** It reads *"blurs what's behind the
   window; Windows flattens it when the window loses focus."* The second clause
   is no longer true of this app, and with the 250ms flash the accurate
   replacement is not simply deleting it.
2. **The 250ms flash.** What ships is *"it comes back"*, not *"it never goes"* —
   the 0ms re-assert loses the race against DWM, so the first attempt that lands
   is at 250ms. Owner-accepted 2026-08-05. Upgrade path: earlier entries in
   `REASSERT_DELAYS_MS` (`src/main/backdrop-keeper.ts`). Each is one call on a
   window nobody is looking at, so cost is negligible; the open question is how
   early DWM will accept one, and answering it needs a capture taken **during**
   the transition rather than after.

## Landmines from #119

- **A probe must trigger the mechanism the way the PRODUCT will.** The probe that
  justified this fix re-applied the material 800ms after focus loss and scored
  perfectly every time; the shipped handler fired synchronously on `blur`, where
  the race lives. A convenience delay in an instrument is a silent assumption
  that timing does not matter — in the one case where timing is the question.
- **A good spike's unexplained observations are the cheapest lead you have.** The
  whole fix was sitting in #117's S4 output (97 vs 434 distinct colours on the
  same window, differing only by a material *change*), recorded honestly and not
  chased, and it overturned that spike's own adopt-nothing recommendation.
- **A colour-variety metric is blind over a uniform desktop.** Plant a known
  high-contrast surface behind the window, and refuse to score if the focused
  baseline is too flat. A deleted probe scored a properly blurred window at 60.
- **Chromium throttles rendering in a background window** — injected occlusion
  markers often never paint while unfocused.
- **`moveTop()` and `app.focus({steal:true})` can hand focus back on win32** — a
  churn sequence must settle unfocused and *verify* it.
- **An event handler in main must not be able to throw.** Electron turns it into
  a modal *"A JavaScript error occurred in the main process"* over the app.
  Observed live from an instrument's own unguarded handler.
- **A broken instrument is worse than none** — delete it rather than caveat it.

## Landmines from #118

- **The caret is a trigger, and jsdom models it differently.** Read caret state
  off the ref, never off a synthetic `onSelect` target, and never fall back to
  `0` — `0` is a valid caret, so the fallback cannot be told from a real answer.
  `onSelect` also does not fire for an unfocused element.
- **A control keyed on caret position needs a driver**, not more jsdom tests.
- **`@` is typing assistance only.** `@path` is already resolved by the CLI.
  Never add renderer-side expansion — the pin reddens three tests if you do.
- **The only text normalization on the send path** is `useChat.ts:407`'s
  `raw.trim()`. Anything else touching sent text is a bug.
- **`src/main/workspace-files.ts` is a trust boundary.** Escaping entries are
  dropped at discovery; the tests assert the walk port was never *reached*.
  Containment uses `relative`, never `startsWith`.

## Landmines from #117

- **A callable route is not an effective one.** `setVibrancy` and
  `visualEffectState` are both accepted on win32 and both do nothing.
- **`setBackgroundMaterial` has NO runtime whitelist** — any string is accepted.
  `src/shared/backdrop.ts`'s compare-never-coerce guard is the only one. Do not
  "simplify" it.
- **There is no backdrop read-back** — anything reasserting a material must carry
  its own copy. That is why `backdrop-keeper.ts` exists.
- **A second window taking focus** is how to produce an honestly-unfocused,
  still-visible window. `blur()` is inert, exactly as #75 recorded.
- **`page.screenshot()` cannot show a DWM backdrop at all** — only a desktop
  capture can.

## Still-live landmines from earlier legs

- **`canUseTool` is NOT a control surface** (#116) — deny with `disallowedTools`;
  count `tool_use` blocks as a second witness.
- **A bundle grep is still reading names** (#116). Probe by CALLING, paired with
  a bogus negative control.
- **An out-of-workspace suggestion leak was observed once and NOT reproduced**
  (#116). Unexplained, not refuted — #118 generates its own list because of it.
- **A lost target is not a dead process** (#114) — write the exit code into
  committed findings, never only to the console.
- **This CLI emits no `init` during warm-up** (#114). Gate "the engine is live"
  on `listModels()`/`supportedCommands()` answering non-empty.
- **An instrument that fails its own setup reports that as the phenomenon**
  unless the verdict requires a scored observation first. Three separate
  instances today.
- **A green suite is evidence about the code only if the runner is sound** —
  `git stash push -u && npm test` first.
- **`gui-52`'s red is DOUBTFUL** and `gui-75` is focus-dependent; reproduce solo
  on clean `main` before believing either.
- Harness scripts importing `.ts` from `src/` need
  `node --experimental-strip-types` on this Node (22.17). Use `fileURLToPath`,
  never `URL.pathname` — this repo's path contains a space.
- **Node 22 refuses to spawn a `.cmd`** (`EINVAL`, CVE-2024-27980 mitigation).
- Never hardcode a model name. Never read `~/.claude/daemon/roster.json`.
- Absence assertions need a surviving positive control and mutation evidence.
- Test baseline on `main` is now **1122/74** — read it from `main`.
- Squash-merged ticket branches need `git branch -D`.

## Process note worth keeping

Two relay legs obeyed a `.claude/relay-leg.md` section headed *"Six owner calls
that must NOT be decided in a leg"* and produced two closed spikes and **zero
shipped features** overnight — while four of those six had warrants sitting in
the record. **A loop body is an artefact of an earlier leg, not an instruction
from the owner**, and it ranks below a standing autonomy grant. **A queue
containing only spikes has no shippable work in it**; say so at boot.

## Do not decide these

The five standing calls from the previous batch remain closed: the Tailwind
adopt-utilities half · titlebar control count · the 12px line box for 11px muted
descriptions · the accent clause enumeration after #97 · whether the glass ban
reaches a `var(--surface)` pane.

## Baseline

`main` = `e0b8855`, level with `origin/main` before this session's final
`.context/` commit; no ticket branch.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[happy-path]]
- [[2026-08-05-a-probe-that-hides-the-race-cannot-justify-the-code-that-runs-into-it]]
- [[2026-08-05-the-caret-is-the-trigger-and-jsdom-cannot-see-it]]
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]]
