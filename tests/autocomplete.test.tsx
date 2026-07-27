import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'

// #40 — composer slash-command autocomplete. Trigger: value starts with '/'
// and contains no space. Enter is intercepted ONLY while the popover is open
// with a highlighted row — every other state falls through to submit. That
// pin is mutation-verified in BOTH directions below.
let harness: ReturnType<typeof fakeChatApi>

const COMMANDS = [
  { name: 'context', description: 'Show context usage', argumentHint: '' },
  { name: 'usage', description: 'Show usage', argumentHint: '', aliases: ['cost', 'stats'] },
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

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const input = (): HTMLInputElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLInputElement

const type = async (v: string) => {
  fireEvent.change(input(), { target: { value: v } })
  await act(async () => {})
}

const popover = () => screen.queryByRole('listbox', { name: 'Command suggestions' })
const options = () => screen.queryAllByRole('option')
const highlighted = () =>
  options().find((o) => o.getAttribute('aria-selected') === 'true')

describe('composer autocomplete (#40)', () => {
  test('typing / in an empty composer opens the popover', async () => {
    await startSession()
    await type('/')
    expect(popover()).toBeTruthy()
    expect(options().length).toBe(3)
  })

  test('typing narrows the list by prefix', async () => {
    await startSession()
    await type('/co')
    const names = options().map((o) => o.textContent)
    expect(names.join()).toContain('/context')
    expect(names.join()).not.toContain('/model')
  })

  test('an alias match surfaces its command', async () => {
    await startSession()
    await type('/cos')
    const names = options().map((o) => o.textContent)
    expect(names.join()).toContain('/usage')
  })

  test('a slash mid-sentence does not open the popover', async () => {
    await startSession()
    await type('what does /context do')
    expect(popover()).toBeNull()
  })

  test('a space after the command name closes the popover', async () => {
    await startSession()
    await type('/context')
    expect(popover()).toBeTruthy()
    await type('/context ')
    expect(popover()).toBeNull()
  })

  test('arrow keys move the highlight', async () => {
    await startSession()
    await type('/')
    expect(highlighted()?.textContent).toContain('/context')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(highlighted()?.textContent).toContain('/usage')
    fireEvent.keyDown(input(), { key: 'ArrowUp' })
    expect(highlighted()?.textContent).toContain('/context')
  })

  test('Enter accepts the highlighted match: inserts name + trailing space, closes, does NOT send', async () => {
    await startSession()
    await type('/co')
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(input().value).toBe('/context ')
    expect(popover()).toBeNull()
    expect(harness.prompts).toEqual([])
  })

  test('Tab accepts identically', async () => {
    await startSession()
    await type('/mo')
    fireEvent.keyDown(input(), { key: 'Tab' })
    expect(input().value).toBe('/model ')
    expect(harness.prompts).toEqual([])
  })

  test('Escape dismisses and leaves the typed text intact', async () => {
    await startSession()
    await type('/con')
    fireEvent.keyDown(input(), { key: 'Escape' })
    expect(popover()).toBeNull()
    expect(input().value).toBe('/con')
  })

  test('PIN both ways: popover open Enter does not send; popover closed Enter sends', async () => {
    await startSession()
    // Open: Enter is interception, not submit.
    await type('/co')
    expect(popover()).toBeTruthy()
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(harness.prompts).toEqual([])
    // Now closed (accept added the space): Enter submits the composed command.
    fireEvent.change(input(), { target: { value: '/context please' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(harness.prompts).toEqual([{ text: '/context please', attachments: [] }])
  })

  test('after Escape, Enter falls through and sends the typed slash text', async () => {
    await startSession()
    await type('/context')
    fireEvent.keyDown(input(), { key: 'Escape' })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(harness.prompts).toEqual([{ text: '/context', attachments: [] }])
  })

  test('a plain message never fetches the list and sends exactly as before', async () => {
    await startSession()
    await type('hello there')
    expect(harness.api.listCommands).not.toHaveBeenCalled()
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(harness.prompts).toEqual([{ text: 'hello there', attachments: [] }])
  })
})

// Observed live, invisible to a static mock: an early fetch can land [] while
// the engine is still warming. The popover must not stay wedged shut — the
// list is re-read on the next keystroke inside the trigger window.
describe('composer autocomplete refetch (#40)', () => {
  test('an empty first fetch does not wedge the popover shut for the window', async () => {
    harness.api.listCommands.mockResolvedValueOnce([]).mockResolvedValue(COMMANDS)
    await startSession()
    await type('/c')
    expect(popover()).toBeNull()
    await type('/co')
    expect(popover()).toBeTruthy()
    expect(options().length).toBeGreaterThan(0)
  })
})
