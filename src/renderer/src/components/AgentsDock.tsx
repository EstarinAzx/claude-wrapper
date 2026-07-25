import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgentRow, LiveAgent, SubagentInfo } from '../../../shared/subagent-types'
import { mergeAgents } from '../../../shared/subagent-types'
import { clampSidebarWidth, DEFAULT_SIDEBAR_WIDTH } from '../../../shared/sidebar-width'

const WIDTH_KEY = 'agents-dock-width'

const readStoredWidth = (): number => {
  const raw = window.localStorage.getItem(WIDTH_KEY)
  return clampSidebarWidth(raw === null ? DEFAULT_SIDEBAR_WIDTH : Number(raw))
}

// Three tagged states rather than `SubagentInfo[] | null | undefined`. On the
// wire `null` already means "the agent directory could not be read", so reusing
// it for "still loading" would make the empty branch a coin flip — and "none
// spawned" vs "could not read" being different facts is the entire reason the
// store distinguishes them.
type DockState =
  | { status: 'loading' }
  | { status: 'ok'; agents: SubagentInfo[] }
  | { status: 'unreadable' }

const STATUS_LABEL: Record<'running' | 'done' | 'failed', string> = {
  running: 'running…',
  done: 'done',
  failed: 'failed'
}

// Labelled "ctx" deliberately: total_tokens is the agent's cumulative context
// size, not what it spent. Rendered bare it reads as "52k tokens" for an agent
// that did nothing.
const contextSize = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

const elapsed = (ms: number): string => {
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

// The live stats line. Every segment is omitted when its field is absent, but a
// field that is present AND zero still renders — a disk row that never recorded
// tool uses must not read the same as an agent that genuinely ran zero tools.
const liveStats = (a: AgentRow): string =>
  [
    a.totalTokens === undefined ? '' : `${contextSize(a.totalTokens)} ctx`,
    a.toolUses === undefined ? '' : `${a.toolUses} ${a.toolUses === 1 ? 'tool' : 'tools'}`,
    a.durationMs === undefined ? '' : elapsed(a.durationMs),
    a.lastToolName ?? ''
  ]
    .filter(Boolean)
    .join(' · ')

// Agents dock: an in-flow resizable aside listing every subagent the open
// session spawned. In-flow (not an overlay) so the chat narrows and stays
// readable while agents are inspected. Two sources, ONE list: the on-disk meta
// sidecars and the live task-message stream, merged on parentToolUseId with the
// live fields winning, so an agent that ran before and is running again appears
// once. Clicking a row hands that id back up — the same key the inline Task-card
// row opens the drawer with.
const AgentsDock = ({
  sessionId,
  liveAgents,
  onOpenAgent,
  onClose
}: {
  sessionId: string | null
  liveAgents: LiveAgent[]
  onOpenAgent: (parentToolUseId: string, agentType: string) => void
  onClose: () => void
}) => {
  const [state, setState] = useState<DockState>({ status: 'loading' })
  const [width, setWidthState] = useState(readStoredWidth)
  const reqIdRef = useRef(0)

  // Same persistence split as the sessions rail: UI-layout prefs live in
  // localStorage, engine-intent state stays in memory.
  const setWidth = useCallback((px: number): void => {
    const clamped = clampSidebarWidth(px)
    setWidthState(clamped)
    window.localStorage.setItem(WIDTH_KEY, String(clamped))
  }, [])

  // Drag the LEFT edge — mirror of the sidebar's grip, so moving the pointer
  // left (a shrinking clientX) widens the dock.
  const startResize = useCallback(
    (e: React.PointerEvent): void => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = width
      const onMove = (ev: PointerEvent): void => setWidth(startWidth - (ev.clientX - startX))
      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [width, setWidth]
  )

  // Re-read whenever the session being looked at changes, so switching sessions
  // swaps the list rather than merging two sessions' agents. The req-id guard
  // drops a slow response for a session the user already navigated away from.
  useEffect(() => {
    const reqId = ++reqIdRef.current
    if (!sessionId) {
      setState({ status: 'ok', agents: [] })
      return
    }
    setState({ status: 'loading' })
    void window.api
      .listSubagents(sessionId)
      .catch(() => null)
      .then((list) => {
        if (reqId !== reqIdRef.current) return
        setState(list === null ? { status: 'unreadable' } : { status: 'ok', agents: list })
      })
  }, [sessionId])

  // Live rows are shown whatever the disk read did: a first turn has no session
  // id yet, and an unreadable agent directory must not hide agents we watched
  // start. The disk-flavoured empty states only speak when there is nothing.
  const rows = mergeAgents(state.status === 'ok' ? state.agents : [], liveAgents)

  return (
    <aside className="agents-dock" aria-label="Agents" style={{ width }}>
      <div
        className="agents-dock-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize agents panel"
        onPointerDown={startResize}
      />
      <div className="agents-dock-head">
        <span className="agents-dock-title">Agents</span>
        <button
          type="button"
          className="sidebar-toggle"
          aria-label="Close agents panel"
          onClick={onClose}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M3 3l6 6M9 3l-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {rows.length === 0 && state.status === 'loading' ? (
        <div className="agents-dock-empty" role="status">
          Loading…
        </div>
      ) : rows.length === 0 && state.status === 'unreadable' ? (
        <div className="agents-dock-empty" role="status">
          Could not read this session&rsquo;s agents.
        </div>
      ) : rows.length === 0 ? (
        <div className="agents-dock-empty" role="status">
          No agents in this session.
        </div>
      ) : (
        <ul className="agent-list">
          {rows.map((a) => {
            // Absent fields are dropped, never rendered as a zero or a blank —
            // a sidecar that never recorded a model must not read as "no model".
            const meta = [a.model, a.spawnDepth === undefined ? '' : `depth ${a.spawnDepth}`]
              .filter(Boolean)
              .join(' · ')
            const stats = liveStats(a)
            return (
              <li
                key={a.parentToolUseId}
                className={`agent-row${a.status ? ` agent-row--${a.status}` : ''}`}
              >
                <button
                  type="button"
                  className="agent-row-btn"
                  onClick={() => onOpenAgent(a.parentToolUseId, a.agentType)}
                >
                  <span className="agent-row-head">
                    {a.status ? <span className="agent-row-dot" aria-hidden="true" /> : null}
                    <span className="agent-row-type">{a.agentType}</span>
                    {a.status ? (
                      <span className="agent-row-status">{STATUS_LABEL[a.status]}</span>
                    ) : null}
                  </span>
                  {a.description ? (
                    <span className="agent-row-desc" title={a.description}>
                      {a.description}
                    </span>
                  ) : null}
                  {meta ? <span className="agent-row-meta">{meta}</span> : null}
                  {stats ? <span className="agent-row-stats">{stats}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}

export default AgentsDock
