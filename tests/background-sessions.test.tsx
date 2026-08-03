import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'
import { listBackgroundSessions, parseAgentView } from '../src/main/agent-view'
import type { SessionMeta } from '../src/shared/session-types'
import type { BackgroundSession } from '../src/shared/background-session-types'

// #91 — LIVE BACKGROUND SESSIONS in the sessions rail.
//
// Which "agent" this is, since the word carries three meanings in this repo
// (`.context/flows.md` has the collision table): the CLI's own **agent view**,
// listing whole background Claude Code SESSIONS. Not this app's Agents dock
// (subagents inside the one open session, `agents-dock.test.tsx`) and not
// `background-tasks.ts` (jobs inside the one open session).

// ── the row shapes, exactly as #90 measured them off a real machine ────────
// Background rows carry `id`, `state` and (sometimes) `pid`/`status`.
// Interactive rows carry NO `id` and NO `state` — and the app's own session is
// one of them, which is the whole reason the `kind` filter exists.
const backgroundRow = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  kind: 'background',
  id: 'abcd1234',
  sessionId: 'abcd1234-0000-4000-8000-000000000001',
  name: 'nightly docs sweep',
  state: 'working',
  startedAt: 1_700_000_000_000,
  cwd: FOLDER,
  ...over
})

// The app's own window, as it really appears (#90 ran a live query() at
// engine.ts's options and watched this row show up).
const ownInteractiveRow = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  kind: 'interactive',
  sessionId: 'self-session-id',
  name: 'claude-wrapper',
  pid: 4242,
  status: 'busy',
  startedAt: 1_700_000_100_000,
  cwd: FOLDER,
  ...over
})

describe('agent view — parsing the CLI listing', () => {
  test('the app’s OWN session is dropped, and the background rows are not', () => {
    // Non-vacuous by construction: the input carries the interactive row AND two
    // background rows, so "the interactive one is absent" cannot pass by the
    // list simply being empty. Mutation check for this assertion: delete the
    // `kind === 'background'` guard in agent-view.ts and this test reds on the
    // length AND on the id.
    const rows = parseAgentView(
      JSON.stringify([
        backgroundRow({ sessionId: 'bg-1' }),
        ownInteractiveRow(),
        backgroundRow({ sessionId: 'bg-2' })
      ])
    )
    expect(rows?.map((r) => r.sessionId)).toEqual(['bg-1', 'bg-2'])
    expect(rows?.some((r) => r.sessionId === 'self-session-id')).toBe(false)
  })

  test('rows are keyed on sessionId, never the 8-char `id`', () => {
    const rows = parseAgentView(
      JSON.stringify([backgroundRow({ id: 'abcd1234', sessionId: 'the-full-uuid' })])
    )
    expect(rows).toEqual([
      {
        sessionId: 'the-full-uuid',
        name: 'nightly docs sweep',
        state: 'working',
        startedAt: 1_700_000_000_000
      }
    ])
  })

  test('a row with no sessionId is skipped — there is no other universal key', () => {
    const rows = parseAgentView(
      JSON.stringify([backgroundRow({ sessionId: undefined }), backgroundRow({ sessionId: 'ok' })])
    )
    expect(rows?.map((r) => r.sessionId)).toEqual(['ok'])
  })

  test('`state` passes through raw, including a value nobody predicted', () => {
    // The set is OPEN (#90 measured four where three were predicted). An
    // allow-list would drop this row's state silently.
    const rows = parseAgentView(
      JSON.stringify([backgroundRow({ state: 'quarantined-pending-review' })])
    )
    expect(rows?.[0]?.state).toBe('quarantined-pending-review')
  })

  test('unusable optional fields are ABSENT, never zeroed or emptied', () => {
    const rows = parseAgentView(
      JSON.stringify([
        backgroundRow({ name: '', state: undefined, startedAt: 'not-a-number' })
      ])
    )
    expect(rows?.[0]).toEqual({ sessionId: 'abcd1234-0000-4000-8000-000000000001' })
    expect('name' in (rows?.[0] ?? {})).toBe(false)
    expect('state' in (rows?.[0] ?? {})).toBe(false)
    expect('startedAt' in (rows?.[0] ?? {})).toBe(false)
  })

  test('a listing with nothing running is [], not null — that is a real answer', () => {
    expect(parseAgentView('[]')).toEqual([])
  })

  test('unparseable output and a non-array shape are both a FAILED look', () => {
    expect(parseAgentView('not json at all')).toBeNull()
    expect(parseAgentView('{"rows":[]}')).toBeNull()
  })

  test('garbage entries inside a good array are skipped, not fatal', () => {
    const rows = parseAgentView(JSON.stringify([null, 7, 'x', backgroundRow({ sessionId: 'bg' })]))
    expect(rows?.map((r) => r.sessionId)).toEqual(['bg'])
  })
})

