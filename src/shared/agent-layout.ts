// Tree layout for the Agents panel. Rows arrive flat from the merge; this module
// nests them by parentAgentId so the panel can render one indented row per agent,
// and so #33's map mode can reuse the same tree — one source of truth for geometry.

import type { AgentRow } from './subagent-types'

export interface AgentNode {
  row: AgentRow
  depth: number
  children: AgentNode[]
}

export const buildAgentTree = (rows: AgentRow[]): AgentNode[] => {
  // One node per input row, same object reference kept. Depth is filled in during
  // the walk so multi-level spines get parent.depth + 1 rather than a wire field.
  const nodes: AgentNode[] = rows.map((row) => ({ row, depth: 0, children: [] }))

  // First occurrence wins — duplicate agentIds shouldn't happen but must not throw.
  // Only non-empty ids are indexed so an absent agentId can never match an absent
  // parentAgentId (both-undefined would otherwise collide on a Map key).
  const byAgentId = new Map<string, AgentNode>()
  for (const node of nodes) {
    const id = node.row.agentId
    if (id !== undefined && id !== '' && !byAgentId.has(id)) {
      byAgentId.set(id, node)
    }
  }

  // Attach children in input order. A missing parent degrades to a root so the
  // row never disappears from the panel — the sidecar can name a parent that the
  // current list simply does not contain (filtered, live-only, not yet loaded).
  const attached = new Set<AgentNode>()
  for (const node of nodes) {
    const parentId = node.row.parentAgentId
    if (parentId === undefined || parentId === '') continue
    // Self-parent is nonsense on the wire; treat as root rather than a 1-cycle.
    if (parentId === node.row.agentId) continue
    const parent = byAgentId.get(parentId)
    if (parent === undefined) continue
    parent.children.push(node)
    attached.add(node)
  }

  const roots: AgentNode[] = []
  const placed = new Set<AgentNode>()

  // Descend, marking as we go. Children arrays are rebuilt to drop cycle
  // back-edges so the returned tree is acyclic by construction — flatten can
  // then recurse freely without revisiting a node.
  const walk = (node: AgentNode, depth: number): void => {
    if (placed.has(node)) return
    placed.add(node)
    node.depth = depth
    const kept: AgentNode[] = []
    for (const child of node.children) {
      if (placed.has(child)) continue
      walk(child, depth + 1)
      kept.push(child)
    }
    node.children = kept
  }

  // Genuine roots keep input order.
  for (const node of nodes) {
    if (attached.has(node)) continue
    roots.push(node)
    walk(node, 0)
  }

  // Cycle promotion: a ↔ b (or longer) has every member attached, so none became
  // a genuine root above. Emit each leftover once, in input order, as a root.
  for (const node of nodes) {
    if (placed.has(node)) continue
    roots.push(node)
    walk(node, 0)
  }

  return roots
}

// Pre-order (parent before its children, children in order) — what the renderer
// maps over for one indented row per agent. Safe to recurse: buildAgentTree
// returns an acyclic tree.
export const flattenAgentTree = (nodes: AgentNode[]): AgentNode[] => {
  const out: AgentNode[] = []
  const visit = (list: AgentNode[]): void => {
    for (const n of list) {
      out.push(n)
      if (n.children.length > 0) visit(n.children)
    }
  }
  visit(nodes)
  return out
}

// Map geometry: the same tree, placed. Coordinates are abstract viewBox units,
// not pixels — the dock is resizable 180–480px and the SVG scales one fixed
// coordinate space into whatever width it gets, which is why nothing here needs
// to know the panel size. Pure by construction, so the map is testable as data
// rather than by scraping numbers out of rendered SVG.

const CONTENT_W = 240
const MIN_SLOTS = 5
const BAND_H = 46
const PAD_Y = 22
const R_RATIO = 0.3
const R_MIN = 3
const R_MAX = 9

// Discriminated on `kind` so the renderer gets `row` narrowed to a real AgentRow
// after one check, rather than reaching for a non-null assertion at the only
// place that reads it. The session node is the sole rowless node by definition.
interface MapNodeBase {
  id: string
  x: number
  y: number
  depth: number
}

