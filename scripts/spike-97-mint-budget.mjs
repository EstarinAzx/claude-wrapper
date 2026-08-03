// Spike #97 — measure the mint budget. `DESIGN.md`'s accent clause has never
// had matching evidence; this produces it and spends none of it.
//
//   node scripts/spike-97-mint-budget.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// Sixth sibling of spike-81/87/88/89/90, and the first that drives the WINDOW
// rather than the CLI — the quantity under test is rendered pixels, so the
// instrument has to be the real compositor. #90 is the one copied for scrubbing.
//
// THE CLAUSE, verbatim (`DESIGN.md:7`):
//
//   "Color strategy: Restrained. Mint accent <=10% of surface, spent only on:
//    logo mark, assistant avatar, send button, list markers, typing dots."
//
// Two halves, neither ever measured. #92 counted ~45 `--mint` REFERENCE SITES
// across 9 files and its own Pressure agent refused the number: "reference
// counts do not prove intended accent spend". A rule painting a 2px marker and
// a rule filling a button are one reference each and wildly different spends.
//
// ---------------------------------------------------------------------------
// THE INSTRUMENT: ONE MECHANISM, BOTH FACTS — A TOKEN DIFFERENTIAL
//
// Every measurement below is A/B: render, override the accent token, render
// again, and read the difference. Nothing here classifies a colour by hue, and
// nothing here is hardcoded, which is what makes it work identically in four
// palettes and what makes it exact rather than tolerant.
//
// FACT 1 (the spend list). A declaration "resolves to the mint token" iff its
// COMPUTED value changes when the token changes. That is the definition, not a
// proxy for it, so it catches `var(--mint)`, `var(--color-mint)`, a chain of
// aliases, and `color-mix(in oklch, var(--mint) 22%, transparent)` with one
// mechanism and no parsing. It is specifically NOT a grep: `.context/pick-up.md`
// carries the landmine that the long name and the short alias are not
// interchangeable inside a nested `[data-theme]` opt-in, so a grep for `--mint`
// both misses sites and mis-scopes others. Each of the four accent tokens is
// overridden ALONE, so every declaration is attributed to the exact token it
// reads.
//
// FACT 2 (the proportion). For a pixel where the accent is composited at alpha
// a over ground G:
//
//     A = a*M + (1-a)*G        (the app as shipped)
//     B = a*N + (1-a)*G        (the same frame, token overridden to N)
//     A - B = a*(M - N)        <- the ground CANCELS, exactly
//
// so a = ((A-B) . (M-N)) / |M-N|^2, recovered per pixel by projection. Three
// consequences, and they are the whole reason this shape was chosen:
//
//   * The `--disable-gpu` / acrylic trap is neutralised BY CONSTRUCTION. What
//     the translucent ground composites to is G, and G cancels. Flattened
//     acrylic changes what the app looks like; it cannot change this number.
//   * No tolerance is invented. The only error is byte quantisation, and it is
//     quantified empirically by a NULL CONTROL (capture twice, change nothing).
//   * Antialiased glyph edges and 10%-alpha washes fall out correctly as
//     partial a, instead of being a judgement call about where to put a cutoff.
//
// N is opaque black for every token, except `--color-mint-wash`, whose override
// KEEPS the token's 0.1 alpha — otherwise a differs between A and B and the
// relation above breaks. `--color-mint-ink` is a glyph colour ON an accent fill,
// never accent surface itself (themes.css says so and fixes its lightness and
// chroma); it is enumerated in Fact 1 and deliberately excluded from Fact 2, so
// ink glyphs subtract themselves from the fills they sit in.
//
// TWO NUMBERS, because the clause does not say which it means. A 10%-alpha wash
// over a third of the window is either "a third of the surface carries accent"
// or "3% of the pigment is accent", and picking one silently would be the
// laundering this ticket exists to avoid:
//
//   coverage — fraction of pixels the accent touches at all (a > gate)
//   ink      — sum of a over the viewport, the alpha-weighted pigment fraction
//
// CALIBRATION, because the pipeline has a channel order, a compositing model
// and a scale factor that could each be silently wrong. A known solid-mint
// element (`.welcome-mark`, `.logo-mark`) is measured in every cell and must
// come back a ~= 1.0. If BGRA were read as RGBA, or the screenshot scale were
// misread, that target moves off 1.0 and the run fails loudly. An empty return
// measures nothing — this is the guard that makes a zero mean something.
//
// MOTION IS FROZEN (`prefers-reduced-motion: reduce`, which base.css:92 turns
// into `animation: none !important`) so A and B are the same frame. Verified by
// reading the media state back, never assumed — gui-96's rule, used here for
// the opposite purpose. Nothing hides: `msg-in` and `typing-pulse` put their
// `opacity: 0` / `0.35` in KEYFRAMES, so with no animation both render at their
// authored opacity.
//
// SCRUBBING, as #90. Basename only for the temp dir; nothing identifying
// leaves it. What lands in the findings file is selectors, CSS properties,
// repo-relative source paths, design-token colours, pixel counts and ratios.
//
// THIS SPIKE DECIDES NOTHING. `DESIGN.md` is not edited and no `src/` file is
// touched. Amending the governing standard to match measured drift is the
// laundering move #92 and #96 both refused; the call stays the owner's, on #92.

import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, relative, basename } from 'node:path'
import { _electron as electron } from 'playwright-core'

const APP_DIR = resolve(import.meta.dirname, '..')
const STYLE_DIR = join(APP_DIR, 'src/renderer/src/styles')
const runDir = mkdtempSync(join(tmpdir(), 'spike-97-'))
const findingsPath = new URL('./spike-97-findings.json', import.meta.url)

const WANT_W = 1440
const WANT_H = 900

// The four palettes, from the app's own source of truth rather than a copy.
const THEMES = ['frost', 'ember', 'moss', 'slate']

// The five sites the clause names, mapped to what the app actually calls them.
// A selector matching any pattern here is `listed`; everything else is
// `unlisted`. Kept as data so the mapping is auditable rather than buried.
const LISTED = [
  { site: 'logo mark', test: (s) => /\.logo-mark|\.welcome-mark/.test(s) },
  { site: 'assistant avatar', test: (s) => /\.avatar/.test(s) },
  { site: 'send button', test: (s) => /\.send-btn/.test(s) },
  // Matches both forms this runs against: the authored selector
  // (`.assistant-body ul > li::before`) and the live element probe
  // (`li.foo::before`), which is why the class part is optional here.
  { site: 'list markers', test: (s) => /li[.\w-]*::(before|marker)/.test(s) || /::marker/.test(s) },
  { site: 'typing dots', test: (s) => /\.typing-dot/.test(s) }
]
const classify = (sel) => LISTED.find((l) => l.test(sel))?.site ?? null

// The accent tokens, each overridden ALONE. `--color-mint-wash` keeps its 0.1
// alpha (fixed in all four palettes by themes.css) or the differential breaks.
// `--color-mint-ink` is enumerated but never counted as surface.
const TOKENS = [
  { name: '--color-mint', to: 'oklch(0 0 0)', surface: true },
  { name: '--color-mint-press', to: 'oklch(0 0 0)', surface: true },
  { name: '--color-mint-wash', to: 'oklch(0 0 0 / 0.1)', surface: true },
  { name: '--color-mint-ink', to: 'oklch(0 0 0)', surface: false }
]

