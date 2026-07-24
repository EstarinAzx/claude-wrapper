import { keyInput } from '../toolSummaries'
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

const ToolCard = ({ message, onPermission, onOpenSubagent }: ToolCardProps) => {
  const { name, input, result, isError, permission, toolUseId, subagent } = message
  const key = keyInput(input)
  const pending = permission === 'pending'
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
          {result}
        </div>
      )}
    </div>
  )
}

export default ToolCard
