import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'
import { DEFAULT_ZOOM } from '../src/shared/zoom'

// #66 — Appearance dock: the third right-slot dock, gated on a folder, mutually
// exclusive with BOTH siblings, holding one commit-on-change control. The zoom
// readout must follow the level whichever way it moved, which is the whole
// reason the level had to leave `useZoom`'s effect closure.
let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  window.localStorage.clear()
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
})

const KEY = 'zoom-level-v2'

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const toggle = () => screen.getByRole('button', { name: 'Appearance panel' })
const dock = () => screen.getByRole('complementary', { name: 'Appearance' })
const readout = () => within(dock()).getByRole('status').textContent
const stepper = (name: 'Zoom in' | 'Zoom out'): HTMLButtonElement =>
  within(dock()).getByRole('button', { name }) as HTMLButtonElement

const openDock = async () => {
  fireEvent.click(toggle())
  await act(async () => {})
}

const press = (key: string): void => {
  fireEvent.keyDown(document.body, { key, ctrlKey: true })
}

describe('appearance dock (#66)', () => {
  test('the toggle is absent before a folder is picked, present after', async () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Appearance panel' })).toBeNull()
    cleanup()
    await startSession()
    expect(toggle()).toBeTruthy()
  })

  test('the toggle opens the dock and closes it again', async () => {
    await startSession()
    expect(screen.queryByRole('complementary', { name: 'Appearance' })).toBeNull()
    await openDock()
    expect(dock()).toBeTruthy()
    expect(toggle().getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(toggle())
    expect(screen.queryByRole('complementary', { name: 'Appearance' })).toBeNull()
  })

  // The union's whole point. Asserted against BOTH siblings in BOTH directions,
  // because a third member added as its own boolean satisfies "it opens" while
  // stacking two panels in the one right slot.
  test('opening Appearance closes Agents, and opening Agents closes Appearance', async () => {
    await startSession()
    fireEvent.click(screen.getByRole('button', { name: 'Agents panel' }))
    expect(screen.getByRole('complementary', { name: 'Agents' })).toBeTruthy()
    await openDock()
    expect(screen.queryByRole('complementary', { name: 'Agents' })).toBeNull()
    expect(dock()).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Agents panel' }))
    expect(screen.queryByRole('complementary', { name: 'Appearance' })).toBeNull()
    expect(screen.getByRole('complementary', { name: 'Agents' })).toBeTruthy()
  })

  test('opening Appearance closes Commands, and opening Commands closes Appearance', async () => {
    await startSession()
    fireEvent.click(screen.getByRole('button', { name: 'Commands panel' }))
    await act(async () => {})
    expect(screen.getByRole('complementary', { name: 'Commands' })).toBeTruthy()
    await openDock()
    expect(screen.queryByRole('complementary', { name: 'Commands' })).toBeNull()
    expect(dock()).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Commands panel' }))
    await act(async () => {})
    expect(screen.queryByRole('complementary', { name: 'Appearance' })).toBeNull()
    expect(screen.getByRole('complementary', { name: 'Commands' })).toBeTruthy()
  })

  test('the close control in the panel head closes it', async () => {
    await startSession()
    await openDock()
    fireEvent.click(within(dock()).getByRole('button', { name: 'Close appearance panel' }))
    expect(screen.queryByRole('complementary', { name: 'Appearance' })).toBeNull()
  })

  // Commit-on-change is load-bearing, not stylistic: the panel closes itself on
  // a workspace switch, so a Save button behind it is silent data loss.
  test('the panel carries no Save, Apply or Reset control', async () => {
    await startSession()
    await openDock()
    const labels = within(dock())
      .getAllByRole('button')
      .map((b) => `${b.getAttribute('aria-label') ?? ''} ${b.textContent ?? ''}`)
    expect(labels.filter((l) => /save|apply|reset|revert/i.test(l))).toEqual([])
  })

  // Fixed width, deliberately unlike both siblings. The grip is what a shared
  // dock shell would hand over for free, so its absence is worth pinning.
  test('the panel renders no resize grip', async () => {
    await startSession()
    await openDock()
    expect(dock().querySelector('.agents-dock-resize-handle')).toBeNull()
    expect(dock().getAttribute('style')).toBeNull()
  })

  test('zoom renders as minus, readout, plus — no slider and no select', async () => {
    await startSession()
    await openDock()
    const d = dock()
    expect(within(d).getByRole('button', { name: 'Zoom out' })).toBeTruthy()
    expect(within(d).getByRole('button', { name: 'Zoom in' })).toBeTruthy()
    expect(d.querySelector('input')).toBeNull()
    expect(d.querySelector('select')).toBeNull()
  })

  test('the readout shows the current level as a percentage', async () => {
    await startSession()
    await openDock()
    expect(readout()).toBe(`${Math.round(DEFAULT_ZOOM * 100)}%`)
  })

  test('the steppers change the level, the window and the readout together', async () => {
    window.localStorage.setItem(KEY, '1.1')
    await startSession()
    await openDock()
    expect(readout()).toBe('110%')

    fireEvent.click(within(dock()).getByRole('button', { name: 'Zoom in' }))
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(1.2)
    expect(window.localStorage.getItem(KEY)).toBe('1.2')
    expect(readout()).toBe('120%')

    fireEvent.click(within(dock()).getByRole('button', { name: 'Zoom out' }))
    expect(harness.api.setZoom).toHaveBeenLastCalledWith(1.1)
    expect(readout()).toBe('110%')
  })

  // The criterion the lift out of the effect closure exists to satisfy: the
  // panel must never disagree with the window, whichever path moved it.
  test('the readout follows the keyboard shortcuts too', async () => {
    window.localStorage.setItem(KEY, '1.1')
    await startSession()
    await openDock()

    press('=')
    expect(readout()).toBe('120%')
    press('-')
    expect(readout()).toBe('110%')
    press('0')
    expect(readout()).toBe(`${Math.round(DEFAULT_ZOOM * 100)}%`)
  })

  // A stepper that looks live at a bound and does nothing is a dead control.
  test('each stepper is disabled at its bound', async () => {
    window.localStorage.setItem(KEY, '2.0')
    await startSession()
    await openDock()
    expect(stepper('Zoom in').disabled).toBe(true)
    expect(stepper('Zoom out').disabled).toBe(false)

    press('0')
    expect(stepper('Zoom in').disabled).toBe(false)
  })
})

