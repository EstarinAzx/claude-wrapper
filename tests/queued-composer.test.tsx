import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  createEvent,
  cleanup,
  waitFor
} from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER, SENT_UUID } from './chat-harness'

// #80 — the wiring half. The decision table is `tests/queued-send.test.ts`; the
// "it really only reaches the CLI once" half is `gui-80.mjs`, because a count of
// one in jsdom and a count of one against a live engine are different claims.
//
// Every no-flush case here is asserted in TWO directions, on purpose. `prompts`
// not growing is an absence, and this repo's ledger records absence assertions
// as the ones most likely to pass vacuously — a composer that queued nothing at
// all would satisfy every one of them. So each of those tests also asserts the
// POSITIVE consequence: the text is still sitting in the composer, which is only
// true if a prompt really was queued and really was released without being sent.

const THERE = 'D:\\projects\\other'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const input = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLTextAreaElement

const type = (text: string): void => {
  fireEvent.change(input(), { target: { value: text } })
}

const enter = (): void => {
  fireEvent.keyDown(input(), { key: 'Enter' })
}

const send = (text: string): void => {
  type(text)
  enter()
}

const note = (): HTMLElement | null => document.querySelector('.queued-note')

const cancelBtn = (): HTMLButtonElement | null =>
  screen.queryByRole('button', { name: 'Cancel queued prompt' }) as HTMLButtonElement | null

// Start a turn and queue a second prompt behind it. Returns nothing: every test
// below re-reads the DOM, because what this leaves behind IS the state under
// test and handing back a snapshot of it would hide a later mutation.
const queueBehindATurn = async (first = 'first', second = 'second'): Promise<void> => {
  await startSession()
  send(first)
  expect(harness.prompts).toHaveLength(1)
  type(second)
  enter()
}

describe('the composer while a turn runs', () => {
  test('it takes input — the field is live, not disabled', async () => {
    await startSession()
    send('first')

    expect(input().disabled).toBe(false)
    type('typed while the turn was still going')
    expect(input().value).toBe('typed while the turn was still going')
    // The one thing that must NOT have happened: typing is not sending.
    expect(harness.prompts).toHaveLength(1)
  })

  test('Enter commits the draft instead of sending it, and says so', async () => {
    await queueBehindATurn()

    // `useChat.send`'s busy guard is untouched — this is what it looks like from
    // outside: the prompt did not reach the engine.
    expect(harness.prompts).toHaveLength(1)
    expect(note()).not.toBeNull()
    expect(note()?.textContent).toMatch(/sends when this turn finishes/i)
    // The draft stays in the box, because the queue IS the draft: what fires is
    // what is visible, never a hidden snapshot taken at commit time.
    expect(input().value).toBe('second')
  })

  test('the button under the cursor is still Stop, and a queued prompt does not add a second one', async () => {
    await queueBehindATurn()

    // The ticket's design hole, answered: while busy the send slot is Stop, so
    // Enter is the only way to commit — and committing must not grow a second
    // send affordance that would race the first.
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
    expect(cancelBtn()).not.toBeNull()
  })

  test('an empty composer queues nothing at all', async () => {
    await startSession()
    send('first')

    enter()

    expect(note()).toBeNull()
    expect(harness.prompts).toHaveLength(1)
    // And the turn ending finds nothing to fire.
    harness.emit({ type: 'turn-end' })
    expect(harness.prompts).toHaveLength(1)
  })
})

describe('the queued prompt fires', () => {
  test('a clean turn-end sends it, exactly once, and empties the composer', async () => {
    await queueBehindATurn()

    harness.emit({ type: 'turn-end' })

    expect(harness.prompts).toEqual([
      { text: 'first', attachments: [], uuid: SENT_UUID },
      { text: 'second', attachments: [], uuid: SENT_UUID }
    ])
    expect(note()).toBeNull()
    expect(input().value).toBe('')
  })

  // The sharpest failure mode in this ticket: a prompt that fires twice. A "did
  // it send" assertion cannot see it, so this counts — and it counts across a
  // SECOND turn ending, which is where a flag that was never cleared would show.
  test('the next turn ending fires nothing more', async () => {
    await queueBehindATurn()

    harness.emit({ type: 'turn-end' })
    expect(harness.prompts).toHaveLength(2)

    harness.emit({ type: 'turn-end' })
    harness.emit({ type: 'turn-end' })

    expect(harness.prompts).toHaveLength(2)

    // The sharper form of "fires twice", and the one a bare count misses: the
    // flush starts a NEW turn, so a commitment left standing after its own flush
    // spends whatever is typed next without the user ever committing it. Counting
    // alone stays green here purely because the flush emptied the box — this
    // refills it, so the count means something again.
    type('a draft nobody committed')
    harness.emit({ type: 'turn-end' })

    expect(harness.prompts).toHaveLength(2)
    expect(input().value).toBe('a draft nobody committed')
    expect(note()).toBeNull()
  })

  // Two queued prompts across two turns: the nonce is what makes the second one
  // fire. Without it `lastTurn` is the same value twice and the effect never
  // re-runs — a bug that only appears on the second turn of a conversation.
  test('a second prompt queued behind a second turn fires too', async () => {
    await queueBehindATurn()
    harness.emit({ type: 'turn-end' })
    expect(harness.prompts).toHaveLength(2)

    // The flush started turn TWO, so this is queued exactly as the last one was.
    type('third')
    enter()
    expect(note()).not.toBeNull()
    expect(harness.prompts).toHaveLength(2)

    harness.emit({ type: 'turn-end' })

    expect(harness.prompts).toHaveLength(3)
    expect(harness.prompts[2]).toEqual({ text: 'third', attachments: [], uuid: SENT_UUID })
  })

  test('attachments ride along with it', async () => {
    await startSession()
    send('first')

    const el = input()
    const event = createEvent.paste(el)
    Object.defineProperty(event, 'clipboardData', {
      value: {
        files: [new File([new Uint8Array([137, 80, 78, 71])], 'shot.png', { type: 'image/png' })],
        items: [],
        getData: () => ''
      }
    })
    fireEvent(el, event)
    // The tray is live while busy too — a composer that took words but refused
    // images would queue a prompt with half of it missing.
    await waitFor(() => expect(document.querySelectorAll('.attachment-chip')).toHaveLength(1))

    type('look at this')
    enter()
    harness.emit({ type: 'turn-end' })

    expect(harness.prompts).toHaveLength(2)
    expect(harness.prompts[1].text).toBe('look at this')
    expect(harness.prompts[1].attachments).toHaveLength(1)
    expect(harness.prompts[1].attachments[0]).toMatchObject({
      kind: 'image',
      mediaType: 'image/png'
    })
    expect(document.querySelectorAll('.attachment-chip')).toHaveLength(0)
  })
})

