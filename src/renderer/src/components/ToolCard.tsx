import { useState } from 'react'
import { keyInput, resultSummary, hasHiddenOutput, inputEntries } from '../toolSummaries'
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
  // Advertised only when expanding would actually show something — a card that
  // offers an empty expansion makes the affordance worthless everywhere else.
  const disclosable = !pending && result !== null && hasHiddenOutput(result)
  const noun = isError ? 'error' : 'output'
  const inspectable = Object.keys(input).length > 0
  // A pending card is compact but never blind: the decision-critical arguments
  // must not sit one click behind the decision, so approval shows them outright.
  const showInput = inspectable && (pending || inputOpen)
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
      {!pending && showInput ? <InputInspector input={input} /> : null}
      {disclosable && expanded ? (
        <pre className="tool-card-output">{result}</pre>
      ) : null}
    </div>
  )
}

export default ToolCard
