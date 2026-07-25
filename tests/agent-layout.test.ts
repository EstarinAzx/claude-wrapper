import { describe, test, expect } from 'vitest'
import { buildAgentTree, flattenAgentTree } from '../src/shared/agent-layout'
import type { AgentRow } from '../src/shared/subagent-types'

const row = (partial: Partial<AgentRow> & Pick<AgentRow, 'parentToolUseId'>): AgentRow => ({
  agentType: 'Explore',
  ...partial
})

describe('buildAgentTree', () => {
  test('a flat list of parentless rows produces all roots at depth 0', () => {
    const rows = [
      row({ parentToolUseId: 't1', agentId: 'a1' }),
      row({ parentToolUseId: 't2', agentId: 'a2' }),
      row({ parentToolUseId: 't3', agentId: 'a3' })
    ]
    const tree = buildAgentTree(rows)
    expect(tree).toHaveLength(3)
    expect(tree.map((n) => n.row.agentId)).toEqual(['a1', 'a2', 'a3'])
    for (const n of tree) {
      expect(n.depth).toBe(0)
      expect(n.children).toEqual([])
    }
  })

  test('a child naming its parent agentId is nested under it and is not also a root', () => {
    const rows = [
      row({ parentToolUseId: 't1', agentId: 'parent' }),
      row({ parentToolUseId: 't2', agentId: 'child', parentAgentId: 'parent' })
    ]
    const tree = buildAgentTree(rows)
    expect(tree).toHaveLength(1)
    expect(tree[0].row.agentId).toBe('parent')
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].row.agentId).toBe('child')
    expect(tree[0].children[0].depth).toBe(1)
  })

  test('multi-level nesting a → b → c → d produces depths 0,1,2,3', () => {
    const rows = [
      row({ parentToolUseId: 't1', agentId: 'a' }),
      row({ parentToolUseId: 't2', agentId: 'b', parentAgentId: 'a' }),
      row({ parentToolUseId: 't3', agentId: 'c', parentAgentId: 'b' }),
      row({ parentToolUseId: 't4', agentId: 'd', parentAgentId: 'c' })
    ]
    const flat = flattenAgentTree(buildAgentTree(rows))
    expect(flat.map((n) => [n.row.agentId, n.depth])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
      ['d', 3]
    ])
  })

  test('two children of the same parent keep input order', () => {
    const rows = [
      row({ parentToolUseId: 'tp', agentId: 'p' }),
      row({ parentToolUseId: 't2', agentId: 'c2', parentAgentId: 'p' }),
      row({ parentToolUseId: 't1', agentId: 'c1', parentAgentId: 'p' })
    ]
    // c2 appears before c1 in input even though names suggest otherwise.
    const tree = buildAgentTree(rows)
    expect(tree[0].children.map((n) => n.row.agentId)).toEqual(['c2', 'c1'])
  })

  test('a row naming a parent absent from the list still appears as a root', () => {
    const rows = [row({ parentToolUseId: 't1', agentId: 'orphan', parentAgentId: 'missing' })]
    const tree = buildAgentTree(rows)
    expect(tree).toHaveLength(1)
    expect(tree[0].row.agentId).toBe('orphan')
    expect(tree[0].depth).toBe(0)
  })

  test('a self-parenting row appears once as a root', () => {
    const rows = [row({ parentToolUseId: 't1', agentId: 'loop', parentAgentId: 'loop' })]
    const tree = buildAgentTree(rows)
    expect(tree).toHaveLength(1)
    expect(tree[0].row.agentId).toBe('loop')
    expect(tree[0].children).toEqual([])
    expect(flattenAgentTree(tree)).toHaveLength(1)
  })

  test('a two-node cycle terminates and yields both rows exactly once', () => {
    const rows = [
      row({ parentToolUseId: 't1', agentId: 'a', parentAgentId: 'b' }),
      row({ parentToolUseId: 't2', agentId: 'b', parentAgentId: 'a' })
    ]
    const tree = buildAgentTree(rows)
    const flat = flattenAgentTree(tree)
    expect(flat).toHaveLength(2)
    expect(flat.map((n) => n.row.agentId).sort()).toEqual(['a', 'b'])
    // First in input order is promoted to root; the other nests under it.
    expect(tree[0].row.agentId).toBe('a')
    expect(tree[0].depth).toBe(0)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].row.agentId).toBe('b')
    expect(tree[0].children[0].depth).toBe(1)
  })

  test('root order follows input order', () => {
    const rows = [
      row({ parentToolUseId: 't3', agentId: 'c' }),
      row({ parentToolUseId: 't1', agentId: 'a' }),
      row({ parentToolUseId: 't2', agentId: 'b' })
    ]
    expect(buildAgentTree(rows).map((n) => n.row.agentId)).toEqual(['c', 'a', 'b'])
  })

  test('inputs are not mutated', () => {
    const rows: AgentRow[] = [
      row({ parentToolUseId: 't1', agentId: 'a' }),
      row({ parentToolUseId: 't2', agentId: 'b', parentAgentId: 'a' })
    ]
    const snap = structuredClone(rows)
    buildAgentTree(rows)
    expect(rows).toEqual(snap)
  })

  test('an empty input returns an empty array', () => {
    expect(buildAgentTree([])).toEqual([])
  })

  test('a row with no agentId does not become the parent of a row with undefined parentAgentId', () => {
    const rows = [
      row({ parentToolUseId: 't1' }),
      row({ parentToolUseId: 't2', agentId: 'named' })
    ]
    const tree = buildAgentTree(rows)
    expect(tree).toHaveLength(2)
    expect(tree[0].children).toEqual([])
    expect(tree[1].children).toEqual([])
    expect(tree[0].row.agentId).toBeUndefined()
    expect(tree[1].row.agentId).toBe('named')
  })
})

describe('flattenAgentTree', () => {
  test('returns pre-order with correct depths for a mixed tree', () => {
    // root A → child B → grandchild C, then root D
    const rows = [
      row({ parentToolUseId: 'tA', agentId: 'A' }),
      row({ parentToolUseId: 'tB', agentId: 'B', parentAgentId: 'A' }),
      row({ parentToolUseId: 'tC', agentId: 'C', parentAgentId: 'B' }),
      row({ parentToolUseId: 'tD', agentId: 'D' })
    ]
    const flat = flattenAgentTree(buildAgentTree(rows))
    expect(flat.map((n) => [n.row.agentId, n.depth])).toEqual([
      ['A', 0],
      ['B', 1],
      ['C', 2],
      ['D', 0]
    ])
  })

  test('an empty input returns an empty array', () => {
    expect(flattenAgentTree([])).toEqual([])
  })
})