describe('agent view — scoping and failure', () => {
  test('the open workspace is what gets scoped, and it reaches the CLI', async () => {
    const run = vi.fn().mockResolvedValue(JSON.stringify([backgroundRow({ sessionId: 'bg' })]))
    const rows = await listBackgroundSessions('D:\\work\\thing', run)
    expect(run).toHaveBeenCalledWith('D:\\work\\thing')
    expect(rows?.map((r) => r.sessionId)).toEqual(['bg'])
  })

  test('no open workspace is [] — no directory to scope to, and no process spawned', async () => {
    const run = vi.fn()
    expect(await listBackgroundSessions(null, run)).toEqual([])
    expect(run).not.toHaveBeenCalled()
  })

  test('a failed look is null, distinct from an empty workspace', async () => {
    expect(await listBackgroundSessions(FOLDER, async () => null)).toBeNull()
    expect(await listBackgroundSessions(FOLDER, async () => '[]')).toEqual([])
  })
})

// ── the rail section ──────────────────────────────────────────────────────

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  window.localStorage.clear()
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const bg = (over: Partial<BackgroundSession> = {}): BackgroundSession => ({
  sessionId: 'bg-1',
  name: 'nightly docs sweep',
  state: 'working',
  startedAt: 1_700_000_000_000,
  ...over
})

const sess = (id: string, title: string): SessionMeta => ({
  id,
  title,
  lastUpdated: 3000,
  cwd: FOLDER
})

const start = async (sessions: SessionMeta[] = []): Promise<void> => {
  harness.api.listSessions.mockResolvedValue(sessions)
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const section = (): HTMLElement => screen.getByRole('region', { name: 'Background sessions' })

describe('sessions rail — the background-sessions section', () => {
  test('it is its own labelled section, distinct from the stored transcripts', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([bg()])
    await start([sess('s1', 'a stored transcript')])
    await screen.findByText('nightly docs sweep')

    const panel = section()
    expect(within(panel).getByText('Background sessions')).toBeTruthy()
    // The stored list is NOT inside it — that separation is the feature.
    expect(within(panel).queryByText('a stored transcript')).toBeNull()
    expect(screen.getByText('a stored transcript')).toBeTruthy()
  })

  test('it sits ABOVE the stored-transcript groups in the rail', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([bg()])
    await start([sess('s1', 'a stored transcript')])
    await screen.findByText('nightly docs sweep')

    const groups = document.querySelector('.session-groups')
    expect(groups).toBeTruthy()
    // DOCUMENT_POSITION_FOLLOWING: the groups come after the section.
    expect(section().compareDocumentPosition(groups as Node) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy()
  })

  test('a row shows its name and its raw state', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([
      bg({ sessionId: 'bg-1', name: 'nightly docs sweep', state: 'blocked' }),
      bg({ sessionId: 'bg-2', name: 'flake hunt', state: 'a-state-nobody-predicted' })
    ])
    await start()
    await screen.findByText('nightly docs sweep')

    const panel = section()
    expect(within(panel).getByText('blocked')).toBeTruthy()
    expect(within(panel).getByText('a-state-nobody-predicted')).toBeTruthy()
  })

  test('a nameless row falls back to its sessionId rather than rendering blank', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([
      { sessionId: 'bg-no-name' } as BackgroundSession
    ])
    await start()
    expect(await within(section()).findByText('bg-no-name')).toBeTruthy()
  })

  test('an empty list after a look is an honest answer, not an error', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([])
    await start()
    expect(await within(section()).findByText('None running here')).toBeTruthy()
    expect(within(section()).queryByText(/Could not list/)).toBeNull()
  })

  test('a FAILED look says so, and does not borrow the empty state’s words', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue(null)
    await start()
    expect(await within(section()).findByText('Could not list background sessions.')).toBeTruthy()
    expect(within(section()).queryByText('None running here')).toBeNull()
  })

  test('rows are keyed on sessionId — two rows sharing a name both render', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([
      bg({ sessionId: 'bg-1', name: 'same name' }),
      bg({ sessionId: 'bg-2', name: 'same name' })
    ])
    await start()
    await screen.findAllByText('same name')
    expect(within(section()).getAllByText('same name')).toHaveLength(2)
  })

  test('the rows are read-only — no attach, no peek, nothing to click', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([bg()])
    await start()
    await screen.findByText('nightly docs sweep')
    // Exactly one control in the whole section: its own refresh. Anything else
    // here would be a tab stop added to a rail that already carries ~100.
    const buttons = within(section()).getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]?.getAttribute('aria-label')).toBe('Refresh background sessions')
  })
})

