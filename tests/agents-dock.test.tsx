import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'
import type { SessionMeta } from '../src/shared/session-types'
import type { SubagentInfo } from '../src/shared/subagent-types'
import type { EngineEvent } from '../src/shared/engine-types'

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

// The live half of the panel. Rows arrive as engine `subagent` events; the dock
// merges them with whatever the disk read returned.
describe('agents dock — live rows', () => {
  const liveEvent = (over: Record<string, unknown> = {}): EngineEvent =>
    ({
      type: 'subagent',
      parentToolUseId: 'toolu-1',
      status: 'running',
      agentType: 'general-purpose',
      description: 'Reading notes.txt',
      ...over
    }) as EngineEvent

  test('an agent appears while the turn is still running, before it finishes', async () => {
    await startSession()
    openDock()
    harness.emit(liveEvent())

    expect(await screen.findByText('general-purpose')).toBeTruthy()
    expect(screen.getByText('Reading notes.txt')).toBeTruthy()
    expect(screen.getByText('running…')).toBeTruthy()
  })

  test('a running row shows tokens, tool count, elapsed and the last tool', async () => {
    await startSession()
    openDock()
    harness.emit(
      liveEvent({ totalTokens: 53689, toolUses: 2, durationMs: 14636, lastToolName: 'Read' })
    )

    expect(await screen.findByText('53.7k ctx · 2 tools · 15s · Read')).toBeTruthy()
  })

  test('the numbers update in place as progress ticks arrive', async () => {
    await startSession()
    openDock()
    harness.emit(
      liveEvent({ totalTokens: 51000, toolUses: 1, durationMs: 3000, lastToolName: 'Glob' })
    )
    expect(await screen.findByText('51.0k ctx · 1 tool · 3s · Glob')).toBeTruthy()

    harness.emit(
      liveEvent({ totalTokens: 54700, toolUses: 5, durationMs: 50000, lastToolName: 'Edit' })
    )

    expect(await screen.findByText('54.7k ctx · 5 tools · 50s · Edit')).toBeTruthy()
    expect(screen.queryByText(/51\.0k/)).toBeNull()
    expect(within(dock()).getAllByRole('listitem')).toHaveLength(1)
  })

  test('a tick that omits the last tool name does not blank the one already shown', async () => {
    await startSession()
    openDock()
    harness.emit(liveEvent({ toolUses: 1, lastToolName: 'Read' }))
    expect(await screen.findByText('1 tool · Read')).toBeTruthy()

    harness.emit(liveEvent({ toolUses: 2 }))

    expect(await screen.findByText('2 tools · Read')).toBeTruthy()
  })

  test('status settles to done when the agent finishes', async () => {
    await startSession()
    openDock()
    harness.emit(liveEvent())
    expect(await screen.findByText('running…')).toBeTruthy()

    harness.emit(liveEvent({ status: 'done', toolUses: 3 }))

    expect(await screen.findByText('done')).toBeTruthy()
    expect(screen.queryByText('running…')).toBeNull()
  })

  test('a genuine zero tool count is shown, not swallowed as missing data', async () => {
    await startSession()
    openDock()
    harness.emit(liveEvent({ toolUses: 0 }))

    expect(await screen.findByText('0 tools')).toBeTruthy()
  })

  test('rows stay after the turn ends so the fan-out can be reviewed', async () => {
    await startSession()
    openDock()
    harness.emit(liveEvent({ status: 'done' }))
    expect(await screen.findByText('general-purpose')).toBeTruthy()

    harness.emit({ type: 'turn-end' })

    expect(await screen.findByText('general-purpose')).toBeTruthy()
  })

  test('an agent that started while the dock was closed is there when it opens', async () => {
    await startSession()
    harness.emit(liveEvent())
    openDock()

    expect(await screen.findByText('general-purpose')).toBeTruthy()
  })

  test('an agent on disk that runs again is one row, with the live fields winning', async () => {
    harness.api.listSubagents.mockResolvedValue([
      agent({ description: 'from disk', model: 'claude-sonnet-5', spawnDepth: 1 })
    ])
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()
    expect(await screen.findByText('from disk')).toBeTruthy()

    // Same correlation key as the sidecar — this is the same agent, running again.
    harness.emit(
      liveEvent({ parentToolUseId: 'task-1', description: 'running again', totalTokens: 52000 })
    )

    // Scoped to the dock — the sessions rail renders list items of its own.
    expect(within(dock()).getAllByRole('listitem')).toHaveLength(1)
    expect(await screen.findByText('running again')).toBeTruthy()
    expect(screen.queryByText('from disk')).toBeNull()
    // The disk-only fields survive the merge rather than being dropped.
    expect(screen.getByText('claude-sonnet-5 · depth 1')).toBeTruthy()
  })

  test('a disk-only row shows no status and no usage numbers beside a live one', async () => {
    harness.api.listSubagents.mockResolvedValue([
      agent({ agentId: 'd1', parentToolUseId: 'disk-only', description: 'never ran again' })
    ])
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()
    expect(await screen.findByText('never ran again')).toBeTruthy()

    harness.emit(liveEvent({ toolUses: 4 }))

    expect(await screen.findByText('4 tools')).toBeTruthy()
    // One status label and one stats line in the whole list — the live row's.
    expect(screen.getAllByText('running…')).toHaveLength(1)
    expect(document.querySelectorAll('.agent-row-stats')).toHaveLength(1)
    expect(screen.queryByText(/0 tools/)).toBeNull()
  })

  test('live rows still show when the agent directory cannot be read', async () => {
    harness.api.listSubagents.mockResolvedValue(null)
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()
    expect(await screen.findByText(/Could not read this session/)).toBeTruthy()

    harness.emit(liveEvent())

    expect(await screen.findByText('general-purpose')).toBeTruthy()
    expect(screen.queryByText(/Could not read this session/)).toBeNull()
  })

  test('clicking a live row opens that agent in the drawer', async () => {
    harness.api.subagentTranscript.mockResolvedValue([
      { role: 'assistant', text: 'found the config' }
    ])
    await startSession()
    openDock()
    harness.emit(liveEvent())

    fireEvent.click(await screen.findByText('general-purpose'))

    expect(screen.getByRole('dialog', { name: 'Subagent general-purpose' })).toBeTruthy()
  })
})

