import type { TranscriptMessage } from '../shared/session-types'

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
