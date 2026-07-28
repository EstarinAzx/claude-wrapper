import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SessionMeta } from '../../../shared/session-types'
import { clampSidebarWidth, DEFAULT_SIDEBAR_WIDTH } from '../../../shared/sidebar-width'
import { groupSessions } from '../../../shared/session-groups'

const WIDTH_KEY = 'sidebar-width'

// One page of rows. The store holds ~490 sessions across 37 projects, so the
// list is capped globally rather than per project and grows a page at a time.
const PAGE = 100

const readStoredWidth = (): number => {
  const raw = window.localStorage.getItem(WIDTH_KEY)
  return clampSidebarWidth(raw === null ? DEFAULT_SIDEBAR_WIDTH : Number(raw))
}

const relTime = (ms: number): string => {
  if (!ms) return ''
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(ms).toLocaleDateString()
}

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <polyline
      points={dir === 'left' ? '7.5,2.5 4,6 7.5,9.5' : '4.5,2.5 8,6 4.5,9.5'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const Sidebar = ({
  cwd,
  activeId,
  busy,
  onOpen,
  onSwitch,
  onChooseFolder,
  onNewChat
}: {
  cwd: string
  activeId?: string | null
  busy?: boolean
  onOpen?: (id: string) => void
  // A row outside the open workspace. Carries the project it belongs to —
  // absent for the "Unknown project" group, which main rejects as missing-cwd.
  onSwitch?: (id: string, cwd: string | null) => void
  // Open a project that has no session to resume into (#48). Lives here, beside
  // "New chat", because the sessions rail is where workspaces are already
  // chosen; the titlebar pills are global preferences and stay untouched.
  onChooseFolder?: () => void
  onNewChat?: () => void
}) => {
  const [sessions, setSessions] = useState<SessionMeta[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidthState] = useState(readStoredWidth)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const reqIdRef = useRef(0)

  // Filter → sort/group → cap, in that order and all client-side over metadata
  // already in hand. A narrowed query starts at page one again; carrying a
  // "show more" from the previous query would reveal a page the user never
  // asked for.
  const { groups, shown, matched } = useMemo(
    () => groupSessions(sessions, { query, cwd, limit }),
    [sessions, query, cwd, limit]
  )

  // Persist UI-layout prefs (this width); engine-intent state stays in-memory.
  const setWidth = useCallback((px: number): void => {
    const clamped = clampSidebarWidth(px)
    setWidthState(clamped)
    window.localStorage.setItem(WIDTH_KEY, String(clamped))
  }, [])

  // Drag the right edge: capture the start point + width, then track pointer
  // moves on the window (not the thin handle) until release so the drag keeps
  // following even when the cursor outruns the 6px grip.
  const startResize = useCallback(
    (e: React.PointerEvent): void => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = width
      const onMove = (ev: PointerEvent): void => setWidth(startWidth + (ev.clientX - startX))
      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [width, setWidth]
  )

  const refresh = useCallback(() => {
    const reqId = ++reqIdRef.current
    void window.api.listSessions().then((list) => {
      if (reqId === reqIdRef.current) setSessions(list)
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [cwd, activeId, refresh])

  useEffect(() => {
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  if (collapsed) {
    return (
      <aside className="sidebar sidebar-collapsed" aria-label="Sessions">
        <button
          type="button"
          className="sidebar-toggle"
          aria-label="Expand sessions"
          aria-expanded={false}
          onClick={() => setCollapsed(false)}
        >
          <Chevron dir="right" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="sidebar" aria-label="Sessions" style={{ width }}>
      <div className="sidebar-head">
        <span className="sidebar-title">Sessions</span>
        <div className="sidebar-head-actions">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Refresh sessions"
            onClick={refresh}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M11.5 7a4.5 4.5 0 1 1-1.3-3.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M11.5 2v2.2H9.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {/* Deliberately NOT gated on `busy`, unlike "New chat" beside it: a
              switch is a main-process transaction that asks the engine itself
              and answers `busy`. Disabling here would be a second busy source —
              and would make the refusal it returns unreachable. Same reasoning
              as a foreign session row (#47). */}
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Open project"
            onClick={() => onChooseFolder?.()}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M2 11.3V3.5h3.7l1.2 1.5h5.1v6.3H2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="New chat"
            disabled={busy}
            onClick={() => onNewChat?.()}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 2.5v9M2.5 7h9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Collapse sessions"
            aria-expanded={true}
            onClick={() => setCollapsed(true)}
          >
            <Chevron dir="left" />
          </button>
        </div>
      </div>
      <div className="sidebar-filter">
        <input
          type="search"
          className="sidebar-filter-input"
          aria-label="Filter sessions"
          placeholder="Filter sessions…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setLimit(PAGE)
          }}
        />
      </div>
      {sessions.length === 0 ? (
        <div className="sidebar-empty">No sessions yet</div>
      ) : groups.length === 0 ? (
        <div className="sidebar-empty">No sessions match “{query.trim()}”</div>
      ) : (
        <div className="session-groups">
          {groups.map((group) => (
            <div key={group.key} className="session-group">
              <h3 className="session-group-head" title={group.label}>
                {group.label}
              </h3>
              <ul className="session-list">
                {group.sessions.map((s) => {
                  const label = s.title || 'Untitled session'
                  const meta = relTime(s.lastUpdated)
                  const active = s.id === activeId
                  // A row outside the open workspace resumes through the
                  // workspace transition (#47) rather than the in-project
                  // resume: it has to move the engine's cwd before the
                  // transcript means anything.
                  const foreign = !group.current
                  const classes = ['session-row-btn']
                  if (active) classes.push('session-row-btn-active')
                  if (foreign) classes.push('session-row-btn-foreign')
                  return (
                    <li key={s.id} className="session-row">
                      <button
                        type="button"
                        className={classes.join(' ')}
                        aria-current={active ? 'true' : undefined}
                        // Deliberately NOT gated on `busy` when foreign: a
                        // switch is a main-process transaction that asks the
                        // engine itself and answers `busy`. Disabling here
                        // would be a second busy source — and would make the
                        // refusal it returns unreachable.
                        disabled={!foreign && busy}
                        title={foreign ? `${label} — ${group.label}` : label}
                        onClick={() =>
                          foreign ? onSwitch?.(s.id, s.cwd ?? null) : onOpen?.(s.id)
                        }
                      >
                        <span className="session-row-title">{label}</span>
                        {meta ? <span className="session-row-meta">{meta}</span> : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {matched > shown ? (
            <button
              type="button"
              className="session-more"
              onClick={() => setLimit((n) => n + PAGE)}
            >
              Show {matched - shown} more
            </button>
          ) : null}
        </div>
      )}
      <div
        className="sidebar-resize-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        onPointerDown={startResize}
      />
    </aside>
  )
}

export default Sidebar
