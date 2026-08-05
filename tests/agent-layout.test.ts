import { describe, test, expect } from 'vitest'
import { buildAgentTree, flattenAgentTree, layoutAgentMap } from '../src/shared/agent-layout'
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

describe('layoutAgentMap', () => {
  test('depth separates nodes', () => {
    const rows = [
      row({ parentToolUseId: 'ta', agentId: 'a' }),
      row({ parentToolUseId: 'tb', agentId: 'b', parentAgentId: 'a' }),
      row({ parentToolUseId: 'tc', agentId: 'c', parentAgentId: 'b' })
    ]
    const { nodes } = layoutAgentMap(rows)
    const byDepth = new Map<number, number[]>()
    for (const n of nodes) {
      const ys = byDepth.get(n.depth) ?? []
      ys.push(n.y)
      byDepth.set(n.depth, ys)
    }
    const depths = [...byDepth.keys()].sort((a, b) => a - b)
    for (let i = 0; i < depths.length - 1; i++) {
      const upper = Math.max(...(byDepth.get(depths[i]) as number[]))
      const lower = Math.min(...(byDepth.get(depths[i + 1]) as number[]))
      expect(upper).toBeLessThan(lower)
    }
    const session = nodes.find((n) => n.kind === 'session')
    expect(session).toBeDefined()
    for (const n of nodes) {
      if (n.kind === 'agent') expect(session!.y).toBeLessThan(n.y)
    }
  })

  test('every edge connects two placed nodes', () => {
    const rows = [
      row({ parentToolUseId: 't1', agentId: 'a' }),
      row({ parentToolUseId: 't2', agentId: 'b', parentAgentId: 'a' }),
      row({ parentToolUseId: 't3', agentId: 'c' })
    ]
    const { nodes, edges } = layoutAgentMap(rows)
    const byId = new Map(nodes.map((n) => [n.id, n]))
    for (const e of edges) {
      const from = byId.get(e.from)
      const to = byId.get(e.to)
      expect(from).toBeDefined()
      expect(to).toBeDefined()
      // x is untouched by the inset — the curve leaves both ends vertically.
      expect(e.fromX).toBe(from!.x)
      expect(e.toX).toBe(to!.x)
      // y is pulled back to each node's rim, so the edge starts BELOW its
      // parent's centre and ends ABOVE its child's, never at either centre.
      expect(e.fromY).toBeGreaterThan(from!.y)
      expect(e.toY).toBeLessThan(to!.y)
      expect(e.fromY).toBeLessThan(e.toY)
    }
  })

  // The whole point of the inset: an edge must stop at the node's rim rather
  // than run under the glyph. Asserted as a clearance, not as an exact
  // coordinate, so retuning the gap does not force a test rewrite.
  test('edges clear the rim of the nodes they join', () => {
    const rows = [
      row({ parentToolUseId: 'tp', agentId: 'p' }),
      row({ parentToolUseId: 'tc', agentId: 'c', parentAgentId: 'p' })
    ]
    const { nodes, edges, nodeRadius, sessionRadius } = layoutAgentMap(rows)
    const byId = new Map(nodes.map((n) => [n.id, n]))
    expect(edges.length).toBeGreaterThan(0)
    for (const e of edges) {
      const from = byId.get(e.from)!
      const to = byId.get(e.to)!
      const fromR = from.kind === 'session' ? sessionRadius : nodeRadius
      expect(e.fromY - from.y).toBeGreaterThan(fromR)
      expect(to.y - e.toY).toBeGreaterThan(nodeRadius)
    }
  })

  // The session is the origin and reads as such by SIZE, never by taking the
  // accent — colour is spoken for by status.
  test('the session mark is larger than an agent mark', () => {
    const { nodeRadius, sessionRadius } = layoutAgentMap([
      row({ parentToolUseId: 't1', agentId: 'a' })
    ])
    expect(sessionRadius).toBeGreaterThan(nodeRadius)
  })

  test('the same agent list always produces identical coordinates', () => {
    const rows = [
      row({ parentToolUseId: 't1', agentId: 'a' }),
      row({ parentToolUseId: 't2', agentId: 'b', parentAgentId: 'a' }),
      row({ parentToolUseId: 't3', agentId: 'c' })
    ]
    expect(layoutAgentMap(rows)).toEqual(layoutAgentMap(rows))
    // Equal-but-distinct input, so the guarantee is "same list" and not "same
    // array reference" — a live tick rebuilds the rows array every render.
    expect(layoutAgentMap(structuredClone(rows))).toEqual(layoutAgentMap(rows))
  })

  test('one agent is centred under the session with two nodes and one edge', () => {
    const rows = [row({ parentToolUseId: 't1', agentId: 'a' })]
    const map = layoutAgentMap(rows)
    expect(map.nodes).toHaveLength(2)
    expect(map.edges).toHaveLength(1)
    const session = map.nodes.find((n) => n.kind === 'session')!
    const agent = map.nodes.find((n) => n.kind === 'agent')!
    expect(agent.x).toBe(map.width / 2)
    expect(agent.x).toBe(session.x)
  })

  test('an empty list places the session alone, centred', () => {
    const map = layoutAgentMap([])
    expect(map.nodes).toHaveLength(1)
    expect(map.nodes[0].kind).toBe('session')
    expect(map.edges).toHaveLength(0)
    expect(map.nodes[0].x).toBe(map.width / 2)
  })

  test('nesting edges come from the parent agent, not session', () => {
    const rows = [
      row({ parentToolUseId: 'tp', agentId: 'parent' }),
      row({ parentToolUseId: 'tc', agentId: 'child', parentAgentId: 'parent' })
    ]
    const { edges } = layoutAgentMap(rows)
    const childEdge = edges.find((e) => e.to === 'tc')
    expect(childEdge).toBeDefined()
    expect(childEdge!.from).toBe('tp')
    expect(childEdge!.from).not.toBe('session')
  })

  test('a flat fan centres the session on the agents x range', () => {
    const rows = [
      row({ parentToolUseId: 't1', agentId: 'a' }),
      row({ parentToolUseId: 't2', agentId: 'b' }),
      row({ parentToolUseId: 't3', agentId: 'c' })
    ]
    const { nodes } = layoutAgentMap(rows)
    const session = nodes.find((n) => n.kind === 'session')!
    const agents = nodes.filter((n) => n.kind === 'agent')
    const xs = agents.map((a) => a.x)
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2
    expect(session.x).toBe(mid)
    const ys = new Set(agents.map((a) => a.y))
    expect(ys.size).toBe(1)
  })

  test('node count is rows.length + 1 with unique ids, including orphan and cycle', () => {
    const orphanAndCycle = [
      row({ parentToolUseId: 'to', agentId: 'orphan', parentAgentId: 'missing' }),
      row({ parentToolUseId: 'ta', agentId: 'a', parentAgentId: 'b' }),
      row({ parentToolUseId: 'tb', agentId: 'b', parentAgentId: 'a' })
    ]
    const map = layoutAgentMap(orphanAndCycle)
    expect(map.nodes).toHaveLength(orphanAndCycle.length + 1)
    const ids = map.nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)

    const plain = [
      row({ parentToolUseId: 't1', agentId: 'x' }),
      row({ parentToolUseId: 't2', agentId: 'y' })
    ]
    expect(layoutAgentMap(plain).nodes).toHaveLength(plain.length + 1)
  })

  test('inputs are not mutated', () => {
    const rows: AgentRow[] = [
      row({ parentToolUseId: 't1', agentId: 'a' }),
      row({ parentToolUseId: 't2', agentId: 'b', parentAgentId: 'a' })
    ]
    const snap = structuredClone(rows)
    layoutAgentMap(rows)
    expect(rows).toEqual(snap)
  })

  // The panel is resizable down to 180px and the SVG scales this coordinate
  // space into it, so "renders sensibly when narrow" is a property of the data:
  // nodes stay inside the canvas and keep a usable radius as the fan widens.
  test('nodes stay inside the canvas from one agent up to a 28-wide fan', () => {
    for (const count of [1, 5, 28]) {
      const rows = Array.from({ length: count }, (_, i) =>
        row({ parentToolUseId: `t${i}`, agentId: `a${i}` })
      )
      const map = layoutAgentMap(rows)
      expect(map.nodeRadius).toBeGreaterThanOrEqual(3)
      expect(map.nodeRadius).toBeLessThanOrEqual(14)
      for (const n of map.nodes) {
        // Each mark is checked against ITS OWN half-extent — the session's is
        // the larger one, and checking it against nodeRadius would let the
        // biggest mark on the canvas be the one that clips.
        const half = n.kind === 'session' ? map.sessionRadius : map.nodeRadius
        expect(n.x - half).toBeGreaterThanOrEqual(0)
        expect(n.x + half).toBeLessThanOrEqual(map.width)
        expect(n.y - half).toBeGreaterThanOrEqual(0)
        expect(n.y + half).toBeLessThanOrEqual(map.height)
      }
    }
  })

  // The R_MAX raise is targeted: it may only affect fans small enough that the
  // cap is the binding term. A wide fan must come out byte-identical, because
  // that is the case with no room to spare.
  test('a wide fan is unaffected by the raised radius cap', () => {
    const rows = Array.from({ length: 28 }, (_, i) =>
      row({ parentToolUseId: `t${i}`, agentId: `a${i}` })
    )
    const map = layoutAgentMap(rows)
    // 240 / 28 = 8.57 slot units; 8.57 * 0.3 floors at R_MIN, so neither the
    // old cap of 9 nor the new one of 14 is reachable here.
    expect(map.nodeRadius).toBe(3)
  })

  // Sibling nodes must not overlap, or a dense fan reads as one blob and the
  // click targets fight each other.
  test('siblings in a wide fan stay visually separate', () => {
    const rows = Array.from({ length: 28 }, (_, i) =>
      row({ parentToolUseId: `t${i}`, agentId: `a${i}` })
    )
    const map = layoutAgentMap(rows)
    const xs = map.nodes
      .filter((n) => n.kind === 'agent')
      .map((n) => n.x)
      .sort((a, b) => a - b)
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeGreaterThan(map.nodeRadius)
    }
  })
})
