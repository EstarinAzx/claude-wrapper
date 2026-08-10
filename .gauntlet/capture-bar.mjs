// Captures the Linear reference artifacts for .gauntlet/bar/linear/.
// A bar has to be openable: a URL is a promise that something will look a
// certain way later, and a critic that cannot open it grades from memory.
//
//   node .gauntlet/capture-bar.mjs
//
// Uses the machine's real Chrome (playwright-core ships no browser binary).
// Re-run only when deliberately raising the bar — see .gauntlet/bar/README.md.

import { chromium } from 'playwright-core'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, 'bar', 'linear')
fs.mkdirSync(OUT, { recursive: true })

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].find((p) => fs.existsSync(p))
if (!CHROME) throw new Error('no Chrome or Edge found')

// Each entry: what surface of claude-wrapper this reference is the bar FOR.
const PAGES = [
  { slug: 'linear-home-hero', url: 'https://linear.app/', scroll: 0, judges: 'Sidebar + Chat: app shell, rail density, one type scale' },
  { slug: 'linear-home-product', url: 'https://linear.app/', scroll: 900, judges: 'Chat: list rhythm, row hierarchy, restraint' },
  { slug: 'linear-features', url: 'https://linear.app/features', scroll: 400, judges: 'Titlebar + docks: control grouping, iconography' },
  { slug: 'linear-method', url: 'https://linear.app/method', scroll: 0, judges: 'Welcome + copy: authored empty space, editorial type' },
  { slug: 'linear-changelog', url: 'https://linear.app/changelog', scroll: 300, judges: 'Chat transcript: long-form reading, date dividers' }
]

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({
  viewport: { width: 1680, height: 1050 },
  deviceScaleFactor: 2,
  colorScheme: 'dark'
})

const manifest = []
for (const p of PAGES) {
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 45000 })
    if (p.scroll) {
      await page.evaluate((y) => window.scrollTo(0, y), p.scroll)
      await page.waitForTimeout(1200)
    }
    await page.waitForTimeout(800)
    const file = path.join(OUT, `${p.slug}.png`)
    await page.screenshot({ path: file })
    const bytes = fs.statSync(file).size
    manifest.push({ ...p, file: path.basename(file), bytes })
    console.log(`OK   ${p.slug}  ${bytes} bytes`)
  } catch (err) {
    // A missing reference must be loud: a bar folder that silently came back
    // half-empty reads exactly like a bar the artifact already clears.
    manifest.push({ ...p, file: null, error: String(err.message).slice(0, 200) })
    console.log(`FAIL ${p.slug}  ${String(err.message).slice(0, 120)}`)
  }
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
await browser.close()

const captured = manifest.filter((m) => m.file).length
console.log(`\nCAPTURED ${captured}/${PAGES.length}`)
if (captured === 0) throw new Error('captured nothing — the bar folder would be a lie')
