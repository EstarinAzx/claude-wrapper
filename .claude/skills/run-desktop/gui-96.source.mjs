// gui-96, source-level half — the two criteria that read `src/` as TEXT.
//
// THE CONVENTION (this file is an instance of it): a driver named `gui-<n>.mjs`
// contributes its source-level assertions by shipping a sibling
// `gui-<n>.source.mjs` whose named export `checks` is an array of
// `{ name, run() }`. `run()` returns `{ ok, detail }` and MUST be pure: no
// browser, no Electron, no `out/` build artifact, no network, no clock. (#141
// adds one opt-in exception: a check that declares `needsBuild` may read a
// build artifact, and is then skipped by name here and executed by the DOM
// phase instead. Neither check in this file does — both read `src/` as text.)
// Nothing else has to be wired anywhere — `tests/gui-source-assertions.test.ts` globs
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
const DESIGN_MD = path.join(APP_DIR, 'DESIGN.md')

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
  },
  {
    // #139, ACCEPTANCE 2's second half. Criterion 2 above bans ONE value, and it
    // was written for the one drift that had actually happened. The acceptance
    // is wider than that: the documented set is `{400, 600}` and no new rung may
    // be added, which a grep for a single number cannot say. So this reads the
    // VALUE rather than a value — 350, 700, `bold` and `lighter` are all caught
    // by the same line, and criterion 2 stays because the ticket names it.
    //
    // Matched as `[^;}]+` rather than `\d+` on purpose: a keyword weight is the
    // easy way to leave the documented set without ever writing a number, and a
    // digit-only pattern would not see it.
    name: 'criterion 10 (#139): every font-weight in src/renderer/src/styles/ is 400 or 600 (SOURCE)',
    run() {
      const allowed = new Set(['400', '600'])
      const hits = []
      for (const p of cssFiles(STYLE_DIR)) {
        fs.readFileSync(p, 'utf8')
          .split(/\r?\n/)
          .forEach((line, i) => {
            const m = /font-weight:\s*([^;}]+)/.exec(line)
            const value = m?.[1].trim()
            if (value && !allowed.has(value))
              hits.push(`${path.relative(APP_DIR, p)}:${i + 1} -> ${value}`)
          })
      }
      return { ok: hits.length === 0, detail: { hits, allowed: [...allowed] } }
    }
  },
  {
    // #139, ACCEPTANCE 3. The ruling's whole risk is that the next reviewer
    // measures the label against the prose, finds no weight step, and files it
    // again — which is what happened three times before it was measured. The
    // document is the only thing that can stop that, so the document is checked.
    //
    // `\r?` everywhere: DESIGN.md is CRLF in this checkout, and an LF-only
    // pattern matches nothing and reports the sentence missing — a red for the
    // wrong reason that reads exactly like the sentence having been deleted.
    //
    // The discriminator is `weight`, not `tool card`: the Type section's rung
    // table already lists tool cards as a 13px role, so a check keyed on the
    // noun alone would pass against that row and never see the sentence go.
    //
    // WHAT IT CAN AND CANNOT SEE, measured by mutation rather than asserted.
    // It reds when the sentence is deleted, and it reds when `colour` leaves
    // the line entirely. It does NOT red when one of the line's two `colour`
    // mentions is reworded away while the other survives — and that is the
    // honest reading, not a hole: the claim is still on the record. This is a
    // keyword check on prose, so it pins that the claim is PRESENT and cannot
    // grade how well it is argued. Tightening it to exact wording would buy
    // that at the price this repo already pays for its literal-text pins (D3).
    name: 'criterion 11 (#139): DESIGN.md Type section records tool-card emphasis as size and colour (SOURCE)',
    run() {
      const md = fs.readFileSync(DESIGN_MD, 'utf8')
      const section = /\r?\n## Type\r?\n([\s\S]*?)\r?\n## /.exec(md)
      const candidates = (section?.[1] ?? '')
        .split(/\r?\n/)
        .filter((l) => /tool[- ]cards?/i.test(l) && /weight/i.test(l))
      const stated = candidates.filter((l) => /\bsize\b/i.test(l) && /colou?r/i.test(l))
      return {
        ok: stated.length > 0,
        detail: {
          sectionFound: !!section,
          candidates: candidates.length,
          stated: stated.length,
          hint: 'the Type section needs a line naming the tool-card label, its weight, and both size and colour as what carries its emphasis instead'
        }
      }
    }
  }
]
