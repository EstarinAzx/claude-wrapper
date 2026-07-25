import { readFileSync } from 'node:fs'
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  createEvent,
  cleanup,
  waitFor,
  act
} from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi } from './chat-harness'
import {
  MAX_ATTACHMENTS,
  MAX_IMAGE_BYTES,
  type Candidate
} from '../src/shared/attachment-policy'

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
})

afterEach(() => {
  cleanup()
})

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const input = (): HTMLInputElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLInputElement

const tray = (): HTMLElement | null => screen.queryByLabelText('Attachments')
const chips = (): Element[] => Array.from(document.querySelectorAll('.attachment-chip'))
const rejects = (): Element[] => Array.from(document.querySelectorAll('.attachment-reject'))
const thumbs = (): Element[] => Array.from(document.querySelectorAll('.bubble-thumb'))

const imageFile = (name: string, type: string, bytes: number[]): File =>
  new File([new Uint8Array(bytes)], name, { type })

const b64 = (bytes: number[]): string => Buffer.from(Uint8Array.from(bytes)).toString('base64')

// jsdom's paste event carries no clipboardData of its own, so define one. Only
// `files` matters: an empty list is what a plain text paste looks like here.
const paste = (files: File[]): Event => {
  const el = input()
  const event = createEvent.paste(el)
  Object.defineProperty(event, 'clipboardData', {
    value: { files, items: [], getData: () => '' }
  })
  fireEvent(el, event)
  return event
}

const send = (text: string): void => {
  if (text) fireEvent.change(input(), { target: { value: text } })
  fireEvent.keyDown(input(), { key: 'Enter' })
}

const PNG = [137, 80, 78, 71]
const JPEG = [255, 216, 255, 224]

describe('pasting an image into the composer', () => {
  test('image data produces a chip with a thumbnail; the tray was absent before', async () => {
    await startSession()
    expect(tray()).toBeNull()

    paste([imageFile('shot.png', 'image/png', PNG)])

    await waitFor(() => expect(chips()).toHaveLength(1))
    expect(tray()).not.toBeNull()
    expect(screen.getByText('shot.png')).toBeTruthy()
    const thumb = document.querySelector('.attachment-chip .chip-thumb') as HTMLImageElement
    expect(thumb.src).toBe(`data:image/png;base64,${b64(PNG)}`)
  })

  test('a text paste is left alone: not prevented, no tray', async () => {
    await startSession()
    const event = paste([])
    expect(event.defaultPrevented).toBe(false)
    expect(tray()).toBeNull()
  })

  test('a chip can be removed before sending', async () => {
    await startSession()
    paste([imageFile('shot.png', 'image/png', PNG)])
    await waitFor(() => expect(chips()).toHaveLength(1))

    fireEvent.click(screen.getByLabelText('Remove shot.png'))

    expect(chips()).toHaveLength(0)
    // Removing the last chip takes the tray with it — an empty tray owns no space.
    expect(tray()).toBeNull()
  })

  test('several images attach in order and arrive in that order', async () => {
    await startSession()
    paste([
      imageFile('one.png', 'image/png', PNG),
      imageFile('two.jpg', 'image/jpeg', JPEG)
    ])
    await waitFor(() => expect(chips()).toHaveLength(2))

    send('compare these')

    expect(harness.prompts).toEqual([
      {
        text: 'compare these',
        attachments: [
          { kind: 'image', mediaType: 'image/png', data: b64(PNG) },
          { kind: 'image', mediaType: 'image/jpeg', data: b64(JPEG) }
        ]
      }
    ])
  })

  test('attachments with no text at all are sendable', async () => {
    await startSession()
    paste([imageFile('shot.png', 'image/png', PNG)])
    await waitFor(() => expect(chips()).toHaveLength(1))

    send('')

    expect(harness.prompts).toEqual([
      { text: '', attachments: [{ kind: 'image', mediaType: 'image/png', data: b64(PNG) }] }
    ])
  })

  test('the sent message renders its thumbnails and the tray clears', async () => {
    await startSession()
    paste([imageFile('shot.png', 'image/png', PNG)])
    await waitFor(() => expect(chips()).toHaveLength(1))

    send('what is wrong here')

    expect(thumbs()).toHaveLength(1)
    expect((thumbs()[0] as HTMLImageElement).src).toBe(`data:image/png;base64,${b64(PNG)}`)
    expect(chips()).toHaveLength(0)
    expect(tray()).toBeNull()
  })

  test('a text-only send leaves the transcript free of thumbnails', async () => {
    await startSession()
    send('no pictures')
    expect(thumbs()).toHaveLength(0)
    expect(harness.prompts).toEqual([{ text: 'no pictures', attachments: [] }])
  })

  test('the composer is still a single-line input', async () => {
    await startSession()
    expect(input().tagName).toBe('INPUT')
    expect(input().type).toBe('text')
  })
})

