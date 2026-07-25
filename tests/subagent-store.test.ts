import { describe, expect, test } from 'vitest'
import { homedir } from 'node:os'
import {
  parseMeta,
  listSubagents,
  readSubagentTranscript,
  type SubagentIo
} from '../src/main/subagent-store'

const slash = (p: string): string => p.replace(/\\/g, '/')

// Mimic Node's ErrnoException so the store can distinguish missing from denied.
const enoent = (): Error => Object.assign(new Error('ENOENT'), { code: 'ENOENT' })

// In-memory io keyed by forward-slash paths. Both readdir and readFile normalise
// their (possibly backslash) argument so the store's win32 path.join output hits.
const fakeIo = (files: Record<string, string>): SubagentIo => ({
  readdir: async (dir) => {
    const d = slash(dir)
    const names = Object.keys(files)
      .filter((p) => p.startsWith(d + '/'))
      .map((p) => p.slice(d.length + 1))
      .filter((rest) => !rest.includes('/'))
    if (names.length === 0) throw enoent()
    return names
  },
  readFile: async (file) => {
    const hit = files[slash(file)]
    if (hit === undefined) throw enoent()
    return hit
  }
})

// The subagents dir for cwd 'D:\proj' / session 's1' (encodeCwd → 'D--proj').
const DIR = `${slash(homedir())}/.claude/projects/D--proj/s1/subagents`

const meta = (
  toolUseId: string,
  agentType: string,
  extra: Record<string, unknown> = {}
): string =>
  JSON.stringify({ agentType, description: 'd', toolUseId, spawnDepth: 1, ...extra })

const subJsonl = [
  JSON.stringify({
    isSidechain: true,
    agentId: 'a1',
    type: 'user',
    message: { role: 'user', content: 'do the thing' }
  }),
  JSON.stringify({
    isSidechain: true,
    agentId: 'a1',
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        { type: 'text', text: 'on it' },
        { type: 'tool_use', id: 'sub-1', name: 'Read', input: { file_path: 'x.ts' } }
      ]
    }
  }),
  JSON.stringify({
    isSidechain: true,
    agentId: 'a1',
    type: 'user',
    message: { content: [{ type: 'tool_result', tool_use_id: 'sub-1', content: 'file body' }] }
  })
].join('\n')

describe('parseMeta', () => {
  test('extracts toolUseId + agentType', () => {
    expect(parseMeta(meta('call-9', 'Explore'))).toEqual({
      toolUseId: 'call-9',
      agentType: 'Explore',
      description: 'd',
      spawnDepth: 1
    })
  })
  test('missing toolUseId or garbage → null', () => {
    expect(parseMeta('{}')).toBeNull()
    expect(parseMeta('not json')).toBeNull()
    expect(parseMeta(JSON.stringify({ agentType: 'x' }))).toBeNull()
  })
  test('all six fields map through', () => {
    expect(
      parseMeta(
        JSON.stringify({
          toolUseId: 'call-1',
          agentType: 'Explore',
          description: 'look around',
          model: 'sonnet',
          spawnDepth: 2,
          parentAgentId: 'parent-9'
        })
      )
    ).toEqual({
      toolUseId: 'call-1',
      agentType: 'Explore',
      description: 'look around',
      model: 'sonnet',
      spawnDepth: 2,
      parentAgentId: 'parent-9'
    })
  })
  test('optional keys omitted entirely when sidecar lacks them', () => {
    const result = parseMeta(JSON.stringify({ toolUseId: 'call-1', agentType: 'Explore' }))
    expect(result).toEqual({ toolUseId: 'call-1', agentType: 'Explore' })
    expect(Object.keys(result ?? {})).toEqual(['toolUseId', 'agentType'])
  })
  test('non-numeric spawnDepth and empty model are dropped', () => {
    const result = parseMeta(
      JSON.stringify({
        toolUseId: 'call-1',
        agentType: 'Explore',
        model: '',
        spawnDepth: 'deep'
      })
    )
    expect(result).toEqual({ toolUseId: 'call-1', agentType: 'Explore' })
    expect(Object.keys(result ?? {})).toEqual(['toolUseId', 'agentType'])
  })
})