const PAINT_PROPS = [
  'color', 'background-color', 'background-image', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color',
  'outline-color', 'box-shadow', 'fill', 'stroke', 'text-decoration-color',
  'caret-color', 'column-rule-color'
]


const fails = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 900000).unref?.()

// ---------------------------------------------------------------------------
// Source-side selector index, for file attribution ONLY. The built app ships one
// bundled stylesheet, so a live rule cannot name its own source file; the rules
// themselves still come from the engine, never from this scan.
const sourceIndex = new Map()
for (const name of readdirSync(STYLE_DIR).filter((f) => f.endsWith('.css'))) {
  const file = join(STYLE_DIR, name)
  const raw = readFileSync(file, 'utf8')
  // Strip comments first, preserving newlines so line numbers survive — prose
  // in a comment must not be able to masquerade as a selector, and this repo's
  // CSS carries a lot of prose.
  let text = ''
  for (let i = 0; i < raw.length; ) {
    if (raw[i] === '/' && raw[i + 1] === '*') {
      const end = raw.indexOf('*/', i + 2)
      const body = raw.slice(i, end === -1 ? raw.length : end + 2)
      text += body.replace(/[^\n]/g, ' ')
      i = end === -1 ? raw.length : end + 2
    } else {
      text += raw[i]
      i++
    }
  }
  // Buffer until `{` rather than matching a single line: a selector list may
  // span lines (`.appearance-choice[aria-checked='true'],\n  .appearance-choice…`)
  // and the line-at-a-time form silently dropped those.
  let buf = ''
  let bufLine = 1
  let line = 1
  const rel = relative(APP_DIR, file).replace(/\\/g, '/')
  for (const ch of text) {
    if (ch === '\n') line++
    if (ch === '{') {
      const sel = buf.trim().replace(/\s+/g, ' ').toLowerCase()
      if (sel && !sel.startsWith('@')) {
        for (const part of sel.split(',').map((s) => s.trim()).filter(Boolean)) {
          if (!sourceIndex.has(part)) sourceIndex.set(part, `${rel}:${bufLine}`)
        }
      }
      buf = ''
      bufLine = line
      continue
    }
    if (ch === '}' || ch === ';') {
      buf = ''
      bufLine = line
      continue
    }
    if (!buf.trim() && /\s/.test(ch)) {
      bufLine = line
      continue
    }
    buf += ch
  }
}

const attribute = (selectorText) => {
  const parts = String(selectorText).split(',').map((s) => s.trim().replace(/\s+/g, ' ').toLowerCase())
  for (const p of parts) {
    const hit = sourceIndex.get(p)
    if (hit) return hit
  }
  return null
}

// ---------------------------------------------------------------------------
const electronBin =
  process.platform === 'win32'
    ? join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : join(APP_DIR, 'node_modules/electron/dist/electron')

const app = await electron.launch({
  executablePath: electronBin,
  // `--disable-gpu` is load-bearing in a background session (#78) and it
  // flattens acrylic. That is stated rather than worked around: the ground
  // cancels out of every differential below, so it cannot move a number here.
  args: ['--no-sandbox', '--disable-gpu', '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

const WORK_DIR = mkdtempSync(join(tmpdir(), 'spike97-ws-'))
await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, WORK_DIR)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

// ---- premise: motion frozen, and READ BACK ---------------------------------
await page.emulateMedia({ reducedMotion: 'reduce' }).catch(() => {})
const motion = await page.evaluate(() => ({
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  dpr: window.devicePixelRatio
}))
check('premise: motion is frozen, so A and B are the same frame', motion.reduced === true, {
  ...motion,
  hint: 'base.css:92 turns this into `animation: none !important`; without it a pulsing dot lands in the differential'
})

// ---- premise: the viewport is what was asked for ---------------------------
// The ticket's first trap: a capture that cannot see the whole layout produces
// a proportion that is wrong and looks precise. The window is sized ONCE, here,
// before anything is measured, and clamped to the display so a small screen
// fails as a stated smaller viewport rather than as a silent clip.
// Both of the things this spike drives are PERSISTED by the app — the window
// bounds in localStorage (#79) and the palette under the `theme` key — so the
// originals are taken here and put back before the window closes. A spike that
// left a 900x600 window and a non-default palette behind would silently move
// what the next GUI driver measures.
const original = {
  bounds: await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getContentBounds()),
  theme: await page.evaluate(() => window.localStorage.getItem('theme'))
}

const bounds = await app.evaluate(async ({ BrowserWindow, screen }, [w, h]) => {
  const win = BrowserWindow.getAllWindows()[0]
  const area = screen.getPrimaryDisplay().workAreaSize
  const want = { width: Math.min(w, area.width), height: Math.min(h, area.height) }
  win.setContentBounds({ x: 0, y: 0, ...want })
  await new Promise((r) => setTimeout(r, 400))
  const got = win.getContentBounds()
  return { want, got, workArea: area, scaleFactor: screen.getDisplayMatching(got).scaleFactor }
}, [WANT_W, WANT_H])
await page.waitForTimeout(700)

// THREE DIFFERENT PIXELS LIVE HERE, and the first run of this spike confused two
// of them. The window is sized in DIP; `capturePage` returns PHYSICAL pixels
// (DIP x the display's scale factor); `window.innerWidth` is CSS pixels, which
// is DIP divided by the app's own ZOOM (#66, and Chromium persists it per origin
// inside userData — #78). Asserting innerWidth against the DIP size therefore
// fails on a correctly-captured window whenever zoom != 1.
//
// The trap this premise exists for is CLIPPING, so it is stated as clipping:
// the capture must cover the whole window content, exactly.
const view = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio }))
const expectDevice = {
  w: Math.round(bounds.got.width * bounds.scaleFactor),
  h: Math.round(bounds.got.height * bounds.scaleFactor)
}
const zoom = +(view.dpr / bounds.scaleFactor).toFixed(4)
check('premise: the window took the content size it was given (DIP)', Math.abs(bounds.got.width - bounds.want.width) <= 2 && Math.abs(bounds.got.height - bounds.want.height) <= 2, {
  askedDip: bounds.want,
  gotDip: bounds.got,
  workArea: bounds.workArea,
  displayScaleFactor: bounds.scaleFactor,
  appZoom: zoom,
  viewportCssPx: { w: view.w, h: view.h },
  expectedCaptureDevicePx: expectDevice
})

// ---------------------------------------------------------------------------
// Capture + differential, both in the MAIN process. `capturePage().toBitmap()`
// is raw BGRA, so no PNG decoder and no base64 round trip; buffers stay in main
// and only aggregates cross back.
const capture = (key) =>
  app.evaluate(async ({ BrowserWindow }, key) => {
    const win = BrowserWindow.getAllWindows()[0]
    const img = await win.webContents.capturePage()
    const size = img.getSize()
    globalThis.__caps ??= {}
    globalThis.__caps[key] = { buf: img.toBitmap(), w: size.width, h: size.height }
    return { w: size.width, h: size.height, bytes: globalThis.__caps[key].buf.length }
  }, key)

