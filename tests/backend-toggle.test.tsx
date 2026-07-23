import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  // A wisped launch that can flip back to native (both directions available).
  harness.api.backendMode = vi
    .fn()
    .mockResolvedValue({ mode: 'wisped', wispedAvailable: true })
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => cleanup())

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const pill = (): HTMLButtonElement =>
  screen.getByLabelText('Backend mode') as HTMLButtonElement

const send = (text: string) => {
  const input = screen.getByPlaceholderText('Message Claude…') as HTMLInputElement
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('click-to-flip backend toggle', () => {
  test('clicking the pill asks the main side to flip to the opposite mode', async () => {
    await startSession()
    await screen.findByText('Wisped')
    fireEvent.click(pill())
    expect(harness.api.setBackendMode).toHaveBeenCalledWith('native')
  })

  test('a flip clears the chat pane — the next turn is a fresh conversation', async () => {
    await startSession()
    await screen.findByText('Wisped')
    send('remember this')
    harness.emit({ type: 'text-delta', text: 'sure, noted' })
    harness.emit({ type: 'turn-end' })
    expect(screen.getByText('remember this')).toBeTruthy()
    expect(screen.getByText('sure, noted')).toBeTruthy()

    fireEvent.click(pill())
    expect(screen.queryByText('remember this')).toBeNull()
    expect(screen.queryByText('sure, noted')).toBeNull()
  })

  test('the broadcast from main re-renders the pill to the new mode', async () => {
    await startSession()
    await screen.findByText('Wisped')
    fireEvent.click(pill())
    // main applied the flip and broadcast the resulting mode
    harness.emitBackend({ mode: 'native', wispedAvailable: true })
    expect(pill().textContent).toBe('Native')
    expect(pill().className).not.toContain('backend-pill--wisped')
  })

  test('the pill cannot flip mid-stream (disabled while busy)', async () => {
    await startSession()
    await screen.findByText('Wisped')
    send('a long one')
    // turn is streaming (busy) — no turn-end yet
    expect(pill().disabled).toBe(true)
    fireEvent.click(pill())
    expect(harness.api.setBackendMode).not.toHaveBeenCalled()
  })
})
