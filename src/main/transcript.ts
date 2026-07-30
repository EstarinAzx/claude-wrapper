import type { AttachmentMarker, TranscriptMessage } from '../shared/session-types'

type ToolMessage = Extract<TranscriptMessage, { role: 'tool' }>

// #59 — the separator is '\n' because that is what the LIVE path uses
// (engine.ts joins a tool_result's text blocks with '\n'). It was '' here, so a
// multi-block result read as `boom` live and `boomtrace` replayed — the same
// result saying two different things depending on how you opened it. Blocks are
// distinct pieces of output, never fragments of one line. Filtering is
// unchanged: non-text blocks are still dropped.
const extractText = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((b): b is { type: string; text?: string } =>
        !!b && typeof b === 'object' && (b as { type?: unknown }).type === 'text')
      .map((b) => (typeof b.text === 'string' ? b.text : ''))
      .join('\n')
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

// ESC written as a code point, not as a literal byte or a `\u` escape: the raw
// character is invisible in an editor and a stray copy-paste silently deletes
// it. General CSI, not just the SGR (`…m`) forms the store happens to contain.
const CSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;?]*[ -/]*[@-~]', 'g')

const stripAnsi = (text: string): string => text.replace(CSI, '')

const tagBody = (text: string, tag: string): string =>
  new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(text)?.[1] ?? ''

// The CLI persists several kinds of markup as plain-string user messages, and
// replay rendered every one of them as literal XML (#50). Measured against the
// native store on 2026-07-28 — 923 files, 3359 plain-string user messages —
// 1258 of them, 37%, arrived here as raw markup.
//
// Dispatch is on the LEADING tag of the trimmed text, and that anchor is the
// whole safety argument: each kind occupies a WHOLE message in real data
// (nothing follows a <command-name> block in 442 of 442; a caveat is alone in
// 419 of 419), while a pasted terminal log that merely quotes the markup is
// ordinary user content and has to survive verbatim. Never match mid-string.
//
// Returns the text to display, or null to drop the message entirely.
const sanitizeUserText = (raw: string): string | null => {
  const text = raw.trim()

  // A slash invocation persists in BOTH tag orders — <command-message> first
  // (312 messages) and <command-name> first (442, the common one). Same output:
  // what the user actually typed. <command-message> is metadata, never shown.
  // ANSI is deliberately NOT stripped here — args are typed text, and a real
  // recorded argument is `fable[1m]`, whose brackets are literal.
  if (text.startsWith('<command-message>') || text.startsWith('<command-name>')) {
    const name = tagBody(text, 'command-name').trim()
    if (!name) return raw // malformed → verbatim, as before
    const args = tagBody(text, 'command-args').trim()
    return args ? `${name} ${args}` : name
  }

  // Injected context nobody typed: the CLI's boilerplate caveat (419 identical
  // copies), agent task notifications, and its own session reminders.
  if (
    text.startsWith('<local-command-caveat>') ||
    text.startsWith('<task-notification>') ||
    text.startsWith('<system-reminder>')
  ) {
    return null
  }

  // `!`-prefixed bash. Input is typed text, so it keeps its bytes; the output
  // halves are terminal streams and carry ANSI. stdout is empty while stderr is
  // full in 2 of the 3 sampled, so an empty half must not leave a blank line.
  if (text.startsWith('<bash-input>')) {
    const command = tagBody(text, 'bash-input').trim()
    return command ? `! ${command}` : null
  }

  if (text.startsWith('<local-command-stdout>')) {
    return stripAnsi(tagBody(text, 'local-command-stdout')).trim() || null
  }

  if (text.startsWith('<bash-stdout>')) {
    const streams = ['bash-stdout', 'bash-stderr']
      .map((tag) => stripAnsi(tagBody(text, tag)).trim())
      .filter(Boolean)
    return streams.length > 0 ? streams.join('\n') : null
  }

  return raw
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
          const text = sanitizeUserText(content)
          if (text !== null) messages.push({ role: 'user', text })
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
