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

describe('zoom shortcuts (App)', () => {
  test('applies the default zoom to the main process on mount', () => {
    render(<App />)
    expect(harness.api.setZoom).toHaveBeenCalledWith(DEFAULT_ZOOM)
  })

  test('applies a persisted level (not the default) on mount', () => {
    window.localStorage.setItem('zoom-level', '1.4')
    render(<App />)
    expect(harness.api.setZoom).toHaveBeenCalledWith(1.4)
  })

  test('Ctrl+= steps in and persists the new level', () => {
    render(<App />)
    press('=')
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(1.2)
    expect(window.localStorage.getItem('zoom-level')).toBe('1.2')
  })

  test('Ctrl+- steps out', () => {
    render(<App />)
    press('-')
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(1.0)
  })

  test('Ctrl+0 resets to the default', () => {
    window.localStorage.setItem('zoom-level', '1.8')
    render(<App />)
    press('0')
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(DEFAULT_ZOOM)
  })

  test('stepping in is clamped at the max', () => {
    window.localStorage.setItem('zoom-level', String(MAX_ZOOM))
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
