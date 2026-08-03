// GUI eyeball for #94 — `.command-row-btn` takes `font: inherit` WITHOUT
// shifting vertical metrics.
//
// jsdom cannot see a computed font or a line box, so no vitest test in this repo
// can measure this ticket at all. Nothing in `tests/` or the other 24 drivers
// pins the command-row font either, so this driver is the only guard both ways:
// it is what proves the repaint happened, and what proves nothing else moved.
//
// ── why a probe and not a table of numbers ────────────────────────────────
// The interesting criterion here is a NO-CHANGE one: all three children keep the
// line-height they render today. This project has been bitten three times (#76,
// #82, #93) by exactly that shape — "X is unchanged" is vacuous in a build where
// nothing could change X. Hardcoding yesterday's pixel heights would also red on
// any machine whose font stack resolves differently, and four palettes ship.
//
// So the expectation is BUILT LIVE, from a probe that reconstructs the row as it
// rendered BEFORE the fix:
//
//   * a bare offscreen `<button>` gives Chromium's UA button font — the thing
//     `.command-row-btn` wore, whatever it is on this platform;
//   * a replica button wearing that UA font carries the real button's box
//     properties, read off the live element;
//   * three replica spans carry the children's AUTHORED declarations
//     (`var(--mono)`, `var(--fs-ui)`, `var(--fs-micro)`) — never a literal, and
//     never the live computed values, which move with the fix.
//
// Whatever the engine lays that out to IS the pre-fix geometry, and the live row
// is asserted against it. The replica keeps its UA font explicitly, so applying
// `font: inherit` to the real rule does not drag the expectation along with it.
//
// ── the popover shares two of these three children ────────────────────────
// `.command-row-name` and `.command-row-hint` are used TWICE: in the Commands
// dock inside `.command-row-btn`, and in the composer's slash popover inside
// `.command-option`. The ticket does not mention the second surface. It matters
// because `.command-option` sets `font-family: inherit` — the LONGHAND, which
// leaves its line-height at the UA `normal` — so both surfaces resolve those two
// children identically today. Any fix that neutralises the shift by pinning
// `.command-row-name` / `.command-row-hint` globally therefore reaches into the
// popover too. This driver measures both surfaces against the same probe so that
// blast radius cannot land silently.
//
// RED-VERIFIED against `main` before the fix (AC1 fails: `.command-row-desc`
// computes the UA button family, not `--font`). The no-change criteria were
// MUTATION-VERIFIED separately by applying `font: inherit` alone, without the
// line-height neutralisation — see the ticket comment.
//
//   node .claude/skills/run-desktop/gui-94.mjs
//
// Needs `npm run build` first, plus playwright-core.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gui94-'))

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000).unref?.()

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

const bad = []
const notes = []

// Open a workspace. DOM-dispatched: Playwright's actionability wait hangs on the
// intro animation. The Commands dock is folder-gated, like the agents dock.
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(
    (b) =>
      b.getAttribute('aria-label') === 'Pick a project folder' ||
      b.textContent?.includes('Pick a project folder')
  )
  btn?.click()
})
await page.waitForTimeout(3500)

// The dock opens from its titlebar toggle — there is no router, and App closes
// the agents dock when this one opens.
await page.evaluate(() => document.querySelector('[aria-label="Commands panel"]')?.click())
await page.waitForTimeout(2500)

const rowCount = await page.evaluate(() => document.querySelectorAll('.command-row').length)
if (rowCount === 0) {
  // `listCommands()` returning nothing is a CLI fact, not a pass. Say so loudly:
  // every assertion below would otherwise be skipped and the run would look green.
  bad.push('.command-row: dock listed no commands (listCommands returned nothing) — NOT MEASURED, not a pass')
}

