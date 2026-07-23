import { describe, test, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'

let pickFolder: Mock<() => Promise<string | null>>

beforeEach(() => {
  pickFolder = vi.fn<() => Promise<string | null>>()
  ;(window as Window & { api: unknown }).api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    pickFolder,
    listSessions: vi.fn().mockResolvedValue([]),
    loadTranscript: vi.fn().mockResolvedValue([]),
    targetSession: vi.fn(),
    currentSessionId: vi.fn().mockResolvedValue(null),
    sendPrompt: vi.fn(),
    stopTurn: vi.fn(),
    respondToPermission: vi.fn(),
    onChatEvent: vi.fn().mockReturnValue(() => {})
  }
})

afterEach(() => {
  cleanup()
})

describe('session start', () => {
  test('no session: welcome state with pick affordance, no chat or input', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Pick a project folder' })).toBeTruthy()
    expect(screen.getByText('New session')).toBeTruthy()
    expect(screen.queryByText('TODAY')).toBeNull()
    expect(screen.queryByPlaceholderText('Message Claude…')).toBeNull()
  })

  test('picking a folder starts the session: header shows folder, chat appears', async () => {
    pickFolder.mockResolvedValue('D:\\projects\\my-app')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
    expect(pickFolder).toHaveBeenCalledOnce()
    const header = await screen.findByText('my-app')
    expect(header.getAttribute('title')).toBe('D:\\projects\\my-app')
    expect(screen.queryByText('New session')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Pick a project folder' })).toBeNull()
    expect(screen.getByText('TODAY')).toBeTruthy()
    expect(screen.getByPlaceholderText('Message Claude…')).toBeTruthy()
  })

  test('cancelled dialog keeps the welcome state', async () => {
    pickFolder.mockResolvedValue(null)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
    expect(await screen.findByRole('button', { name: 'Pick a project folder' })).toBeTruthy()
    expect(screen.getByText('New session')).toBeTruthy()
    expect(screen.queryByText('TODAY')).toBeNull()
  })

  test('forward-slash paths display their basename too', async () => {
    pickFolder.mockResolvedValue('/home/me/proj')
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
    expect(await screen.findByText('proj')).toBeTruthy()
  })
})
