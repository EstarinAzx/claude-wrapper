import type { AttachmentMarker, TranscriptMessage } from '../shared/session-types'

type ToolMessage = Extract<TranscriptMessage, { role: 'tool' }>

const extractText = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((b): b is { type: string; text?: string } =>
        !!b && typeof b === 'object' && (b as { type?: unknown }).type === 'text')
      .map((b) => (typeof b.text === 'string' ? b.text : ''))
      .join('')
  }
  return ''
}

// Map a non-text content block to a lightweight marker. Never reads source.data
// — the payload must not cross IPC on session open.
const toAttachmentMarker = (block: Record<string, unknown>): AttachmentMarker => {
  const kind =
    typeof block.type === 'string' && block.type ? block.type : 'unknown'

  const source =
    block.source && typeof block.source === 'object' && !Array.isArray(block.source)
      ? (block.source as Record<string, unknown>)
      : undefined

  let mediaType: string | undefined
  if (source && typeof source.media_type === 'string') {
    mediaType = source.media_type
  } else if (typeof block.media_type === 'string') {
    mediaType = block.media_type
  }

  let name: string | undefined
  if (typeof block.name === 'string') name = block.name
  else if (typeof block.filename === 'string') name = block.filename
  else if (typeof block.title === 'string') name = block.title

  const marker: AttachmentMarker = { kind }
  if (mediaType !== undefined) marker.mediaType = mediaType
  if (name !== undefined) marker.name = name
  return marker
}

// Parse a native JSONL transcript to the replay message list. Main-session
// transcripts tag subagent lines with `isSidechain: true` and those are dropped
// by default (they belong to the subagent, not the main thread). A subagent's
// OWN transcript file is entirely sidechain lines, so the subagent viewer passes
// { includeSidechain: true } to keep them.
export const parseTranscript = (
  raw: string,
  opts: { includeSidechain?: boolean } = {}
): TranscriptMessage[] => {
  const messages: TranscriptMessage[] = []
  const toolsById = new Map<string, ToolMessage>()

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue

    let rec: Record<string, unknown>
    try {
      const parsed: unknown = JSON.parse(line)
      if (!parsed || typeof parsed !== 'object') continue
      rec = parsed as Record<string, unknown>
    } catch {
      continue
    }

    if (rec.isSidechain === true && !opts.includeSidechain) continue

    const type = rec.type
    const message = rec.message as { content?: unknown } | undefined
    const content = message?.content

    if (type === 'user') {
      if (typeof content === 'string') {
        if (content.trim()) {
          messages.push({ role: 'user', text: content })
        }
      } else if (Array.isArray(content)) {
        // tool_result never co-occurs with text/image in real transcripts; pure
        // tool_result arrays fold into matching tool messages and emit no user msg.
        const hasToolResult = content.some(
          (block) =>
            !!block &&
            typeof block === 'object' &&
            (block as Record<string, unknown>).type === 'tool_result',
        )
        if (hasToolResult) {
          for (const block of content) {
            if (!block || typeof block !== 'object') continue
            const b = block as Record<string, unknown>
            if (b.type !== 'tool_result') continue
            const id = b.tool_use_id
            if (typeof id !== 'string') continue
            const text = extractText(b.content)
            const isError = b.is_error === true
            const tool = toolsById.get(id)
            if (tool && tool.result === null) {
              tool.result = text
              tool.isError = isError
            }
          }
        } else {
          // Non-tool array: emit text + attachment markers. Pure-text arrays
          // (CLI noise) intentionally still parse to nothing — markers empty.
          const markers: AttachmentMarker[] = []
          for (const block of content) {
            if (!block || typeof block !== 'object') continue
            const b = block as Record<string, unknown>
            if (b.type === 'text') continue
            markers.push(toAttachmentMarker(b))
          }
          if (markers.length > 0) {
            messages.push({
              role: 'user',
              text: extractText(content),
              attachments: markers,
            })
          }
        }
      }
    } else if (type === 'assistant') {
      if (!Array.isArray(content)) continue
      for (const block of content) {
        if (!block || typeof block !== 'object') continue
        const b = block as Record<string, unknown>
        if (b.type === 'text') {
          if (typeof b.text === 'string' && b.text) {
            messages.push({ role: 'assistant', text: b.text })
          }
        } else if (b.type === 'tool_use') {
          const id = b.id
          if (typeof id !== 'string') continue
          const tool: ToolMessage = {
            role: 'tool',
            toolUseId: id,
            name: typeof b.name === 'string' ? b.name : '',
            input:
              b.input && typeof b.input === 'object' && !Array.isArray(b.input)
                ? (b.input as Record<string, unknown>)
                : {},
            result: null,
            isError: false,
          }
          messages.push(tool)
          toolsById.set(id, tool)
        }
      }
    }
  }

  return messages
}
