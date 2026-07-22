import { describe, test, expect } from 'vitest'
import { createEngine, type SdkMessage, type QueryFn } from '../src/main/engine'
import type { EngineEvent } from '../src/shared/engine-types'

function stubQuery(turns: SdkMessage[][]): { calls: Record<string, unknown>[]; fn: QueryFn } {
  const calls: Record<string, unknown>[] = []
  let i = 0
  const fn: QueryFn = ({ options }) => {
    calls.push(options)
    const messages = turns[i++] ?? []
    return (async function* () {
      for (const m of messages) yield m
    })()
  }
  return { calls, fn }
}

async function collect(engine: ReturnType<typeof createEngine>, prompt: string) {
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
    const { fn } = stubQuery([[init, delta('Hel'), delta('lo'), success]])
    const engine = createEngine(() => 'D:\\proj', fn)
    const events = await collect(engine, 'hi')
    expect(events).toEqual([
      { type: 'text-delta', text: 'Hel' },
      { type: 'text-delta', text: 'lo' },
      { type: 'turn-end' }
    ])
  })

  test('first turn passes cwd and partial messages, no resume', async () => {
    const { calls, fn } = stubQuery([[init, success]])
    const engine = createEngine(() => 'D:\\proj', fn)
    await collect(engine, 'hi')
    expect(calls[0]).toMatchObject({ cwd: 'D:\\proj', includePartialMessages: true })
    expect(calls[0]).not.toHaveProperty('resume')
  })

  test('second turn resumes the captured session id', async () => {
    const { calls, fn } = stubQuery([
      [init, success],
      [init, success]
    ])
    const engine = createEngine(() => 'D:\\proj', fn)
    await collect(engine, 'first')
    await collect(engine, 'second')
    expect(calls[1]).toMatchObject({ resume: 'sess-1' })
  })

  test('error result maps to an error event', async () => {
    const errorResult: SdkMessage = {
      type: 'result',
      subtype: 'error_during_execution',
      session_id: 'sess-1',
      is_error: true
    }
    const { fn } = stubQuery([[init, errorResult]])
    const engine = createEngine(() => 'D:\\proj', fn)
    const events = await collect(engine, 'hi')
    expect(events[events.length - 1].type).toBe('error')
  })

  test('a throwing query surfaces as an error event, promise still resolves', async () => {
    const fn: QueryFn = () =>
      (async function* (): AsyncGenerator<SdkMessage> {
        throw new Error('spawn claude ENOENT')
      })()
    const engine = createEngine(() => 'D:\\proj', fn)
    const events = await collect(engine, 'hi')
    expect(events).toEqual([{ type: 'error', message: 'spawn claude ENOENT' }])
  })

  test('missing session cwd surfaces as an error event', async () => {
    const { fn } = stubQuery([[]])
    const engine = createEngine(() => null, fn)
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
    const { fn } = stubQuery([[init, assistantMsg, success]])
    const engine = createEngine(() => 'D:\\proj', fn)
    const events = await collect(engine, 'hi')
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
    const { fn } = stubQuery([[init, assistantMsg, success]])
    const engine = createEngine(() => 'D:\\proj', fn)
    const events = await collect(engine, 'hi')
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
    const { fn } = stubQuery([[init, resultMsg, success]])
    const engine = createEngine(() => 'D:\\proj', fn)
    const events = await collect(engine, 'hi')
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
    const { fn } = stubQuery([[init, resultMsg, success]])
    const engine = createEngine(() => 'D:\\proj', fn)
    const events = await collect(engine, 'hi')
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
    const { fn } = stubQuery([[init, echoMsg, success]])
    const engine = createEngine(() => 'D:\\proj', fn)
    const events = await collect(engine, 'hi')
    expect(events).toEqual([{ type: 'turn-end' }])
  })
})
