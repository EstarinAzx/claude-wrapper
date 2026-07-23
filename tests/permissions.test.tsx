import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
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

async function startSession() {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

function input(): HTMLInputElement {
  return screen.getByPlaceholderText('Message Claude…') as HTMLInputElement
}

function send(text: string) {
  fireEvent.change(input(), { target: { value: text } })
  fireEvent.keyDown(input(), { key: 'Enter' })
}

describe('permission allow/deny', () => {
  test('permission request shows one card with accessible Allow and Deny', async () => {
    await startSession()
    send('run something gated')
    harness.emit({
      type: 'tool-use',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'rm -rf /' }
    })
    harness.emit({
      type: 'permission-request',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'rm -rf /' }
    })
    expect(document.querySelectorAll('.tool-card').length).toBe(1)
    expect(screen.getByRole('button', { name: 'Allow' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Deny' })).toBeTruthy()
  })

  test('permission-request upserts existing tool card — no duplicate regardless of order', async () => {
    await startSession()
    send('gated')
    harness.emit({
      type: 'permission-request',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })
    harness.emit({
      type: 'tool-use',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })
    expect(document.querySelectorAll('.tool-card').length).toBe(1)
    expect(screen.getByRole('button', { name: 'Allow' })).toBeTruthy()
  })

  test('Allow click records decision through public API and leaves permission state', async () => {
    await startSession()
    send('gated')
    harness.emit({
      type: 'tool-use',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })
    harness.emit({
      type: 'permission-request',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })
    const decision = harness.waitForPermission('tu-1')
    fireEvent.click(screen.getByRole('button', { name: 'Allow' }))
    await expect(decision).resolves.toBe('allow')
    expect(harness.permissionResponses).toEqual([
      { toolUseId: 'tu-1', decision: 'allow' }
    ])
    expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Deny' })).toBeNull()
    expect(screen.getByRole('status').textContent).toMatch(/running/i)
    harness.emit({
      type: 'tool-result',
      id: 'tu-1',
      text: 'command completed',
      isError: false
    })
    expect(screen.getByRole('status').textContent).toBe('command completed')
  })

  test('terminal error cancels pending and allowed tools without results', async () => {
    await startSession()
    send('gated')
    harness.emit({
      type: 'permission-request',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })
    harness.emit({
      type: 'tool-use',
      id: 'tu-2',
      name: 'Read',
      input: { file_path: 'a.ts' }
    })
    harness.emit({
      type: 'permission-request',
      id: 'tu-2',
      name: 'Read',
      input: { file_path: 'a.ts' }
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Allow' })[1])
    harness.emit({ type: 'error', message: 'query stopped' })

    expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Deny' })).toBeNull()
    expect(screen.getAllByText('Cancelled')).toHaveLength(2)
  })

  test('Deny click records deny, then scripted text and turn-end re-arm input', async () => {
    await startSession()
    send('gated')
    harness.emit({
      type: 'tool-use',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })
    harness.emit({
      type: 'permission-request',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }))
    expect(harness.permissionResponses).toEqual([
      { toolUseId: 'tu-1', decision: 'deny' }
    ])
    expect(screen.getByText(/Denied/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull()
    harness.emit({
      type: 'tool-result',
      id: 'tu-1',
      text: 'User denied this tool request.',
      isError: true
    })
    expect(screen.getByText('Denied')).toBeTruthy()
    expect(screen.queryByText(/Failed:/i)).toBeNull()

    harness.emit({ type: 'text-delta', text: 'Okay, I will not run that.' })
    harness.emit({ type: 'turn-end' })
    expect(screen.getByText('Okay, I will not run that.')).toBeTruthy()
    expect(input().disabled).toBe(false)
  })
})
