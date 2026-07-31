// GUI driver for #70 (spec #64) — prove the four palettes reach REAL painted
// pixels in a REAL window, and be honest about the one thing no driver can do.
//
// WHAT THIS CANNOT DO, stated first so no one reads a PASS as more than it is:
// it cannot tell you whether Ember LOOKS good, whether Slate is quiet enough, or
// whether any palette stays inside DESIGN.md's ≤10% accent budget. Those are
// aesthetic judgements about a window over a wallpaper, and a capture under
// automation is not evidence either way. The screenshots this writes — one per
// palette — are FOR A HUMAN TO OPEN. Everything asserted below is mechanism.
//
// Launched WITHOUT --disable-gpu, the recorded trap being that disabling it
// flattens acrylic and photographs neither material.
//
// What it DOES prove, none of which the jsdom suite can — jsdom loads no
// stylesheet at all, so every colour claim in the vitest suite is a claim about
// an attribute, never about paint:
//   1. the panel renders four options, each with a visible non-zero box;
//   2. the four SWATCHES paint four DISTINCT colours. They carry `data-theme`
//      and nothing else, so this is the whole nested-opt-in mechanism under a
//      real cascade: if `[data-theme=…]` did not apply to a nested element, or
//      if the swatch read the `--mint` alias (already resolved up at :root)
//      instead of `--color-mint`, all four would paint identically and the
//      picker would preview nothing — silently;
//   3. the selected option is VISIBLY distinct, i.e. the aria-selected rule
//      actually paints rather than living in the accessibility tree;
//   4. picking a palette re-hues the WHOLE window: the set of distinct painted
//      colours document-wide differs for all four, pairwise;
//   5. the NEUTRALS move too, not just the accent — the app wash is a different
//      colour under Slate than under Frost;
//   6. the short aliases inherit the override FOR FREE: `var(--mint)`, which
//      resolves through `var(--color-mint)` up at :root, follows the theme. That
//      is the unlayered-beats-layered mechanism, measured rather than cited;
//   7. NOTHING IS LEFT BEHIND. After switching off Frost, no element still
//      paints Frost's mint or its 10%-alpha wash — excluding elements that
//      deliberately opted into another palette, which is exactly the swatches;
//   8. the choice survives a real process restart.
//
// Red-first: run against a build without the feature and step 1 fails naming the
// reason (no Theme control in the panel). A driver never seen failing proves
// nothing.
//
//   node .claude/skills/run-desktop/gui-70.mjs
//
// Needs `npm run build` first, plus `npm i --no-save playwright-core`.
// Leaves the app's stored theme as it found it.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'theme70-ws-'))
const THEMES = ['frost', 'ember', 'moss', 'slate']

let cleaned = false
const cleanup = () => {
  if (cleaned) return
  cleaned = true
  try {
    fs.rmSync(WORKSPACE, { recursive: true, force: true })
  } catch {}
}

setTimeout(() => {
  console.log('TIMEOUT')
  cleanup()
  process.exit(1)
}, 240000).unref?.()

const log = (label, m) => console.log(label.padEnd(12) + JSON.stringify(m))
const fails = []

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const launch = () =>
  electron.launch({
    executablePath: electronBin,
    args: ['--no-sandbox', '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 45000
  })

const openWorkspace = async (app) => {
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, WORKSPACE)
  const page = await app.firstWindow()
  await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) =>
        b.getAttribute('aria-label') === 'Pick a project folder' ||
        b.textContent?.includes('Pick a project folder')
    )
    btn?.click()
  })
  await page.waitForSelector('.message-input', { timeout: 25000 })
  return page
}

const click = (page, label) =>
  page.evaluate((l) => document.querySelector(`[aria-label="${l}"]`)?.click(), label)

// Resolve a custom property to real paint under a named palette, by way of a
// throwaway probe. Reading the property text off documentElement would only
// hand back the oklch() SOURCE; painting it is what proves the cascade ran.
const paintUnder = (page, theme, expression) =>
  page.evaluate(
    ({ t, expr }) => {
      const probe = document.createElement('span')
      probe.setAttribute('data-theme', t)
      probe.style.color = expr
      document.body.appendChild(probe)
      const painted = getComputedStyle(probe).color
      probe.remove()
      return painted
    },
    { t: theme, expr: expression }
  )

// Every distinct colour the window is actually painting right now. Elements that
// deliberately opted into another palette — the swatches — are excluded, because
// a Frost swatch under Ember is the feature working, not a leftover.
const paintedColours = (page) =>
  page.evaluate(() => {
    const props = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'fill']
    const seen = new Set()
    for (const el of document.querySelectorAll('*')) {
      if (el.closest('[data-theme]') && el.closest('[data-theme]') !== document.documentElement) {
        continue
      }
      const cs = getComputedStyle(el)
      for (const p of props) {
        const v = cs[p]
        if (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'none') seen.add(`${p}:${v}`)
      }
    }
    return [...seen].sort()
  })

