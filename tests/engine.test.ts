import { describe, test, expect } from 'vitest'
import type { SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import {
  createEngine,
  type SdkMessage,
  type QueryFn,
  type RequestPermissionFn
} from '../src/main/engine'
import type { EngineEvent, PermissionDecision } from '../src/shared/engine-types'
import type { SendPayload } from '../src/shared/attachment-types'

/** An ordinary text-only send — what the composer produces today. */
const p = (text: string): SendPayload => ({ text, attachments: [] })

/** Streaming-input stub: one long-lived async iterable the test can push into. */
const streamingStub = () => {
  const calls: Array<{ options: Record<string, unknown> }> = []
  let msgQ: SdkMessage[] = []
  let wake: (() => void) | null = null
  let closed = false

  const push = (m: SdkMessage): void => {
    msgQ.push(m)
    wake?.()
  }
  const close = (): void => {
    closed = true
    wake?.()
  }

  const fn: QueryFn = ({ prompt, options }) => {
    calls.push({ options })
    // Drain the input stream in the background so producers never block.
    void (async () => {
      for await (const _ of prompt) {
        /* keep consuming user messages */
      }
    })()
    // ponytail: generators require function*; no arrow form
    return (async function* () {
      while (!closed || msgQ.length > 0) {
        while (msgQ.length === 0 && !closed) {
          await new Promise<void>((r) => {
            wake = r
          })
        }
        if (msgQ.length === 0 && closed) return
        yield msgQ.shift() as SdkMessage
      }
    })()
  }

  return { fn, calls, push, close }
}

/** streamingStub, plus a capture of every user message pushed into the prompt. */
const capturingStub = () => {
  const inputs: SDKUserMessage[] = []
  const base = streamingStub()
  const fn: QueryFn = ({ prompt, options }) => {
    void (async () => {
      for await (const message of prompt) inputs.push(message)
    })()
    return base.fn({ prompt: (async function* () {})(), options })
  }
  return { fn, inputs, calls: base.calls, push: base.push }
}

const autoAllow = (): RequestPermissionFn => async () => 'allow'

const collect = async (
  engine: ReturnType<typeof createEngine>,
  prompt: string
): Promise<EngineEvent[]> => {
  const events: EngineEvent[] = []
  await engine.runTurn(p(prompt), (e) => events.push(e))
  return events
}

// Legible-failure copy pinned by ticket #7 — keep in sync with src/main/engine.ts
const STREAM_ENDED =
  'Claude session ended unexpectedly. Pick the folder again to restart.'
const CLI_MISSING =
  'Claude CLI not found. Install Claude Code, then pick the folder again. (spawn claude ENOENT)'
const CLI_SIGNED_OUT =
  'Claude CLI is not signed in. Run claude in a terminal to sign in, then pick the folder again. (Invalid API key · Please run /login)'
const TURN_FAILED =
  'Claude hit an error during this turn. Send a new prompt to try again.'
const MAX_TURNS =
  'Claude stopped early: maximum turns reached. Send a new prompt to continue.'

const init: SdkMessage = { type: 'system', subtype: 'init', session_id: 'sess-1' }
const delta = (text: string): SdkMessage => ({
  type: 'stream_event',
  event: { type: 'content_block_delta', delta: { type: 'text_delta', text } }
})
const success: SdkMessage = {
  type: 'result',
  subtype: 'success',
  session_id: 'sess-1',
  is_error: false,
  result: 'full text'
}

/** Run one turn and hand back the user messages the engine pushed for it. */
const sendOne = async (payload: SendPayload): Promise<SDKUserMessage[]> => {
  const { fn, inputs, push } = capturingStub()
  const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
  const turn = engine.runTurn(payload, () => {})
  await Promise.resolve()
  push(success)
  await turn
  return inputs
}

describe('engine', () => {
  test('maps stream deltas and success result to engine events', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    // Let ensureQuery + push settle
    await Promise.resolve()
    push(init)
    push(delta('Hel'))
    push(delta('lo'))
    push(success)
    const events = await turn
    expect(events).toEqual([
      { type: 'text-delta', text: 'Hel' },
      { type: 'text-delta', text: 'lo' },
      { type: 'turn-end' }
    ])
  })

  test('first turn passes cwd and partial messages; streaming input, no resume', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(success)
    await turn
    expect(calls.length).toBe(1)
    expect(calls[0].options).toMatchObject({
      cwd: 'D:\\proj',
      includePartialMessages: true
    })
    expect(calls[0].options).not.toHaveProperty('resume')
    expect(typeof calls[0].options.canUseTool).toBe('function')
  })

  test('streaming input creates query once across two turns', async () => {
    const { fn, inputs, calls, push } = capturingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)

    const t1 = collect(engine, 'first')
    await Promise.resolve()
    push(init)
    push(success)
    await t1

    const t2 = collect(engine, 'second')
    await Promise.resolve()
    push(success)
    await t2

    expect(calls.length).toBe(1)
    expect(inputs).toEqual([
      expect.objectContaining({
        message: { role: 'user', content: 'first' },
        origin: { kind: 'human' }
      }),
      expect.objectContaining({
        message: { role: 'user', content: 'second' },
        origin: { kind: 'human' }
      })
    ])
  })

  // THE CORE-PATH PIN (#29). Every ordinary message the app sends takes this
  // branch. If it ever fails, the bug is in src/main/engine.ts — do NOT "fix" it
  // by teaching the expectation to accept an array.
  test('a text-only send keeps plain-string content', async () => {
    const inputs = await sendOne({ text: 'hello', attachments: [] })
    expect(inputs).toHaveLength(1)
    expect(inputs[0]?.message.content).toBe('hello')
    expect(Array.isArray(inputs[0]?.message.content)).toBe(false)
  })

  test('an image attachment becomes a text block plus a base64 image block', async () => {
    const inputs = await sendOne({
      text: 'what is wrong here',
      attachments: [{ kind: 'image', mediaType: 'image/png', data: 'AAAB' }]
    })
    expect(inputs[0]?.message.content).toEqual([
      { type: 'text', text: 'what is wrong here' },
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: 'AAAB' }
      }
    ])
  })

  // What the composer produces when several screenshots are pasted into one
  // message: the text leads, then one image block each, in the order attached.
  test('several images become one text block followed by an image block each', async () => {
    const inputs = await sendOne({
      text: 'compare these',
      attachments: [
        { kind: 'image', mediaType: 'image/png', data: 'AAAB' },
        { kind: 'image', mediaType: 'image/jpeg', data: 'BBBC' },
        { kind: 'image', mediaType: 'image/webp', data: 'CCCD' }
      ]
    })
    expect(inputs[0]?.message.content).toEqual([
      { type: 'text', text: 'compare these' },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAB' } },
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'BBBC' } },
      { type: 'image', source: { type: 'base64', media_type: 'image/webp', data: 'CCCD' } }
    ])
  })

  // An empty text block is rejected by the API, so a wordless "look at this"
  // must carry the image alone rather than an empty block in front of it.
  test('an image with no text sends the image block alone', async () => {
    const inputs = await sendOne({
      text: '',
      attachments: [{ kind: 'image', mediaType: 'image/gif', data: 'DDDE' }]
    })
    expect(inputs[0]?.message.content).toEqual([
      { type: 'image', source: { type: 'base64', media_type: 'image/gif', data: 'DDDE' } }
    ])
  })

  test('a by-path attachment with no text drops the blank lead, keeping the list', async () => {
    const inputs = await sendOne({
      text: '',
      attachments: [{ kind: 'path', path: 'D:\\proj\\notes.pdf' }]
    })
    expect(inputs[0]?.message.content).toEqual([
      { type: 'text', text: 'Attached files:\nD:\\proj\\notes.pdf' }
    ])
  })

  test('a by-path attachment rides in the text block, not as a block of its own', async () => {
    const inputs = await sendOne({
      text: 'read this',
      attachments: [{ kind: 'path', path: 'D:\\proj\\notes.pdf' }]
    })
    expect(inputs[0]?.message.content).toEqual([
      { type: 'text', text: 'read this\n\nAttached files:\nD:\\proj\\notes.pdf' }
    ])
  })

  // #34's paperclip makes mixing routine — a screenshot and the file behind it
  // are one message. The two routes must not bleed: paths stay text, images stay
  // blocks, and the path list trails the prompt inside the single text block.
  test('a mixed message keeps images as blocks and paths in the one text block', async () => {
    const inputs = await sendOne({
      text: 'why does this look wrong',
      attachments: [
        { kind: 'image', mediaType: 'image/png', data: 'AAAB' },
        { kind: 'path', path: 'D:\\proj\\Button.tsx' },
        { kind: 'path', path: 'D:\\proj\\theme.css' }
      ]
    })
    expect(inputs[0]?.message.content).toEqual([
      {
        type: 'text',
        text: 'why does this look wrong\n\nAttached files:\nD:\\proj\\Button.tsx\nD:\\proj\\theme.css'
      },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAB' } }
    ])
  })

  test('rejects an overlapping turn without corrupting the active turn', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const first = collect(engine, 'first')
    await Promise.resolve()

    const second = await Promise.race([
      collect(engine, 'second'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 20))
    ])
    push(success)

    expect(second).toEqual([
      { type: 'error', message: 'A turn is already running' }
    ])
    await expect(first).resolves.toContainEqual({ type: 'turn-end' })
  })

  test('a query that dies while idle fails the next turn immediately', async () => {
    const { fn, calls, push, close } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)

    const first = collect(engine, 'first')
    await Promise.resolve()
    push(success)
    await first
    close()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const second = await Promise.race([
      collect(engine, 'second'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 20))
    ])
    expect(second).toEqual([
      { type: 'error', message: STREAM_ENDED }
    ])
    expect(calls).toHaveLength(1)
  })

  test('a stopped query fails later turns without losing conversation context', async () => {
    const { fn, calls, close } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)

    const first = collect(engine, 'first')
    await Promise.resolve()
    close()
    await expect(first).resolves.toEqual([
      { type: 'error', message: STREAM_ENDED }
    ])

    const second = await Promise.race([
      collect(engine, 'second'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 20))
    ])
    expect(second).toEqual([
      { type: 'error', message: STREAM_ENDED }
    ])
    expect(calls).toHaveLength(1)
  })

  test('close terminates the query and its streaming input', async () => {
    let closed = false
    let releaseOutput!: () => void
    let input!: AsyncIterator<SDKUserMessage>
    const fn: QueryFn = ({ prompt }) => {
      input = prompt[Symbol.asyncIterator]()
      return Object.assign(
        (async function* (): AsyncGenerator<SdkMessage> {
          await new Promise<void>((resolve) => {
            releaseOutput = resolve
          })
        })(),
        {
          close: () => {
            closed = true
            releaseOutput()
          }
        }
      )
    }
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    void engine.runTurn(p('hi'), () => {})
    await Promise.resolve()
    await input.next()
    const pendingInput = input.next()

    engine.close()

    expect(closed).toBe(true)
    await expect(
      Promise.race([
        pendingInput,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 20))
      ])
    ).resolves.toEqual({ done: true, value: undefined })
  })

  test('a synchronously throwing query surfaces an error and can retry', async () => {
    let attempts = 0
    const { fn: workingFn } = streamingStub()
    const fn: QueryFn = (args) => {
      attempts += 1
      if (attempts === 1) throw new Error('query setup failed')
      return workingFn(args)
    }
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)

    await expect(collect(engine, 'hi')).resolves.toEqual([
      { type: 'error', message: 'query setup failed' }
    ])
    void engine.runTurn(p('retry'), () => {})
    expect(attempts).toBe(2)
  })

  test('error result maps to a legible error event', async () => {
    const errorResult: SdkMessage = {
      type: 'result',
      subtype: 'error_during_execution',
      session_id: 'sess-1',
      is_error: true
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(errorResult)
    const events = await turn
    expect(events[events.length - 1]).toEqual({ type: 'error', message: TURN_FAILED })
  })

  // SDKResultSuccess allows is_error: true with subtype: 'success' (sdk.d.ts).
  // Discriminator is subtype — is_error alone must not paint a bare "success" error card.
  test('subtype success ends the turn even when is_error is true', async () => {
    const oddSuccess: SdkMessage = {
      type: 'result',
      subtype: 'success',
      session_id: 'sess-1',
      is_error: true,
      result: 'full text'
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(delta('hi back'))
    push(oddSuccess)
    const events = await turn
    expect(events).toEqual([
      { type: 'text-delta', text: 'hi back' },
      { type: 'turn-end' }
    ])
  })

  test('max-turns result maps to a legible error event', async () => {
    const errorResult: SdkMessage = {
      type: 'result',
      subtype: 'error_max_turns',
      session_id: 'sess-1',
      is_error: true
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(errorResult)
    const events = await turn
    expect(events[events.length - 1]).toEqual({ type: 'error', message: MAX_TURNS })
  })

  test('a missing CLI (ENOENT) surfaces as a legible error, promise still resolves', async () => {
    const fn: QueryFn = () =>
      (async function* (): AsyncGenerator<SdkMessage> {
        throw new Error('spawn claude ENOENT')
      })()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const events = await collect(engine, 'hi')
    expect(events).toEqual([{ type: 'error', message: CLI_MISSING }])
  })

  test('a signed-out CLI surfaces as a legible error', async () => {
    const fn: QueryFn = () =>
      (async function* (): AsyncGenerator<SdkMessage> {
        throw new Error('Invalid API key · Please run /login')
      })()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const events = await collect(engine, 'hi')
    expect(events).toEqual([{ type: 'error', message: CLI_SIGNED_OUT }])
  })

  test('missing session cwd surfaces as an error event', async () => {
    const { fn } = streamingStub()
    const engine = createEngine(() => null, autoAllow(), fn)
    const events = await collect(engine, 'hi')
    expect(events[0].type).toBe('error')
  })
})

const toolUse = (id: string, name: string, input: Record<string, unknown>) => ({
  type: 'tool_use' as const,
  id,
  name,
  input
})

describe('engine tool events', () => {
  test('assistant tool_use blocks map to tool-use events, text blocks ignored', async () => {
    const assistantMsg: SdkMessage = {
      type: 'assistant',
      session_id: 'sess-1',
      message: {
        content: [
          { type: 'text', text: 'Let me check.' },
          toolUse('tu-1', 'Bash', { command: 'ls' })
        ]
      }
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(assistantMsg)
    push(success)
    const events = await turn
    expect(events).toEqual([
      { type: 'tool-use', id: 'tu-1', name: 'Bash', input: { command: 'ls' } },
      { type: 'turn-end' }
    ])
  })

  test('two tool_use blocks in one assistant message emit in order', async () => {
    const assistantMsg: SdkMessage = {
      type: 'assistant',
      session_id: 'sess-1',
      message: {
        content: [
          toolUse('tu-1', 'Read', { file_path: 'a.ts' }),
          toolUse('tu-2', 'Grep', { pattern: 'foo' })
        ]
      }
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(assistantMsg)
    push(success)
    const events = await turn
    expect(events.slice(0, 2)).toEqual([
      { type: 'tool-use', id: 'tu-1', name: 'Read', input: { file_path: 'a.ts' } },
      { type: 'tool-use', id: 'tu-2', name: 'Grep', input: { pattern: 'foo' } }
    ])
  })

  test('user tool_result with string content maps to tool-result', async () => {
    const resultMsg: SdkMessage = {
      type: 'user',
      session_id: 'sess-1',
      message: {
        content: [{ type: 'tool_result', tool_use_id: 'tu-1', content: 'file-a\nfile-b' }]
      }
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(resultMsg)
    push(success)
    const events = await turn
    expect(events[0]).toEqual({
      type: 'tool-result',
      id: 'tu-1',
      text: 'file-a\nfile-b',
      isError: false
    })
  })

  test('tool_result array content flattens text blocks and carries is_error', async () => {
    const resultMsg: SdkMessage = {
      type: 'user',
      session_id: 'sess-1',
      message: {
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'tu-2',
            is_error: true,
            content: [
              { type: 'text', text: 'boom' },
              { type: 'text', text: 'trace' }
            ]
          }
        ]
      }
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(resultMsg)
    push(success)
    const events = await turn
    expect(events[0]).toEqual({
      type: 'tool-result',
      id: 'tu-2',
      text: 'boom\ntrace',
      isError: true
    })
  })

  test('user message with plain string content emits nothing', async () => {
    const echoMsg: SdkMessage = {
      type: 'user',
      session_id: 'sess-1',
      message: { content: 'hi' }
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(echoMsg)
    push(success)
    const events = await turn
    expect(events).toEqual([{ type: 'turn-end' }])
  })
})

describe('engine subagents', () => {
  const subAssistant = (parent: string): SdkMessage => ({
    type: 'assistant',
    session_id: 'sess-1',
    parent_tool_use_id: parent,
    message: { content: [toolUse('sub-tu-1', 'Read', { file_path: 'x.ts' })] }
  })
  const subResult = (parent: string): SdkMessage => ({
    type: 'user',
    session_id: 'sess-1',
    parent_tool_use_id: parent,
    message: {
      content: [{ type: 'tool_result', tool_use_id: 'sub-tu-1', content: 'contents' }]
    }
  })
  const taskResult = (id: string, isError = false): SdkMessage => ({
    type: 'user',
    session_id: 'sess-1',
    message: {
      content: [{ type: 'tool_result', tool_use_id: id, content: 'summary', is_error: isError }]
    }
  })

  test('subagent tool_use is bucketed into a running event, never leaked as a tool card', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(subAssistant('task-1'))
    push(success)
    const events = await turn
    expect(events).toEqual([
      { type: 'subagent', parentToolUseId: 'task-1', status: 'running' },
      { type: 'turn-end' }
    ])
    // no tool-use for the subagent's inner Read leaked to the main transcript
    expect(events).not.toContainEqual(
      expect.objectContaining({ type: 'tool-use', id: 'sub-tu-1' })
    )
  })

  test('subagent tool_result does not leak; running fires once across many tagged blocks', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(subAssistant('task-1'))
    push(subResult('task-1'))
    push(subAssistant('task-1'))
    push(success)
    const events = await turn
    const running = events.filter((e) => e.type === 'subagent')
    expect(running).toEqual([{ type: 'subagent', parentToolUseId: 'task-1', status: 'running' }])
    expect(events).not.toContainEqual(
      expect.objectContaining({ type: 'tool-result', id: 'sub-tu-1' })
    )
  })

  test("the Task's own tool_result flips the subagent to done and still shows the Task card", async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(subAssistant('task-1'))
    push(taskResult('task-1'))
    push(success)
    const events = await turn
    expect(events).toEqual([
      { type: 'subagent', parentToolUseId: 'task-1', status: 'running' },
      { type: 'tool-result', id: 'task-1', text: 'summary', isError: false },
      { type: 'subagent', parentToolUseId: 'task-1', status: 'done' },
      { type: 'turn-end' }
    ])
  })

  test('a failed Task tool_result flips the subagent to failed', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(subAssistant('task-1'))
    push(taskResult('task-1', true))
    push(success)
    const events = await turn
    expect(events).toContainEqual({
      type: 'subagent',
      parentToolUseId: 'task-1',
      status: 'failed'
    })
  })

  test('a main-thread tool_result with no prior subagent activity emits no subagent event', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskResult('plain-tool'))
    push(success)
    const events = await turn
    expect(events.some((e) => e.type === 'subagent')).toBe(false)
  })

  test('an in-flight subagent is flipped to failed when the turn aborts', async () => {
    const base = streamingStub()
    const fn: QueryFn = (args) =>
      Object.assign(base.fn(args), { interrupt: async (): Promise<void> => {} })
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    base.push(init)
    base.push(subAssistant('task-1')) // subagent now "running", no Task result yet
    engine.interrupt()
    base.push({ type: 'result', subtype: 'error_during_execution', session_id: 'sess-1', is_error: true })
    const events = await turn
    expect(events).toContainEqual({
      type: 'subagent',
      parentToolUseId: 'task-1',
      status: 'failed'
    })
    expect(events).toContainEqual({ type: 'turn-aborted' })
  })
})

