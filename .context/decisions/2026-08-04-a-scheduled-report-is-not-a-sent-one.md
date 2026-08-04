---
type: decision
project: claude-wrapper
date: 2026-08-04
updated: 2026-08-04
tags: [context, decision]
---

# A scheduled report is not a sent one

**#110, shipped as `86bab34`.** The window's bounds report was debounced by 250ms
and the `closed` handler **cleared the pending timer**, so any move or resize
inside that window was discarded — the next launch came back at the previous
position. Gate green: typecheck clean, **1024 tests across 67 files** (+13),
build clean.

## Decision

**Flush the pending report on `close`, and move the debounce into a module a
test can reach.**

```ts
win.on('resize', boundsReporter.report)
win.on('move', boundsReporter.report)
win.on('close', boundsReporter.flush)     // #110
win.on('closed', () => { boundsReporter.cancel(); … })
```

`close`, not `closed` — by `closed` the `webContents` is gone and there is
nothing left to send through. The `closed` clear stays as the belt-and-braces
path. `flush` sends **only when a report is owed**: a pending timer is the only
evidence of that, which is why the timer is nulled inside its own callback.

`src/main/bounds-reporter.ts` holds the debounce, the `getNormalBounds()` choice
and the flush, on `switch-workspace.ts` / `delete-guard.ts`'s precedent — the
electron entry cannot be imported under vitest.

`ReportableWindow` carries a **`getBounds` nothing calls**, deliberately.
Choosing between the two reads *is* the contract (#79 — maximising must not
overwrite the remembered size), and an interface offering only the correct one
would make the wrong one unexpressible, so the maximised-window test could never
fail. Mutation confirms it: swapping the read reds both those tests and only
those.

## Why

**The defect's shape is the durable part.** Every other guard this batch touched
protects state some later assertion can read. This one protects a *message*, and
a message that is never sent leaves no trace anywhere — not in main, not in the
renderer, not on disk. That is how it survived #79's own GUI driver, which
measured the restore path exhaustively and never closed a window mid-debounce.
**Where a defect leaves no artifact, the test has to be on the port.** Every
assertion here reads the send mock's call count and payload; a reporter that
recorded "I flushed" internally would satisfy a state-shaped suite and lose
exactly what the ticket is about.

**The comment was asserting the fix.** `BOUNDS_REPORT_DEBOUNCE_MS` was justified
as *"short enough that closing the window straight after moving it still stores
the new position"* — plainly false against a handler three lines down that
cancels the send. Second consecutive leg where a comment stated a guarantee the
code did not deliver (#109's was true-of-the-ordering and read as
true-of-the-guarantee; this one was simply wrong). Corrected in the same change,
and it now says the opposite in as many words.

**The risk the ticket does not name was measured, not argued.** Sending from
`close` puts the message in flight *during teardown*, and `window-all-closed`
quits this app. Whether the renderer's listener and its `localStorage.setItem`
run before the process goes away is a **race**, and main cannot speak for it:
the send is main's fact, the write is the renderer's. So `gui-110` reports the
two apart —

```
BEFORE   MC-SENDS-AFTER  []
         STORED          [60,50,900,640]      ← the stale seed
         {"mainSentOnClose":false,"storedIsTheMove":false,"storedIsStale":true}

AFTER    MC-SENDS-AFTER  [{"ms":66,"bounds":[180,130,860,610]}]
         STORED          [180,130,860,610]    ← the move
         {"mainSentOnClose":true,"sendsAfterMove":1,"storedIsTheMove":true}
```

— and the race **does not eat the write** here. A single pass/fail on the stored
value could not have told a wiring failure from a teardown loss; keeping them
separate means a future Electron or a slower machine reddens with a diagnosis
instead of a shrug. This is #108's *ask the process that holds the fact*, applied
to a boundary rather than to an instrument.

**The instrument is three launches against one profile, and the first is a
positive control.** Launch 1 moves and waits past the debounce, so the ordinary
path is proven to store *before* anything concludes from storage not changing —
without it, "the old value is still there" is trivially true for a dozen reasons.
Launch 2 moves and closes inside the window; launch 3 relaunches and reports what
the renderer read back. The value read is the `bounds:set` **mount push**, not
`executeJavaScript` on localStorage: that is what the renderer had *before* this
launch's own reporting could write the same rectangle back.

The driver also **refuses to score a run** where the debounce had already fired
before the close. Such a run never entered the window the ticket is about, and
reading it either way would be a false reproduction or a false fix.

**Premise reproduced before the fix — seventh consecutive leg.** Move, close
80ms later, zero sends, stale rectangle inherited.

**Mutation-verified three ways**, because the fix has three independent halves:

| mutation | reds |
|---|---|
| `flush` restored to a plain cancel (criterion 4) | the 4 flush tests |
| `push` reads `getBounds()` | both maximised tests |
| drop `timer = null` after the timer fires | the no-double-send test |

The third is criterion 2's whole substance: without that line a fired timer stays
non-null and the close sends a second copy of a report already delivered.

The ticket's stated baseline (979 across 64 files) was **stale for the fifth
consecutive ticket**; `main` was at 1011/66.

## Reversibility

Easy but not free. Deleting the `close` listener restores the old behaviour
exactly; unwinding the module extraction would also delete the only place these
13 assertions can live, since `index.ts` is not importable under vitest.

Left deliberately undone: the maximised **state** is still not restored (#79
scoped that out, and `getNormalBounds()` is what keeps the omission from
corrupting the size that *is* remembered), and `flush` stays silent when nothing
is pending rather than reporting on every close — reporting unconditionally is a
different and noisier feature.

## Related

- [[decisions]]
- [[overview]] · [[active-work]] · [[pick-up]]
- [[2026-08-04-a-check-that-ran-early-is-not-a-check-that-still-holds]] — #109,
  the previous leg, and the previous comment that claimed more than the code did
- [[2026-08-04-the-composer-is-held-shut-by-a-draft-clear-not-a-guard]] — #108,
  where *ask the process that holds the fact* was established
- [[2026-08-04-a-refusal-belongs-where-the-fact-lives]] — the same
  extract-from-`index.ts`-to-be-testable move, one ticket earlier
