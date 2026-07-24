import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import type { ChatMessage } from '../useChat'
import type { PermissionDecision } from '../../../shared/engine-types'
import { isNearBottom } from '../autoscroll'
import ToolCard from './ToolCard'

const Avatar = () => <span className="avatar" aria-hidden="true" />

const Typing = () => (
  <div className="typing" aria-label="Typing">
    <span className="typing-dot" />
    <span className="typing-dot" />
    <span className="typing-dot" />
  </div>
)

interface ChatProps {
  messages: ChatMessage[]
  busy: boolean
  onPermission?: (toolUseId: string, decision: PermissionDecision) => void
  onOpenSubagent?: (parentToolUseId: string, agentType: string) => void
}

const Chat = ({ messages, busy, onPermission, onOpenSubagent }: ChatProps) => {
  const scrollerRef = useRef<HTMLElement | null>(null)
  const nearBottomRef = useRef(true)

  const onScroll = (): void => {
    const el = scrollerRef.current
    if (!el) return
    nearBottomRef.current = isNearBottom(el)
  }

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !nearBottomRef.current) return
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, busy])

  const last = messages[messages.length - 1]
  const showTyping =
    busy && !(last?.role === 'assistant' && last.text !== '')

  return (
    <main className="chat" ref={scrollerRef} onScroll={onScroll}>
      <div className="chat-column">
        <div className="date-divider">
          <span className="date-divider-line" />
          <span className="date-divider-label">TODAY</span>
          <span className="date-divider-line" />
        </div>

        {messages.map((m) => {
          if (m.role === 'user') {
            return (
              <div key={m.id} className="msg msg-user">
                <div className="bubble">{m.text}</div>
              </div>
            )
          }
          if (m.role === 'error') {
            return (
              <div key={m.id} className="msg msg-error" role="alert">
                {m.text}
              </div>
            )
          }
          if (m.role === 'tool') {
            return (
              <ToolCard
                key={m.id}
                message={m}
                onPermission={onPermission}
                onOpenSubagent={onOpenSubagent}
              />
            )
          }
          if (m.role === 'notice') {
            return (
              <div key={m.id} className="msg msg-notice">
                {m.text}
              </div>
            )
          }
          return (
            <div key={m.id} className="msg msg-assistant">
              <Avatar />
              <div className="assistant-body">
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {m.text}
                </ReactMarkdown>
              </div>
            </div>
          )
        })}

        {showTyping ? (
          <div className="msg msg-assistant">
            <Avatar />
            <Typing />
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default Chat
