import type { Bounds } from '../shared/window-bounds'

// The window's debounced bounds report (#79), and its flush on close (#110).
//
// It lives apart from `index.ts` for the same reason `switch-workspace.ts` and
// `delete-guard.ts` do: the electron entry cannot be imported under vitest, and
// what has to be pinned here is that a message is SENT — a report that is
// dropped leaves no trace anywhere else, which is how #110 survived #79's own
// GUI driver.
//
// #110's defect in one line: the `closed` handler CANCELLED the pending timer,
// so any move or resize whose debounce had not elapsed was discarded. Main is
// the only holder of that rectangle until the message lands — the renderer is
// the sole writer of `window-bounds-v1` — so a cancelled report is a lost one.
// Measured on the built app (gui-110): move, close 80ms later, and the next
// launch comes back at the previous position with no send having occurred.

// Long enough that a drag reports once when it settles rather than on every
// pixel. It is NOT short enough to make a close safe on its own — that was the
// claim this constant's comment used to make, and #110 measured it false. The
// close path flushes instead.
export const BOUNDS_REPORT_DEBOUNCE_MS = 250

/**
 * The window, as this module reads it.
 *
 * `getBounds` is here despite nothing calling it, and deliberately: choosing
 * between the two reads IS the contract (#79 — `getNormalBounds` answers the
 * RESTORED rectangle, so maximising never overwrites the remembered size). An
 * interface offering only the correct one would make the wrong one
 * unexpressible, and the test that a maximised window reports its restored
 * rectangle could then never fail.
 */
export interface ReportableWindow {
  getBounds(): Bounds
  getNormalBounds(): Bounds
  isDestroyed(): boolean
}

export interface BoundsReporter {
  /** A `move` or `resize`. Schedules a report, replacing any pending one. */
  report(): void
  /**
   * A `close`. Sends a pending report NOW, synchronously, and sends nothing if
   * there is none — closing a window nobody moved must stay silent.
   *
   * Belongs on `close` rather than `closed`: by `closed` the `webContents` is
   * gone and there is nothing left to send through. That distinction is the
   * whole fix.
   */
  flush(): void
  /** A `closed`. Drops a pending report unsent — the belt-and-braces path. */
  cancel(): void
}

export const makeBoundsReporter = (
  win: ReportableWindow,
  send: (bounds: Bounds) => void
): BoundsReporter => {
  let timer: NodeJS.Timeout | null = null

  const clear = (): void => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  // The rectangle is read HERE rather than captured when the report was
  // scheduled, so the last leg of a drag reports where the window ended up.
  const push = (): void => {
    if (win.isDestroyed()) return
    send(win.getNormalBounds())
  }

  return {
    report: () => {
      clear()
      timer = setTimeout(() => {
        // Nulled before pushing, and this line is what makes `flush` safe: a
        // pending timer is the only evidence that a report is still owed, so a
        // fired timer that stayed non-null would let the close send a second
        // copy of a report the debounce already delivered.
        timer = null
        push()
      }, BOUNDS_REPORT_DEBOUNCE_MS)
    },
    flush: () => {
      if (!timer) return
      clear()
      push()
    },
    cancel: clear
  }
}
