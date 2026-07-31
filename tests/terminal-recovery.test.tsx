import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'

// #73 — the way out of a terminal stream death.
//
// The engine goes terminal when the CLI dies under it, and that stays: the ADR
// chose a legible error over a silent restart. What it ALSO endorsed — "pick
// the folder again" — passed `resumeId: null`, so the endorsed recovery started
// a fresh SDK session and emptied the pane: the exact consequence the ADR
// invoked as its reason for rejecting auto-restart.
//
// So the assertions here are on the MECHANISM, never on the outcome. A control
// that rebuilds the engine and shows an empty pane looks identical, in a
// result-only test, to one that resumes a conversation that happened to be
// empty. What separates them is the ARGUMENT: `resumeId` is the dead session's
// id rather than null. The transaction's own order and rejection-emptiness are
// already pinned by switch-workspace.test.ts (#47) and are not re-derived here.

const DEAD_SESSION = 'dead-session-id'

// The three shipped messages, verbatim. Two are per-turn and already recoverable
// by sending another prompt; one is terminal. They are INDISTINGUISHABLE as
// text to the renderer, which is the whole reason the signal exists.
const STREAM_ENDED = 'Claude session ended unexpectedly. Pick the folder again to restart.'
const TURN_FAILED = 'Claude hit an error during this turn. Send a new prompt to try again.'
const MAX_TURNS = 'Claude stopped early: maximum turns reached. Send a new prompt to continue.'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
  harness.api.loadTranscript.mockImplementation(async (id: string) => [
    { role: 'user' as const, text: `restored transcript of ${id}` }
  ])
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const openWorkspace = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByPlaceholderText('Message Claude…')
}

/** Run a turn to completion so the renderer holds a resumable session id. */
const runATurn = async (id: string = DEAD_SESSION): Promise<void> => {
  harness.api.currentSessionId.mockResolvedValue(id)
  harness.emit({ type: 'text-delta', text: 'hello from the model' })
  harness.emit({ type: 'turn-end' })
  await waitFor(() => expect(harness.api.currentSessionId).toHaveBeenCalled())
}

/** The CLI dying: the error text reaches the pane, the signal reaches the app. */
const killTheStream = (message: string = STREAM_ENDED): void => {
  harness.emit({ type: 'error', message })
  harness.emitTerminal()
}

const restartControl = (): HTMLButtonElement | null =>
  document.querySelector('.switch-refusal-retry--restart')

describe('#73 — the control appears only on a terminal death', () => {
  // The direction that matters most: a per-turn error is ALREADY recoverable by
  // sending another prompt, so a control that tears the engine down here would
  // throw away a conversation that was never in danger.
  test('a per-turn error (error_during_execution) shows NO restart control', async () => {
    await openWorkspace()
    await runATurn()
    harness.emit({ type: 'error', message: TURN_FAILED })
    await screen.findByText(TURN_FAILED)
    expect(restartControl()).toBeNull()
  })

  test('a per-turn error (max turns) shows NO restart control', async () => {
    await openWorkspace()
    await runATurn()
    harness.emit({ type: 'error', message: MAX_TURNS })
    await screen.findByText(MAX_TURNS)
    expect(restartControl()).toBeNull()
  })

  // The same error TEXT with no signal behind it still shows nothing — which is
  // what proves the control is driven by the out-of-band signal and not by
  // string-matching the message. A renderer that sniffed the copy would pass
  // every other test in this file and break the moment the wording changed.
  test('the terminal MESSAGE alone, with no signal, shows no control', async () => {
    await openWorkspace()
    await runATurn()
    harness.emit({ type: 'error', message: STREAM_ENDED })
    await screen.findByText(STREAM_ENDED)
    expect(restartControl()).toBeNull()
  })

  test('a terminal death shows the restart control', async () => {
    await openWorkspace()
    await runATurn()
    killTheStream()
    await waitFor(() => expect(restartControl()).not.toBeNull())
    expect(
      screen.getByRole('button', { name: 'Restart and resume this conversation' })
    ).toBeTruthy()
  })

  test('no control before anything goes wrong', async () => {
    await openWorkspace()
    await runATurn()
    expect(restartControl()).toBeNull()
  })
})

