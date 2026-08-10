// SCRATCH (wave 5, Titlebar). Disposable. Magnifies the REAL 1x render of
// .titlebar-actions with nearest-neighbour scaling, so the actual shipped pixels
// are legible without being resampled into something flattering.
//
//   SHOT=<file.png> node .gauntlet/scratch/wave5-titlebar/zoom.mjs
//
// Launch + folder-stub lifted verbatim from inspect.mjs; only the capture differs.

import { _electron as electron } from 'playwright-core'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const OUT = process.env.SHOT || path.join(APP_DIR, '.gauntlet/scratch/wave5-titlebar/zoom.png')
const SCALE = Number(process.env.SCALE || 10)
fs.mkdirSync(path.dirname(OUT), { recursive: true })

const WORKSPACE = fs.mkdtempSync(path.join(os.tmpdir(), 'zoom-ws-'))

const electronBin =
  process.platform === 'win32'
    ? path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')
    : path.join(APP_DIR, 'node_modules/electron/dist/electron')

let app = null
const wd = setTimeout(() => {
  console.log('TIMEOUT')
  app?.close().catch(() => {})
  process.exit(1)
}, 180000)
wd.unref?.()

try {
  app = await electron.launch({
    executablePath: electronBin,
    args: ['--no-sandbox', '--disable-gpu', '.'],
    cwd: APP_DIR,
    env: process.env,
    timeout: 30000
  })
  await app.evaluate(({ dialog }, dir) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [dir] })
  }, WORKSPACE)

  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('[aria-label="Backend mode"]', { timeout: 20000 })
  await app.evaluate(({ BrowserWindow }) => {
    const w = BrowserWindow.getAllWindows()[0]
    w.webContents.setZoomFactor(1)
    w.unmaximize?.()
    w.setBounds({ x: 40, y: 40, width: 1440, height: 900 })
    w.show()
    w.focus()
  })
  await page.waitForTimeout(900)
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(
      (x) =>
        x.getAttribute('aria-label') === 'Pick a project folder' ||
        x.textContent?.includes('Pick a project folder')
    )
    b?.click()
  })
  await page.waitForSelector('.titlebar-actions', { timeout: 25000 })
  if (process.env.ON)
    await page.evaluate(() =>
      document.querySelectorAll('.agents-toggle')[1]?.classList.add('agents-toggle--on')
    )
  await page.evaluate(() => document.activeElement?.blur?.())
  await page.mouse.move(4, 4)
  await page.waitForTimeout(800)

  // The real 1x pixels of the cluster PLUS the separator and the first window
  // control, because the question is whether the three read as a group against
  // their neighbours.
  const clip = await page.evaluate((tight) => {
    const a = document.querySelector('.titlebar-actions').getBoundingClientRect()
    if (tight) {
      return {
        x: Math.round(a.x),
        y: Math.round(a.y),
        width: Math.round(a.width),
        height: Math.round(a.height)
      }
    }
    const win = document.querySelectorAll('.win-btn')
    const last = win[0].getBoundingClientRect()
    return {
      x: Math.round(a.x - 8),
      y: 0,
      width: Math.round(last.right - a.x + 16),
      height: 48
    }
  }, !!process.env.TIGHT)
  const buf = await page.screenshot({ clip })
  console.log('CLIP', JSON.stringify(clip))

  const b64 = buf.toString('base64')
  const zoomed = await page.evaluate(
    async ([data, s, w, h]) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + data
      await img.decode()
      const c = document.createElement('canvas')
      c.width = w * s
      c.height = h * s
      const ctx = c.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, c.width, c.height)
      return c.toDataURL('image/png').split(',')[1]
    },
    [b64, SCALE, clip.width, clip.height]
  )
  fs.writeFileSync(OUT, Buffer.from(zoomed, 'base64'))
  console.log('WROTE', OUT, `${clip.width * SCALE}x${clip.height * SCALE}`)

  // Luminance profile of the REAL 1x pixels: one horizontal scanline through the
  // vertical centre of each toggle. "Fused" vs "two strokes" is a measurement,
  // not an impression — two strokes resolve only if the ground between them
  // returns near the background value.
  const rows = await page.evaluate(
    async ([data, cx, cy, w]) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + data
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const out = []
      for (const bx of cx) {
        const d = ctx.getImageData(bx, cy, w, 1).data
        const lum = []
        for (let i = 0; i < w; i++)
          lum.push(Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]))
        out.push(lum)
      }
      return out
    },
    [
      b64,
      [0, 30, 60].map((o) => o),
      Math.round(clip.height / 2),
      Math.min(30, clip.width)
    ]
  )
  rows.forEach((r, i) => console.log(`SCAN${i}`, r.join(' ')))
} catch (e) {
  console.log('THREW', String(e && e.stack ? e.stack : e).split('\n').slice(0, 3).join(' | '))
} finally {
  clearTimeout(wd)
  await app?.close().catch(() => {})
  try {
    fs.rmSync(WORKSPACE, { recursive: true, force: true })
  } catch {}
  process.exit(0)
}
