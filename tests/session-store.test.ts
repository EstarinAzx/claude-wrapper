import { describe, expect, test } from 'vitest'
import { encodeCwd, summary } from '../src/main/session-store'

describe('encodeCwd', () => {
  test('replaces every non-alphanumeric char with -', () => {
    expect(encodeCwd('D:\\.claude\\claude projects\\playground\\4')).toBe(
      'D---claude-claude-projects-playground-4'
    )
  })
})

describe('summary', () => {
  test('happy path: title, count, lastUpdated from mixed jsonl', () => {
    const raw = [
      '{"type":"custom-title","customTitle":"x"}',
      '{"type":"user","message":{"role":"user","content":"Hello there"},"timestamp":"2026-07-23T10:00:00.000Z"}',
      '{"type":"assistant","message":{"role":"assistant","content":[{"type":"text","text":"Hi"}]},"timestamp":"2026-07-23T10:00:05.000Z"}',
      'not json',
      '{"type":"user","message":{"role":"user","content":[{"type":"text","text":"second"}]},"timestamp":"2026-07-23T10:01:00.000Z"}',
    ].join('\n')

    const meta = summary(raw, 'abc')
    expect(meta.title).toBe('Hello there')
    expect(meta.messageCount).toBe(3)
    expect(meta.lastUpdated).toBe(Date.parse('2026-07-23T10:01:00.000Z'))
    expect(meta.id).toBe('abc')
  })

  test('lenient: garbage/blank input yields empty meta without throwing', () => {
    expect(summary('\n\n  \nnot json\n{{{', 'id1')).toEqual({
      id: 'id1',
      title: '',
      lastUpdated: 0,
      messageCount: 0,
    })
  })

  test('truncates title longer than 80 chars with ellipsis', () => {
    const long = 'a'.repeat(100)
    const raw = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: long },
      timestamp: '2026-07-23T10:00:00.000Z',
    })
    const meta = summary(raw, 't')
    expect(meta.title.length).toBe(81)
    expect(meta.title.endsWith('…')).toBe(true)
  })

  test('extracts title from array-only user content', () => {
    const raw = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text: 'from array' }] },
      timestamp: '2026-07-23T10:00:00.000Z',
    })
    expect(summary(raw, 'arr').title).toBe('from array')
  })
})
