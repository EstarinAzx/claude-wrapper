import { describe, test, expect } from 'vitest'
import {
  clampSidebarWidth,
  DEFAULT_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH
} from '../src/shared/sidebar-width'

describe('clampSidebarWidth', () => {
  test('passes a mid-range width through (rounded to a whole pixel)', () => {
    expect(clampSidebarWidth(300.6)).toBe(301)
  })

  test('clamps below the minimum up to MIN', () => {
    expect(clampSidebarWidth(50)).toBe(MIN_SIDEBAR_WIDTH)
  })

  test('clamps above the maximum down to MAX', () => {
    expect(clampSidebarWidth(9999)).toBe(MAX_SIDEBAR_WIDTH)
  })

  test('NaN / non-finite falls back to the default', () => {
    expect(clampSidebarWidth(NaN)).toBe(DEFAULT_SIDEBAR_WIDTH)
    expect(clampSidebarWidth(Infinity)).toBe(DEFAULT_SIDEBAR_WIDTH)
  })
})