describe('the queued prompt does NOT fire', () => {
  // THE negative. Stop clears `busy` exactly as turn-end does, so a "flush when
  // no longer busy" implementation resends here — which is the opposite of what
  // the user just asked for, and destructive because they lose the running turn
  // AND spend a prompt.
  test('after Stop — and the text is still in the composer', async () => {
    await queueBehindATurn()

    harness.emit({ type: 'turn-aborted' })

    expect(harness.prompts).toHaveLength(1)
    // The positive half, without which the assertion above passes for a composer
    // that never queued anything: the commitment was released, the words were not.
    expect(input().value).toBe('second')
    expect(note()).toBeNull()
    // And it does not fire late, on some later turn's end.
    harness.emit({ type: 'turn-end' })
    expect(harness.prompts).toHaveLength(1)
  })

  test('after a failed turn — and the text is still in the composer', async () => {
    await queueBehindATurn()

    harness.emit({ type: 'error', message: 'the CLI fell over' })

    expect(harness.prompts).toHaveLength(1)
    expect(input().value).toBe('second')
    expect(note()).toBeNull()
  })

  // #73: the stream died under the turn. Sending into that engine buys an error
  // bubble and spends the text, so the prompt is handed back to the user instead.
  test('into an engine that went terminal — and the text is still in the composer', async () => {
    await queueBehindATurn()

    harness.emitTerminal()
    harness.emit({ type: 'turn-end' })

    expect(harness.prompts).toHaveLength(1)
    expect(input().value).toBe('second')
    expect(note()).toBeNull()
  })

  test('after Cancel — the commitment goes, the words stay', async () => {
    await queueBehindATurn()

    fireEvent.click(cancelBtn() as HTMLButtonElement)

    expect(note()).toBeNull()
    expect(input().value).toBe('second')

    harness.emit({ type: 'turn-end' })
    expect(harness.prompts).toHaveLength(1)
    // Still there afterwards: cancelling is not deleting, and the turn ending is
    // not deleting either.
    expect(input().value).toBe('second')
  })
})

// Collision 2 from the ticket, and the reason the queue lives in InputBar rather
// than in App: `<InputBar key={cwd}>` is the whole composer reset, so the queue
// resets with the draft and the tray instead of needing a hand-written line in
// `switchWorkspace`'s `ok` branch — the `pendingInsert` bug class verbatim.
describe('a queued prompt never crosses a workspace switch', () => {
  test('the switch takes the queue with the draft', async () => {
    window.localStorage.setItem('sidebar-scope', 'all')
    harness.api.listSessions.mockResolvedValue([
      { id: 'here', title: 'Here chat', lastUpdated: 2000, cwd: FOLDER },
      { id: 'far', title: 'Far chat', lastUpdated: 1000, cwd: THERE }
    ])

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
    await screen.findByText('demo')
    await screen.findByText('Far chat')

    send('first')
    type('must not follow me into the other project')
    enter()
    expect(note()).not.toBeNull()

    // A foreign row stays live while a turn streams (#47): main owns the busy
    // decision. Scripted to `ok` here so the transition actually lands — the
    // point is what survives it, not whether it was allowed.
    fireEvent.click(screen.getByText('Far chat').closest('button') as HTMLButtonElement)

    await waitFor(() => expect(note()).toBeNull())
    expect(input().value).toBe('')
    // The switch itself is the only thing that reached the engine.
    expect(harness.prompts).toHaveLength(1)
  })
})
