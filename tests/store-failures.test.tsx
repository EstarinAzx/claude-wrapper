import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'
import type { SessionMeta } from '../src/shared/session-types'

// #60 — the store's three silent failures, from the renderer's side.
//
// A throwing list, an unenumerable store and an unreadable transcript all used
// to arrive as `[]`, so the rail said "No sessions yet" and the pane showed an
// empty conversation. Both are innocent-looking dead ends: nothing tells the
// user something broke, and there is nothing to press. These tests pin the two
// halves of the distinction — the failure renders differently AND offers a way
// back, while genuine absence keeps the quiet empty state it has always had.

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

const retryListing = (): HTMLElement =>
  screen.getByRole('button', { name: 'Retry loading sessions' })

const retryTranscript = (): HTMLElement =>
  screen.getByRole('button', { name: 'Retry loading this conversation' })

describe('the sessions rail distinguishes a failed listing from an empty store', () => {
  test('a failed listing says so instead of "No sessions yet"', async () => {
    harness.api.listSessions.mockResolvedValue(null)
    await startSession()

    expect(await screen.findByText('Could not load sessions.')).toBeTruthy()
    expect(screen.queryByText('No sessions yet')).toBeNull()
  })

  test('a failed listing offers a retry that re-lists', async () => {
    harness.api.listSessions.mockResolvedValue(null)
    await startSession()
    await screen.findByText('Could not load sessions.')

    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    fireEvent.click(retryListing())

    expect(await screen.findByText('My chat')).toBeTruthy()
    expect(screen.queryByText('Could not load sessions.')).toBeNull()
  })

  // The other half: absence must stay quiet. A retry affordance on an empty
  // store would invite the user to keep pressing a button that can only ever
  // report the same nothing.
  test('an empty store keeps the quiet empty state, with nothing to retry', async () => {
    harness.api.listSessions.mockResolvedValue([])
    await startSession()

    expect(await screen.findByText('No sessions yet')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Retry loading sessions' })).toBeNull()
  })
})

describe('the chat pane distinguishes an unreadable transcript from an empty one', () => {
  test('a transcript that could not be read says so', async () => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue(null)
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))

    expect(await screen.findByText('Could not read this conversation.')).toBeTruthy()
  })

  test('an unreadable transcript offers a retry that re-reads it', async () => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue(null)
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    await screen.findByText('Could not read this conversation.')

    harness.api.loadTranscript.mockResolvedValue([{ role: 'user', text: 'it came back' }])
    fireEvent.click(retryTranscript())

    expect(await screen.findByText('it came back')).toBeTruthy()
    expect(screen.queryByText('Could not read this conversation.')).toBeNull()
  })

  // A session that legitimately holds no messages is the state every brand-new
  // session is in. It must not read as broken.
  test('a session with no messages stays a plain empty pane', async () => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue([])
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))

    await waitFor(() => {
      expect(harness.api.watchSession).toHaveBeenCalledWith('sess-1')
    })
    expect(screen.queryByText('Could not read this conversation.')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Retry loading this conversation' })).toBeNull()
  })

  // Starting a fresh conversation is not a failed read — the notice must not
  // survive the action that clears the pane.
  test('New chat clears a standing read failure', async () => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue(null)
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    await screen.findByText('Could not read this conversation.')

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))

    expect(screen.queryByText('Could not read this conversation.')).toBeNull()
  })
})

describe('live-tail survives a transient read failure', () => {
  const openWithFirstLine = async (): Promise<void> => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue([{ role: 'user', text: 'first line' }])
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    expect(await screen.findByText('first line')).toBeTruthy()
  }

  test('a failed reload keeps the pane and raises no notice', async () => {
    await openWithFirstLine()

    harness.api.loadTranscript.mockResolvedValue(null)
    harness.emitSessionChanged('sess-1')

    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBeGreaterThan(1)
    })
    // The pane is what the last GOOD read put there. A tail is a background
    // re-read of something already on screen, so a failure has nothing to
    // report — it just declines to overwrite.
    expect(screen.getByText('first line')).toBeTruthy()
    expect(screen.queryByText('Could not read this conversation.')).toBeNull()
  })

  // The assertion above cannot tell a DECLINED failure from a THROWN one: both
  // leave the pane alone. This one can. A failure has to be a value the reload
  // loop steps over, so the trailing re-run queued behind it still runs — an
  // exception unwinds past that re-run and the queued write is lost forever,
  // which is the same "held stale until the next write" bug live-tail exists to
  // fix. `null.length` is exactly that exception.
  // Adoption arms the watch even when the read failed, so the file coming back
  // reaches the pane on its own. The notice has to come down with it — a
  // standing "could not read this conversation" over the conversation it is
  // talking about is worse than the empty pane this ticket replaced.
  test('a tail read that succeeds after a failed adopt clears the notice', async () => {
    harness.api.listSessions.mockResolvedValue([meta('sess-1', 'My chat')])
    harness.api.loadTranscript.mockResolvedValue(null)
    await startSession()
    fireEvent.click(await screen.findByText('My chat'))
    await screen.findByText('Could not read this conversation.')

    harness.api.loadTranscript.mockResolvedValue([{ role: 'user', text: 'readable again' }])
    harness.emitSessionChanged('sess-1')

    expect(await screen.findByText('readable again')).toBeTruthy()
    expect(screen.queryByText('Could not read this conversation.')).toBeNull()
  })

  test('a failed read does not swallow the re-run queued behind it', async () => {
    await openWithFirstLine()

    let failFirst!: (v: null) => void
    harness.api.loadTranscript.mockReturnValueOnce(
      new Promise((resolve) => {
        failFirst = resolve
      })
    )
    harness.emitSessionChanged('sess-1')
    await waitFor(() => {
      expect(harness.api.loadTranscript.mock.calls.length).toBeGreaterThan(1)
    })

    // A second signal lands while the doomed read is still in flight, and the
    // store recovers before it is served.
    harness.emitSessionChanged('sess-1')
    harness.api.loadTranscript.mockResolvedValue([
      { role: 'user', text: 'first line' },
      { role: 'assistant', text: 'landed after the failure' }
    ])
    failFirst(null)

    expect(await screen.findByText('landed after the failure')).toBeTruthy()
    expect(screen.getByText('first line')).toBeTruthy()
  })
})
