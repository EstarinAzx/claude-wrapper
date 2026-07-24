import { useCallback, useEffect, useRef, useState } from 'react'
import type { SessionMeta } from '../../../shared/session-types'
import { clampSidebarWidth, DEFAULT_SIDEBAR_WIDTH } from '../../../shared/sidebar-width'

const WIDTH_KEY = 'sidebar-width'

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
  onNewChat
}: {
  cwd: string
  activeId?: string | null
  busy?: boolean
  onOpen?: (id: string) => void
  onNewChat?: () => void
}) => {
  const [sessions, setSessions] = useState<SessionMeta[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [width, setWidthState] = useState(readStoredWidth)
  const reqIdRef = useRef(0)

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
      {sessions.length === 0 ? (
        <div className="sidebar-empty">No sessions yet</div>
      ) : (
        <ul className="session-list">
          {sessions.map((s) => {
            const label = s.title || 'Untitled session'
            const meta = [relTime(s.lastUpdated), s.messageCount ? `${s.messageCount} msg` : '']
              .filter(Boolean)
              .join(' · ')
            const active = s.id === activeId
            return (
              <li key={s.id} className="session-row">
                <button
                  type="button"
                  className={active ? 'session-row-btn session-row-btn-active' : 'session-row-btn'}
                  aria-current={active ? 'true' : undefined}
                  disabled={busy}
                  onClick={() => onOpen?.(s.id)}
                >
                  <span className="session-row-title" title={label}>
                    {label}
                  </span>
                  {meta ? <span className="session-row-meta">{meta}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
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