describe('#73 — activation resumes rather than discards', () => {
  // THE pin for this ticket. `chooseWorkspace` passed a hardcoded null here and
  // that single argument is the entire defect: everything else about the
  // transaction was already right, and a result-only assertion ("the switch
  // ran") passes with the bug in place.
  test('activation calls switchWorkspace with the DEAD SESSION id, not null', async () => {
    await openWorkspace()
    await runATurn()
    killTheStream()
    await waitFor(() => expect(restartControl()).not.toBeNull())

    fireEvent.click(restartControl() as HTMLButtonElement)

    await waitFor(() => expect(harness.api.switchWorkspace).toHaveBeenCalled())
    expect(harness.api.switchWorkspace).toHaveBeenCalledWith({
      cwd: FOLDER,
      resumeId: DEAD_SESSION
    })
  })

  // AC3 asks for BOTH halves, because either alone is satisfiable by a broken
  // implementation: a pane refilled from disk beside an engine pointed at a new
  // session, or an engine correctly resumed beside a pane that was never
  // refilled. So: the conversation is back on screen, AND the app will take the
  // next prompt.
  test('one activation restores the conversation AND leaves the app able to continue', async () => {
    await openWorkspace()
    await runATurn()
    killTheStream()
    await waitFor(() => expect(restartControl()).not.toBeNull())

    fireEvent.click(restartControl() as HTMLButtonElement)

    // Half one: the pane holds the dead session's conversation again.
    await screen.findByText(`restored transcript of ${DEAD_SESSION}`)
    // Half two: the app takes another turn — the control is gone and a send
    // actually reaches main rather than being swallowed by a stuck busy flag.
    await waitFor(() => expect(restartControl()).toBeNull())
    const composer = screen.getByPlaceholderText('Message Claude…')
    fireEvent.change(composer, { target: { value: 'carry on then' } })
    fireEvent.keyDown(composer, { key: 'Enter' })
    await waitFor(() => expect(harness.prompts.length).toBe(1))
    expect(harness.prompts[0].text).toBe('carry on then')
  })

  // A refused switch changes nothing, so the engine is still dead and the way
  // out must still be on screen. The opposite — clearing the control on a
  // refusal — leaves the user in a terminal state with no affordance at all.
  test('a refused switch leaves the control up', async () => {
    await openWorkspace()
    await runATurn()
    killTheStream()
    await waitFor(() => expect(restartControl()).not.toBeNull())
    harness.api.switchWorkspace.mockResolvedValue({ status: 'busy' })

    fireEvent.click(restartControl() as HTMLButtonElement)

    await screen.findByText('Finish or stop the current turn before switching project.')
    expect(restartControl()).not.toBeNull()
  })
})

describe('#73 — the id comes from MAIN, not from the last turn-end', () => {
  // The trap this exists for: `activeSessionId` is only written at turn-end, so
  // a stream dying MID first turn leaves it null in the renderer while main has
  // held the id since `init`. Trusting the local null offers "nothing to
  // resume" for a conversation that resumes perfectly — the #54 fallback firing
  // on a case it is not for. Nothing else in this file catches it: every other
  // test runs a turn to completion first.
  test('a death mid first-turn still offers to resume, using main’s id', async () => {
    await openWorkspace()
    // No turn-end: the renderer never learned an id of its own.
    harness.api.currentSessionId.mockResolvedValue('id-main-held-all-along')
    harness.emit({ type: 'text-delta', text: 'half an ans' })
    killTheStream()

    await waitFor(() => expect(restartControl()).not.toBeNull())
    expect(
      screen.getByRole('button', { name: 'Restart and resume this conversation' })
    ).toBeTruthy()

    fireEvent.click(restartControl() as HTMLButtonElement)
    await waitFor(() => expect(harness.api.switchWorkspace).toHaveBeenCalled())
    expect(harness.api.switchWorkspace).toHaveBeenCalledWith({
      cwd: FOLDER,
      resumeId: 'id-main-held-all-along'
    })
  })

  // AC4 — #54: an id is only resumable once a turn has run, so main honestly
  // reports null here. The control must SAY the conversation is gone rather
  // than offer a resume that would silently do nothing.
  test('with no resumable session, the copy is honest and the restart is fresh', async () => {
    await openWorkspace()
    harness.api.currentSessionId.mockResolvedValue(null)
    killTheStream()

    await waitFor(() => expect(restartControl()).not.toBeNull())
    await screen.findByText(/cannot be resumed/)
    expect(screen.getByRole('button', { name: 'Start a fresh session' })).toBeTruthy()

    fireEvent.click(restartControl() as HTMLButtonElement)
    await waitFor(() => expect(harness.api.switchWorkspace).toHaveBeenCalled())
    expect(harness.api.switchWorkspace).toHaveBeenCalledWith({ cwd: FOLDER, resumeId: null })
  })

  // The honest-fallback copy must never appear for a resumable session — that
  // would tell the user their conversation is gone while it is sitting on disk.
  test('the not-resumable copy never shows when there IS a session', async () => {
    await openWorkspace()
    await runATurn()
    killTheStream()
    await waitFor(() => expect(restartControl()).not.toBeNull())
    expect(screen.queryByText(/cannot be resumed/)).toBeNull()
  })
})

describe('#73 — the control retires when the engine is replaced', () => {
  test('starting a new chat clears it', async () => {
    await openWorkspace()
    await runATurn()
    killTheStream()
    await waitFor(() => expect(restartControl()).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'New chat' }))

    await waitFor(() => expect(restartControl()).toBeNull())
  })
})
