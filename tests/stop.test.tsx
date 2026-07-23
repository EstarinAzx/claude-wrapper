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

describe('stop button', () => {
  test('while busy the send slot becomes an enabled Stop button', async () => {
    await startSession()
    send('hello')
    const stop = screen.getByRole('button', { name: 'Stop' }) as HTMLButtonElement
    expect(stop.disabled).toBe(false)
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
  })

  test('clicking Stop calls the stop API', async () => {
    await startSession()
    send('hello')
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(harness.api.stopTurn).toHaveBeenCalledTimes(1)
  })

  test('turn-aborted re-arms input and shows a quiet Stopped notice', async () => {
    await startSession()
    send('hello')
    harness.emit({ type: 'text-delta', text: 'Half a thou' })
    harness.emit({ type: 'turn-aborted' })

    expect(input().disabled).toBe(false)
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy()
    const notice = screen.getByText('Stopped')
    expect(notice.className).toContain('msg-notice')
    expect(document.querySelector('.msg-error')).toBeNull()

    send('again')
    expect(harness.prompts).toEqual(['hello', 'again'])
  })

  test('turn-aborted cancels a pending permission card', async () => {
    await startSession()
    send('gated')
    harness.emit({
      type: 'permission-request',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })
    harness.emit({ type: 'turn-aborted' })
    expect(screen.queryByRole('button', { name: 'Allow' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Deny' })).toBeNull()
    expect(screen.getByText('Cancelled')).toBeTruthy()
  })
})

describe('legible failure', () => {
  test('engine error renders as a chat alert and the next prompt still sends', async () => {
    await startSession()
    send('hello')
    harness.emit({
      type: 'error',
      message:
        'Claude CLI not found. Install Claude Code, then pick the folder again. (spawn claude ENOENT)'
    })
    expect(screen.getByRole('alert').textContent).toMatch(/Claude CLI not found/)
    expect(input().disabled).toBe(false)

    send('again')
    expect(harness.prompts).toEqual(['hello', 'again'])
  })
})
