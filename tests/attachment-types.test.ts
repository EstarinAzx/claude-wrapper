import { describe, test, expect } from 'vitest'
import { normalizeSendPayload } from '../src/shared/attachment-types'

describe('normalizeSendPayload', () => {
  test('well-formed text-only payload round-trips unchanged', () => {
    expect(normalizeSendPayload({ text: 'hi', attachments: [] })).toEqual({
      text: 'hi',
      attachments: []
    })
  })

  test('well-formed image attachment survives', () => {
    const payload = {
      text: 'see this',
      attachments: [{ kind: 'image', mediaType: 'image/png', data: 'abc' }]
    }
    expect(normalizeSendPayload(payload)).toEqual(payload)
  })

  test('well-formed path attachment survives', () => {
    const payload = {
      text: 'open this',
      attachments: [{ kind: 'path', path: 'D:\\x\\y.pdf' }]
    }
    expect(normalizeSendPayload(payload)).toEqual(payload)
  })

  test('image with disallowed mediaType is dropped; siblings survive', () => {
    expect(
      normalizeSendPayload({
        text: 'mixed',
        attachments: [
          { kind: 'image', mediaType: 'image/bmp', data: 'nope' },
          { kind: 'path', path: 'D:\\ok.txt' },
          { kind: 'image', mediaType: 'text/plain', data: 'nope' }
        ]
      })
    ).toEqual({
      text: 'mixed',
      attachments: [{ kind: 'path', path: 'D:\\ok.txt' }]
    })
  })

  test('malformed attachment entries are dropped rather than thrown', () => {
    expect(
      normalizeSendPayload({
        text: 'scrub',
        attachments: [
          { kind: 'image', mediaType: 'image/png' },
          { kind: 'path' },
          'bare-string',
          null,
          { kind: 'image', mediaType: 'image/png', data: 'keep' }
        ]
      })
    ).toEqual({
      text: 'scrub',
      attachments: [{ kind: 'image', mediaType: 'image/png', data: 'keep' }]
    })
  })

  test('non-object payload collapses to text with empty attachments', () => {
    expect(normalizeSendPayload('hello')).toEqual({ text: 'hello', attachments: [] })
    expect(normalizeSendPayload(null)).toEqual({ text: '', attachments: [] })
    expect(normalizeSendPayload(undefined)).toEqual({ text: '', attachments: [] })
  })

  test('non-array attachments yields an empty attachment list', () => {
    expect(normalizeSendPayload({ text: 'x', attachments: 'nope' })).toEqual({
      text: 'x',
      attachments: []
    })
    expect(normalizeSendPayload({ text: 'x' })).toEqual({ text: 'x', attachments: [] })
  })
})
