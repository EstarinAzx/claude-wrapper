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

  test('image + text user content emits text and one attachment marker', () => {
    const raw =
      '{"type":"user","message":{"role":"user","content":[{"type":"image","source":{"type":"base64","media_type":"image/png","data":"AAAABBBBCCCC"}},{"type":"text","text":"[Image #1] what is this"}]}}'
    expect(parseTranscript(raw)).toEqual([
      {
        role: 'user',
        text: '[Image #1] what is this',
        attachments: [{ kind: 'image', mediaType: 'image/png' }],
      },
    ])
  })

  test('attachment payload (base64 data) is never forwarded', () => {
    const raw =
      '{"type":"user","message":{"role":"user","content":[{"type":"image","source":{"type":"base64","media_type":"image/png","data":"AAAABBBBCCCC"}},{"type":"text","text":"see this"}]}}'
    expect(JSON.stringify(parseTranscript(raw))).not.toContain('AAAABBBBCCCC')
  })

  test('block with a filename produces name on the marker', () => {
    const raw =
      '{"type":"user","message":{"role":"user","content":[{"type":"image","name":"diagram.png","source":{"type":"base64","media_type":"image/png","data":"xx"}},{"type":"text","text":"diagram"}]}}'
    expect(parseTranscript(raw)).toEqual([
      {
        role: 'user',
        text: 'diagram',
        attachments: [{ kind: 'image', mediaType: 'image/png', name: 'diagram.png' }],
      },
    ])
  })

  test('unknown block kind is recorded, not dropped', () => {
    const raw =
      '{"type":"user","message":{"role":"user","content":[{"type":"widget"},{"type":"text","text":"with widget"}]}}'
    expect(parseTranscript(raw)).toEqual([
      {
        role: 'user',
        text: 'with widget',
        attachments: [{ kind: 'widget' }],
      },
    ])
  })

  test('attachment-only message (document, no text) yields empty text + marker', () => {
    const raw =
      '{"type":"user","message":{"role":"user","content":[{"type":"document","source":{"type":"base64","media_type":"application/pdf","data":"JVBERi0x"}}]}}'
    expect(parseTranscript(raw)).toEqual([
      {
        role: 'user',
        text: '',
        attachments: [{ kind: 'document', mediaType: 'application/pdf' }],
      },
    ])
  })

  // Deliberate pin: pure-array-text user messages are CLI noise (skill
  // injections, "[Request interrupted by user]") and must keep parsing to [].
  test('array of only text blocks still parses to nothing', () => {
    const raw =
      '{"type":"user","message":{"role":"user","content":[{"type":"text","text":"Base directory for this skill: /tmp"}]}}'
    expect(parseTranscript(raw)).toEqual([])
  })

  test('plain string user message has no attachments key (absent-not-empty)', () => {
    const raw = '{"type":"user","message":{"role":"user","content":"just text"}}'
    const msgs = parseTranscript(raw)
    expect(msgs).toHaveLength(1)
    const msg = msgs[0]
    expect(msg.role).toBe('user')
    expect('attachments' in msg).toBe(false)
  })

  test('several images in one message produce markers in source order', () => {
    const raw =
      '{"type":"user","message":{"role":"user","content":[{"type":"image","source":{"type":"base64","media_type":"image/png","data":"aa"}},{"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":"bb"}},{"type":"text","text":"two pics"}]}}'
    expect(parseTranscript(raw)).toEqual([
      {
        role: 'user',
        text: 'two pics',
        attachments: [
          { kind: 'image', mediaType: 'image/png' },
          { kind: 'image', mediaType: 'image/jpeg' },
        ],
      },
    ])
  })
})
