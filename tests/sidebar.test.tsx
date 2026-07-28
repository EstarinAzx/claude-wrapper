import { describe, test, expect, afterEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import type {
  SessionMeta,
  SwitchRequest,
  SwitchResult,
  TranscriptMessage
} from '../src/shared/session-types'

let listSessions: Mock<() => Promise<SessionMeta[]>>
let loadTranscript: Mock<(id: string) => Promise<TranscriptMessage[]>>
let switchWorkspace: Mock<(req: SwitchRequest) => Promise<SwitchResult>>

const setup = (sessions: SessionMeta[], transcript: TranscriptMessage[] = []): void => {
  listSessions = vi.fn<() => Promise<SessionMeta[]>>().mockResolvedValue(sessions)
  loadTranscript = vi
    .fn<(id: string) => Promise<TranscriptMessage[]>>()
    .mockResolvedValue(transcript)
  switchWorkspace = vi
    .fn<(req: SwitchRequest) => Promise<SwitchResult>>()
    .mockResolvedValue({ status: 'ok' })
  ;(window as Window & { api: unknown }).api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    pickFolder: vi.fn().mockResolvedValue('D:\\projects\\demo'),
    chooseFolder: vi.fn().mockResolvedValue({ status: 'cancelled' }),
    pickFiles: vi.fn().mockResolvedValue([]),
    listSessions,
    loadTranscript,
    titleHint: vi.fn().mockResolvedValue(null),
    listSubagents: vi.fn().mockResolvedValue([]),
    subagentTranscript: vi.fn().mockResolvedValue([]),
    switchWorkspace,
    targetSession: vi.fn(),
    currentSessionId: vi.fn().mockResolvedValue(null),
    backendMode: vi.fn().mockResolvedValue({ mode: 'native', wispedAvailable: false }),
    setBackendMode: vi.fn(),
    onBackendChanged: vi.fn().mockReturnValue(() => {}),
    permissionMode: vi.fn().mockResolvedValue('bypassPermissions'),
    setPermissionMode: vi.fn(),
    onPermissionChanged: vi.fn().mockReturnValue(() => {}),
    listCommands: vi.fn().mockResolvedValue([]),
    listModels: vi.fn().mockResolvedValue({ models: [], current: null }),
    setModel: vi.fn(),
    onModelChanged: vi.fn().mockReturnValue(() => {}),
    watchSession: vi.fn(),
    onSessionChanged: vi.fn().mockReturnValue(() => {}),
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

const HERE = 'D:\\projects\\demo'
const THERE = 'D:\\projects\\other'

const rows = (): HTMLElement[] => Array.from(document.querySelectorAll('.session-row'))

const rowButton = (label: string): HTMLButtonElement =>
  screen.getByText(label).closest('button') as HTMLButtonElement

const filter = (): HTMLInputElement => screen.getByRole('searchbox') as HTMLInputElement

describe('session sidebar', () => {
  test('empty folder shows the empty state inside the Sessions landmark', async () => {
    setup([])
    await startSession()
    expect(await screen.findByText('No sessions yet')).toBeTruthy()
    expect(screen.getByRole('complementary', { name: 'Sessions' })).toBeTruthy()
  })

  test('renders rows in the order given (newest-first) with a relative time', async () => {
    setup([
      { id: 'a', title: 'Newest chat', lastUpdated: Date.now() - 60_000, cwd: HERE },
      { id: 'b', title: 'Older chat', lastUpdated: Date.now() - 3_600_000, cwd: HERE }
    ])
    await startSession()
    const found = await screen.findAllByText(/chat$/)
    expect(found.map((r) => r.textContent)).toEqual(['Newest chat', 'Older chat'])
    expect(screen.getByText('1m')).toBeTruthy()
    expect(screen.getByText('1h')).toBeTruthy()
  })

  test('a titleless session falls back to a placeholder', async () => {
    setup([{ id: 'x', title: '', lastUpdated: 0, cwd: HERE }])
    await startSession()
    expect(await screen.findByText('Untitled session')).toBeTruthy()
  })

  test('collapsing hides the list and swaps the toggle', async () => {
    setup([{ id: 'a', title: 'Keep me', lastUpdated: 1000, cwd: HERE }])
    await startSession()
    await screen.findByText('Keep me')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sessions' }))
    expect(screen.queryByText('Keep me')).toBeNull()
    expect(screen.getByRole('button', { name: 'Expand sessions' })).toBeTruthy()
  })

  test('clicking a row loads and replays its transcript into the chat pane', async () => {
    setup(
      [{ id: 'sess-1', title: 'My chat', lastUpdated: 2000, cwd: HERE }],
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
      { id: 'ext-1', title: 'External chat', lastUpdated: 3000, cwd: HERE }
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
      { id: 'ext-2', title: 'Reloaded chat', lastUpdated: 3000, cwd: HERE }
    ])
    await startSession()
    expect(await screen.findByText('No sessions yet')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh sessions' }))
    expect(await screen.findByText('Reloaded chat')).toBeTruthy()
  })
})

// #45: the list is global. The rail groups by project, filters client-side over
// the loaded metadata, and caps what it renders.
describe('cross-project session list', () => {
  test('heads each project with its directory', async () => {
    setup([
      { id: 'a', title: 'Here chat', lastUpdated: 2000, cwd: HERE },
      { id: 'b', title: 'There chat', lastUpdated: 1000, cwd: THERE }
    ])
    await startSession()

    expect(await screen.findByText(HERE)).toBeTruthy()
    expect(screen.getByText(THERE)).toBeTruthy()
  })

  test('a session with no recorded project heads under Unknown project', async () => {
    setup([{ id: 'a', title: 'Homeless chat', lastUpdated: 2000 }])
    await startSession()

    expect(await screen.findByText('Unknown project')).toBeTruthy()
  })

  // #45 rendered this row inert and pinned that; #47 is the ticket that
  // reverses the contract by name, so the pin becomes a ROUTING pin instead of
  // being deleted. What still has to hold: a foreign row goes through the
  // workspace transaction, never the in-project resume — replaying its
  // transcript before the engine's cwd moves IS the "project B's conversation
  // beside project A's sidebar" failure.
  test('a session in another project switches workspace instead of resuming in place', async () => {
    setup([{ id: 'far', title: 'Far chat', lastUpdated: 2000, cwd: THERE }])
    await startSession()

    await screen.findByText('Far chat')
    const row = rowButton('Far chat')
    expect(row.disabled).toBe(false)

    fireEvent.click(row)
    expect(switchWorkspace).toHaveBeenCalledWith({ cwd: THERE, resumeId: 'far' })
    await waitFor(() => expect(loadTranscript).toHaveBeenCalledWith('far'))
  })

  test('a session in the open project stays openable', async () => {
    setup([{ id: 'near', title: 'Near chat', lastUpdated: 2000, cwd: HERE }])
    await startSession()

    fireEvent.click(await screen.findByText('Near chat'))
    expect(loadTranscript).toHaveBeenCalledWith('near')
  })

  // The store spells one directory both ways; the open workspace must still
  // recognise its own sessions.
  test('a drive-letter case difference still counts as the open project', async () => {
    setup([{ id: 'near', title: 'Near chat', lastUpdated: 2000, cwd: 'd:\\projects\\demo' }])
    await startSession()

    fireEvent.click(await screen.findByText('Near chat'))
    expect(loadTranscript).toHaveBeenCalledWith('near')
  })
})

describe('session filter', () => {
  test('narrows the list to titles matching what was typed', async () => {
    setup([
      { id: 'a', title: 'Fix the parser', lastUpdated: 2000, cwd: HERE },
      { id: 'b', title: 'Ship it', lastUpdated: 1000, cwd: HERE }
    ])
    await startSession()
    await screen.findByText('Fix the parser')

    fireEvent.change(filter(), { target: { value: 'parser' } })

    expect(screen.getByText('Fix the parser')).toBeTruthy()
    expect(screen.queryByText('Ship it')).toBeNull()
  })

  test('typing a project name narrows to that project', async () => {
    setup([
      { id: 'a', title: 'Alpha work', lastUpdated: 2000, cwd: HERE },
      { id: 'b', title: 'Beta work', lastUpdated: 1000, cwd: THERE }
    ])
    await startSession()
    await screen.findByText('Alpha work')

    fireEvent.change(filter(), { target: { value: 'other' } })

    expect(screen.getByText('Beta work')).toBeTruthy()
    expect(screen.queryByText('Alpha work')).toBeNull()
  })

  test('a filter matching nothing says so instead of looking empty', async () => {
    setup([{ id: 'a', title: 'Fix the parser', lastUpdated: 2000, cwd: HERE }])
    await startSession()
    await screen.findByText('Fix the parser')

    fireEvent.change(filter(), { target: { value: 'zzz' } })

    expect(screen.getByText('No sessions match “zzz”')).toBeTruthy()
  })

  // Filter runs over the whole loaded list, not over the rendered page — a match
  // sitting past the cap must still surface, or the filter silently lies.
  test('finds a match that sits below the render cap', async () => {
    setup([
      ...Array.from({ length: 120 }, (_, i) => ({
        id: `n${i}`,
        title: 'noise',
        lastUpdated: 10_000 - i,
        cwd: HERE
      })),
      { id: 'needle', title: 'the needle', lastUpdated: 1, cwd: HERE }
    ])
    await startSession()
    await screen.findAllByText('noise')

    fireEvent.change(filter(), { target: { value: 'needle' } })

    expect(screen.getByText('the needle')).toBeTruthy()
    expect(rows()).toHaveLength(1)
  })
})

describe('session list cap', () => {
  const many = (n: number): SessionMeta[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `s${i}`,
      title: `chat ${i}`,
      lastUpdated: n - i,
      cwd: HERE
    }))

  test('renders at most 100 sessions and offers the rest', async () => {
    setup(many(130))
    await startSession()
    await screen.findByText('chat 0')

    expect(rows()).toHaveLength(100)
    expect(screen.getByRole('button', { name: 'Show 30 more' })).toBeTruthy()
  })

  test('Show more reveals the next page and then retires itself', async () => {
    setup(many(130))
    await startSession()
    await screen.findByText('chat 0')

    fireEvent.click(screen.getByRole('button', { name: 'Show 30 more' }))

    expect(rows()).toHaveLength(130)
    expect(screen.queryByRole('button', { name: /Show \d+ more/ })).toBeNull()
  })

  test('no cap affordance when everything already fits', async () => {
    setup(many(3))
    await startSession()
    await screen.findByText('chat 0')

    expect(screen.queryByRole('button', { name: /Show \d+ more/ })).toBeNull()
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
    setup([{ id: 'a', title: 'Keep me', lastUpdated: 1000 }])
    await startSession()
    await screen.findByText('Keep me')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sessions' }))
    expect(screen.queryByRole('separator', { name: 'Resize sidebar' })).toBeNull()
  })
})
