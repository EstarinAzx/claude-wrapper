import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  makeBoundsReporter,
  BOUNDS_REPORT_DEBOUNCE_MS,
  type ReportableWindow
} from '../src/main/bounds-reporter'
import type { Bounds } from '../src/shared/window-bounds'

// #110 — the window's last move survives a close inside the report debounce.
//
// It lives apart from `index.ts` for the same reason `switch-workspace.ts` and
// `delete-guard.ts` do: the electron entry cannot be imported under vitest, and
// this is precisely the logic that has to be pinned.
//
// What the assertions are ON matters here. The defect is a message that is
// never SENT, so every test reads the send port — its call count and its
// payload — rather than any state the reporter keeps. A reporter that recorded
// "I flushed" without reaching the port would satisfy a state-shaped test while
// losing exactly what the ticket is about.
//
// Timers are vitest's fakes rather than an injected clock: the debounce is the
// subject, and injecting it would replace the thing under test with a stub.

const RESTORED: Bounds = { x: 100, y: 80, width: 900, height: 640 }
const MOVED: Bounds = { x: 240, y: 160, width: 860, height: 610 }
// What a maximised window answers from `getBounds()`, and what must never be
// stored (#79: maximising would otherwise overwrite the remembered size).
const MAXIMISED: Bounds = { x: 0, y: 0, width: 1920, height: 1040 }

const harness = (
  start: Bounds = RESTORED
): {
  win: ReportableWindow
  send: ReturnType<typeof sendMock>
  setNormal: (b: Bounds) => void
  setCurrent: (b: Bounds) => void
  destroy: () => void
} => {
  let normal = start
  let current = start
  let destroyed = false
  const send = sendMock()
  return {
    win: {
      getBounds: () => current,
      getNormalBounds: () => normal,
      isDestroyed: () => destroyed
    },
    send,
    setNormal: (b) => {
      normal = b
      current = b
    },
    setCurrent: (b) => {
      current = b
    },
    destroy: () => {
      destroyed = true
    }
  }
}

// Typed with the real signature. A bare `vi.fn()` infers an empty argument
// tuple, so `mock.calls[0][0]` stops typechecking while `vitest run` — which
// does not typecheck — stays green (#79's trap, still live).
const sendMock = (): ReturnType<typeof vi.fn<(bounds: Bounds) => void>> =>
  vi.fn<(bounds: Bounds) => void>()

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('the bounds reporter (#110)', () => {
  // The ordinary path, and the positive control for everything below: without
  // this, "nothing was sent" tests pass for the wrong reason.
  test('a move is reported once the debounce elapses', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    h.setNormal(MOVED)
    reporter.report()
    expect(h.send).not.toHaveBeenCalled()

    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS)
    expect(h.send).toHaveBeenCalledTimes(1)
    expect(h.send).toHaveBeenCalledWith(MOVED)
  })

  // A drag fires `move` on every pixel. One report, not hundreds.
  test('a burst of moves coalesces into one report', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    for (let i = 0; i < 20; i++) {
      reporter.report()
      vi.advanceTimersByTime(10)
    }
    h.setNormal(MOVED)
    reporter.report()
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS)

    expect(h.send).toHaveBeenCalledTimes(1)
    expect(h.send).toHaveBeenCalledWith(MOVED)
  })

  // AC1 — the ticket. Restoring the plain cancel here is the mutation.
  test('closing inside the debounce still reports the move', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    h.setNormal(MOVED)
    reporter.report()
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS - 1)
    expect(h.send).not.toHaveBeenCalled()

    reporter.flush()

    expect(h.send).toHaveBeenCalledTimes(1)
    expect(h.send).toHaveBeenCalledWith(MOVED)
  })

  // The flush is SYNCHRONOUS, and that is the whole reason it goes on `close`
  // rather than `closed`: a report scheduled for later has no later to run in.
  test('the flush reaches the port before any timer could', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    h.setNormal(MOVED)
    reporter.report()
    reporter.flush()

    // Not "eventually" — now, with no time advanced at all.
    expect(h.send).toHaveBeenCalledTimes(1)
  })

  // AC2 — the flush must not duplicate a report the debounce already sent,
  // which would be a new bug on the same line.
  test('a flush after the debounce has fired sends nothing more', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    h.setNormal(MOVED)
    reporter.report()
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS)
    expect(h.send).toHaveBeenCalledTimes(1)

    reporter.flush()
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS)

    expect(h.send).toHaveBeenCalledTimes(1)
  })

  // The other half of AC2: closing a window nobody moved must stay silent.
  // A flush that reported unconditionally would write the current rectangle on
  // every single close, which is a different feature and a noisier one.
  test('closing without a pending report sends nothing', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    reporter.flush()

    expect(h.send).not.toHaveBeenCalled()
  })

  test('a second flush sends nothing more', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    h.setNormal(MOVED)
    reporter.report()
    reporter.flush()
    reporter.flush()

    expect(h.send).toHaveBeenCalledTimes(1)
  })

  // AC3 — `getNormalBounds()`, not `getBounds()`. The fake answers differently
  // from the two, so choosing the wrong one is expressible and this reddens.
  test('a maximised window flushes its RESTORED rectangle', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    h.setNormal(MOVED)
    reporter.report()
    // Maximise after the move, before the close: `getBounds()` now answers the
    // full-screen rectangle while the remembered size must stay the moved one.
    h.setCurrent(MAXIMISED)
    reporter.flush()

    expect(h.send).toHaveBeenCalledWith(MOVED)
    expect(h.send).not.toHaveBeenCalledWith(MAXIMISED)
  })

  test('a maximised window debounce-reports its RESTORED rectangle', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    h.setNormal(MOVED)
    reporter.report()
    h.setCurrent(MAXIMISED)
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS)

    expect(h.send).toHaveBeenCalledWith(MOVED)
    expect(h.send).not.toHaveBeenCalledWith(MAXIMISED)
  })

  // The rectangle is read when it is SENT, never captured when it is scheduled.
  // A reporter that snapshotted at `report()` would store a stale position for
  // the last leg of any drag.
  test('the rectangle is read at send time, not at schedule time', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    reporter.report()
    h.setNormal(MOVED)
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS)

    expect(h.send).toHaveBeenCalledWith(MOVED)
  })

  // `cancel()` is the `closed` handler's belt-and-braces path, kept because the
  // flush runs on `close` and a window can be destroyed by routes that do not
  // pass through it.
  test('cancel drops a pending report without sending it', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    h.setNormal(MOVED)
    reporter.report()
    reporter.cancel()
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS * 4)

    expect(h.send).not.toHaveBeenCalled()
  })

  // A cancelled reporter is not a dead one — a later move still reports.
  test('a report after a cancel still fires', () => {
    const h = harness()
    const reporter = makeBoundsReporter(h.win, h.send)

    reporter.report()
    reporter.cancel()
    h.setNormal(MOVED)
    reporter.report()
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS)

    expect(h.send).toHaveBeenCalledTimes(1)
    expect(h.send).toHaveBeenCalledWith(MOVED)
  })

  test('a destroyed window is never sent to, on either path', () => {
    const debounced = harness()
    const dr = makeBoundsReporter(debounced.win, debounced.send)
    dr.report()
    debounced.destroy()
    vi.advanceTimersByTime(BOUNDS_REPORT_DEBOUNCE_MS)
    expect(debounced.send).not.toHaveBeenCalled()

    const flushed = harness()
    const fr = makeBoundsReporter(flushed.win, flushed.send)
    fr.report()
    flushed.destroy()
    fr.flush()
    expect(flushed.send).not.toHaveBeenCalled()
  })
})
