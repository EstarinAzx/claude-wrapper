import { beforeEach, describe, expect, test } from 'vitest'
import { homedir } from 'node:os'
import { resetSessionIndex, type StoreIo } from '../src/main/session-index'
import { parseMeta, listSubagents, readSubagentTranscript } from '../src/main/subagent-store'

const slash = (p: string): string => p.replace(/\\/g, '/')

// Mimic Node's ErrnoException so the store can distinguish missing from denied.
const enoent = (): Error => Object.assign(new Error('ENOENT'), { code: 'ENOENT' })

// In-memory io keyed by forward-slash paths. Every method normalises its
// (possibly backslash) argument so the store's win32 path.join output hits.
// readdir answers with immediate children — files AND subdirectory names, which
// is what the storage index enumerates.
const fakeIo = (files: Record<string, string>): StoreIo => ({
  readdir: async (dir) => {
    const d = slash(dir)
    const names = new Set<string>()
    for (const p of Object.keys(files)) {
      if (!p.startsWith(d + '/')) continue
      names.add(p.slice(d.length + 1).split('/')[0])
    }
    if (names.size === 0) throw enoent()
    return [...names]
  },
  readFile: async (file) => {
    const hit = files[slash(file)]
    if (hit === undefined) throw enoent()
    return hit
  },
  stat: async () => ({ mtimeMs: 0 })
})

// The subagents dir for session 's1', which the fake store keeps under the
// project directory 'D--proj'. That name is no longer derived from the cwd —
// the index maps 's1' to whatever directory physically holds it.
const DIR = `${slash(homedir())}/.claude/projects/D--proj/s1/subagents`

beforeEach(() => {
  resetSessionIndex()
})

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

  // Cross-feature edge with #68. Deleting a session removes <projectDir>/<id>/
  // — the whole subagent tree — along with the transcript, so an Agents dock
  // left open on that session is now asking about a directory that is gone.
  //
  // The store enumerates perfectly well here and still holds another session;
  // this one is simply absent. That has to answer the LENIENT [], which is what
  // makes the dock say "No agents in this session." rather than flip to
  // "Could not read this session's agents" and imply a breakage. Distinct from
  // the empty-store case above, where the root itself refuses to enumerate and
  // arrives at [] by a different route — so that test cannot stand in for this
  // one if the two answers are ever pulled apart.
  test('a session deleted out from under an open dock lists as [], not unreadable', async () => {
    const io = fakeIo({
      [`${slash(homedir())}/.claude/projects/D--proj/survivor.jsonl`]: '{}'
    })

    expect(await listSubagents('D:\\proj', 's1', io)).toEqual([])
  })

  test('empty session id → []', async () => {
    expect(await listSubagents('D:\\proj', '', fakeIo({}))).toEqual([])
  })

  // cwd is a display value now, not the storage key: a session discovered
  // without one still resolves through the index by id alone.
  test('a null cwd no longer blocks the lookup', async () => {
    const io = fakeIo({
      [`${DIR}/agent-a1.meta.json`]: meta('call-parent-1', 'Explore')
    })
    expect(await listSubagents(null, 's1', io)).toHaveLength(1)
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

  // The session resolves — it is the subagents directory itself that is
  // unreadable, which the panel must see as "could not read", not "none".
  test('non-ENOENT readdir error → null', async () => {
    const base = fakeIo({ [`${DIR}/agent-a1.meta.json`]: meta('call-1', 'Explore') })
    const io: StoreIo = {
      ...base,
      readdir: async (dir) => {
        if (slash(dir).endsWith('/subagents')) {
          throw Object.assign(new Error('EACCES'), { code: 'EACCES' })
        }
        return base.readdir(dir)
      }
    }
    expect(await listSubagents('D:\\proj', 's1', io)).toBeNull()
  })

  test('unreadable sidecar is skipped; siblings still list', async () => {
    const base = fakeIo({
      [`${DIR}/agent-ok.meta.json`]: meta('call-ok', 'Explore'),
      [`${DIR}/agent-bad.meta.json`]: meta('call-bad', 'Explore')
    })
    const io: StoreIo = {
      ...base,
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