// The regression most likely to slip, per the ticket. Lifting the level into
// React state moves WHEN storage is read: an effect-set initial state paints
// the default first and reports it, which is exactly the bug the versioned key
// exists to prevent — dressed up as a working panel. The shortcut suite already
// pins what main is told; these pin what the READOUT says, which is the new
// surface and the one that can disagree.
describe('the lift into React state leaves the first-mount persist alone (#66)', () => {
  test('a stored level, not the default, is what the readout opens with', async () => {
    window.localStorage.setItem(KEY, '1.4')
    await startSession()
    await openDock()
    expect(readout()).toBe('140%')
    expect(harness.api.setZoom).toHaveBeenCalledWith(1.4)
  })

  test('a level under the previous key does not mask a raised default', async () => {
    window.localStorage.setItem('zoom-level', '1.1')
    await startSession()
    await openDock()
    expect(readout()).toBe(`${Math.round(DEFAULT_ZOOM * 100)}%`)
  })

  test('the first mount writes the versioned key through on a fresh install', async () => {
    expect(window.localStorage.getItem(KEY)).toBeNull()
    await startSession()
    expect(window.localStorage.getItem(KEY)).toBe(String(DEFAULT_ZOOM))
  })

  test('a corrupt stored level falls back to the default rather than rendering NaN', async () => {
    window.localStorage.setItem(KEY, 'not-a-number')
    await startSession()
    await openDock()
    expect(readout()).toBe(`${Math.round(DEFAULT_ZOOM * 100)}%`)
  })
})
