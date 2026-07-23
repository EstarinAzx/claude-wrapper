import { describe, expect, test } from 'vitest'
import { isTrustedRendererUrl } from '../src/main/navigation'

describe('renderer URL trust boundary', () => {
  test('allows exact packaged renderer file and configured dev origin', () => {
    const packaged = 'file:///D:/app/out/renderer/index.html'
    expect(isTrustedRendererUrl(packaged, undefined, packaged)).toBe(true)
    expect(isTrustedRendererUrl(`${packaged}#chat`, undefined, packaged)).toBe(true)
    expect(
      isTrustedRendererUrl('http://localhost:5173/chat', 'http://localhost:5173')
    ).toBe(true)
  })

  test('rejects external, local-file, and lookalike origins', () => {
    expect(isTrustedRendererUrl('https://example.com')).toBe(false)
    expect(
      isTrustedRendererUrl(
        'file:///D:/tmp/untrusted.html',
        undefined,
        'file:///D:/app/out/renderer/index.html'
      )
    ).toBe(false)
    expect(
      isTrustedRendererUrl('http://localhost:5173.evil.test', 'http://localhost:5173')
    ).toBe(false)
  })
})
