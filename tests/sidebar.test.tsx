import { describe, test, expect, afterEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
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
    backendMode: vi.fn().mockResolvedValue({ mode: 'native', wispedAvailable: false }),
    setBackendMode: vi.fn(),
    onBackendChanged: vi.fn().mockReturnValue(() => {}),
    permissionMode: vi.fn().mockResolvedValue('bypassPermissions'),
    setPermissionMode: vi.fn(),
    onPermissionChanged: vi.fn().mockReturnValue(() => {}),
    setZoom: vi.fn(),
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
  window.localStorage.clear()
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

  test('refreshes the session list on window focus', async () => {
    setup([])
    listSessions.mockResolvedValueOnce([]).mockResolvedValue([
      { id: 'ext-1', title: 'External chat', lastUpdated: 3000, messageCount: 1 }
    ])
    await startSession()
    expect(await screen.findByText('No sessions yet')).toBeTruthy()
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(await screen.findByText('External chat')).toBeTruthy()
  })

  test('the manual Refresh control refetches the session list', async () => {
    setup([])
    listSessions.mockResolvedValueOnce([]).mockResolvedValue([
      { id: 'ext-2', title: 'Reloaded chat', lastUpdated: 3000, messageCount: 1 }
    ])
    await startSession()
    expect(await screen.findByText('No sessions yet')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh sessions' }))
    expect(await screen.findByText('Reloaded chat')).toBeTruthy()
  })
})

// jsdom has no PointerEvent constructor, so we dispatch the drag as plain
// MouseEvents carrying clientX — the window listeners key off type + clientX.
const dragHandleBy = (handle: Element, fromX: number, toX: number): void => {
  fireEvent(handle, new MouseEvent('pointerdown', { clientX: fromX, bubbles: true, cancelable: true }))
  act(() => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: toX }))
    window.dispatchEvent(new MouseEvent('pointerup', {}))
  })
}

describe('sidebar resize', () => {
  const rail = (): HTMLElement => screen.getByRole('complementary', { name: 'Sessions' })

  test('applies the default width on mount', async () => {
    setup([])
    await startSession()
    expect(rail().style.width).toBe('248px')
  })

  test('dragging the handle widens the rail and persists the width', async () => {
    setup([])
    await startSession()
    dragHandleBy(screen.getByRole('separator', { name: 'Resize sidebar' }), 300, 360)
    expect(rail().style.width).toBe('308px') // 248 + (360 - 300)
    expect(window.localStorage.getItem('sidebar-width')).toBe('308')
  })

  test('clamps at the max bound on an oversized drag', async () => {
    setup([])
    await startSession()
    dragHandleBy(screen.getByRole('separator', { name: 'Resize sidebar' }), 0, 2000)
    expect(rail().style.width).toBe('480px')
    expect(window.localStorage.getItem('sidebar-width')).toBe('480')
  })

  test('restores a persisted width on mount', async () => {
    window.localStorage.setItem('sidebar-width', '320')
    setup([])
    await startSession()
    expect(rail().style.width).toBe('320px')
  })

  test('exposes no resize handle while collapsed (resize is inert)', async () => {
    setup([{ id: 'a', title: 'Keep me', lastUpdated: 1000, messageCount: 1 }])
    await startSession()
    await screen.findByText('Keep me')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sessions' }))
    expect(screen.queryByRole('separator', { name: 'Resize sidebar' })).toBeNull()
  })
})
