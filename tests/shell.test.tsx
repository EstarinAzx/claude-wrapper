import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from '../src/renderer/src/App'

beforeEach(() => {
  ;(window as Window & { api: unknown }).api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn()
  }
})

afterEach(() => {
  cleanup()
})

describe('shell', () => {
  test('renders app chrome labels', () => {
    render(<App />)
    expect(screen.getByText('Claude Wrapper')).toBeTruthy()
    expect(screen.getByText('New session')).toBeTruthy()
    expect(screen.getByPlaceholderText('Message Claude…')).toBeTruthy()
    expect(
      screen.getByText('Claude can make mistakes. Verify important information.')
    ).toBeTruthy()
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

  test('renders static conversation', () => {
    render(<App />)
    expect(screen.getByText('TODAY')).toBeTruthy()
    expect(screen.getByText('What does this repo do?')).toBeTruthy()
    expect(screen.getByText('Nice. Where should I start reading?')).toBeTruthy()
    expect(
      screen.getByText('It wraps the Claude Code CLI in a desktop app:')
    ).toBeTruthy()
  })
})