export type MapNode =
  | (MapNodeBase & { kind: 'session'; row?: undefined })
  | (MapNodeBase & { kind: 'agent'; row: AgentRow })

export interface MapEdge {
  id: string
  from: string
  to: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

export interface AgentMap {
  nodes: MapNode[]
  edges: MapEdge[]
  width: number
  height: number
  nodeRadius: number
}

const round2 = (n: number): number => Math.round(n * 100) / 100

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))

// Leaf count drives horizontal scale: each leaf claims one slot, internals
// sit at the midpoint of their children's span. Shared across the forest so
// sibling roots don't collide.
const countLeaves = (node: AgentNode): number => {
  if (node.children.length === 0) return 1
  let sum = 0
  for (const c of node.children) sum += countLeaves(c)
  return sum
}

export const layoutAgentMap = (rows: AgentRow[]): AgentMap => {
  const roots = buildAgentTree(rows)

  let leafCount = 0
  for (const r of roots) leafCount += countLeaves(r)

  const slotW = CONTENT_W / Math.max(leafCount, MIN_SLOTS)
  const offsetX = (CONTENT_W - leafCount * slotW) / 2

  // Pre-order place: leaves take successive slots; internals average kids.
  // Mutable x holder so parent midpoints can read children after the walk.
  type Placed = { node: AgentNode; x: number; children: Placed[] }
  let nextSlot = 0
  const place = (node: AgentNode): Placed => {
    if (node.children.length === 0) {
      const i = nextSlot++
      return { node, x: offsetX + (i + 0.5) * slotW, children: [] }
    }
    const kids = node.children.map(place)
    const x = (kids[0].x + kids[kids.length - 1].x) / 2
    return { node, x, children: kids }
  }
  const placedRoots = roots.map(place)

  const agentNodes: MapNode[] = []
  const emitAgents = (p: Placed): void => {
    // Tree depth d → map depth d+1 (session occupies 0).
    const depth = p.node.depth + 1
    agentNodes.push({
      id: p.node.row.parentToolUseId,
      kind: 'agent',
      x: round2(p.x),
      y: round2(PAD_Y + depth * BAND_H),
      depth,
      row: p.node.row
    })
    for (const c of p.children) emitAgents(c)
  }
  for (const p of placedRoots) emitAgents(p)

  // Session sits above the roots, centred on their span (or the canvas when empty).
  let sessionX: number
  if (placedRoots.length === 0) {
    sessionX = CONTENT_W / 2
  } else {
    sessionX = (placedRoots[0].x + placedRoots[placedRoots.length - 1].x) / 2
  }
  const sessionNode: MapNode = {
    id: 'session',
    kind: 'session',
    x: round2(sessionX),
    y: round2(PAD_Y),
    depth: 0
  }

  const nodes: MapNode[] = [sessionNode, ...agentNodes]
  const byId = new Map(nodes.map((n) => [n.id, n]))

  const edges: MapEdge[] = []
  const link = (fromId: string, toId: string): void => {
    const from = byId.get(fromId)
    const to = byId.get(toId)
    if (from === undefined || to === undefined) return
    edges.push({
      id: `${fromId}->${toId}`,
      from: fromId,
      to: toId,
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y
    })
  }
  for (const p of placedRoots) link('session', p.node.row.parentToolUseId)
  const linkKids = (p: Placed): void => {
    for (const c of p.children) {
      link(p.node.row.parentToolUseId, c.node.row.parentToolUseId)
      linkKids(c)
    }
  }
  for (const p of placedRoots) linkKids(p)

  let maxDepth = 0
  for (const n of nodes) if (n.depth > maxDepth) maxDepth = n.depth

  return {
    nodes,
    edges,
    width: round2(CONTENT_W),
    height: round2(PAD_Y * 2 + maxDepth * BAND_H),
    // ponytail: radius floors at R_MIN, so past ~40 leaves the outermost nodes
    // would clip the canvas edge. Real sessions top out around 28 (28 sidecars
    // is the largest observed) and 28 still fits. Inset the slot span by the
    // radius if a fan-out ever gets wide enough to matter.
    nodeRadius: round2(clamp(slotW * R_RATIO, R_MIN, R_MAX))
  }
}
