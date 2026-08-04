import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'

// #113, renderer half — THE ORPHAN BUBBLE.
//
// `useChat.send` appends the user's bubble BEFORE it calls `sendPrompt`, so a
// main-side refusal (the other half of this ticket) would leave a user bubble
// with no reply. The ticket demands the wrinkle be answered deliberately, and
// the answer chosen is the second of the two it names: THE RENDERER STOPS
// APPENDING, by refusing a send it already knows it will not issue. Nothing is
// dropped after the fact, so no correlation id and no new event type is needed —
// and the case cannot arise for any other caller, because `useChat.send` is the
// only code that appends a bubble.
//
// The mechanism reproduced here is the ONLY one that reaches main (measured by
// the #108 spike): two commits inside ONE task. `fireEvent` flushes React state
// between calls, which is the back-to-back-macrotask case the emptied draft
// already refuses — so the dispatches are made inside a single `act` instead,
// where the first commit's `setValue('')` and `setBusy(true)` have not applied
// yet. That is what a stale `busy` prop means, and it is exactly why the
// renderer's own guard has to read a ref rather than the state.

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

const enter = (el: HTMLElement): void => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
}

const userBubbles = (): string[] =>
  Array.from(document.querySelectorAll('.msg-user .bubble')).map(
    (n) => n.textContent ?? ''
  )

// Main as the #108 spike MEASURED it, before this ticket: a send arriving while
// a turn is in flight is answered with the overlap error on the second caller's
// own callback, and the renderer treats every error as turn-terminal.
//
// Scripted rather than assumed, because without it the two tests below pass with
// every guard deleted — the default fake swallows a second prompt in silence, so
// "busy stayed true" would be true for the wrong reason. With it, a second send
// that actually leaves the renderer costs the pane its Stop button, exactly as
// it did on screen at 518ms.
const installMeasuredMain = (): void => {
  let live = false
  harness.api.sendPrompt = (payload): void => {
    if (live) {
      harness.emit({ type: 'error', message: 'A turn is already running' })
      return
    }
    live = true
    harness.prompts.push(payload)
  }
  const endsTurn = new Set(['turn-end', 'turn-aborted', 'error'])
  const emit = harness.emit
  harness.emit = (e): void => {
    if (endsTurn.has(e.type)) live = false
    emit(e)
  }
}

describe('a same-task double send (#113)', () => {
  test('commits the prompt once', async () => {
    await startSession()
    fireEvent.change(input(), { target: { value: 'hello' } })

    act(() => {
      enter(input())
      enter(input())
    })

    expect(harness.prompts.map((p) => p.text)).toEqual(['hello'])
  })

  // AC3. The bubble the second commit would have appended is never created, so
  // there is nothing to reconcile against main's silent refusal.
  test('leaves no orphan user bubble in the pane', async () => {
    await startSession()
    fireEvent.change(input(), { target: { value: 'hello' } })

    act(() => {
      enter(input())
      enter(input())
    })

    expect(userBubbles()).toEqual(['hello'])
  })

  // AC1's renderer half. The turn is running and the composer must say so — a
  // Stop on screen for a turn that is still streaming. This is the state the
  // measured defect destroyed at 518ms.
  test('stays busy, with Stop still on screen', async () => {
    await startSession()
    installMeasuredMain()
    fireEvent.change(input(), { target: { value: 'hello' } })

    act(() => {
      enter(input())
      enter(input())
    })

    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
  })

  // AC2. The first turn is untouched by the refusal: it streams and ends
  // normally, and the pane is left ready for the next prompt.
  test('the first turn still streams and ends normally', async () => {
    await startSession()
    installMeasuredMain()
    fireEvent.change(input(), { target: { value: 'hello' } })

    act(() => {
      enter(input())
      enter(input())
    })

    harness.emit({ type: 'text-delta', text: 'an answer' })
    harness.emit({ type: 'turn-end' })

    expect(screen.getByText('an answer')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy()
    expect(document.querySelector('.msg-error')).toBeNull()
  })

  // The guard must not swallow the NEXT prompt: it reads a live fact, it does
  // not latch. A ref left true after the turn ended would pass every test above
  // and silently break the app.
  test('the next prompt after that turn is accepted', async () => {
    await startSession()
    fireEvent.change(input(), { target: { value: 'hello' } })
    act(() => {
      enter(input())
      enter(input())
    })
    harness.emit({ type: 'turn-end' })

    fireEvent.change(input(), { target: { value: 'again' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    expect(harness.prompts.map((p) => p.text)).toEqual(['hello', 'again'])
  })
})
