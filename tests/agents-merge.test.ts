import { describe, test, expect } from 'vitest'
import { mergeAgents } from '../src/shared/subagent-types'
import type { SubagentInfo, LiveAgent } from '../src/shared/subagent-types'

const disk = (partial: Partial<SubagentInfo> & Pick<SubagentInfo, 'parentToolUseId' | 'agentId'>): SubagentInfo => ({
  agentType: 'Explore',
  ...partial
})

const live = (partial: Partial<LiveAgent> & Pick<LiveAgent, 'parentToolUseId' | 'status'>): LiveAgent => ({
  ...partial
})

describe('mergeAgents', () => {
  test('a disk-only row has no usage numbers rather than zeros', () => {
    const rows = mergeAgents(
      [disk({ parentToolUseId: 't1', agentId: 'a1', agentType: 'Explore', model: 'sonnet' })],
      []
    )
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(row.parentToolUseId).toBe('t1')
    expect(row.agentId).toBe('a1')
    expect(row.agentType).toBe('Explore')
    expect(row.model).toBe('sonnet')
    expect(row.status).toBeUndefined()
    expect('totalTokens' in row).toBe(false)
    expect('toolUses' in row).toBe(false)
    expect('durationMs' in row).toBe(false)
    expect('lastToolName' in row).toBe(false)
  })

  test('a live-only row carries status and the usage fields that were supplied', () => {
    const rows = mergeAgents(
      [],
      [
        live({
          parentToolUseId: 't2',
          status: 'running',
          agentType: 'Plan',
          description: 'dig',
          totalTokens: 120,
          toolUses: 3,
          durationMs: 4000,
          lastToolName: 'Read'
        })
      ]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      parentToolUseId: 't2',
      agentType: 'Plan',
      description: 'dig',
      status: 'running',
      totalTokens: 120,
      toolUses: 3,
      durationMs: 4000,
      lastToolName: 'Read'
    })
    expect('agentId' in rows[0]).toBe(false)
    expect('model' in rows[0]).toBe(false)
  })

  test('the same parentToolUseId on both sides yields one row with live winning description and agentType', () => {
    const rows = mergeAgents(
      [
        disk({
          parentToolUseId: 't3',
          agentId: 'a3',
          agentType: 'Explore',
          description: 'disk desc',
          model: 'opus',
          spawnDepth: 1
        })
      ],
      [
        live({
          parentToolUseId: 't3',
          status: 'done',
          agentType: 'general-purpose',
          description: 'live desc',
          totalTokens: 50,
          toolUses: 2
        })
      ]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      parentToolUseId: 't3',
      agentType: 'general-purpose',
      agentId: 'a3',
      description: 'live desc',
      model: 'opus',
      spawnDepth: 1,
      status: 'done',
      totalTokens: 50,
      toolUses: 2
    })
  })

  test('a live agent reporting toolUses 0 keeps the key present with value 0', () => {
    const rows = mergeAgents(
      [],
      [live({ parentToolUseId: 't4', status: 'running', toolUses: 0, totalTokens: 0 })]
    )
    expect(rows).toHaveLength(1)
    expect('toolUses' in rows[0]).toBe(true)
    expect(rows[0].toolUses).toBe(0)
    expect('totalTokens' in rows[0]).toBe(true)
    expect(rows[0].totalTokens).toBe(0)
  })

  test("agentType falls back to 'Agent' when neither side names one", () => {
    const rows = mergeAgents(
      [disk({ parentToolUseId: 't5', agentId: 'a5', agentType: '' })],
      [live({ parentToolUseId: 't5', status: 'running', agentType: '' })]
    )
    expect(rows[0].agentType).toBe('Agent')
  })

  test('agentType falls back to Agent for a live-only row with no type', () => {
    const rows = mergeAgents(
      [],
      [live({ parentToolUseId: 't5b', status: 'failed' })]
    )
    expect(rows[0].agentType).toBe('Agent')
  })

  test('disk rows come first, then live-only rows, preserving each source order', () => {
    const rows = mergeAgents(
      [
        disk({ parentToolUseId: 'd1', agentId: 'a1' }),
        disk({ parentToolUseId: 'd2', agentId: 'a2' })
      ],
      [
        live({ parentToolUseId: 'l1', status: 'running' }),
        live({ parentToolUseId: 'd2', status: 'done' }),
        live({ parentToolUseId: 'l2', status: 'failed' })
      ]
    )
    expect(rows.map((r) => r.parentToolUseId)).toEqual(['d1', 'd2', 'l1', 'l2'])
    expect(rows[1].status).toBe('done')
  })

  test('inputs are not mutated', () => {
    const diskIn: SubagentInfo[] = [
      disk({ parentToolUseId: 't6', agentId: 'a6', description: 'orig' })
    ]
    const liveIn: LiveAgent[] = [
      live({ parentToolUseId: 't6', status: 'running', description: 'live' })
    ]
    const diskSnap = structuredClone(diskIn)
    const liveSnap = structuredClone(liveIn)
    mergeAgents(diskIn, liveIn)
    expect(diskIn).toEqual(diskSnap)
    expect(liveIn).toEqual(liveSnap)
  })

  test('live empty agentType does not overwrite a disk agentType', () => {
    const rows = mergeAgents(
      [disk({ parentToolUseId: 't7', agentId: 'a7', agentType: 'Explore' })],
      [live({ parentToolUseId: 't7', status: 'running', agentType: '' })]
    )
    expect(rows[0].agentType).toBe('Explore')
  })

  // The tree's only edge. It rides through the merge untouched because the live
  // stream has no parentage to contribute — and it must stay absent, not empty,
  // for a top-level agent, or every row would claim a parent named ''.
  test('parentAgentId survives the merge and stays absent when the sidecar omits it', () => {
    const rows = mergeAgents(
      [
        disk({ parentToolUseId: 't9', agentId: 'child', parentAgentId: 'boss' }),
        disk({ parentToolUseId: 't10', agentId: 'boss' })
      ],
      [live({ parentToolUseId: 't9', status: 'running' })]
    )
    expect(rows[0].parentAgentId).toBe('boss')
    expect('parentAgentId' in rows[1]).toBe(false)
  })

  test('a live-only row has no parentAgentId — the stream never reports parentage', () => {
    const rows = mergeAgents([], [live({ parentToolUseId: 't11', status: 'running' })])
    expect('parentAgentId' in rows[0]).toBe(false)
  })

  test('disk description is kept when live omits description', () => {
    const rows = mergeAgents(
      [disk({ parentToolUseId: 't8', agentId: 'a8', description: 'from disk' })],
      [live({ parentToolUseId: 't8', status: 'running' })]
    )
    expect(rows[0].description).toBe('from disk')
  })
})
