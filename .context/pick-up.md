---
type: pick-up
project: claude-wrapper
updated: 2026-08-01
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

## Queue empty

**The tracker is empty — no open issues at all.** Not just no
`ready-for-agent` ones: no specs, no `needs-info`, no `ready-for-human`
leftovers, nothing blocked. Verified live on 2026-08-01 after #80 closed.

**Run the frontier query anyway.** This section is a summary and goes stale the
moment the owner files something — the standing lesson of this project's chains,
from the leg that wrote "closing #70 empties the queue" while #71 sat unblocked
the whole time.

```
gh issue list --state open --label ready-for-agent
gh api repos/EstarinAzx/claude-wrapper/issues/<n> --jq '.issue_dependencies_summary.blocked_by'
```

If it is still empty, there is nothing to work and the next move is the owner's:
file something, or run `/preset init` (or `/preset vibe init` for an unattended
funnel) to generate the next batch. Candidates are already written down —
`## Deferred (still no spec)` in [[active-work]] is the menu, and
`## Open questions` there holds the ones needing an answer before they can be
specced.

## Landed last leg

**#80 — type-while-busy composer with a queued send.** Merged as `1855910`,
ticket closed. Gate green: typecheck clean, **914 tests across 62 files** (was
887/60), build ok, and the **full driver batch 22/22** — re-run in full because
#80 changes the composer, `useChat` and three stylesheets. `gui-80` is new.

The composer now stays live while a turn streams (field, paperclip and paste).
Enter commits the draft; a quiet `.queued-note` above the pill says so and
carries a `Cancel queued prompt` control; the prompt fires when the turn ends.

**The queue is a FLAG on the draft, not a copy of it**, which answers four of the
ticket's questions at once — cardinality is one by construction, "replace or
append" dissolves (what fires is whatever is in the box when the turn ends),
cancelling costs nothing because the text never went anywhere, and
`<InputBar key={cwd}>` resets it with the draft and the tray.

**The flush condition is positive** — `turn-end` with a live engine — decided by
a pure twelve-row table in `src/shared/queued-send.ts`. All three terminal
outcomes clear `busy`, so a "flush once no longer busy" rule resends after Stop
and can spend the prompt on a terminal engine. **Exactly one of twelve** rows
sends; every other row **unqueues**, releasing the commitment and never the text.

See [[2026-08-01-a-queued-prompt-is-a-flag-on-the-draft]].

## Landmines

Full ledger in [[active-work]] — long and load-bearing. New from #80:

- **The composer is never `disabled` any more.** Re-adding `disabled={busy}` to
  the textarea, the paperclip or the paste handler restores the exact complaint
  #80 answered, with every test green except the two that name it.
  `useChat.send` is still the one place that refuses a send while busy.
- **The queue must stay in `InputBar`.** Lifting it into `App`/`useChat` means
  joining the `ok` branch of `switchWorkspace` by hand, and the failure is a
  queued prompt firing into the *next* project.
- **`lastTurn` is not a second busy flag, and its nonce is load-bearing.** Drop
  the nonce and the second queued prompt of a conversation silently never fires.
- **`unqueue` releases the commitment, never the text.** That is what makes Stop
  safe to leave under the user's cursor while a prompt is queued.
- **A double flush is invisible to jsdom** — swallowed by `useChat.send`'s busy
  guard. Only `gui-80`'s IPC count (a *second* `ipcMain.on('chat:send')`
  listener, which appends) can see it. And **a bare send-count cannot see a
  commitment that outlived its own flush**, because the flush emptied the box:
  type a fresh draft first.
- **An edge between two samples is not observable by sampling.** `gui-80`'s
  first run called a completed flush "never in flight" because the turn ending
  and the flushed turn starting are one React commit apart. Wait on a monotonic
  count, never on an edge.

Still true: **`resume` binds at query CONSTRUCTION** and `warmUp` TAKES the
target; **a stream dying BETWEEN turns emits nothing**; **`onTerminal` must never
fire for `close()`**; **`win.isFocused()` alone is not "someone is looking"**;
**`app.setAppUserModelId` cannot be read back at runtime**; **opening a past
session CLOSES the engine** (reach `listModels()` / `listCommands()` first);
**`.model-menu` always renders one static "default" row**; **a test asserting an
ABSENCE is the one most likely to be vacuous**; **no expected driver failure —
any red is a real regression**; a driver must ESTABLISH the state it asserts and
be shown red first; **pins are mutation-verified and no pin retirement is
authorised**; **do not add a second busy flag**; **never un-key the composer**
and **anything workspace-scoped must join the `ok` branch**;
**main reports `getNormalBounds()`, never `getBounds()`**; **the window is no
longer shown on `ready-to-show` alone** (both conditions, or the 1500ms timeout);
**a zero-arg `vi.fn()` mock makes its own `mock.calls[0][0]` a TYPE error** while
`npm test` stays green; `tests/scrollbar.test.ts` scans every line containing a
scrollbar pseudo-element, comments included; `gui-51` compares in **device**
pixels; measure with `getBoundingClientRect`, not screenshots;
`.titlebar-center` must stay IN FLOW; **`src/` is CRLF**; a new `window.api`
channel needs **all four** mock sites plus `preload/index.d.ts`; never hardcode
a model name.

From #78, binding on anything that measures a launch: **Playwright cannot
measure a launch**; **`NODE_OPTIONS=--require` never reaches Electron** and
`addInitScript()` is too late — be the **entry point**; **`--disable-gpu` is
load-bearing in a background session**; **Chromium persists the zoom factor per
origin inside `userData`**, so an un-isolated launch is an inherited pass.

## Baseline

`main` = `1855910` + this leg's `.context` commit, pushed. No open branches.
**22** assertion drivers (`gui-80` is new), plus the observational
`gui-scope-zoom-pill`. Full batch re-run this leg: **22/22 green**, `gui-75`
included.

## Do not decide these

**Nothing is off limits** — all seven previously parked owner calls were resolved
on 2026-07-31 under the grant quoted in `.claude/vibe.md`, which removed
*ownership* as a ground for deferring but not the requirement for evidence.

**Two were deliberately settled only by HALF, and those halves stay open:**
Tailwind is **not dropped** but the adopt-utilities question **stays open**, and
the titlebar's control count **does not change** while the aesthetic question
**stays the owner's**. The record argues against closing either.

## Related

- [[overview]] · [[active-work]] · [[decisions]] · [[stack]] · [[happy-path]]
- [[2026-08-01-a-queued-prompt-is-a-flag-on-the-draft]] — #80
- [[2026-07-31-the-window-waits-until-it-knows-where-to-be]] — #79
- [[2026-07-31-a-preference-lives-where-it-is-read]] — amended by #78 and #79;
  governs where any preference goes
- [[2026-07-31-the-window-is-shown-before-the-app-exists]] — #78
- [[2026-07-31-a-drivers-own-setup-can-revoke-what-it-measures]] — #77
- [[2026-07-31-a-refusal-is-proven-by-the-thing-that-kept-running]] — #76
- [[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]] — #75
- [[2026-07-23-busy-switch-block-not-detach]] — the escape hatch #80 answers
  rather than competes with
- [[2026-07-31-a-driver-establishes-its-premise]] — #65, extended by #74 to the
  launch line, #75 to focus, #76 to an expired skip reason, #77 to setup order,
  #78 to the launch profile, #79 to a pristine `userData`, and #80 to the two
  premises a queued-send driver has to establish (busy at commit, busy at Stop)
- `.claude/vibe.md` — the batch's run: the autonomy grant, 9 proposals, 7 refuted
