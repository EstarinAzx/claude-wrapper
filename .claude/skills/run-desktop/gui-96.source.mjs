// gui-96, source-level half — the two criteria that read `src/` as TEXT.
//
// THE CONVENTION (this file is an instance of it): a driver named `gui-<n>.mjs`
// contributes its source-level assertions by shipping a sibling
// `gui-<n>.source.mjs` whose named export `checks` is an array of
// `{ name, run() }`. `run()` returns `{ ok, detail }` and MUST be pure: no
// browser, no Electron, no `out/` build artifact, no network, no clock. Nothing
// else has to be wired anywhere — `tests/gui-source-assertions.test.ts` globs
// for `*.source.mjs` and turns every entry into a real gate test, and the
// driver imports the same array so the assertion has ONE definition.
//
// Why the split exists at all (#132): `npm test` executes no driver. During the
// `core-surfaces` gauntlet run one edit turned two driver assertions red and
// three consecutive gate runs reported green afterwards, because nothing ran
// them. The browser half of gui-96 still does not run in the gate — that is
// #135 — but these two no longer depend on a human remembering to.

import path from 'node:path'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const STYLE_DIR = path.join(APP_DIR, 'src/renderer/src/styles')

// Recursive because `styles/` is allowed to grow subdirectories; a flat
// `readdirSync` would silently stop covering them the day one appears.
const cssFiles = (dir) => {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...cssFiles(p))
    else if (e.name.endsWith('.css')) out.push(p)
  }
  return out
}

// The body is extracted by COUNTING BRACES, not by a lazy regex. `@keyframes`
// bodies nest (`from { … } to { … }`), so `\{([\s\S]*?)\}` stops at the end of
// the `from` block — which would read the first stop only and never see an X
// translate reinstated in `to`. That is the vacuous version of this check.
const keyframeBody = (source, name) => {
  const head = new RegExp(`@keyframes\\s+${name}\\s*\\{`).exec(source)
  if (!head) return null
  let depth = 1
  let i = head.index + head[0].length
  const start = i
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') depth--
  }
  return depth === 0 ? source.slice(start, i - 1) : null
}

export const checks = [
  {
    name: 'criterion 2: zero `font-weight: 500` in src/renderer/src/styles/ (SOURCE grep)',
    run() {
      const hits = []
      for (const p of cssFiles(STYLE_DIR)) {
        fs.readFileSync(p, 'utf8')
          .split(/\r?\n/)
          .forEach((line, i) => {
            if (/font-weight:\s*500\b/.test(line)) hits.push(`${path.relative(APP_DIR, p)}:${i + 1}`)
          })
      }
      return { ok: hits.length === 0, detail: { hits } }
    }
  },
  {
    // #98 turned the entry from an X slide into a Y rise while KEEPING the
    // keyframe name, so gui-96's criterion 3 (200ms) and its premise
    // (`animationName === 'subagent-slide'`) both stay green no matter which
    // axis the body moves. That leaves the axis itself uncovered: a later edit
    // could reinstate the X slide with every other check in that file passing.
    // This is the only pin on it.
    name: 'criterion 6 (#98): the `subagent-slide` body rises on Y and never translates on X (SOURCE)',
    run() {
      const subagentCss = fs.readFileSync(path.join(STYLE_DIR, 'subagent.css'), 'utf8')
      const slideBody = keyframeBody(subagentCss, 'subagent-slide')
      return {
        ok:
          slideBody !== null && slideBody.includes('translateY') && !slideBody.includes('translateX'),
        detail: {
          found: slideBody !== null,
          hasY: slideBody?.includes('translateY') ?? null,
          hasX: slideBody?.includes('translateX') ?? null,
          stops: slideBody ? (slideBody.match(/\{/g) || []).length : null,
          hint: 'stops should be 2 (from + to) — a 1 here means the body was truncated at the first close brace'
        }
      }
    }
  }
]
