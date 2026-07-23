import { keyInput } from '../toolSummaries'
import type { ChatMessage } from '../useChat'
import type { PermissionDecision } from '../../../shared/engine-types'

type ToolMessage = Extract<ChatMessage, { role: 'tool' }>

interface ToolCardProps {
  message: ToolMessage
  onPermission?: (toolUseId: string, decision: PermissionDecision) => void
}

const ToolCard = ({ message, onPermission }: ToolCardProps) => {
  const { name, input, result, isError, permission, toolUseId } = message
  const key = keyInput(input)
  const pending = permission === 'pending'

  return (
    <div className={`tool-card${isError ? ' tool-card-error' : ''}`}>
      <div className="tool-card-header">
        <span className="tool-card-name">{name}</span>
        {key ? <span className="tool-card-key">{key}</span> : null}
      </div>
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
