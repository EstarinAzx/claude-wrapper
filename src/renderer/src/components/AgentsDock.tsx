import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgentRow, LiveAgent, SubagentInfo } from '../../../shared/subagent-types'
import type { LastTurn } from '../../../shared/queued-send'
import { mergeAgents } from '../../../shared/subagent-types'
import { nonAgentTasks, type BackgroundTask } from '../../../shared/background-tasks'
import { buildAgentTree, flattenAgentTree } from '../../../shared/agent-layout'
import { clampSidebarWidth, DEFAULT_SIDEBAR_WIDTH } from '../../../shared/sidebar-width'
import AgentMap from './AgentMap'

// One indent step, in px. Small on purpose: the dock is ~248px wide by default,
// so a deep spine has to stay legible rather than march off the right edge.
const INDENT_PX = 14

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
  backgroundTasks,
  lastTurn,
  onOpenAgent,
  onClose
}: {
  sessionId: string | null
  liveAgents: LiveAgent[]
  // The CLI's live background-task set (#83). Kept apart from `liveAgents` all
  // the way to the DOM: a local_bash task has no sidecar, no parentToolUseId and
  // no usage, so a merged row would claim it ran as an agent and spent nothing.
  backgroundTasks: BackgroundTask[]
  // How the last turn ended (#80's `LastTurn`), used here as the re-read
  // trigger (#82). Taken as the whole record rather than a bare boolean: the
  // outcome decides WHETHER to read and the nonce decides WHEN.
  lastTurn: LastTurn | null
  onOpenAgent: (parentToolUseId: string, agentType: string) => void
  onClose: () => void
}) => {
  const [state, setState] = useState<DockState>({ status: 'loading' })
  const [width, setWidthState] = useState(readStoredWidth)
  const [mode, setMode] = useState<'list' | 'map'>('list')
  // One selection shared by list and map — toggling modes must not drop it.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const reqIdRef = useRef(0)
  // The turn already ended when this dock mounted, if there was one. The mount
  // read below covers it, so seeding from it is what keeps opening the panel
  // one read rather than two.
  const seenNonceRef = useRef(lastTurn?.nonce ?? 0)

  const openAgent = useCallback(
    (parentToolUseId: string, agentType: string): void => {
      setSelectedId(parentToolUseId)
      onOpenAgent(parentToolUseId, agentType)
    },
    [onOpenAgent]
  )

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

  // ONE read with two callers, and `keepStale` is the entire difference between
  // them.
  //
  // `false` — a different session is being looked at. Clear first, because
  // showing the previous session's agents under the new session's name is worse
  // than showing nothing, and report a failure as `unreadable` because there is
  // no earlier answer to fall back on.
  //
  // `true` — the SAME session, re-read (#82). **Stale-while-revalidate**: touch
  // nothing until the new list is in hand. Clearing here would blank the disk
  // rows for the duration of every refresh, and nested edges come from the
  // sidecars alone, so the tree shape would flicker out and back at exactly the
  // moment the user is watching the panel change. A failure keeps the last good
  // rows for the same reason: a transient read error is not news worth
  // destroying a correct snapshot over, and the next turn re-reads anyway. Same
  // shape as the sessions rail, which holds its list "rather than showing a gap
  // that the next refresh" fills.
  const read = useCallback((id: string, keepStale: boolean): void => {
    const reqId = ++reqIdRef.current
    if (!keepStale) setState({ status: 'loading' })
    void window.api
      .listSubagents(id)
      .catch(() => null)
      .then((list) => {
        if (reqId !== reqIdRef.current) return
        // `null` is still "the directory could not be read" and `[]` is still
        // "none spawned" — the two never collapse. What changes is only whether
        // a failure is allowed to overwrite an answer we already had.
        if (list === null) {
          if (!keepStale) setState({ status: 'unreadable' })
          return
        }
        setState({ status: 'ok', agents: list })
      })
  }, [])

  // Re-read whenever the session being looked at changes, so switching sessions
  // swaps the list rather than merging two sessions' agents. The req-id guard
  // drops a slow response for a session the user already navigated away from —
  // including away to no session at all, which is why the null branch bumps it.
  useEffect(() => {
    if (!sessionId) {
      ++reqIdRef.current
      setState({ status: 'ok', agents: [] })
      return
    }
    read(sessionId, false)
  }, [sessionId, read])

  // Turns 2..N (#82). `sessionId` is written inside `useChat`'s `turn-end`
  // branch, so it moves `null → id` once and then never again — which left the
  // effect above structurally incapable of firing in the window where subagents
  // spawn and nest. With the dock left open, they simply never appeared.
  //
  // Keyed on the nonce and NOT on `busy` going false: all three terminal
  // outcomes clear busy, so a not-busy rule would re-read after Stop and after
  // a failed turn too — #80's finding, and the reason `LastTurn` carries the
  // outcome at all. The nonce is what makes two turns ending the same way two
  // events rather than one unchanged value.
  //
  // The nonce is consumed whatever the outcome was, so a stopped turn is not
  // left behind to fire this on the next unrelated render.
  useEffect(() => {
    if (!lastTurn || lastTurn.nonce === seenNonceRef.current) return
    seenNonceRef.current = lastTurn.nonce
    if (lastTurn.outcome !== 'turn-end' || !sessionId) return
    read(sessionId, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTurn?.nonce])

  // Live rows are shown whatever the disk read did: a first turn has no session
  // id yet, and an unreadable agent directory must not hide agents we watched
  // start. The disk-flavoured empty states only speak when there is nothing.
  const rows = mergeAgents(state.status === 'ok' ? state.agents : [], liveAgents)

  // Nest by parentAgentId, then flatten back to one <li> per agent. Flat-with-a-
  // depth rather than nested <ul>s: nesting is rare (~1 agent in 185), and the
  // flat shape keeps the common case a plain list with nothing extra in the DOM.
  const nodes = flattenAgentTree(buildAgentTree(rows))

  // Agents are already listed above, and the Agent tool is async on this CLI —
  // so every subagent is in the level from birth and would otherwise appear
  // twice, under two different names for the same work.
  const tasks = nonAgentTasks(backgroundTasks)

  // #85. Split by whether this task has an owning agent that is actually on
  // screen to hang from. Three separate things send a task to the Background
  // section instead, and none of them is an error: it has no owner at all (a
  // main-thread Bash — #84 measured 2 of 3 parented and 1 not), its owner is
  // absent from the list, or the map mode is showing, which has no <li>s to nest
  // under. The fallback is never a drop — "a missing row is worse than a
  // mis-indented one".
  const onScreen = new Set(nodes.map((n) => n.row.parentToolUseId))
  const nestedByAgent = new Map<string, BackgroundTask[]>()
  const looseTasks: BackgroundTask[] = []
  for (const t of tasks) {
    const owner = t.parentAgentToolUseId
    if (mode !== 'map' && owner !== undefined && onScreen.has(owner)) {
      const siblings = nestedByAgent.get(owner)
      if (siblings === undefined) nestedByAgent.set(owner, [t])
      else siblings.push(t)
    } else {
      looseTasks.push(t)
    }
  }

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
        <div className="agents-dock-modes">
          <button
            type="button"
            className="agents-dock-mode"
            aria-label="List view"
            aria-pressed={mode === 'list'}
            onClick={() => setMode('list')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M2 3h8M2 6h8M2 9h8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="agents-dock-mode"
            aria-label="Map view"
            aria-pressed={mode === 'map'}
            onClick={() => setMode('map')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M6 3.4v2.2M6 5.6L3.4 8M6 5.6L8.6 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="6" cy="2.6" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="3" cy="9" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
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
      ) : mode === 'map' ? (
        <AgentMap rows={rows} selectedId={selectedId} onOpenAgent={openAgent} />
      ) : (
        <ul className="agent-list">
          {nodes.flatMap(({ row: a, depth }) => {
            // Absent fields are dropped, never rendered as a zero or a blank —
            // a sidecar that never recorded a model must not read as "no model".
            const meta = [a.model, a.spawnDepth === undefined ? '' : `depth ${a.spawnDepth}`]
              .filter(Boolean)
              .join(' · ')
            const stats = liveStats(a)
            const selected = selectedId === a.parentToolUseId
            const agentLi = (
              <li
                key={a.parentToolUseId}
                // aria-level carries the depth that is otherwise only in the
                // padding — indentation a screen reader cannot see is not a tree.
                aria-level={depth + 1}
                aria-current={selected ? 'true' : undefined}
                // Untouched at the top level, so a session with no nesting (the
                // common case) renders with no inline style at all.
                style={depth > 0 ? { paddingLeft: depth * INDENT_PX } : undefined}
                className={`agent-row${a.status ? ` agent-row--${a.status}` : ''}${
                  depth > 0 ? ' agent-row--nested' : ''
                }${selected ? ' agent-row--selected' : ''}`}
              >
                <button
                  type="button"
                  className="agent-row-btn"
                  onClick={() => openAgent(a.parentToolUseId, a.agentType)}
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
            // #85. The agent's own background tasks, one level deeper, sharing
            // the same flat-with-a-depth convention as the tree rather than a
            // nested <ul>. They stay NON-INTERACTIVE and keep the background-task
            // classes: nesting changes where a shell command sits, never what it
            // claims to be, so it gains no button, no usage and no agent styling.
            const owned = nestedByAgent.get(a.parentToolUseId)
            if (owned === undefined) return [agentLi]
            return [
              agentLi,
              ...owned.map((t) => (
                <li
                  key={`bg-${t.taskId}`}
                  aria-level={depth + 2}
                  style={{ paddingLeft: (depth + 1) * INDENT_PX }}
                  className="background-task-row background-task-row--in-tree"
                >
                  {t.description ? (
                    <span className="background-task-desc" title={t.description}>
                      {t.description}
                    </span>
                  ) : null}
                  <span className="background-task-type">{t.taskType}</span>
                </li>
              ))
            ]
          })}
        </ul>
      )}
      {/* Below the agent half, not above it: this strip appears and disappears
          on its own schedule, and growing it downward leaves the list the user
          is reading where it was. Rendered ONLY when something is running —
          a standing "no background tasks" line would be a fourth empty state
          competing with the three above it, for the case that is the norm.

          Non-interactive by design. A background task has nothing to open: no
          sidecar and no transcript. (#84 since found its PARENTAGE — on the
          `assistant` envelope, not the payload — and #85 uses that to nest the
          owned ones above; but knowing who spawned a shell command still does
          not give it a transcript of its own.) Rows with nothing behind them
          stay plain text rather than becoming buttons that do nothing. */}
      {looseTasks.length > 0 ? (
        <section className="background-tasks" aria-label="Background tasks">
          <span className="background-tasks-title">Background</span>
          <ul className="background-task-list">
            {looseTasks.map((t) => (
              <li key={t.taskId} className="background-task-row">
                {t.description ? (
                  <span className="background-task-desc" title={t.description}>
                    {t.description}
                  </span>
                ) : null}
                {/* The level's own discriminant, verbatim. `BackgroundTaskSummary`
                    declares friendly labels in the same sdk.d.ts, for the hook
                    payload this app never registers — printing `shell` here
                    would be showing the user an assumption as a fact. */}
                <span className="background-task-type">{t.taskType}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  )
}

export default AgentsDock
