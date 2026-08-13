// (b) THE TOP OF THE TRANSCRIPT, in frame for the first time in the run.
// Row profile of the short capture's transcript band: ink count per row, the
// row's ink extent, and the longest contiguous inked run on that row. A rule or
// hairline is a row with a very long contiguous run; text is many short runs.
import { decode } from './png.mjs'

const I = decode('.gauntlet/waves/core-after-docks/6/window-session-short.png')
const BD = [3, 6, 6]
const on = (x, y, thr = 2) => {
  const [r, g, b] = I.at(x, y)
  return Math.abs(r - BD[0]) + Math.abs(g - BD[1]) + Math.abs(b - BD[2]) > thr
}
const PANE_L = 248, PANE_R = 1439

console.log(`frame ${I.w}x${I.h}`)
console.log('y     ink   extent            longestRun  runs')
for (let y = 48; y <= 320; y++) {
  let n = 0, L = -1, R = -1, run = 0, best = 0, bestX = -1, runs = 0, cur = 0
  for (let x = PANE_L; x <= PANE_R; x++) {
    if (on(x, y)) {
      n++; if (L < 0) L = x; R = x
      if (cur === 0) runs++
      cur++
      if (cur > best) { best = cur; bestX = x - cur + 1 }
    } else cur = 0
  }
  if (n === 0) continue
  console.log(`${String(y).padStart(4)} ${String(n).padStart(5)}   x${String(L).padStart(4)}..${String(R).padEnd(5)}  ${String(best).padStart(5)}@x${String(bestX).padEnd(5)} ${runs}`)
}