// ── the measurement ───────────────────────────────────────────────────────
// Everything below happens in one page.evaluate so the probe is built, read and
// removed inside a single layout pass.
const M = await page.evaluate(() => {
  const px = (v) => Math.round(v * 1000) / 1000

  // The children are optional in the markup: `.command-row-hint` renders only
  // when the command declares an argument hint, `.command-row-desc` only when it
  // declares a description. Pick the row that carries the most of them so every
  // assertion has something real to run against, and report what was found.
  const rows = [...document.querySelectorAll('.command-row-btn')]
  let row = null
  let best = -1
  for (const r of rows) {
    const n = ['.command-row-name', '.command-row-hint', '.command-row-desc'].filter((s) =>
      r.querySelector(s)
    ).length
    if (n > best) {
      best = n
      row = r
    }
  }
  if (!row) return { error: 'no .command-row-btn in the DOM' }

  const live = {
    name: row.querySelector('.command-row-name'),
    hint: row.querySelector('.command-row-hint'),
    desc: row.querySelector('.command-row-desc')
  }

  // ── probe 1: what the UA gives a bare button ──
  // This is `.command-row-btn`'s pre-fix font, read from the engine rather than
  // assumed. `getComputedStyle` resolves the `font` shorthand only when every
  // longhand is expressible in it, so the longhands are read individually.
  const ua = document.createElement('button')
  ua.style.cssText = 'position:absolute;left:-9999px;top:0'
  document.body.appendChild(ua)
  const uaCS = getComputedStyle(ua)
  const UA = {
    family: uaCS.fontFamily,
    size: uaCS.fontSize,
    lineHeight: uaCS.lineHeight,
    weight: uaCS.fontWeight,
    style: uaCS.fontStyle,
    variant: uaCS.fontVariant,
    stretch: uaCS.fontStretch
  }

  // ── probe 2: what `--font` and `--mono` resolve to ──
  // Read from the tokens, never spelled out: four palettes ship and the stacks
  // are free to change.
  const tok = document.createElement('div')
  tok.style.cssText = 'position:absolute;left:-9999px;top:0'
  document.body.appendChild(tok)
  tok.style.fontFamily = 'var(--font)'
  const FONT = getComputedStyle(tok).fontFamily
  tok.style.fontFamily = 'var(--mono)'
  const MONO = getComputedStyle(tok).fontFamily
  tok.remove()

  // ── probe 3: the pre-fix row, rebuilt ──
  // Box properties come off the LIVE button (the fix does not touch them, so
  // they stay in sync); the font is pinned to the UA values above, which is
  // exactly what `font: inherit` replaces. The children carry their AUTHORED
  // declarations — `var(--mono)` / `var(--fs-*)`, and for `.command-row-desc` no
  // family at all, so it inherits the probe button's UA family the way it
  // inherits the real button's today.
  const rowCS = getComputedStyle(row)
  const probe = document.createElement('button')
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;border:none'
  probe.style.fontFamily = UA.family
  probe.style.fontSize = UA.size
  probe.style.lineHeight = UA.lineHeight
  probe.style.fontWeight = UA.weight
  probe.style.fontStyle = UA.style
  probe.style.fontStretch = UA.stretch
  for (const p of [
    'display',
    'flexDirection',
    'alignItems',
    'gap',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderRadius',
    'width'
  ]) {
    probe.style[p] = rowCS[p]
  }

  const mk = (family, sizeVar, text) => {
    const s = document.createElement('span')
    if (family) s.style.fontFamily = family
    s.style.fontSize = sizeVar
    // shared.css puts all three in the one-line truncation group; without it a
    // long description wraps in the probe and the height comparison is garbage.
    s.style.whiteSpace = 'nowrap'
    s.style.overflow = 'hidden'
    s.style.textOverflow = 'ellipsis'
    s.textContent = text
    return s
  }
  const pName = mk('var(--mono)', 'var(--fs-ui)', live.name?.textContent || '/x')
  const pHint = mk('var(--mono)', 'var(--fs-micro)', live.hint?.textContent || 'x')
  const pDesc = mk(null, 'var(--fs-micro)', live.desc?.textContent || 'x')
  probe.append(pName)
  if (live.hint) probe.append(pHint)
  if (live.desc) probe.append(pDesc)
  document.body.appendChild(probe)

  const h = (el) => (el ? px(el.getBoundingClientRect().height) : null)
  const fam = (el) => (el ? getComputedStyle(el).fontFamily : null)
  const lh = (el) => (el ? getComputedStyle(el).lineHeight : null)

  const out = {
    dpr: window.devicePixelRatio,
    UA,
    FONT,
    MONO,
    children: best,
    rows: rows.length,
    pre: {
      name: h(pName),
      hint: live.hint ? h(pHint) : null,
      desc: live.desc ? h(pDesc) : null,
      row: px(probe.getBoundingClientRect().height)
    },
    post: {
      name: h(live.name),
      hint: h(live.hint),
      desc: h(live.desc),
      row: px(row.getBoundingClientRect().height)
    },
    family: {
      name: fam(live.name),
      hint: fam(live.hint),
      desc: fam(live.desc),
      btn: rowCS.fontFamily
    },
    computedLH: {
      name: lh(live.name),
      hint: lh(live.hint),
      desc: lh(live.desc),
      btn: rowCS.lineHeight
    },
    // The rest of the `font` shorthand. `font: inherit` also resets font-style,
    // font-variant, font-weight and font-stretch, and the ticket asks for each
    // to be checked rather than assumed — the ADR's error was not enumerating.
    rest: {
      btn: {
        weight: rowCS.fontWeight,
        style: rowCS.fontStyle,
        variant: rowCS.fontVariant,
        stretch: rowCS.fontStretch
      },
      body: (() => {
        const b = getComputedStyle(document.body)
        return {
          weight: b.fontWeight,
          style: b.fontStyle,
          variant: b.fontVariant,
          stretch: b.fontStretch
        }
      })()
    },
    // The whole scroll list, so a per-row drift of a fraction of a pixel that
    // rounds away individually still shows up in the aggregate.
    listHeight: (() => {
      const l = document.querySelector('.command-list')
      return l ? px(l.getBoundingClientRect().height) : null
    })(),
    listRows: rows.length
  }

  probe.remove()
  ua.remove()
  return out
})