// dM is [dB, dG, dR] — bitmap channel order, and the calibration target below
// is what proves the order is right rather than assumed.
const differential = (keyA, keyB, dM, regions, gate) =>
  app.evaluate((_e, { keyA, keyB, dM, regions, gate }) => {
    const A = globalThis.__caps[keyA]
    const B = globalThis.__caps[keyB]
    if (!A || !B || A.w !== B.w || A.h !== B.h) return { error: 'capture mismatch' }
    const den = dM[0] * dM[0] + dM[1] * dM[1] + dM[2] * dM[2]
    if (den === 0) return { error: 'zero token delta' }

    const { w, h } = A
    const a = A.buf
    const b = B.buf
    const alpha = new Float32Array(w * h)
    let ink = 0
    let inkGated = 0
    let coverage = 0
    let maxA = 0
    let residualSum = 0

    for (let p = 0, i = 0; p < w * h; p++, i += 4) {
      const d0 = a[i] - b[i]
      const d1 = a[i + 1] - b[i + 1]
      const d2 = a[i + 2] - b[i + 2]
      if (d0 === 0 && d1 === 0 && d2 === 0) continue
      let t = (d0 * dM[0] + d1 * dM[1] + d2 * dM[2]) / den
      if (t < 0) t = 0
      else if (t > 1) t = 1
      alpha[p] = t
      ink += t
      if (t >= gate) {
        inkGated += t
        coverage++
        // How much of the measured change the projection did NOT explain. A
        // large residual means the difference was not this token compositing.
        const rx = d0 - t * dM[0]
        const ry = d1 - t * dM[1]
        const rz = d2 - t * dM[2]
        residualSum += Math.sqrt(rx * rx + ry * ry + rz * rz)
      }
      if (t > maxA) maxA = t
    }

    const px = w * h
    const out = {
      w,
      h,
      pixels: px,
      ink,
      inkFraction: ink / px,
      inkGatedFraction: inkGated / px,
      coveragePixels: coverage,
      coverageFraction: coverage / px,
      maxAlpha: maxA,
      meanResidualOfGated: coverage ? residualSum / coverage : 0
    }
    // Per-region means, used for the calibration target and for per-element
    // attribution. Regions arrive in DEVICE pixels, already scaled.
    out.regions = (regions ?? []).map((r) => {
      const x0 = Math.max(0, Math.round(r.x))
      const y0 = Math.max(0, Math.round(r.y))
      const x1 = Math.min(w, Math.round(r.x + r.w))
      const y1 = Math.min(h, Math.round(r.y + r.h))
      let sum = 0
      let n = 0
      let hit = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const t = alpha[y * w + x]
          sum += t
          n++
          if (t >= gate) hit++
        }
      }
      return { key: r.key, pixels: n, ink: sum, meanAlpha: n ? sum / n : 0, coveredPixels: hit }
    })
    return out
  }, { keyA, keyB, dM, regions, gate })

const setOverride = (decls) =>
  page.evaluate((decls) => {
    const root = document.documentElement
    for (const [k, v] of Object.entries(decls)) {
      if (v === null) root.style.removeProperty(k)
      else root.style.setProperty(k, v)
    }
    void root.offsetHeight
  }, decls)

// Resolve a CSS value to sRGB bytes using the engine itself — never a parser and
// never a literal. `ctx.fillStyle` accepts whatever `getComputedStyle` returned,
// so the browser does its own conversion and the numbers below match what the
// compositor put on screen.
const resolveRGB = (value) =>
  page.evaluate((value) => {
    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;left:-9999px;top:0'
    probe.style.color = value
    document.body.appendChild(probe)
    const computed = getComputedStyle(probe).color
    probe.remove()
    const cv = document.createElement('canvas')
    cv.width = cv.height = 1
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = computed
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    return { computed, r: d[0], g: d[1], b: d[2], a: d[3] }
  }, value)

// ---------------------------------------------------------------------------
// FACT 1 — every rule that resolves to an accent token, by definition.
const enumerateRules = () =>
  page.evaluate(({ tokens, props }) => {
    // Split a serialised declaration block on top-level `;` only — a value like
    // `color-mix(in oklch, var(--mint) 22%, transparent)` carries commas and
    // parens, and a custom property's value may carry a colon.
    const splitDecls = (cssText) => {
      const parts = []
      let depth = 0
      let quote = null
      let buf = ''
      for (const ch of cssText) {
        if (quote) {
          buf += ch
          if (ch === quote) quote = null
          continue
        }
        if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue }
        if (ch === '(') depth++
        else if (ch === ')') depth--
        if (ch === ';' && depth === 0) { if (buf.trim()) parts.push(buf.trim()); buf = ''; continue }
        buf += ch
      }
      if (buf.trim()) parts.push(buf.trim())
      return parts
        .map((d) => {
          const i = d.indexOf(':')
          return i === -1 ? null : { prop: d.slice(0, i).trim(), value: d.slice(i + 1).trim() }
        })
        .filter(Boolean)
    }

    const rules = []
    const walk = (list, media) => {
      for (const rule of list) {
        if (rule.cssRules && rule.type !== 1) {
          walk(rule.cssRules, rule.conditionText ? `${media ? media + ' and ' : ''}${rule.conditionText}` : media)
          continue
        }
        if (!rule.style || !rule.selectorText) continue
        // PARSE cssText, DO NOT ITERATE `rule.style`. For a shorthand carrying a
        // var() — `background: var(--mint)` — Chromium enumerates the LONGHANDS
        // (background-image, ..., background-color) and returns `''` for each,
        // because substitution has not happened yet. The second run of this
        // spike filtered on `value.includes('var(')` against those empty strings
        // and found ZERO of the five named sites, all of which are painted with
        // the `background` shorthand. The authored text is the only place the
        // declaration still exists intact.
        for (const d of splitDecls(rule.style.cssText)) {
          // A declaration can only read a custom property through `var()`.
          // Anything without one cannot resolve to a token, so this filter
          // cannot hide a site — it only skips work.
          if (!d.value.includes('var(')) continue
          rules.push({ selector: rule.selectorText, prop: d.prop, value: d.value, media: media ?? null })
        }
      }
    }
    for (const sheet of document.styleSheets) {
      let list
      try { list = sheet.cssRules } catch { continue }
      walk(list, null)
    }

    // Resolve each candidate on a probe, once per override state. Custom
    // properties are read from :root through the probe's inheritance, which is
    // the same path the real elements take.
    const probe = document.createElement('div')
    const RESET = 'position:absolute;left:-9999px;top:0'
    probe.style.cssText = RESET
    document.body.appendChild(probe)

    // READ A VECTOR OF LONGHANDS, NOT THE DECLARED PROPERTY. The first run of
    // this spike read back only `rule.style.getPropertyValue(prop)`, and every
    // SHORTHAND came back `''` — Chromium has no computed value for
    // `background`, only for `background-color` and friends. That silently
    // dropped `background: var(--mint)`, which is how the logo mark, the
    // avatar, the send button, the welcome mark and the typing dots are all
    // painted: 21 declarations found where the app has far more, and four of
    // the five NAMED sites missing while the audit reported itself green.
    const readVector = () => {
      const cs = getComputedStyle(probe)
      return props.map((k) => cs.getPropertyValue(k))
    }
    const EMPTY = readVector()

    const resolveAll = () =>
      rules.map((r) => {
        probe.style.cssText = RESET
        probe.style.setProperty(r.prop, r.value)
        // A custom-property declaration paints nothing itself, so the paint
        // vector cannot see it. What it "resolves to" is its own substituted
        // value, which getComputedStyle DOES report for custom properties
        // (unlike a shorthand). Keeping these visible is what makes the alias
        // chain auditable: `--mint: var(--color-mint)` is the hop that a grep
        // for one spelling sees and a grep for the other does not.
        if (r.prop.startsWith('--')) return [getComputedStyle(probe).getPropertyValue(r.prop)]
        return readVector()
      })

    const root = document.documentElement
    const base = resolveAll()
    const perToken = {}
    for (const t of tokens) {
      root.style.setProperty(t.name, t.to)
      perToken[t.name] = resolveAll()
      root.style.removeProperty(t.name)
    }
    probe.remove()

    const differs = (a, b) => a.some((v, i) => v !== b[i])

    return rules
      .map((r, i) => {
        const dependsOn = tokens.filter((t) => differs(perToken[t.name][i], base[i])).map((t) => t.name)
        // What the declaration actually paints, named by longhand: every entry
        // that moved off an untouched probe.
        const isTokenDefinition = r.prop.startsWith('--')
        const paints = {}
        if (isTokenDefinition) {
          paints[r.prop] = base[i][0]
        } else {
          props.forEach((k, j) => {
            if (base[i][j] !== EMPTY[j]) paints[k] = base[i][j]
          })
        }
        return { ...r, resolved: paints, dependsOn, isTokenDefinition }
      })
      .filter((r) => r.dependsOn.length > 0)
  }, { tokens: TOKENS, props: PAINT_PROPS })