describe('listSubagents', () => {
  test('correlates each agentId to its parent Task tool_use via meta', async () => {
    const io = fakeIo({
      [`${DIR}/agent-a1.meta.json`]: meta('call-parent-1', 'Explore'),
      [`${DIR}/agent-a1.jsonl`]: subJsonl,
      [`${DIR}/agent-b2.meta.json`]: meta('call-parent-2', 'general-purpose'),
      [`${DIR}/agent-b2.jsonl`]: '{}'
    })
    const infos = await listSubagents('D:\\proj', 's1', io)
    expect(infos).toContainEqual({
      parentToolUseId: 'call-parent-1',
      agentId: 'a1',
      agentType: 'Explore',
      description: 'd',
      spawnDepth: 1
    })
    expect(infos).toContainEqual({
      parentToolUseId: 'call-parent-2',
      agentId: 'b2',
      agentType: 'general-purpose',
      description: 'd',
      spawnDepth: 1
    })
  })

  test('no subagents dir → [] (lenient)', async () => {
    expect(await listSubagents('D:\\proj', 's1', fakeIo({}))).toEqual([])
  })

  test('null cwd or empty session → []', async () => {
    expect(await listSubagents(null, 's1', fakeIo({}))).toEqual([])
    expect(await listSubagents('D:\\proj', '', fakeIo({}))).toEqual([])
  })

  test('nested sidecar surfaces parentAgentId', async () => {
    const io = fakeIo({
      [`${DIR}/agent-child.meta.json`]: meta('call-nested', 'Explore', {
        parentAgentId: 'agent-parent'
      })
    })
    const infos = await listSubagents('D:\\proj', 's1', io)
    expect(infos).toContainEqual({
      parentToolUseId: 'call-nested',
      agentId: 'child',
      agentType: 'Explore',
      description: 'd',
      spawnDepth: 1,
      parentAgentId: 'agent-parent'
    })
  })

  test('non-ENOENT readdir error → null', async () => {
    const io: SubagentIo = {
      readdir: async () => {
        throw Object.assign(new Error('EACCES'), { code: 'EACCES' })
      },
      readFile: async () => {
        throw enoent()
      }
    }
    expect(await listSubagents('D:\\proj', 's1', io)).toBeNull()
  })

  test('unreadable sidecar is skipped; siblings still list', async () => {
    const base = fakeIo({
      [`${DIR}/agent-ok.meta.json`]: meta('call-ok', 'Explore'),
      [`${DIR}/agent-bad.meta.json`]: meta('call-bad', 'Explore')
    })
    const io: SubagentIo = {
      readdir: base.readdir,
      readFile: async (file) => {
        if (slash(file).endsWith('agent-bad.meta.json')) {
          throw Object.assign(new Error('EACCES'), { code: 'EACCES' })
        }
        return base.readFile(file)
      }
    }
    const infos = await listSubagents('D:\\proj', 's1', io)
    expect(infos).toEqual([
      {
        parentToolUseId: 'call-ok',
        agentId: 'ok',
        agentType: 'Explore',
        description: 'd',
        spawnDepth: 1
      }
    ])
  })
})

describe('readSubagentTranscript', () => {
  test('resolves the parent tool-use id to the agent transcript, sidechain kept', async () => {
    const io = fakeIo({
      [`${DIR}/agent-a1.meta.json`]: meta('call-parent-1', 'Explore'),
      [`${DIR}/agent-a1.jsonl`]: subJsonl
    })
    const msgs = await readSubagentTranscript('D:\\proj', 's1', 'call-parent-1', io)
    expect(msgs).toEqual([
      { role: 'user', text: 'do the thing' },
      { role: 'assistant', text: 'on it' },
      {
        role: 'tool',
        toolUseId: 'sub-1',
        name: 'Read',
        input: { file_path: 'x.ts' },
        result: 'file body',
        isError: false
      }
    ])
  })

  test('unknown parent tool-use id → [] (lenient)', async () => {
    const io = fakeIo({
      [`${DIR}/agent-a1.meta.json`]: meta('call-parent-1', 'Explore'),
      [`${DIR}/agent-a1.jsonl`]: subJsonl
    })
    expect(await readSubagentTranscript('D:\\proj', 's1', 'nope', io)).toEqual([])
  })
})