if (M?.error) {
  bad.push(`measurement failed: ${M.error}`)
}

// Eyeball the surface this ticket actually changes, while it is still on screen.
// The popover shot below is the second surface and shows none of the dock, so
// taking only that one would leave the change itself unlooked-at.
const shotDock = path.join(SHOT_DIR, 'gui-94-commands-dock.png')
await page.screenshot({ path: shotDock })

// ── the assertions ────────────────────────────────────────────────────────
// AC4 is stated in device pixels; everything measured above is CSS pixels, and
// Chromium persists a zoom factor per origin inside userData, so the conversion
// is read live rather than assumed to be 1.
const DPR = M?.dpr || 1
const TOL = 1 / DPR
const near = (a, b) => a != null && b != null && Math.abs(a - b) <= TOL
// Children are held to the SAME device pixel, for the same reason: AC3 and AC4
// are one question asked twice ("did the box move where a user could see it"),
// and AC4 is the one that names the unit.
//
// This is the tolerance a no-change assertion can always be accused of having
// loosened to pass, so it is worth saying what the headroom actually is: the
// mutation run — `font: inherit` applied ALONE, without the neutralisation —
// moved these three boxes by 5.6px, 4.8px and 5.6px against a 0.8px tolerance.
// Seven times over. The check is not living near its own threshold.
const same = near

if (M && !M.error) {
  // AC1 — the intended change, and the only one. This is what reds on `main`.
  if (M.family.desc !== M.FONT) {
    bad.push(`AC1 .command-row-desc font-family is ${JSON.stringify(M.family.desc)}, want --font ${JSON.stringify(M.FONT)}`)
  }
  if (M.family.desc === M.UA.family && M.FONT !== M.UA.family) {
    bad.push(`AC1 .command-row-desc still wears the UA button family ${JSON.stringify(M.UA.family)}`)
  }

  // AC2 — the two children that declare their own family keep it.
  for (const k of ['name', 'hint']) {
    if (M.family[k] == null) {
      notes.push(`.command-row-${k}: not present on the sampled row — NOT MEASURED`)
      continue
    }
    if (M.family[k] !== M.MONO) {
      bad.push(`AC2 .command-row-${k} font-family is ${JSON.stringify(M.family[k])}, want --mono ${JSON.stringify(M.MONO)}`)
    }
  }

  // AC3 — the criterion the ADR did not have. Compared against the rebuilt
  // pre-fix row, not against a remembered number.
  for (const k of ['name', 'hint', 'desc']) {
    if (M.pre[k] == null) continue
    if (!same(M.pre[k], M.post[k])) {
      bad.push(
        `AC3 .command-row-${k} line box moved: ${M.pre[k]}px before → ${M.post[k]}px after (${px3(M.post[k] - M.pre[k])}px)`
      )
    }
  }

  // AC4 — the row as a whole, within one device pixel.
  if (!near(M.pre.row, M.post.row)) {
    bad.push(`AC4 row height moved: ${M.pre.row}px before → ${M.post.row}px after (tolerance ${px3(TOL)}px)`)
  }

  // The rest of the shorthand: `font: inherit` pulls these from `body`, so any
  // disagreement between the button and `body` after the fix is a property the
  // shorthand moved and nobody pinned.
  for (const k of ['weight', 'style', 'variant', 'stretch']) {
    if (M.rest.btn[k] !== M.rest.body[k]) {
      notes.push(
        `font-${k}: button ${M.rest.btn[k]} vs body ${M.rest.body[k]} — differs, so the shorthand moved it or something pins it`
      )
    }
  }
}

function px3(n) {
  return Math.round(n * 1000) / 1000
}

// ── the second surface ────────────────────────────────────────────────────
// `.command-row-name` / `.command-row-hint` also render in the composer's slash
// popover, inside `.command-option`. Nothing in this ticket should touch them,
// and the same probe heights are the expectation there too — both surfaces
// resolve those two children from the same family, the same size and the same
// inherited `normal` today.
await page.evaluate(() => document.querySelector('[aria-label="Commands panel"]')?.click())
await page.waitForTimeout(400)
await page.evaluate(() => document.querySelector('.message-input')?.focus())
await page.keyboard.type('/')
await page.waitForTimeout(2500)

