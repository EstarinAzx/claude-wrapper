import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'

beforeEach(() => {
  ;(window as Window & { api: unknown }).api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    pickFolder: vi.fn().mockResolvedValue('D:\\projects\\demo'),
    listSessions: vi.fn().mockResolvedValue([]),
    loadTranscript: vi.fn().mockResolvedValue([]),
    targetSession: vi.fn(),
    currentSessionId: vi.fn().mockResolvedValue(null),
    backendMode: vi.fn().mockResolvedValue({ mode: 'native', wispedAvailable: false }),
    setBackendMode: vi.fn(),
    onBackendChanged: vi.fn().mockReturnValue(() => {}),
    permissionMode: vi.fn().mockResolvedValue('bypassPermissions'),
    setPermissionMode: vi.fn(),
    onPermissionChanged: vi.fn().mockReturnValue(() => {}),
    listModels: vi.fn().mockResolvedValue({ models: [], current: null }),
    setModel: vi.fn(),
    onModelChanged: vi.fn().mockReturnValue(() => {}),
    setZoom: vi.fn(),
    sendPrompt: vi.fn(),
    stopTurn: vi.fn(),
    respondToPermission: vi.fn(),
    onChatEvent: vi.fn().mockReturnValue(() => {})
  }
})

afterEach(() => {
  cleanup()
})

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

describe('shell', () => {
  test('renders app chrome labels', () => {
    render(<App />)
    expect(screen.getByText('Claude Wrapper')).toBeTruthy()
    expect(screen.getByText('New session')).toBeTruthy()
  })

  test('window controls call window.api', () => {
    render(<App />)
    fireEvent.click(screen.getByLabelText('Minimize'))
    fireEvent.click(screen.getByLabelText('Maximize'))
    fireEvent.click(screen.getByLabelText('Close'))
    expect(window.api.minimize).toHaveBeenCalledOnce()
    expect(window.api.toggleMaximize).toHaveBeenCalledOnce()
    expect(window.api.close).toHaveBeenCalledOnce()
  })

  test('started session renders empty chat shell and armed input', async () => {
    await startSession()
    expect(screen.getByText('TODAY')).toBeTruthy()
    expect(screen.queryByText('What does this repo do?')).toBeNull()
    expect(screen.getByPlaceholderText('Message Claude…')).toBeTruthy()
    expect(
      screen.getByText('Claude can make mistakes. Verify important information.')
    ).toBeTruthy()
  })
})
