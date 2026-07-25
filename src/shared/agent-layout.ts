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