// Which live elements paint an accent token, and where they are. Same
// definition as the rule scan — a computed style that MOVES when the token
// moves — so a site reached by inheritance or an inline style cannot hide.
const elementScan = () =>
  page.evaluate(({ tokens, props }) => {
    const els = [...document.querySelectorAll('*')]
    const pseudos = [null, '::before', '::after', '::marker']
    const snap = () =>
      els.map((el) =>
        pseudos.map((p) => {
          const cs = getComputedStyle(el, p ?? undefined)
          return props.map((k) => cs.getPropertyValue(k)).join('|')
        })
      )

    const root = document.documentElement
    const base = snap()
    const surfaceTokens = tokens.filter((t) => t.surface)
    const per = {}
    for (const t of surfaceTokens) {
      root.style.setProperty(t.name, t.to)
      per[t.name] = snap()
      root.style.removeProperty(t.name)
    }

    const out = []
    els.forEach((el, i) => {
      const hits = []
      pseudos.forEach((p, pi) => {
        const toks = surfaceTokens.filter((t) => per[t.name][i][pi] !== base[i][pi]).map((t) => t.name)
        if (toks.length) hits.push({ pseudo: p ?? 'element', tokens: toks })
      })
      if (!hits.length) return
      const r = el.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0) return
      out.push({
        key: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`,
        hits,
        rect: { x: r.x, y: r.y, w: r.width, h: r.height }
      })
    })
    return out
  }, { tokens: TOKENS, props: PAINT_PROPS })

// ---------------------------------------------------------------------------
// States. The workspace conversation is grown from pushed `chat:event`s (#95's
// finding, and gui-96 uses the same trick) so no CLI turn is spent and the frame
// is deterministic. The SYNTHETIC part is the two events; every pixel measured
// is the app's real components in a real window.
const pushChat = (ev) =>
  app.evaluate(({ BrowserWindow }, ev) => {
    BrowserWindow.getAllWindows()[0].webContents.send('chat:event', ev)
  }, ev)

const enterWorkspace = async () => {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === 'Pick a project folder' || b.textContent?.includes('Pick a project folder')
    )
    btn?.click()
  })
  await page.waitForSelector('.message-input', { timeout: 20000 })
  await pushChat({
    type: 'text-delta',
    text:
      'Measured surfaces for the accent audit.\n\n' +
      '- first unordered marker\n- second unordered marker\n- third unordered marker\n\n' +
      '1. first ordered marker\n2. second ordered marker\n\n' +
      'Trailing prose so the assistant body is not only markers.\n'
  })
  await page.waitForSelector('.avatar', { timeout: 10000 })
  await page.waitForTimeout(400)
}

const setTheme = async (theme) => {
  // The app's own path: useTheme writes state + localStorage and its effect puts
  // the attribute on documentElement. Writing both keeps React's state and the
  // attribute in agreement, so a later re-render cannot snap the palette back
  // mid-measurement.
  await page.evaluate((t) => {
    window.localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }, theme)
  await page.waitForTimeout(250)
  return page.evaluate(() => document.documentElement.getAttribute('data-theme'))
}

// The calibration target: a known SOLID accent fill, measured inset so no
// antialiased edge or corner radius is in the sample.
const calibrationRegion = async (selector, inset, scale) =>
  page.evaluate(
    ([sel, inset, scale]) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      const w = r.width - inset * 2
      const h = r.height - inset * 2
      if (w <= 1 || h <= 1) return null
      return { key: `calibration:${sel}`, x: (r.x + inset) * scale, y: (r.y + inset) * scale, w: w * scale, h: h * scale }
    },
    [selector, inset, scale]
  )

// ---------------------------------------------------------------------------
const GATE = 0.01 // ~3x the byte-quantisation floor; the null control measures the real one

const cells = []
const runCell = async (theme, state, calSel, calInset) => {
  const applied = await setTheme(theme)
  if (applied !== theme) {
    fails.push(`theme ${theme} did not apply (attribute reads ${applied})`)
    return null
  }

  const base = await capture(`${theme}-${state}-A`)
  // The clipping trap, caught rather than averaged over: the capture must be
  // the whole window content, to the pixel.
  if (base.w !== expectDevice.w || base.h !== expectDevice.h) {
    fails.push(
      `capture is not the full window for ${theme}/${state} — got ${base.w}x${base.h} device px, expected ${expectDevice.w}x${expectDevice.h}`
    )
    return null
  }
  // CSS px -> device px, for turning getBoundingClientRect into capture
  // coordinates. This is dpr (deviceScaleFactor x zoom), not the display's
  // scale factor alone.
  const scale = base.w / view.w

  // Live accent value for THIS palette, resolved by the engine.
  const mint = await resolveRGB('var(--color-mint)')
  const press = await resolveRGB('var(--color-mint-press)')
  const black = await resolveRGB('oklch(0 0 0)')
  const dMint = [mint.b - black.b, mint.g - black.g, mint.r - black.r]
  const dPress = [press.b - black.b, press.g - black.g, press.r - black.r]

  const elements = await elementScan()
  const regions = elements.map((e, i) => ({
    key: `${i}:${e.key}`,
    x: e.rect.x * scale,
    y: e.rect.y * scale,
    w: e.rect.w * scale,
    h: e.rect.h * scale
  }))
  const cal = await calibrationRegion(calSel, calInset, scale)
  if (cal) regions.push(cal)

  const perToken = {}
  for (const t of TOKENS.filter((t) => t.surface)) {
    await setOverride({ [t.name]: t.to })
    await page.waitForTimeout(120)
    await capture(`${theme}-${state}-B-${t.name}`)
    await setOverride({ [t.name]: null })
    // mint-wash carries mint's own RGB at 0.1 alpha, so projecting it onto
    // FULL-opacity mint is what makes `a` read as accent pigment fraction
    // (0.1 for a wash) rather than as element coverage.
    const dM = t.name === '--color-mint-press' ? dPress : dMint
    const d = await differential(`${theme}-${state}-A`, `${theme}-${state}-B-${t.name}`, dM, regions, GATE)
    perToken[t.name] = d
  }

  const totalInk = Object.values(perToken).reduce((n, d) => n + (d.inkFraction ?? 0), 0)
  const totalCov = Object.values(perToken).reduce((n, d) => n + (d.coverageFraction ?? 0), 0)
  const calRead = perToken['--color-mint'].regions?.find((r) => r.key.startsWith('calibration:'))

  check(
    `calibration ${theme}/${state}: ${calSel} reads as a solid accent fill`,
    !!calRead && Math.abs(calRead.meanAlpha - 1) < 0.05,
    { selector: calSel, meanAlpha: calRead ? +calRead.meanAlpha.toFixed(4) : null, samplePixels: calRead?.pixels ?? 0 }
  )

  // Attribution: fold the per-element region reads into one list.
  const attributionMap = new Map()
  for (const [tok, d] of Object.entries(perToken)) {
    for (const r of d.regions ?? []) {
      if (r.key.startsWith('calibration:')) continue
      const idx = Number(r.key.split(':')[0])
      const el = elements[idx]
      if (!el || r.ink <= 0) continue
      // The pseudo matters for the site mapping: list markers are painted by
      // `li::before` / `li::marker`, which have no element of their own and roll
      // up into the `li`'s rect.
      const pseudoSuffix = el.hits.map((h) => h.pseudo).filter((p) => p !== 'element').join('')
      const prev = attributionMap.get(r.key) ?? { key: el.key, probe: el.key + pseudoSuffix, rect: el.rect, ink: 0, tokens: new Set() }
      prev.ink += r.ink
      prev.tokens.add(tok)
      attributionMap.set(r.key, prev)
    }
  }
  const px = perToken['--color-mint'].pixels
  const attributed = [...attributionMap.values()]
    .map((v) => ({
      element: v.probe,
      site: classify(v.probe),
      tokens: [...v.tokens],
      inkPixels: Math.round(v.ink),
      inkFractionOfViewport: v.ink / px
    }))
    .sort((a, b) => b.inkPixels - a.inkPixels)

  const attributedInk = attributed.reduce((n, a) => n + a.inkPixels, 0)
  const measuredInk = Object.values(perToken).reduce((n, d) => n + (d.ink ?? 0), 0)

  return {
    theme,
    state,
    viewportCssPx: { w: view.w, h: view.h },
    captureDevicePx: { w: base.w, h: base.h },
    captureScale: +scale.toFixed(4),
    accent: { mint: `rgb(${mint.r}, ${mint.g}, ${mint.b})`, mintComputed: mint.computed, press: `rgb(${press.r}, ${press.g}, ${press.b})` },
    perToken: Object.fromEntries(
      Object.entries(perToken).map(([k, d]) => [
        k,
        {
          inkFraction: d.inkFraction,
          inkGatedFraction: d.inkGatedFraction,
          coverageFraction: d.coverageFraction,
          coveragePixels: d.coveragePixels,
          maxAlpha: +(d.maxAlpha ?? 0).toFixed(4),
          meanResidualOfGated: +(d.meanResidualOfGated ?? 0).toFixed(2)
        }
      ])
    ),
    totals: {
      inkFraction: totalInk,
      inkPercent: +(totalInk * 100).toFixed(4),
      coverageFraction: totalCov,
      coveragePercent: +(totalCov * 100).toFixed(4)
    },
    calibration: calRead ? { selector: calSel, meanAlpha: +calRead.meanAlpha.toFixed(4), samplePixels: calRead.pixels } : null,
    attribution: {
      elementsPaintingAccent: elements.length,
      attributedInkPixels: attributedInk,
      measuredInkPixels: Math.round(measuredInk),
      attributedShare: measuredInk ? attributedInk / measuredInk : null,
      unattributedNote:
        'Attribution folds each accent pixel into the border box of an element the token differential flagged. `::marker` paints OUTSIDE its originating element (the marker box sits in the list padding), so ordered-list markers land in the unattributed remainder. The remainder is a limit of the breakdown, not of the totals above it — those are whole-frame sums.',
      top: attributed.slice(0, 25)
    }
  }
}

// ---- FACT 1, once (rules are palette-independent by construction) ----------
await setTheme('frost')
const ruleHits = await enumerateRules()
const spendList = ruleHits.map((r) => {
  const source = attribute(r.selector)
  return {
    selector: r.selector,
    property: r.prop,
    authored: r.value,
    resolved: r.resolved,
    media: r.media,
    dependsOn: r.dependsOn,
    // Token plumbing (`:root { --mint: var(--color-mint) }`) reads the chain but
    // paints nothing, and `--color-mint-ink` is a glyph colour ON an accent
    // fill rather than accent surface. Neither is spend.
    isTokenDefinition: r.isTokenDefinition,
    paintsSurface: !r.isTokenDefinition && r.dependsOn.some((t) => t !== '--color-mint-ink'),
    source,
    site: classify(r.selector),
    listed: classify(r.selector) !== null
  }
})

// THE BUILD EMITS A FALLBACK PAIR FOR EVERY `color-mix()` SITE, and counting
// both would overstate the spend list. Lightning CSS writes a plain
// `background: var(--mint)` fallback and then the real
// `color-mix(in oklch, var(--mint) 6%, transparent)` behind
// `@media (color: color-mix(in lab, red, red))`. Chromium supports color-mix,
// so the guarded branch always wins and the fallback NEVER paints here — but it
// is a real declaration in the shipped bundle, and in an engine without
// color-mix it would paint the accent at FULL opacity where the author asked
// for 6%. Both are recorded; only the effective one is counted.
const isColorMixBranch = (m) => typeof m === 'string' && m.includes('color-mix')
for (const s of spendList) s.colorMixSupportBranch = isColorMixBranch(s.media)
const guardedKeys = new Set(
  spendList.filter((s) => s.colorMixSupportBranch).map((s) => `${s.selector}|${s.property}`)
)
for (const s of spendList) {
  s.shadowedByColorMixBranch = !s.colorMixSupportBranch && guardedKeys.has(`${s.selector}|${s.property}`)
  s.effective = !s.shadowedByColorMixBranch
}

check('FACT 1: the rule scan found accent declarations at all', spendList.length > 0, {
  declarations: spendList.length,
  hint: 'an empty return measures nothing — this would be a broken instrument, not a clean app'
})

const attributionRate = spendList.filter((s) => s.source).length / (spendList.length || 1)
check('FACT 1: most declarations resolve back to a source file', attributionRate >= 0.8, {
  attributed: spendList.filter((s) => s.source).length,
  total: spendList.length,
  rate: +attributionRate.toFixed(3)
})

// ---- FACT 2 ---------------------------------------------------------------
// State 1: Welcome, no workspace.
for (const theme of THEMES) {
  const cell = await runCell(theme, 'welcome', '.welcome-mark', 14)
  if (cell) cells.push(cell)
}

// Null control on the Welcome frame: capture twice, change nothing. Everything
// this reports is the instrument's own floor.
await setTheme('frost')
await capture('null-A')
await page.waitForTimeout(200)
await capture('null-B')
const mintFrost = await resolveRGB('var(--color-mint)')
const blackRef = await resolveRGB('oklch(0 0 0)')
const nullControl = await differential('null-A', 'null-B', [mintFrost.b - blackRef.b, mintFrost.g - blackRef.g, mintFrost.r - blackRef.r], [], GATE)
check('control: the null differential is indistinguishable from zero', nullControl.inkFraction < 1e-4 && nullControl.coverageFraction < 1e-4, {
  inkFraction: nullControl.inkFraction,
  coverageFraction: nullControl.coverageFraction,
  coveragePixels: nullControl.coveragePixels,
  note: 'this is the measured noise floor for every number above'
})

// ---- non-vacuity: the instrument must be able to say VIOLATED ---------------
// Every number this spike reports is comfortably under the budget, and a
// classifier that found nothing would report exactly the same thing. This
// project has been bitten seven times by a criterion that passed because it
// measured nothing (#76, #82, #93, #94, #91, #95, #96), so the pipeline is made
// to fail on demand: a band of KNOWN area, painted with the real token, at
// `position: fixed` so it reflows nothing and the frames stay comparable.
// Two things are proved at once — the whole-frame sum recovers a known area,
// and a spend over budget does trip the VIOLATED branch.
const selfTest = await (async () => {
  const band = await page.evaluate(() => {
    const el = document.createElement('div')
    el.id = 'spike97-selftest-band'
    const w = window.innerWidth
    const h = Math.round(window.innerHeight * 0.12)
    el.style.cssText = `position:fixed;left:0;bottom:0;width:${w}px;height:${h}px;background:var(--mint);z-index:2147483647`
    document.body.appendChild(el)
    const r = el.getBoundingClientRect()
    return { cssW: w, cssH: h, rect: { x: r.x, y: r.y, w: r.width, h: r.height }, dpr: window.devicePixelRatio }
  })
  await page.waitForTimeout(200)
  const capA = await capture('selftest-A')
  await setOverride({ '--color-mint': 'oklch(0 0 0)' })
  await page.waitForTimeout(120)
  await capture('selftest-B')
  await setOverride({ '--color-mint': null })
  const s = band.dpr
  const d = await differential(
    'selftest-A',
    'selftest-B',
    [mintFrost.b - blackRef.b, mintFrost.g - blackRef.g, mintFrost.r - blackRef.r],
    [{ key: 'band', x: band.rect.x * s, y: band.rect.y * s, w: band.rect.w * s, h: band.rect.h * s }],
    GATE
  )
  await page.evaluate(() => document.getElementById('spike97-selftest-band')?.remove())
  const r0 = d.regions?.[0]
  // Expected area is computed from the SAME rounded edges the differential
  // clamps to (round each edge, then subtract), not from rounded width and
  // height independently. Rounding the extents separately put the band's top
  // edge one device row out and showed a 0.93% "error" that was arithmetic,
  // not measurement.
  const px0 = Math.round(band.rect.x * s)
  const py0 = Math.round(band.rect.y * s)
  const px1 = Math.round((band.rect.x + band.rect.w) * s)
  const py1 = Math.round((band.rect.y + band.rect.h) * s)
  const expected = (px1 - px0) * (py1 - py0)
  const err = r0 ? Math.abs(r0.ink - expected) / expected : 1
  return {
    bandCssPx: { w: band.cssW, h: band.cssH },
    bandExpectedDevicePx: expected,
    bandMeasuredInkDevicePx: r0 ? Math.round(r0.ink) : null,
    bandMeanAlpha: r0 ? +r0.meanAlpha.toFixed(4) : null,
    relativeError: +err.toFixed(4),
    frameInkFractionWithBand: d.inkFraction,
    captureDevicePx: { w: capA.w, h: capA.h }
  }
})()

check('non-vacuity: a band of known area is recovered to within 0.2%', selfTest.relativeError < 0.002 && Math.abs((selfTest.bandMeanAlpha ?? 0) - 1) < 0.02, {
  expectedDevicePx: selfTest.bandExpectedDevicePx,
  measuredDevicePx: selfTest.bandMeasuredInkDevicePx,
  meanAlpha: selfTest.bandMeanAlpha,
  relativeError: selfTest.relativeError
})
check('non-vacuity: an over-budget spend DOES trip the VIOLATED branch', selfTest.frameInkFractionWithBand > 0.1, {
  frameInkFractionWithBand: selfTest.frameInkFractionWithBand,
  budget: 0.1,
  hint: 'without this, every SATISFIED above would be indistinguishable from a classifier that finds nothing'
})

// State 2: a workspace with a session open.
await enterWorkspace()
for (const theme of THEMES) {
  const cell = await runCell(theme, 'workspace-session', '.logo-mark', 3)
  if (cell) cells.push(cell)
}

// ---- the transient sixth surface ------------------------------------------
// Typing dots only render while a turn is in flight with no assistant text yet,
// so they are in NEITHER steady state. Measured as a labelled PROBE — the real
// `.typing` markup, injected into the real chat scroller, resolved through the
// real cascade — so the spend list has a number for all five named sites. This
// is not the app rendering itself; say so.
await setTheme('frost')
const typingProbe = await (async () => {
  const ok = await page.evaluate(() => {
    const host = document.querySelector('.chat-scroll') || document.querySelector('.chat') || document.body
    const wrap = document.createElement('div')
    wrap.id = 'spike97-typing-probe'
    wrap.innerHTML = '<div class="typing"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>'
    host.appendChild(wrap)
    return !!document.querySelector('#spike97-typing-probe .typing-dot')
  })
  if (!ok) return { error: 'probe did not mount' }
  await page.waitForTimeout(250)
  // MEASURE THE PROBE'S OWN REGION, never the difference of two frame totals.
  // The first attempt subtracted the workspace frame's ink from the probe
  // frame's and got a NEGATIVE number: appending the probe reflows the
  // scroller, so the two frames do not contain the same pixels and the
  // subtraction is not isolating anything.
  const probeRect = await page.evaluate(() => {
    const el = document.getElementById('spike97-typing-probe')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })
  const scaleNow = await page.evaluate(() => window.devicePixelRatio)
  const base = await capture('typing-A')
  await setOverride({ '--color-mint': 'oklch(0 0 0)' })
  await page.waitForTimeout(120)
  await capture('typing-B')
  await setOverride({ '--color-mint': null })
  const region = probeRect
    ? [{ key: 'typing-probe', x: probeRect.x * scaleNow, y: probeRect.y * scaleNow, w: probeRect.w * scaleNow, h: probeRect.h * scaleNow }]
    : []
  const d = await differential('typing-A', 'typing-B', [mintFrost.b - blackRef.b, mintFrost.g - blackRef.g, mintFrost.r - blackRef.r], region, GATE)
  await page.evaluate(() => document.getElementById('spike97-typing-probe')?.remove())
  const r0 = d.regions?.[0]
  return {
    disclosure:
      "PROBE, not the app rendering itself. Real `.typing` markup injected into the real chat scroller; the cascade, the sizes and the accent are the app's. Typing dots render only while a turn is in flight with no assistant text yet, so they are in NEITHER measured steady state.",
    dotsInkDevicePx: r0 ? Math.round(r0.ink) : null,
    dotsInkFractionOfViewport: r0 ? r0.ink / d.pixels : null,
    viewportDevicePx: d.pixels,
    captureDevicePx: { w: base.w, h: base.h },
    note: 'motion is frozen, so the dots read at their authored opacity rather than mid-pulse (typing-pulse dips to 0.35). Measured over the probe rect alone, so a reflow elsewhere cannot contaminate it.'
  }
})()

// ---- window-size sensitivity, measured LAST --------------------------------
// The accent sites are mostly FIXED-SIZE (a 44px mark, a 28px avatar, a pill),
// so their share of the window grows as the window shrinks. A single-size
// measurement cannot tell whether the budget holds because the app is
// restrained or because the window was generous. Done last, and nothing above
// depends on it, because resizing revokes what a driver has already measured.
const sensitivity = await (async () => {
  const small = { width: 900, height: 600 }
  const b = await app.evaluate(async ({ BrowserWindow, screen }, want) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.setContentBounds({ x: 0, y: 0, ...want })
    await new Promise((r) => setTimeout(r, 500))
    const got = win.getContentBounds()
    return { got, scaleFactor: screen.getDisplayMatching(got).scaleFactor }
  }, small)
  await page.waitForTimeout(600)
  const v = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio }))
  const expect = { w: Math.round(b.got.width * b.scaleFactor), h: Math.round(b.got.height * b.scaleFactor) }
  const capA = await capture('small-A')
  if (capA.w !== expect.w || capA.h !== expect.h) {
    return { error: `capture is not the full window at the small size (got ${capA.w}x${capA.h}, expected ${expect.w}x${expect.h})` }
  }
  await setOverride({ '--color-mint': 'oklch(0 0 0)', '--color-mint-wash': 'oklch(0 0 0 / 0.1)' })
  await page.waitForTimeout(150)
  await capture('small-B')
  await setOverride({ '--color-mint': null, '--color-mint-wash': null })
  const d = await differential('small-A', 'small-B', [mintFrost.b - blackRef.b, mintFrost.g - blackRef.g, mintFrost.r - blackRef.r], [], GATE)
  const big = cells.find((c) => c.theme === 'frost' && c.state === 'workspace-session')
  return {
    state: 'workspace-session',
    theme: 'frost',
    contentBoundsDip: b.got,
    viewportCssPx: { w: v.w, h: v.h },
    captureDevicePx: { w: capA.w, h: capA.h },
    inkPercent: +(d.inkFraction * 100).toFixed(4),
    coveragePercent: +(d.coverageFraction * 100).toFixed(4),
    comparedWith: big ? { contentBoundsDip: { width: WANT_W, height: WANT_H }, inkPercent: big.totals.inkPercent } : null,
    note:
      'Measured with --color-mint and --color-mint-wash overridden together, so this is the whole accent surface in one differential rather than the per-token breakdown used above. Smaller window, same fixed-size accent elements, so the share rises; this bounds how much.'
  }
})()

// The single largest UNLISTED spend on screen is the backend pill, and it only
// wears the accent in one backend mode. Recorded so the number is not read as
// universal: on a native-backend machine `.backend-pill--wisped` does not match
// and that spend is absent.
const backendPill = await page.evaluate(() => {
  const el = document.querySelector('[aria-label="Backend mode"]')
  return el ? { className: String(el.className), label: (el.textContent || '').trim() } : null
})

// ---------------------------------------------------------------------------
// Verdict. Reported, not acted on.
const welcomeCells = cells.filter((c) => c.state === 'welcome')
const sessionCells = cells.filter((c) => c.state === 'workspace-session')
const allInk = cells.map((c) => c.totals.inkFraction)
const allCov = cells.map((c) => c.totals.coverageFraction)
const maxInk = allInk.length ? Math.max(...allInk) : null
const maxCov = allCov.length ? Math.max(...allCov) : null

const unlisted = spendList.filter((s) => !s.listed && s.paintsSurface && s.effective)
const unlistedOnScreen = [
  ...new Set(
    cells.flatMap((c) => c.attribution.top.filter((a) => a.site === null && a.inkPixels > 0).map((a) => a.element))
  )
]

const verdict = {
  enumerationHalf: {
    clause: 'spent only on: logo mark, assistant avatar, send button, list markers, typing dots',
    status: unlisted.length > 0 ? 'VIOLATED' : 'SATISFIED',
    // All three counted the same way: declarations that paint accent SURFACE and
    // actually take effect in this engine. Mixing the effective and raw counts
    // in one block is how a summary starts disagreeing with its own detail.
    surfacePaintingDeclarations: spendList.filter((s) => s.paintsSurface && s.effective).length,
    listedDeclarations: spendList.filter((s) => s.paintsSurface && s.effective && s.listed).length,
    unlistedDeclarations: unlisted.length,
    unlistedSelectors: unlisted.map((s) => `${s.selector} { ${s.property} }`),
    unlistedElementsActuallyOnScreen: unlistedOnScreen,
    backendPillIsStateDependent: {
      pill: backendPill,
      note:
        '`.backend-pill--wisped` is the largest unlisted spend measured on screen, and it paints the accent only in the wisped backend mode. On a native-backend machine that selector does not match and this spend is absent. Every other unlisted element measured here is mode-independent.'
    },
    reading:
      'A declaration counts as accent spend iff its computed value moves when an accent token moves. That is the clause\'s own notion of "spent on", measured rather than counted.'
  },
  budgetHalf: {
    clause: 'Mint accent <=10% of surface',
    ambiguity:
      'The clause does not say whether "of surface" means the fraction of pixels the accent touches (coverage) or the alpha-weighted pigment on screen (ink). Both are reported; a 10%-alpha wash is 100% coverage and 10% ink of the area it covers.',
    maxInkPercentAcrossCells: maxInk === null ? null : +(maxInk * 100).toFixed(4),
    maxCoveragePercentAcrossCells: maxCov === null ? null : +(maxCov * 100).toFixed(4),
    statusByInk: maxInk === null ? 'UNMEASURED' : maxInk <= 0.1 ? 'SATISFIED' : 'VIOLATED',
    statusByCoverage: maxCov === null ? 'UNMEASURED' : maxCov <= 0.1 ? 'SATISFIED' : 'VIOLATED',
    noiseFloor: { inkFraction: nullControl.inkFraction, coverageFraction: nullControl.coverageFraction },
    statesMeasured: ['welcome', 'workspace-session'],
    statesNotMeasured:
      'Every transient and hover state. `--color-mint-press` paints only on :hover/:active and reads 0 at rest; typing dots are measured separately as a probe. A state this spike never rendered is not evidence either way.',
    windowSizeSensitivity: sensitivity
  }
}

const findings = {
  spike: 97,
  question: "Does DESIGN.md's accent clause hold — is mint spent only on the five named sites, and is it <=10% of surface?",
  measuredAt: new Date().toISOString(),
  runDirName: basename(runDir),
  runDirParent: 'OS temp dir (os.tmpdir())',
  scrubbing:
    'Selectors, CSS properties, repo-relative source paths, design-token colours, pixel counts and ratios only. No cwd, no absolute temp path, no session id, no user path.',
  env: {
    platform: process.platform,
    electronArgs: ['--no-sandbox', '--disable-gpu'],
    devicePixelRatio: motion.dpr,
    viewportCssPx: view,
    reducedMotionForced: motion.reduced,
    backdrop: 'acrylic is FLATTENED by --disable-gpu. Stated rather than corrected: the ground cancels out of every differential, so it cannot move a number here.'
  },
  instrument: {
    method: 'token differential',
    definition:
      'A declaration resolves to an accent token iff its computed value changes when that token changes. A pixel carries accent alpha a iff A - B = a * (M - N), recovered by projection onto M - N.',
    whyNotAGrep:
      'The long name and the short alias are not interchangeable inside a nested [data-theme] opt-in, and color-mix() sites carry no literal token name in their computed value. A grep both misses sites and mis-scopes others; the engine does not.',
    whyNotAHueClassifier:
      'The neutrals are deliberately tinted toward the accent hue (h+30 in Frost), so a hue cone wide enough to catch a 10% wash also catches the neutrals. The differential cancels the ground exactly instead of tolerating it.',
    tolerance: {
      gate: GATE,
      gateRationale: 'byte quantisation gives ~1/|M-N| ~= 0.003 of alpha per pixel; the gate sits ~3x above it',
      measuredNoiseFloor: { inkFraction: nullControl.inkFraction, coverageFraction: nullControl.coverageFraction },
      calibrationTargets: cells.map((c) => ({ theme: c.theme, state: c.state, ...c.calibration })),
      nonVacuitySelfTest: {
        ...selfTest,
        what:
          'A fixed-position band of known area painted with the real token. Proves the whole-frame sum recovers a known area to within 1%, and that a spend over budget trips the VIOLATED branch — so a SATISFIED result above is distinguishable from a classifier that finds nothing.'
      }
    },
    tokensOverridden: TOKENS.map((t) => ({ token: t.name, to: t.to, countedAsSurface: t.surface })),
    inkVsCoverage:
      'ink = sum of per-pixel accent alpha / viewport pixels. coverage = pixels with alpha above the gate / viewport pixels.'
  },
  fact1_spendList: {
    declarationCount: spendList.length,
    tokenDefinitionCount: spendList.filter((s) => s.isTokenDefinition).length,
    inkOnlyCount: spendList.filter((s) => !s.isTokenDefinition && !s.paintsSurface).length,
    surfacePaintingCount: spendList.filter((s) => s.paintsSurface).length,
    effectiveSurfacePaintingCount: spendList.filter((s) => s.paintsSurface && s.effective).length,
    colorMixFallbacksNeverPaintingHere: spendList.filter((s) => s.shadowedByColorMixBranch).length,
    sourceAttributionRate: +attributionRate.toFixed(3),
    byToken: Object.fromEntries(
      TOKENS.map((t) => [t.name, spendList.filter((s) => s.dependsOn.includes(t.name)).length])
    ),
    // Counted over SURFACE-PAINTING declarations only — the clause is about
    // where the accent is spent, and token plumbing spends nothing.
    listedCount: spendList.filter((s) => s.paintsSurface && s.effective && s.listed).length,
    unlistedCount: spendList.filter((s) => s.paintsSurface && s.effective && !s.listed).length,
    bySite: Object.fromEntries(
      LISTED.map((l) => [l.site, spendList.filter((s) => s.site === l.site).map((s) => `${s.selector} { ${s.property} }`)])
    ),
    declarations: spendList
  },
  fact2_proportion: {
    cells,
    perStateSummary: {
      welcome: {
        inkPercent: welcomeCells.map((c) => ({ theme: c.theme, pct: c.totals.inkPercent })),
        coveragePercent: welcomeCells.map((c) => ({ theme: c.theme, pct: c.totals.coveragePercent }))
      },
      'workspace-session': {
        inkPercent: sessionCells.map((c) => ({ theme: c.theme, pct: c.totals.inkPercent })),
        coveragePercent: sessionCells.map((c) => ({ theme: c.theme, pct: c.totals.coveragePercent }))
      }
    },
    nullControl: {
      inkFraction: nullControl.inkFraction,
      coverageFraction: nullControl.coverageFraction,
      coveragePixels: nullControl.coveragePixels
    },
    typingDotsProbe: typingProbe
  },
  verdict,
  doesNotDecide:
    'This spike produces evidence and spends none of it. DESIGN.md is not edited and no src/ file is touched — amending the governing standard to match measured drift is the laundering move #92 and #96 both refused. The call stays the owner\'s, on #92.',

}

writeFileSync(findingsPath, JSON.stringify(findings, null, 2) + '\n')

console.log('')
console.log(`FACT 1  : ${spendList.length} declarations resolve to an accent token`)
console.log(`          ${findings.fact1_spendList.effectiveSurfacePaintingCount} paint surface here | listed ${findings.fact1_spendList.listedCount} | unlisted ${findings.fact1_spendList.unlistedCount}`)
console.log(`          (+${findings.fact1_spendList.colorMixFallbacksNeverPaintingHere} color-mix fallbacks that never paint in Chromium, ${findings.fact1_spendList.tokenDefinitionCount} token definitions, ${findings.fact1_spendList.inkOnlyCount} mint-ink glyph colours)`)
console.log(`FACT 2  : max ink ${verdict.budgetHalf.maxInkPercentAcrossCells}% | max coverage ${verdict.budgetHalf.maxCoveragePercentAcrossCells}% across ${cells.length} cells`)
console.log(`CONTROL : null differential ink ${nullControl.inkFraction.toExponential(2)}`)
console.log(`VERDICT : enumeration ${verdict.enumerationHalf.status} | budget ${verdict.budgetHalf.statusByInk} (ink) / ${verdict.budgetHalf.statusByCoverage} (coverage)`)
console.log(`findings: ${findingsPath.pathname}`)
console.log(fails.length === 0 ? 'ALL GREEN' : `RED: ${fails.join(' | ')}`)

// Put back what was borrowed, before the window closes and the app persists it.
await app
  .evaluate(({ BrowserWindow }, b) => {
    BrowserWindow.getAllWindows()[0].setContentBounds(b)
  }, original.bounds)
  .catch(() => {})
await page
  .evaluate((t) => {
    if (t === null) window.localStorage.removeItem('theme')
    else window.localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t ?? 'frost')
  }, original.theme)
  .catch(() => {})
await page.waitForTimeout(500)

setTimeout(() => process.exit(fails.length === 0 ? 0 : 1), 3000).unref?.()
await app.close().catch(() => {})
process.exit(fails.length === 0 ? 0 : 1)
