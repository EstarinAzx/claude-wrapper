import { describe, test, expect } from 'vitest'
import {
  clampZoom,
  nextZoom,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM
} from '../src/shared/zoom'

describe('clampZoom', () => {
  test('passes through an in-range level, rounded to 2dp', () => {
    expect(clampZoom(1.2)).toBe(1.2)
    expect(clampZoom(1.2000000000000002)).toBe(1.2)
  })

  test('clamps below MIN and above MAX', () => {
    expect(clampZoom(0.1)).toBe(MIN_ZOOM)
    expect(clampZoom(5)).toBe(MAX_ZOOM)
  })

  test('falls back to the default for corrupt (non-finite) input', () => {
    expect(clampZoom(Number.NaN)).toBe(DEFAULT_ZOOM)
    expect(clampZoom(Number.parseFloat('nope'))).toBe(DEFAULT_ZOOM)
  })
})

describe('nextZoom', () => {
  test('reset always returns the default, whatever the current level', () => {
    expect(nextZoom(1.9, 'reset')).toBe(DEFAULT_ZOOM)
    expect(nextZoom(0.7, 'reset')).toBe(DEFAULT_ZOOM)
  })

  // Literal in, literal out: what this pins is the stepping arithmetic, and
  // 1.1 is the float-drift case that motivated the rounding. Expressing it as
  // DEFAULT_ZOOM only coupled it to a product decision it has no stake in.
  test('in/out step by ZOOM_STEP without float drift', () => {
    expect(nextZoom(1.1, 'in')).toBe(1.2)
    expect(nextZoom(1.1, 'out')).toBe(1.0)
  })

  test('stepping is clamped at both ends', () => {
    expect(nextZoom(MAX_ZOOM, 'in')).toBe(MAX_ZOOM)
    expect(nextZoom(MIN_ZOOM, 'out')).toBe(MIN_ZOOM)
  })
})
