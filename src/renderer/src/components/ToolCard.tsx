import { keyInput } from '../toolSummaries'
import type { ChatMessage } from '../useChat'

type ToolMessage = Extract<ChatMessage, { role: 'tool' }>

interface ToolCardProps {
  message: ToolMessage
}

export default function ToolCard({ message }: ToolCardProps) {
  const { name, input, result, isError } = message
  const key = keyInput(input)

  return (
    <div className={`tool-card${isError ? ' tool-card-error' : ''}`}>
      <div className="tool-card-header">
        <span className="tool-card-name">{name}</span>
        {key ? <span className="tool-card-key">{key}</span> : null}
      </div>
      {result === null ? (
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
