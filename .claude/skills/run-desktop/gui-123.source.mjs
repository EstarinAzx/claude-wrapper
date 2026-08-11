// gui-123, source-level half — the one criterion in #143 that is a property of
// this driver's TEXT rather than of the running app.
//
// THE CONVENTION (#132): a driver `gui-<n>.mjs` contributes its source-level
// assertions by shipping this sibling, whose named export `checks` is an array
// of `{ name, run() }` with `run()` pure — no browser, no Electron, no `out/`
// build artifact, no network, no clock. `tests/gui-source-assertions.test.ts`
// globs for `*.source.mjs` and turns every entry into a real gate test; the
// driver imports the same array, so the gated copy cannot drift from the driven
// one.
//
// WHY THE FAST GATE HAS TO HOLD THIS ONE, and it is the whole argument for the
// file existing. #143's defect was a Tab traversal bounded by the constant 60.
// Reintroducing that constant does NOT red the DOM phase on a normal machine:
// measured on this one, the sessions rail at its default `This project` scope
// renders 0 rows for a mkdtemp workspace and the control lands on press 16, so
// 60 is generous and a reverted driver passes. It only reds once somebody has
// left the rail's PERSISTED scope toggle on `All projects`, where the same build
// renders 100 rows, 218 focusable elements, and the control lands on press 218.
//
// So the browser half cannot police this: the failure it would have to catch is
// invisible in exactly the configuration the phase normally runs in. That is the
// same shape as `tests/driver-screenshot-dir.test.ts` — a driver property whose
// violation is silent at runtime and obvious in the source — and it gets the
// same treatment, a text check in the gate that runs every time.
//
// WHAT THIS DOES NOT CLAIM. A derived bound is not evidence the control is
// reachable; only the traversal in `gui-123.mjs` can say that, and only against
// a rail it pinned itself. This check says one thing: the number of presses this
// driver is willing to spend was counted off the document rather than guessed.

import path from 'node:path'
import fs from 'node:fs'

const DRIVER = path.join(import.meta.dirname, 'gui-123.mjs')

// Full-line comments only. The prose above and in the driver necessarily quotes
// the numbers this check bans — "bounded by the constant 60" is a sentence about
// the defect, not the defect — and a matcher that read comments would red on the
// explanation of why it exists. Trailing `//` after code is left alone because
// stripping it needs a string/regex-aware parse to avoid eating a `//` inside a
// literal, and no `for` header in this driver carries one.
const stripLineComments = (src) =>
  src
    .split(/\r?\n/)
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n')

/** Every `for (...)` header in the driver, comments removed. */
const forHeaders = (src) => {
  const out = []
  const re = /\bfor\s*\(/g
  let m
  while ((m = re.exec(src)) !== null) {
    // Brace-free scan to the matching `)`, so a header containing `(` — a call
    // in the condition, say — is not truncated into a header that looks clean.
    let depth = 1
    let i = m.index + m[0].length
    for (; i < src.length && depth > 0; i++) {
      if (src[i] === '(') depth++
      else if (src[i] === ')') depth--
    }
    out.push(src.slice(m.index, i))
  }
  return out
}

export const checks = [
  {
    name: 'criterion (#143): no Tab traversal in this driver is bounded by a hardcoded number (SOURCE)',
    run() {
      const src = stripLineComments(fs.readFileSync(DRIVER, 'utf8'))
      // `< 60`, `<= 60`. An identifier bound (`< budget`) is what passes, because
      // an identifier is the only shape that can have been computed from the
      // document the traversal is about to walk.
      const literal = forHeaders(src).filter((h) => /<=?\s*\d/.test(h))
      return {
        ok: literal.length === 0,
        detail: {
          hardcoded: literal.map((h) => h.replace(/\s+/g, ' ').slice(0, 120)),
          want: 'a bound derived from a count taken off the live document, e.g. `i < budget`',
          why: 'a constant budget is a guess about a document this driver can count; #143 is what the guess cost'
        }
      }
    }
  }
]
