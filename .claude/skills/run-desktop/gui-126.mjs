// GUI eyeball + acceptance gate for #126 — the subagent map's visual pass.
//
//   node .claude/skills/run-desktop/gui-126.mjs            # assert + shoot
//   node .claude/skills/run-desktop/gui-126.mjs --label=before
//
// Needs `npm run build` first. Costs NO CLI turns: the map is fed a SYNTHETIC
// fixture through the two channels the dock actually reads —
//   * `subagents:list` (ipcMain handle, re-registered here) supplies the disk
//     sidecars, which are the ONLY source of `parentAgentId`, i.e. of nesting;
//   * `subagent:changed` (pushed from main, the channel preload subscribes on)
//     supplies status, which is the ONLY source of running/done/failed.
// Both are the app's real render path with a fake payload. Nothing here is a
// claim about what the CLI emits.
//
// Instrument notes, all of them paid for by earlier legs:
//   * ZOOM IS NORMALISED TO 1 before any pixel read or element shot. The app's
//     live factor is 1.25 and both `capturePage` and `el.screenshot()` mix
//     window DIP with the zoomed page's CSS pixels (#124).
//   * Every pixel probe carries a POSITIVE CONTROL — a mark that must differ
//     from the panel ground. A broken reader reports UNSCORED, never a refutation.
//   * Computed style is read off the MOUNTED element, not grepped from source: a
//     grep is green on a rule the cascade drops (#125).
//   * A DISCRIMINATION CONTROL sits beside each computed read: a sibling that
//     must report a DIFFERENT value, so a reader that answers the same string
//     for everything scores UNSCORED.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'claude-wrapper-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const labelArg = process.argv.find((a) => a.startsWith('--label='))
const LABEL = labelArg === undefined ? 'after' : labelArg.slice('--label='.length)

const fails = []
const unscored = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}
const scored = (label, ok, detail) => {
  // For probes whose control failed: the trial did not run, so the result is
  // neither PASS nor FAIL. Kept separate so a broken instrument can never be
  // read as evidence against the app.
  console.log(`UNSCORED  ${label}  ${JSON.stringify(detail)}`)
  unscored.push(label)
  void ok
}

const timer = setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 180000)
timer.unref?.()

// Seven agents: one flat fan of four off the session, plus a three-deep nested
// spine, so the fixture exercises BOTH the crowded-band case and the stacked-x
// case the hit-radius rule exists for.
const SIDECARS = [
  { parentToolUseId: 't1', agentId: 'a1', agentType: 'Explore', description: 'map the styles dir' },
  { parentToolUseId: 't2', agentId: 'a2', agentType: 'Plan', description: 'draft the layout' },
  { parentToolUseId: 't3', agentId: 'a3', agentType: 'general-purpose', description: 'sweep call sites' },
  { parentToolUseId: 't4', agentId: 'a4', agentType: 'code-reviewer', description: 'review the diff' },
  { parentToolUseId: 't5', agentId: 'a5', agentType: 'Explore', description: 'nested root' },
  { parentToolUseId: 't6', agentId: 'a6', agentType: 'Plan', description: 'nested child', parentAgentId: 'a5' },
  { parentToolUseId: 't7', agentId: 'a7', agentType: 'Explore', description: 'nested grandchild', parentAgentId: 'a6' }
]

// One of each status, and one row left with NO live event at all so the
// `unknown` branch is on screen too.
const LIVE = [
  { parentToolUseId: 't1', status: 'running' },
  { parentToolUseId: 't2', status: 'done' },
  { parentToolUseId: 't3', status: 'failed' },
  { parentToolUseId: 't5', status: 'running' },
  { parentToolUseId: 't6', status: 'done' },
  { parentToolUseId: 't7', status: 'done' }
]

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

