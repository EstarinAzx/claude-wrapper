import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useChat } from '../src/renderer/src/useChat'
import { fakeChatApi } from './chat-harness'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
})

describe('liveAgents accumulation', () => {
  test('agent appears on first running event with supplied fields', () => {
    const { result } = renderHook(() => useChat())
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'running',
      agentType: 'Explore',
      description: 'scan the repo'
    })
    const agents = result.current.liveAgents
    expect(agents).toHaveLength(1)
    expect(agents[0]).toMatchObject({
      parentToolUseId: 't1',
      status: 'running',
      agentType: 'Explore',
      description: 'scan the repo'
    })
  })

  test('second event for same id updates in place', () => {
    const { result } = renderHook(() => useChat())
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'running',
      agentType: 'Explore'
    })
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'running',
      totalTokens: 1200,
      toolUses: 3,
      lastToolName: 'Read'
    })
    const agents = result.current.liveAgents
    expect(agents).toHaveLength(1)
    expect(agents[0]).toMatchObject({
      parentToolUseId: 't1',
      status: 'running',
      agentType: 'Explore',
      totalTokens: 1200,
      toolUses: 3,
      lastToolName: 'Read'
    })
  })

  test('omitted lastToolName does not erase a previously known one', () => {
    const { result } = renderHook(() => useChat())
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'running',
      lastToolName: 'Bash'
    })
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'running',
      totalTokens: 500
    })
    expect(result.current.liveAgents[0].lastToolName).toBe('Bash')
    expect(result.current.liveAgents[0].totalTokens).toBe(500)
  })

  test('status moves to done on a completion event', () => {
    const { result } = renderHook(() => useChat())
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'running'
    })
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'done',
      durationMs: 4200
    })
    expect(result.current.liveAgents[0].status).toBe('done')
    expect(result.current.liveAgents[0].durationMs).toBe(4200)
  })

  test('two different agents produce two entries in first-seen order', () => {
    const { result } = renderHook(() => useChat())
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'running',
      agentType: 'Explore'
    })
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't2',
      status: 'running',
      agentType: 'Plan'
    })
    const agents = result.current.liveAgents
    expect(agents).toHaveLength(2)
    expect(agents[0].parentToolUseId).toBe('t1')
    expect(agents[1].parentToolUseId).toBe('t2')
  })

  test('turn-end does not clear the liveAgents list', () => {
    const { result } = renderHook(() => useChat())
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'done'
    })
    harness.emit({ type: 'turn-end' })
    expect(result.current.liveAgents).toHaveLength(1)
    expect(result.current.liveAgents[0].parentToolUseId).toBe('t1')
  })

  test('event with no usage fields leaves those keys absent', () => {
    const { result } = renderHook(() => useChat())
    harness.emit({
      type: 'subagent',
      parentToolUseId: 't1',
      status: 'running'
    })
    const agents = result.current.liveAgents
    expect('totalTokens' in agents[0]).toBe(false)
    expect('toolUses' in agents[0]).toBe(false)
    expect('durationMs' in agents[0]).toBe(false)
    expect('lastToolName' in agents[0]).toBe(false)
    expect('taskId' in agents[0]).toBe(false)
    expect('agentType' in agents[0]).toBe(false)
    expect('description' in agents[0]).toBe(false)
  })
})
