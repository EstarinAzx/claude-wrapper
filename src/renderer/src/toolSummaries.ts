const KEY_PRIORITY = ['command', 'file_path', 'pattern', 'url', 'path', 'prompt'] as const

export const keyInput = (input: Record<string, unknown>): string => {
  for (const key of KEY_PRIORITY) {
    const v = input[key]
    if (typeof v === 'string') return v
  }
  for (const v of Object.values(input)) {
    if (typeof v === 'string') return v
  }
  return ''
}

const SUMMARY_CAP = 120
const SPACE = /\s/

// Bounds of the first non-empty line, already trimmed, or null when the whole
// text is blank. Scanned forward rather than `split('\n')`: the complete result
// now lives in state (#61), so splitting would allocate one array entry per
// line of a result that can run to tens of kilobytes — on every render of the
// collapsed card. Nothing longer than one line is ever materialised here.
const firstLineBounds = (text: string): [number, number] | null => {
  let i = 0
  while (i < text.length) {
    const nl = text.indexOf('\n', i)
    const end = nl === -1 ? text.length : nl
    let start = i
    while (start < end && SPACE.test(text[start])) start += 1
    let stop = end
    while (stop > start && SPACE.test(text[stop - 1])) stop -= 1
    if (stop > start) return [start, stop]
    i = end + 1
  }
  return null
}

export const resultSummary = (text: string): string => {
  const bounds = firstLineBounds(text)
  if (!bounds) return ''
  const [start, stop] = bounds
  if (stop - start > SUMMARY_CAP) return text.slice(start, start + SUMMARY_CAP) + '…'
  return text.slice(start, stop)
}

// Whether the collapsed summary omits anything — the first line clipped by the
// cap, or any non-whitespace after it. Drives the disclosure affordance, which
// is only trustworthy if its absence means there is genuinely nothing more.
export const hasHiddenOutput = (text: string): boolean => {
  const bounds = firstLineBounds(text)
  if (!bounds) return false
  const [start, stop] = bounds
  if (stop - start > SUMMARY_CAP) return true
  for (let i = stop; i < text.length; i += 1) {
    if (!SPACE.test(text[i])) return true
  }
  return false
}