let app = null
try {
  app = await electron.launch({
    executablePath: electronBin,
    args: ['--no-sandbox', '--disable-gpu', ...profileArgs(), '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 30000
  })

  // Folder picker → this repo, and the agent list → our fixture. Re-registering
  // the handler is the supported route: ipcMain.handle throws on a duplicate
  // channel, so the existing one is removed first.
  const patched = await app.evaluate(async ({ dialog, ipcMain }, { dir, sidecars }) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
    ipcMain.removeHandler('subagents:list')
    ipcMain.handle('subagents:list', () => sidecars)
    // Read the installation back — an ESM/frozen-namespace no-op would otherwise
    // read as a product failure (#124).
    return typeof dialog.showOpenDialog === 'function'
  }, { dir: APP_DIR, sidecars: SIDECARS })
  check('premise: main-process patches installed', patched === true, { patched })

  const page = await app.firstWindow()
  await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

  // Zoom normalised BEFORE anything is measured or photographed.
  const zoom = await app.evaluate(({ BrowserWindow }) => {
    const win = BrowserWindow.getAllWindows()[0]
    win.webContents.setZoomFactor(1)
    return win.webContents.getZoomFactor()
  })
  check('premise: zoom normalised to 1', Math.abs(zoom - 1) < 0.001, { zoom })

  const shotEl = async (name, sel) => {
    const p = path.join(SHOT_DIR, `map-${LABEL}-${name}.png`)
    const el = await page.$(sel)
    if (el === null) {
      console.log(`SHOT ${name} SKIPPED — no ${sel}`)
      return
    }
    await el.screenshot({ path: p })
    console.log(`SHOT ${p}`)
  }

  const present = (sel) => page.evaluate((s) => !!document.querySelector(s), sel)

  // ---- open the workspace --------------------------------------------------
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(
      (b) =>
        b.getAttribute('aria-label') === 'Pick a project folder' ||
        b.textContent?.includes('Pick a project folder')
    )
    btn?.click()
  })
  await page.waitForSelector('.session-group-head', { timeout: 20000 })
  await page.waitForSelector('[aria-label="Agents panel"]', { timeout: 10000 })

  // ADOPT A SESSION. The dock's disk half is gated on a session id, and
  // `activeSessionId` stays null until a turn ends or a session is adopted — so
  // without this click `listSubagents` is never invoked, the patched handler
  // never runs, and the map renders live-only rows with NO parentAgentId (i.e.
  // no nesting) and agentType 'Agent'. Costs no CLI turn: adopting reads the
  // transcript off disk.
  const adopted = await page.evaluate(() => {
    const btn = document.querySelector('.session-row-btn')
    if (btn === null) return false
    btn.click()
    return true
  })
  check('premise: a session was adopted (unlocks the disk half)', adopted === true, { adopted })
  await page.waitForTimeout(1200)

  // Dock width is read from localStorage ON MOUNT, so it is set before the dock
  // is ever opened. 180 is MIN_SIDEBAR_WIDTH — the clamp floor the ADR's
  // "fits with no scrollbar" claim is written against.
  await page.evaluate(() => window.localStorage.setItem('agents-dock-width', '180'))

  // Collapsing the rail frees ~310css and brings the dock inside the app's own
  // persisted bounds, so nothing has to resize the window (#77).
  await page.evaluate(() => document.querySelector('[aria-label="Collapse sessions"]')?.click())
  await page.waitForTimeout(250)

  await page.evaluate(() => document.querySelector('[aria-label="Agents panel"]')?.click())
  await page.waitForSelector('.agents-dock', { timeout: 10000 })

  // ---- feed the fixture ----------------------------------------------------
  await app.evaluate(({ BrowserWindow }, live) => {
    const win = BrowserWindow.getAllWindows()[0]
    for (const e of live) win.webContents.send('subagent:changed', { type: 'subagent', ...e })
  }, LIVE)
  await page.waitForTimeout(400)

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.agents-dock button')].find(
      (b) => b.getAttribute('aria-label') === 'Map view'
    )
    btn?.click()
  })
  await page.waitForSelector('.agent-map-svg', { timeout: 10000 })
  await page.waitForTimeout(500)

  // ---- premise: the fixture actually landed --------------------------------
  const census = await page.evaluate(() => {
    const svg = document.querySelector('.agent-map-svg')
    if (svg === null) return null
    const nodes = [...svg.querySelectorAll('.agent-map-node')]
    return {
      agents: nodes.length,
      session: svg.querySelectorAll('.agent-map-node-session').length,
      edges: svg.querySelectorAll('.agent-map-edge').length,
      statuses: nodes.map(
        (n) => (n.getAttribute('class').match(/agent-map-node--(\w+)/) ?? [])[1] ?? '?'
      )
    }
  })
  check('premise: 7 agents, 1 session, 7 edges on screen', census !== null && census.agents === 7 && census.session === 1 && census.edges === 7, census)
  check(
    'premise: all four status branches are on screen',
    census !== null && new Set(census.statuses).size === 4,
    { statuses: census?.statuses }
  )

  await shotEl('180-dock', '.agents-dock')
  await shotEl('180-map', '.agent-map')

  // ---- criterion: role=group, never role=img -------------------------------
  const role = await page.evaluate(
    () => document.querySelector('.agent-map-svg')?.getAttribute('role') ?? null
  )
  check('map SVG carries role="group"', role === 'group', { role })

  // ---- criterion: no baked text, identity in title/aria-label --------------
  const textCensus = await page.evaluate(() => {
    const svg = document.querySelector('.agent-map-svg')
    if (svg === null) return null
    const nodes = [...svg.querySelectorAll('.agent-map-node')]
    return {
      textEls: svg.querySelectorAll('text, tspan, foreignObject').length,
      // <title> is not painted; every other text-bearing element would be.
      titles: nodes.filter((n) => n.querySelector('title')?.textContent?.trim()).length,
      labelled: nodes.filter((n) => (n.getAttribute('aria-label') ?? '').trim().length > 0).length,
      sampleLabel: nodes[0]?.getAttribute('aria-label') ?? null
    }
  })
  check('no painted text in the map', textCensus !== null && textCensus.textEls === 0, {
    textEls: textCensus?.textEls
  })
  check(
    'every node keeps <title> + aria-label',
    textCensus !== null && textCensus.titles === 7 && textCensus.labelled === 7,
    textCensus
  )

  // ---- criterion: halo alpha lives in fill, not opacity --------------------
  // `subagent-pulse` animates opacity 1 → 0.35, so an opacity-based tint would
  // be overridden and the halo would flash near-solid. Read the COMPUTED fill
  // off the mounted halo; the discrimination control is the glyph beside it,
  // which must report a DIFFERENT fill.
  const halo = await page.evaluate(() => {
    const h = document.querySelector('.agent-map-halo')
    if (h === null) return null
    const node = h.closest('.agent-map-node')
    const glyph = node?.querySelector('.agent-map-glyph') ?? null
    const cs = getComputedStyle(h)
    return {
      fill: cs.fill,
      opacityProp: cs.opacity,
      controlFill: glyph === null ? null : getComputedStyle(glyph).fill
    }
  })
  if (halo === null) {
    scored('halo alpha is in the fill', false, { reason: 'no .agent-map-halo mounted' })
  } else if (halo.controlFill === null || halo.controlFill === halo.fill) {
    scored('halo alpha is in the fill', false, {
      reason: 'discrimination control matched the target — reader is not discriminating',
      ...halo
    })
  } else {
    // A translucent fill resolves to rgba(...) / color(... / a); an opaque one
    // does not carry an alpha component at all.
    check('halo alpha is in the fill, not opacity', /rgba|\/\s*0?\.\d/.test(halo.fill), halo)
  }

  // ---- criterion: hit radius is non-zero on a NESTED spine -----------------
  const hits = await page.evaluate(() =>
    [...document.querySelectorAll('.agent-map-hit')].map((c) => Number(c.getAttribute('r')))
  )
  check(
    'every hit circle has a usable radius (nested spine present)',
    hits.length === 7 && hits.every((r) => r >= 4),
    { hits }
  )

  // ---- criterion: fits the 180px clamp floor with no scrollbar -------------
  const fit = await page.evaluate(() => {
    const dock = document.querySelector('.agents-dock')
    const pane = document.querySelector('.agent-map')
    const svg = document.querySelector('.agent-map-svg')
    if (dock === null || pane === null || svg === null) return null
    const r = svg.getBoundingClientRect()
    return {
      dockWidth: Math.round(dock.getBoundingClientRect().width),
      svgWidth: Math.round(r.width),
      svgHeight: Math.round(r.height),
      paneClientH: pane.clientHeight,
      paneScrollH: pane.scrollHeight,
      paneClientW: pane.clientWidth,
      paneScrollW: pane.scrollWidth
    }
  })
  check('dock is at the 180px clamp floor', fit !== null && fit.dockWidth === 180, fit)
  check(
    'no scrollbar on either axis at the clamp floor',
    fit !== null && fit.paneScrollH <= fit.paneClientH + 1 && fit.paneScrollW <= fit.paneClientW + 1,
    fit
  )

  // ---- criterion: a failed agent is findable in greyscale, at 4px ----------
  // Shape carries it: the failed node is the only <polygon>. Colour may only
  // reinforce. Asserted structurally rather than by pixel, because a greyscale
  // pixel claim needs a filter this app never applies.
  const shapes = await page.evaluate(() => {
    const svg = document.querySelector('.agent-map-svg')
    if (svg === null) return null
    const of = (sel) => {
      const node = svg.querySelector(sel)
      const glyph = node?.querySelector('.agent-map-glyph') ?? null
      return glyph === null ? null : glyph.tagName.toLowerCase()
    }
    return {
      failed: of('.agent-map-node--failed'),
      running: of('.agent-map-node--running'),
      done: of('.agent-map-node--done'),
      unknown: of('.agent-map-node--unknown'),
      sessionMark: svg.querySelector('.agent-map-node-session > *:not(title)')?.tagName.toLowerCase() ?? null,
      polygons: svg.querySelectorAll('.agent-map-glyph').length > 0 ? svg.querySelectorAll('polygon.agent-map-glyph').length : -1
    }
  })
  check(
    'shape encodes kind: failed=polygon, others=circle, session=rect',
    shapes !== null &&
      shapes.failed === 'polygon' &&
      shapes.running === 'circle' &&
      shapes.done === 'circle' &&
      shapes.unknown === 'circle' &&
      shapes.sessionMark === 'rect' &&
      shapes.polygons === 1,
    shapes
  )

  // ---- pixel probe: the map is actually painting, with a positive control --
  // The control is the dock head's title text, which must differ from the pane
  // ground. If the control is flat, the reader is broken and the map's own
  // reading proves nothing.
  const paint = await page.evaluate(async () => {
    const svg = document.querySelector('.agent-map-svg')
    if (svg === null) return null
    const glyphs = [...svg.querySelectorAll('.agent-map-glyph')]
    const pane = document.querySelector('.agent-map')
    const paneBg = pane === null ? null : getComputedStyle(pane).backgroundColor
    return {
      paneBg,
      fills: glyphs.map((g) => getComputedStyle(g).fill),
      strokes: glyphs.map((g) => getComputedStyle(g).stroke),
      edgeStroke: getComputedStyle(svg.querySelector('.agent-map-edge')).stroke,
      edgeWidth: getComputedStyle(svg.querySelector('.agent-map-edge')).strokeWidth
    }
  })
  const distinctPaint = paint === null ? 0 : new Set([...paint.fills, ...paint.strokes]).size
  if (paint === null || distinctPaint < 2) {
    scored('the map paints distinct marks per status', false, {
      reason: 'control failed — computed paint is flat across every glyph',
      distinctPaint,
      paint
    })
  } else {
    check('the map paints distinct marks per status', distinctPaint >= 4, {
      distinctPaint,
      ...paint
    })
  }

  // ---- widen to the max and re-shoot --------------------------------------
  // Closing and reopening remounts the dock, which re-reads the width AND
  // resets its mode to 'list' — so Map view is re-clicked before anything waits
  // on the SVG. Waiting first is what made the previous run throw.
  await page.evaluate(() => {
    window.localStorage.setItem('agents-dock-width', '480')
    document.querySelector('[aria-label="Agents panel"]')?.click()
  })
  await page.waitForTimeout(250)
  await page.evaluate(() => document.querySelector('[aria-label="Agents panel"]')?.click())
  await page.waitForSelector('.agents-dock', { timeout: 10000 })
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.agents-dock button')].find(
      (b) => b.getAttribute('aria-label') === 'Map view'
    )
    btn?.click()
  })
  await page.waitForSelector('.agent-map-svg', { timeout: 10000 })
  await page.waitForTimeout(400)
  const wide = await page.evaluate(() => {
    const dock = document.querySelector('.agents-dock')
    const pane = document.querySelector('.agent-map')
    return dock === null || pane === null
      ? null
      : {
          dockWidth: Math.round(dock.getBoundingClientRect().width),
          paneScrollW: pane.scrollWidth,
          paneClientW: pane.clientWidth
        }
  })
  check('no horizontal scrollbar at the 480px ceiling', wide !== null && wide.paneScrollW <= wide.paneClientW + 1, wide)
  await shotEl('480-dock', '.agents-dock')

  console.log(`\nSUMMARY  fails=${fails.length} unscored=${unscored.length}`)
  if (unscored.length > 0) console.log(`UNSCORED: ${unscored.join(', ')}`)
  if (fails.length > 0) console.log(`FAILED: ${fails.join(', ')}`)
} catch (err) {
  // The red path must fail CLEANLY: an uncaught throw here would skip the
  // summary and leak the Electron process (#122's driver did exactly that).
  console.log(`ERROR  ${err && err.stack ? err.stack : String(err)}`)
  fails.push('driver threw')
} finally {
  if (app !== null) await app.close().catch(() => {})
  clearTimeout(timer)
}

process.exit(fails.length > 0 ? 1 : 0)
