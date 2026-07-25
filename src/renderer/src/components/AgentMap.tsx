import type { AgentRow } from '../../../shared/subagent-types'
import { layoutAgentMap } from '../../../shared/agent-layout'

// SVG map of the session's agent tree. Geometry comes from layoutAgentMap — pure
// data, no pixel math here. Shape encodes kind (rounded square = session, circle =
// agent, diamond = failed); colour encodes status. No baked text: labels live in
// <title> + aria-label so a 180px panel still has a name for every node.
const AgentMap = ({
  rows,
  selectedId,
  onOpenAgent
}: {
  rows: AgentRow[]
  selectedId: string | null
  onOpenAgent: (parentToolUseId: string, agentType: string) => void
}) => {
  const { nodes, edges, width, height, nodeRadius: r } = layoutAgentMap(rows)

  // Transparent hit circles are what make a 3px node clickable, but in a dense
  // fan an oversized one would sit on top of its neighbour and steal the click.
  // Cap it at half the tightest gap so every node owns exactly its own slot.
  // Measured within a depth band only: a nested spine stacks parent and child on
  // the same x in different bands, and counting that as a gap of zero would
  // shrink every hit target to nothing.
  const byBand = new Map<number, number[]>()
  for (const n of nodes) {
    if (n.kind !== 'agent') continue
    const band = byBand.get(n.depth)
    if (band === undefined) byBand.set(n.depth, [n.x])
    else band.push(n.x)
  }
  let tightest = Number.POSITIVE_INFINITY
  for (const band of byBand.values()) {
    const xs = [...band].sort((a, b) => a - b)
    for (let i = 1; i < xs.length; i++) tightest = Math.min(tightest, xs[i] - xs[i - 1])
  }
  const hitR = Math.min(Math.max(r + 4, 9), tightest / 2)

  return (
    <div className="agent-map">
      {/* role=group, never role=img: an img role makes its whole subtree
          presentational, which would hide every node button from assistive tech. */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="agent-map-svg"
        role="group"
        aria-label="Agent map"
      >
        <g>
          {edges.map((e) => {
            const midY = (e.fromY + e.toY) / 2
            return (
              <path
                key={e.id}
                className="agent-map-edge"
                d={`M ${e.fromX} ${e.fromY} C ${e.fromX} ${midY}, ${e.toX} ${midY}, ${e.toX} ${e.toY}`}
              />
            )
          })}
        </g>
        {nodes.map((n) => {
          if (n.kind === 'session') {
            return (
              <g className="agent-map-node-session" key={n.id}>
                <title>Session</title>
                <rect x={n.x - r} y={n.y - r} width={r * 2} height={r * 2} rx={3} />
              </g>
            )
          }

          const row = n.row
          const statusKey = row.status ?? 'unknown'
          const running = row.status === 'running'
          const selected = selectedId === n.id
          const label = [row.agentType, row.status ?? '', row.description ?? '']
            .filter(Boolean)
            .join(' · ')

          // A diamond reads smaller than a circle of the same radius, so failed
          // nodes get a slightly wider one to stay the heaviest mark on screen.
          const dia = r * 1.15
          const diamond = [
            `${n.x.toFixed(2)},${(n.y - dia).toFixed(2)}`,
            `${(n.x + dia).toFixed(2)},${n.y.toFixed(2)}`,
            `${n.x.toFixed(2)},${(n.y + dia).toFixed(2)}`,
            `${(n.x - dia).toFixed(2)},${n.y.toFixed(2)}`
          ].join(' ')

          const glyph =
            row.status === 'failed' ? (
              <polygon className="agent-map-glyph" points={diamond} />
            ) : (
              <circle className="agent-map-glyph" cx={n.x} cy={n.y} r={r} />
            )

          return (
            <g
              key={n.id}
              className={`agent-map-node agent-map-node--${statusKey}${
                selected ? ' agent-map-node--selected' : ''
              }`}
              role="button"
              tabIndex={0}
              aria-label={label}
              aria-current={selected ? 'true' : undefined}
              onClick={() => onOpenAgent(n.id, row.agentType)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onOpenAgent(n.id, row.agentType)
                }
              }}
            >
              <title>{label}</title>
              {running ? (
                <circle className="agent-map-halo" cx={n.x} cy={n.y} r={r + 3} />
              ) : null}
              {selected ? (
                <circle className="agent-map-ring" cx={n.x} cy={n.y} r={r + 4} />
              ) : null}
              <circle className="agent-map-hover" cx={n.x} cy={n.y} r={r + 4} />
              {glyph}
              <circle className="agent-map-hit" cx={n.x} cy={n.y} r={hitR} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default AgentMap
