import { describe, test, expect } from 'vitest'
import { BACKDROPS, DEFAULT_BACKDROP, normalizeBackdrop } from '../src/shared/backdrop'

// #69 — the backdrop value's whole trust boundary, tested at the highest and
// cheapest seam there is. The main-side handler hands whatever arrives over IPC
// straight to `setBackgroundMaterial`, so everything that stops a hand-edited
// localStorage entry or a hostile payload from reaching that call is here.

describe('the backdrop whitelist', () => {
  test('offers exactly two values, acrylic the default', () => {
    expect([...BACKDROPS]).toEqual(['acrylic', 'mica'])
    expect(DEFAULT_BACKDROP).toBe('acrylic')
  })

  // The three members of Electron's union that are deliberately cut. `none` is
  // an unspecified rendering state under a transparent window rather than a
  // setting, `auto` hands the app's identity to a system preference, and
  // `tabbed` differs from mica by an amount invisible beneath the wash. They
  // must not round-trip: naming one is being a stranger, not opting in.
  test('does not admit auto, none or tabbed', () => {
    for (const cut of ['auto', 'none', 'tabbed']) {
      expect((BACKDROPS as readonly string[]).includes(cut)).toBe(false)
      expect(normalizeBackdrop(cut)).toBe(DEFAULT_BACKDROP)
    }
  })
})

describe('normalizeBackdrop', () => {
  test('passes through each offered value', () => {
    expect(normalizeBackdrop('acrylic')).toBe('acrylic')
    expect(normalizeBackdrop('mica')).toBe('mica')
  })

  test('falls back to the default for anything unrecognised', () => {
    expect(normalizeBackdrop('')).toBe(DEFAULT_BACKDROP)
    expect(normalizeBackdrop(null)).toBe(DEFAULT_BACKDROP)
    expect(normalizeBackdrop(undefined)).toBe(DEFAULT_BACKDROP)
    expect(normalizeBackdrop(7)).toBe(DEFAULT_BACKDROP)
  })

  // The value crosses IPC verbatim and is compared, never coerced. An object
  // that merely stringifies to an offered value is not one — a `String(value)`
  // boundary would let it through, which is the shape this pins against.
  test('does not coerce its way to a match', () => {
    expect(normalizeBackdrop('Mica')).toBe(DEFAULT_BACKDROP)
    expect(normalizeBackdrop({ toString: () => 'mica' })).toBe(DEFAULT_BACKDROP)
    expect(normalizeBackdrop(['mica'])).toBe(DEFAULT_BACKDROP)
  })
})