// The tree half. Depth comes from the sidecar's parentAgentId alone — the pure
// assembly is covered in agent-layout.test.ts, so these are seam tests: does the
// panel render the tree, and is a nested agent still openable.
describe('agents dock — nesting', () => {
  const listRows = (): HTMLElement[] => within(dock()).getAllByRole('listitem')

  const showAgents = async (agents: SubagentInfo[]): Promise<void> => {
    harness.api.listSubagents.mockResolvedValue(agents)
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()
  }

  const spine = (): SubagentInfo[] => [
    agent({ parentToolUseId: 'task-1', agentId: 'root-a', description: 'top level' }),
    agent({
      parentToolUseId: 'task-2',
      agentId: 'kid-b',
      agentType: 'general-purpose',
      description: 'spawned by the explorer',
      parentAgentId: 'root-a'
    }),
    agent({
      parentToolUseId: 'task-3',
      agentId: 'grandkid-c',
      agentType: 'Plan',
      description: 'spawned by the kid',
      parentAgentId: 'kid-b'
    })
  ]

  test('an agent spawned by another renders indented directly beneath it, three deep', async () => {
    await showAgents(spine())
    expect(await screen.findByText('spawned by the kid')).toBeTruthy()

    const rows = listRows()
    expect(rows.map((li) => li.querySelector('.agent-row-desc')?.textContent)).toEqual([
      'top level',
      'spawned by the explorer',
      'spawned by the kid'
    ])
    // Indentation is the depth, and it keeps stepping past two levels.
    expect(rows.map((li) => li.style.paddingLeft)).toEqual(['', '14px', '28px'])
    // The same depth reaches a screen reader, which cannot see the padding.
    expect(rows.map((li) => li.getAttribute('aria-level'))).toEqual(['1', '2', '3'])
  })

  test('clicking a nested agent opens its conversation in the drawer', async () => {
    harness.api.subagentTranscript.mockResolvedValue([
      { role: 'assistant', text: 'the grandchild reported back' }
    ])
    await showAgents(spine())
    expect(await screen.findByText('spawned by the kid')).toBeTruthy()
    // Pin that the row being clicked is genuinely a nested one, or this passes
    // just as well against a flat list.
    expect(listRows()[2].style.paddingLeft).toBe('28px')

    fireEvent.click(screen.getByText('spawned by the kid'))

    expect(await screen.findByText('the grandchild reported back')).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Subagent Plan' })).toBeTruthy()
    // Depth is no barrier: the drawer resolves by tool-use id like any other row.
    expect(harness.api.subagentTranscript).toHaveBeenCalledWith('sess-1', 'task-3')
  })

  test('a session with no nesting is a flat list with no indentation at all', async () => {
    await showAgents([
      agent({ parentToolUseId: 'task-1', agentId: 'a1', description: 'first' }),
      agent({ parentToolUseId: 'task-2', agentId: 'a2', description: 'second' })
    ])
    expect(await screen.findByText('second')).toBeTruthy()

    const rows = listRows()
    expect(rows).toHaveLength(2)
    expect(rows.map((li) => li.style.paddingLeft)).toEqual(['', ''])
    expect(dock().querySelectorAll('.agent-row--nested')).toHaveLength(0)
  })

  test('an agent naming a parent that is missing from the list still renders', async () => {
    await showAgents([
      agent({
        parentToolUseId: 'task-9',
        agentId: 'orphan',
        description: 'parent is not here',
        parentAgentId: 'never-listed'
      })
    ])

    expect(await screen.findByText('parent is not here')).toBeTruthy()
    expect(listRows()[0].style.paddingLeft).toBe('')
  })
})

