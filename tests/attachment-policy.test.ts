import { describe, test, expect } from 'vitest'
import {
  MAX_IMAGE_BYTES,
  MAX_ATTACHMENTS,
  decodedBytes,
  judgeAttachment,
  admitAttachments,
  mediaTypeForPath,
  type Candidate
} from '../src/shared/attachment-policy'
import { EMBEDDABLE_IMAGE_TYPES } from '../src/shared/attachment-types'

// Base64 of exactly `bytes` decoded length. Full 3-byte groups are unpadded
// quartets; a remainder of 1 or 2 uses the matching `=` / `==` padding.
const b64OfBytes = (bytes: number): string => {
  const full = Math.floor(bytes / 3)
  const rem = bytes % 3
  const head = 'A'.repeat(full * 4)
  if (rem === 0) return head
  if (rem === 1) return head + 'AA=='
  return head + 'AAA='
}

const image = (
  mediaType: string,
  data: string,
  extras: Partial<Candidate> = {}
): Candidate => ({
  name: 'shot.png',
  mediaType,
  data,
  ...extras
})

describe('decodedBytes', () => {
  test('empty string is 0', () => {
    expect(decodedBytes('')).toBe(0)
  })

  test('unpadded quartet decodes to 3 bytes', () => {
    expect(decodedBytes('AAAA')).toBe(3)
  })

  test('one padding char decodes to 2 bytes', () => {
    expect(decodedBytes('AAA=')).toBe(2)
  })

  test('two padding chars decode to 1 byte', () => {
    expect(decodedBytes('AA==')).toBe(1)
  })
})

describe('mediaTypeForPath', () => {
  test('.png → image/png', () => {
    expect(mediaTypeForPath('shot.png')).toBe('image/png')
  })

  test('.jpg → image/jpeg', () => {
    expect(mediaTypeForPath('shot.jpg')).toBe('image/jpeg')
  })

  test('.jpeg → image/jpeg', () => {
    expect(mediaTypeForPath('shot.jpeg')).toBe('image/jpeg')
  })

  test('.gif → image/gif', () => {
    expect(mediaTypeForPath('shot.gif')).toBe('image/gif')
  })

  test('.webp → image/webp', () => {
    expect(mediaTypeForPath('shot.webp')).toBe('image/webp')
  })

  test('uppercase extension is case-insensitive', () => {
    expect(mediaTypeForPath('SHOT.PNG')).toBe('image/png')
  })

  test('unknown extension falls back to octet-stream', () => {
    expect(mediaTypeForPath('notes.pdf')).toBe('application/octet-stream')
  })

  test('no extension at all is octet-stream', () => {
    expect(mediaTypeForPath('README')).toBe('application/octet-stream')
  })

  test('dot in a parent directory does not count as an extension', () => {
    expect(mediaTypeForPath('D:\\my.folder\\README')).toBe('application/octet-stream')
  })

  test('dotfile is not an extension', () => {
    expect(mediaTypeForPath('.gitignore')).toBe('application/octet-stream')
  })

  test('forward-slash separator works', () => {
    expect(mediaTypeForPath('/tmp/photos/shot.png')).toBe('image/png')
  })

  test('backslash separator works', () => {
    expect(mediaTypeForPath('D:\\photos\\shot.jpeg')).toBe('image/jpeg')
  })
})

describe('judgeAttachment — embeddable images', () => {
  for (const mediaType of EMBEDDABLE_IMAGE_TYPES) {
    test(`${mediaType} with data is accepted as kind image`, () => {
      const data = 'AAAA'
      const result = judgeAttachment(image(mediaType, data, { name: 'x' }), 0)
      expect(result).toEqual({
        verdict: 'accept',
        name: 'x',
        attachment: { kind: 'image', mediaType, data }
      })
    })
  }

  test('payload decoding to exactly MAX_IMAGE_BYTES is accepted', () => {
    const data = b64OfBytes(MAX_IMAGE_BYTES)
    expect(decodedBytes(data)).toBe(MAX_IMAGE_BYTES)
    const result = judgeAttachment(image('image/png', data), 0)
    expect(result.verdict).toBe('accept')
    if (result.verdict === 'accept') {
      expect(result.attachment).toEqual({
        kind: 'image',
        mediaType: 'image/png',
        data
      })
    }
  })

  test('payload one byte over MAX_IMAGE_BYTES with no path is rejected', () => {
    const data = b64OfBytes(MAX_IMAGE_BYTES + 1)
    expect(decodedBytes(data)).toBeGreaterThan(MAX_IMAGE_BYTES)
    const result = judgeAttachment(image('image/png', data), 0)
    expect(result.verdict).toBe('reject')
    if (result.verdict === 'reject') {
      const actualMb = (decodedBytes(data) / (1024 * 1024)).toFixed(1)
      expect(result.reason).toContain(`${actualMb} MB`)
      expect(result.reason).toContain(`over the ${MAX_IMAGE_BYTES / (1024 * 1024)} MB limit`)
    }
  })

  test('oversized image WITH a path falls through to path accept', () => {
    const data = b64OfBytes(MAX_IMAGE_BYTES + 1)
    const result = judgeAttachment(
      image('image/png', data, { path: 'D:\\big.png', name: 'big.png' }),
      0
    )
    expect(result).toEqual({
      verdict: 'accept',
      name: 'big.png',
      attachment: { kind: 'path', path: 'D:\\big.png' }
    })
  })

  test('embeddable media type with neither data nor path is rejected', () => {
    const result = judgeAttachment(
      { name: 'empty.png', mediaType: 'image/png' },
      0
    )
    expect(result.verdict).toBe('reject')
    if (result.verdict === 'reject') {
      expect(result.reason).toContain('image/png')
    }
  })
})