// jsdom never loads an image, so no test above can see a blocked one. In the real
// window `default-src 'self'` alone renders every thumbnail as a broken icon —
// found by driving a live paste through the built app. Pin the grant here.
describe('the renderer CSP', () => {
  test('img-src admits data: URLs, or every thumbnail renders broken', () => {
    const html = readFileSync('src/renderer/index.html', 'utf8')
    expect(html).toMatch(/img-src[^;"]*data:/)
  })
})

describe('the policy module refusing inline', () => {
  test('an oversized image is rejected by name and reason, and is not sent', async () => {
    await startSession()
    const big = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'huge.png', {
      type: 'image/png'
    })

    paste([big])

    await waitFor(() => expect(rejects()).toHaveLength(1), { timeout: 5000 })
    const text = rejects()[0]?.textContent ?? ''
    expect(text).toContain('huge.png')
    expect(text).toContain('Too large')
    expect(text).toContain(`the limit is ${MAX_IMAGE_BYTES / (1024 * 1024)} MB`)
    expect(chips()).toHaveLength(0)

    send('did it go')
    expect(harness.prompts).toEqual([{ text: 'did it go', attachments: [] }])
  })

  test('a non-image paste is routed by policy, not special-cased away', async () => {
    await startSession()
    paste([new File([new Uint8Array([1, 2, 3])], 'notes.pdf', { type: 'application/pdf' })])

    await waitFor(() => expect(rejects()).toHaveLength(1))
    const text = rejects()[0]?.textContent ?? ''
    expect(text).toContain('notes.pdf')
    expect(text).toContain('application/pdf')
    expect(chips()).toHaveLength(0)
  })

  test('overflowing the count cap rejects only the overflow', async () => {
    await startSession()
    const files = Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, i) =>
      imageFile(`shot-${i}.png`, 'image/png', PNG)
    )

    paste(files)

    await waitFor(() => expect(chips()).toHaveLength(MAX_ATTACHMENTS))
    expect(rejects()).toHaveLength(1)
    expect(rejects()[0]?.textContent).toContain(`shot-${MAX_ATTACHMENTS}.png`)
    // The earlier chips survived the refusal.
    expect(screen.getByText('shot-0.png')).toBeTruthy()
  })

  test('a good paste after a rejection clears the stale message', async () => {
    await startSession()
    paste([new File([new Uint8Array([1])], 'notes.pdf', { type: 'application/pdf' })])
    await waitFor(() => expect(rejects()).toHaveLength(1))

    paste([imageFile('shot.png', 'image/png', PNG)])

    await waitFor(() => expect(chips()).toHaveLength(1))
    expect(rejects()).toHaveLength(0)
  })
})

// The picker resolves off the event loop and the tray folds in a `.then`, so the
// microtask has to be flushed before asserting — including for a cancel, where
// the whole point is that nothing moved and a premature assertion would pass
// vacuously.
const pick = async (candidates: Candidate[]): Promise<void> => {
  harness.api.pickFiles.mockResolvedValue(candidates)
  fireEvent.click(screen.getByRole('button', { name: 'Attach files' }))
  await act(async () => {})
}