// The CLI's task lifecycle arrives as `system` messages, which the engine used
// to drop entirely. Shapes here are copied from the #27 spike's captured JSONL,
// so they are the real wire format rather than the declared types.
describe('engine task messages', () => {
  const AGENT_TU = 'toolu_019ATrNwp7qNkQHr3uq9vUjX'
  const TASK_ID = 'a3bfd18b5d55e62c8'

  const taskStarted = (over: Record<string, unknown> = {}): SdkMessage => ({
    type: 'system',
    subtype: 'task_started',
    session_id: 'sess-1',
    task_id: TASK_ID,
    tool_use_id: AGENT_TU,
    description: 'Read notes.txt launch code',
    subagent_type: 'general-purpose',
    task_type: 'local_agent',
    ...over
  })

  const taskProgress = (over: Record<string, unknown> = {}): SdkMessage => ({
    type: 'system',
    subtype: 'task_progress',
    session_id: 'sess-1',
    task_id: TASK_ID,
    tool_use_id: AGENT_TU,
    description: 'Reading notes.txt',
    subagent_type: 'general-purpose',
    usage: { total_tokens: 53689, tool_uses: 2, duration_ms: 14636 },
    last_tool_name: 'Read',
    ...over
  })

  const taskNotification = (over: Record<string, unknown> = {}): SdkMessage => ({
    type: 'system',
    subtype: 'task_notification',
    session_id: 'sess-1',
    task_id: TASK_ID,
    tool_use_id: AGENT_TU,
    status: 'completed',
    summary: 'HALIBUT-42',
    usage: { total_tokens: 53617, tool_uses: 1, duration_ms: 4911 },
    ...over
  })

  const subagentEvents = (events: EngineEvent[]) => events.filter((e) => e.type === 'subagent')

  test('task_started puts the agent on the panel before any output exists', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskStarted())
    push(success)
    expect(subagentEvents(await turn)).toEqual([
      {
        type: 'subagent',
        parentToolUseId: AGENT_TU,
        status: 'running',
        taskId: TASK_ID,
        agentType: 'general-purpose',
        description: 'Read notes.txt launch code'
      }
    ])
  })

  test('task_progress carries live tokens, tool count, elapsed and last tool name', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskStarted())
    push(taskProgress())
    push(success)
    expect(subagentEvents(await turn)[1]).toEqual({
      type: 'subagent',
      parentToolUseId: AGENT_TU,
      status: 'running',
      taskId: TASK_ID,
      agentType: 'general-purpose',
      description: 'Reading notes.txt',
      totalTokens: 53689,
      toolUses: 2,
      durationMs: 14636,
      lastToolName: 'Read'
    })
  })

  test('task_notification settles the agent to done with its final usage', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskStarted())
    push(taskNotification())
    push(success)
    const last = subagentEvents(await turn).at(-1)
    expect(last).toMatchObject({
      parentToolUseId: AGENT_TU,
      status: 'done',
      totalTokens: 53617,
      toolUses: 1,
      durationMs: 4911
    })
  })

  test('a failed task_notification settles the agent to failed, not done', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskStarted())
    push(taskNotification({ status: 'failed' }))
    push(success)
    expect(subagentEvents(await turn).at(-1)?.status).toBe('failed')
  })

  test("task_updated's terminal patch settles the agent, keyed by task_id alone", async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskStarted())
    // The real message carries no tool_use_id — task_id is the only key.
    push({
      type: 'system',
      subtype: 'task_updated',
      session_id: 'sess-1',
      task_id: TASK_ID,
      patch: { status: 'completed', end_time: 1784961089873 }
    })
    push(success)
    expect(subagentEvents(await turn).at(-1)).toMatchObject({
      parentToolUseId: AGENT_TU,
      status: 'done'
    })
  })

  test('a non-terminal patch is a progress tick, never a completion', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskStarted())
    push({
      type: 'system',
      subtype: 'task_updated',
      session_id: 'sess-1',
      task_id: TASK_ID,
      patch: { status: 'running' }
    })
    push(success)
    expect(subagentEvents(await turn).at(-1)?.status).toBe('running')
  })

  test('a backgrounded Bash task never becomes an agent row', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    // Real local_bash shape: own short task_id, no subagent_type.
    push(
      taskStarted({
        task_id: 'bpbjj2bmr',
        tool_use_id: 'toolu_bash_1',
        task_type: 'local_bash',
        subagent_type: undefined,
        description: 'npm test'
      })
    )
    push({
      type: 'system',
      subtype: 'task_notification',
      session_id: 'sess-1',
      task_id: 'bpbjj2bmr',
      status: 'completed',
      usage: { total_tokens: 10, tool_uses: 1, duration_ms: 5 }
    })
    push(success)
    expect(subagentEvents(await turn)).toEqual([])
  })

  test('a task message for an unregistered task id is ignored, not invented into a row', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskProgress({ task_id: 'never-started' }))
    push(success)
    expect(subagentEvents(await turn)).toEqual([])
  })

  test('the system init message is still not mistaken for a task', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(success)
    expect(subagentEvents(await turn)).toEqual([])
  })

  test('presence stays single-sourced: forwarded output adds no second running event', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskStarted())
    push({
      type: 'assistant',
      session_id: 'sess-1',
      parent_tool_use_id: AGENT_TU,
      message: { content: [{ type: 'tool_use', id: 'sub-1', name: 'Read', input: {} }] }
    })
    push(success)
    const running = subagentEvents(await turn).filter((e) => e.status === 'running')
    expect(running).toHaveLength(1)
  })

  test('an agent still running when the turn aborts is drained to failed', async () => {
    const base = streamingStub()
    const fn: QueryFn = (args) =>
      Object.assign(base.fn(args), { interrupt: async (): Promise<void> => {} })
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    base.push(init)
    base.push(taskStarted())
    engine.interrupt()
    base.push({
      type: 'result',
      subtype: 'error_during_execution',
      session_id: 'sess-1',
      is_error: true
    })
    expect(subagentEvents(await turn).at(-1)).toEqual({
      type: 'subagent',
      parentToolUseId: AGENT_TU,
      status: 'failed'
    })
  })

  test('an agent that already finished is not re-failed by the drain', async () => {
    const base = streamingStub()
    const fn: QueryFn = (args) =>
      Object.assign(base.fn(args), { interrupt: async (): Promise<void> => {} })
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    base.push(init)
    base.push(taskStarted())
    base.push(taskNotification())
    engine.interrupt()
    base.push({
      type: 'result',
      subtype: 'error_during_execution',
      session_id: 'sess-1',
      is_error: true
    })
    expect(subagentEvents(await turn).filter((e) => e.status === 'failed')).toEqual([])
  })

  test('a closed query drains a still-running agent', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const events: EngineEvent[] = []
    void engine.runTurn(p('hi'), (e) => events.push(e))
    await Promise.resolve()
    push(init)
    push(taskStarted())
    await new Promise((r) => setTimeout(r, 10))
    engine.close()
    expect(events).toContainEqual({
      type: 'subagent',
      parentToolUseId: AGENT_TU,
      status: 'failed'
    })
  })

  test('absent usage stays absent — no key is invented as a zero', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(taskStarted())
    push(success)
    const started = subagentEvents(await turn)[0]
    expect('totalTokens' in started).toBe(false)
    expect('toolUses' in started).toBe(false)
    expect('durationMs' in started).toBe(false)
    expect('lastToolName' in started).toBe(false)
  })
})

