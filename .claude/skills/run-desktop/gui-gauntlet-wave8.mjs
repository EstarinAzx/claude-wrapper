// GUI pin for gauntlet wave 8 — AppearanceDock list gap only.
//
//   node .claude/skills/run-desktop/gui-gauntlet-wave8.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// ── the one change ───────────────────────────────────────────────────────────
//   AppearanceDock    .appearance-choices gap 2 -> 4 (dock-local only).
//                     Pinned by B1 with a live reconstruction that fails at 2.
//
// Shell anatomy (resting inset --tint-2) and the 12x12 mark slot are UNTOUCHED
// and re-asserted so a later wave cannot quietly drop them while this pin stays
// green. Commands stays at 6; Agents stays at the shared 2 — both fenced.
//
// No supersessions. Wave 7's B1/B2 still hold and still run.
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

// open a project, then the docks
await page.waitForSelector('.welcome-title', { timeout: 10000 })
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /pick a project folder/i.test(b.textContent || '')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })
await page.waitForSelector('[aria-label="Agents panel"]', { timeout: 10000 })

// ══ AppearanceDock ════════════════════════════════════════════════════════
await clickBySel('[aria-label="Appearance panel"]')
await page.waitForSelector('.appearance-choice', { timeout: 10000 }).catch(() => {})

const B = await page.evaluate(() => {
  const lists = [...document.querySelectorAll('.appearance-choices')]
  const choices = [...document.querySelectorAll('.appearance-choice')]
  if (lists.length === 0 || choices.length === 0) return null

  const readGap = (el) => {
    const cs = getComputedStyle(el)
    return parseFloat(cs.gap || cs.rowGap || '0') || 0
  }
  const readShell = (el) => {
    const cs = getComputedStyle(el)
    const mark = el.querySelector('.appearance-choice-mark')
    const m = mark ? mark.getBoundingClientRect() : null
    return {
      hasInset: !!(cs.boxShadow && cs.boxShadow !== 'none' && /inset/.test(cs.boxShadow)),
      shadow: cs.boxShadow,
      markW: m ? m.width : null,
      markH: m ? m.height : null
    }
  }

  const gapsNow = lists.map(readGap)
  const shellsNow = choices.map(readShell)

  // Live reconstruction: force every list back to 2. The pin must fail that.
  const saved = lists.map((el) => el.style.gap)
  for (const el of lists) el.style.gap = '2px'
  void document.body.offsetHeight
  const gaps2 = lists.map(readGap)
  for (let i = 0; i < lists.length; i++) lists[i].style.gap = saved[i]
  void document.body.offsetHeight
  const gapsRestored = lists.map(readGap)

  // Also measure adjacent shell outer edges so a gap declaration that somehow
  // fails to layout still reds (computed gap alone can lie if the flex item is
  // not the one painted). Theme list is four options — enough pairs.
  const themeList = lists[0]
  const themeRows = themeList ? [...themeList.querySelectorAll('.appearance-choice')] : []
  const pairGaps = []
  for (let i = 0; i < themeRows.length - 1; i++) {
    const a = themeRows[i].getBoundingClientRect()
    const b = themeRows[i + 1].getBoundingClientRect()
    pairGaps.push(b.top - a.bottom)
  }

  return {
    listCount: lists.length,
    choiceCount: choices.length,
    gapsNow,
    gaps2,
    gapsRestored,
    pairGaps,
    shellsNow
  }
})

check(
  'B1 appearance-choices gap is 4 (not the shared 2) — live reconstruction at 2 differs',
  B != null &&
    B.listCount >= 2 &&
    B.gapsNow.every((g) => near(g, 4, 0.25)) &&
    B.gaps2.every((g) => near(g, 2, 0.25)) &&
    B.gapsRestored.every((g) => near(g, 4, 0.25)) &&
    // box-to-box must also read ~4; wave 7 left shells whose outer edges sit
    // on the gap, so this is the same quantity measured a second way
    B.pairGaps.length >= 1 &&
    B.pairGaps.every((g) => near(g, 4, 0.75)),
  {
    listCount: B?.listCount,
    gapsNow: B?.gapsNow?.map(px) ?? null,
    reconstructedGap2: B?.gaps2?.map(px) ?? null,
    gapsRestored: B?.gapsRestored?.map(px) ?? null,
    pairGaps: B?.pairGaps?.map(px) ?? null,
    reconstructionDiffers:
      B != null && B.gapsNow.every((g, i) => !near(g, B.gaps2[i], 0.25))
  }
)

check(
  'B2 resting inset shells still present on every option (wave 7 hold)',
  B != null &&
    B.choiceCount === 6 &&
    B.shellsNow.every((r) => r.hasInset),
  {
    choiceCount: B?.choiceCount,
    shelled: B?.shellsNow?.filter((r) => r.hasInset).length,
    sampleShadow: B?.shellsNow?.[0]?.shadow ?? null
  }
)

check(
  'B3 mark slot stays 12x12 on every option (wave 7 hold)',
  B != null &&
    B.shellsNow.every((r) => near(r.markW, 12, 0.5) && near(r.markH, 12, 0.5)),
  {
    marks: B?.shellsNow?.map((r) => [px(r.markW), px(r.markH)]) ?? null
  }
)

// Fence: Commands stayed at 6, Agents (if mounted) at shared 2.
await clickBySel('[aria-label="Commands panel"]')
await page.waitForSelector('.command-row-btn', { timeout: 10000 }).catch(() => {})

const C = await page.evaluate(() => {
  const list = document.querySelector('.command-list')
  const agentList = document.querySelector('.agent-list')
  if (!list) return null
  const gap = parseFloat(getComputedStyle(list).gap || getComputedStyle(list).rowGap || '0') || 0
  const agentGap = agentList
    ? parseFloat(getComputedStyle(agentList).gap || getComputedStyle(agentList).rowGap || '0') || 0
    : null
  return { gap, agentGap }
})

check(
  'C1 command-list gap still 6 and agents (if mounted) still 2 — appearance fence held',
  C != null &&
    near(C.gap, 6, 0.25) &&
    (C.agentGap == null || near(C.agentGap, 2, 0.25)),
  {
    commandGap: px(C?.gap),
    agentGap: px(C?.agentGap)
  }
)

await app.close().catch(() => {})
if (fails.length) {
  console.log(`FAIL  ${fails.length} check(s): ${fails.join('; ')}`)
  process.exit(1)
}
console.log('PASS  gui-gauntlet-wave8  all checks')
process.exit(0)
