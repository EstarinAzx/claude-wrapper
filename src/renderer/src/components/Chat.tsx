import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { ChatMessage } from '../useChat'
import type { PermissionDecision } from '../../../shared/engine-types'
import { isNearBottom } from '../autoscroll'
import ToolCard from './ToolCard'

const Avatar = () => <span className="avatar" aria-hidden="true" />

const COPIED_MS = 1400

const CopyGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <rect
      x="4.3"
      y="1.2"
      width="6.5"
      height="6.5"
      rx="1.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <path
      d="M7.7 10.8H2.6a1.4 1.4 0 0 1-1.4-1.4V4.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
)

const CheckGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M2.4 6.3l2.4 2.5 4.8-5.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// #122 — the copy control. `markdown.css` cannot deliver this on its own:
// react-markdown owns the markup, so a stylesheet there can only ever author
// descendant rules and there is no element to hang a button on. The `pre`
// renderer is replaced instead — the first `components` override in the repo.
//
// THE CLIPBOARD ROUTE IS MEASURED, NOT ASSUMED. Production loads `file://`
// (`win.loadFile`), dev loads http://localhost, and no `setPermissionRequestHandler`
// is registered anywhere in main, so a button written against
// `navigator.clipboard` can pass jsdom, pass `npm run dev`, and be inert in the
// shipped app. `scripts/spike-122-clipboard.mjs` drove the BUILT app and read
// the result back through main's own `clipboard` module: `file://` reports
// `isSecureContext: true`, and the write landed on the OS clipboard under a real
// click. No IPC bridge and no `execCommand` fallback is needed — the second is
// also effective, and is the fallback if this ever stops being.
const CodeBlock = ({ children, ...rest }: ComponentPropsWithoutRef<'pre'>) => {
  const preRef = useRef<HTMLPreElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const copy = (): void => {
    // The payload is the RENDERED DOM's own text. Model output is hostile input
    // (the sandbox decision), and rehype-highlight has already wrapped the code
    // in token spans by this point; `textContent` flattens those back to exactly
    // the characters the model wrote, with nothing interpreted and no innerHTML
    // anywhere on the path. `?.` short-circuits the whole chain, so a context
    // without a clipboard is a no-op rather than a throw.
    const text = preRef.current?.textContent ?? ''
    void navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCopied(false), COPIED_MS)
      })
      // A refused write must not leave the control claiming success: it stays
      // at rest, which is the honest report.
      .catch(() => {})
  }

  return (
    <div className="code-block">
      <button
        type="button"
        className={copied ? 'code-copy code-copy--copied' : 'code-copy'}
        aria-label={copied ? 'Copied' : 'Copy code'}
        onClick={copy}
      >
        {copied ? <CheckGlyph /> : <CopyGlyph />}
      </button>
      <pre ref={preRef} {...rest}>
        {children}
      </pre>
    </div>
  )
}

// Exported so both render paths below share ONE map — a `components` map
// applied to only one of them is the easy miss — and so the tests can drive the
// override without going through the whole Chat.
export const markdownComponents = { pre: CodeBlock }

const ReuseGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M4.3 2 1.5 4.8l2.8 2.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.5 4.8h5.2a3.3 3.3 0 0 1 0 6.6H4.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
)

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
  // #123 — put a past user message back in the composer. OPTIONAL, and the
  // control renders only when it is supplied: `SubagentDrawer` renders this
  // same component against an agent's transcript, where a refill would put
  // another agent's words into the conversation's composer.
  onReuse?: (text: string) => void
}

const Chat = ({ messages, busy, onPermission, onOpenSubagent, onReuse }: ChatProps) => {
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
            // Images that went out with the prompt render as thumbnails above the
            // words, so the transcript confirms what the model was actually shown.
            const images = (m.attachments ?? []).filter((a) => a.kind === 'image')
            // A reopened session names what was attached; the bytes are not
            // replayed, so this is a chip and not a thumbnail.
            const markers = m.attachmentMarkers ?? []
            return (
              <div key={m.id} className="msg msg-user">
                {/* #123 — refill, never edit. The message is left exactly as it
                    is, in the pane and on disk: the pane is a projection of the
                    CLI's transcript (`setMessages(transcript.map(...))` on adopt
                    and on every tail reload), so a renderer-side edit would be
                    erased by the next reload anyway.

                    TEXT ONLY, decided: a reopened session replays attachment
                    MARKERS and not bytes, so the messages most worth resending
                    are exactly the ones whose attachments cannot be rebuilt.
                    Restoring them for a live message only would make the
                    control depend on state the user cannot see.

                    It sits BESIDE the bubble rather than inside it —
                    tests/multiline-composer.test.tsx reads `.bubble`'s
                    textContent verbatim. */}
                {onReuse ? (
                  <button
                    type="button"
                    className="bubble-reuse"
                    aria-label="Reuse this message"
                    title="Reuse this message"
                    onClick={() => onReuse(m.text)}
                  >
                    <ReuseGlyph />
                  </button>
                ) : null}
                <div className="bubble">
                  {images.length ? (
                    <div className="bubble-thumbs">
                      {images.map((img, i) => (
                        <img
                          key={i}
                          className="bubble-thumb"
                          src={`data:${img.mediaType};base64,${img.data}`}
                          alt="Attached image"
                        />
                      ))}
                    </div>
                  ) : null}
                  {markers.length ? (
                    <div className="bubble-chips">
                      {markers.map((a, i) => {
                        const label = a.name ?? a.mediaType ?? a.kind
                        return (
                          <span key={i} className="attachment-chip">
                            <span className="chip-name" title={label}>
                              {label}
                            </span>
                          </span>
                        )
                      })}
                    </div>
                  ) : null}
                  {m.text}
                </div>
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
          if (m.role === 'command') {
            // No avatar: the CLI produced this text, not Claude.
            return (
              <div key={m.id} className="msg msg-command">
                <div className="assistant-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={markdownComponents}
                  >
                    {m.text}
                  </ReactMarkdown>
                </div>
              </div>
            )
          }
          return (
            <div key={m.id} className="msg msg-assistant">
              <Avatar />
              <div className="assistant-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
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
