import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { avatarRun } from '../src/renderer/src/components/Chat'
import type { ChatMessage } from '../src/renderer/src/useChat'
import { fakeChatApi, SENT_UUID } from './chat-harness'

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

  test('Enter sends the prompt: user bubble appears, input clears and stays live', async () => {
    await startSession()
    send('hello there')
    expect(harness.prompts).toEqual([{ text: 'hello there', attachments: [], uuid: SENT_UUID }])
    expect(screen.getByText('hello there')).toBeTruthy()
    expect(input().value).toBe('')
    // This line read `toBe(true)` until #80, and the change is the ticket rather
    // than a pin being papered over: "the composer is dead while a turn runs" is
    // the complaint it answers, so the field now stays armed for the next prompt
    // to be typed and queued. What did NOT change is who refuses a send while
    // busy — `useChat.send`, still the app's one reader of `busy`, which the
    // send-while-busy assertions in tests/queued-composer.test.tsx pin directly.
    expect(input().disabled).toBe(false)
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
    expect(harness.prompts).toEqual([
      { text: 'first question', attachments: [], uuid: SENT_UUID },
      { text: 'second question', attachments: [], uuid: SENT_UUID }
    ])
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
    expect(harness.prompts).toEqual([{ text: 'via button', attachments: [], uuid: SENT_UUID }])
  })
})

// #37 — a typed /command's output comes back as a command-output event and
// must reach the screen; the CLI's informational text rides the notice role.
describe('local command output (#37)', () => {
  test('command-output renders markdown in a command message with no avatar', async () => {
    await startSession()
    send('/context')
    harness.emit({
      type: 'command-output',
      text: '## Context Usage\n\n**Model:** fable'
    })
    harness.emit({ type: 'turn-end' })
    const cmd = document.body.querySelector('.msg-command')
    expect(cmd).toBeTruthy()
    // No avatar: the CLI produced this text, not Claude.
    expect(cmd!.querySelector('.avatar')).toBeNull()
    // Markdown actually rendered, not raw source.
    expect(cmd!.querySelector('h2')?.textContent).toBe('Context Usage')
    expect(cmd!.querySelector('strong')?.textContent).toBe('Model:')
    // The turn ended and the composer re-armed.
    expect(input().disabled).toBe(false)
  })

  test('notice event renders through the existing notice styling', async () => {
    await startSession()
    send('/mdoel')
    harness.emit({
      type: 'notice',
      text: 'Unknown command: /mdoel. Did you mean /model?'
    })
    harness.emit({ type: 'turn-end' })
    const notice = screen.getByText('Unknown command: /mdoel. Did you mean /model?')
    expect(notice.classList.contains('msg-notice')).toBe(true)
    expect(input().disabled).toBe(false)
  })

  test('command output does not merge into a later streaming assistant message', async () => {
    await startSession()
    send('/context')
    harness.emit({ type: 'command-output', text: 'command answer' })
    harness.emit({ type: 'turn-end' })
    send('now a real prompt')
    harness.emit({ type: 'text-delta', text: 'model answer' })
    // Two separate messages: the command block and a fresh assistant bubble.
    expect(document.body.querySelector('.msg-command')?.textContent).toContain(
      'command answer'
    )
    const assistant = document.body.querySelector('.msg-assistant .assistant-body')
    expect(assistant?.textContent).toContain('model answer')
    expect(assistant?.textContent).not.toContain('command answer')
  })
})

// The avatar run — the load-bearing half of "one assistant turn reads as one
// block". `avatarRun` decides which assistant rows draw a mint avatar and which
// are continuations of a turn already opened, and the whole grouping rests on
// it: a tool card must NOT end a turn, while any other speaker must.
//
// Pinned here rather than through a rendered box because jsdom loads no CSS and
// so cannot see the hidden avatar or the tightened interval. This is the D4 pin
// for the grouping: `inspect.mjs` renders the real sequence in real Chromium but
// is not a `gui-*.mjs`, so the DOM phase never launches it, which would otherwise
// leave the run's own capture as the only thing covering this logic.
describe('avatarRun', () => {
  const prose = (id: string, text = 'x'): ChatMessage => ({ id, role: 'assistant', text })

  const card = (id: string): ChatMessage => ({
    id,
    role: 'tool',
    toolUseId: `t${id}`,
    name: 'Read',
    input: {},
    result: null,
    isError: false,
    permission: null
  })

  test('a tool card does not end a turn: prose -> card -> prose draws ONE avatar', () => {
    const { lead } = avatarRun([prose('a1'), card('c1'), prose('a2')])
    expect(lead.has('a1')).toBe(true)
    expect(lead.has('a2')).toBe(false)
    expect(lead.size).toBe(1)
  })

  test('a user message ends the turn, so the next prose opens a new one', () => {
    const { lead } = avatarRun([
      prose('a1'),
      card('c1'),
      prose('a2'),
      { id: 'u1', role: 'user', text: 'next' },
      prose('a3')
    ])
    expect([...lead].sort()).toEqual(['a1', 'a3'])
  })

  test('an empty assistant row cannot claim the avatar', () => {
    // The streaming row exists before its first delta arrives; if it took the
    // avatar, the turn's real first line would render as a continuation.
    const { lead } = avatarRun([prose('a1', ''), prose('a2', 'real text')])
    expect(lead.has('a1')).toBe(false)
    expect(lead.has('a2')).toBe(true)
  })

  test('trailing reports whether the open turn already drew, for the typing row', () => {
    expect(avatarRun([]).trailing).toBe(false)
    expect(avatarRun([{ id: 'u1', role: 'user', text: 'hi' }]).trailing).toBe(false)
    // Typing after this turn's own card must not draw a second avatar.
    expect(avatarRun([prose('a1'), card('c1')]).trailing).toBe(true)
  })
})