describe('engine canUseTool / permissions', () => {
  test('canUseTool awaits injected permission then returns exact allow result', async () => {
    let resolvePerm!: (d: PermissionDecision) => void
    const requestPermission: RequestPermissionFn = async () =>
      new Promise<PermissionDecision>((r) => {
        resolvePerm = r
      })

    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', requestPermission, fn)

    const events: EngineEvent[] = []
    const turn = engine.runTurn(p('hi'), (e) => events.push(e))
    await Promise.resolve()

    const canUseTool = calls[0].options.canUseTool as (
      toolName: string,
      input: Record<string, unknown>,
      options: { signal: AbortSignal; toolUseID: string; requestId: string }
    ) => Promise<unknown>

    const permP = canUseTool('Bash', { command: 'ls' }, {
      signal: new AbortController().signal,
      toolUseID: 'tu-1',
      requestId: 'req-1'
    })

    // Yield so the emit lands
    await Promise.resolve()
    expect(events).toContainEqual({
      type: 'permission-request',
      id: 'tu-1',
      name: 'Bash',
      input: { command: 'ls' }
    })

    resolvePerm('allow')
    await expect(permP).resolves.toEqual({
      behavior: 'allow',
      toolUseID: 'tu-1',
      decisionClassification: 'user_temporary'
    })

    push(success)
    await turn
  })

  test('canUseTool returns exact deny result without ending the session', async () => {
    let resolvePerm!: (d: PermissionDecision) => void
    const requestPermission: RequestPermissionFn = async () =>
      new Promise<PermissionDecision>((r) => {
        resolvePerm = r
      })

    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', requestPermission, fn)

    const events: EngineEvent[] = []
    const turn = engine.runTurn(p('hi'), (e) => events.push(e))
    await Promise.resolve()

    const canUseTool = calls[0].options.canUseTool as (
      toolName: string,
      input: Record<string, unknown>,
      options: { signal: AbortSignal; toolUseID: string; requestId: string }
    ) => Promise<unknown>

    const permP = canUseTool('Bash', { command: 'ls' }, {
      signal: new AbortController().signal,
      toolUseID: 'tu-2',
      requestId: 'req-2'
    })
    await Promise.resolve()

    resolvePerm('deny')
    await expect(permP).resolves.toEqual({
      behavior: 'deny',
      message: 'User denied this tool request.',
      interrupt: false,
      toolUseID: 'tu-2',
      decisionClassification: 'user_reject'
    })

    // Turn still completes after deny — session not killed
    push(delta('Understood.'))
    push(success)
    await turn
    expect(events).toContainEqual({ type: 'text-delta', text: 'Understood.' })
    expect(events).toContainEqual({ type: 'turn-end' })
  })
})

