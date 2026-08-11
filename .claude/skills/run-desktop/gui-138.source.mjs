// gui-138, source-level half — the three criteria that read `src/` as TEXT.
//
// Convention (#132): a driver `gui-<n>.mjs` ships a sibling `gui-<n>.source.mjs`
// exporting `checks: { name, run() }[]` with `run()` pure. The fast gate runs
// these through `tests/gui-source-assertions.test.ts`; the driver imports the
// same array, so the gated copy cannot drift from the driven one.
//
// WHICH GATE RUNS WHAT, because #138's acceptance 4 asks for that by name:
//
//   `npm test`          these three. They are text over `src/` and `DESIGN.md`,
//                       so they need no browser and no build.
//   `npm run test:dom`  `gui-138.mjs`, which measures COMPUTED font sizes in a
//                       real Chromium. Nothing here can do that, and jsdom
//                       structurally cannot either — it loads no CSS.
//
// The split matters for this ticket specifically. The defect #138 names is a
// RENDERED one: `1.25em` against a 15px body is 18.75px, and no amount of
// reading the declaration tells you that. What these checks can do is stop the
// defect returning by the route it arrived on, which is a size authored
// relative to inherited text rather than on the scale.

import path from 'node:path'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const STYLE_DIR = path.join(APP_DIR, 'src/renderer/src/styles')
const DESIGN_MD = path.join(APP_DIR, 'DESIGN.md')

// Recursive: `styles/` is allowed to grow subdirectories, and a flat readdir
// would silently stop covering them the day one appears. Lifted from
// gui-96.source.mjs, same reasoning.
const cssFiles = (dir) => {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...cssFiles(p))
    else if (e.name.endsWith('.css')) out.push(p)
  }
  return out
}

// Separators normalised to `/`. On win32 `path.relative` answers backslashes,
// which silently never equal the forward-slash allow-list entry below — the
// exception then excuses nothing and the check reds against the very line it
// was written to permit. Caught by running the driver, not by reading it.
const rel = (p) => path.relative(APP_DIR, p).split(path.sep).join('/')

const eachCssLine = (fn) => {
  for (const p of cssFiles(STYLE_DIR)) {
    fs.readFileSync(p, 'utf8')
      .split(/\r?\n/)
      .forEach((line, i) => fn(line, `${rel(p)}:${i + 1}`))
  }
}

// The ONE accepted literal, named here rather than pattern-matched, so adding a
// second one is a decision somebody has to come and write down. It is a glyph
// dimension: `.subagent-drawer-close` sets the box of a `x` character, which is
// an icon sized in px and not a rung of the prose scale. It happens to land
// within 0.17px of rung 2 (19.84), which is why `gui-138.mjs`'s live sweep does
// not red on it either; that is a coincidence worth stating rather than relying
// on, and it is the reason this entry exists as an allow-list of one instead of
// the check simply banning every literal.
const GLYPH_EXCEPTION = 'src/renderer/src/styles/subagent.css:168'

export const checks = [
  {
    // THE DEFECT'S OWN ROUTE. `1.25em` and `1.1em` on the markdown headings are
    // what put a second scale on a photographed surface: they multiply whatever
    // text they inherit, so they track the body rung without landing on the
    // ladder, and they rendered 18.75 / 16.5 against rungs at 19.84 / 17.25.
    // A size that is a fixed multiple of inherited text is not a rung, and
    // this is the check that says so in the fast gate.
    name: 'criterion 1 (#138): no font-size in styles/ is authored in `em` (SOURCE)',
    run() {
      const hits = []
      eachCssLine((line, at) => {
        if (/font-size:\s*[^;]*\d\s*em\b/.test(line)) hits.push(`${at}  ${line.trim()}`)
      })
      return {
        ok: hits.length === 0,
        detail: {
          hits,
          hint: 'an em font-size multiplies inherited text, so it tracks the body rung without landing on the ladder'
        }
      }
    }
  },
  {
    // The second route a stray size can arrive by: a bare literal. Every type
    // size in this app is either a token or arithmetic on one, which is what
    // makes the scale greppable at all. One literal is accepted and named.
    name: 'criterion 2 (#138): every literal px font-size in styles/ is the one named glyph (SOURCE)',
    run() {
      const hits = []
      eachCssLine((line, at) => {
        if (/font-size:\s*\d+(\.\d+)?px/.test(line) && at !== GLYPH_EXCEPTION) {
          hits.push(`${at}  ${line.trim()}`)
        }
      })
      const exceptionStillThere = (() => {
        const [relPath, lineNo] = GLYPH_EXCEPTION.split(':')
        const src = fs.readFileSync(path.join(APP_DIR, relPath), 'utf8').split(/\r?\n/)
        return /font-size:\s*\d+(\.\d+)?px/.test(src[Number(lineNo) - 1] ?? '')
      })()
      return {
        // The second clause is the anti-vacuity half: if the glyph rule moves or
        // is retokenised, the allow-list entry is stale and points at an
        // innocent line, which would quietly excuse whatever lands there next.
        ok: hits.length === 0 && exceptionStillThere,
        detail: {
          hits,
          exception: GLYPH_EXCEPTION,
          exceptionStillThere,
          hint: exceptionStillThere
            ? 'a new literal type size bypasses the token scale'
            : 'the named glyph exception no longer points at a px font-size — re-point or delete it'
        }
      }
    }
  },
  {
    // ACCEPTANCE 2, as a drift alarm rather than as prose. `DESIGN.md`'s Type
    // section has to state the rungs the app actually paints; the tokens are
    // where those are defined. Cross-reading the two means a token value moved
    // without the document following it is a red, which is the failure that put
    // this ticket on the tracker: the document said three rungs while the app
    // painted five.
    name: 'criterion 3 (#138): DESIGN.md Type section states every --text-* rung tokens.css defines (SOURCE)',
    run() {
      const tokens = fs.readFileSync(path.join(STYLE_DIR, 'tokens.css'), 'utf8')
      const rungs = [...tokens.matchAll(/--text-(display|body|ui|micro):\s*(\d+(?:\.\d+)?)px/g)].map(
        (m) => ({ name: m[1], px: m[2] })
      )
      const md = fs.readFileSync(DESIGN_MD, 'utf8')
      // Bounded by the next `## ` heading so a number that happens to appear in
      // the Layout or Motion prose cannot satisfy this.
      // `\r?` everywhere: DESIGN.md is CRLF in this checkout, and an LF-only
      // pattern silently finds no section and reports every rung missing —
      // which is a red for the wrong reason and reads like a real drift.
      const section = /\r?\n## Type\r?\n([\s\S]*?)\r?\n## /.exec(md)
      const body = section?.[1] ?? ''
      const missing = rungs.filter((r) => !new RegExp(`\\b${r.px}\\b`).test(body)).map((r) => r.name)
      return {
        ok: rungs.length === 4 && section !== null && missing.length === 0,
        detail: {
          rungsFound: rungs,
          sectionFound: section !== null,
          missing,
          hint: 'every rung tokens.css names must appear by value in DESIGN.md `## Type`'
        }
      }
    }
  }
]
