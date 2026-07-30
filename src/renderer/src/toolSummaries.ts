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

// One argument rendered for reading. Strings pass through — quoting every
// path and command would add noise to the common case — and everything else is
// materialised, because `keyInput` only ever looks for strings and an object,
// array, boolean or number argument is otherwise invisible in the card.
// `JSON.stringify` answers `undefined` for undefined and for functions, and an
// `undefined` React child renders nothing, so that case falls back to `String`.
const readableValue = (v: unknown): string => {
  if (typeof v === 'string') return v
  const json = JSON.stringify(v, null, 2)
  return json === undefined ? String(v) : json
}

// Every argument the tool was called with, key-sorted. Sorted rather than left
// in insertion order because the same call reaches the card two ways — a live
// event object and a replayed `JSON.parse` — and only a derived order is
// guaranteed to agree. Called lazily, from the mounted branch only: the
// stringify cost must not be paid by a collapsed card that shows none of this.
export const inputEntries = (input: Record<string, unknown>): [string, string][] =>
  Object.keys(input)
    .sort()
    .map((k) => [k, readableValue(input[k])])

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
