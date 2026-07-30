import { useState } from 'react'
import type { ReactNode } from 'react'
import { keyInput, resultSummary, hasHiddenOutput, inputEntries } from '../toolSummaries'
import { lineDiff } from '../lineDiff'
import type { DiffLine } from '../lineDiff'
import type { ChatMessage } from '../useChat'
import type { PermissionDecision } from '../../../shared/engine-types'

type ToolMessage = Extract<ChatMessage, { role: 'tool' }>

interface ToolCardProps {
  message: ToolMessage
  onPermission?: (toolUseId: string, decision: PermissionDecision) => void
  onOpenSubagent?: (parentToolUseId: string, agentType: string) => void
}

const STATUS_LABEL: Record<'running' | 'done' | 'failed', string> = {
  running: 'running…',
  done: 'done',
  failed: 'failed'
}

// Every argument the call was made with. Mounted only where it is shown, so a
// collapsed card pays neither the stringify nor the DOM — same rule as the
// output body below.
const InputInspector = ({ input }: { input: Record<string, unknown> }) => (
  <dl className="tool-card-input">
    {inputEntries(input).map(([k, v]) => (
      <div className="tool-card-arg" key={k}>
        <dt className="tool-card-arg-key">{k}</dt>
        <dd className="tool-card-arg-value">{v}</dd>
      </div>
    ))}
  </dl>
)

// The sigil, not the colour, is what makes a line's side survive a screenshot,
// a copy-paste and a screen reader.
const SIGIL: Record<DiffLine['type'], string> = { same: ' ', add: '+', del: '-' }

// A replacement hunk — the old string against the new — and nothing implying
// the surrounding file, which the app was never given. Past the alignment guard
// it shows the exact texts side by side instead: an unaligned answer is honest,
// an empty region reads as "nothing changed".
const EditDiff = ({
  oldText,
  newText,
  replaceAll
}: {
  oldText: string
  newText: string
  replaceAll: boolean
}) => {
  const diff = lineDiff(oldText, newText)
  return (
    <div className="tool-card-diff">
      {replaceAll ? (
        <span className="tool-card-change-label">Replaces every occurrence</span>
      ) : null}
      {diff.kind === 'aligned' ? (
        <pre className="tool-card-diff-body">
          {diff.lines.map((line, i) => (
            <span key={i} className={`tool-card-diff-line tool-card-diff-line--${line.type}`}>
              {SIGIL[line.type] + line.text}
            </span>
          ))}
        </pre>
      ) : (
        <>
          <span className="tool-card-change-label">Too large to align — exact texts</span>
          <span className="tool-card-change-label">Before</span>
          <pre className="tool-card-diff-body">{oldText}</pre>
          <span className="tool-card-change-label">After</span>
          <pre className="tool-card-diff-body">{newText}</pre>
        </>
      )}
    </div>
  )
}

// Write carries no before-state, so this is labelled as what it is — proposed
// content — and never dressed as added lines.
const ContentPreview = ({ text }: { text: string }) => (
  <div className="tool-card-content">
    <span className="tool-card-change-label">Proposed content</span>
    <pre className="tool-card-content-body">{text}</pre>
  </div>
)

