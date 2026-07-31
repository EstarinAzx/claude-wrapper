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
const BACKDROP_KEY = 'backdrop'

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

const radios = (): HTMLButtonElement[] =>
  within(dock()).getAllByRole('radio') as HTMLButtonElement[]
const radio = (name: 'Acrylic' | 'Mica'): HTMLButtonElement =>
  within(dock()).getByRole('radio', { name }) as HTMLButtonElement
const checked = (): string | null =>
  radios().find((r) => r.getAttribute('aria-checked') === 'true')?.dataset['backdrop'] ?? null
// The copy is authored with a typographic apostrophe, like the rest of the app's
// strings. What these tests pin is the WORDING, not the glyph.
const flat = (s: string): string => s.replace(/[’']/g, "'")

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

// #69 — Backdrop. Two values, applied live, persisted, and honest about what
// each one costs. The material itself is invisible to jsdom and to a driver
// screenshot alike (disabling the GPU flattens acrylic), so everything testable
// is the value's journey: what is offered, what is stored, what reaches main.
describe('backdrop control (#69)', () => {
  test('offers exactly two options — and not auto, none or tabbed', async () => {
    await startSession()
    await openDock()
    expect(radios().map((r) => r.dataset['backdrop'])).toEqual(['acrylic', 'mica'])
    // The cut three must not reach the panel by any route, including as text.
    expect(dock().textContent).not.toMatch(/\b(auto|none|tabbed)\b/i)
  })

  test('acrylic is what a fresh install opens with', async () => {
    await startSession()
    await openDock()
    expect(checked()).toBe('acrylic')
  })

  // The panel is not where the material is applied — the window wears it whether
  // or not anyone opens Appearance. Pinned by never opening the dock.
  test('the stored material reaches main on launch, with the panel unopened', async () => {
    window.localStorage.setItem(BACKDROP_KEY, 'mica')
    await startSession()
    expect(screen.queryByRole('complementary', { name: 'Appearance' })).toBeNull()
    expect(harness.api.setBackdrop).toHaveBeenCalledWith('mica')
  })

  test('the constructed default is pushed too, so the two declarations cannot drift', async () => {
    await startSession()
    expect(harness.api.setBackdrop).toHaveBeenCalledWith('acrylic')
  })

  test('a stored material, not the default, is what the panel opens checked', async () => {
    window.localStorage.setItem(BACKDROP_KEY, 'mica')
    await startSession()
    await openDock()
    expect(checked()).toBe('mica')
  })

  // Commit on change: no Save, so the click IS the apply and the persist.
  test('picking a material applies it, stores it and moves the selection', async () => {
    await startSession()
    await openDock()

    fireEvent.click(radio('Mica'))
    expect(harness.api.setBackdrop).toHaveBeenLastCalledWith('mica')
    expect(window.localStorage.getItem(BACKDROP_KEY)).toBe('mica')
    expect(checked()).toBe('mica')

    fireEvent.click(radio('Acrylic'))
    expect(harness.api.setBackdrop).toHaveBeenLastCalledWith('acrylic')
    expect(window.localStorage.getItem(BACKDROP_KEY)).toBe('acrylic')
    expect(checked()).toBe('acrylic')
  })

  // A hand-edited or corrupted value must not render an unselected group, and
  // must not be the thing handed to setBackgroundMaterial either.
  test('an unrecognised stored material falls back to acrylic, on screen and over IPC', async () => {
    window.localStorage.setItem(BACKDROP_KEY, 'tabbed')
    await startSession()
    await openDock()
    expect(checked()).toBe('acrylic')
    expect(harness.api.setBackdrop).toHaveBeenCalledWith('acrylic')
    expect(harness.api.setBackdrop).not.toHaveBeenCalledWith('tabbed')
  })

  // Roving tabindex: one tab stop for the group, arrows move within it.
  test('arrow keys move the selection and carry focus with it', async () => {
    await startSession()
    await openDock()
    expect(radio('Acrylic').tabIndex).toBe(0)
    expect(radio('Mica').tabIndex).toBe(-1)

    fireEvent.keyDown(radio('Acrylic'), { key: 'ArrowDown' })
    expect(checked()).toBe('mica')
    expect(document.activeElement).toBe(radio('Mica'))
    expect(radio('Mica').tabIndex).toBe(0)
    expect(radio('Acrylic').tabIndex).toBe(-1)

    fireEvent.keyDown(radio('Mica'), { key: 'ArrowUp' })
    expect(checked()).toBe('acrylic')
    expect(document.activeElement).toBe(radio('Acrylic'))
  })
})

// The honesty requirement, pinned rather than remembered. The request behind
// this feature was for "persistent acrylic"; what ships is Mica, which is
// persistent WITHOUT being acrylic. The word must not appear anywhere in the
// panel, and each option must state its own trade instead of a tagline.
describe('the backdrop copy states the trade and never claims persistence (#69)', () => {
  test('the word "persistent" appears nowhere in the panel', async () => {
    await startSession()
    await openDock()
    expect(dock().textContent ?? '').not.toMatch(/persist/i)
  })

  test('each option carries its own trade, in the agreed words', async () => {
    await startSession()
    await openDock()
    const text = flat(dock().textContent ?? '')
    expect(text).toContain(
      "Blurs what's behind the window; Windows flattens it when the window loses focus."
    )
    expect(text).toContain("A steady tint from your wallpaper; doesn't blur, doesn't flatten.")
  })

  // Described-by rather than folded into the name, so the option announces as
  // "Acrylic" and the trade follows it rather than replacing it.
  test('the description is associated with its own option', async () => {
    await startSession()
    await openDock()
    for (const name of ['Acrylic', 'Mica'] as const) {
      const el = radio(name)
      const described = document.getElementById(el.getAttribute('aria-describedby') ?? '')
      expect(flat(described?.textContent ?? '')).toContain(
        name === 'Acrylic' ? 'Blurs what' : 'A steady tint'
      )
    }
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
