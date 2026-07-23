import { query } from '@anthropic-ai/claude-agent-sdk'
import type { PermissionResult, SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import type {
  Engine,
  EngineEvent,
  PermissionDecision
} from '../shared/engine-types'

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
  prompt: AsyncIterable<SDKUserMessage>
  options: Record<string, unknown>
}) => AsyncIterable<SdkMessage>

export type RequestPermissionFn = (req: {
  toolUseId: string
  name: string
  input: Record<string, unknown>
  signal: AbortSignal
}) => Promise<PermissionDecision>

// Pushable async queue of user messages for streaming-input mode.
function createMessageQueue(): {
  push: (msg: SDKUserMessage) => void
  end: () => void
  iterable: AsyncIterable<SDKUserMessage>
} {
  const buf: SDKUserMessage[] = []
  let wake: (() => void) | null = null
  let done = false

  const notify = (): void => {
    wake?.()
    wake = null
  }
  const push = (msg: SDKUserMessage): void => {
    buf.push(msg)
    notify()
  }
  const end = (): void => {
    done = true
    notify()
  }

  const iterable: AsyncIterable<SDKUserMessage> = {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<SDKUserMessage>> {
          while (buf.length === 0 && !done) {
            await new Promise<void>((r) => {
              wake = r
            })
          }
          if (buf.length === 0) return { done: true, value: undefined }
          return { done: false, value: buf.shift() as SDKUserMessage }
        }
      }
    }
  }

  return { push, end, iterable }
}

const defaultQuery: QueryFn = ({ prompt, options }) =>
  query({
    prompt,
    options: options as Parameters<typeof query>[0]['options']
  }) as AsyncIterable<SdkMessage>

function toUserMessage(text: string): SDKUserMessage {
  return {
    type: 'user',
    message: { role: 'user', content: text },
    parent_tool_use_id: null,
    origin: { kind: 'human' }
  }
}

export function createEngine(
  getCwd: () => string | null,
  requestPermission: RequestPermissionFn,
  queryFn: QueryFn = defaultQuery
): Engine & { close(): void } {
  let queue: ReturnType<typeof createMessageQueue> | null = null
  let currentQuery: (AsyncIterable<SdkMessage> & { close?: () => void }) | null = null
  let consumeStarted = false
  let activeOnEvent: ((e: EngineEvent) => void) | null = null
  let turnResolve: (() => void) | null = null
  let terminalError: string | null = null

  function emit(e: EngineEvent): void {
    activeOnEvent?.(e)
  }

  function finishTurn(): void {
    const r = turnResolve
    turnResolve = null
    activeOnEvent = null
    r?.()
  }

  function handleMessage(msg: SdkMessage): void {
    if (msg.type === 'stream_event') {
      const event = msg.event as {
        type?: string
        delta?: { type?: string; text?: string }
      }
      if (
        event?.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta' &&
        typeof event.delta.text === 'string'
      ) {
        emit({ type: 'text-delta', text: event.delta.text })
      }
    } else if (msg.type === 'assistant') {
      const content = (msg as { message?: { content?: unknown } }).message?.content
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
            emit({
              type: 'tool-use',
              id: (block as { id: string }).id,
              name: (block as { name: string }).name,
              input
            })
          }
        }
      }
    } else if (msg.type === 'user') {
      const content = (msg as { message?: { content?: unknown } }).message?.content
      if (Array.isArray(content)) {
        for (const block of content) {
          if (
            block &&
            typeof block === 'object' &&
            (block as { type?: unknown }).type === 'tool_result' &&
            typeof (block as { tool_use_id?: unknown }).tool_use_id === 'string'
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
            emit({
              type: 'tool-result',
              id: (block as { tool_use_id: string }).tool_use_id,
              text,
              isError: (block as { is_error?: unknown }).is_error === true
            })
          }
        }
      }
    } else if (msg.type === 'result') {
      if (msg.is_error || msg.subtype !== 'success') {
        emit({
          type: 'error',
          message: String(msg.subtype ?? 'error')
        })
      } else {
        emit({ type: 'turn-end' })
      }
      finishTurn()
    }
  }

  function ensureQuery(cwd: string): void {
    if (queue !== null) return
    queue = createMessageQueue()

    const canUseTool = async (
      toolName: string,
      input: Record<string, unknown>,
      options: { signal: AbortSignal; toolUseID: string; requestId: string }
    ): Promise<PermissionResult> => {
      emit({
        type: 'permission-request',
        id: options.toolUseID,
        name: toolName,
        input
      })
      const decision = await requestPermission({
        toolUseId: options.toolUseID,
        name: toolName,
        input,
        signal: options.signal
      })
      if (decision === 'allow') {
        return {
          behavior: 'allow',
          toolUseID: options.toolUseID,
          decisionClassification: 'user_temporary'
        }
      }
      return {
        behavior: 'deny',
        message: 'User denied this tool request.',
        interrupt: false,
        toolUseID: options.toolUseID,
        decisionClassification: 'user_reject'
      }
    }

    const stream = queryFn({
      prompt: queue.iterable,
      options: {
        cwd,
        includePartialMessages: true,
        canUseTool
      }
    })
    currentQuery = stream

    if (!consumeStarted) {
      consumeStarted = true
      void (async () => {
        try {
          for await (const msg of stream) {
            handleMessage(msg)
          }
          terminalError ??= 'query stream ended'
          if (turnResolve) {
            emit({ type: 'error', message: terminalError })
            finishTurn()
          }
        } catch (err) {
          terminalError = err instanceof Error ? err.message : String(err)
          emit({ type: 'error', message: terminalError })
          finishTurn()
        } finally {
          queue?.end()
          currentQuery = null
        }
      })()
    }
  }

  async function runTurn(
    prompt: string,
    onEvent: (e: EngineEvent) => void
  ): Promise<void> {
    const cwd = getCwd()
    if (cwd === null) {
      onEvent({ type: 'error', message: 'No session folder selected' })
      return
    }
    if (turnResolve !== null) {
      onEvent({ type: 'error', message: 'A turn is already running' })
      return
    }
    if (terminalError !== null) {
      onEvent({ type: 'error', message: terminalError })
      return
    }

    activeOnEvent = onEvent
    try {
      ensureQuery(cwd)
    } catch (err) {
      queue = null
      consumeStarted = false
      const message = err instanceof Error ? err.message : String(err)
      emit({ type: 'error', message })
      activeOnEvent = null
      return
    }

    return new Promise<void>((resolve) => {
      turnResolve = resolve
      queue!.push(toUserMessage(prompt))
    })
  }

  const close = (): void => {
    terminalError = 'query closed'
    queue?.end()
    currentQuery?.close?.()
    currentQuery = null
    queue = null
    consumeStarted = false
    if (turnResolve) {
      emit({ type: 'error', message: 'query closed' })
      finishTurn()
    }
  }

  return { runTurn, close }
}
