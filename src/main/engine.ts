import { query } from '@anthropic-ai/claude-agent-sdk'
import type { PermissionResult, SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import type {
  Engine,
  EngineEvent,
  PermissionDecision
} from '../shared/engine-types'
import type { SendPayload } from '../shared/attachment-types'
import type { SlashCommandInfo } from '../shared/command-types'
import type { ModelOption } from '../shared/model-types'

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
      // Non-null when this assistant message is a subagent's forwarded output;
      // it is the id of the Task tool_use that spawned the subagent.
      parent_tool_use_id?: string | null
      message: {
        // "<synthetic>" marks CLI-produced text (local command output, unknown-
        // command suggestions) — it never streams as deltas. See handleMessage.
        model?: string
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
      parent_tool_use_id?: string | null
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
  supportedCommands?: () => Promise<unknown>
  supportedModels?: () => Promise<unknown>
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

type ContentBlock = Exclude<SDKUserMessage['message']['content'], string>[number]

// With no attachments the content stays a PLAIN STRING — the app's core path,
// byte-identical to the string-only channel this replaced, and pinned by
// engine.test.ts. Do not "fix" that test by letting it become an array.
// Otherwise: one text block, then one image block per embedded image. Non-image
// attachments are never embedded; their absolute paths are appended to the
// prompt text so the agent opens them with its own file tools.
const toUserMessage = ({ text, attachments }: SendPayload): SDKUserMessage => {
  const paths = attachments.filter((a) => a.kind === 'path')
  const prompt =
    paths.length === 0
      ? text
      : [text, `Attached files:\n${paths.map((p) => p.path).join('\n')}`]
          .filter(Boolean)
          .join('\n\n')

  const content: SDKUserMessage['message']['content'] =
    attachments.length === 0
      ? prompt
      : [
          // "Look at this" with no words is a valid message, but an EMPTY text
          // block is not — the API rejects one — so it is omitted, not blanked.
          ...(prompt ? [{ type: 'text' as const, text: prompt }] : []),
          ...attachments
            .filter((a) => a.kind === 'image')
            .map(
              (img): ContentBlock => ({
                type: 'image',
                source: { type: 'base64', media_type: img.mediaType, data: img.data }
              })
            )
        ]

  return {
    type: 'user',
    message: { role: 'user', content },
    parent_tool_use_id: null,
    origin: { kind: 'human' }
  }
}

type SubagentEvent = Extract<EngineEvent, { type: 'subagent' }>

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined

const assignDefined = (
  target: Record<string, unknown>,
  fields: Record<string, unknown>
): void => {
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) target[k] = v
}

// Build the widened subagent event from whichever task message we are holding.
// Only fields the message actually carried are attached: an absent usage number
// has to reach the panel ABSENT, because "no data" and "zero tokens" are
// different facts there. total_tokens is cumulative context, not spend.
const subagentEvent = (
  parentToolUseId: string,
  status: SubagentEvent['status'],
  src: Record<string, unknown>
): SubagentEvent => {
  const usage = (src.usage ?? {}) as Record<string, unknown>
  const event: SubagentEvent = { type: 'subagent', parentToolUseId, status }
  assignDefined(event as unknown as Record<string, unknown>, {
    taskId: str(src.task_id),
    agentType: str(src.subagent_type),
    description: str(src.description),
    lastToolName: str(src.last_tool_name),
    totalTokens: num(usage.total_tokens),
    toolUses: num(usage.tool_uses),
    durationMs: num(usage.duration_ms)
  })
  return event
}

// task_updated carries its status inside `patch`; task_notification carries it
// at the top level. Anything that is not a known terminal word is treated as
// another progress tick — task_updated was only ever observed terminal, but a
// future running/pending patch must not read as "finished".
const NON_TERMINAL = new Set(['running', 'pending', 'in_progress', 'queued'])

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
  getPermissionOptions: () => Record<string, unknown> = () => ({}),
  // Extra query options for the active model (options.model, or {} for the CLI
  // default). Injected like getPermissionOptions — the engine stays decoupled
  // from the model-mode store.
  getModelOptions: () => Record<string, unknown> = () => ({}),
  // What model the CLI says it is running (#52). Injected like the getters
  // above, and deliberately NOT an EngineEvent: emit() only reaches
  // activeOnEvent, which is null outside a turn, and the `init` that carries
  // the first model arrives during warmUp(). Routed through an EngineEvent this
  // would be dropped in exactly the case it exists for.
  onModelReport: (model: string) => void = () => {}
): Engine & { close(): void } => {
  let queue: ReturnType<typeof createMessageQueue> | null = null
  let currentQuery: QueryHandle | null = null
  let consumeStarted = false
  // False until the first runTurn pushes a message. While false, a dying
  // stream is a failed WARM-UP, which must be inert: reset to idle instead of
  // setting terminalError, so the first real send rebuilds and fails at the
  // normal time with the normal text.
  let turnEverRun = false
  let activeOnEvent: ((e: EngineEvent) => void) | null = null
  let turnResolve: (() => void) | null = null
  let terminalError: string | null = null
  let interrupting = false
  let currentSessionId: string | null = null
  // Agent tool_use ids with an open subagent this engine. A `running` event
  // fires once per id; the id is cleared when the agent reaches a terminal
  // state — via its task message, or via the Agent tool's own tool_result.
  const subagentParents = new Set<string>()
  // task_id -> the spawning Agent tool_use id. Populated ONLY by a task_started
  // whose task_type is local_agent, which is also what keeps backgrounded Bash
  // calls out of the panel: they ride the same stream with their own task ids,
  // and later task messages are ignored unless their task_id is in here.
  // Needed at all because task_progress/task_updated for a nested agent carry
  // task_id and nothing else — the two ids are separate keys, so we keep both.
  const taskToParent = new Map<string, string>()

  const emit = (e: EngineEvent): void => {
    activeOnEvent?.(e)
  }

  // Last model this engine reported, so an unchanged model is not re-announced
  // once per assistant message. Engine-scoped on purpose: a rebuilt engine
  // re-reports from its own `init`, which is exactly when the value can have
  // changed underneath us.
  let lastReportedModel: string | null = null

  const reportModel = (model: unknown): void => {
    if (typeof model !== 'string' || model.length === 0) return
    if (model === lastReportedModel) return
    lastReportedModel = model
    onModelReport(model)
  }

  const finishTurn = (): void => {
    interrupting = false
    const r = turnResolve
    turnResolve = null
    activeOnEvent = null
    r?.()
  }

  // A turn that aborts/errors/closes may leave subagents whose Task tool_result
  // never arrived — flip each still-open one to failed so its row stops pulsing
  // "running…". Only called on the failure paths; a successful turn has already
  // drained them via the Task tool_results.
  const drainSubagents = (): void => {
    for (const id of subagentParents) {
      emit({ type: 'subagent', parentToolUseId: id, status: 'failed' })
    }
    subagentParents.clear()
    taskToParent.clear()
  }

  // The CLI's task lifecycle, which arrives as `system` messages the engine used
  // to drop wholesale. This is the rich presence source: it names the agent
  // before any output exists and carries live usage. The parent_tool_use_id path
  // below stays as the floor — both upsert the same key, so whichever lands
  // first creates the row and neither duplicates it.
  const handleTaskMessage = (src: Record<string, unknown>): void => {
    const subtype = str(src.subtype)
    const taskId = str(src.task_id)

    if (subtype === 'task_started') {
      // local_bash tasks share this stream; only real agents become rows.
      if (str(src.task_type) !== 'local_agent') return
      const parent = str(src.tool_use_id)
      if (parent === undefined || taskId === undefined) return
      taskToParent.set(taskId, parent)
      subagentParents.add(parent)
      emit(subagentEvent(parent, 'running', src))
      return
    }

    if (taskId === undefined) return
    // An unregistered task_id is a task we never accepted (bash, or one that
    // started before this engine attached) — ignore it rather than invent a row.
    const parent = taskToParent.get(taskId)
    if (parent === undefined) return

    if (subtype === 'task_progress') {
      emit(subagentEvent(parent, 'running', src))
    } else if (subtype === 'task_notification' || subtype === 'task_updated') {
      const patch = src.patch as Record<string, unknown> | undefined
      const status = str(src.status) ?? str(patch?.status)
      if (status === undefined || NON_TERMINAL.has(status)) {
        emit(subagentEvent(parent, 'running', src))
        return
      }
      subagentParents.delete(parent)
      taskToParent.delete(taskId)
      emit(subagentEvent(parent, status === 'completed' ? 'done' : 'failed', src))
    }
  }

  const handleMessage = (msg: SdkMessage): void => {
    const sid = (msg as { session_id?: unknown }).session_id
    if (typeof sid === 'string') currentSessionId = sid

    // Subagent output (Task tool) arrives tagged with parent_tool_use_id. Bucket
    // it into a per-agent presence event and DROP it from the main transcript —
    // the wrapper shows subagents in their own drawer, not inline. forwardSubagentText
    // stays off, so only tool_use/tool_result blocks land here (never text deltas).
    const parent = (msg as { parent_tool_use_id?: unknown }).parent_tool_use_id
    if (
      typeof parent === 'string' &&
      parent.length > 0 &&
      (msg.type === 'assistant' || msg.type === 'user')
    ) {
      if (!subagentParents.has(parent)) {
        subagentParents.add(parent)
        emit({ type: 'subagent', parentToolUseId: parent, status: 'running' })
      }
      return
    }

    if (msg.type === 'system') {
      const src = msg as unknown as Record<string, unknown>
      const subtype = str(src.subtype)
      if (subtype === 'init') {
        // The CLI's opening statement of what it is running — the only model
        // report available before a turn has produced anything, and the one
        // that carries a --resume'd session's model.
        reportModel(src.model)
      } else if (subtype === 'local_command_output') {
        // Declared streaming shape (sdk.d.ts): content is the command's output,
        // already plain text. Empty output emits nothing — an empty command
        // message is worse than none.
        const content = str(src.content)
        if (content !== undefined) emit({ type: 'command-output', text: content })
      } else if (subtype === 'informational') {
        // 'info' is documented transcript-mode-only; this app has no transcript
        // mode, so that level is dropped rather than rendered.
        const content = str(src.content)
        if (content !== undefined && str(src.level) !== 'info') {
          emit({ type: 'notice', text: content })
        }
      } else {
        handleTaskMessage(src)
      }
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
        emit({ type: 'text-delta', text: event.delta.text })
      }
    } else if (msg.type === 'assistant') {
      // Local command output does NOT stream as the declared system subtype on
      // this CLI — it arrives as a synthetic assistant message (captured live,
      // see the #37 ticket comment): model "<synthetic>", text blocks only, no
      // stream_event deltas at all. Route it to the command role and keep it
      // out of the ordinary assistant path, which would attribute it to Claude.
      const synthetic =
        (msg as { message?: { model?: unknown } }).message?.model === '<synthetic>'
      // What the turn ACTUALLY ran on — the only signal that catches a
      // `/model` typed into the composer, which never touches the pill.
      //
      // Only ONE exclusion is needed here: a synthetic message's "model" is the
      // CLI's own marker string, not a model. Subagent messages are already
      // gone — handleMessage returns early on parent_tool_use_id above, so a
      // Task running haiku never reaches this line. A guard here would be dead
      // code; the test that covers it pins that early return instead.
      if (!synthetic) {
        reportModel((msg as { message?: { model?: unknown } }).message?.model)
      }
      if (synthetic) {
        const blocks = (msg as { message?: { content?: unknown } }).message?.content
        const text = (Array.isArray(blocks) ? blocks : [])
          .filter(
            (b): b is { type: string; text: string } =>
              !!b &&
              typeof b === 'object' &&
              (b as { type?: unknown }).type === 'text' &&
              typeof (b as { text?: unknown }).text === 'string'
          )
          .map((b) => b.text)
          .join('\n')
        if (text) emit({ type: 'command-output', text })
        return
      }
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
            const toolUseId = (block as { tool_use_id: string }).tool_use_id
            const isError = (block as { is_error?: unknown }).is_error === true
            emit({ type: 'tool-result', id: toolUseId, text, isError })
            // A Task tool_result closes out its subagent: flip the presence
            // event to done/failed so the working-list stops showing "running".
            if (subagentParents.has(toolUseId)) {
              subagentParents.delete(toolUseId)
              emit({
                type: 'subagent',
                parentToolUseId: toolUseId,
                status: isError ? 'failed' : 'done'
              })
            }
          }
        }
      }
    } else if (msg.type === 'result') {
      if (interrupting) {
        drainSubagents()
        emit({ type: 'turn-aborted' })
      } else if (msg.subtype === 'success') {
        // subtype is the discriminator — SDKResultSuccess can carry is_error: true
        emit({ type: 'turn-end' })
      } else {
        drainSubagents()
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
      ...getPermissionOptions(),
      // options.model for the active model pick (absent → CLI default).
      ...getModelOptions()
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
          if (!turnEverRun) {
            resetToIdle()
            return
          }
          terminalError ??=
            'Claude session ended unexpectedly. Pick the folder again to restart.'
          if (turnResolve) {
            drainSubagents()
            emit({ type: 'error', message: terminalError })
            finishTurn()
          }
        } catch (err) {
          if (!turnEverRun) {
            resetToIdle()
            return
          }
          const raw = err instanceof Error ? err.message : String(err)
          terminalError = mapStreamError(raw)
          drainSubagents()
          emit({ type: 'error', message: terminalError })
          finishTurn()
        } finally {
          queue?.end()
          currentQuery = null
        }
      })()
    }
  }

  // Undo an unused query wholesale — the warm-up inertness contract. Only ever
  // called before the first turn, so nothing is waiting on the stream.
  const resetToIdle = (): void => {
    queue?.end()
    queue = null
    consumeStarted = false
    currentQuery = null
  }

  const warmUp = (resume?: string): void => {
    const cwd = getCwd()
    if (cwd === null || queue !== null || terminalError !== null) return
    try {
      ensureQuery(cwd, resume)
    } catch {
      // Swallowed by contract — see resetToIdle.
      resetToIdle()
    }
  }

  // Live read, no cache: supportedCommands() tracks the CLI's own
  // commands_changed pushes, so a re-fetch is always fresh. [] on every
  // failure path — no query yet, an SDK without the call, or a rejection.
  const listCommands = async (): Promise<SlashCommandInfo[]> => {
    const call = currentQuery?.supportedCommands
    if (!call) return []
    let raw: unknown
    try {
      raw = await call.call(currentQuery)
    } catch {
      return []
    }
    if (!Array.isArray(raw)) return []
    return raw.flatMap((c): SlashCommandInfo[] => {
      if (!c || typeof c !== 'object') return []
      const cmd = c as Record<string, unknown>
      if (typeof cmd.name !== 'string' || cmd.name.length === 0) return []
      const info: SlashCommandInfo = {
        name: cmd.name,
        description: typeof cmd.description === 'string' ? cmd.description : '',
        argumentHint: typeof cmd.argumentHint === 'string' ? cmd.argumentHint : ''
      }
      const aliases = Array.isArray(cmd.aliases)
        ? cmd.aliases.filter((a): a is string => typeof a === 'string' && a.length > 0)
        : []
      if (aliases.length > 0) info.aliases = aliases
      return [info]
    })
  }

  // Live read, no cache — same contract as listCommands above, and for the same
  // reason: the CLI owns this list, so a cached copy is a copy that can go
  // stale. [] on every failure path (no query yet, an SDK without the call, a
  // rejection). The pill is only reachable after folder-pick, which warms the
  // engine, so [] in practice means something is actually wrong.
  //
  // `value` is copied verbatim into `id` — it is what goes back as
  // options.model. Do NOT substitute resolvedModel here: that field is the
  // canonical wire id for display/matching, and sending it as options.model is
  // the resolved-id hang (see model-mode.ts).
  const listModels = async (): Promise<ModelOption[]> => {
    const call = currentQuery?.supportedModels
    if (!call) return []
    let raw: unknown
    try {
      raw = await call.call(currentQuery)
    } catch {
      return []
    }
    if (!Array.isArray(raw)) return []
    return raw.flatMap((m): ModelOption[] => {
      if (!m || typeof m !== 'object') return []
      const row = m as Record<string, unknown>
      if (typeof row.value !== 'string' || row.value.length === 0) return []
      return [
        {
          id: row.value,
          label:
            typeof row.displayName === 'string' && row.displayName.length > 0
              ? row.displayName
              : row.value
        }
      ]
    })
  }

  const runTurn = async (
    payload: SendPayload,
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
      turnEverRun = true
      queue!.push(toUserMessage(payload))
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
      drainSubagents()
      emit({ type: 'error', message: 'query closed' })
      finishTurn()
    }
  }

  const sessionId = (): string | null => currentSessionId

  // A turn is in flight exactly while its promise is unresolved — the same
  // state runTurn already rejects a second turn on. The workspace transaction
  // (#46) reads this rather than keeping a flag of its own, which could drift.
  const isBusy = (): boolean => turnResolve !== null

  return {
    runTurn,
    interrupt,
    close,
    sessionId,
    warmUp,
    listCommands,
    listModels,
    isBusy
  }
}
