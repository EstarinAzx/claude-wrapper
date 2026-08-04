import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'
import { guardedDelete } from '../src/main/delete-guard'
import type { DeleteStatus, SessionMeta } from '../src/shared/session-types'

// #107 — the rail can delete the session a turn is streaming into.
//
// The window is the FIRST turn of a fresh conversation. `activeSessionId` is
// written only at turn-end, so until then the renderer does not know the id it
// is streaming into; the row the rail re-lists is therefore not `active`, its
// `disabled={active && busy}` is false, and the trash button is live.
//
// The delete is refused in MAIN, so these tests put the real guard behind the
// IPC rather than a mock that returns 'failed' on command. A mocked refusal
// would pass with the guard deleted — it would be asserting the harness.

const LIVE: SessionMeta = {
  id: 'live-session',
  title: 'Live chat',
  lastUpdated: 3000,
  cwd: FOLDER
}
const FOREIGN: SessionMeta = {
  id: 'foreign-session',
  title: 'Foreign chat',
  lastUpdated: 2000,
  cwd: FOLDER
}

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
  harness.api.listSessions.mockResolvedValue([LIVE, FOREIGN])
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const arm = (title: string): HTMLButtonElement =>
  screen.getByRole('button', { name: `Delete ${title}` }) as HTMLButtonElement
const confirmBtn = (title: string): HTMLButtonElement =>
  screen.getByRole('button', { name: `Confirm delete ${title}` }) as HTMLButtonElement
const composer = (): HTMLInputElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLInputElement

/** Open the workspace and wait for the rail to carry the live row. */
const openWorkspace = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('Live chat')
}

/** The first prompt of a fresh conversation. Nothing has ended, so the renderer
 *  still holds null while main has had the id since `init`. */
const firstTurn = (): void => {
  fireEvent.change(composer(), { target: { value: 'go' } })
  fireEvent.keyDown(composer(), { key: 'Enter' })
  harness.api.currentSessionId.mockResolvedValue(LIVE.id)
}

/** Wire the IPC to the REAL main-side guard over a scripted engine. */
const mainRunning = (id: string | null, busy: boolean): void => {
  harness.api.deleteSession.mockImplementation(
    (target: string): Promise<DeleteStatus> =>
      guardedDelete(
        {
          isBusy: () => busy,
          runningId: () => id,
          remove: async () => 'ok'
        },
        target
      )
  )
}

const commitDelete = (title: string): void => {
  fireEvent.click(arm(title))
  fireEvent.click(confirmBtn(title))
}

describe('deleting the session a turn is streaming into (#107)', () => {
  // The premise, reproduced rather than inherited: the rail really does offer
  // the control, and the click really does reach the destructive call. This is
  // also AC4 from the other side — the rail's own behaviour is unchanged by the
  // fix, so this assertion reads the same before and after it.
  test('the live session’s trash button is enabled during its first turn', async () => {
    await openWorkspace()
    firstTurn()

    expect(arm('Live chat').disabled).toBe(false)

    commitDelete('Live chat')
    await waitFor(() => expect(harness.api.deleteSession).toHaveBeenCalledWith(LIVE.id))
  })

  // AC2. The trigger is the renderer holding NULL — a test that sets it first
  // re-tests the case the rail already covered.
  test('main refuses it while the renderer’s active id is still null', async () => {
    mainRunning(LIVE.id, true)
    await openWorkspace()
    firstTurn()

    commitDelete('Live chat')

    expect(await screen.findByText(/still in the store/)).toBeTruthy()
    expect(screen.getByText('Live chat')).toBeTruthy()
    expect(harness.api.targetSession).not.toHaveBeenCalledWith(null)
  })

  // The half a blanket refusal would fail: that turn appends to its own
  // transcript and no other, so every other row stays deletable.
  test('a foreign row still deletes during that same turn', async () => {
    mainRunning(LIVE.id, true)
    await openWorkspace()
    firstTurn()

    commitDelete('Foreign chat')

    await waitFor(() =>
      expect(harness.api.deleteSession).toHaveBeenCalledWith(FOREIGN.id)
    )
    expect(screen.queryByText(/still in the store/)).toBeNull()
  })

  // AC3. The renderer's null outlives the turn: `turn-aborted` and `error` clear
  // `busy` without ever reading the id back, so a delete that main now permits
  // still lands on the conversation on screen — and `id === activeSessionId` is
  // false, so the pane was never reset. The app then sits pointed at a
  // transcript it has destroyed.
  test('the pane resets when the deleted id is the one main was running', async () => {
    mainRunning(LIVE.id, false)
    await openWorkspace()
    firstTurn()
    harness.emit({ type: 'text-delta', text: 'half an answer' })
    harness.emit({ type: 'turn-aborted' })
    expect(screen.getByText('half an answer')).toBeTruthy()

    commitDelete('Live chat')

    await waitFor(() => expect(harness.api.targetSession).toHaveBeenCalledWith(null))
    expect(screen.queryByText('half an answer')).toBeNull()
  })

  // The mirror, and the one that catches a reset fired unconditionally.
  test('deleting another row in that same state leaves the pane alone', async () => {
    mainRunning(LIVE.id, false)
    await openWorkspace()
    firstTurn()
    harness.emit({ type: 'text-delta', text: 'half an answer' })
    harness.emit({ type: 'turn-aborted' })

    commitDelete('Foreign chat')

    await waitFor(() =>
      expect(harness.api.deleteSession).toHaveBeenCalledWith(FOREIGN.id)
    )
    expect(harness.api.targetSession).not.toHaveBeenCalledWith(null)
    expect(screen.getByText('half an answer')).toBeTruthy()
  })
})
