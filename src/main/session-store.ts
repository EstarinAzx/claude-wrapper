import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { SessionMeta } from '../shared/session-types'

export const encodeCwd = (cwd: string): string => cwd.replace(/[^a-zA-Z0-9]/g, '-')

const extractText = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter(
        (block): block is { type: string; text?: string } =>
          !!block && typeof block === 'object' && (block as { type?: unknown }).type === 'text'
      )
      .map((block) => (typeof block.text === 'string' ? block.text : ''))
      .join('')
  }
  return ''
}

export const summary = (raw: string, id: string): SessionMeta => {
  let title = ''
  let titleFrozen = false
  let lastUpdated = 0
  let messageCount = 0

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue
    let obj: unknown
    try {
      obj = JSON.parse(line)
    } catch {
      continue
    }
    if (!obj || typeof obj !== 'object') continue
    const rec = obj as {
      type?: unknown
      timestamp?: unknown
      message?: { content?: unknown }
    }

    if (rec.type === 'user' || rec.type === 'assistant') {
      messageCount += 1
    }

    if (typeof rec.timestamp === 'string') {
      const ms = Date.parse(rec.timestamp)
      if (Number.isFinite(ms) && ms > lastUpdated) lastUpdated = ms
    }

    if (!titleFrozen && rec.type === 'user') {
      const text = extractText(rec.message?.content).trim()
      if (text) {
        title = text.length > 80 ? text.slice(0, 80) + '…' : text
        titleFrozen = true
      }
    }
  }

  return { id, title, lastUpdated, messageCount }
}

export const listSessions = async (cwd: string | null): Promise<SessionMeta[]> => {
  if (!cwd) return []
  const dir = join(homedir(), '.claude', 'projects', encodeCwd(cwd))
  let names: string[]
  try {
    names = await readdir(dir)
  } catch {
    return []
  }
  const metas: SessionMeta[] = []
  for (const name of names) {
    if (!name.endsWith('.jsonl')) continue
    const id = name.slice(0, -6)
    try {
      const raw = await readFile(join(dir, name), 'utf8')
      metas.push(summary(raw, id))
    } catch {
      // skip unreadable files
    }
  }
  metas.sort((a, b) => b.lastUpdated - a.lastUpdated)
  return metas
}