describe('engine interrupt', () => {
  // streamingStub whose query object also exposes interrupt(), like the real SDK Query
  const interruptibleStub = () => {
    const base = streamingStub()
    let interrupts = 0
    const fn: QueryFn = (args) =>
      Object.assign(base.fn(args), {
        interrupt: async (): Promise<void> => {
          interrupts += 1
        }
      })
    return { ...base, fn, interruptCount: () => interrupts }
  }

  const abortedResult: SdkMessage = {
    type: 'result',
    subtype: 'error_during_execution',
    session_id: 'sess-1',
    is_error: true
  }

  test('interrupt during a turn maps the next result to turn-aborted, not error', async () => {
    const stub = interruptibleStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), stub.fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    stub.push(init)
    stub.push(delta('Half a thou'))
    engine.interrupt()
    stub.push(abortedResult)
    const events = await turn
    expect(stub.interruptCount()).toBe(1)
    expect(events).toEqual([
      { type: 'text-delta', text: 'Half a thou' },
      { type: 'turn-aborted' }
    ])
  })

  test('post-interrupt success result also maps to turn-aborted', async () => {
    const stub = interruptibleStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), stub.fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    stub.push(init)
    engine.interrupt()
    stub.push(success)
    const events = await turn
    expect(events).toEqual([{ type: 'turn-aborted' }])
  })

  test('after an interrupt the same query serves the next turn', async () => {
    const stub = interruptibleStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), stub.fn)
    const first = collect(engine, 'first')
    await Promise.resolve()
    engine.interrupt()
    stub.push(abortedResult)
    await first

    const second = collect(engine, 'second')
    await Promise.resolve()
    stub.push(delta('fresh'))
    stub.push(success)
    const events = await second
    expect(events).toEqual([
      { type: 'text-delta', text: 'fresh' },
      { type: 'turn-end' }
    ])
    expect(stub.calls).toHaveLength(1)
  })

  test('interrupt with no active turn is a no-op', async () => {
    const stub = interruptibleStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), stub.fn)
    engine.interrupt()
    expect(stub.interruptCount()).toBe(0)

    const turn = collect(engine, 'hi')
    await Promise.resolve()
    stub.push(success)
    await expect(turn).resolves.toContainEqual({ type: 'turn-end' })

    engine.interrupt()
    expect(stub.interruptCount()).toBe(0)
  })
})

