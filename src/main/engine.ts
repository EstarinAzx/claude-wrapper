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

type QueryHandle = AsyncIterable<SdkMessage> & {
  close?: () => void
  interrupt?: () => Promise<void>
}

// Pushable async queue of user messages for streaming-input mode.
const createMessageQueue = (): {
  push: (msg: SDKUserMessage) => void
  end: () => void
  iterable: AsyncIterable<SDKUserMessage>
} => {
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

const toUserMessage = (text: string): SDKUserMessage => ({
  type: 'user',
  message: { role: 'user', content: text },
  parent_tool_use_id: null,
  origin: { kind: 'human' }
})

const mapStreamError = (raw: string): string => {
  if (/ENOENT/i.test(raw)) {
    return `Claude CLI not found. Install Claude Code, then pick the folder again. (${raw})`
  }
  if (/log ?in|api key|authentication|unauthorized|credentials/i.test(raw)) {
    return `Claude CLI is not signed in. Run claude in a terminal to sign in, then pick the folder again. (${raw})`
  }
  return raw
}

const mapResultError = (subtype: string): string => {
  if (subtype === 'error_during_execution') {
    return 'Claude hit an error during this turn. Send a new prompt to try again.'
  }
  if (subtype === 'error_max_turns') {
    return 'Claude stopped early: maximum turns reached. Send a new prompt to continue.'
  }
  return subtype
}

export const createEngine = (
  getCwd: () => string | null,
  requestPermission: RequestPermissionFn,
  queryFn: QueryFn = defaultQuery,
  getEnv: () => NodeJS.ProcessEnv = () => process.env,
  // Extra query options for the active permission mode (permissionMode + the
  // bypass danger flag). Injected like getEnv so the engine stays decoupled
  // from the permission-mode store. Empty by default → SDK default behaviour.
  getPermissionOptions: () => Record<string, unknown> = () => ({})
): Engine & { close(): void } => {
  let queue: ReturnType<typeof createMessageQueue> | null = null
  let currentQuery: QueryHandle | null = null
  let consumeStarted = false
  let activeOnEvent: ((e: EngineEvent) => void) | null = null
  let turnResolve: (() => void) | null = null
  let terminalError: string | null = null
  let interrupting = false
  let currentSessionId: string | null = null

  const emit = (e: EngineEvent): void => {
    activeOnEvent?.(e)
  }

  const finishTurn = (): void => {
    interrupting = false
    const r = turnResolve
    turnResolve = null
    activeOnEvent = null
    r?.()
  }

  const handleMessage = (msg: SdkMessage): void => {
    const sid = (msg as { session_id?: unknown }).session_id
    if (typeof sid === 'string') currentSessionId = sid

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
      if (interrupting) {
        emit({ type: 'turn-aborted' })
      } else if (msg.subtype === 'success') {
        // subtype is the discriminator — SDKResultSuccess can carry is_error: true
        emit({ type: 'turn-end' })
      } else {
        emit({
          type: 'error',
          message: mapResultError(String(msg.subtype ?? 'error'))
        })
      }
      finishTurn()
    }
  }

  const ensureQuery = (cwd: string, resume?: string): void => {
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

    const options: Record<string, unknown> = {
      cwd,
      includePartialMessages: true,
      canUseTool,
      // options.env REPLACES the child env wholesale (see sdk.d.ts). getEnv
      // returns the full env resolved for the active backend mode.
      env: getEnv(),
      // permissionMode (+ bypass danger flag) for the active permission mode.
      // canUseTool stays wired above — the SDK only invokes it when the mode asks.
      ...getPermissionOptions()
    }
    // ponytail: resume binds at query construction; the streaming query is built
    // once and cached, so resume only takes effect on the query-building turn.
    if (resume !== undefined) options.resume = resume

    const stream = queryFn({
      prompt: queue.iterable,
      options
    })
    currentQuery = stream as QueryHandle

    if (!consumeStarted) {
      consumeStarted = true
      void (async () => {
        try {
          for await (const msg of stream) {
            handleMessage(msg)
          }
          terminalError ??=
            'Claude session ended unexpectedly. Pick the folder again to restart.'
          if (turnResolve) {
            emit({ type: 'error', message: terminalError })
            finishTurn()
          }
        } catch (err) {
          const raw = err instanceof Error ? err.message : String(err)
          terminalError = mapStreamError(raw)
          emit({ type: 'error', message: terminalError })
          finishTurn()
        } finally {
          queue?.end()
          currentQuery = null
        }
      })()
    }
  }

  const runTurn = async (
    prompt: string,
    onEvent: (e: EngineEvent) => void,
    resume?: string
  ): Promise<void> => {
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
      ensureQuery(cwd, resume)
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

  const interrupt = (): void => {
    if (turnResolve === null) return
    interrupting = true
    void currentQuery?.interrupt?.().catch(() => {})
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

  const sessionId = (): string | null => currentSessionId

  return { runTurn, interrupt, close, sessionId }
}
