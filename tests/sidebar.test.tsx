import { readFileSync } from 'node:fs'
import { describe, test, expect, afterEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import type {
  DeleteStatus,
  SessionMeta,
  SwitchRequest,
  SwitchResult,
  TranscriptMessage
} from '../src/shared/session-types'

let listSessions: Mock<() => Promise<SessionMeta[]>>
let loadTranscript: Mock<(id: string) => Promise<TranscriptMessage[]>>
let switchWorkspace: Mock<(req: SwitchRequest) => Promise<SwitchResult>>
let deleteSession: Mock<(id: string) => Promise<DeleteStatus>>
let targetSession: Mock<(id: string | null) => void>

const setup = (sessions: SessionMeta[], transcript: TranscriptMessage[] = []): void => {
  listSessions = vi.fn<() => Promise<SessionMeta[]>>().mockResolvedValue(sessions)
  loadTranscript = vi
    .fn<(id: string) => Promise<TranscriptMessage[]>>()
    .mockResolvedValue(transcript)
  switchWorkspace = vi
    .fn<(req: SwitchRequest) => Promise<SwitchResult>>()
    .mockResolvedValue({ status: 'ok' })
  deleteSession = vi.fn<(id: string) => Promise<DeleteStatus>>().mockResolvedValue('ok')
  targetSession = vi.fn<(id: string | null) => void>()
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
    deleteSession,
    targetSession,
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
    setBackdrop: vi.fn(),
    setWindowBounds: vi.fn(),
    onWindowBoundsChanged: vi.fn(() => () => {}),
    sendPrompt: vi.fn(),
    stopTurn: vi.fn(),
    respondToPermission: vi.fn(),
    onChatEvent: vi.fn().mockReturnValue(() => {}),
    onEngineTerminal: vi.fn().mockReturnValue(() => {})
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

const scopeButton = (name: 'This project' | 'All projects'): HTMLButtonElement =>
  screen.getByRole('button', { name }) as HTMLButtonElement

// The rail opens scoped to the open workspace. A test whose SUBJECT is the rest
// of the store seeds the pref the toggle writes instead of clicking through it,
// so it keeps asserting the one thing it is named for. The click that sets the
// pref has its own coverage in the `session scope` describe below.
const showAllProjects = (): void => window.localStorage.setItem('sidebar-scope', 'all')

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
    showAllProjects()
    await startSession()

    expect(await screen.findByText(HERE)).toBeTruthy()
    expect(screen.getByText(THERE)).toBeTruthy()
  })

  test('a session with no recorded project heads under Unknown project', async () => {
    setup([{ id: 'a', title: 'Homeless chat', lastUpdated: 2000 }])
    showAllProjects()
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
    showAllProjects()
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

// The rail is global (#45), but ~90% of a real store is other projects. It opens
// on the workspace the user is in and widens on request.
describe('session scope', () => {
  const MIXED: SessionMeta[] = [
    { id: 'a', title: 'Here chat', lastUpdated: 3000, cwd: HERE },
    { id: 'b', title: 'There chat', lastUpdated: 2000, cwd: THERE },
    { id: 'c', title: 'Homeless chat', lastUpdated: 1000 }
  ]

  test('opens on the workspace, hiding other projects and the cwd-less ones', async () => {
    setup(MIXED)
    await startSession()

    expect(await screen.findByText('Here chat')).toBeTruthy()
    expect(screen.queryByText('There chat')).toBeNull()
    expect(screen.queryByText('Homeless chat')).toBeNull()
    expect(scopeButton('This project').getAttribute('aria-pressed')).toBe('true')
  })

  test('All projects reveals the rest of the store and persists the choice', async () => {
    setup(MIXED)
    await startSession()
    await screen.findByText('Here chat')

    fireEvent.click(scopeButton('All projects'))

    expect(await screen.findByText('There chat')).toBeTruthy()
    expect(screen.getByText('Homeless chat')).toBeTruthy()
    expect(window.localStorage.getItem('sidebar-scope')).toBe('all')
  })

  test('restores the persisted scope on mount', async () => {
    setup(MIXED)
    showAllProjects()
    await startSession()

    expect(await screen.findByText('There chat')).toBeTruthy()
    expect(scopeButton('All projects').getAttribute('aria-pressed')).toBe('true')
  })

  test('narrowing back to the workspace hides them again', async () => {
    setup(MIXED)
    showAllProjects()
    await startSession()
    await screen.findByText('There chat')

    fireEvent.click(scopeButton('This project'))

    await waitFor(() => expect(screen.queryByText('There chat')).toBeNull())
    expect(screen.getByText('Here chat')).toBeTruthy()
    expect(window.localStorage.getItem('sidebar-scope')).toBe('project')
  })

  // "No sessions yet" is what a fresh install sees. A store with sessions in it,
  // none of them here, is a different thing and must not borrow those words —
  // the same distinction the failed-listing state draws (#60).
  test('a workspace with no sessions says so and offers the way out', async () => {
    setup([{ id: 'b', title: 'There chat', lastUpdated: 2000, cwd: THERE }])
    await startSession()

    expect(await screen.findByText('No sessions in this project yet')).toBeTruthy()
    expect(screen.queryByText('No sessions yet')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Show all projects' }))
    expect(await screen.findByText('There chat')).toBeTruthy()
  })

  // The cap is global and applied AFTER the scope filter, so a scoped rail must
  // not spend its 100 slots on rows it is not showing.
  test('the page cap counts only the sessions in scope', async () => {
    setup([
      ...Array.from({ length: 120 }, (_, i) => ({
        id: `far${i}`,
        title: `far ${i}`,
        lastUpdated: 10_000 - i,
        cwd: THERE
      })),
      { id: 'near', title: 'Near chat', lastUpdated: 1, cwd: HERE }
    ])
    await startSession()

    expect(await screen.findByText('Near chat')).toBeTruthy()
    expect(rows()).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /Show \d+ more/ })).toBeNull()
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
    showAllProjects()
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
    showAllProjects()
    await startSession()
    await screen.findByText('Keep me')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sessions' }))
    expect(screen.queryByRole('separator', { name: 'Resize sidebar' })).toBeNull()
  })
})

