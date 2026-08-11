// GUI pin for gauntlet wave 10 — AppearanceDock Zoom control-row shell only.
//
//   node .claude/skills/run-desktop/gui-gauntlet-wave10.mjs
//
// Needs `npm run build` first, plus playwright-core. Costs NO CLI turns.
//
// ── the one change ───────────────────────────────────────────────────────────
//   AppearanceDock    Zoom section head takes a resting --tint-2 inset shell
//                     (appearance-field--control) so label + stepper read as
//                     one composed horizontal control row. Theme/Backdrop stay
//                     bare. Stepper stays compact (~88px), not full-column.
//
// Holds from prior waves re-asserted so a later wave cannot quietly drop them:
//   wave 7  resting shells on every option
//   wave 8  appearance-choices gap 4
//   wave 8  mark slot 12x12
//
// Live reconstructions that must fail:
//   Z1 shell off the control head
//   Z2 full-column stepper (width back to ~215)
//   B1 gap forced to 2
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

await page.waitForSelector('.welcome-title', { timeout: 10000 })
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /pick a project folder/i.test(b.textContent || '')
  )
  btn?.click()
})
await page.waitForSelector('.session-group-head', { timeout: 20000 })
await page.waitForSelector('[aria-label="Agents panel"]', { timeout: 10000 })

await clickBySel('[aria-label="Appearance panel"]')
await page.waitForSelector('.appearance-choice', { timeout: 10000 }).catch(() => {})

const Z = await page.evaluate(() => {
  const fields = [...document.querySelectorAll('.appearance-field')]
  const controls = [...document.querySelectorAll('.appearance-field--control')]
  const stepper = document.querySelector('.appearance-stepper')
  const zoomLabel = document.getElementById('appearance-zoom-label')
  const themeLabel = document.getElementById('appearance-theme-label')
  const backdropLabel = document.getElementById('appearance-backdrop-label')
  if (!stepper || !zoomLabel || controls.length === 0) return null

  const controlField = controls[0]
  const controlHead = controlField.querySelector('.appearance-head')
  const themeField = themeLabel?.closest('.appearance-field')
  const backdropField = backdropLabel?.closest('.appearance-field')
  const themeHead = themeField?.querySelector('.appearance-head')
  const backdropHead = backdropField?.querySelector('.appearance-head')

  const shellOf = (el) => {
    if (!el) return null
    const cs = getComputedStyle(el)
    return {
      hasInset: !!(cs.boxShadow && cs.boxShadow !== 'none' && /inset/.test(cs.boxShadow)),
      shadow: cs.boxShadow,
      padT: parseFloat(cs.paddingTop) || 0,
      padX: parseFloat(cs.paddingLeft) || 0,
      radius: parseFloat(cs.borderRadius) || 0,
      h: el.getBoundingClientRect().height,
      w: el.getBoundingClientRect().width
    }
  }

  const stepR = stepper.getBoundingClientRect()
  const headR = controlHead.getBoundingClientRect()
  const labelR = zoomLabel.getBoundingClientRect()

  // Live reconstruction Z1: strip the control shell. Pin must fail that.
  const savedClass = controlField.className
  controlField.className = 'appearance-field'
  void document.body.offsetHeight
  const shellOff = shellOf(controlHead)
  controlField.className = savedClass
  void document.body.offsetHeight
  const shellRestored = shellOf(controlHead)

  // Live reconstruction Z2: force stepper full-column. Pin must differ.
  const savedW = stepper.style.width
  const savedFlex = stepper.style.flex
  stepper.style.width = '100%'
  stepper.style.flex = '1 1 auto'
  void document.body.offsetHeight
  const stepFull = stepper.getBoundingClientRect().width
  stepper.style.width = savedW
  stepper.style.flex = savedFlex
  void document.body.offsetHeight
  const stepRestored = stepper.getBoundingClientRect().width

  // Gap hold (wave 8)
  const lists = [...document.querySelectorAll('.appearance-choices')]
  const readGap = (el) => {
    const cs = getComputedStyle(el)
    return parseFloat(cs.gap || cs.rowGap || '0') || 0
  }
  const gapsNow = lists.map(readGap)
  const savedGaps = lists.map((el) => el.style.gap)
  for (const el of lists) el.style.gap = '2px'
  void document.body.offsetHeight
  const gaps2 = lists.map(readGap)
  for (let i = 0; i < lists.length; i++) lists[i].style.gap = savedGaps[i]
  void document.body.offsetHeight

  const choices = [...document.querySelectorAll('.appearance-choice')]
  const shellsNow = choices.map((el) => {
    const cs = getComputedStyle(el)
    const mark = el.querySelector('.appearance-choice-mark')
    const m = mark ? mark.getBoundingClientRect() : null
    return {
      hasInset: !!(cs.boxShadow && cs.boxShadow !== 'none' && /inset/.test(cs.boxShadow)),
      markW: m ? m.width : null,
      markH: m ? m.height : null
    }
  })

  return {
    fieldCount: fields.length,
    controlCount: controls.length,
    controlIsZoom: controlField.contains(zoomLabel) && controlField.contains(stepper),
    themeIsControl: themeField?.classList.contains('appearance-field--control') ?? null,
    backdropIsControl: backdropField?.classList.contains('appearance-field--control') ?? null,
    controlShell: shellOf(controlHead),
    themeShell: shellOf(themeHead),
    backdropShell: shellOf(backdropHead),
    shellOff,
    shellRestored,
    stepW: stepR.width,
    stepH: stepR.height,
    headW: headR.width,
    headH: headR.height,
    labelW: labelR.width,
    // label left edge should sit left of stepper; both inside head
    labelLeftOfStep: labelR.right <= stepR.left + 0.5,
    stepInsideHead:
      stepR.left >= headR.left - 0.5 &&
      stepR.right <= headR.right + 0.5 &&
      stepR.top >= headR.top - 0.5 &&
      stepR.bottom <= headR.bottom + 0.5,
    stepFull,
    stepRestored,
    gapsNow,
    gaps2,
    choiceCount: choices.length,
    shellsNow
  }
})

