---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# The agent tree's only edge is the sidecar's `parentAgentId`

**Decision:** #31 builds nesting from the on-disk sidecar field alone, and
**does not** use the `taskToParent` map or the `Agent` tool_use block that
[[2026-07-25-live-rows-two-sources-one-event]] nominated as "the natural place
to hang the parent edge". Four choices, all load-bearing for #33.

**1. Sidecar-only, live stream contributes nothing.** The edge is
`child.parentAgentId === parent.agentId`, read straight off the sidecar #28's
parser already kept. The live route was open — a nested agent's `task_started`
arrives, and the `Agent` tool_use block naming it sits inside a message tagged
with the *outer* agent's id, so the parent could be recovered by correlating
the two. It was declined because it costs engine work, a second correlation
table and a new failure mode, to earn nesting a few seconds earlier for the
~1-in-185 agents that are nested at all. **Consequence, accepted:** a nested
agent renders top-level while it is live and nests on the next disk read. That
is a known lag, not a bug to chase — and it is exactly the thing to revisit if
nesting ever stops being rare.

**2. The layout module is pure and lands now, tree half only.**
`src/shared/agent-layout.ts` exports `buildAgentTree(rows)` and
`flattenAgentTree(nodes)`, taking `AgentRow[]` and nothing else. #33's map must
call the same `buildAgentTree` and derive geometry from its output — a second
traversal in the map component is the thing this module exists to prevent.
`AgentNode.depth` is computed by the walk; **`spawnDepth` on the sidecar is not
the tree depth** and must not be used as one.

**3. Flat-with-a-depth in the DOM, not nested `<ul>`s.** The dock renders
`flattenAgentTree(...)` as one `<li>` per agent with `paddingLeft: depth * 14`
and an `aria-level`. Nested lists would put extra elements and extra CSS in the
path of the common case, which is a completely flat list; the inline style is
omitted entirely at depth 0, so a session with no nesting has no indentation
machinery in its markup at all. The tree is still a real tree in the module, so
swapping the render for nested lists later touches only `AgentsDock`.

**4. Nothing disappears, ever.** A row naming a parent absent from the list
degrades to a root; a self-parent is a root; a cycle is promoted to a root
rather than hanging or swallowing rows. Every input row appears exactly once in
the output. The panel is an inspection surface — a missing row is worse than a
mis-indented one.

**Why:** The ticket's own framing ("no inference is required") points at the
sidecar, and taking it kept #31 to a pure module plus a passthrough with zero
engine diff, on a session where the engine had just been reworked by #30.
Deriving the edge live would have coupled nesting to the message stream at the
moment the stream had one week of observed behaviour behind it.

**Reversibility:** Cheap, and the seams are already right. Live nesting = add
`parentAgentId` to `LiveAgent`, populate it in `subagentEvent()`, and let
`mergeAgents` prefer live like every other field — `buildAgentTree` needs no
change because it reads `AgentRow`, not a source. The render swap is contained
in `AgentsDock`. The passthrough is mutation-verified: deleting the
`parentAgentId` line in `mergeAgents` reds both `tests/agents-merge.test.ts`
and the three-deep test in `tests/agents-dock.test.tsx`.

## For #33 (map mode)

- Call `buildAgentTree(rows)` and lay out its `AgentNode[]`. Do not re-derive
  parentage, and do not read `spawnDepth` as depth.
- `flattenAgentTree` is pre-order, so a list-order-matching walk is free.
- The map inherits the same degradation: orphans and cycle members are roots.

## Related

- [[decisions]]
- [[2026-07-25-live-rows-two-sources-one-event]] — nominated the live edge this
  decision declines
- [[2026-07-25-task-messages-confirmed-live-shape]] — why forwarded traffic
  cannot carry parentage
- [[2026-07-25-sidecar-model-is-family-not-resolved]] — the same sidecar survey
  that measured `parentAgentId` at 0 of 28
- [[active-work]] · [[pick-up]]