// Deleting is the only destructive action in the app, and the only one with no
// undo — the JSONL is the only copy. These pins are on the ARMING MECHANISM
// rather than on what the rail looks like afterwards: every criterion here is
// one a green suite could otherwise satisfy while the guard is gone.
describe('deleting a session (#68)', () => {
  const DOOMED: SessionMeta = { id: 'doomed', title: 'Doomed chat', lastUpdated: 3000, cwd: HERE }
  const KEEPER: SessionMeta = { id: 'keeper', title: 'Keeper chat', lastUpdated: 2000, cwd: HERE }
  const FAR: SessionMeta = { id: 'far', title: 'Far chat', lastUpdated: 1000, cwd: THERE }

  const arm = (title: string): HTMLButtonElement =>
    screen.getByRole('button', { name: `Delete ${title}` }) as HTMLButtonElement
  const confirmBtn = (title: string): HTMLButtonElement =>
    screen.getByRole('button', { name: `Confirm delete ${title}` }) as HTMLButtonElement
  const cancelBtn = (title: string): HTMLButtonElement =>
    screen.getByRole('button', { name: `Cancel delete ${title}` }) as HTMLButtonElement
  const noConfirm = (title: string): boolean =>
    screen.queryByRole('button', { name: `Confirm delete ${title}` }) === null
  const composer = (): HTMLInputElement =>
    screen.getByPlaceholderText('Message Claude…') as HTMLInputElement

  const railWith = async (sessions: SessionMeta[]): Promise<void> => {
    setup(sessions)
    showAllProjects()
    await startSession()
    await screen.findByText(sessions[0].title)
  }

  test('the first click arms the row and destroys nothing', async () => {
    await railWith([DOOMED])

    fireEvent.click(arm('Doomed chat'))

    expect(deleteSession).not.toHaveBeenCalled()
    expect(confirmBtn('Doomed chat')).toBeTruthy()
    expect(cancelBtn('Doomed chat')).toBeTruthy()
  })

  test('the second click commits', async () => {
    await railWith([DOOMED])

    fireEvent.click(arm('Doomed chat'))
    fireEvent.click(confirmBtn('Doomed chat'))

    await waitFor(() => expect(deleteSession).toHaveBeenCalledWith('doomed'))
  })

  // ONE slot, so this cannot be satisfied by remembering to clean up: the first
  // row's confirm is gone from the tree, not merely restyled, and the whole rail
  // holds exactly one confirm at a time.
  test('arming a second row disarms the first', async () => {
    await railWith([DOOMED, KEEPER])

    fireEvent.click(arm('Doomed chat'))
    fireEvent.click(arm('Keeper chat'))

    expect(noConfirm('Doomed chat')).toBe(true)
    expect(screen.getAllByRole('button', { name: /^Confirm delete/ })).toHaveLength(1)
  })

  test('Escape reverts an armed row', async () => {
    await railWith([DOOMED])
    fireEvent.click(arm('Doomed chat'))

    fireEvent.keyDown(confirmBtn('Doomed chat'), { key: 'Escape' })

    expect(noConfirm('Doomed chat')).toBe(true)
  })

  test('focus leaving the row reverts it', async () => {
    await railWith([DOOMED])
    fireEvent.click(arm('Doomed chat'))

    fireEvent.focusOut(confirmBtn('Doomed chat'), { relatedTarget: document.body })

    expect(noConfirm('Doomed chat')).toBe(true)
  })

  // The containment half of the same rule, and the half that breaks first: a
  // bare onBlur disarms on the way to Cancel, making Cancel unreachable by
  // keyboard while looking perfectly fine to a mouse.
  test('moving focus to Cancel — still inside the row — does not revert', async () => {
    await railWith([DOOMED])
    fireEvent.click(arm('Doomed chat'))

    fireEvent.focusOut(confirmBtn('Doomed chat'), {
      relatedTarget: cancelBtn('Doomed chat')
    })

    expect(confirmBtn('Doomed chat')).toBeTruthy()
  })

  test('Cancel reverts without deleting', async () => {
    await railWith([DOOMED])
    fireEvent.click(arm('Doomed chat'))

    fireEvent.click(cancelBtn('Doomed chat'))

    expect(noConfirm('Doomed chat')).toBe(true)
    expect(deleteSession).not.toHaveBeenCalled()
  })

  test('the control is focusable without a pointer ever touching the row', async () => {
    await railWith([DOOMED])

    arm('Doomed chat').focus()

    expect(document.activeElement).toBe(arm('Doomed chat'))
    expect(arm('Doomed chat').disabled).toBe(false)
  })

  // The busy gate is ACTIVE-and-busy, not local-and-busy: the running turn
  // appends to ITS transcript and no other, so a delete there succeeds and is
  // then undone by the next write (probed live against a real store). Every
  // other row — same project or another one — is untouched by that turn.
  // Asserting all three together is what stops this being quietly widened to the
  // row button's own `!foreign && busy`.
  test('only the ACTIVE row refuses deletion mid-turn', async () => {
    await railWith([DOOMED, KEEPER, FAR])
    fireEvent.click(screen.getByText('Doomed chat'))
    await waitFor(() => expect(loadTranscript).toHaveBeenCalledWith('doomed'))

    fireEvent.change(composer(), { target: { value: 'go' } })
    fireEvent.keyDown(composer(), { key: 'Enter' })

    expect(arm('Doomed chat').disabled).toBe(true)
    expect(arm('Keeper chat').disabled).toBe(false)
    expect(arm('Far chat').disabled).toBe(false)
  })

  test('a successful delete re-lists the rail', async () => {
    await railWith([DOOMED])
    const before = listSessions.mock.calls.length

    fireEvent.click(arm('Doomed chat'))
    fireEvent.click(confirmBtn('Doomed chat'))

    await waitFor(() => expect(listSessions.mock.calls.length).toBeGreaterThan(before))
  })

  // A session the store no longer holds answers `ok`, so reaching the failure
  // line means this row's transcript really did survive — and the rail must not
  // pretend otherwise. Nothing is dropped optimistically, which is why the row
  // is still there without a re-list having to put it back.
  test('a failed delete says so and leaves the row where it was', async () => {
    await railWith([DOOMED])
    deleteSession.mockResolvedValue('failed')
    const before = listSessions.mock.calls.length

    fireEvent.click(arm('Doomed chat'))
    fireEvent.click(confirmBtn('Doomed chat'))

    expect(await screen.findByText(/still in the store/)).toBeTruthy()
    expect(screen.getByText('Doomed chat')).toBeTruthy()
    expect(listSessions.mock.calls.length).toBe(before)
  })

  // The failure rides the SAME inline line the workspace switch uses — one
  // status channel for both mutations, no third convention invented here.
  test('the failure lands on the existing inline status line', async () => {
    await railWith([DOOMED])
    deleteSession.mockResolvedValue('failed')

    fireEvent.click(arm('Doomed chat'))
    fireEvent.click(confirmBtn('Doomed chat'))

    const said = await screen.findByText(/still in the store/)
    expect(said.closest('[role="status"]')).toBeTruthy()
  })

  // targetSession(null) is newChat's mechanism, and the reason this is the
  // CORRECT use of a call the standing landmine warns against on switch paths:
  // the resume target now points at a transcript that no longer exists.
  test('deleting the session on screen falls back to a new chat', async () => {
    setup([DOOMED], [{ role: 'user', text: 'replayed question' }])
    await startSession()
    fireEvent.click(await screen.findByText('Doomed chat'))
    expect(await screen.findByText('replayed question')).toBeTruthy()

    fireEvent.click(arm('Doomed chat'))
    fireEvent.click(confirmBtn('Doomed chat'))

    await waitFor(() => expect(targetSession).toHaveBeenCalledWith(null))
    expect(screen.queryByText('replayed question')).toBeNull()
  })

  // The mirror, and the one that catches a fallback fired unconditionally.
  test('deleting another row leaves the open conversation untouched', async () => {
    setup([DOOMED, KEEPER], [{ role: 'user', text: 'replayed question' }])
    await startSession()
    fireEvent.click(await screen.findByText('Doomed chat'))
    expect(await screen.findByText('replayed question')).toBeTruthy()
    targetSession.mockClear()

    fireEvent.click(arm('Keeper chat'))
    fireEvent.click(confirmBtn('Keeper chat'))

    await waitFor(() => expect(deleteSession).toHaveBeenCalledWith('keeper'))
    expect(targetSession).not.toHaveBeenCalledWith(null)
    expect(screen.getByText('replayed question')).toBeTruthy()
  })

  // The row is a single button wrapping title and meta, so a delete control
  // nested inside it would be invalid HTML whose click the parent also receives
  // — opening the very session being deleted. It has to be a sibling.
  test('the delete control is a sibling of the row button, never nested in it', async () => {
    await railWith([DOOMED])

    const rowBtn = rowButton('Doomed chat')
    expect(rowBtn.querySelector('button')).toBeNull()
    expect(rowBtn.parentElement).toBe(arm('Doomed chat').parentElement)
  })
})