describe('engine session id + resume', () => {
  test('sessionId is null before any message', () => {
    const { fn } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    expect(engine.sessionId()).toBeNull()
  })

  test('captures session_id from a system message and surfaces it via accessor', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init) // system message, session_id 'sess-1'
    push(success)
    await turn
    expect(engine.sessionId()).toBe('sess-1')
  })

  test('captures session_id from a result message', async () => {
    const resultMsg: SdkMessage = {
      type: 'result',
      subtype: 'success',
      session_id: 'sess-9',
      is_error: false
    }
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(resultMsg)
    await turn
    expect(engine.sessionId()).toBe('sess-9')
  })

  test('a resume target is passed straight into query options.resume', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = engine.runTurn(p('hi'), () => {}, 'sess-prior')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options.resume).toBe('sess-prior')
  })

  test('a fresh turn passes no resume', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    push(success)
    await turn
    expect(calls[0].options).not.toHaveProperty('resume')
  })
})

describe('engine permission options', () => {
  test('spreads injected permission options into query options', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(
      () => 'D:\\proj',
      autoAllow(),
      fn,
      () => process.env,
      () => ({ permissionMode: 'bypassPermissions', allowDangerouslySkipPermissions: true })
    )
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options).toMatchObject({
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true
    })
  })

  test('no permission options injected → options carry no permissionMode', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options).not.toHaveProperty('permissionMode')
    // canUseTool stays wired regardless of mode
    expect(typeof calls[0].options.canUseTool).toBe('function')
  })
})

