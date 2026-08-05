import { readdirSync, readFileSync } from 'node:fs'
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, SENT_UUID } from './chat-harness'

// #42 — the composer is a textarea. Enter sends, Shift+Enter breaks the line.
// The #40 popover keeps first claim on a plain Enter; Shift+Enter escapes it
// into an ordinary break, because a newline is whitespace and whitespace ends
// the command-trigger window.
let harness: ReturnType<typeof fakeChatApi>

const COMMANDS = [
  { name: 'context', description: 'Show context usage', argumentHint: '' },
  { name: 'model', description: 'Pick a model', argumentHint: '<model>' }
]

beforeEach(() => {
  harness = fakeChatApi()
  harness.api.listCommands.mockResolvedValue(COMMANDS)
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
})

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const composer = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLTextAreaElement

const type = async (v: string): Promise<void> => {
  fireEvent.change(composer(), { target: { value: v } })
  await act(async () => {})
}

const popover = (): HTMLElement | null =>
  screen.queryByRole('listbox', { name: 'Command suggestions' })

const bubble = (): Element | null => document.querySelector('.msg-user .bubble')

// jsdom applies no stylesheet, so the two rules that are pure CSS get pinned
// against the source — the same technique the renderer-CSP test already uses.
// The stylesheet is split by surface under styles/ (.bubble in chat.css,
// .message-input in composer.css). Read the whole directory so the pin follows
// a rule that moves between files. Still a slice from the selector to the next
// `}`, so both selectors must stay UNGROUPED and no comment inside either block
// may contain a closing brace.
const STYLES_DIR = 'src/renderer/src/styles'
const cssBlock = (selector: string): string => {
  const css = readdirSync(STYLES_DIR)
    .sort()
    .map((f) => readFileSync(`${STYLES_DIR}/${f}`, 'utf8'))
    .join('\n')
  const at = css.indexOf(`${selector} {`)
  return at === -1 ? '' : css.slice(at, css.indexOf('}', at))
}

describe('the composer is multiline (#42)', () => {
  test('it is a textarea that starts at one row', async () => {
    await startSession()
    expect(composer().tagName).toBe('TEXTAREA')
    expect(composer().rows).toBe(1)
  })

  test('Shift+Enter inserts a newline and does not send', async () => {
    await startSession()
    await type('line one')

    fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true })

    expect(composer().value).toBe('line one\n')
    expect(harness.prompts).toEqual([])
  })

  // The break belongs where the caret is. Appending to the end instead would
  // pass the test above and still be wrong for anyone editing mid-prompt.
  test('the break lands at the caret, not at the end', async () => {
    await startSession()
    await type('ab')
    composer().setSelectionRange(1, 1)

    fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true })

    expect(composer().value).toBe('a\nb')
    expect(composer().selectionStart).toBe(2)
  })

  test('a selection is replaced by the break', async () => {
    await startSession()
    await type('keep DROP')
    composer().setSelectionRange(5, 9)

    fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true })

    expect(composer().value).toBe('keep \n')
  })

  test('Enter still sends when the popover is closed', async () => {
    await startSession()
    await type('hello there')

    fireEvent.keyDown(composer(), { key: 'Enter' })

    expect(harness.prompts).toEqual([{ text: 'hello there', attachments: [], uuid: SENT_UUID }])
  })
})

// Three separate assertions on purpose: a newline sitting in the textarea does
// not prove it reached the engine, and reaching the engine does not prove the
// transcript renders it as two lines.
describe('a newline survives the whole path (#42)', () => {
  const composeTwoLines = async (): Promise<void> => {
    await startSession()
    await type('first')
    fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true })
    await type(`${composer().value}second`)
  }

  test('1/3 — the composer value carries the newline', async () => {
    await composeTwoLines()
    expect(composer().value).toBe('first\nsecond')
  })

  test('2/3 — the send payload carries the newline', async () => {
    await composeTwoLines()

    fireEvent.keyDown(composer(), { key: 'Enter' })

    expect(harness.prompts).toEqual([{ text: 'first\nsecond', attachments: [], uuid: SENT_UUID }])
  })

  test('3/3 — the sent bubble keeps the break instead of flattening it', async () => {
    await composeTwoLines()

    fireEvent.keyDown(composer(), { key: 'Enter' })

    expect(bubble()?.textContent).toContain('first\nsecond')
  })

  // A bubble that renders the newline in the DOM still collapses it on screen
  // without this, and a long unbroken token still overflows the pill.
  test('the bubble stylesheet preserves breaks and wraps long tokens', () => {
    const block = cssBlock('.bubble')
    expect(block).toMatch(/white-space:\s*pre-wrap/)
    expect(block).toMatch(/overflow-wrap:\s*anywhere/)
  })
})