describe('the paperclip file picker', () => {
  test('keyboard reachable and labelled', async () => {
    await startSession()
    const btn = screen.getByRole('button', { name: 'Attach files' })
    // tabIndex={-1} is what made it decorative; its absence is the fix.
    expect(btn.getAttribute('tabindex')).toBeNull()
  })

  test('clicking opens the picker', async () => {
    await startSession()
    fireEvent.click(screen.getByRole('button', { name: 'Attach files' }))
    expect(harness.api.pickFiles).toHaveBeenCalledOnce()
  })

  test('chosen files become chips naming them', async () => {
    await startSession()
    await pick([
      {
        name: 'shot.png',
        mediaType: 'image/png',
        data: b64(PNG),
        path: 'D:\\proj\\shot.png'
      },
      {
        name: 'notes.pdf',
        mediaType: 'application/pdf',
        path: 'D:\\proj\\notes.pdf'
      }
    ])

    expect(chips()).toHaveLength(2)
    expect(screen.getByText('shot.png')).toBeTruthy()
    expect(screen.getByText('notes.pdf')).toBeTruthy()
    const shot = chips().find((c) => c.textContent?.includes('shot.png'))
    const notes = chips().find((c) => c.textContent?.includes('notes.pdf'))
    expect(shot?.querySelector('.chip-thumb')).toBeTruthy()
    expect(notes?.querySelector('.chip-thumb')).toBeNull()
  })

  // Both halves of the tray are pinned: a cancel that folded its empty batch
  // through the policy would keep the chip and silently wipe the rejection.
  test('cancelling changes nothing — chip and rejection both survive', async () => {
    await startSession()
    paste([
      imageFile('shot.png', 'image/png', PNG),
      new File([new Uint8Array([1])], 'notes.pdf', { type: 'application/pdf' })
    ])
    await waitFor(() => expect(chips()).toHaveLength(1))
    expect(rejects()).toHaveLength(1)

    await pick([])

    expect(chips()).toHaveLength(1)
    expect(rejects()).toHaveLength(1)
    expect(rejects()[0]?.textContent).toContain('notes.pdf')
  })

  test('a picked image embeds; a picked non-image goes by path', async () => {
    await startSession()
    await pick([
      {
        name: 'shot.png',
        mediaType: 'image/png',
        data: b64(PNG),
        path: 'D:\\proj\\shot.png'
      },
      {
        name: 'notes.pdf',
        mediaType: 'application/pdf',
        path: 'D:\\proj\\notes.pdf'
      }
    ])

    send('look')

    expect(harness.prompts).toEqual([
      {
        text: 'look',
        attachments: [
          { kind: 'image', mediaType: 'image/png', data: b64(PNG) },
          { kind: 'path', path: 'D:\\proj\\notes.pdf' }
        ]
      }
    ])
  })

  test('mixed sources in one message', async () => {
    await startSession()
    paste([imageFile('pasted.png', 'image/png', PNG)])
    await waitFor(() => expect(chips()).toHaveLength(1))

    await pick([
      {
        name: 'picked.jpg',
        mediaType: 'image/jpeg',
        data: b64(JPEG),
        path: 'D:\\proj\\picked.jpg'
      },
      {
        name: 'notes.pdf',
        mediaType: 'application/pdf',
        path: 'D:\\proj\\notes.pdf'
      }
    ])

    send('all three')

    expect(harness.prompts).toEqual([
      {
        text: 'all three',
        attachments: [
          { kind: 'image', mediaType: 'image/png', data: b64(PNG) },
          { kind: 'image', mediaType: 'image/jpeg', data: b64(JPEG) },
          { kind: 'path', path: 'D:\\proj\\notes.pdf' }
        ]
      }
    ])
  })

  test('the count cap is shared across sources', async () => {
    await startSession()
    const files = Array.from({ length: MAX_ATTACHMENTS }, (_, i) =>
      imageFile(`shot-${i}.png`, 'image/png', PNG)
    )
    paste(files)
    await waitFor(() => expect(chips()).toHaveLength(MAX_ATTACHMENTS))

    await pick([
      {
        name: 'extra.pdf',
        mediaType: 'application/pdf',
        path: 'D:\\proj\\extra.pdf'
      }
    ])

    expect(chips()).toHaveLength(MAX_ATTACHMENTS)
    expect(rejects()).toHaveLength(1)
    expect(rejects()[0]?.textContent).toContain('extra.pdf')
  })
})
