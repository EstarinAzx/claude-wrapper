import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
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

const send = (text: string) => {
  fireEvent.change(input(), { target: { value: text } })
  fireEvent.keyDown(input(), { key: 'Enter' })
}

describe('tool cards', () => {
  test('tool-use renders a card with tool name and key input', async () => {
    await startSession()
    send('list files')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'npm test' } })
    const card = document.querySelector('.tool-card')
    expect(card).toBeTruthy()
    expect(card?.textContent).toContain('Bash')
    expect(card?.textContent).toContain('npm test')
  })

  test('tool-result fills the card with a one-line summary', async () => {
    await startSession()
    send('run it')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'npm test' } })
    harness.emit({
      type: 'tool-result',
      id: 'tu-1',
      text: '27 passed\nDuration 1.2s',
      isError: false
    })
    const card = document.querySelector('.tool-card')
    expect(card?.textContent).toContain('27 passed')
    expect(card?.textContent).not.toContain('Duration 1.2s')
  })

  test('multiple tool calls render as separate cards in order', async () => {
    await startSession()
    send('do two things')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Read', input: { file_path: 'src/a.ts' } })
    harness.emit({ type: 'tool-use', id: 'tu-2', name: 'Grep', input: { pattern: 'foo' } })
    const cards = document.querySelectorAll('.tool-card')
    expect(cards.length).toBe(2)
    expect(cards[0].textContent).toContain('Read')
    expect(cards[0].textContent).toContain('src/a.ts')
    expect(cards[1].textContent).toContain('Grep')
    expect(cards[1].textContent).toContain('foo')
  })

  test('an errored result marks the card', async () => {
    await startSession()
    send('break')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'boom' } })
    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'exit 1', isError: true })
    expect(document.querySelector('.tool-card-error')).toBeTruthy()
    const status = screen.getByRole('status')
    expect(status.textContent).toContain('Failed')
    expect(status.textContent).toContain('exit 1')
  })

  test('text after a tool card streams into a new bubble below the card', async () => {
    await startSession()
    send('explain then act')
    harness.emit({ type: 'text-delta', text: 'Looking first.' })
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Read', input: { file_path: 'a.ts' } })
    harness.emit({ type: 'text-delta', text: 'Done reading.' })
    harness.emit({ type: 'turn-end' })
    const before = screen.getByText('Looking first.')
    const card = document.querySelector('.tool-card') as Element
    const after = screen.getByText('Done reading.')
    expect(before.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(card.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('typing indicator shows while a tool runs, hides once text streams', async () => {
    await startSession()
    send('work')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'ls' } })
    expect(screen.getByLabelText('Typing')).toBeTruthy()
    harness.emit({ type: 'text-delta', text: 'Here you go.' })
    expect(screen.queryByLabelText('Typing')).toBeNull()
  })

  test('tool-only turn ends clean: no empty assistant bubble, input re-armed', async () => {
    await startSession()
    send('silent tools')
    harness.emit({ type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'ls' } })
    harness.emit({ type: 'tool-result', id: 'tu-1', text: 'ok', isError: false })
    harness.emit({ type: 'turn-end' })
    expect(input().disabled).toBe(false)
    expect(screen.queryByLabelText('Typing')).toBeNull()
  })
})
