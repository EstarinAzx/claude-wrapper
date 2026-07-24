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

const startSession = async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const send = (text: string) => {
  const input = screen.getByPlaceholderText('Message Claude…')
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

// Drive a Task tool-use + a subagent presence event onto the pane.
const spawnTask = (parentToolUseId = 'task-1', agentType = 'Explore') => {
  send('go delegate')
  harness.emit({
    type: 'tool-use',
    id: parentToolUseId,
    name: 'Task',
    input: { subagent_type: agentType, description: 'look around' }
  })
  harness.emit({ type: 'subagent', parentToolUseId, status: 'running' })
}

describe('subagent viewer', () => {
  test('a subagent event grows a working-list row on its Task card', async () => {
    await startSession()
    spawnTask()
    const row = document.querySelector('.subagent-row')
    expect(row).toBeTruthy()
    expect(row?.textContent).toContain('Explore')
    expect(row?.textContent).toContain('running')
  })

  test('the row status flips running → done', async () => {
    await startSession()
    spawnTask()
    expect(document.querySelector('.subagent-row--running')).toBeTruthy()
    harness.emit({ type: 'subagent', parentToolUseId: 'task-1', status: 'done' })
    expect(document.querySelector('.subagent-row--running')).toBeNull()
    expect(document.querySelector('.subagent-row--done')?.textContent).toContain('done')
  })

  test('clicking the row opens a read-only drawer with the subagent transcript', async () => {
    await startSession()
    harness.api.currentSessionId.mockResolvedValue('sess-1')
    harness.api.subagentTranscript.mockResolvedValue([
      { role: 'user', text: 'look around' },
      { role: 'assistant', text: 'found the config' }
    ])
    spawnTask()

    fireEvent.click(document.querySelector('.subagent-row') as Element)

    expect(await screen.findByText('found the config')).toBeTruthy()
    expect(screen.getByRole('dialog', { name: 'Subagent Explore' })).toBeTruthy()
    expect(harness.api.subagentTranscript).toHaveBeenCalledWith('sess-1', 'task-1')
  })

  test('the drawer closes via its close button', async () => {
    await startSession()
    harness.api.currentSessionId.mockResolvedValue('sess-1')
    harness.api.subagentTranscript.mockResolvedValue([{ role: 'assistant', text: 'hi from sub' }])
    spawnTask()

    fireEvent.click(document.querySelector('.subagent-row') as Element)
    await screen.findByText('hi from sub')

    fireEvent.click(screen.getByRole('button', { name: 'Close viewer' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  test('subagent output does not leak: no orphan tool card for a tagged inner tool', async () => {
    await startSession()
    spawnTask()
    // Only the Task card exists — the subagent's own inner tools never emitted
    // main-thread tool-use events (engine buckets them), so there is exactly one card.
    expect(document.querySelectorAll('.tool-card').length).toBe(1)
  })
})
