import { describe, test, expect, afterEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'
import type { SessionMeta, TranscriptMessage } from '../src/shared/session-types'

let listSessions: Mock<() => Promise<SessionMeta[]>>
let loadTranscript: Mock<(id: string) => Promise<TranscriptMessage[]>>

const setup = (sessions: SessionMeta[], transcript: TranscriptMessage[] = []): void => {
  listSessions = vi.fn<() => Promise<SessionMeta[]>>().mockResolvedValue(sessions)
  loadTranscript = vi
    .fn<(id: string) => Promise<TranscriptMessage[]>>()
    .mockResolvedValue(transcript)
  ;(window as Window & { api: unknown }).api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    pickFolder: vi.fn().mockResolvedValue('D:\\projects\\demo'),
    listSessions,
    loadTranscript,
    targetSession: vi.fn(),
    currentSessionId: vi.fn().mockResolvedValue(null),
    sendPrompt: vi.fn(),
    stopTurn: vi.fn(),
    respondToPermission: vi.fn(),
    onChatEvent: vi.fn().mockReturnValue(() => {})
  }
}

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

afterEach(() => {
  cleanup()
})

describe('session sidebar', () => {
  test('empty folder shows the empty state inside the Sessions landmark', async () => {
    setup([])
    await startSession()
    expect(await screen.findByText('No sessions yet')).toBeTruthy()
    expect(screen.getByRole('complementary', { name: 'Sessions' })).toBeTruthy()
  })

  test('renders rows in the order given (newest-first) with message count', async () => {
    setup([
      { id: 'a', title: 'Newest chat', lastUpdated: 3000, messageCount: 4 },
      { id: 'b', title: 'Older chat', lastUpdated: 1000, messageCount: 2 }
    ])
    await startSession()
    const rows = await screen.findAllByText(/chat$/)
    expect(rows.map((r) => r.textContent)).toEqual(['Newest chat', 'Older chat'])
    expect(screen.getByText(/4 msg/)).toBeTruthy()
  })

  test('a titleless session falls back to a placeholder', async () => {
    setup([{ id: 'x', title: '', lastUpdated: 0, messageCount: 0 }])
    await startSession()
    expect(await screen.findByText('Untitled session')).toBeTruthy()
  })

  test('collapsing hides the list and swaps the toggle', async () => {
    setup([{ id: 'a', title: 'Keep me', lastUpdated: 1000, messageCount: 1 }])
    await startSession()
    await screen.findByText('Keep me')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sessions' }))
    expect(screen.queryByText('Keep me')).toBeNull()
    expect(screen.getByRole('button', { name: 'Expand sessions' })).toBeTruthy()
  })

  test('clicking a row loads and replays its transcript into the chat pane', async () => {
    setup(
      [{ id: 'sess-1', title: 'My chat', lastUpdated: 2000, messageCount: 2 }],
      [
        { role: 'user', text: 'replayed question' },
        { role: 'assistant', text: 'replayed answer' },
        {
          role: 'tool',
          toolUseId: 't1',
          name: 'Read',
          input: { file_path: '/x.ts' },
          result: 'ok',
          isError: false
        }
      ]
    )
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    expect(loadTranscript).toHaveBeenCalledWith('sess-1')
    expect(await screen.findByText('replayed question')).toBeTruthy()
    expect(screen.getByText('replayed answer')).toBeTruthy()
    // Tool card renders as in the live chat (name + summarised result).
    expect(screen.getByText('Read')).toBeTruthy()
    expect(screen.getByText('ok')).toBeTruthy()
  })
})
