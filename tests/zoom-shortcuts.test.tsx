import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'
import { DEFAULT_ZOOM, MAX_ZOOM } from '../src/shared/zoom'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  window.localStorage.clear()
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => cleanup())

const press = (key: string): void => {
  fireEvent.keyDown(document.body, { key, ctrlKey: true })
}

// Versioned, so raising DEFAULT_ZOOM is not silently swallowed by the level an
// existing install already stored. Stepping tests seed a level and assert the
// literal next one: what they pin is the arithmetic and the write-back, neither
// of which has any stake in what the default happens to be.
const KEY = 'zoom-level-v2'

describe('zoom shortcuts (App)', () => {
  test('applies the default zoom to the main process on mount', () => {
    render(<App />)
    expect(harness.api.setZoom).toHaveBeenCalledWith(DEFAULT_ZOOM)
  })

  test('applies a persisted level (not the default) on mount', () => {
    window.localStorage.setItem(KEY, '1.4')
    render(<App />)
    expect(harness.api.setZoom).toHaveBeenCalledWith(1.4)
  })

  // The whole reason the key carries a version. A pre-existing install holds the
  // OLD default under the OLD key, and a stored level always beats a default, so
  // without the bump raising DEFAULT_ZOOM would change nothing for the one user
  // who has already run the app.
  test('a level under the previous key does not mask a raised default', () => {
    window.localStorage.setItem('zoom-level', '1.1')
    render(<App />)
    expect(harness.api.setZoom).toHaveBeenCalledWith(DEFAULT_ZOOM)
  })

  test('Ctrl+= steps in and persists the new level', () => {
    window.localStorage.setItem(KEY, '1.1')
    render(<App />)
    press('=')
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(1.2)
    expect(window.localStorage.getItem(KEY)).toBe('1.2')
  })

  test('Ctrl+- steps out', () => {
    window.localStorage.setItem(KEY, '1.1')
    render(<App />)
    press('-')
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(1.0)
  })

  test('Ctrl+0 resets to the default', () => {
    window.localStorage.setItem(KEY, '1.8')
    render(<App />)
    press('0')
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(DEFAULT_ZOOM)
  })

  test('stepping in is clamped at the max', () => {
    window.localStorage.setItem(KEY, String(MAX_ZOOM))
    render(<App />)
    press('=')
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(MAX_ZOOM)
  })

  test('a bare key press (no Ctrl/Cmd) does not zoom', () => {
    render(<App />)
    vi.mocked(harness.api.setZoom).mockClear()
    fireEvent.keyDown(document.body, { key: '=' })
    expect(harness.api.setZoom).not.toHaveBeenCalled()
  })
})
