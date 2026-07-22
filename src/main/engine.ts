import { query } from '@anthropic-ai/claude-agent-sdk'
import type { Engine, EngineEvent } from '../shared/engine-types'

export type SdkMessage =
  | { type: 'system'; subtype: string; session_id: string }
  | {
      type: 'stream_event'
      event: { type: string; delta?: { type: string; text?: string } }
    }
  | {
      type: 'result'
      subtype: string
      session_id: string
      is_error: boolean
      result?: string
    }
  | { type: string; [k: string]: unknown }

export type QueryFn = (args: {
  prompt: string
  options: Record<string, unknown>
}) => AsyncIterable<SdkMessage>

// ponytail: per-turn query + resume; switch to streaming-input mode when interrupt/canUseTool land (#5+)
const defaultQuery: QueryFn = ({ prompt, options }) =>
  query({ prompt, options: options as Parameters<typeof query>[0]['options'] }) as AsyncIterable<SdkMessage>

export function createEngine(
  getCwd: () => string | null,
  queryFn: QueryFn = defaultQuery
): Engine {
  let sessionId: string | null = null

  async function runTurn(
    prompt: string,
    onEvent: (e: EngineEvent) => void
  ): Promise<void> {
    const cwd = getCwd()
    if (cwd === null) {
      onEvent({ type: 'error', message: 'No session folder selected' })
      return
    }

    const options: Record<string, unknown> = {
      cwd,
      includePartialMessages: true
    }
    if (sessionId !== null) {
      options.resume = sessionId
    }

    try {
      for await (const msg of queryFn({ prompt, options })) {
        if (msg.type === 'system' && typeof msg.session_id === 'string') {
          sessionId = msg.session_id as string
        } else if (msg.type === 'stream_event') {
          const event = msg.event as {
            type?: string
            delta?: { type?: string; text?: string }
          }
          if (
            event?.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta' &&
            typeof event.delta.text === 'string'
          ) {
            onEvent({ type: 'text-delta', text: event.delta.text })
          }
        } else if (msg.type === 'result') {
          if (typeof msg.session_id === 'string') {
            sessionId = msg.session_id as string
          }
          if (msg.is_error || msg.subtype !== 'success') {
            onEvent({
              type: 'error',
              message: String(msg.subtype ?? 'error')
            })
          } else {
            onEvent({ type: 'turn-end' })
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      onEvent({ type: 'error', message })
    }
  }

  return { runTurn }
}
