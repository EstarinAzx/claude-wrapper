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
  // The theme's effect lands on documentElement, which outlives `cleanup()` —
  // without this a palette set by one test is still applied in the next.
  document.documentElement.removeAttribute('data-theme')
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

const THEME_KEY = 'theme'
// Theme is a listbox, not a second radiogroup — the pin below reading every
// radio in this panel as a backdrop is exactly why.
const options = (): HTMLButtonElement[] =>
  within(dock()).getAllByRole('option') as HTMLButtonElement[]
const option = (name: 'Frost' | 'Ember' | 'Moss' | 'Slate'): HTMLButtonElement =>
  within(dock()).getByRole('option', { name }) as HTMLButtonElement
const selected = (): string | null =>
  options().find((o) => o.getAttribute('aria-selected') === 'true')?.dataset['optionTheme'] ?? null
// What actually crossed the boundary. Everything above is what the PANEL says.
const applied = (): string | null => document.documentElement.getAttribute('data-theme')

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

// #70 — Theme. jsdom loads no stylesheet, so what a palette LOOKS like is not
// testable here and is not claimed to be: themes.css is pinned structurally in
// theme.test.ts, and whether Ember actually looks good is eyeballed in a real
// window. What is testable is the value's journey — what is offered, what is
// stored, and what reaches the document element.
describe('theme control (#70)', () => {
  test('offers exactly four palettes, in the order the spec names them', async () => {
    await startSession()
    await openDock()
    expect(options().map((o) => o.dataset['optionTheme'])).toEqual([
      'frost',
      'ember',
      'moss',
      'slate'
    ])
    expect(options().map((o) => o.textContent)).toEqual(['Frost', 'Ember', 'Moss', 'Slate'])
  })

  test('frost is what a fresh install opens with', async () => {
    await startSession()
    await openDock()
    expect(selected()).toBe('frost')
    expect(applied()).toBe('frost')
  })

  // The panel is not where the palette is applied — the window wears it whether
  // or not anyone opens Appearance. Pinned by never opening the dock.
  //
  // This is the one that catches the sharpest failure mode in the ticket: a
  // preference with both a REPORT and an EFFECT can self-heal in the report and
  // stay broken in the effect. Set the initial state from an effect instead of
  // `useState`'s lazy initialiser and every panel assertion above still passes
  // while the window opens on the wrong palette.
  test('the stored palette reaches the document element on launch, panel unopened', async () => {
    window.localStorage.setItem(THEME_KEY, 'ember')
    await startSession()
    expect(screen.queryByRole('complementary', { name: 'Appearance' })).toBeNull()
    expect(applied()).toBe('ember')
  })

  // And the assertion above is NOT enough on its own, which is the whole trap:
  // the attribute is reactive, so an effect-set initial state still settles on
  // the stored palette a render later and every check above goes green while
  // the window opened in the wrong colour. What separates the two is the FIRST
  // value written, so that is what this watches. It is the one pin here that
  // dies under the mutation the ticket names.
  test('the default is never applied first on the way to a stored palette', async () => {
    window.localStorage.setItem(THEME_KEY, 'ember')
    // Recorded as OLD values, one per write. Reading the attribute inside the
    // callback instead would report whatever it had settled on by the time the
    // microtask ran — several writes coalesce into one callback, so a Frost
    // frame followed by Ember reads as a single Ember and this pin would green
    // under the very mutation it exists to catch.
    const before: (string | null)[] = []
    const observer = new MutationObserver((records) => {
      for (const r of records) before.push(r.oldValue)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
      attributeOldValue: true
    })
    await startSession()
    observer.disconnect()
    // Every value the attribute has held: each write's predecessor except the
    // leading unset, then whatever stands now. Deduplicated, in order, because
    // StrictMode remounts and this is not an assertion about how many times an
    // idempotent write ran.
    const held = [...before.slice(1), applied()]
    expect([...new Set(held)]).toEqual(['ember'])
  })

  test('a stored palette, not the default, is what the panel opens selected', async () => {
    window.localStorage.setItem(THEME_KEY, 'slate')
    await startSession()
    await openDock()
    expect(selected()).toBe('slate')
  })

  // Commit on change: no Save, so the click IS the apply and the persist.
  test('picking a palette applies it, stores it and moves the selection', async () => {
    await startSession()
    await openDock()

    fireEvent.click(option('Moss'))
    expect(applied()).toBe('moss')
    expect(window.localStorage.getItem(THEME_KEY)).toBe('moss')
    expect(selected()).toBe('moss')

    // Back to the default: nothing may be left behind in the previous accent,
    // which for a data attribute means the value is REPLACED, never added to.
    fireEvent.click(option('Frost'))
    expect(applied()).toBe('frost')
    expect(window.localStorage.getItem(THEME_KEY)).toBe('frost')
    expect(selected()).toBe('frost')
  })

  // A hand-edited or corrupted value must not set an attribute matching no
  // block in themes.css, which renders the defaults while the panel shows
  // nothing selected — broken, and silent.
  test('an unrecognised stored palette falls back to frost, on screen and on the attribute', async () => {
    window.localStorage.setItem(THEME_KEY, 'midnight')
    await startSession()
    await openDock()
    expect(selected()).toBe('frost')
    expect(applied()).toBe('frost')
  })

  // Roving tabindex: one tab stop for the group, arrows move within it, and the
  // ring wraps at both ends.
  test('arrow keys move the selection and carry focus with it', async () => {
    await startSession()
    await openDock()
    expect(option('Frost').tabIndex).toBe(0)
    expect(option('Ember').tabIndex).toBe(-1)

    fireEvent.keyDown(option('Frost'), { key: 'ArrowDown' })
    expect(selected()).toBe('ember')
    expect(applied()).toBe('ember')
    expect(document.activeElement).toBe(option('Ember'))
    expect(option('Ember').tabIndex).toBe(0)

    fireEvent.keyDown(option('Ember'), { key: 'ArrowUp' })
    expect(selected()).toBe('frost')
    expect(document.activeElement).toBe(option('Frost'))

    // Wrapping backwards off the first option reaches the last.
    fireEvent.keyDown(option('Frost'), { key: 'ArrowUp' })
    expect(selected()).toBe('slate')
  })

  // The swatches paint themselves by wearing the same attribute the document
  // element wears, so themes.css reaches them and no palette colour is
  // duplicated in appearance.css. Losing that attribute is silent: the swatch
  // keeps rendering, in whatever the CURRENT palette's accent is, so all four
  // read identical and the picker stops previewing anything.
  test('each row carries a swatch bound to its own palette', async () => {
    await startSession()
    await openDock()
    expect(
      options().map((o) => o.querySelector('.appearance-swatch')?.getAttribute('data-theme'))
    ).toEqual(['frost', 'ember', 'moss', 'slate'])
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
