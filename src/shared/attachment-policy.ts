// Single place the attachment caps, the embeddable allowlist and the embed-vs-path
// routing live. The renderer enforces this before anything crosses the IPC boundary.

import {
  EMBEDDABLE_IMAGE_TYPES,
  type Attachment,
  type ImageMediaType
} from './attachment-types'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_ATTACHMENTS = 10

/** A thing the composer is considering attaching, before policy has judged it. */
export interface Candidate {
  /** Display name, used on the chip and in a rejection message. */
  name: string
  mediaType: string
  /** Base64 payload with NO `data:` URL prefix, when the bytes are in hand (a paste). */
  data?: string
  /** Absolute path, when the item lives on disk (the file picker). */
  path?: string
}

export interface Accepted {
  name: string
  attachment: Attachment
}

export interface Rejection {
  name: string
  reason: string
}

export type Verdict =
  | { verdict: 'accept'; name: string; attachment: Attachment }
  | { verdict: 'reject'; name: string; reason: string }

export const isEmbeddable = (mediaType: string): mediaType is ImageMediaType =>
  (EMBEDDABLE_IMAGE_TYPES as readonly string[]).includes(mediaType)

// The picker hands us a bare path — no File.type to read — so the extension is
// the only signal for "is this an embeddable image?". Dependency-free so the
// renderer can share it; take the extension only from the last path segment so
// a dot in a parent directory never masquerades as one.
export const mediaTypeForPath = (path: string): string => {
  const base = path.split(/[/\\]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  // No dot, or a leading-dot name (`.gitignore`), is not an extension.
  if (dot <= 0) return 'application/octet-stream'
  const ext = base.slice(dot + 1).toLowerCase()
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    default:
      return 'application/octet-stream'
  }
}

/** Decoded byte length of a base64 string, without decoding it. */
export const decodedBytes = (base64: string): number => {
  if (base64.length === 0) return 0
  // Padding chars only appear at the end; count them to recover the true byte length.
  let padding = 0
  if (base64.endsWith('==')) padding = 2
  else if (base64.endsWith('=')) padding = 1
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

const MB = 1024 * 1024
// One decimal for the measured size (7.3 MB reads better than 7 MB); the cap is
// printed as-is so a whole-megabyte limit says "5 MB", not "5.0 MB".
const formatMb = (bytes: number): string => (bytes / MB).toFixed(1)

/** Judge one candidate, given how many attachments are already on the message. */
export const judgeAttachment = (
  candidate: Candidate,
  attachedCount: number
): Verdict => {
  // Destructured so an empty string reads as absent and each branch narrows.
  const { mediaType, name, data, path } = candidate

  if (attachedCount >= MAX_ATTACHMENTS) {
    return { verdict: 'reject', name, reason: `Only ${MAX_ATTACHMENTS} attachments per message` }
  }

  if (isEmbeddable(mediaType) && data) {
    const size = decodedBytes(data)
    if (size <= MAX_IMAGE_BYTES) {
      return { verdict: 'accept', name, attachment: { kind: 'image', mediaType, data } }
    }
    // Too big to embed. Fall through to the path route when one is available.
    if (!path) {
      return {
        verdict: 'reject',
        name,
        reason: `Too large at ${formatMb(size)} MB, over the ${MAX_IMAGE_BYTES / MB} MB limit`
      }
    }
  }

  if (path) {
    return { verdict: 'accept', name, attachment: { kind: 'path', path } }
  }

  return {
    verdict: 'reject',
    name,
    reason: `${mediaType} can't be embedded, since only PNG, JPEG, GIF and WebP images can be`
  }
}

/** Fold a batch of candidates onto an existing tray, enforcing the count cap. */
export const admitAttachments = (
  attachedCount: number,
  candidates: Candidate[]
): { accepted: Accepted[]; rejected: Rejection[] } => {
  const accepted: Accepted[] = []
  const rejected: Rejection[] = []
  let count = attachedCount

  for (const candidate of candidates) {
    const result = judgeAttachment(candidate, count)
    if (result.verdict === 'accept') {
      accepted.push({ name: result.name, attachment: result.attachment })
      count += 1
    } else {
      rejected.push({ name: result.name, reason: result.reason })
    }
  }

  return { accepted, rejected }
}