// The other half of "reachable by keyboard, not hover alone" — and the half no
// component test can see. jsdom applies no hover rules, so the assertions above
// would pass just as happily against `display: none`, which is exactly the
// keyboard-inaccessible control the spec forbids. The reveal is CSS, so the pin
// has to read the stylesheet, the same way the scrollbar pins do.
describe('the delete control is revealed, never conditionally rendered', () => {
  const css = readFileSync('src/renderer/src/styles/rails.css', 'utf8')

  // The rule that actually reveals it, found by what it DOES rather than by a
  // substring of its selector: `.session-row:focus-within .session-delete` is
  // also a prefix of the :disabled variant further down, so a plain toContain
  // stays green with the real reveal deleted. Splitting on the closing brace is
  // sound here for the same reason the scrollbar pins rely on — no comment in
  // this stylesheet may contain one.
  const revealRule = css
    .split('}')
    .map((rule) => rule.trim())
    .find((rule) => rule.includes('.session-delete') && /opacity:\s*1;/.test(rule))

  const baseRule = /\.session-delete \{([^}]*)\}/.exec(css)?.[1] ?? ''

  test('both hover AND keyboard focus reveal it', () => {
    expect(revealRule).toContain('.session-row:hover .session-delete')
    expect(revealRule).toContain('.session-row:focus-within .session-delete')
  })

  // An armed row has asked a question; its controls cannot vanish because the
  // pointer drifted off the row on the way to answering.
  test('an armed row keeps them visible regardless of the pointer', () => {
    expect(revealRule).toContain('.session-row-armed .session-delete')
  })

  test('hidden means transparent — never display:none or visibility:hidden', () => {
    expect(baseRule).toMatch(/opacity:\s*0;/)
    expect(baseRule).not.toMatch(/display:\s*none/)
    expect(baseRule).not.toMatch(/visibility:\s*hidden/)
  })
})