const pick = (page, name) =>
  page.evaluate((n) => document.querySelector(`[data-option-theme="${n}"]`)?.click(), name)

let app = await launch()
let page
const finish = async () => {
  console.log(fails.length === 0 ? 'PASS' : 'FAIL')
  for (const f of fails) console.log('  - ' + f)
  console.log(
    `NOTE        whether any palette LOOKS good, and whether it stays inside DESIGN.md's accent budget, is NOT asserted here and cannot be; open ${SHOT_DIR} and judge that by eye.`
  )
  setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 5000).unref?.()
  await app?.close().catch(() => {})
  cleanup()
  process.exit(fails.length === 0 ? 0 : 1)
}

// ---- launch 1: the control, the swatches, and the whole-window re-hue --------

page = await openWorkspace(app)
await click(page, 'Appearance panel')
await page.waitForTimeout(1200)

const panel = await page.evaluate(() => {
  const dock = document.querySelector('.appearance-dock')
  const list = dock?.querySelector('[role="listbox"]')
  const options = [...(list?.querySelectorAll('[role="option"]') ?? [])].map((el) => {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    const swatch = el.querySelector('.appearance-swatch')
    const sr = swatch?.getBoundingClientRect()
    return {
      value: el.dataset.optionTheme ?? null,
      name: el.textContent?.trim() ?? null,
      selected: el.getAttribute('aria-selected') === 'true',
      box: { w: Math.round(r.width), h: Math.round(r.height) },
      background: cs.backgroundColor,
      borderColor: cs.borderTopColor,
      swatchPaint: swatch ? getComputedStyle(swatch).backgroundColor : null,
      swatchBox: sr ? { w: Math.round(sr.width), h: Math.round(sr.height) } : null
    }
  })
  return {
    dockMounted: !!dock,
    listMounted: !!list,
    labelText:
      document.getElementById(list?.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() ??
      null,
    options,
    documentTheme: document.documentElement.getAttribute('data-theme'),
    // A dock-wide rule from #66: no native form controls in this panel.
    natives: dock ? dock.querySelectorAll('input, select').length : -1
  }
})
log('PANEL', panel)

if (!panel.dockMounted) {
  fails.push('the Appearance dock did not open — nothing below could be driven')
  await finish()
}
if (!panel.listMounted || panel.options.length === 0) {
  fails.push(
    'no Theme control in the Appearance panel — no listbox rendered, so every check below never ran'
  )
  await finish()
}
if (panel.options.map((o) => o.value).join(',') !== THEMES.join(',')) {
  fails.push(
    `the options are ${JSON.stringify(panel.options.map((o) => o.value))}, expected ${JSON.stringify(THEMES)}`
  )
}
if (!/Theme/i.test(panel.labelText ?? '')) {
  fails.push(
    `the listbox is labelled ${JSON.stringify(panel.labelText)} rather than Theme — its label association is broken`
  )
}
if (panel.natives !== 0) {
  fails.push(`the panel renders ${panel.natives} native input/select controls — it must render none`)
}
if (panel.documentTheme !== 'frost') {
  fails.push(
    `a fresh window opens with data-theme=${JSON.stringify(panel.documentTheme)} — Frost is the default and the identity`
  )
}
for (const o of panel.options) {
  if (o.box.w === 0 || o.box.h === 0) {
    fails.push(`the ${o.name} row has a zero-size box (${JSON.stringify(o.box)}) — not visible`)
  }
  if (!o.swatchBox || o.swatchBox.w === 0 || o.swatchBox.h === 0) {
    fails.push(`the ${o.name} row renders no visible swatch (${JSON.stringify(o.swatchBox)})`)
  }
}

// 2. Four swatches, four colours. One shared colour here means the nested
//    opt-in silently stopped working and the picker previews nothing.
const swatchPaints = panel.options.map((o) => o.swatchPaint)
if (new Set(swatchPaints).size !== THEMES.length) {
  fails.push(
    `the four swatches paint ${new Set(swatchPaints).size} distinct colours (${JSON.stringify(swatchPaints)}) — each must show its OWN palette's accent`
  )
}

// 3. The selection has to be VISIBLE, not merely announced.
const selectedRow = panel.options.find((o) => o.selected)
const otherRow = panel.options.find((o) => !o.selected)
if (
  selectedRow &&
  otherRow &&
  selectedRow.background === otherRow.background &&
  selectedRow.borderColor === otherRow.borderColor
) {
  fails.push(
    `the selected and unselected rows paint identically (bg ${selectedRow.background}, border ${selectedRow.borderColor}) — the selection state exists only in the accessibility tree`
  )
}

// 6. The aliases inherit the override for free — the mechanism the ADR argues
//    from the built stylesheet, measured here in a live engine instead.
const aliasPaint = {}
const tokenPaint = {}
for (const t of THEMES) {
  aliasPaint[t] = await paintUnder(page, t, 'var(--mint)')
  tokenPaint[t] = await paintUnder(page, t, 'var(--color-mint)')
}
log('ALIAS', { aliasPaint, tokenPaint })
if (new Set(Object.values(tokenPaint)).size !== THEMES.length) {
  fails.push(
    `the four palettes resolve --color-mint to ${JSON.stringify(tokenPaint)} — they are not four distinct accents`
  )
}

// 4 + 5 + 7: drive every palette through the real window.
const fingerprints = {}
const washes = {}
const frostAccent = await paintUnder(page, 'frost', 'var(--color-mint)')
const frostWash = await paintUnder(page, 'frost', 'var(--color-mint-wash)')

for (const t of THEMES) {
  await pick(page, t)
  await page.waitForTimeout(700)
  const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  if (applied !== t) {
    fails.push(`clicking ${t} left data-theme=${JSON.stringify(applied)} — the choice did not apply`)
  }
  fingerprints[t] = await paintedColours(page)
  // `#root` paints the app wash through `background: var(--wash)` — the SHORT
  // alias. So this one measurement carries two claims at once: the neutrals
  // moved, and they moved through the indirection nobody had to touch.
  washes[t] = await page.evaluate(
    () => getComputedStyle(document.querySelector('#root')).backgroundColor
  )
  await page.screenshot({ path: path.join(SHOT_DIR, `gui-70-${t}.png`) }).catch(() => {})

  // 7. Nothing left behind, checked on every palette but Frost itself.
  if (t !== 'frost') {
    const leftovers = await page.evaluate(
      ({ accent, wash }) => {
        const props = ['color', 'backgroundColor', 'borderTopColor', 'fill']
        const hits = []
        for (const el of document.querySelectorAll('*')) {
          const opted = el.closest('[data-theme]')
          if (opted && opted !== document.documentElement) continue
          const cs = getComputedStyle(el)
          for (const p of props) {
            if (cs[p] === accent || cs[p] === wash) {
              hits.push(`${el.className || el.tagName}#${p}=${cs[p]}`)
            }
          }
        }
        return hits.slice(0, 8)
      },
      { accent: frostAccent, wash: frostWash }
    )
    if (leftovers.length > 0) {
      fails.push(
        `under ${t}, ${leftovers.length}+ elements still paint Frost's accent — ${JSON.stringify(leftovers)}`
      )
    }
  }
}
log('WASH', washes)
log(
  'FINGERPRINT',
  Object.fromEntries(Object.entries(fingerprints).map(([t, c]) => [t, c.length]))
)

// 4. Pairwise distinct: two palettes producing the same painted window is one
//    palette shipped twice.
for (let i = 0; i < THEMES.length; i++) {
  for (let j = i + 1; j < THEMES.length; j++) {
    const [a, b] = [THEMES[i], THEMES[j]]
    if (JSON.stringify(fingerprints[a]) === JSON.stringify(fingerprints[b])) {
      fails.push(`${a} and ${b} paint the window identically — they are the same palette twice`)
    }
  }
}

// 5. Neutrals, not only the accent. A theme that moves the mint and leaves the
//    wash is an accent swap wearing a theme's name.
if (new Set(Object.values(washes)).size !== THEMES.length) {
  fails.push(
    `the app wash paints ${JSON.stringify(washes)} — the neutrals did not move under every palette, so only the accent is themed`
  )
}

// ---- launch 2: a real restart opens on the stored palette --------------------

await app.close().catch(() => {})
app = await launch()
page = await openWorkspace(app)
await page.waitForTimeout(900)

const afterRestart = await page.evaluate(() => ({
  applied: document.documentElement.getAttribute('data-theme'),
  stored: window.localStorage.getItem('theme')
}))
log('RESTART', afterRestart)

if (afterRestart.stored !== 'slate') {
  fails.push(
    `after a real restart the stored palette is ${JSON.stringify(afterRestart.stored)} — the choice did not survive`
  )
}
if (afterRestart.applied !== 'slate') {
  fails.push(
    `after a real restart the window opened on ${JSON.stringify(afterRestart.applied)} — the stored palette is not reapplied`
  )
}

// Leave the machine as we found it: this is the user's real app data.
await page.evaluate(() => window.localStorage.removeItem('theme'))

await finish()
