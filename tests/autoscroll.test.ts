import { describe, test, expect } from 'vitest'
import { isNearBottom } from '../src/renderer/src/autoscroll'

describe('isNearBottom', () => {
  test('true when scrolled to the bottom', () => {
    expect(isNearBottom({ scrollTop: 400, scrollHeight: 1000, clientHeight: 600 })).toBe(true)
  })

  test('true within the slack threshold', () => {
    expect(isNearBottom({ scrollTop: 370, scrollHeight: 1000, clientHeight: 600 })).toBe(true)
  })

  test('false when the user scrolled up past the slack', () => {
    expect(isNearBottom({ scrollTop: 100, scrollHeight: 1000, clientHeight: 600 })).toBe(false)
  })

  test('true when content fits without scrolling', () => {
    expect(isNearBottom({ scrollTop: 0, scrollHeight: 500, clientHeight: 600 })).toBe(true)
  })
})
