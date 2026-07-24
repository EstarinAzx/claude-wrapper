import { describe, expect, test } from 'vitest'
import { homedir } from 'node:os'
import {
  parseMeta,
  listSubagents,
  readSubagentTranscript,
  type SubagentIo
} from '../src/main/subagent-store'

const slash = (p: string): string => p.replace(/\\/g, '/')

// In-memory io keyed by forward-slash paths. Both readdir and readFile normalise
// their (possibly backslash) argument so the store's win32 path.join output hits.
const fakeIo = (files: Record<string, string>): SubagentIo => ({
  readdir: async (dir) => {
    const d = slash(dir)
    const names = Object.keys(files)
      .filter((p) => p.startsWith(d + '/'))
      .map((p) => p.slice(d.length + 1))
      .filter((rest) => !rest.includes('/'))
    if (names.length === 0) throw new Error('ENOENT')
    return names
  },
  readFile: async (file) => {
    const hit = files[slash(file)]
    if (hit === undefined) throw new Error('ENOENT')
    return hit
  }
})

// The subagents dir for cwd 'D:\proj' / session 's1' (encodeCwd → 'D--proj').
const DIR = `${slash(homedir())}/.claude/projects/D--proj/s1/subagents`

const meta = (toolUseId: string, agentType: string): string =>
  JSON.stringify({ agentType, description: 'd', toolUseId, spawnDepth: 1 })

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
      agentType: 'Explore'
    })
  })
  test('missing toolUseId or garbage → null', () => {
    expect(parseMeta('{}')).toBeNull()
    expect(parseMeta('not json')).toBeNull()
    expect(parseMeta(JSON.stringify({ agentType: 'x' }))).toBeNull()
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
      agentType: 'Explore'
    })
    expect(infos).toContainEqual({
      parentToolUseId: 'call-parent-2',
      agentId: 'b2',
      agentType: 'general-purpose'
    })
  })

  test('no subagents dir → [] (lenient)', async () => {
    expect(await listSubagents('D:\\proj', 's1', fakeIo({}))).toEqual([])
  })

  test('null cwd or empty session → []', async () => {
    expect(await listSubagents(null, 's1', fakeIo({}))).toEqual([])
    expect(await listSubagents('D:\\proj', '', fakeIo({}))).toEqual([])
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
