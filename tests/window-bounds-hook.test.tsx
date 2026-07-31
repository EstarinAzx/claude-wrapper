import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'
import type { Bounds } from '../src/shared/window-bounds'

// #79 — the renderer half of remembering the window's size and position, pinned
// at what CROSSED THE BOUNDARY rather than at what the renderer believes.
//
// That distinction is the whole point of this file, and it is a trap this repo
// has recorded three times (`useZoom`, `useBackdrop`, `useTheme`): a hook that
// sets its initial state from an EFFECT instead of a lazy initialiser still
// displays the stored value correctly, still passes every renderer-facing
// assertion, and pushes the DEFAULT across the wire. Here that would push
// `null` — main would open at the constructed size — and nothing the renderer
// can see would be wrong. So every assertion below is on `api.setWindowBounds`
// or on what landed in localStorage, never on React state.
//
// Rendering the whole App rather than the hook alone is also deliberate: the
// feature dies just as silently if `useWindowBounds` is never MOUNTED, and a
// `renderHook` test cannot see that.

let harness: ReturnType<typeof fakeChatApi>

const KEY = 'window-bounds-v1'
const STORED: Bounds = { x: 240, y: 160, width: 1280, height: 900 }

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
})

// The callback App handed to main, so a report can be delivered the way main
// delivers one.
const reportFromMain = (payload: unknown): void => {
  const calls = harness.api.onWindowBoundsChanged.mock.calls
  expect(calls.length).toBe(1)
  const listener = calls[0]![0] as unknown as (bounds: unknown) => void
  act(() => listener(payload))
}

describe('the mount push', () => {
  // THE pin. If this ever reads `null` while localStorage holds bounds, the
  // lazy initialiser has been turned into an effect and the feature is dead in
  // exactly the way no display-facing test can see.
  test('carries the STORED bounds, not the default', () => {
    window.localStorage.setItem(KEY, JSON.stringify(STORED))
    render(<App />)
    expect(harness.api.setWindowBounds.mock.calls).toEqual([[STORED]])
  })

  // Unconditional, and this is not a detail: main gates showing the window on
  // this message. Skip it when nothing is stored and every first-ever launch
  // waits out the gate's timeout with no window on screen.
  test('happens even when nothing is stored, carrying null', () => {
    render(<App />)
    expect(harness.api.setWindowBounds.mock.calls).toEqual([[null]])
  })

  test('carries null rather than a corrupt entry', () => {
    window.localStorage.setItem(KEY, '{"x":0,"y":0,"width":')
    render(<App />)
    expect(harness.api.setWindowBounds.mock.calls).toEqual([[null]])
  })

  // Compared, never coerced — a stored blob of numeric STRINGS is a stranger,
  // not a nearly-correct value to be repaired on the way to `setBounds`.
  test('carries null rather than a well-formed value of the wrong type', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ x: '240', y: '160', width: '1280', height: '900' })
    )
    render(<App />)
    expect(harness.api.setWindowBounds.mock.calls).toEqual([[null]])
  })
})

describe("main's report", () => {
  test('is what gets stored', () => {
    render(<App />)
    const moved: Bounds = { x: 12, y: 34, width: 1000, height: 700 }
    reportFromMain(moved)
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? 'null')).toEqual(moved)
  })

  // Main is the only sender, so this looks like belt-and-braces. It is not:
  // whatever lands here is what is handed to `setBounds` on the NEXT launch, so
  // a bad write is a bad restore forever, and the failure surfaces a whole
  // launch away from its cause.
  test('is refused when it does not validate, leaving the last good value', () => {
    window.localStorage.setItem(KEY, JSON.stringify(STORED))
    render(<App />)
    reportFromMain({ x: 0, y: 0, width: 0, height: 0 })
    expect(JSON.parse(window.localStorage.getItem(KEY) ?? 'null')).toEqual(STORED)
  })
})
