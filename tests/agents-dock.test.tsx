import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'
import type { SessionMeta } from '../src/shared/session-types'
import type { SubagentInfo } from '../src/shared/subagent-types'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  window.localStorage.clear()
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const sess = (id: string, title: string): SessionMeta => ({
  id,
  title,
  lastUpdated: 3000,
  messageCount: 2
})

// The session list is read when the rail mounts, so it has to be scripted before
// the folder is picked.
const startSession = async (sessions: SessionMeta[] = []): Promise<void> => {
  harness.api.listSessions.mockResolvedValue(sessions)
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const openDock = (): boolean =>
  fireEvent.click(screen.getByRole('button', { name: 'Agents panel' }))

const dock = (): HTMLElement => screen.getByRole('complementary', { name: 'Agents' })

const agent = (over: Partial<SubagentInfo> = {}): SubagentInfo => ({
  parentToolUseId: 'task-1',
  agentId: 'a1',
  agentType: 'Explore',
  ...over
})

// jsdom has no PointerEvent constructor, so the drag rides plain MouseEvents
// carrying clientX — same technique the sidebar resize test uses.
const dragHandleBy = (handle: Element, fromX: number, toX: number): void => {
  fireEvent(
    handle,
    new MouseEvent('pointerdown', { clientX: fromX, bubbles: true, cancelable: true })
  )
  act(() => {
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: toX }))
    window.dispatchEvent(new MouseEvent('pointerup', {}))
  })
}

describe('agents dock — toggle', () => {
  test('no toggle until a project folder is open', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Agents panel' })).toBeNull()
  })

  test('the titlebar toggle opens and closes the dock', async () => {
    await startSession()
    expect(screen.queryByRole('complementary', { name: 'Agents' })).toBeNull()

    openDock()
    expect(dock()).toBeTruthy()

    openDock()
    expect(screen.queryByRole('complementary', { name: 'Agents' })).toBeNull()
  })

  test('the toggle reports its pressed state', async () => {
    await startSession()
    const toggle = screen.getByRole('button', { name: 'Agents panel' })
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    openDock()
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
  })

  test('the dock closes from its own header button', async () => {
    await startSession()
    openDock()
    fireEvent.click(screen.getByRole('button', { name: 'Close agents panel' }))
    expect(screen.queryByRole('complementary', { name: 'Agents' })).toBeNull()
  })

  test('the chat pane stays rendered beside the dock — it is in flow, not an overlay', async () => {
    await startSession()
    openDock()
    expect(screen.getByPlaceholderText('Message Claude…')).toBeTruthy()
    expect(dock().className).toContain('agents-dock')
  })
})

describe('agents dock — rows hydrated from disk', () => {
  test('lists one row per subagent with type, description, model and depth', async () => {
    harness.api.listSubagents.mockResolvedValue([
      agent({ description: 'look around', model: 'claude-sonnet-5', spawnDepth: 1 }),
      agent({
        parentToolUseId: 'task-2',
        agentId: 'b2',
        agentType: 'general-purpose',
        description: 'widen the parser',
        model: 'grok-4.5',
        spawnDepth: 2
      })
    ])
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()

    expect(await screen.findByText('Explore')).toBeTruthy()
    expect(screen.getByText('look around')).toBeTruthy()
    expect(screen.getByText('claude-sonnet-5 · depth 1')).toBeTruthy()
    expect(screen.getByText('general-purpose')).toBeTruthy()
    expect(screen.getByText('widen the parser')).toBeTruthy()
    expect(screen.getByText('grok-4.5 · depth 2')).toBeTruthy()
    expect(harness.api.listSubagents).toHaveBeenCalledWith('sess-1')
  })

  test('a sidecar with no model or depth renders neither a blank nor a zero', async () => {
    harness.api.listSubagents.mockResolvedValue([agent({ description: 'no metrics here' })])
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()

    expect(await screen.findByText('no metrics here')).toBeTruthy()
    expect(document.querySelector('.agent-row-meta')).toBeNull()
    expect(screen.queryByText(/depth 0/)).toBeNull()
  })

  // currentSessionId is left at the harness default (null): a session opened
  // from the rail has no engine behind it, so the drawer must take the session
  // the app is looking at rather than asking the engine which one is live.
  test('clicking a row opens that agent in the drawer, with no live engine', async () => {
    harness.api.listSubagents.mockResolvedValue([agent({ description: 'look around' })])
    harness.api.subagentTranscript.mockResolvedValue([
      { role: 'assistant', text: 'found the config' }
    ])
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()

    fireEvent.click(await screen.findByText('look around'))

    expect(await screen.findByText('found the config')).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Subagent Explore' })).toBeTruthy()
    expect(harness.api.subagentTranscript).toHaveBeenCalledWith('sess-1', 'task-1')
  })

  test('switching sessions replaces the list', async () => {
    harness.api.listSubagents.mockResolvedValue([agent({ description: 'first session work' })])
    await startSession([sess('sess-1', 'first'), sess('sess-2', 'second')])
    fireEvent.click(await screen.findByText('first'))
    openDock()
    expect(await screen.findByText('first session work')).toBeTruthy()

    harness.api.listSubagents.mockResolvedValue([
      agent({ agentId: 'c3', agentType: 'Plan', description: 'second session work' })
    ])
    fireEvent.click(screen.getByText('second'))

    expect(await screen.findByText('second session work')).toBeTruthy()
    expect(screen.queryByText('first session work')).toBeNull()
    expect(harness.api.listSubagents).toHaveBeenLastCalledWith('sess-2')
  })
})

describe('agents dock — empty states are distinct facts', () => {
  test('a session that spawned none says so', async () => {
    harness.api.listSubagents.mockResolvedValue([])
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()

    expect(await screen.findByText('No agents in this session.')).toBeTruthy()
  })

  test('an unreadable agent directory reads differently from an empty one', async () => {
    harness.api.listSubagents.mockResolvedValue(null)
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()

    expect(await screen.findByText(/Could not read this session/)).toBeTruthy()
    expect(screen.queryByText('No agents in this session.')).toBeNull()
  })

  test('a rejected listing degrades to the unreadable state rather than crashing', async () => {
    harness.api.listSubagents.mockRejectedValue(new Error('EPERM'))
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()

    expect(await screen.findByText(/Could not read this session/)).toBeTruthy()
  })
})

describe('agents dock — width', () => {
  test('applies the default width on mount', async () => {
    await startSession()
    openDock()
    expect(dock().style.width).toBe('248px')
  })

  test('restores a persisted width', async () => {
    window.localStorage.setItem('agents-dock-width', '320')
    await startSession()
    openDock()
    expect(dock().style.width).toBe('320px')
  })

  test('a corrupt stored width falls back to the default rather than collapsing', async () => {
    window.localStorage.setItem('agents-dock-width', 'not-a-number')
    await startSession()
    openDock()
    expect(dock().style.width).toBe('248px')
  })

  test('dragging the grip leftward widens the dock and persists it', async () => {
    await startSession()
    openDock()
    dragHandleBy(screen.getByRole('separator', { name: 'Resize agents panel' }), 500, 460)
    expect(dock().style.width).toBe('288px') // 248 + (500 - 460)
    expect(window.localStorage.getItem('agents-dock-width')).toBe('288')
  })

  test('clamps at the max bound on an oversized drag', async () => {
    await startSession()
    openDock()
    dragHandleBy(screen.getByRole('separator', { name: 'Resize agents panel' }), 2000, 0)
    expect(dock().style.width).toBe('480px')
  })
})
