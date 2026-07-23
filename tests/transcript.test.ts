import { describe, expect, test } from 'vitest'
import { parseTranscript } from '../src/main/transcript'

describe('parseTranscript', () => {
  test('happy path: user, assistant text, tool_use + tool_result', () => {
    const raw = [
      '{"type":"user","message":{"role":"user","content":"Hi there"}}',
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hello!"}]}}',
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tu1","name":"Read","input":{"file_path":"/a.ts"}}]}}',
      '{"type":"user","message":{"role":"user","content":[{"tool_use_id":"tu1","type":"tool_result","content":"file contents here","is_error":false}]}}',
    ].join('\n')

    expect(parseTranscript(raw)).toEqual([
      { role: 'user', text: 'Hi there' },
      { role: 'assistant', text: 'Hello!' },
      {
        role: 'tool',
        toolUseId: 'tu1',
        name: 'Read',
        input: { file_path: '/a.ts' },
        result: 'file contents here',
        isError: false,
      },
    ])
  })

  test('tool_result content as array of text blocks is joined', () => {
    const raw = [
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tu2","name":"Bash","input":{}}]}}',
      '{"type":"user","message":{"role":"user","content":[{"tool_use_id":"tu2","type":"tool_result","content":[{"type":"text","text":"line one"}],"is_error":false}]}}',
    ].join('\n')

    expect(parseTranscript(raw)).toEqual([
      {
        role: 'tool',
        toolUseId: 'tu2',
        name: 'Bash',
        input: {},
        result: 'line one',
        isError: false,
      },
    ])
  })

  test('is_error true sets isError on the backfilled tool message', () => {
    const raw = [
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tu3","name":"Bash","input":{}}]}}',
      '{"type":"user","message":{"role":"user","content":[{"tool_use_id":"tu3","type":"tool_result","content":"boom","is_error":true}]}}',
    ].join('\n')

    expect(parseTranscript(raw)).toEqual([
      {
        role: 'tool',
        toolUseId: 'tu3',
        name: 'Bash',
        input: {},
        result: 'boom',
        isError: true,
      },
    ])
  })

  test('unknown line types are skipped', () => {
    const raw = [
      '{"type":"mode","mode":"default"}',
      '{"type":"system","subtype":"init"}',
      '{"type":"file-history-snapshot","snapshot":{}}',
      '{"type":"custom-title","customTitle":"x"}',
      '{"type":"user","message":{"role":"user","content":"only me"}}',
    ].join('\n')

    expect(parseTranscript(raw)).toEqual([{ role: 'user', text: 'only me' }])
  })

  test('malformed / non-JSON lines are tolerated', () => {
    const raw = ['not json', '{{{', '', '  ', '{"type":"user","message":{"role":"user","content":"ok"}}'].join(
      '\n',
    )

    expect(parseTranscript(raw)).toEqual([{ role: 'user', text: 'ok' }])
  })

  test('sidechain entries are skipped', () => {
    const raw =
      '{"type":"user","isSidechain":true,"message":{"role":"user","content":"secret"}}'
    expect(parseTranscript(raw)).toEqual([])
  })

  test('orphan tool_result is silently skipped', () => {
    const raw =
      '{"type":"user","message":{"role":"user","content":[{"tool_use_id":"missing","type":"tool_result","content":"nope","is_error":false}]}}'
    expect(parseTranscript(raw)).toEqual([])
  })

  test('tool_use with missing name/input defaults to empty string and {}', () => {
    const raw =
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"tool_use","id":"tu4"}]}}'
    expect(parseTranscript(raw)).toEqual([
      {
        role: 'tool',
        toolUseId: 'tu4',
        name: '',
        input: {},
        result: null,
        isError: false,
      },
    ])
  })
})