describe('agents dock — map mode', () => {
  const liveEvent = (over: Record<string, unknown> = {}): EngineEvent =>
    ({
      type: 'subagent',
      parentToolUseId: 'toolu-1',
      status: 'running',
      agentType: 'general-purpose',
      description: 'Reading notes.txt',
      ...over
    }) as EngineEvent

  const showAgents = async (agents: SubagentInfo[]): Promise<void> => {
    harness.api.listSubagents.mockResolvedValue(agents)
    await startSession([sess('sess-1', 'past work')])
    fireEvent.click(await screen.findByText('past work'))
    openDock()
  }

  test('the Map toggle swaps the list for the map', async () => {
    await showAgents([agent({ description: 'look around' })])
    expect(await screen.findByText('look around')).toBeTruthy()
    expect(within(dock()).getByRole('list')).toBeTruthy()

    fireEvent.click(within(dock()).getByRole('button', { name: 'Map view' }))

    expect(within(dock()).queryByRole('list')).toBeNull()
    expect(within(dock()).getByRole('group', { name: 'Agent map' })).toBeTruthy()

    fireEvent.click(within(dock()).getByRole('button', { name: 'List view' }))

    expect(within(dock()).getByRole('list')).toBeTruthy()
    expect(within(dock()).queryByRole('group', { name: 'Agent map' })).toBeNull()
  })

  test('every agent gets a node whose name starts with its type', async () => {
    await showAgents([
      agent({ parentToolUseId: 'task-1', agentId: 'a1', agentType: 'Explore' }),
      agent({ parentToolUseId: 'task-2', agentId: 'a2', agentType: 'Plan' }),
      agent({ parentToolUseId: 'task-3', agentId: 'a3', agentType: 'general-purpose' })
    ])
    expect(await screen.findByText('Explore')).toBeTruthy()

    fireEvent.click(within(dock()).getByRole('button', { name: 'Map view' }))

    const map = within(dock()).getByRole('group', { name: 'Agent map' })
    const nodes = within(map)
      .getAllByRole('button')
      .filter((el) => /^(Explore|Plan|general-purpose)/.test(el.getAttribute('aria-label') ?? ''))
    expect(nodes).toHaveLength(3)
  })

  test('clicking a node opens the drawer for that agent', async () => {
    harness.api.subagentTranscript.mockResolvedValue([
      { role: 'assistant', text: 'found the config' }
    ])
    await showAgents([agent({ description: 'look around' })])
    expect(await screen.findByText('look around')).toBeTruthy()

    fireEvent.click(within(dock()).getByRole('button', { name: 'Map view' }))
    fireEvent.click(within(dock()).getByRole('button', { name: /^Explore/ }))

    expect(await screen.findByText('found the config')).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Subagent Explore' })).toBeTruthy()
    expect(harness.api.subagentTranscript).toHaveBeenCalledWith('sess-1', 'task-1')
  })

  test('selection is preserved across the list/map toggle', async () => {
    await showAgents([
      agent({ parentToolUseId: 'task-1', agentId: 'a1', agentType: 'Explore', description: 'one' }),
      agent({ parentToolUseId: 'task-2', agentId: 'a2', agentType: 'Plan', description: 'two' })
    ])
    expect(await screen.findByText('one')).toBeTruthy()

    fireEvent.click(screen.getByText('one'))
    fireEvent.click(within(dock()).getByRole('button', { name: 'Map view' }))

    const selected = within(dock()).getByRole('button', { name: /^Explore/ })
    expect(selected.getAttribute('aria-current')).toBe('true')
  })

  test('a live agent shows up as a node in map mode', async () => {
    await startSession()
    openDock()
    harness.emit(liveEvent())
    expect(await screen.findByText('general-purpose')).toBeTruthy()

    fireEvent.click(within(dock()).getByRole('button', { name: 'Map view' }))

    expect(
      within(dock()).getByRole('button', { name: /^general-purpose/ })
    ).toBeTruthy()
  })

  test('a failed live agent carries the failed status class, with no status text', async () => {
    await startSession()
    openDock()
    harness.emit(liveEvent({ status: 'failed' }))
    expect(await screen.findByText('failed')).toBeTruthy()

    fireEvent.click(within(dock()).getByRole('button', { name: 'Map view' }))

    const node = within(dock()).getByRole('button', { name: /^general-purpose/ })
    // SVG <g> exposes className as SVGAnimatedString, not a string.
    expect(node.getAttribute('class')).toContain('agent-map-node--failed')
    expect(within(dock()).queryByText('failed')).toBeNull()
  })

  // The hit circles are sized from the tightest gap between siblings. A nested
  // spine stacks parent and child on one x in different bands, so measuring that
  // as a gap collapses every target to r=0 and the whole map goes dead to the
  // mouse. jsdom does no hit testing, so a click test cannot see this: assert the
  // radius itself.
  test('nested nodes keep a clickable hit target', async () => {
    await showAgents([
      agent({ parentToolUseId: 't1', agentId: 'a', agentType: 'Explore' }),
      agent({ parentToolUseId: 't2', agentId: 'b', agentType: 'Plan', parentAgentId: 'a' }),
      agent({ parentToolUseId: 't3', agentId: 'c', agentType: 'Review', parentAgentId: 'b' })
    ])
    expect(await screen.findByText('Explore')).toBeTruthy()

    fireEvent.click(within(dock()).getByRole('button', { name: 'Map view' }))

    const hits = within(dock())
      .getByRole('group', { name: 'Agent map' })
      .querySelectorAll('.agent-map-hit')
    expect(hits).toHaveLength(3)
    for (const hit of hits) {
      expect(Number(hit.getAttribute('r'))).toBeGreaterThan(0)
    }
  })

  test('exactly one agent still renders a map', async () => {
    await showAgents([agent({ description: 'solo' })])
    expect(await screen.findByText('solo')).toBeTruthy()

    fireEvent.click(within(dock()).getByRole('button', { name: 'Map view' }))

    const map = within(dock()).getByRole('group', { name: 'Agent map' })
    expect(within(map).getAllByRole('button')).toHaveLength(1)
    expect(map.querySelector('.agent-map-node-session')).toBeTruthy()
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
