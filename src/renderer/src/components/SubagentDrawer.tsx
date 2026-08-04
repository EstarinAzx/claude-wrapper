import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { LastTurn } from '../../../shared/queued-send'
import Chat from './Chat'
import { toChatMessage, type ChatMessage } from '../useChat'

const TAB_STOP =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface SubagentDrawerProps {
  // The Task tool_use id the subagent was spawned under — the id the live card
  // already holds. The drawer resolves it to a disk transcript on the main side.
  parentToolUseId: string
  agentType: string
  // The session the app is looking at, when it knows. A session opened from the
  // rail has no engine behind it until the next turn runs, so asking the main
  // side for "the current session id" would answer null and the drawer would
  // come up empty — which is precisely the past-session case the Agents dock
  // opens. Absent (a fresh live turn that has not ended yet) falls back to the
  // engine, which does have an id mid-turn.
  sessionId?: string | null
  lastTurn: LastTurn | null
  onClose: () => void
}

// Read-only slide-over that shows one subagent's full conversation, reusing the
// main Chat/ToolCard rendering. Resolves the current session id itself (valid mid
// turn once the engine has one), then loads the transcript on demand. Flat one
// level: a replayed subagent tool card carries no `subagent` field, so it renders
// no further row and can't open a nested drawer.
const SubagentDrawer = ({
  parentToolUseId,
  agentType,
  sessionId,
  lastTurn,
  onClose
}: SubagentDrawerProps) => {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key !== 'Tab') return
    const root = rootRef.current
    if (!root) return
    const stops = [...root.querySelectorAll<HTMLElement>(TAB_STOP)].filter(
      (el) => el.tabIndex >= 0 && !el.hidden
    )
    if (stops.length === 0) {
      e.preventDefault()
      root.focus()
      return
    }
    const first = stops[0]
    const last = stops[stops.length - 1]
    const active = document.activeElement
    const leavesRoot = e.shiftKey
      ? active === first || !root.contains(active)
      : active === last || !root.contains(active)
    if (!leavesRoot) return
    e.preventDefault()
    ;(e.shiftKey ? last : first).focus()
  }

  useLayoutEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    return () => {
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  useEffect(() => {
    let live = true
    const resolve = sessionId
      ? Promise.resolve(sessionId)
      : window.api.currentSessionId()
    void resolve.then((sid) => {
      if (!sid) {
        if (live) setMessages([])
        return
      }
      return window.api.subagentTranscript(sid, parentToolUseId).then((t) => {
        if (live) setMessages(t.map(toChatMessage))
      })
    })
    return () => {
      live = false
    }
  }, [parentToolUseId, sessionId, lastTurn?.nonce])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={rootRef}
      className="subagent-drawer-root"
      role="dialog"
      aria-modal="true"
      aria-label={`Subagent ${agentType}`}
      tabIndex={-1}
      onKeyDown={trapFocus}
    >
      {/*
        Decorative scrim: its only job is to swallow a click outside the drawer.
        Same shape as `.model-backdrop`, the other scrim in this app — out of the
        tab order, out of the a11y tree. A keyboard user has two real ways out
        (the close button below, and Escape), so announcing the scrim as a third
        adds a stop that does nothing anyone can want.
      */}
      <button
        type="button"
        className="subagent-drawer-backdrop"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <aside className="subagent-drawer">
        <header className="subagent-drawer-head">
          <span className="subagent-drawer-title">{agentType}</span>
          <button
            ref={closeRef}
            type="button"
            className="subagent-drawer-close"
            aria-label="Close viewer"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        {messages === null ? (
          <div className="subagent-drawer-empty" role="status">
            Loading…
          </div>
        ) : messages.length === 0 ? (
          <div className="subagent-drawer-empty" role="status">
            No subagent activity recorded yet.
          </div>
        ) : (
          <Chat messages={messages} busy={false} />
        )}
      </aside>
    </div>
  )
}

export default SubagentDrawer
