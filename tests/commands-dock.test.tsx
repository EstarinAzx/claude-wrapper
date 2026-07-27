import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, within, act } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'

// #39 — Commands dock: titlebar toggle gated on a folder, fetch-on-open with
// no cache, mutual exclusion with the agents dock, click-to-insert by
// pending-insert prop (replace + focus, never send).
let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
})

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const input = (): HTMLInputElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLInputElement

const toggle = () => screen.getByRole('button', { name: 'Commands panel' })
const dock = () => screen.getByRole('complementary', { name: 'Commands' })

const openDock = async () => {
  fireEvent.click(toggle())
  await act(async () => {})
}

const COMMANDS = [
  { name: 'context', description: 'Show context usage', argumentHint: '' },
  { name: 'model', description: 'Pick a model', argumentHint: '<model>' }
]

describe('commands dock (#39)', () => {
  test('toggle is absent before a folder is picked, present after', async () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Commands panel' })).toBeNull()
    cleanup()
    await startSession()
    expect(toggle()).toBeTruthy()
  })

  test('opening the dock lists name, description and argument hint per row', async () => {
    harness.api.listCommands.mockResolvedValue(COMMANDS)
    await startSession()
    await openDock()
    const d = dock()
    expect(within(d).getByText('/context')).toBeTruthy()
    expect(within(d).getByText('Show context usage')).toBeTruthy()
    expect(within(d).getByText('/model')).toBeTruthy()
    expect(within(d).getByText('<model>')).toBeTruthy()
  })

  test('the list is re-fetched on each open and held nowhere between opens', async () => {
    harness.api.listCommands.mockResolvedValue(COMMANDS)
    await startSession()
    await openDock()
    expect(harness.api.listCommands).toHaveBeenCalledTimes(1)
    fireEvent.click(toggle())
    expect(screen.queryByRole('complementary', { name: 'Commands' })).toBeNull()
    await openDock()
    expect(harness.api.listCommands).toHaveBeenCalledTimes(2)
  })

  test('opening Commands closes Agents, and opening Agents closes Commands', async () => {
    await startSession()
    fireEvent.click(screen.getByRole('button', { name: 'Agents panel' }))
    expect(screen.getByRole('complementary', { name: 'Agents' })).toBeTruthy()
    await openDock()
    expect(screen.queryByRole('complementary', { name: 'Agents' })).toBeNull()
    expect(dock()).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Agents panel' }))
    expect(screen.queryByRole('complementary', { name: 'Commands' })).toBeNull()
    expect(screen.getByRole('complementary', { name: 'Agents' })).toBeTruthy()
  })

  test('clicking a row replaces the composer with the command and a trailing space, focused, unsent', async () => {
    harness.api.listCommands.mockResolvedValue(COMMANDS)
    await startSession()
    fireEvent.change(input(), { target: { value: 'half-typed thought' } })
    await openDock()
    fireEvent.click(within(dock()).getByText('/context'))
    expect(input().value).toBe('/context ')
    expect(document.activeElement).toBe(input())
    expect(harness.prompts).toEqual([])
  })

  test('clicking the same row twice inserts both times', async () => {
    harness.api.listCommands.mockResolvedValue(COMMANDS)
    await startSession()
    await openDock()
    fireEvent.click(within(dock()).getByText('/model'))
    expect(input().value).toBe('/model ')
    fireEvent.change(input(), { target: { value: '/model opus' } })
    fireEvent.click(within(dock()).getByText('/model'))
    expect(input().value).toBe('/model ')
  })

  test('with no live query the dock shows an empty state, not an error', async () => {
    harness.api.listCommands.mockResolvedValue([])
    await startSession()
    await openDock()
    const empty = within(dock()).getByRole('status')
    expect(empty.textContent).toContain('No commands')
    expect(within(dock()).queryByRole('alert')).toBeNull()
  })
})