const P = await page.evaluate(() => {
  const px = (v) => Math.round(v * 1000) / 1000
  const opts = [...document.querySelectorAll('.command-option')]
  if (opts.length === 0) return { count: 0 }
  let opt = opts[0]
  for (const o of opts) if (o.querySelector('.command-row-hint')) opt = o
  const g = (s) => {
    const el = opt.querySelector(s)
    return el ? { h: px(el.getBoundingClientRect().height), fam: getComputedStyle(el).fontFamily } : null
  }
  return {
    count: opts.length,
    name: g('.command-row-name'),
    hint: g('.command-row-hint'),
    option: px(opt.getBoundingClientRect().height),
    popover: (() => {
      const p = document.querySelector('.command-popover')
      return p ? px(p.getBoundingClientRect().height) : null
    })()
  }
})

if (!P || P.count === 0) {
  bad.push('.command-option: slash popover never opened — the second surface was NOT MEASURED, not a pass')
} else if (M && !M.error) {
  for (const k of ['name', 'hint']) {
    if (!P[k]) {
      notes.push(`popover .command-row-${k}: not present on the sampled option — NOT MEASURED`)
      continue
    }
    if (M.pre[k] != null && !same(M.pre[k], P[k].h)) {
      bad.push(
        `SURFACE-2 popover .command-row-${k} line box is ${P[k].h}px, dock pre-fix expectation is ${M.pre[k]}px — the fix reached into the popover`
      )
    }
    if (M.MONO && P[k].fam !== M.MONO) {
      bad.push(`SURFACE-2 popover .command-row-${k} font-family is ${JSON.stringify(P[k].fam)}, want --mono`)
    }
  }
}

// ── report ────────────────────────────────────────────────────────────────
console.log('=== #94 .command-row-btn font: inherit — vertical metrics held ===')
if (M && !M.error) {
  console.log(`devicePixelRatio ${M.dpr} → AC4 tolerance ${px3(TOL)} css px`)
  console.log(`UA button font : ${M.UA.family} / ${M.UA.size} / lh ${M.UA.lineHeight} / w ${M.UA.weight}`)
  console.log(`--font         : ${M.FONT}`)
  console.log(`--mono         : ${M.MONO}`)
  console.log(`dock rows ${M.rows}, sampled the row carrying ${M.children}/3 children`)
  console.log('')
  console.log('child                 pre(px)   post(px)   delta   computed line-height   family')
  for (const k of ['name', 'hint', 'desc']) {
    if (M.pre[k] == null) {
      console.log(`.command-row-${k.padEnd(8)} — not on the sampled row`)
      continue
    }
    console.log(
      `.command-row-${k.padEnd(8)} ${String(M.pre[k]).padStart(7)}   ${String(M.post[k]).padStart(8)}   ` +
        `${String(px3(M.post[k] - M.pre[k])).padStart(6)}   ${String(M.computedLH[k]).padStart(20)}   ${M.family[k]}`
    )
  }
  console.log(
    `.command-row-btn      ${String(M.pre.row).padStart(7)}   ${String(M.post.row).padStart(8)}   ` +
      `${String(px3(M.post.row - M.pre.row)).padStart(6)}   ${String(M.computedLH.btn).padStart(20)}   ${M.family.btn}`
  )
  console.log(`.command-list height ${M.listHeight}px over ${M.listRows} rows`)
  console.log(
    `rest of the shorthand — button: weight ${M.rest.btn.weight}, style ${M.rest.btn.style}, ` +
      `variant ${M.rest.btn.variant}, stretch ${M.rest.btn.stretch}`
  )
  console.log(
    `                          body: weight ${M.rest.body.weight}, style ${M.rest.body.style}, ` +
      `variant ${M.rest.body.variant}, stretch ${M.rest.body.stretch}`
  )
}
if (P && P.count) {
  console.log('')
  console.log(`surface 2 — slash popover: ${P.count} options, option ${P.option}px, popover ${P.popover}px`)
  for (const k of ['name', 'hint']) {
    if (P[k]) console.log(`  .command-row-${k.padEnd(8)} ${String(P[k].h).padStart(7)}px   ${P[k].fam}`)
  }
}

const shot = path.join(SHOT_DIR, 'gui-94-slash-popover.png')
await page.screenshot({ path: shot })
console.log('')
for (const n of notes) console.log(`note: ${n}`)
console.log(`screenshot (dock, the changed surface): ${shotDock}`)
console.log(`screenshot (slash popover, surface 2):  ${shot}`)
console.log(bad.length === 0 ? 'PASS' : 'FAIL: ' + bad.join(' | '))

setTimeout(() => process.exit(bad.length === 0 ? 0 : 1), 4000).unref?.()
await app.close().catch(() => {})
try {
  fs.rmSync(WORK_DIR, { recursive: true, force: true })
} catch {
  console.log(`(left behind: ${WORK_DIR})`)
}
process.exit(bad.length === 0 ? 0 : 1)
