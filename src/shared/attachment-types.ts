// The media types an image block can carry — the same four the API accepts, so
// this doubles as the embeddable allowlist. Anything else is sent by path.
export const EMBEDDABLE_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
] as const

export type ImageMediaType = (typeof EMBEDDABLE_IMAGE_TYPES)[number]

const isImageMediaType = (v: unknown): v is ImageMediaType =>
  (EMBEDDABLE_IMAGE_TYPES as readonly unknown[]).includes(v)

// What can ride along with a prompt. Images are embedded as content blocks so
// the model sees them without a tool call; anything else travels as an absolute
// path the agent opens with its own file tools.
export type Attachment =
  | { kind: 'image'; mediaType: ImageMediaType; data: string }
  | { kind: 'path'; path: string }

// What crosses the send channel, replacing the bare prompt string. `attachments`
// is always present and is empty for an ordinary text send — that empty case
// must stay byte-identical to the string-only path it replaces.
export interface SendPayload {
  text: string
  attachments: Attachment[]
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object'

const normalizeAttachment = (raw: unknown): Attachment | null => {
  if (!isRecord(raw)) return null
  if (
    raw['kind'] === 'image' &&
    isImageMediaType(raw['mediaType']) &&
    typeof raw['data'] === 'string'
  ) {
    return { kind: 'image', mediaType: raw['mediaType'], data: raw['data'] }
  }
  if (raw['kind'] === 'path' && typeof raw['path'] === 'string') {
    return { kind: 'path', path: raw['path'] }
  }
  return null
}

// Trust boundary. The renderer builds and bounds the payload, but main must not
// hand a malformed one to the engine: a bad attachment is dropped rather than
// thrown on, and a non-object payload collapses to text — which is what the
// string-only channel this replaces did with `String(text)`.
export const normalizeSendPayload = (raw: unknown): SendPayload => {
  if (!isRecord(raw)) return { text: String(raw ?? ''), attachments: [] }
  const list = Array.isArray(raw['attachments']) ? raw['attachments'] : []
  return {
    text: typeof raw['text'] === 'string' ? raw['text'] : String(raw['text'] ?? ''),
    attachments: list
      .map(normalizeAttachment)
      .filter((a): a is Attachment => a !== null)
  }
}
