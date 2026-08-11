// GUI pin for gauntlet wave 7 — three builds that wave landed, each measured
// as a RENDERED box or computed style in a real Chromium.
//
//   node .claude/skills/run-desktop/gui-gauntlet-wave7.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// ── the three changes ────────────────────────────────────────────────────
//   CommandsDock      .command-list gap 2 -> 6 (dock-local only). Pinned by C1.
//   AppearanceDock    every .appearance-choice gains resting inset --tint-2
//                     shell. Pinned by B1..B2.
//   WelcomeMinWindow  .pick-folder-btn margin-top 32 -> 24. Supersedes wave6
//                     W1/W2. Pinned by W1 (with an UPPER bound so 32 reds).
//
// AgentsDock and IconHousing had NO builder this wave (owner call 19 default).
//
// ── supersessions ────────────────────────────────────────────────────────
// wave6 W1 (beat >= 16) and W2 (net-zero height) are retired in place inside
// gui-gauntlet-wave6.mjs. This file is the successor, not a silent softener.
import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import { profileArgs } from './driver-profile.mjs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const PICK_DIR = APP_DIR

const fails = []
const check = (label, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${JSON.stringify(detail)}`)
  if (!ok) fails.push(label)
}
const px = (n) => (typeof n === 'number' ? Math.round(n * 1000) / 1000 : n)
const near = (a, b, tol = 0.5) =>
  typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol

setTimeout(() => {
  console.log('TIMEOUT')
  process.exit(1)
}, 240000).unref?.()

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : process.platform === 'darwin'
      ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
      : path.join(APP_DIR, 'node_modules/electron/dist/electron')

const app = await electron.launch({
  executablePath: electronBin,
  args: ['--no-sandbox', '--disable-gpu', ...profileArgs(), '.'],
  cwd: APP_DIR,
  env: process.env,
  timeout: 30000
})

await app.evaluate(async ({ dialog }, dir) => {
  dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
}, PICK_DIR)

const COMMANDS = [
  { name: 'preset', description: 'Load a named instruction block instead of retyping it', argumentHint: '<name>' },
  { name: 'trace', description: 'Follow one flow end to end across every file it touches', argumentHint: '<flow>' },
  { name: 'review', description: 'Fresh eyes over the working diff, findings only', argumentHint: '' },
  { name: 'context-update', description: 'Refresh the handoff notes for the next session', argumentHint: '' },
  { name: 'llm-kb', description: 'Ingest a source into the topic vault, or query it', argumentHint: 'ingest|query' },
  { name: 'wrap-up', description: '', argumentHint: '' },
  { name: 'hp', description: 'Map the golden path before any code exists', argumentHint: '' }
]
await app.evaluate(({ ipcMain }, commands) => {
  ipcMain.removeHandler('commands:list')
  ipcMain.handle('commands:list', async () => commands)
}, COMMANDS)

const page = await app.firstWindow()
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 15000 })

await page.evaluate(() => window.localStorage.setItem('zoom-level-v2', '1'))
await page.reload()
await page.waitForLoadState('domcontentloaded')
await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })
const zoom = await app.evaluate(({ BrowserWindow }) => {
  const w = BrowserWindow.getAllWindows()[0]
  w.webContents.setZoomFactor(1)
  return w.webContents.getZoomFactor()
})
check('premise: zoom factor is 1, so every px below is a css px', zoom === 1, { zoom })

const clickBySel = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel)

// ══ Welcome ═══════════════════════════════════════════════════════════════
await page.waitForSelector('.welcome-title', { timeout: 10000 })

const W = await page.evaluate(() => {
  const mark = document.querySelector('.welcome-mark')
  const title = document.querySelector('.welcome-title')
  const hint = document.querySelector('.welcome-hint')
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /pick a project folder/i.test(b.textContent || '')
  )
  if (!mark || !title || !hint || !btn) return null
  const gaps = () => {
    const m = mark.getBoundingClientRect()
    const t = title.getBoundingClientRect()
    const h = hint.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    return {
      markToTitle: t.top - m.bottom,
      titleToHint: h.top - t.bottom,
      hintToAction: b.top - h.bottom,
      stackHeight: b.bottom - m.top
    }
  }
  const now = gaps()
  // Reconstruct wave 6: action back to 32. Must fail the upper-bound clause.
  const btnSaved = btn.style.marginTop
  btn.style.marginTop = '32px'
  void document.body.offsetHeight
  const at32 = gaps()
  btn.style.marginTop = btnSaved
  void document.body.offsetHeight
  const restored = gaps()
  // Reconstruct pre-wave-6 lockup break: mark back to 16, action stays 24.
  const markSaved = mark.style.marginBottom
  mark.style.marginBottom = '16px'
  void document.body.offsetHeight
  const mark16 = gaps()
  mark.style.marginBottom = markSaved
  void document.body.offsetHeight
  return { now, at32, mark16, restored }
})

// W1 — mark joins lockup (spread <= 4) AND action is a quieter final beat than
// wave 6's 32. Authored stack is [8, 8, 24]: beat = action - lockupMax = 16.
// Floor keeps the action above the lockup (not an even stack). Ceiling reds
// wave 6's 32, whose beat is 24. Wave 6's floor-only pin (beat >= 16) is what
// this supersedes: that floor is true at both 24 and 32.
{
  const n = W?.now
  const a = W?.at32
  const m = W?.mark16
  const lockup = n ? Math.abs(n.markToTitle - n.titleToHint) : null
  const beat = n ? n.hintToAction - Math.max(n.markToTitle, n.titleToHint) : null
  const beat32 = a ? a.hintToAction - Math.max(a.markToTitle, a.titleToHint) : null
  const lockup16 = m ? Math.abs(m.markToTitle - m.titleToHint) : null
  check(
    'W1 lockup tight and action beat quiet (12..20 over lockup max) — 32 reds upper, mark-16 reds lockup',
    n != null &&
      lockup <= 4 &&
      beat >= 12 &&
      beat <= 20 &&
      near(n.markToTitle, 8, 0.75) &&
      near(n.titleToHint, 8, 0.75) &&
      near(n.hintToAction, 24, 0.75) &&
      // live reconstructions must fail the pin they protect
      (beat32 == null || beat32 > 20) &&
      (lockup16 == null || lockup16 > 4) &&
      near(W?.restored?.stackHeight, n.stackHeight, 0.01),
    {
      nowGaps: n ? [px(n.markToTitle), px(n.titleToHint), px(n.hintToAction)] : null,
      lockupSpread: px(lockup),
      beatMargin: px(beat),
      at32Gaps: a ? [px(a.markToTitle), px(a.titleToHint), px(a.hintToAction)] : null,
      at32Beat: px(beat32),
      mark16Lockup: px(lockup16),
      stackHeight: px(n?.stackHeight),
      reconstructionWouldFail: (beat32 != null && beat32 > 20) || (lockup16 != null && lockup16 > 4)
    }
  )
}

// ══ open a project, then the docks ════════════════════════════════════════
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /pick a project folder/i.test(b.textContent || '')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })
await page.waitForSelector('[aria-label="Agents panel"]', { timeout: 10000 })

// ══ CommandsDock ══════════════════════════════════════════════════════════
await clickBySel('[aria-label="Commands panel"]')
await page.waitForSelector('.command-row-btn', { timeout: 10000 }).catch(() => {})

const C = await page.evaluate(() => {
  const list = document.querySelector('.command-list')
  const agentList = document.querySelector('.agent-list')
  if (!list) return null
  const rows = [...list.querySelectorAll('.command-row-btn')]
  const cs = getComputedStyle(list)
  const gap = parseFloat(cs.gap || cs.rowGap || '0') || 0
  // Reconstruct pre-wave: force gap 2. Adjacent shell outer edges should sit
  // closer; we assert the authored gap value itself plus that agents stayed 2.
  const saved = list.style.gap
  list.style.gap = '2px'
  void document.body.offsetHeight
  const gap2 = parseFloat(getComputedStyle(list).gap || '0') || 0
  list.style.gap = saved
  void document.body.offsetHeight
  const agentGap = agentList
    ? parseFloat(getComputedStyle(agentList).gap || getComputedStyle(agentList).rowGap || '0') || 0
    : null
  const shells = rows.map((r) => getComputedStyle(r).boxShadow)
  const allShelled = shells.every((s) => s && s !== 'none' && /inset/.test(s))
  return {
    gap,
    gap2,
    agentGap,
    rowCount: rows.length,
    allShelled,
    sampleShadow: shells[0] || null
  }
})

check(
  'C1 command-list gap is 6 (not the shared 2) and resting shells still present',
  C != null &&
    near(C.gap, 6, 0.25) &&
    near(C.gap2, 2, 0.25) &&
    C.rowCount >= 5 &&
    C.allShelled &&
    // agents list, if mounted, must still be on the shared 2px — fence held
    (C.agentGap == null || near(C.agentGap, 2, 0.25)),
  {
    gap: px(C?.gap),
    reconstructedGap2: px(C?.gap2),
    agentGap: px(C?.agentGap),
    rowCount: C?.rowCount,
    allShelled: C?.allShelled,
    sampleShadow: C?.sampleShadow,
    reconstructionDiffers: C != null && !near(C.gap, C.gap2, 0.25)
  }
)

// ══ AppearanceDock ════════════════════════════════════════════════════════
await clickBySel('[aria-label="Appearance panel"]')
await page.waitForSelector('.appearance-choice', { timeout: 10000 }).catch(() => {})

const B = await page.evaluate(() => {
  const choices = [...document.querySelectorAll('.appearance-choice')]
  if (choices.length === 0) return null
  const read = (el) => {
    const cs = getComputedStyle(el)
    const mark = el.querySelector('.appearance-choice-mark')
    const m = mark ? mark.getBoundingClientRect() : null
    return {
      shadow: cs.boxShadow,
      bg: cs.backgroundColor,
      hasInset: !!(cs.boxShadow && cs.boxShadow !== 'none' && /inset/.test(cs.boxShadow)),
      markW: m ? m.width : null,
      markH: m ? m.height : null,
      selected:
        el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-selected') === 'true'
    }
  }
  const now = choices.map(read)
  // Strip the shell off every row; the pin must fail that reconstruction.
  const saved = choices.map((el) => el.style.boxShadow)
  for (const el of choices) el.style.boxShadow = 'none'
  void document.body.offsetHeight
  const stripped = choices.map(read)
  for (let i = 0; i < choices.length; i++) choices[i].style.boxShadow = saved[i]
  void document.body.offsetHeight
  return { now, stripped, count: choices.length }
})

check(
  'B1 all six appearance options carry a resting inset shell',
  B != null &&
    B.count === 6 &&
    B.now.every((r) => r.hasInset) &&
    B.stripped.every((r) => !r.hasInset),
  {
    count: B?.count,
    shelled: B?.now?.filter((r) => r.hasInset).length,
    strippedShelled: B?.stripped?.filter((r) => r.hasInset).length,
    sampleShadow: B?.now?.[0]?.shadow ?? null,
    reconstructionWouldFail: B?.stripped?.every((r) => !r.hasInset) === true
  }
)

check(
  'B2 mark slot stays 12x12 on every option (selected and not)',
  B != null &&
    B.now.every((r) => near(r.markW, 12, 0.5) && near(r.markH, 12, 0.5)) &&
    B.now.some((r) => r.selected) &&
    B.now.some((r) => !r.selected),
  {
    marks: B?.now?.map((r) => [px(r.markW), px(r.markH), r.selected]) ?? null
  }
)

await app.close().catch(() => {})
if (fails.length) {
  console.log(`FAIL  ${fails.length} check(s): ${fails.join('; ')}`)
  process.exit(1)
}
console.log('PASS  gui-gauntlet-wave7  all checks')
process.exit(0)
