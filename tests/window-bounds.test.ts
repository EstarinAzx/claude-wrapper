import { describe, test, expect } from 'vitest'
import { clampBounds, isBounds, type Bounds, type DisplayLike } from '../src/shared/window-bounds'

// #79 — the whole trust-and-safety surface of remembering the window's size and
// position, tested where it is pure. Two separate jobs live in this file and
// they fail in different ways:
//
//   `isBounds` is the IPC/localStorage trust boundary. A hand-edited or hostile
//   payload must not reach `setBounds`.
//
//   `clampBounds` is the SAFETY property. A stored position is a promise about
//   a display layout that may not exist any more — undock a laptop, unplug the
//   second monitor, drop the resolution — and restoring it literally puts the
//   window somewhere with no way to reach it. That failure is strictly worse
//   than not remembering at all, which is why the clamp is not optional.

// A laptop panel at the origin with a taskbar, and a second monitor to its
// LEFT — which is what gives that monitor negative coordinates. Negative is
// therefore a legitimate position in this app, never a corruption signal.
const PRIMARY: DisplayLike = { workArea: { x: 0, y: 0, width: 1920, height: 1040 } }
const LEFT: DisplayLike = { workArea: { x: -1280, y: 0, width: 1280, height: 1024 } }
const BOTH = [PRIMARY, LEFT]

describe('isBounds — compared, never coerced', () => {
  test('accepts four finite numbers', () => {
    expect(isBounds({ x: 0, y: 0, width: 1100, height: 780 })).toBe(true)
  })

  // The point of the whole predicate. `Number('100')` is 100, so a coercing
  // guard would admit a JSON blob of strings and hand it to the window; the
  // shape has to arrive already correct.
  test('rejects numeric strings rather than coercing them', () => {
    expect(isBounds({ x: '0', y: '0', width: '1100', height: '780' })).toBe(false)
    expect(isBounds({ x: 0, y: 0, width: 1100, height: '780' })).toBe(false)
  })

  test('rejects the non-objects', () => {
    for (const junk of [null, undefined, 'bounds', 42, true, [], () => {}]) {
      expect(isBounds(junk)).toBe(false)
    }
  })

  test('rejects a missing or non-finite member', () => {
    expect(isBounds({ x: 0, y: 0, width: 1100 })).toBe(false)
    expect(isBounds({ x: NaN, y: 0, width: 1100, height: 780 })).toBe(false)
    expect(isBounds({ x: 0, y: Infinity, width: 1100, height: 780 })).toBe(false)
  })

  // A window cannot have zero or negative extent, but it CAN sit at a negative
  // coordinate (the monitor to the left of the primary). The predicate has to
  // tell those two apart, or a second-monitor user's stored position is thrown
  // away on every launch.
  test('requires positive extent while allowing negative position', () => {
    expect(isBounds({ x: -1200, y: -40, width: 1100, height: 780 })).toBe(true)
    expect(isBounds({ x: 0, y: 0, width: 0, height: 780 })).toBe(false)
    expect(isBounds({ x: 0, y: 0, width: 1100, height: -780 })).toBe(false)
  })
})

describe('clampBounds', () => {
  // THE case that makes the rest of the table meaningful. A clamp that mangles
  // valid bounds would still satisfy every "it is on screen afterwards" test in
  // this file while silently moving the window on every single launch.
  test('passes valid bounds through byte-identical', () => {
    const stored: Bounds = { x: 100, y: 120, width: 1100, height: 780 }
    expect(clampBounds(stored, BOTH)).toEqual(stored)
  })

  test('does not mutate its input', () => {
    const stored: Bounds = { x: 9000, y: 9000, width: 1100, height: 780 }
    clampBounds(stored, BOTH)
    expect(stored).toEqual({ x: 9000, y: 9000, width: 1100, height: 780 })
  })

  // Fully outside in each of the four directions. Each lands flush against the
  // edge it overshot, at its original size.
  test.each([
    ['right', { x: 5000, y: 100, width: 1100, height: 780 }, { x: 820, y: 100 }],
    ['left', { x: -5000, y: 100, width: 1100, height: 780 }, { x: 0, y: 100 }],
    ['above', { x: 100, y: -5000, width: 1100, height: 780 }, { x: 100, y: 0 }],
    ['below', { x: 100, y: 5000, width: 1100, height: 780 }, { x: 100, y: 260 }]
  ])('pulls a window that is entirely off the %s back on screen', (_dir, stored, at) => {
    expect(clampBounds(stored, [PRIMARY])).toEqual({ ...at, width: 1100, height: 780 })
  })

  // Dropping the resolution below the stored size. The window is shrunk to the
  // work area rather than left with its edges past the screen.
  test('shrinks bounds larger than any display to the work area', () => {
    expect(clampBounds({ x: 0, y: 0, width: 4000, height: 3000 }, [PRIMARY])).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1040
    })
  })

  // The negative-coordinate case where the display still EXISTS: this is a
  // legitimate position and the clamp must leave it exactly alone.
  test('leaves a position on a negative-origin display untouched', () => {
    const onLeftMonitor: Bounds = { x: -1200, y: 50, width: 1000, height: 700 }
    expect(clampBounds(onLeftMonitor, BOTH)).toEqual(onLeftMonitor)
  })

  // ...and the same bounds once that monitor is unplugged. This is the failure
  // the clamp exists for: without it the window restores onto a display that is
  // no longer there and cannot be reached.
  test('rescues bounds stored on a display that no longer exists', () => {
    const onLeftMonitor: Bounds = { x: -1200, y: 50, width: 1000, height: 700 }
    const rescued = clampBounds(onLeftMonitor, [PRIMARY])
    expect(rescued).toEqual({ x: 0, y: 50, width: 1000, height: 700 })
  })

  // A window dragged half off the right edge is pulled fully back inside rather
  // than left hanging. The looser rule — "reachable is enough, leave a partly
  // visible window alone" — is defensible and is NOT what this does: fully
  // inside is one rule instead of two, and the cost is nudging a window that a
  // user deliberately parked half off screen.
  test('pulls a partly-overlapping window fully inside the work area', () => {
    const halfOff: Bounds = { x: 1400, y: 100, width: 1100, height: 780 }
    expect(clampBounds(halfOff, [PRIMARY])).toEqual({ x: 820, y: 100, width: 1100, height: 780 })
  })

  // Degenerate, and it must not throw or invent a position: with nothing to
  // clamp against, the stored value is the best answer available.
  test('returns the bounds unchanged when there are no displays', () => {
    const stored: Bounds = { x: 9000, y: 9000, width: 1100, height: 780 }
    expect(clampBounds(stored, [])).toEqual(stored)
  })

  // The rescue picks the display the window MOST overlaps, not simply the
  // first. This window hangs off the BOTTOM of the left monitor, so it must be
  // pulled up against that monitor's work area (1024 tall → y 324) and left at
  // its negative x. Clamping against the primary instead would produce a
  // different answer on both axes (y 340, and x dragged to 0), so this case
  // discriminates the two.
  test('clamps against the display the window most overlaps', () => {
    const lowOnLeftMonitor: Bounds = { x: -1200, y: 900, width: 1000, height: 700 }
    expect(clampBounds(lowOnLeftMonitor, BOTH)).toEqual({
      x: -1200,
      y: 324,
      width: 1000,
      height: 700
    })
  })
})