describe('engine model options', () => {
  test('spreads injected model options into query options', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(
      () => 'D:\\proj',
      autoAllow(),
      fn,
      () => process.env,
      () => ({}),
      () => ({ model: 'opus' })
    )
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options).toMatchObject({ model: 'opus' })
  })

  test('no model options injected → options carry no model', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options).not.toHaveProperty('model')
  })
})

// #52 — the pill has to follow the CLI, so the engine has to notice what the
// CLI says it is running. Delivered as an injected callback rather than an
// EngineEvent because `init` lands during warmUp(), when there is no turn and
// therefore no event sink at all.
describe('engine model reporting (#52)', () => {
  const reporter = () => {
    const seen: string[] = []
    return { seen, onReport: (m: string) => seen.push(m) }
  }

  const engineWith = (fn: QueryFn, onReport: (m: string) => void) =>
    createEngine(
      () => 'D:\\proj',
      autoAllow(),
      fn,
      () => process.env,
      () => ({}),
      () => ({}),
      onReport
    )

  test('reports the model from `init` — before any turn has run', async () => {
    const { fn, push } = streamingStub()
    const { seen, onReport } = reporter()
    const engine = engineWith(fn, onReport)
    // warmUp only — no send. An EngineEvent would be dropped here.
    engine.warmUp()
    push({ type: 'system', subtype: 'init', session_id: 's1', model: 'claude-opus-5' })
    await new Promise((r) => setTimeout(r, 0))
    expect(seen).toEqual(['claude-opus-5'])
  })

  test('reports the model a turn actually ran on', async () => {
    const { fn, push } = streamingStub()
    const { seen, onReport } = reporter()
    const engine = engineWith(fn, onReport)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push({
      type: 'assistant',
      message: { model: 'claude-sonnet-5', content: [{ type: 'text', text: 'yo' }] }
    })
    push(success)
    await turn
    expect(seen).toEqual(['claude-sonnet-5'])
  })

  // The `/model` case end to end: init says one thing, then the CLI switches
  // mid-session and the next assistant message says another.
  test('follows a mid-session switch the pill never made', async () => {
    const { fn, push } = streamingStub()
    const { seen, onReport } = reporter()
    const engine = engineWith(fn, onReport)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push({ type: 'system', subtype: 'init', session_id: 's1', model: 'claude-opus-5' })
    push({
      type: 'assistant',
      message: { model: 'claude-sonnet-5', content: [{ type: 'text', text: 'yo' }] }
    })
    push(success)
    await turn
    expect(seen).toEqual(['claude-opus-5', 'claude-sonnet-5'])
  })

  test('does not re-report an unchanged model', async () => {
    const { fn, push } = streamingStub()
    const { seen, onReport } = reporter()
    const engine = engineWith(fn, onReport)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push({ type: 'system', subtype: 'init', session_id: 's1', model: 'claude-opus-5' })
    for (const text of ['a', 'b', 'c']) {
      push({ type: 'assistant', message: { model: 'claude-opus-5', content: [{ type: 'text', text }] } })
    }
    push(success)
    await turn
    expect(seen).toEqual(['claude-opus-5'])
  })

  // "<synthetic>" is the CLI's marker for its own local-command output, not a
  // model. Reporting it would put the literal string in the pill.
  test('ignores the synthetic marker', async () => {
    const { fn, push } = streamingStub()
    const { seen, onReport } = reporter()
    const engine = engineWith(fn, onReport)
    const turn = collect(engine, '/context')
    await Promise.resolve()
    push({
      type: 'assistant',
      message: { model: '<synthetic>', content: [{ type: 'text', text: 'ctx' }] }
    })
    push(success)
    await turn
    expect(seen).toEqual([])
  })

  // A Task subagent frequently runs a different model from the session, and its
  // messages ride the same stream — a haiku subagent must not rewrite the pill
  // mid-turn.
  //
  // The mechanism is NOT a guard at the reporting site; it is handleMessage's
  // early return on parent_tool_use_id, which drops subagent output before the
  // assistant branch is reached. Mutation testing is how that was established:
  // a guard was written here first, and deleting it killed nothing. So what
  // this test actually pins is that early return — delete it and this goes red.
  test('ignores a subagent’s model', async () => {
    const { fn, push } = streamingStub()
    const { seen, onReport } = reporter()
    const engine = engineWith(fn, onReport)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push({ type: 'system', subtype: 'init', session_id: 's1', model: 'claude-opus-5' })
    push({
      type: 'assistant',
      parent_tool_use_id: 'toolu_sub',
      message: { model: 'claude-haiku-4-5', content: [{ type: 'text', text: 'sub' }] }
    })
    push(success)
    await turn
    expect(seen).toEqual(['claude-opus-5'])
  })
})

describe('engine CLI path', () => {
  test('spreads injected CLI options into query options', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(
      () => 'D:\\proj',
      autoAllow(),
      fn,
      () => process.env,
      () => ({}),
      () => ({}),
      () => {},
      () => ({ pathToClaudeCodeExecutable: 'C:\\bin\\claude.exe' })
    )
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options).toMatchObject({
      pathToClaudeCodeExecutable: 'C:\\bin\\claude.exe'
    })
  })

  // No host install must leave the option ABSENT, not undefined — its absence
  // is what selects the SDK's bundled CLI.
  test('no CLI options injected → options carry no executable path', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options).not.toHaveProperty('pathToClaudeCodeExecutable')
  })
})

