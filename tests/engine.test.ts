import { describe, test, expect } from 'vitest'
import type { SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import {
  createEngine,
  type SdkMessage,
  type QueryFn,
  type RequestPermissionFn
} from '../src/main/engine'
import type { EngineEvent, PermissionDecision } from '../src/shared/engine-types'

/** Streaming-input stub: one long-lived async iterable the test can push into. */
function streamingStub() {
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

function autoAllow(): RequestPermissionFn {
  return async () => 'allow'
}

async function collect(
  engine: ReturnType<typeof createEngine>,
  prompt: string
): Promise<EngineEvent[]> {
  const events: EngineEvent[] = []
  await engine.runTurn(prompt, (e) => events.push(e))
  return events
}

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
    const inputs: SDKUserMessage[] = []
    const { fn: baseFn, calls, push } = streamingStub()
    const fn: QueryFn = ({ prompt, options }) => {
      void (async () => {
        for await (const message of prompt) inputs.push(message)
      })()
      return baseFn({ prompt: (async function* () {})(), options })
    }
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
      { type: 'error', message: 'query stream ended' }
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
      { type: 'error', message: 'query stream ended' }
    ])

    const second = await Promise.race([
      collect(engine, 'second'),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 20))
    ])
    expect(second).toEqual([
      { type: 'error', message: 'query stream ended' }
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
    void engine.runTurn('hi', () => {})
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
    void engine.runTurn('retry', () => {})
    expect(attempts).toBe(2)
  })

  test('error result maps to an error event', async () => {
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
    expect(events[events.length - 1].type).toBe('error')
  })

  test('a throwing query surfaces as an error event, promise still resolves', async () => {
    const fn: QueryFn = () =>
      (async function* (): AsyncGenerator<SdkMessage> {
        throw new Error('spawn claude ENOENT')
      })()
    const engine = createEngine(() => 'D:\\proj', autoAllow(), fn)
    const events = await collect(engine, 'hi')
    expect(events).toEqual([{ type: 'error', message: 'spawn claude ENOENT' }])
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
    const turn = engine.runTurn('hi', (e) => events.push(e))
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
    const turn = engine.runTurn('hi', (e) => events.push(e))
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
