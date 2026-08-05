import { describe, test, expect, vi } from 'vitest'
import {
  REASSERT_DELAYS_MS,
  createBackdropKeeper,
  FLATTENS_ON_BLUR
} from '../src/main/backdrop-keeper'
import { DEFAULT_BACKDROP } from '../src/shared/backdrop'

// #119 — acrylic is re-asserted on blur so it does not go flat.
//
// WHAT THIS SUITE CAN AND CANNOT SAY. It pins the DECISION — which material is
// re-asserted, when, and with what value — because that is logic. It says
// nothing about whether the blur actually comes back on screen: that is DWM
// compositing, it was measured in `scripts/probe-acrylic-reapply.mjs` (948
// focused / 118 unfocused / 924 re-asserted, holding at +15s), and
// `gui-119.mjs` is what re-checks it in a real window. A green run here with a
// broken effect is possible and the driver is the guard against it.

// A hand-driven clock. The schedule is the whole point of this module now, and
// a real timer would make every test below a sleep.
const keeper = () => {
  const apply = vi.fn()
  let next = 1
  const timers = new Map<number, { fn: () => void; ms: number }>()
  const k = createBackdropKeeper({
    apply,
    setTimer: (fn, ms) => {
      const id = next++
      timers.set(id, { fn, ms })
      return id
    },
    clearTimer: (h) => {
      timers.delete(h as number)
    }
  })
  return {
    apply,
    k,
    pending: () => [...timers.values()].map((t) => t.ms).sort((a, b) => a - b),
    /** Fire everything still queued, in delay order. */
    fireAll: () => {
      const due = [...timers.entries()].sort((a, b) => a[1].ms - b[1].ms)
      timers.clear()
      for (const [, t] of due) t.fn()
    }
  }
}

describe('what main believes the window is wearing', () => {
  test('starts on the default, because the window is constructed with it', () => {
    // Not null. The window is built with `backgroundMaterial: 'acrylic'` before
    // the renderer has said anything, so a blur arriving in that gap is the very
    // first click away on a fresh install — the most likely moment to notice the
    // flip, and the one a null seed would skip.
    const { k } = keeper()
    expect(k.current()).toBe(DEFAULT_BACKDROP)
  })

  test('a blur BEFORE the renderer has ever spoken still re-asserts', () => {
    const { apply, k, fireAll } = keeper()
    k.reassert()
    fireAll()
    expect(apply).toHaveBeenCalledWith(DEFAULT_BACKDROP)
  })

  test('set applies immediately and remembers', () => {
    const { apply, k } = keeper()
    k.set('mica')
    expect(apply).toHaveBeenCalledWith('mica')
    expect(k.current()).toBe('mica')
  })
})

describe('the asymmetry is measured, not assumed', () => {
  test('acrylic is re-asserted on the whole schedule, not once', () => {
    // The single-call version was the one the owner stress-tested into slipping:
    // nothing orders Electron's blur event against DWM's switch to the inactive
    // backdrop, so a re-assert that lands first is overwritten.
    const { apply, k, pending, fireAll } = keeper()
    k.set('acrylic')
    apply.mockClear()
    k.reassert()
    expect(pending()).toEqual([...REASSERT_DELAYS_MS].sort((a, b) => a - b))
    fireAll()
    expect(apply.mock.calls).toEqual(REASSERT_DELAYS_MS.map(() => ['acrylic']))
  })

  test('mica is NOT re-asserted — it does not flatten, so a repaint buys nothing', () => {
    // Owner observation, 2026-08-05, real window: "micas fine when i click away
    // its there". The first actual sighting on a record that had twice refuted
    // the claim for want of one.
    const { apply, k, pending } = keeper()
    k.set('mica')
    apply.mockClear()
    k.reassert()
    expect(pending()).toEqual([])
    expect(apply).not.toHaveBeenCalled()
  })

  test('only acrylic is in the flattening set', () => {
    expect([...FLATTENS_ON_BLUR]).toEqual(['acrylic'])
  })

  test('switching to mica stops the re-assert that acrylic had earned', () => {
    // The bug this catches: a keeper that latched "we are re-asserting" rather
    // than reading the current material would keep pushing acrylic after the
    // user opted into Mica, and the window would wear the wrong material only
    // after a focus loss — invisible to every display-facing assertion.
    const { apply, k, fireAll } = keeper()
    k.set('acrylic')
    k.set('mica')
    apply.mockClear()
    k.reassert()
    fireAll()
    expect(apply).not.toHaveBeenCalled()
  })

  test('switching back to acrylic resumes it', () => {
    const { apply, k, fireAll } = keeper()
    k.set('mica')
    k.set('acrylic')
    apply.mockClear()
    k.reassert()
    fireAll()
    expect(apply.mock.calls).toEqual(REASSERT_DELAYS_MS.map(() => ['acrylic']))
  })
})

describe('churned focus does not pile up late writes', () => {
  test('a second blur drops the first blurs pending schedule', () => {
    // Without this, alt-tabbing five times leaves fifteen queued writes landing
    // over each other — which is the shape of "it slips under stress".
    const { k, pending } = keeper()
    k.set('acrylic')
    k.reassert()
    k.reassert()
    k.reassert()
    expect(pending().length).toBe(REASSERT_DELAYS_MS.length)
  })

  test('refocusing cancels what is still queued', () => {
    const { apply, k, pending, fireAll } = keeper()
    k.set('acrylic')
    apply.mockClear()
    k.reassert()
    k.cancel()
    expect(pending()).toEqual([])
    fireAll()
    expect(apply).not.toHaveBeenCalled()
  })

  test('a queued write never resurrects a material the user changed meanwhile', () => {
    // The delayed call reads `current` at FIRE time. Capturing the value at
    // schedule time would let a blur-then-switch-to-mica sequence push acrylic
    // back onto the window 800ms after the user opted out of it.
    const { apply, k, fireAll } = keeper()
    k.set('acrylic')
    k.reassert()
    k.set('mica') // user opens Appearance and switches while unfocused
    apply.mockClear()
    fireAll()
    expect(apply).not.toHaveBeenCalledWith('acrylic')
  })

  test('picking a material also drops a pending schedule', () => {
    const { k, pending } = keeper()
    k.set('acrylic')
    k.reassert()
    expect(pending().length).toBeGreaterThan(0)
    k.set('acrylic')
    expect(pending()).toEqual([])
  })

  test('the schedule brackets the race rather than firing once', () => {
    // Named so the reason survives: a single 0ms call races DWM's own switch to
    // the inactive backdrop and loses whenever it lands first.
    expect(REASSERT_DELAYS_MS.length).toBeGreaterThan(1)
    expect(REASSERT_DELAYS_MS[0]).toBe(0)
    expect(Math.max(...REASSERT_DELAYS_MS)).toBeGreaterThanOrEqual(500)
  })
})
