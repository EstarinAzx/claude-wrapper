export type DiffLine = { type: 'same' | 'add' | 'del'; text: string }

export type LineDiff =
  | { kind: 'aligned'; lines: DiffLine[] }
  | { kind: 'unaligned'; before: string; after: string }

// Alignment is O(old × new) in time AND memory, so the only real defence is
// refusing to start. One million cells is ~4 MB as a Uint32Array; the largest
// grid in 1,140 historical Edit calls was 99 × 155 = 15,345 cells, roughly 65×
// under this. Past it the card renders the exact texts unaligned — an honest
// non-answer beats a frozen window.
export const DIFF_CELL_GUARD = 1_000_000

// A trailing newline terminates the last line rather than starting an empty
// one, and empty text is zero lines. Plain `split('\n')` disagrees on both
// (`''` → `['']`, `'a\n'` → `['a', '']`) and each invented line shows up in the
// card as a phantom blank — on the empty side, as a phantom *edit*.
const splitLines = (text: string): string[] => {
  if (text === '') return []
  const lines = text.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

const align = (a: string[], b: string[]): DiffLine[] => {
  const n = a.length
  const m = b.length
  const w = m + 1
  // Suffix LCS lengths: dp[i][j] is the longest common subsequence of a[i:]
  // and b[j:]. Filled backwards so the walk below can go forwards, which is
  // the order the lines are rendered in.
  const dp = new Uint32Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * w + j] =
        a[i] === b[j]
          ? dp[(i + 1) * w + j + 1] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1])
    }
  }

  // A run of changes comes out as every removal then every addition — one
  // two-line replacement rather than four interleaved single-line edits — and
  // it needs no buffering to do it, because this walk cannot interleave.
  //
  // Once an addition is taken at (i,j) we know dp[i+1][j] < dp[i][j+1]. At
  // (i,j+1), if the lines still differ, dp[i][j+1] = max(dp[i+1][j+1],
  // dp[i][j+2]) and dp[i+1][j+1] <= dp[i+1][j] < dp[i][j+1], so dp[i][j+2] =
  // dp[i][j+1] > dp[i+1][j+1] — exactly the condition for taking an addition
  // again. So a run can only ever go deletions-then-additions, never back. An
  // exhaustive check agreed: 212,162 pairs over 2- and 3-letter alphabets, and
  // a buffered version never once differed. A coalescing pass here would be
  // dead code, which is why there isn't one.
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      lines.push({ type: 'same', text: a[i] })
      i += 1
      j += 1
    } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) {
      // The tie-break is load-bearing, not arbitrary: preferring the deletion
      // when the two paths are equally good is what keeps removals ahead of
      // additions. Flipping it to `>` reorders every evenly-matched hunk.
      lines.push({ type: 'del', text: a[i] })
      i += 1
    } else {
      lines.push({ type: 'add', text: b[j] })
      j += 1
    }
  }
  while (i < n) {
    lines.push({ type: 'del', text: a[i] })
    i += 1
  }
  while (j < m) {
    lines.push({ type: 'add', text: b[j] })
    j += 1
  }
  return lines
}

// A replacement hunk, never a file view: the only lines that can appear are the
// ones the Edit actually supplied, so nothing here implies surrounding context
// the app was never given.
export const lineDiff = (oldText: string, newText: string): LineDiff => {
  const a = splitLines(oldText)
  const b = splitLines(newText)
  if (a.length * b.length > DIFF_CELL_GUARD) {
    return { kind: 'unaligned', before: oldText, after: newText }
  }
  return { kind: 'aligned', lines: align(a, b) }
}