check(
  'Z0 exactly one control field and it is Zoom (Theme/Backdrop bare)',
  Z != null &&
    Z.controlCount === 1 &&
    Z.fieldCount === 3 &&
    Z.controlIsZoom === true &&
    Z.themeIsControl === false &&
    Z.backdropIsControl === false,
  {
    fieldCount: Z?.fieldCount,
    controlCount: Z?.controlCount,
    controlIsZoom: Z?.controlIsZoom,
    themeIsControl: Z?.themeIsControl,
    backdropIsControl: Z?.backdropIsControl
  }
)

check(
  'Z1 Zoom head carries resting inset shell; live reconstruction off differs',
  Z != null &&
    Z.controlShell?.hasInset === true &&
    near(Z.controlShell.padT, 6, 0.5) &&
    near(Z.controlShell.radius, 8, 0.5) &&
    Z.shellOff?.hasInset === false &&
    Z.shellRestored?.hasInset === true,
  {
    controlShell: Z?.controlShell
      ? {
          hasInset: Z.controlShell.hasInset,
          padT: px(Z.controlShell.padT),
          radius: px(Z.controlShell.radius),
          h: px(Z.controlShell.h)
        }
      : null,
    shellOffHasInset: Z?.shellOff?.hasInset,
    shellRestoredHasInset: Z?.shellRestored?.hasInset,
    reconstructionDiffers: Z != null && Z.controlShell?.hasInset && !Z.shellOff?.hasInset
  }
)

check(
  'Z1b Theme and Backdrop heads stay bare (no resting shell)',
  Z != null &&
    Z.themeShell?.hasInset === false &&
    Z.backdropShell?.hasInset === false,
  {
    themeHasInset: Z?.themeShell?.hasInset,
    backdropHasInset: Z?.backdropShell?.hasInset
  }
)

check(
  'Z2 stepper stays compact inside the head (not full-column) — reconstruction differs',
  Z != null &&
    // wave-4 arithmetic: 24+24+38 + 2 border ≈ 88
    Z.stepW >= 80 &&
    Z.stepW <= 100 &&
    Z.stepInsideHead === true &&
    Z.labelLeftOfStep === true &&
    // full-column would be ~215 content; pin fails if we are already that wide
    Z.stepW < Z.headW * 0.6 &&
    Z.stepFull > Z.stepW + 40 &&
    near(Z.stepRestored, Z.stepW, 1),
  {
    stepW: px(Z?.stepW),
    stepH: px(Z?.stepH),
    headW: px(Z?.headW),
    headH: px(Z?.headH),
    labelW: px(Z?.labelW),
    stepInsideHead: Z?.stepInsideHead,
    labelLeftOfStep: Z?.labelLeftOfStep,
    stepFull: px(Z?.stepFull),
    stepRestored: px(Z?.stepRestored),
    reconstructionDiffers: Z != null && Z.stepFull > Z.stepW + 40
  }
)

check(
  'B1 appearance-choices gap still 4 (wave 8 hold) — live reconstruction at 2 differs',
  Z != null &&
    Z.gapsNow.length >= 2 &&
    Z.gapsNow.every((g) => near(g, 4, 0.25)) &&
    Z.gaps2.every((g) => near(g, 2, 0.25)),
  {
    gapsNow: Z?.gapsNow?.map(px) ?? null,
    reconstructedGap2: Z?.gaps2?.map(px) ?? null
  }
)

check(
  'B2 resting inset shells still present on every option (wave 7 hold)',
  Z != null &&
    Z.choiceCount === 6 &&
    Z.shellsNow.every((r) => r.hasInset),
  {
    choiceCount: Z?.choiceCount,
    shelled: Z?.shellsNow?.filter((r) => r.hasInset).length
  }
)

check(
  'B3 mark slot stays 12x12 on every option (wave 7 hold)',
  Z != null &&
    Z.shellsNow.every((r) => near(r.markW, 12, 0.5) && near(r.markH, 12, 0.5)),
  {
    marks: Z?.shellsNow?.map((r) => [px(r.markW), px(r.markH)]) ?? null
  }
)

// Fence: Commands stayed at 6, Agents at shared 2.
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
  const row = list.querySelector('.command-row-btn')
  const cs = row ? getComputedStyle(row) : null
  return {
    gap,
    agentGap,
    shell:
      cs != null &&
      !!(cs.boxShadow && cs.boxShadow !== 'none' && /inset/.test(cs.boxShadow))
  }
})

check(
  'C1 Commands gap stays 6 with resting shells; Agents (if mounted) stay 2',
  C != null &&
    near(C.gap, 6, 0.25) &&
    C.shell === true &&
    (C.agentGap == null || near(C.agentGap, 2, 0.25)),
  {
    commandsGap: px(C?.gap),
    agentGap: C?.agentGap == null ? null : px(C.agentGap),
    commandsShell: C?.shell
  }
)

await app.close().catch(() => {})

if (fails.length) {
  console.log(`FAIL ${fails.length}: ${fails.join(' | ')}`)
  process.exit(1)
}
console.log('PASS all wave10 pins')
process.exit(0)
