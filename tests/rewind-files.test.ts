// #129 — the rewind route's app-side half: the option that switches it on, the
// id that addresses a message, and the refusal contract main depends on.
//
// WHAT THIS FILE CANNOT SEE, so that nothing here is mistaken for evidence of
// it: whether rewind actually restores a file. That is a fact about the CLI, and
// it was measured by CALLING — #127 through the raw `rewind_files` wire route,
// #129 through the declared `q.rewindFiles()` method this build uses, both
// watching a real file on disk return to its pre-turn contents while a bogus id
// left it alone (`scripts/spike-129-findings.json`). A stub cannot corroborate
// that and does not try to. What it CAN pin is everything between the composer
// and that call, which is all of this app's own surface.
import { describe, test, expect } from 'vitest'
import type { SDKUserMessage } from '@anthropic-ai/claude-agent-sdk'
import { createEngine, type SdkMessage, type QueryFn } from '../src/main/engine'
import { normalizeSendPayload, type SendPayload } from '../src/shared/attachment-types'
import { isMessageUuid } from '../src/shared/message-uuid'

const UUID = '11111111-2222-4333-8444-555555555555'
const OTHER_UUID = '99999999-8888-4777-8666-555555555555'

/** A query handle that records what it was built with and what it was asked. */
const stub = (
  rewind?: (userMessageId: string, options?: { dryRun?: boolean }) => Promise<unknown>
) => {
  const calls: Array<{ options: Record<string, unknown> }> = []
  const inputs: SDKUserMessage[] = []
  const rewinds: Array<{ id: string; options?: { dryRun?: boolean } }> = []
  const fn: QueryFn = ({ prompt, options }) => {
    calls.push({ options })
    void (async () => {
      for await (const message of prompt) inputs.push(message)
    })()
    const handle = (async function* (): AsyncGenerator<SdkMessage> {
      // Never yields and never returns: the engine's consumer stays parked, so
      // nothing here is a terminal stream death.
      await new Promise<void>(() => {})
    })() as AsyncGenerator<SdkMessage> & {
      rewindFiles?: (id: string, o?: { dryRun?: boolean }) => Promise<unknown>
    }
    if (rewind) {
      handle.rewindFiles = (id, o) => {
        rewinds.push({ id, options: o })
        return rewind(id, o)
      }
    }
    return handle
  }
  return { fn, calls, inputs, rewinds }
}

const engineOn = (fn: QueryFn) =>
  createEngine(
    () => 'D:\\proj',
    async () => 'allow',
    fn
  )

const send = async (
  engine: ReturnType<typeof engineOn>,
  payload: SendPayload
): Promise<void> => {
  // runTurn resolves only at turn end and nothing here ends a turn, so the
  // promise is deliberately not awaited — the message is pushed synchronously.
  void engine.runTurn(payload, () => {})
  await Promise.resolve()
  await Promise.resolve()
}

describe('the checkpointing switch', () => {
  test('every query is built with enableFileCheckpointing — it binds at construction', async () => {
    const s = stub()
    const engine = engineOn(s.fn)
    engine.warmUp()
    expect(s.calls).toHaveLength(1)
    // The whole of what makes rewind work: without it the route is reachable
    // and answers "File rewinding is not enabled." (#127 measured exactly that).
    expect(s.calls[0]?.options['enableFileCheckpointing']).toBe(true)
  })
})

describe('the id a message is addressed by', () => {
  test('a payload carrying a uuid stamps it on the outgoing message', async () => {
    const s = stub()
    const engine = engineOn(s.fn)
    await send(engine, { text: 'hello', attachments: [], uuid: UUID })
    expect(s.inputs).toHaveLength(1)
    expect(s.inputs[0]?.uuid).toBe(UUID)
  })

  test('a payload with no uuid produces the message this app sent before #129', async () => {
    const s = stub()
    const engine = engineOn(s.fn)
    await send(engine, { text: 'hello', attachments: [] })
    // The core-path guarantee, stated as an ABSENCE rather than as "some
    // falsy value": `uuid: undefined` present as a key would still be a
    // different object, and the CLI is entitled to read a key it was given.
    expect(s.inputs[0] && 'uuid' in s.inputs[0]).toBe(false)
    expect(s.inputs[0]?.message.content).toBe('hello')
  })
})

