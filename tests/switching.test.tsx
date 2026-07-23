import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'

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

const rowButton = (label: string): HTMLButtonElement =>
  screen.getByText(label).closest('button') as HTMLButtonElement

describe('busy-switch polish (#14)', () => {
  test('session rows and New chat are disabled while a turn is streaming', async () => {
    harness.api.listSessions.mockResolvedValue([
      { id: 'sess-1', title: 'My chat', lastUpdated: 1000, messageCount: 2 }
    ])
    await startSession()
    await screen.findByText('My chat')

    fireEvent.change(input(), { target: { value: 'hello' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    expect(rowButton('My chat').disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'New chat' }) as HTMLButtonElement).disabled).toBe(
      true
    )

    harness.emit({ type: 'turn-end' })

    expect(rowButton('My chat').disabled).toBe(false)
    expect((screen.getByRole('button', { name: 'New chat' }) as HTMLButtonElement).disabled).toBe(
      false
    )
  })

  test('switching is blocked mid-stream — no targetSession call, no pane leak', async () => {
    harness.api.listSessions.mockResolvedValue([
      { id: 'sess-1', title: 'My chat', lastUpdated: 1000, messageCount: 2 }
    ])
    await startSession()
    await screen.findByText('My chat')

    fireEvent.change(input(), { target: { value: 'hello' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    fireEvent.click(rowButton('My chat'))
    expect(harness.api.targetSession).not.toHaveBeenCalled()

    harness.emit({ type: 'text-delta', text: 'streamed answer' })
    expect(await screen.findByText('streamed answer')).toBeTruthy()
  })

  test('the live-row highlight survives a manual refresh', async () => {
    harness.api.listSessions.mockResolvedValue([
      { id: 'sess-1', title: 'First chat', lastUpdated: 1000, messageCount: 2 },
      { id: 'sess-2', title: 'Second chat', lastUpdated: 900, messageCount: 2 }
    ])
    await startSession()

    fireEvent.click(await screen.findByText('Second chat'))
    await waitFor(() => {
      expect(rowButton('Second chat').getAttribute('aria-current')).toBe('true')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Refresh sessions' }))

    await waitFor(() => {
      expect(rowButton('Second chat').getAttribute('aria-current')).toBe('true')
    })
    expect(rowButton('First chat').getAttribute('aria-current')).toBeNull()
  })
})
