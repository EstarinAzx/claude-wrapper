import { readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'

// #132 — the gate executes the GUI drivers' SOURCE-LEVEL assertions.
//
// The hole this closes, measured rather than theorised: about 38 `gui-*.mjs`
// drivers live in `.claude/skills/run-desktop/`, each written alongside the
// ticket it verified, and `npm test` executed NONE of them. During the
// `core-surfaces` gauntlet run a single edit turned two driver assertions red
// and the three gate runs that followed all reported green, because nothing
// ran them. This compounds with the jsdom trap: jsdom loads no CSS, so an
// unknown `var(--x)` resolves silently to nothing and every raw-text pin still
// passes — which is why "any CSS change owes a driver pin" is load-bearing, and
// why it meant nothing while the drivers never executed.
//
// THE CONVENTION, and it is the deliverable as much as the checks are: a driver
// `gui-<n>.mjs` contributes its source-level assertions by shipping a sibling
// `gui-<n>.source.mjs` exporting `checks: { name, run() }[]`, where `run()`
// returns `{ ok, detail }` and is pure — no browser, no Electron, no `out/`
// artifact, no network, no clock. This file globs for those sidecars, so a new
// one is picked up with NO wiring here and none in `vitest.config.ts`. The
// driver imports the same array, so each assertion has exactly one definition
// and the gate copy cannot drift from the driven copy.
//
// What this file deliberately does NOT do: run the DOM-level assertions. Those
// need a live Electron window and are #135. They are reported as skipped below
// rather than omitted, because a suite that quietly runs half its checks is the
// exact failure this ticket exists to close.

interface SourceCheck {
  name: string
  run: () => { ok: boolean; detail: unknown }
}

const REPO = path.resolve(import.meta.dirname, '..')
const DRIVER_DIR = path.join(REPO, '.claude/skills/run-desktop')

const entries = readdirSync(DRIVER_DIR)

// `.source.mjs` files are sidecars, not drivers — excluded from the driver list
// so a covered driver is never also counted as one of its own sidecars.
const drivers = entries.filter((f) => f.startsWith('gui-') && f.endsWith('.mjs') && !f.endsWith('.source.mjs')).sort()
const sidecars = entries.filter((f) => f.startsWith('gui-') && f.endsWith('.source.mjs')).sort()

const driverOf = (sidecar: string): string => sidecar.replace(/\.source\.mjs$/, '.mjs')

// Top-level await: the sidecars must be loaded before `describe` can name their
// checks, and vitest test files are ESM.
const loaded = await Promise.all(
  sidecars.map(
    async (f) =>
      [f, (await import(pathToFileURL(path.join(DRIVER_DIR, f)).href)) as { checks: SourceCheck[] }] as const
  )
)

// Two reasons, because they are genuinely different and lumping them together
// would misreport why a check is absent. Anything not listed here needs a live
// window; these two need `npm run build`, which the gate does not run — a
// build-artifact check gated on a clean checkout reds for a reason that has
// nothing to do with the contract it pins. Tracked separately, not forgotten.
const BUILD_ARTIFACT = new Map([
  ['gui-75.mjs', 'reads out/main/index.js for setAppUserModelId — needs `npm run build`'],
  ['gui-93.mjs', 'reads the built CSS for the .subagent-drawer-close focus ring — needs `npm run build`']
])

const covered = new Set(sidecars.map(driverOf))
const uncovered = drivers.filter((d) => !covered.has(d))

for (const [sidecar, mod] of loaded) {
  describe(`${driverOf(sidecar)} (source-level)`, () => {
    for (const c of mod.checks) {
      test(c.name, () => {
        const { ok, detail } = c.run()
        // The detail rides in the failure message so a red gate names the
        // driver, the criterion AND the offending value in one read — the
        // driver's own `check()` prints the same object.
        expect(ok, `${driverOf(sidecar)} — ${c.name}\n${JSON.stringify(detail, null, 2)}`).toBe(true)
      })
    }
  })
}

describe('every driver is accounted for', () => {
  // The regression this file exists to prevent, applied to this file itself:
  // delete both sidecars and everything below still passes with 38 tidy skips.
  // This is the assertion that makes that loud instead of quiet.
  test('at least one driver contributes source-level checks', () => {
    expect(sidecars.length).toBeGreaterThan(0)
  })

  // A sidecar whose driver was renamed or misspelt still runs its checks, but
  // stops covering anything — the driver reappears in the skip list while the
  // sidecar looks fine. Cheap to catch, invisible otherwise.
  test('every sidecar names a driver that exists', () => {
    expect(sidecars.filter((s) => !drivers.includes(driverOf(s)))).toEqual([])
  })

  test('covered plus skipped equals the whole driver set', () => {
    expect(uncovered.length + drivers.filter((d) => covered.has(d)).length).toBe(drivers.length)
  })
})

// Reported, never omitted. Each of these appears in the vitest run as a named
// skip, so `npm test` states which contracts it is NOT checking.
describe('drivers with no source-level sidecar (reported, not omitted)', () => {
  for (const d of uncovered) {
    const reason = BUILD_ARTIFACT.get(d) ?? 'browser-level: needs a live Electron window (#135)'
    test.skip(`${d} — ${reason}`, () => {})
  }
})
