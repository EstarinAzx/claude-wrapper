import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'
import type { SessionMeta } from '../src/shared/session-types'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
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

const input = (): HTMLInputElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLInputElement

const rowButton = (label: string): HTMLButtonElement =>
  screen.getByText(label).closest('button') as HTMLButtonElement

const meta = (id: string, title: string): SessionMeta => ({
  id,
  title,
  lastUpdated: 1000,
  messageCount: 2
})

describe('resume — continue a reopened session (#13)', () => {
  test('opening a session targets it for resume and leaves the input armed', async () => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue([
      { role: 'user', text: 'earlier question' },
      { role: 'assistant', text: 'earlier answer' }
    ])
    await startSession()

    fireEvent.click(await screen.findByText('My chat'))

    // replayed into the pane
    expect(await screen.findByText('earlier question')).toBeTruthy()
    // engine is retargeted at the opened session for the next turn
    expect(harness.api.targetSession).toHaveBeenCalledWith('sess-1')
    // input stays usable so the user can continue in place
    expect(input().disabled).toBe(false)
  })

  test("the opened session's row is highlighted, others are not", async () => {
    harness.api.listSessions.mockResolvedValue([
      meta('sess-1', 'First chat'),
      meta('sess-2', 'Second chat')
    ])
    await startSession()

    fireEvent.click(await screen.findByText('Second chat'))

    await screen.findByText('Second chat')
    expect(rowButton('Second chat').getAttribute('aria-current')).toBe('true')
    expect(rowButton('First chat').getAttribute('aria-current')).toBeNull()
  })

  test('sending after opening a session continues in place (send still fires)', async () => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))

    fireEvent.change(input(), { target: { value: 'keep going' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    expect(harness.prompts).toEqual(['keep going'])
  })

  test('New chat clears the pane and starts a fresh (unresumed) session', async () => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue([
      { role: 'user', text: 'old thread' }
    ])
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    expect(await screen.findByText('old thread')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))

    expect(screen.queryByText('old thread')).toBeNull()
    expect(harness.api.targetSession).toHaveBeenLastCalledWith(null)
    expect(input().disabled).toBe(false)
    // no row is highlighted after resetting to a fresh session
    expect(rowButton('My chat').getAttribute('aria-current')).toBeNull()
  })

  test('a fresh session joins the sidebar and is highlighted once it earns an id', async () => {
    // empty on mount, then the new session shows up on the post-turn refetch
    harness.api.listSessions
      .mockResolvedValueOnce([])
      .mockResolvedValue([meta('new-1', 'Fresh chat')])
    harness.api.currentSessionId.mockResolvedValue('new-1')
    await startSession()

    fireEvent.change(input(), { target: { value: 'hi' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    harness.emit({ type: 'turn-end' })

    const row = await screen.findByText('Fresh chat')
    expect((row.closest('button') as HTMLButtonElement).getAttribute('aria-current')).toBe('true')
  })
})
