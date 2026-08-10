// gui-136, source-level half — the criteria that read `styles/` as TEXT.
//
// THE CONVENTION (#132): a driver `gui-<n>.mjs` contributes its source-level
// assertions by shipping this sibling, whose named export `checks` is an array
// of `{ name, run() }` with `run()` pure — no browser, no Electron, no `out/`
// build artifact, no network, no clock. `tests/gui-source-assertions.test.ts`
// globs for `*.source.mjs` and turns every entry into a real gate test; the
// driver imports the same array, so the gated copy cannot drift from the driven
// one.
//
// WHAT THIS HALF CAN AND CANNOT SEE, stated plainly because D4 requires it.
// The real criterion in #136 is a MEASUREMENT — the title's midpoint against
// the window's centre — and no assertion in this file measures anything. jsdom
// loads no CSS and the gate has no window, so the fast gate is structurally
// incapable of catching a centring regression; that is `gui-136.mjs`, and it
// runs only in `npm run test:dom`.
//
// What these four checks pin is the MECHANISM's preconditions, each of which is
// a single declaration that a later edit could plausibly change without knowing
// this ticket existed, and each of which moves the title off centre on its own.
// They are a tripwire in the fast gate, not a substitute for the measurement.

import path from 'node:path'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const TITLEBAR_CSS = path.join(APP_DIR, 'src/renderer/src/styles/titlebar.css')

const source = () => fs.readFileSync(TITLEBAR_CSS, 'utf8')

// Comments are stripped BEFORE any brace counting, the way `theme.test.ts` does
// it. The prose in this file explains the mechanism at length and necessarily
// quotes declarations; a body extractor that read comments would find `flex: 1`
// inside a paragraph explaining why `flex: 1` is wrong.
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

// Brace-counted rather than regex-matched, for gui-96's reason: a lazy
// `\{([\s\S]*?)\}` stops at the first closing brace, which is correct only for
// rules that never nest. Nothing in this file nests today. That is not a
// guarantee about tomorrow, and a truncated body reads as a missing declaration,
// which is the vacuous version of every check below.
const ruleBody = (css, selector) => {
  const head = new RegExp(`(^|[\\}\\s])${selector.replace('.', '\\.')}\\s*\\{`, 'm').exec(css)
  if (!head) return null
  let depth = 1
  let i = head.index + head[0].length
  const start = i
  for (; i < css.length && depth > 0; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') depth--
  }
  return depth === 0 ? css.slice(start, i - 1) : null
}

const decl = (body, prop) => {
  const m = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'm').exec(body)
  return m ? m[1].trim() : null
}

// The horizontal halves of a `padding` shorthand, by the 1/2/3/4-value rule.
// Returned as strings so `0` and `0px` are both recognisable and `14px` is not
// silently coerced to something falsy.
const horizontalPadding = (body) => {
  const out = []
  for (const prop of ['padding-left', 'padding-right', 'padding-inline', 'padding-inline-start', 'padding-inline-end']) {
    const v = decl(body, prop)
    if (v !== null) out.push(`${prop}: ${v}`)
  }
  const short = decl(body, 'padding')
  if (short !== null) {
    const v = short.split(/\s+/)
    const [left, right] =
      v.length === 1 ? [v[0], v[0]] : v.length === 2 || v.length === 3 ? [v[1], v[1]] : [v[3], v[1]]
    if (!/^0(px|em|rem|%)?$/.test(left)) out.push(`padding (left component): ${left}`)
    if (!/^0(px|em|rem|%)?$/.test(right)) out.push(`padding (right component): ${right}`)
  }
  return out
}

const BOXES = ['.titlebar', '.titlebar-left', '.titlebar-right']

export const checks = [
  {
    name: 'criterion 1+2 (#136): the flanks grow equally and the centre slot does not grow (SOURCE)',
    run() {
      const css = stripComments(source())
      const got = {
        left: decl(ruleBody(css, '.titlebar-left') ?? '', 'flex'),
        right: decl(ruleBody(css, '.titlebar-right') ?? '', 'flex'),
        center: decl(ruleBody(css, '.titlebar-center') ?? '', 'flex')
      }
      // `flex: 1` is `1 1 0%`: equal grow from a zero basis, which is what makes
      // the two flank boxes come out the same width for any contents. The slot
      // must NOT grow, or it takes the free space the flanks need to split and
      // the flanks fall back to sizing by content — the pre-#136 arrangement,
      // in which the title drifts by half the difference between them.
      const ok =
        got.left === '1' && got.right === '1' && got.center !== null && !/^1(\s|$)/.test(got.center)
      return {
        ok,
        detail: {
          ...got,
          want: { left: '1', right: '1', center: 'anything that does not grow, e.g. `0 1 auto`' }
        }
      }
    }
  },
  {
    name: 'criterion 1 (#136): no horizontal padding on the titlebar or either flank (SOURCE)',
    run() {
      const css = stripComments(source())
      const hits = []
      for (const sel of BOXES) {
        const body = ruleBody(css, sel)
        if (body === null) {
          hits.push(`${sel}: rule not found — the check cannot have passed`)
          continue
        }
        for (const h of horizontalPadding(body)) hits.push(`${sel} { ${h} }`)
      }
      // Horizontal padding on ANY of these three boxes breaks the symmetry by
      // exactly half its width, because `box-sizing: border-box` makes a
      // `flex-basis: 0` flank's padding widen its border box on top of an equal
      // grow. Measured at +7css for the 14px that used to sit on `.titlebar`.
      // The inset the app wants lives on `.logo-mark`, inside the flank's
      // content, where it is spent from that flank's own share.
      return { ok: hits.length === 0, detail: { hits, inset: 'belongs on .logo-mark' } }
    }
  },
  {
    name: 'criterion 3 (#136): .titlebar-left keeps its min-content floor, so it cannot be squeezed under the title (SOURCE)',
    run() {
      const css = stripComments(source())
      const body = ruleBody(css, '.titlebar-left')
      const minWidth = body === null ? 'RULE NOT FOUND' : decl(body, 'min-width')
      // With a zero basis the flanks are grown, and an explicit `min-width: 0`
      // lets this one be grown to LESS than it paints — at the 640px minimum,
      // ~137css of box under ~262css of mark, name and pills, which puts the
      // left group straight under the centred title and reopens #72. The
      // automatic min-content floor is the no-overlap guarantee.
      return {
        ok: body !== null && minWidth === null,
        detail: { minWidth, want: 'no min-width declaration at all (automatic min-content floor)' }
      }
    }
  },
  {
    name: 'criterion 5 (#136): the bar is a full-width drag region and the right group is not (SOURCE)',
    run() {
      const css = stripComments(source())
      const bar = ruleBody(css, '.titlebar')
      const right = ruleBody(css, '.titlebar-right')
      const got = {
        bar: bar === null ? 'RULE NOT FOUND' : decl(bar, '-webkit-app-region'),
        right: right === null ? 'RULE NOT FOUND' : decl(right, '-webkit-app-region')
      }
      return {
        ok: got.bar === 'drag' && got.right === 'no-drag',
        detail: { ...got, want: { bar: 'drag', right: 'no-drag' } }
      }
    }
  }
]
