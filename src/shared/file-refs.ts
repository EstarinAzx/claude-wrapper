// The `@` file-reference trigger window, its accept, and the popover's match
// order (#118). Pure and shared so the two owner calls it encodes are pinned in
// one place rather than spread through the composer's key handling.
//
// TYPING ASSISTANCE ONLY. Nothing here rewrites what gets sent: #116 measured
// that `@path` in ordinary prompt text is ALREADY resolved by the CLI through
// this app's exact `query()` options shape, so the send path needs no code and
// must not acquire any. The dumb-pipe rule (A8) — the wrapper helps the user
// type and lets the CLI own resolution.

// The trigger window (owner call 1, taken 2026-08-05 on #115).
//
// The rule is `/`'s MINUS the clause whose stated reason does not apply. A4b
// records that `/` fires only at index 0 **because a slash command only expands
// as the first token** — that reason does not transfer to a token that lives
// mid-sentence, so the index-0 half is dropped. Its other half, dying on any
// whitespace, is about token boundaries, and an `@path` is exactly a token, so
// that half is kept verbatim.
export interface AtQuery {
  /** Index of the `@` itself, so an accept can replace the token and nothing else. */
  start: number
  /** Text between the `@` and the caret. Empty means the user just typed `@`. */
  query: string
}

/**
 * The open `@` window at `caret`, or `null` if there is none.
 *
 * Scans back from the caret rather than forward from the start: the window is a
 * property of where the user is typing, not of the value as a whole, and a
 * sentence may hold several completed references already.
 */
export const findAtQuery = (value: string, caret: number): AtQuery | null => {
  const at = Math.max(0, Math.min(caret, value.length))
  const head = value.slice(0, at)
  const start = head.lastIndexOf('@')
  if (start === -1) return null

  const query = head.slice(start + 1)
  // Whitespace since the `@` closed the window — the same rule #42 settled for
  // `/`, and for the same reason: a path token contains no whitespace, so a
  // break means the user has moved on and the popover must get out of the way.
  if (/\s/.test(query)) return null

  // The `@` must itself start a token. Without this an email address opens a
  // file picker on every keystroke after the `@`, which is the one common
  // mid-string `@` in ordinary prose.
  if (start > 0 && !/\s/.test(value[start - 1])) return null

  return { start, query }
}

/**
 * Accept a suggestion (owner call 2, taken 2026-08-05 on #115).
 *
 * Inserts at the cursor and replaces **only the `@token` being typed** — not the
 * whole value, which is what `/` does. Same A4b line read the other way: `/`
 * replaces everything because a slash command *is* the whole first token, while
 * an `@` reference is one token inside a sentence and replacing the value would
 * delete the user's prose.
 *
 * The trailing space is deliberate and load-bearing: it closes the trigger
 * window, so the popover does not immediately reopen on the completed path.
 */
export const applyAtAccept = (
  value: string,
  caret: number,
  path: string
): { value: string; caret: number } => {
  const found = findAtQuery(value, caret)
  if (!found) return { value, caret }
  const at = Math.max(0, Math.min(caret, value.length))
  const inserted = `@${path} `
  return {
    value: value.slice(0, found.start) + inserted + value.slice(at),
    caret: found.start + inserted.length
  }
}

// What the POPOVER renders (owner call 3's cap half, taken 2026-08-05).
//
// The cap is here and not in main on purpose: capping in main would make which
// files you can reference depend on directory walk order, so a file would be
// unreachable for a reason the user cannot see. Main returns everything that
// survives its boundary; the popover shows the best few.
export const MAX_FILE_SUGGESTIONS = 12

const basename = (p: string): string => p.slice(p.lastIndexOf('/') + 1)

/**
 * Files matching `query`, best first, capped for the popover.
 *
 * Case-insensitive substring, ranked: basename prefix, then path prefix, then
 * anything else containing it. An empty query lists the shallowest paths, which
 * is what "I just typed `@`" should show.
 *
 * ponytail: substring + a three-tier rank, not fuzzy matching. If subsequence
 * matching is wanted later it replaces `score` alone.
 */
export const matchFiles = (files: string[], query: string): string[] => {
  const q = query.toLowerCase()
  const depth = (p: string): number => p.split('/').length

  const score = (p: string): number => {
    if (q === '') return 3
    const lower = p.toLowerCase()
    if (basename(lower).startsWith(q)) return 0
    if (lower.startsWith(q)) return 1
    if (lower.includes(q)) return 2
    return -1
  }

  return files
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s || depth(a.p) - depth(b.p) || a.p.localeCompare(b.p))
    .slice(0, MAX_FILE_SUGGESTIONS)
    .map((x) => x.p)
}
