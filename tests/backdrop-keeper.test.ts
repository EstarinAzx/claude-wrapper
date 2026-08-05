import { describe, test, expect, vi } from 'vitest'
import { createBackdropKeeper, FLATTENS_ON_BLUR } from '../src/main/backdrop-keeper'
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

const keeper = () => {
  const apply = vi.fn()
  return { apply, k: createBackdropKeeper({ apply }) }
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
    const { apply, k } = keeper()
    k.reassert()
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
  test('acrylic is re-asserted on blur', () => {
    const { apply, k } = keeper()
    k.set('acrylic')
    apply.mockClear()
    k.reassert()
    expect(apply).toHaveBeenCalledExactlyOnceWith('acrylic')
  })

  test('mica is NOT re-asserted — it does not flatten, so a repaint buys nothing', () => {
    // Owner observation, 2026-08-05, real window: "micas fine when i click away
    // its there". The first actual sighting on a record that had twice refuted
    // the claim for want of one.
    const { apply, k } = keeper()
    k.set('mica')
    apply.mockClear()
    k.reassert()
    expect(apply).not.toHaveBeenCalled()
  })

  test('only acrylic is in the flattening set', () => {
    expect([...FLATTENS_ON_BLUR]).toEqual(['acrylic'])
  })

  test('re-asserting many times is idempotent in value', () => {
    // Focus can churn — alt-tabbing, a dialog, a notification. Every blur
    // re-asserts, and each must carry the SAME material rather than drifting.
    const { apply, k } = keeper()
    k.set('acrylic')
    apply.mockClear()
    k.reassert()
    k.reassert()
    k.reassert()
    expect(apply.mock.calls).toEqual([['acrylic'], ['acrylic'], ['acrylic']])
  })

  test('switching to mica stops the re-assert that acrylic had earned', () => {
    // The bug this catches: a keeper that latched "we are re-asserting" rather
    // than reading the current material would keep pushing acrylic after the
    // user opted into Mica, and the window would wear the wrong material only
    // after a focus loss — invisible to every display-facing assertion.
    const { apply, k } = keeper()
    k.set('acrylic')
    k.set('mica')
    apply.mockClear()
    k.reassert()
    expect(apply).not.toHaveBeenCalled()
  })

  test('switching back to acrylic resumes it', () => {
    const { apply, k } = keeper()
    k.set('mica')
    k.set('acrylic')
    apply.mockClear()
    k.reassert()
    expect(apply).toHaveBeenCalledExactlyOnceWith('acrylic')
  })
})
