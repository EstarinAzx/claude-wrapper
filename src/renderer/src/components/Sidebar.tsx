import { useEffect, useState } from 'react'
import type { SessionMeta } from '../../../shared/session-types'

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

const Sidebar = ({ cwd, onOpen }: { cwd: string; onOpen?: (id: string) => void }) => {
  const [sessions, setSessions] = useState<SessionMeta[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    let live = true
    void window.api.listSessions().then((list) => {
      if (live) setSessions(list)
    })
    return () => {
      live = false
    }
  }, [cwd])

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
    <aside className="sidebar" aria-label="Sessions">
      <div className="sidebar-head">
        <span className="sidebar-title">Sessions</span>
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
      {sessions.length === 0 ? (
        <div className="sidebar-empty">No sessions yet</div>
      ) : (
        <ul className="session-list">
          {sessions.map((s) => {
            const label = s.title || 'Untitled session'
            const meta = [relTime(s.lastUpdated), s.messageCount ? `${s.messageCount} msg` : '']
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={s.id} className="session-row">
                <button
                  type="button"
                  className="session-row-btn"
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
    </aside>
  )
}

export default Sidebar