describe('sessions rail — the background section refreshes ONLY on demand', () => {
  const refreshBtn = (): HTMLElement =>
    screen.getByRole('button', { name: 'Refresh background sessions' })

  test('the refresh control re-runs the look', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([])
    await start()
    await within(section()).findByText('None running here')

    const before = harness.api.listBackgroundSessions.mock.calls.length
    harness.api.listBackgroundSessions.mockResolvedValue([bg({ name: 'appeared since' })])
    fireEvent.click(refreshBtn())
    expect(await screen.findByText('appeared since')).toBeTruthy()
    expect(harness.api.listBackgroundSessions.mock.calls.length).toBe(before + 1)
  })

  test('window focus re-lists STORED sessions but never re-runs the CLI look', async () => {
    // Non-vacuous: the same event is shown to still drive `listSessions`, so a
    // silent count here cannot be "the event never fired".
    harness.api.listBackgroundSessions.mockResolvedValue([])
    await start()
    await within(section()).findByText('None running here')

    const stored = harness.api.listSessions.mock.calls.length
    const looks = harness.api.listBackgroundSessions.mock.calls.length
    fireEvent.focus(window)
    expect(harness.api.listSessions.mock.calls.length).toBeGreaterThan(stored)
    expect(harness.api.listBackgroundSessions.mock.calls.length).toBe(looks)
  })

  test('NOTHING repopulates it on a timer', async () => {
    // #90: one CLI process per look, ~893ms median, and the staleness window
    // equals the poll interval — so a self-refreshing list would be both a
    // steady ~19% of a core at 5s and routinely wrong about being live.
    //
    // Two minutes of virtual time covers every interval anyone would reach for.
    // The counter is then shown to be capable of moving (the click below), so a
    // zero above is a measurement rather than a broken spy.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      harness.api.listBackgroundSessions.mockResolvedValue([])
      await start()
      await within(section()).findByText('None running here')

      const settled = harness.api.listBackgroundSessions.mock.calls.length
      await vi.advanceTimersByTimeAsync(120_000)
      expect(harness.api.listBackgroundSessions.mock.calls.length).toBe(settled)

      fireEvent.click(refreshBtn())
      expect(harness.api.listBackgroundSessions.mock.calls.length).toBe(settled + 1)
    } finally {
      vi.useRealTimers()
    }
  })

  test('a second click cannot start a second CLI process while one is in flight', async () => {
    let settle: (v: BackgroundSession[]) => void = () => {}
    harness.api.listBackgroundSessions.mockReturnValue(
      new Promise<BackgroundSession[]>((res) => {
        settle = res
      })
    )
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
    await screen.findByText('demo')

    expect(refreshBtn()).toHaveProperty('disabled', true)
    const inFlight = harness.api.listBackgroundSessions.mock.calls.length
    fireEvent.click(refreshBtn())
    expect(harness.api.listBackgroundSessions.mock.calls.length).toBe(inFlight)
    settle([])
  })
})

describe('sessions rail — the background section adds no titlebar control', () => {
  test('the titlebar control count is unchanged', async () => {
    // #91 criterion 7, and #86's standing rule: no new feature adds a titlebar
    // control. Pinned as an exact count so an added one reds here rather than
    // being argued about later. The number is main's, captured before this
    // ticket touched anything.
    harness.api.listBackgroundSessions.mockResolvedValue([bg()])
    await start([sess('s1', 'stored')])
    await screen.findByText('nightly docs sweep')

    const titlebar = document.querySelector('.titlebar')
    expect(titlebar).toBeTruthy()
    expect(titlebar?.querySelectorAll('button').length).toBe(TITLEBAR_CONTROLS)
  })

  test('no titlebar control mentions background sessions', async () => {
    harness.api.listBackgroundSessions.mockResolvedValue([bg()])
    await start()
    await screen.findByText('nightly docs sweep')
    const labels = [...(document.querySelector('.titlebar')?.querySelectorAll('button') ?? [])].map(
      (b) => b.getAttribute('aria-label') ?? b.textContent ?? ''
    )
    expect(labels.some((l) => /background/i.test(l))).toBe(false)
  })
})

// Captured on `main` at 31554a6, before this ticket added anything, and
// re-measured there with this file's work stashed. Eight: Permission mode,
// Backend mode, Commands panel, Appearance panel, Agents panel, Minimize,
// Maximize, Close.
const TITLEBAR_CONTROLS = 8
