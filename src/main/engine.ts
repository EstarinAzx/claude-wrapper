import { query } from '@anthropic-ai/claude-agent-sdk'
import type { PermissionResult, SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import type {
  Engine,
  EngineEvent,
  PermissionDecision,
  RewindResult
} from '../shared/engine-types'
import { isMessageUuid } from '../shared/message-uuid'
import type { SendPayload } from '../shared/attachment-types'
import type { SlashCommandInfo } from '../shared/command-types'
import type { ModelOption } from '../shared/model-types'
import { orderEffortLevels } from '../shared/effort'
import { parseBackgroundTasks, type BackgroundTask } from '../shared/background-tasks'

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
  // #129. Optional like the three above and for the same reason: a fake handle
  // in a test supplies only what its case is about, and an SDK without the
  // method must degrade to a refusal rather than a crash.
  //
  // This is the DECLARED method (sdk.d.ts:2488), not the raw dispatcher
  // underneath it. #127 proved the wire route `request({subtype:
  // 'rewind_files'})` works but never called the method, and a declared type is
  // not a callable route (#115) — so #129 called it, from this app's exact
  // option shape, and watched the file on disk return to its pre-turn contents.
  rewindFiles?: (
    userMessageId: string,
    options?: { dryRun?: boolean }
  ) => Promise<unknown>
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
const toUserMessage = ({ text, attachments, uuid }: SendPayload): SDKUserMessage => {
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

  const message: SDKUserMessage = {
    type: 'user',
    message: { role: 'user', content },
    parent_tool_use_id: null,
    origin: { kind: 'human' }
  }
  // #129 — the rewind address, and it is stamped CONDITIONALLY. The CLI stores
  // the message under exactly this id, which is what makes `rewindFiles(id)`
  // able to find it later; without one the CLI mints its own and the message is
  // simply not addressable from here, which is a working send with no rewind
  // control rather than a broken one.
  //
  // Conditional rather than always-on so a payload that carries no uuid produces
  // a byte-identical message to the one this function returned before the field
  // existed — engine.test.ts pins that core path.
  if (uuid !== undefined) message.uuid = uuid
  return message
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

// The engine's out-of-band ports and per-query option getters, named rather
// than positional: #52, #73 and #83 each added one, and every addition made
// callers count placeholder slots to reach the new one. All optional — an
// omitted getter means the SDK default, an omitted port means nobody listens.
export type EnginePorts = {
  // options.env REPLACES the child env wholesale (see sdk.d.ts) — the getter
  // must return the full env resolved for the active backend mode.
  getEnv?: () => NodeJS.ProcessEnv
  // Extra query options for the active permission mode (permissionMode + the
  // bypass danger flag). Injected like getEnv so the engine stays decoupled
  // from the permission-mode store. Empty by default → SDK default behaviour.
  getPermissionOptions?: () => Record<string, unknown>
  // Extra query options for the active model (options.model, or {} for the CLI
  // default). Injected like getPermissionOptions — the engine stays decoupled
  // from the model-mode store.
  getModelOptions?: () => Record<string, unknown>
  // Extra query options for the active reasoning effort (options.effort, or {}
  // for the CLI default) (#124). Injected like getModelOptions, and it rides
  // the SAME object — `effort` is on `Options` (sdk.d.ts:1664) beside `model`
  // and `resume`, so it binds at query CONSTRUCTION and a pick that does not
  // rebuild the engine changes nothing.
  getEffortOptions?: () => Record<string, unknown>
  // What model the CLI says it is running (#52). Injected like the getters
  // above, and deliberately NOT an EngineEvent: emit() only reaches
  // activeOnEvent, which is null outside a turn, and the `init` that carries
  // the first model arrives during warmUp(). Routed through an EngineEvent this
  // would be dropped in exactly the case it exists for.
  onModelReport?: (model: string) => void
  // Which Claude Code binary to spawn (pathToClaudeCodeExecutable, or {} for
  // the SDK's bundled one). Injected like the getters above so the engine does
  // not care how the host install is found — see cli-path.ts.
  getCliOptions?: () => Record<string, unknown>
  // The stream died and this engine is now terminal (#73). Injected like
  // onModelReport above, and deliberately NOT an EngineEvent for the SAME
  // reason: emit() only reaches activeOnEvent, which is null outside a turn —
  // and a stream dying BETWEEN turns emits nothing at all. Routed through an
  // EngineEvent this would be dropped in one of the two cases it exists for.
  //
  // It is also the ONLY thing that separates a terminal error from a per-turn
  // one downstream: mapStreamError and mapResultError both leave as
  // `{ type: 'error' }`, so the renderer cannot tell them apart from the text.
  //
  // Fires ONLY where the CLI died under us — never for close(), which is main's
  // own teardown on every workspace switch, model pick and permission cycle.
  onTerminal?: () => void
  // The CLI's live background-task set (#83). Third injected port, and the
  // measurement behind it is the sharpest of the three: #81 timed a level event
  // landing 3.3s AFTER `result/success`, by which point finishTurn() has nulled
  // activeOnEvent and emit() reaches nobody. A task settling BETWEEN turns is
  // the NORMAL case for background work, so an EngineEvent would be dropped in
  // exactly the case this signal exists for.
  //
  // Carries the whole set every time, because the CLI's message does: this is a
  // level, not an edge pair. Fired with [] on close() as well — the level is
  // per-process and the SDK emits nothing at startup, so a set that outlives its
  // engine is a permanently stale indicator.
  onBackgroundTasks?: (tasks: BackgroundTask[]) => void
  // Subagent lifecycle edges (#104). A real terminal edge can land after
  // result/success, when activeOnEvent is null, so this port owns every subagent
  // edge when supplied. Omitted keeps the legacy EngineEvent path for callers
  // that do not need between-turn delivery.
  onSubagent?: (event: SubagentEvent) => void
}

export const createEngine = (
  getCwd: () => string | null,
  requestPermission: RequestPermissionFn,
  queryFn: QueryFn = defaultQuery,
  ports: EnginePorts = {}
): Engine & { close(): void } => {
  const {
    getEnv = () => process.env,
    getPermissionOptions = () => ({}),
    getModelOptions = () => ({}),
    getEffortOptions = () => ({}),
    onModelReport = () => {},
    getCliOptions = () => ({}),
    onTerminal = () => {},
    onBackgroundTasks = () => {},
    onSubagent
  } = ports
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
  // #85. Deliberately SEPARATE from taskToParent, which cannot be reused: its
  // membership doubles as the accept-list above, so putting a bash task's id in
  // it would make the lookup below succeed for that task's later messages and
  // emit an agent row for a shell command.
  //
  // tool_use id -> the agent tool_use id that owns it. Built from the `assistant`
  // envelope, which #84 measured as the ONLY place a background task's parentage
  // appears — `task_started` itself carries `tool_use_id` but no parent under any
  // name (its key set is exhaustive at eight fields).
  const toolUseToAgent = new Map<string, string>()
  // task_id -> owning agent tool_use id, for ANY task_type. Absent means the task
  // has no owning agent (main thread), which is a real state, not a gap.
  const taskIdToAgent = new Map<string, string>()

  const emit = (e: EngineEvent): void => {
    activeOnEvent?.(e)
  }
  const emitSubagent = (event: SubagentEvent): void => {
    if (onSubagent) onSubagent(event)
    else emit(event)
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
  // "running…".
  //
  // #111 corrected what this used to claim ("only called on the failure paths; a
  // successful turn has already drained them"). Neither half held: close() calls
  // it on EVERY teardown, failure or not, and a successful turn deliberately
  // leaves a running agent open (#104 — the Agent tool is async, so it may still
  // complete and send its own terminal edge). That belief is why the close()
  // call was gated on a turn being in flight, which stranded exactly the agents
  // this sentence assumed were already gone.
  const drainSubagents = (): void => {
    for (const id of subagentParents) {
      emitSubagent({ type: 'subagent', parentToolUseId: id, status: 'failed' })
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
      // #85. Parentage is recorded for EVERY task_type, and deliberately BEFORE
      // the local_agent gate below — a backgrounded Bash is exactly the case
      // that needs it, and it is the case the gate exists to turn away. This
      // writes only to taskIdToAgent, never to taskToParent, so the gate's job
      // as the accept-list is untouched and no bash task gains an agent row.
      const owner = toolUseToAgent.get(str(src.tool_use_id) ?? '')
      if (taskId !== undefined && owner !== undefined) taskIdToAgent.set(taskId, owner)

      // local_bash tasks share this stream; only real agents become rows.
      if (str(src.task_type) !== 'local_agent') return
      const parent = str(src.tool_use_id)
      if (parent === undefined || taskId === undefined) return
      taskToParent.set(taskId, parent)
      subagentParents.add(parent)
      emitSubagent(subagentEvent(parent, 'running', src))
      return
    }

    if (taskId === undefined) return
    // An unregistered task_id is a task we never accepted (bash, or one that
    // started before this engine attached) — ignore it rather than invent a row.
    const parent = taskToParent.get(taskId)
    if (parent === undefined) return

    if (subtype === 'task_progress') {
      emitSubagent(subagentEvent(parent, 'running', src))
    } else if (subtype === 'task_notification' || subtype === 'task_updated') {
      const patch = src.patch as Record<string, unknown> | undefined
      const status = str(src.status) ?? str(patch?.status)
      if (status === undefined || NON_TERMINAL.has(status)) {
        emitSubagent(subagentEvent(parent, 'running', src))
        return
      }
      subagentParents.delete(parent)
      taskToParent.delete(taskId)
      emitSubagent(subagentEvent(parent, status === 'completed' ? 'done' : 'failed', src))
    }
  }

  const handleMessage = (msg: SdkMessage): void => {
    // A session id is only RESUMABLE once a turn has actually run (#54).
    //
    // Warm-up alone already produces messages carrying one — `hook_started`
    // fires with a `session_id` before any user message exists — but the CLI
    // has not created that session yet. Nothing is written for it, and
    // resuming into it fails the turn outright with `error_during_execution`
    // (verified against the real CLI, and the id is absent from the store).
    //
    // Reporting it is worse than reporting nothing, because every caller of
    // sessionId() reads a non-null value as "resume this": picking a model or
    // a permission mode before the first send rebuilt the engine onto a
    // session that could never be resumed, and broke the send.
    //
    // `?? pendingResume` at those call sites covers the case this excludes —
    // an engine warmed WITH a resume target still has that id to fall back on.
    const sid = (msg as { session_id?: unknown }).session_id
    if (turnEverRun && typeof sid === 'string') currentSessionId = sid

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
      // #85. This is the one place the stream states parentage, and it was being
      // stepped over: the early return below drops the message before anything
      // looks INSIDE it, so the tool_use blocks a subagent issued — including a
      // backgrounded Bash — were never associated with the agent that issued
      // them. Both halves of the join have been in this function all along.
      const blocks = (msg as { message?: { content?: unknown } }).message?.content
      if (Array.isArray(blocks)) {
        for (const b of blocks) {
          const block = b as { type?: unknown; id?: unknown }
          if (block?.type === 'tool_use' && typeof block.id === 'string' && block.id.length > 0) {
            toolUseToAgent.set(block.id, parent)
          }
        }
      }

      if (!subagentParents.has(parent)) {
        subagentParents.add(parent)
        emitSubagent({ type: 'subagent', parentToolUseId: parent, status: 'running' })
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
      } else if (subtype === 'background_tasks_changed') {
        // Out of band, and BEFORE the task-message fallthrough below. This
        // level shares the `system` type with the task bookends but is a
        // different source: handleTaskMessage must never see it, or a
        // local_agent row in the payload would take the subagent path a second
        // time. The `local_agent` guard down there is mutation-verified and
        // stays untouched — this branch amends, it does not reverse.
        // #85. Enriched on the way OUT, never accumulated: the level still
        // carries the whole live set and still REPLACES wholesale. The parent
        // lookup is separate state that happens to be consulted here, so a task
        // leaving the set still leaves the panel.
        onBackgroundTasks(
          parseBackgroundTasks(src.tasks).map((t) => {
            const agent = taskIdToAgent.get(t.taskId)
            return agent === undefined ? t : { ...t, parentAgentToolUseId: agent }
          })
        )
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
              emitSubagent({
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
      // #129 — what makes `rewindFiles` able to do anything. Without it the
      // route is reachable and answers `canRewind: false` / "File rewinding is
      // not enabled." (#127 measured exactly that), so this is the whole switch.
      //
      // It binds at query CONSTRUCTION, like `model`, `effort` and `resume`
      // below — a setter that only stored it would change nothing — so it is
      // stated here unconditionally rather than injected as a getter: there is
      // no pick to follow, the app always wants checkpoints, and a getter would
      // imply a control that could turn it off mid-conversation and appear to
      // work.
      //
      // Its runtime cost is UNMEASURED (#129 says so in its own findings rather
      // than reporting the turn timings it had, which model latency dominates).
      // Shipped on regardless: the alternative is a control that cannot work.
      enableFileCheckpointing: true,
      // options.env REPLACES the child env wholesale (see sdk.d.ts). getEnv
      // returns the full env resolved for the active backend mode.
      env: getEnv(),
      // permissionMode (+ bypass danger flag) for the active permission mode.
      // canUseTool stays wired above — the SDK only invokes it when the mode asks.
      ...getPermissionOptions(),
      // options.model for the active model pick (absent → CLI default).
      ...getModelOptions(),
      // options.effort for the active effort pick (absent → CLI default).
      ...getEffortOptions(),
      // Which CLI binary to spawn (absent → the SDK's bundled one).
      ...getCliOptions()
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
          // The `??=` spelled out, because the SIGNAL has to respect the same
          // precedence the message already did: close() sets terminalError and
          // then ends this stream, so whoever got here first owns the state.
          // Signalling unconditionally would put a "restart and resume" control
          // on screen after an ordinary model pick, while main is already
          // rebuilding the engine underneath it.
          if (terminalError === null) {
            terminalError =
              'Claude session ended unexpectedly. Pick the folder again to restart.'
            onTerminal()
          }
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
          // Same precedence question as the branch above, asked BEFORE the
          // assignment overwrites the answer.
          const mainClosedFirst = terminalError !== null
          const raw = err instanceof Error ? err.message : String(err)
          terminalError = mapStreamError(raw)
          drainSubagents()
          emit({ type: 'error', message: terminalError })
          finishTurn()
          if (!mainClosedFirst) onTerminal()
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
      const option: ModelOption = {
        id: row.value,
        label:
          typeof row.displayName === 'string' && row.displayName.length > 0
            ? row.displayName
            : row.value
      }
      // Carried through for label matching only — what the CLI reports back is
      // a resolved id, not the row's value.
      if (typeof row.resolvedModel === 'string' && row.resolvedModel.length > 0) {
        option.resolvedModel = row.resolvedModel
      }
      // #124 — the effort scale is the CLI's per-model answer, so it travels on
      // the row it belongs to. Both fields are carried ONLY when the CLI
      // actually said something: an absent field means "did not say", which
      // `effortLevelsFor` reads as the full scale, while a coerced `false` or
      // `[]` would read as "this model supports nothing" and silently kill the
      // control. `orderEffortLevels` drops anything off the SDK's own union
      // rather than trusting the wire.
      if (typeof row.supportsEffort === 'boolean') option.supportsEffort = row.supportsEffort
      if (Array.isArray(row.supportedEffortLevels)) {
        option.supportedEffortLevels = orderEffortLevels(
          row.supportedEffortLevels.filter((l): l is string => typeof l === 'string')
        )
      }
      return [option]
    })
  }

  // #129. Restore the workspace's tracked files to their state at a user
  // message. FILES ONLY — nothing here touches the conversation.
  //
  // THE REFUSAL PATH IS A THROW, and that is measured rather than defensive: an
  // id the CLI has no checkpoint for answers `No file checkpoint found for this
  // message.` by REJECTING, while checkpointing being off answers
  // `canRewind: false` with the reason in the body. Two different mechanisms for
  // the same user-visible fact, so both are folded into one result here and the
  // CLI's own text is carried through unrewritten.
  //
  // Every failure resolves. This is called from an ipcMain.handle, and a
  // rejection escaping one becomes a modal error dialog over the app.
  const rewindFiles = async (
    userMessageId: string,
    dryRun: boolean
  ): Promise<RewindResult> => {
    const refusal = (error: string): RewindResult => ({
      canRewind: false,
      filesChanged: 0,
      insertions: 0,
      deletions: 0,
      error
    })
    // Checked here as well as at the IPC boundary because this is the last stop
    // before the SDK, and `Engine` is a contract other callers can reach.
    if (!isMessageUuid(userMessageId)) return refusal('This message cannot be rewound.')
    const call = currentQuery?.rewindFiles
    if (!call) {
      return refusal(
        'Rewind is unavailable because this conversation has no live Claude Code session.'
      )
    }
    let raw: unknown
    try {
      raw = await call.call(currentQuery, userMessageId, { dryRun })
    } catch (err) {
      return refusal(err instanceof Error ? err.message : String(err))
    }
    const row = (raw ?? {}) as Record<string, unknown>
    return {
      canRewind: row['canRewind'] === true,
      // Carried as a COUNT: the SDK answers `filesChanged` with absolute paths,
      // and the number is what a confirmation needs.
      filesChanged: Array.isArray(row['filesChanged']) ? row['filesChanged'].length : 0,
      insertions: num(row['insertions']) ?? 0,
      deletions: num(row['deletions']) ?? 0,
      error: str(row['error']) ?? null
    }
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
    // The background level is per-process, and this process is going away. Every
    // rebuild path in main — workspace switch, model pick, permission cycle,
    // backend flip, targeting another session — calls close() before it drops or
    // replaces the engine, so ONE line here covers all of them; hand-copying the
    // reset to each call site is the "must join the ok branch by hand" failure
    // this codebase keeps re-learning. Unlike onTerminal, firing on close() is
    // the point rather than the bug: nothing is running once the CLI is gone.
    onBackgroundTasks([])
    // #111. The same fact about the same teardown, so it is unconditional for
    // the same reason. Gated on turnResolve it only ran when a turn was in
    // flight, and an agent left open by a SUCCESSFUL turn (#104 leaves it open
    // on purpose — it may still complete) was stranded pulsing "running…": the
    // CLI process is gone, so its terminal edge can never arrive either. Safe to
    // run before the block below because drainSubagents() clears the set, so the
    // stream teardown's own drain is a no-op rather than a second `failed`.
    drainSubagents()
    if (turnResolve) {
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
    rewindFiles,
    isBusy
  }
}
