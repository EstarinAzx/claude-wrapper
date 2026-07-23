import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => cleanup())

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const pill = (): HTMLButtonElement =>
  screen.getByLabelText('Permission mode') as HTMLButtonElement

const send = (text: string) => {
  const input = screen.getByPlaceholderText('Message Claude…') as HTMLInputElement
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('in-app permission-mode toggle', () => {
  test('defaults to Bypass and asks main to cycle on click', async () => {
    await startSession()
    await screen.findByText('Bypass')
    fireEvent.click(pill())
    expect(harness.api.setPermissionMode).toHaveBeenCalledWith('acceptEdits')
  })

  test('cycling the mode PRESERVES the conversation (no chat reset)', async () => {
    await startSession()
    await screen.findByText('Bypass')
    send('keep this going')
    harness.emit({ type: 'text-delta', text: 'still here' })
    harness.emit({ type: 'turn-end' })
    expect(screen.getByText('keep this going')).toBeTruthy()
    expect(screen.getByText('still here')).toBeTruthy()

    fireEvent.click(pill())
    // unlike a backend flip, the pane keeps its history
    expect(screen.getByText('keep this going')).toBeTruthy()
    expect(screen.getByText('still here')).toBeTruthy()
  })

  test('the broadcast from main re-renders the pill to the new mode', async () => {
    await startSession()
    await screen.findByText('Bypass')
    fireEvent.click(pill())
    harness.emitPermission('acceptEdits')
    expect(pill().textContent).toBe('Accept Edits')
    expect(pill().className).not.toContain('perm-pill--bypass')
  })

  test('cannot cycle mid-stream (disabled while busy)', async () => {
    await startSession()
    await screen.findByText('Bypass')
    send('a long one')
    expect(pill().disabled).toBe(true)
    fireEvent.click(pill())
    expect(harness.api.setPermissionMode).not.toHaveBeenCalled()
  })
})
