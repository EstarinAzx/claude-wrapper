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

describe('first chat turn', () => {
  test('started session shows empty chat, no sample conversation, armed input', async () => {
    await startSession()
    expect(screen.queryByText('What does this repo do?')).toBeNull()
    expect(screen.queryByText('Nice. Where should I start reading?')).toBeNull()
    expect(input().disabled).toBe(false)
  })

  test('Enter sends the prompt: user bubble appears, input clears and disarms', async () => {
    await startSession()
    send('hello there')
    expect(harness.prompts).toEqual(['hello there'])
    expect(screen.getByText('hello there')).toBeTruthy()
    expect(input().value).toBe('')
    expect(input().disabled).toBe(true)
  })

  test('empty input does not send', async () => {
    await startSession()
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(harness.prompts).toEqual([])
    expect(input().disabled).toBe(false)
  })

  test('typing indicator shows until first delta arrives', async () => {
    await startSession()
    send('hi')
    expect(screen.getByLabelText('Typing')).toBeTruthy()
    harness.emit({ type: 'text-delta', text: 'Hello' })
    expect(screen.queryByLabelText('Typing')).toBeNull()
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  test('deltas stream into one growing assistant message', async () => {
    await startSession()
    send('hi')
    harness.emit({ type: 'text-delta', text: 'Hello ' })
    harness.emit({ type: 'text-delta', text: 'world' })
    expect(screen.getByText('Hello world')).toBeTruthy()
  })

  test('assistant text renders as markdown with highlighted code blocks', async () => {
    await startSession()
    send('show code')
    harness.emit({ type: 'text-delta', text: 'Use **bold** and:\n\n' })
    harness.emit({ type: 'text-delta', text: '```js\nconst x = 1\n```\n' })
    const { container } = { container: document.body }
    const strong = container.querySelector('.assistant-body strong')
    expect(strong?.textContent).toBe('bold')
    const code = container.querySelector('.assistant-body pre code')
    expect(code?.textContent).toContain('const x = 1')
  })

  test('GFM table markdown renders a <table>, not raw pipes', async () => {
    await startSession()
    send('show table')
    harness.emit({ type: 'text-delta', text: '| A | B |\n| - | - |\n| 1 | 2 |\n' })
    const table = document.body.querySelector('.assistant-body table')
    expect(table).toBeTruthy()
    expect(table?.querySelectorAll('td').length).toBe(2)
  })

  test('turn end re-arms the input', async () => {
    await startSession()
    send('hi')
    harness.emit({ type: 'text-delta', text: 'done soon' })
    harness.emit({ type: 'turn-end' })
    expect(input().disabled).toBe(false)
  })

  test('conversation continues across turns, history preserved', async () => {
    await startSession()
    send('first question')
    harness.emit({ type: 'text-delta', text: 'first answer' })
    harness.emit({ type: 'turn-end' })
    send('second question')
    harness.emit({ type: 'text-delta', text: 'second answer' })
    harness.emit({ type: 'turn-end' })
    expect(harness.prompts).toEqual(['first question', 'second question'])
    expect(screen.getByText('first question')).toBeTruthy()
    expect(screen.getByText('first answer')).toBeTruthy()
    expect(screen.getByText('second question')).toBeTruthy()
    expect(screen.getByText('second answer')).toBeTruthy()
  })

  test('engine error surfaces in chat and re-arms the input', async () => {
    await startSession()
    send('hi')
    harness.emit({ type: 'error', message: 'Claude CLI not found' })
    expect(screen.getByRole('alert').textContent).toContain('Claude CLI not found')
    expect(input().disabled).toBe(false)
  })

  test('send button click also sends', async () => {
    await startSession()
    fireEvent.change(input(), { target: { value: 'via button' } })
    fireEvent.click(screen.getByLabelText('Send'))
    expect(harness.prompts).toEqual(['via button'])
  })
})