describe('normalizeSendPayload as the uuid trust boundary', () => {
  test('a well-formed uuid survives the crossing', () => {
    expect(normalizeSendPayload({ text: 'hi', attachments: [], uuid: UUID }).uuid).toBe(UUID)
  })

  test('a malformed uuid is DROPPED, never coerced', () => {
    for (const bad of ['', 'not-a-uuid', 42, null, {}, ['a'], `${UUID}-extra`]) {
      const out = normalizeSendPayload({ text: 'hi', attachments: [], uuid: bad })
      // Absent, not stringified — #69's compare-never-coerce rule. A coercing
      // boundary would stamp the CLI's transcript with an id made up out of a
      // bad one, and that id would then address nothing forever.
      expect('uuid' in out).toBe(false)
    }
  })

  test('the guard admits the shape and nothing near it', () => {
    expect(isMessageUuid(UUID)).toBe(true)
    expect(isMessageUuid(UUID.toUpperCase())).toBe(true)
    expect(isMessageUuid(UUID.replace(/-/g, ''))).toBe(false)
    expect(isMessageUuid(` ${UUID}`)).toBe(false)
  })
})

describe('engine.rewindFiles', () => {
  test('forwards the id and the dryRun flag to the SDK method', async () => {
    const s = stub(async () => ({ canRewind: true, filesChanged: ['a', 'b'], insertions: 4, deletions: 2 }))
    const engine = engineOn(s.fn)
    engine.warmUp()

    const preview = await engine.rewindFiles(UUID, true)

    expect(s.rewinds).toEqual([{ id: UUID, options: { dryRun: true } }])
    // filesChanged crosses as a COUNT: the SDK answers it with absolute paths
    // on the user's disk and the number is what a confirmation needs.
    expect(preview).toEqual({
      canRewind: true,
      filesChanged: 2,
      insertions: 4,
      deletions: 2,
      error: null
    })
  })

  test('the destructive call is the same route with dryRun false', async () => {
    const s = stub(async () => ({ canRewind: true, skippedLinks: 0 }))
    const engine = engineOn(s.fn)
    engine.warmUp()

    const done = await engine.rewindFiles(UUID, false)

    expect(s.rewinds).toEqual([{ id: UUID, options: { dryRun: false } }])
    expect(done.canRewind).toBe(true)
    // A wet response carries no counts; they must read 0 rather than NaN.
    expect(done.filesChanged).toBe(0)
    expect(done.insertions).toBe(0)
  })

  test('a REJECTION becomes a refusal carrying the CLI text — it never rejects', async () => {
    // The ordinary refusal path, and it is measured rather than imagined: an id
    // with no checkpoint answers by THROWING (#129's bogus-uuid control, in both
    // arms). This is called from an ipcMain.handle, where an escaping rejection
    // becomes a modal error dialog over the app.
    const s = stub(async () => {
      throw new Error('No file checkpoint found for this message.')
    })
    const engine = engineOn(s.fn)
    engine.warmUp()

    const result = await engine.rewindFiles(OTHER_UUID, false)

    expect(result.canRewind).toBe(false)
    expect(result.error).toBe('No file checkpoint found for this message.')
  })

  test("a canRewind:false body carries the CLI's own reason through unrewritten", async () => {
    // The OTHER refusal mechanism for the same user-visible fact: checkpointing
    // off answers in the body rather than by throwing (#127 measured this one).
    const s = stub(async () => ({
      canRewind: false,
      error: 'File rewinding is not enabled.'
    }))
    const engine = engineOn(s.fn)
    engine.warmUp()

    const result = await engine.rewindFiles(UUID, true)

    expect(result).toEqual({
      canRewind: false,
      filesChanged: 0,
      insertions: 0,
      deletions: 0,
      error: 'File rewinding is not enabled.'
    })
  })

  test('an SDK with no rewindFiles method refuses instead of crashing', async () => {
    const s = stub() // no method installed
    const engine = engineOn(s.fn)
    engine.warmUp()

    const result = await engine.rewindFiles(UUID, true)

    expect(result.canRewind).toBe(false)
    expect(result.error).toMatch(/no live Claude Code session/i)
  })

  test('with no query at all it refuses without building one', async () => {
    const s = stub(async () => ({ canRewind: true }))
    const engine = engineOn(s.fn)
    // Deliberately NOT warmed. A rewind must not be a reason to spawn a CLI:
    // a fresh process's checkpoints are its own, so it could only ever answer
    // "no checkpoint for this message" — at ~5.5s (#112 measured the rebuild).
    const result = await engine.rewindFiles(UUID, true)

    expect(result.canRewind).toBe(false)
    expect(s.calls).toHaveLength(0)
  })

  test('a malformed id is refused BEFORE the SDK is reached', async () => {
    const s = stub(async () => ({ canRewind: true }))
    const engine = engineOn(s.fn)
    engine.warmUp()

    const result = await engine.rewindFiles('not-a-uuid', false)

    expect(result.canRewind).toBe(false)
    // Asserted on the PORT, not only on the status: a version that called the
    // SDK and then reported a refusal would pass a status-only check while
    // having already moved files.
    expect(s.rewinds).toEqual([])
  })
})
