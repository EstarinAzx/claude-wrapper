// gui-98, source-level half — criterion 5c, the SCOPE of the glass exception.
//
// See `gui-96.source.mjs` for the convention this file follows.
//
// 5a and 5b stay in the driver on purpose and are NOT here: 5a is a computed
// read off the live pane (strictly stronger than any grep, which would pass on
// a rule the cascade never applies) and 5b is the discrimination control that
// keeps 5a from being vacuous. Only the scope is readable as text.
//
// This overlaps `tests/subagent-material.test.ts`, which already pins the same
// rule in the gate, and the overlap is deliberate on both sides: that file
// exists because no driver runs in `npm test`, and this entry exists because
// gui-98 asserts it too and #132's whole point is that a driver's assertions
// should not be protected by a check nobody runs. Two green tests over one rule
// is cheap; the alternative is deciding which copy is the real one.

import path from 'node:path'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const STYLE_DIR = path.join(APP_DIR, 'src/renderer/src/styles')

// Comments are stripped before the scan — the guard `theme.test.ts` documents
// and `subagent-material.test.ts` repeats. Without it this file's own prose in
// `subagent.css` counts as a declaration.
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '')

export const checks = [
  {
    name: 'criterion 5c: no OTHER stylesheet declares a backdrop-filter (SOURCE)',
    run() {
      const glassElsewhere = fs
        .readdirSync(STYLE_DIR)
        .filter((f) => f.endsWith('.css') && f !== 'subagent.css')
        .filter((f) =>
          /backdrop-filter\s*:/.test(stripComments(fs.readFileSync(path.join(STYLE_DIR, f), 'utf8')))
        )
      return {
        ok: glassElsewhere.length === 0,
        detail: {
          files: glassElsewhere,
          note: 'the exception is this pane only; extending it is an open owner call, not this ticket'
        }
      }
    }
  }
]