describe('engine backend env', () => {
  test('passes the resolved env from getEnv straight into query options.env', async () => {
    const wispedEnv = { PATH: '/bin', ANTHROPIC_BASE_URL: 'http://127.0.0.1:41184' }
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn, () => wispedEnv)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options.env).toEqual(wispedEnv)
  })

  test('a native env (wisp vars absent) is passed through unchanged', async () => {
    const nativeEnv = { PATH: '/bin', HOME: '/home' }
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn, () => nativeEnv)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(success)
    await turn
    expect(calls[0].options.env).toEqual(nativeEnv)
    expect(calls[0].options.env).not.toHaveProperty('ANTHROPIC_BASE_URL')
  })
})

// #37 — live shapes captured 2026-07-27 (see the capture comment on the
// ticket). The declared system subtypes never arrived for /context or a typo;
// both came as synthetic assistant messages (model "<synthetic>"). All three
// branches are covered: the two declared shapes and the observed one.
describe('engine local command output (#37)', () => {
  const syntheticAssistant = (text: string): SdkMessage =>
    ({
      type: 'assistant',
      parent_tool_use_id: null,
      session_id: 'sess-1',
      message: {
        model: '<synthetic>',
        role: 'assistant',
        stop_reason: 'stop_sequence',
        stop_sequence: '',
        content: [{ type: 'text', text }]
      }
    }) as SdkMessage

  test('system/local_command_output emits a command-output event with its content', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    const turn = collect(engine, '/context')
    await Promise.resolve()
    push({
      type: 'system',
      subtype: 'local_command_output',
      content: '## Context Usage\n\nstuff',
      session_id: 'sess-1'
    } as SdkMessage)
    push(success)
    const events = await turn
    expect(events).toContainEqual({
      type: 'command-output',
      text: '## Context Usage\n\nstuff'
    })
  })

  test('empty local_command_output content emits nothing', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    const turn = collect(engine, '/context')
    await Promise.resolve()
    push({
      type: 'system',
      subtype: 'local_command_output',
      content: '',
      session_id: 'sess-1'
    } as SdkMessage)
    push(success)
    const events = await turn
    expect(events.filter((e) => e.type === 'command-output')).toEqual([])
  })

  test('system/informational at warning level emits a notice event', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    const turn = collect(engine, '/mdoel')
    await Promise.resolve()
    push({
      type: 'system',
      subtype: 'informational',
      content: 'Unknown command: /mdoel. Did you mean /model?',
      level: 'warning',
      session_id: 'sess-1'
    } as SdkMessage)
    push(success)
    const events = await turn
    expect(events).toContainEqual({
      type: 'notice',
      text: 'Unknown command: /mdoel. Did you mean /model?'
    })
  })

  test('system/informational at the transcript-only info level emits nothing', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push({
      type: 'system',
      subtype: 'informational',
      content: 'transcript-only chatter',
      level: 'info',
      session_id: 'sess-1'
    } as SdkMessage)
    push(success)
    const events = await turn
    expect(events.filter((e) => e.type === 'notice')).toEqual([])
    expect(events.filter((e) => e.type === 'command-output')).toEqual([])
  })

  test('a synthetic assistant message routes its text to command-output, not the assistant path', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    const turn = collect(engine, '/context')
    await Promise.resolve()
    push(syntheticAssistant('## Context Usage\n\n**Model:** fable'))
    push(success)
    const events = await turn
    expect(events).toContainEqual({
      type: 'command-output',
      text: '## Context Usage\n\n**Model:** fable'
    })
    // No delta ever streams for a synthetic message, and nothing may reach the
    // ordinary assistant/tool paths.
    expect(events.filter((e) => e.type === 'text-delta')).toEqual([])
    expect(events.filter((e) => e.type === 'tool-use')).toEqual([])
    // The turn still ends normally and the composer re-arms.
    expect(events[events.length - 1]).toEqual({ type: 'turn-end' })
  })

  test('a real assistant message (non-synthetic model) emits no command-output', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push({
      type: 'assistant',
      parent_tool_use_id: null,
      session_id: 'sess-1',
      message: {
        model: 'claude-fable-5',
        content: [{ type: 'text', text: 'ordinary reply' }]
      }
    } as SdkMessage)
    push(success)
    const events = await turn
    expect(events.filter((e) => e.type === 'command-output')).toEqual([])
  })
})

