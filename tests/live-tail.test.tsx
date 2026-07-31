import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'
import type { SessionMeta } from '../src/shared/session-types'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
})

const meta = (id: string, title: string): SessionMeta => ({
  id,
  title,
  lastUpdated: 1000,
  cwd: FOLDER
})

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const input = (): HTMLInputElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLInputElement

// Open a session from the rail with one message already in it.
const openWithFirstLine = async (): Promise<void> => {
  harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
  harness.api.loadTranscript.mockResolvedValue([{ role: 'user', text: 'first line' }])
  await startSession()
  fireEvent.click(await screen.findByText('My chat'))
  expect(await screen.findByText('first line')).toBeTruthy()
}

describe('live-tail — the open transcript follows the file (#57)', () => {
  test('a change signal for the adopted session re-reads it into the pane', async () => {
    await openWithFirstLine()

    harness.api.loadTranscript.mockResolvedValue([
      { role: 'user', text: 'first line' },
      { role: 'assistant', text: 'appended by the terminal' }
    ])
    harness.emitSessionChanged('sess-1')

    expect(await screen.findByText('appended by the terminal')).toBeTruthy()
    expect(screen.getByText('first line')).toBeTruthy()
  })

  test('a signal for a DIFFERENT session never re-reads', async () => {
    await openWithFirstLine()
    const before = harness.api.loadTranscript.mock.calls.length

    harness.emitSessionChanged('some-other-session')

    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBe(before)
    })
  })

  test('a signal while BUSY causes no reload', async () => {
    await openWithFirstLine()
    fireEvent.change(input(), { target: { value: 'my own turn' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    const before = harness.api.loadTranscript.mock.calls.length

    harness.emitSessionChanged('sess-1')

    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBe(before)
    })
  })

  test('a signal AFTER SEND causes no reload, even once the turn ends', async () => {
    await openWithFirstLine()
    fireEvent.change(input(), { target: { value: 'my own turn' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    harness.emit({ type: 'turn-end' })
    const before = harness.api.loadTranscript.mock.calls.length

    harness.emitSessionChanged('sess-1')

    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBe(before)
    })
    // The user's own message is still on screen — a reload would have wiped it,
    // since the fixture transcript does not contain it.
    expect(screen.getByText('my own turn')).toBeTruthy()
  })

  test('an EMPTY reload result keeps the pane', async () => {
    await openWithFirstLine()

    harness.api.loadTranscript.mockResolvedValue([])
    harness.emitSessionChanged('sess-1')

    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBeGreaterThan(1)
    })
    expect(screen.getByText('first line')).toBeTruthy()
  })

  // Cross-feature edge with #68. Deleting the session you are looking at hands
  // the pane to a new chat, and that fallback must also END the tail — otherwise
  // the watch stays armed on a file that has just been unlinked, and the
  // deletion's own filesystem event arrives as a change signal for a session
  // that no longer exists.
  //
  // Asserted as "no reload at all", which is the actual guard: eligibility is
  // dropped before the delete's event can land. The weaker fallback — a reload
  // that does happen, reads empty, and is skipped rather than clearing the pane
  // — is the 'an EMPTY reload result keeps the pane' pin directly above.
  test('deleting the watched session stops the watch, so a late signal is inert', async () => {
    await openWithFirstLine()
    fireEvent.click(screen.getByRole('button', { name: 'Delete My chat' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete My chat' }))
    await waitFor(() => {
      expect(harness.api.watchSession).toHaveBeenLastCalledWith(null)
    })
    const before = harness.api.loadTranscript.mock.calls.length

    harness.emitSessionChanged('sess-1')

    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBe(before)
    })
  })

  test('adopting a session asks main to watch it', async () => {
    await openWithFirstLine()
    expect(harness.api.watchSession).toHaveBeenLastCalledWith('sess-1')
  })

  test('sending stops the watch', async () => {
    await openWithFirstLine()
    fireEvent.change(input(), { target: { value: 'taking over' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(harness.api.watchSession).toHaveBeenLastCalledWith(null)
  })

  test('New chat stops the watch', async () => {
    await openWithFirstLine()
    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))
    expect(harness.api.watchSession).toHaveBeenLastCalledWith(null)
  })

  test('a signal for the NEW session is not dropped by an in-flight reload of the old one', async () => {
    harness.api.listSessions.mockResolvedValue([
      meta('sess-1', 'My chat'),
      meta('sess-2', 'Other chat')
    ])
    harness.api.loadTranscript.mockResolvedValue([{ role: 'user', text: 'first line' }])
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    expect(await screen.findByText('first line')).toBeTruthy()

    // A reload of sess-1 is in flight...
    let releaseOld!: (v: Array<{ role: 'user'; text: string }>) => void
    harness.api.loadTranscript.mockReturnValueOnce(
      new Promise((resolve) => {
        releaseOld = resolve
      })
    )
    harness.emitSessionChanged('sess-1')

    // ...while the user switches to sess-2, whose file then changes. That signal
    // arrives with the old reload still running, so it can only be honoured by
    // the trailing re-run.
    harness.api.loadTranscript.mockResolvedValue([{ role: 'user', text: 'other chat line' }])
    fireEvent.click(screen.getByText('Other chat'))
    expect(await screen.findByText('other chat line')).toBeTruthy()

    harness.api.loadTranscript.mockResolvedValue([
      { role: 'user', text: 'other chat line' },
      { role: 'assistant', text: 'appended to the new session' }
    ])
    harness.emitSessionChanged('sess-2')
    releaseOld([{ role: 'user', text: 'first line' }])

    // No further signal arrives — if the queued re-run were dropped, this write
    // would stay invisible until the next one, which is the whole bug.
    expect(await screen.findByText('appended to the new session')).toBeTruthy()
  })

  test('a transient empty read cannot wipe a transcript applied moments earlier', async () => {
    // Pane starts empty, so "was the pane non-empty?" must be answered against
    // what this loop already applied, not against rendered state — the passive
    // effect that syncs rendered state has not run between two loop iterations.
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue([])
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    // The pane stays empty, so wait on the watch request rather than on content.
    await waitFor(() => {
      expect(harness.api.watchSession).toHaveBeenCalledWith('sess-1')
    })

    let releaseFirst!: (v: Array<{ role: 'assistant'; text: string }>) => void
    harness.api.loadTranscript.mockReturnValueOnce(
      new Promise((resolve) => {
        releaseFirst = resolve
      })
    )
    harness.emitSessionChanged('sess-1')
    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBeGreaterThan(1)
    })

    // A second signal queues a trailing re-run whose read comes back empty.
    harness.emitSessionChanged('sess-1')
    harness.api.loadTranscript.mockResolvedValue([])
    releaseFirst([{ role: 'assistant', text: 'the only line' }])

    expect(await screen.findByText('the only line')).toBeTruthy()
    // Let the trailing re-run land, then assert it did not blank the pane.
    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBeGreaterThan(2)
    })
    expect(screen.getByText('the only line')).toBeTruthy()
  })

  test('a send DURING a reload discards that reload', async () => {
    await openWithFirstLine()

    // Signal while idle and eligible: the reload starts legitimately.
    let release!: (v: Array<{ role: 'user'; text: string }>) => void
    harness.api.loadTranscript.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve
      })
    )
    harness.emitSessionChanged('sess-1')
    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBeGreaterThan(1)
    })

    // The user takes over mid-read. The in-flight result is now stale: applying
    // it would wipe the message they just sent.
    fireEvent.change(input(), { target: { value: 'taking over mid-reload' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    release([{ role: 'user', text: 'first line' }])

    await waitFor(() => {
      expect(screen.getByText('taking over mid-reload')).toBeTruthy()
    })
  })

  test('a signal landing mid-reload re-runs exactly once more', async () => {
    await openWithFirstLine()
    const before = harness.api.loadTranscript.mock.calls.length

    // Hold the first reload open; fire two more signals while it is in flight.
    let release!: (v: Array<{ role: 'user'; text: string }>) => void
    harness.api.loadTranscript.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve
      })
    )
    harness.emitSessionChanged('sess-1')
    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBe(before + 1)
    })

    harness.emitSessionChanged('sess-1')
    harness.emitSessionChanged('sess-1')
    // Still exactly one read in flight — the signals coalesced into ONE trailing
    // re-run rather than stacking a read per signal.
    expect(harness.api.loadTranscript.mock.calls.length).toBe(before + 1)

    harness.api.loadTranscript.mockResolvedValue([
      { role: 'user', text: 'first line' },
      { role: 'assistant', text: 'the last write before quiet' }
    ])
    release([{ role: 'user', text: 'first line' }])

    expect(await screen.findByText('the last write before quiet')).toBeTruthy()
    expect(harness.api.loadTranscript.mock.calls.length).toBe(before + 2)
  })
})
