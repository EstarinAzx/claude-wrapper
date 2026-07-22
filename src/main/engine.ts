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
  | {
      type: 'assistant'
      session_id?: string
      message: {
        content: Array<{
          type: string
          id?: string
          name?: string
          input?: unknown
          text?: string
        }>
      }
    }
  | {
      type: 'user'
      session_id?: string
      message: {
        content:
          | string
          | Array<{
              type: string
              tool_use_id?: string
              content?: unknown
              is_error?: boolean
            }>
      }
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
        } else if (msg.type === 'assistant') {
          const content = (msg as { message?: { content?: unknown } }).message
            ?.content
          if (Array.isArray(content)) {
            for (const block of content) {
              if (
                block &&
                typeof block === 'object' &&
                (block as { type?: unknown }).type === 'tool_use' &&
                typeof (block as { id?: unknown }).id === 'string' &&
                typeof (block as { name?: unknown }).name === 'string'
              ) {
                const inputRaw = (block as { input?: unknown }).input
                const input =
                  inputRaw !== null &&
                  typeof inputRaw === 'object' &&
                  !Array.isArray(inputRaw)
                    ? (inputRaw as Record<string, unknown>)
                    : {}
                onEvent({
                  type: 'tool-use',
                  id: (block as { id: string }).id,
                  name: (block as { name: string }).name,
                  input
                })
              }
            }
          }
        } else if (msg.type === 'user') {
          const content = (msg as { message?: { content?: unknown } }).message
            ?.content
          if (Array.isArray(content)) {
            for (const block of content) {
              if (
                block &&
                typeof block === 'object' &&
                (block as { type?: unknown }).type === 'tool_result' &&
                typeof (block as { tool_use_id?: unknown }).tool_use_id ===
                  'string'
              ) {
                const raw = (block as { content?: unknown }).content
                let text = ''
                if (typeof raw === 'string') {
                  text = raw
                } else if (Array.isArray(raw)) {
                  text = raw
                    .filter(
                      (entry): entry is { type: string; text: string } =>
                        !!entry &&
                        typeof entry === 'object' &&
                        (entry as { type?: unknown }).type === 'text' &&
                        typeof (entry as { text?: unknown }).text === 'string'
                    )
                    .map((entry) => entry.text)
                    .join('\n')
                }
                onEvent({
                  type: 'tool-result',
                  id: (block as { tool_use_id: string }).tool_use_id,
                  text,
                  isError: (block as { is_error?: unknown }).is_error === true
                })
              }
            }
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