describe('judgeAttachment — non-embeddable', () => {
  test('non-embeddable media type with no path is rejected naming the type', () => {
    const result = judgeAttachment(
      { name: 'notes.pdf', mediaType: 'application/pdf' },
      0
    )
    expect(result.verdict).toBe('reject')
    if (result.verdict === 'reject') {
      expect(result.reason).toContain('application/pdf')
    }
  })

  test('non-embeddable media type WITH a path is accepted as kind path', () => {
    const result = judgeAttachment(
      {
        name: 'notes.pdf',
        mediaType: 'application/pdf',
        path: 'D:\\docs\\notes.pdf'
      },
      0
    )
    expect(result).toEqual({
      verdict: 'accept',
      name: 'notes.pdf',
      attachment: { kind: 'path', path: 'D:\\docs\\notes.pdf' }
    })
  })
})

describe('judgeAttachment — count cap', () => {
  test('attachedCount === MAX_ATTACHMENTS rejects with the count reason', () => {
    const result = judgeAttachment(image('image/png', 'AAAA', { name: 'n.png' }), MAX_ATTACHMENTS)
    expect(result).toEqual({
      verdict: 'reject',
      name: 'n.png',
      reason: `Only ${MAX_ATTACHMENTS} attachments per message`
    })
  })

  test('attachedCount === MAX_ATTACHMENTS - 1 still accepts', () => {
    const result = judgeAttachment(
      image('image/png', 'AAAA'),
      MAX_ATTACHMENTS - 1
    )
    expect(result.verdict).toBe('accept')
  })
})

describe('admitAttachments', () => {
  test('from 0 with three good candidates accepts all three in order', () => {
    const candidates: Candidate[] = [
      image('image/png', 'AAAA', { name: 'a.png' }),
      image('image/jpeg', 'AAAA', { name: 'b.jpg' }),
      { name: 'c.pdf', mediaType: 'application/pdf', path: 'D:\\c.pdf' }
    ]
    const { accepted, rejected } = admitAttachments(0, candidates)
    expect(rejected).toEqual([])
    expect(accepted.map((a) => a.name)).toEqual(['a.png', 'b.jpg', 'c.pdf'])
    expect(accepted[0]?.attachment).toEqual({
      kind: 'image',
      mediaType: 'image/png',
      data: 'AAAA'
    })
    expect(accepted[1]?.attachment).toEqual({
      kind: 'image',
      mediaType: 'image/jpeg',
      data: 'AAAA'
    })
    expect(accepted[2]?.attachment).toEqual({ kind: 'path', path: 'D:\\c.pdf' })
  })

  test('overflow keeps the first MAX remaining and rejects the rest', () => {
    const candidates: Candidate[] = [
      image('image/png', 'AAAA', { name: '1.png' }),
      image('image/png', 'AAAA', { name: '2.png' }),
      image('image/png', 'AAAA', { name: '3.png' }),
      image('image/png', 'AAAA', { name: '4.png' })
    ]
    const { accepted, rejected } = admitAttachments(MAX_ATTACHMENTS - 2, candidates)
    expect(accepted.map((a) => a.name)).toEqual(['1.png', '2.png'])
    expect(rejected.map((r) => r.name)).toEqual(['3.png', '4.png'])
    for (const r of rejected) {
      expect(r.reason).toBe(`Only ${MAX_ATTACHMENTS} attachments per message`)
    }
  })

  test('a rejected candidate does not consume budget', () => {
    const oversized = b64OfBytes(MAX_IMAGE_BYTES + 1)
    const candidates: Candidate[] = [
      image('image/png', oversized, { name: 'big.png' }),
      image('image/png', 'AAAA', { name: 'good.png' })
    ]
    const { accepted, rejected } = admitAttachments(MAX_ATTACHMENTS - 1, candidates)
    expect(rejected.map((r) => r.name)).toEqual(['big.png'])
    expect(accepted.map((a) => a.name)).toEqual(['good.png'])
  })
})
