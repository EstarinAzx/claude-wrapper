const KEY_PRIORITY = ['command', 'file_path', 'pattern', 'url', 'path', 'prompt'] as const

export function keyInput(input: Record<string, unknown>): string {
  for (const key of KEY_PRIORITY) {
    const v = input[key]
    if (typeof v === 'string') return v
  }
  for (const v of Object.values(input)) {
    if (typeof v === 'string') return v
  }
  return ''
}

export function resultSummary(text: string): string {
  if (!text) return ''
  const line = text.split('\n').find((l) => l.trim().length > 0)?.trim() ?? ''
  if (line.length > 120) return line.slice(0, 120) + '…'
  return line
}