// #39 — eager warm-up at folder-pick + the live command list. Warm-up is inert
// by contract: any failure leaves the engine exactly as found, so the first
// real send rebuilds and fails at the normal time with the normal text.
describe('engine warm-up + command list (#39)', () => {
  test('warmUp builds the query; the first send reuses it (no second spawn)', async () => {
    const { fn, calls, push } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    expect(calls.length).toBe(1)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(delta('Hello'))
    push(success)
    const events = await turn
    expect(calls.length).toBe(1)
    expect(events).toEqual([{ type: 'text-delta', text: 'Hello' }, { type: 'turn-end' }])
  })

  test('listCommands maps the SDK list and re-fetches on every call (no cache)', async () => {
    const supported = { calls: 0 }
    const base = streamingStub()
    const fn: QueryFn = (args) => {
      const stream = base.fn(args) as AsyncIterable<SdkMessage> & {
        supportedCommands?: () => Promise<unknown>
      }
      stream.supportedCommands = async () => {
        supported.calls += 1
        return [
          { name: 'context', description: 'Show context usage', argumentHint: '', aliases: [] },
          { name: 'model', description: 'Pick a model', argumentHint: '<model>' }
        ]
      }
      return stream
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    const list = await engine.listCommands()
    expect(list).toEqual([
      { name: 'context', description: 'Show context usage', argumentHint: '' },
      { name: 'model', description: 'Pick a model', argumentHint: '<model>' }
    ])
    await engine.listCommands()
    expect(supported.calls).toBe(2)
  })

  test('listCommands is empty with no live query', async () => {
    const { fn } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    expect(await engine.listCommands()).toEqual([])
  })

  test('listCommands is empty when the SDK call rejects', async () => {
    const base = streamingStub()
    const fn: QueryFn = (args) => {
      const stream = base.fn(args) as AsyncIterable<SdkMessage> & {
        supportedCommands?: () => Promise<unknown>
      }
      stream.supportedCommands = async () => {
        throw new Error('boom')
      }
      return stream
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    expect(await engine.listCommands()).toEqual([])
  })

  // #53 — the model list comes from the CLI, never from a constant here.
  test('listModels maps the SDK rows and re-fetches on every call (no cache)', async () => {
    const supported = { calls: 0 }
    const base = streamingStub()
    const fn: QueryFn = (args) => {
      const stream = base.fn(args) as AsyncIterable<SdkMessage> & {
        supportedModels?: () => Promise<unknown>
      }
      stream.supportedModels = async () => {
        supported.calls += 1
        return [
          {
            value: 'opus[1m]',
            resolvedModel: 'claude-opus-5[1m]',
            displayName: 'Opus (1M context)'
          },
          { value: 'claude-wisp-terra', displayName: 'terra — gpt-5.6-terra' }
        ]
      }
      return stream
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    const list = await engine.listModels()
    // id is `value`, NOT `resolvedModel` — sending a resolved id back as
    // options.model is the hang documented in model-mode.ts. resolvedModel
    // rides ALONGSIDE it, carried only so a CLI-reported id can be matched to
    // a row for labelling; a row without one simply omits it.
    expect(list).toEqual([
      {
        id: 'opus[1m]',
        label: 'Opus (1M context)',
        resolvedModel: 'claude-opus-5[1m]'
      },
      { id: 'claude-wisp-terra', label: 'terra — gpt-5.6-terra' }
    ])
    await engine.listModels()
    expect(supported.calls).toBe(2)
  })

  test('listModels drops rows with no usable value, and falls back to it for a label', async () => {
    const base = streamingStub()
    const fn: QueryFn = (args) => {
      const stream = base.fn(args) as AsyncIterable<SdkMessage> & {
        supportedModels?: () => Promise<unknown>
      }
      stream.supportedModels = async () => [
        { value: 'sonnet', displayName: 'Sonnet' },
        { value: 'haiku' },
        { value: '', displayName: 'empty' },
        { displayName: 'no value' },
        null
      ]
      return stream
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    expect(await engine.listModels()).toEqual([
      { id: 'sonnet', label: 'Sonnet' },
      { id: 'haiku', label: 'haiku' }
    ])
  })

  test('listModels is empty with no live query', async () => {
    const { fn } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    expect(await engine.listModels()).toEqual([])
  })

  test('listModels is empty when the SDK lacks the call', async () => {
    const { fn } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    expect(await engine.listModels()).toEqual([])
  })

  test('listModels is empty when the SDK call rejects', async () => {
    const base = streamingStub()
    const fn: QueryFn = (args) => {
      const stream = base.fn(args) as AsyncIterable<SdkMessage> & {
        supportedModels?: () => Promise<unknown>
      }
      stream.supportedModels = async () => {
        throw new Error('boom')
      }
      return stream
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    expect(await engine.listModels()).toEqual([])
  })

  test('a warm-up whose construction throws is inert: the next send rebuilds and works', async () => {
    let call = 0
    const base = streamingStub()
    const fn: QueryFn = (args) => {
      call += 1
      if (call === 1) throw new Error('spawn claude ENOENT')
      return base.fn(args)
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    base.push(delta('ok'))
    base.push(success)
    const events = await turn
    expect(events).toEqual([{ type: 'text-delta', text: 'ok' }, { type: 'turn-end' }])
    expect(call).toBe(2)
  })

  test('a warm-up whose stream dies before any turn is inert: the next send rebuilds and works', async () => {
    let call = 0
    const base = streamingStub()
    const fn: QueryFn = (args) => {
      call += 1
      if (call === 1) {
        // ponytail: generators require function*; no arrow form
        return (async function* (): AsyncGenerator<SdkMessage> {
          throw new Error('Invalid API key · Please run /login')
        })()
      }
      return base.fn(args)
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    // Let the dying stream finish failing before the real send arrives.
    await new Promise((r) => setTimeout(r, 0))
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    base.push(delta('ok'))
    base.push(success)
    const events = await turn
    expect(events).toEqual([{ type: 'text-delta', text: 'ok' }, { type: 'turn-end' }])
    expect(call).toBe(2)
  })

  test('warm-up failure then a genuinely broken backend: the send fails with the normal text', async () => {
    const fn: QueryFn = () => {
      throw new Error('spawn claude ENOENT')
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    const events = await collect(engine, 'hi')
    expect(events).toEqual([{ type: 'error', message: 'spawn claude ENOENT' }])
  })

  test('warmUp without a folder is a no-op', () => {
    const { fn, calls } = streamingStub()
    const engine = createEngine(() => null, autoAllow(), fn)
    engine.warmUp()
    expect(calls.length).toBe(0)
  })
})

// #40 — aliases ride the command list (absent-not-empty) so autocomplete can
// match /cost against /usage.
describe('engine command aliases (#40)', () => {
  test('non-empty aliases pass through; empty/absent stay absent', async () => {
    const base = streamingStub()
    const fn: QueryFn = (args) => {
      const stream = base.fn(args) as AsyncIterable<SdkMessage> & {
        supportedCommands?: () => Promise<unknown>
      }
      stream.supportedCommands = async () => [
        { name: 'usage', description: 'Show usage', argumentHint: '', aliases: ['cost', 'stats'] },
        { name: 'context', description: '', argumentHint: '', aliases: [] },
        { name: 'model', description: '', argumentHint: '' }
      ]
      return stream
    }
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    engine.warmUp()
    const list = await engine.listCommands()
    expect(list[0]).toEqual({
      name: 'usage',
      description: 'Show usage',
      argumentHint: '',
      aliases: ['cost', 'stats']
    })
    expect(list[1]).not.toHaveProperty('aliases')
    expect(list[2]).not.toHaveProperty('aliases')
  })
})

// #46: the workspace transaction's busy check reads the engine's OWN in-flight
// state. Anything else is a second flag that can disagree with reality.
describe('engine busy state', () => {
  test('is idle before any turn', () => {
    const { fn } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    expect(engine.isBusy()).toBe(false)
  })

  test('is busy while a turn is in flight and idle once it ends', async () => {
    const { fn, push } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    push(init)
    expect(engine.isBusy()).toBe(true)
    push(success)
    await turn
    expect(engine.isBusy()).toBe(false)
  })

  test('is idle again after close ends a live turn', async () => {
    const { fn } = streamingStub()
    const engine = createEngine(() => 'D:\proj', autoAllow(), fn)
    const turn = collect(engine, 'hi')
    await Promise.resolve()
    expect(engine.isBusy()).toBe(true)
    engine.close()
    await turn
    expect(engine.isBusy()).toBe(false)
  })
})