describe('the composer and the command popover (#42 + #40)', () => {
  test('an open popover still claims a plain Enter — it accepts, it does not send', async () => {
    await startSession()
    await type('/co')
    expect(popover()).toBeTruthy()

    fireEvent.keyDown(composer(), { key: 'Enter' })

    expect(composer().value).toBe('/context ')
    expect(harness.prompts).toEqual([])
  })

  test('Shift+Enter escapes an open popover into a line break', async () => {
    await startSession()
    await type('/co')
    expect(popover()).toBeTruthy()

    fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true })
    await act(async () => {})

    expect(composer().value).toBe('/co\n')
    expect(popover()).toBeNull()
    expect(harness.prompts).toEqual([])
  })

  // The trigger used to key on a literal space. Newlines are whitespace too,
  // and a command name cannot contain one.
  //
  // An empty popover is NOT enough evidence here: a space-only check also
  // renders nothing, purely because "context\nsecond" matches no command name.
  // The fetch is what separates closed from merely unmatched — a closed window
  // stops asking. Verified by mutation: reverting to `.includes(' ')` leaves
  // the popover assertion green and fails only on this call count.
  test('a newline closes the trigger window, not just a space', async () => {
    await startSession()
    await type('/context')
    expect(popover()).toBeTruthy()
    const fetches = harness.api.listCommands.mock.calls.length

    await type('/context\nsecond')

    expect(popover()).toBeNull()
    expect(harness.api.listCommands.mock.calls.length).toBe(fetches)
  })
})

describe('the composer height (#42)', () => {
  // Growth is native: field-sizing measures the content, max-height caps it at
  // eight lines, overflow-y scrolls past that.
  test('the stylesheet grows it to an eight-line ceiling and then scrolls', () => {
    const block = cssBlock('.message-input')
    expect(block).toMatch(/field-sizing:\s*content/)
    expect(block).toMatch(/max-height:[^;]*8/)
    expect(block).toMatch(/overflow-y:\s*auto/)
  })

  // The growth above is what makes the pill's radius load-bearing. A 999px
  // --r-pill is clamped to half the shorter side, so it renders as 24px at the
  // resting height and is indistinguishable from this value until the composer
  // grows — at which point it sweeps to ~96px and the pill reads as a lozenge
  // with the buttons inside the curve. Nothing about the one-line composer can
  // catch that, so the pin is on the source: a fixed radius, not the token.
  test('the pill radius is fixed, so growing it cannot round into a lozenge', () => {
    const block = cssBlock('.input-pill')
    expect(block).toMatch(/border-radius:\s*24px/)
    expect(block).not.toMatch(/border-radius:\s*var\(--r-pill\)/)
  })

  // Criterion 6 is structural rather than behavioural: the height is never
  // React state, so there is nothing that can stay stuck after a send or an
  // external insert. An inline height written by JS is exactly the bug this
  // forbids — it would survive the value going empty.
  test('no inline height is ever pinned, so send and insert reset it', async () => {
    await startSession()
    await type('first')
    fireEvent.keyDown(composer(), { key: 'Enter', shiftKey: true })
    await type(`${composer().value}second`)
    expect(composer().style.height).toBe('')

    fireEvent.keyDown(composer(), { key: 'Enter' })

    expect(composer().value).toBe('')
    expect(composer().style.height).toBe('')
  })
})
