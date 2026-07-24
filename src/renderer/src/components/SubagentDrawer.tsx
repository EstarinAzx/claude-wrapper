import { useEffect, useState } from 'react'
import Chat from './Chat'
import { toChatMessage, type ChatMessage } from '../useChat'

interface SubagentDrawerProps {
  // The Task tool_use id the subagent was spawned under — the id the live card
  // already holds. The drawer resolves it to a disk transcript on the main side.
  parentToolUseId: string
  agentType: string
  onClose: () => void
}

// Read-only slide-over that shows one subagent's full conversation, reusing the
// main Chat/ToolCard rendering. Resolves the current session id itself (valid mid
// turn once the engine has one), then loads the transcript on demand. Flat one
// level: a replayed subagent tool card carries no `subagent` field, so it renders
// no further row and can't open a nested drawer.
const SubagentDrawer = ({ parentToolUseId, agentType, onClose }: SubagentDrawerProps) => {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)

  useEffect(() => {
    let live = true
    void window.api.currentSessionId().then((sid) => {
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
  }, [parentToolUseId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="subagent-drawer-root"
      role="dialog"
      aria-modal="true"
      aria-label={`Subagent ${agentType}`}
    >
      <button
        type="button"
        className="subagent-drawer-backdrop"
        aria-label="Close subagent"
        onClick={onClose}
      />
      <aside className="subagent-drawer">
        <header className="subagent-drawer-head">
          <span className="subagent-drawer-title">{agentType}</span>
          <button
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