const ToolCard = ({ message, onPermission, onOpenSubagent }: ToolCardProps) => {
  const { name, input, result, isError, permission, toolUseId, subagent } = message
  const key = keyInput(input)
  const pending = permission === 'pending'
  // Per-card, so expanding one card cannot touch another. Input and output are
  // two booleans, not one: the output affordance is gated on there BEING hidden
  // output, and sharing a flag would put a control back on cards that hide
  // nothing — which is exactly what makes the affordance trustworthy.
  const [expanded, setExpanded] = useState(false)
  const [inputOpen, setInputOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)
  // Advertised only when expanding would actually show something — a card that
  // offers an empty expansion makes the affordance worthless everywhere else.
  const disclosable = !pending && result !== null && hasHiddenOutput(result)
  const noun = isError ? 'error' : 'output'
  const inspectable = Object.keys(input).length > 0
  // A pending card is compact but never blind: the decision-critical arguments
  // must not sit one click behind the decision, so approval shows them outright.
  const showInput = inspectable && (pending || inputOpen)
  // The third region, and so the third boolean. Detected by the arguments the
  // call carries rather than by tool name: the two strings ARE what makes an
  // honest diff possible, and a `content` argument is a proposal either way.
  const oldText = typeof input.old_string === 'string' ? input.old_string : null
  const newText = typeof input.new_string === 'string' ? input.new_string : null
  const content = typeof input.content === 'string' ? input.content : null
  const diffable = oldText !== null && newText !== null
  const changeable = diffable || content !== null
  const showChange = changeable && (pending || changeOpen)
  // Computed from the mounted branch only, like `inputEntries` — a collapsed
  // card must not pay for an alignment nobody asked to see.
  const changeBody = (): ReactNode => {
    if (oldText !== null && newText !== null) {
      return (
        <EditDiff oldText={oldText} newText={newText} replaceAll={input.replace_all === true} />
      )
    }
    if (content !== null) return <ContentPreview text={content} />
    return null
  }
  const agentType =
    typeof input.subagent_type === 'string' && input.subagent_type
      ? input.subagent_type
      : 'subagent'

  return (
    <div className={`tool-card${isError ? ' tool-card-error' : ''}`}>
      <div className="tool-card-header">
        <span className="tool-card-name">{name}</span>
        {key ? <span className="tool-card-key">{key}</span> : null}
      </div>
      {subagent ? (
        <button
          type="button"
          className={`subagent-row subagent-row--${subagent}`}
          onClick={() => onOpenSubagent?.(toolUseId, agentType)}
        >
          <span className="subagent-row-dot" aria-hidden="true" />
          <span className="subagent-row-type">{agentType}</span>
          <span className="subagent-row-status">{STATUS_LABEL[subagent]}</span>
          <span className="subagent-row-open" aria-hidden="true">
            View ›
          </span>
        </button>
      ) : null}
      {pending && showInput ? <InputInspector input={input} /> : null}
      {pending && showChange ? changeBody() : null}
      {pending ? (
        <div className="tool-card-actions">
          <button
            type="button"
            className="tool-perm-btn tool-perm-allow"
            onClick={() => onPermission?.(toolUseId, 'allow')}
          >
            Allow
          </button>
          <button
            type="button"
            className="tool-perm-btn tool-perm-deny"
            onClick={() => onPermission?.(toolUseId, 'deny')}
          >
            Deny
          </button>
        </div>
      ) : result === null ? (
        <div className="tool-card-result tool-card-pending" role="status">
          running…
        </div>
      ) : (
        <div className="tool-card-result" role="status">
          {isError ? 'Failed: ' : ''}
          {resultSummary(result)}
        </div>
      )}
      {!pending && changeable ? (
        <button
          type="button"
          className="tool-card-toggle tool-card-toggle--change"
          aria-expanded={changeOpen}
          onClick={() => setChangeOpen((v) => !v)}
        >
          <span className="tool-card-caret" aria-hidden="true">
            ›
          </span>
          {changeOpen ? 'Hide' : 'Show'} {diffable ? 'diff' : 'content'}
        </button>
      ) : null}
      {!pending && inspectable ? (
        <button
          type="button"
          className="tool-card-toggle tool-card-toggle--input"
          aria-expanded={inputOpen}
          onClick={() => setInputOpen((v) => !v)}
        >
          <span className="tool-card-caret" aria-hidden="true">
            ›
          </span>
          {inputOpen ? 'Hide' : 'Show'} input
        </button>
      ) : null}
      {disclosable ? (
        <button
          type="button"
          className="tool-card-toggle tool-card-toggle--output"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="tool-card-caret" aria-hidden="true">
            ›
          </span>
          {expanded ? 'Hide' : 'Show'} {noun}
        </button>
      ) : null}
      {/* Conditionally MOUNTED, never hidden: a CSS-hidden body or a closed
          <details> would leave the detail text in the card's rendered output,
          and the collapsed card's one-line guarantee is asserted on exactly
          that. Rendered as preformatted text — tool output is data, not
          trusted markdown. */}
      {!pending && showChange ? changeBody() : null}
      {!pending && showInput ? <InputInspector input={input} /> : null}
      {disclosable && expanded ? (
        <pre className="tool-card-output">{result}</pre>
      ) : null}
    </div>
  )
}

export default ToolCard
