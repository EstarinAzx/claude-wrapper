import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'

// #132 — the gate executes the GUI drivers' SOURCE-LEVEL assertions.
// #135 — the DOM-level ones execute too, in a named phase, and this file is
//        where the fast gate proves that phase omits nothing.
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
// THE SPLIT, stated here so nobody assumes the fast gate covers everything:
// this file runs the PURE half in milliseconds. The browser half needs a live
// Electron window and runs in `npm run test:dom` (`dom-phase.mjs`), which takes
// about twenty minutes and launches one real app per driver. Neither covers the
// other. What this file CAN do cheaply — and does, at the bottom — is assert
// that every driver is accounted for in that phase: launched, or skipped for a
// stated reason. A suite that quietly runs half its checks is the exact failure
// both tickets exist to close, so the accounting is itself a test.

interface SourceCheck {
  name: string
  run: () => { ok: boolean; detail: unknown }
}

interface Manifest {
  DOM_SKIP: Map<string, string>
  listDrivers: () => string[]
  listSidecars: () => string[]
  driverOf: (sidecar: string) => string
  domPhaseDrivers: () => string[]
  uncoveredContracts: () => [string, string][]
  phaseVerdict: (badCount: number, uncoveredCount: number) => 'PASS' | 'FAIL' | 'INCOMPLETE'
}

const REPO = path.resolve(import.meta.dirname, '..')
const DRIVER_DIR = path.join(REPO, '.claude/skills/run-desktop')

// Dynamic import, like the sidecars below: the manifest is `.mjs` and this file
// is typechecked by `tsconfig.web.json`, which has no `allowJs`.
const manifest = (await import(
  pathToFileURL(path.join(DRIVER_DIR, 'drivers.manifest.mjs')).href
)) as Manifest

// One definition of "the driver set", shared with the phase that launches them.
// A second glob here is how the two would drift.
const drivers = manifest.listDrivers()
const sidecars = manifest.listSidecars()
const driverOf = manifest.driverOf

// Top-level await: the sidecars must be loaded before `describe` can name their
// checks, and vitest test files are ESM.
const loaded = await Promise.all(
  sidecars.map(
    async (f) =>
      [f, (await import(pathToFileURL(path.join(DRIVER_DIR, f)).href)) as { checks: SourceCheck[] }] as const
  )
)

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

// #135 — the fast gate cannot RUN the DOM phase, but it can prove the phase has
// no silent omissions, and that costs milliseconds. Add a driver and forget to
// place it and this reds, naming it, on the next `npm test`.
describe('the DOM phase accounts for every driver', () => {
  const skipped = manifest.DOM_SKIP
  const launched = manifest.domPhaseDrivers()

  test('every driver is either launched by the phase or skipped with a reason', () => {
    const placed = new Set([...launched, ...skipped.keys()])
    expect(drivers.filter((d) => !placed.has(d))).toEqual([])
  })

  test('the skip list names only drivers that exist', () => {
    expect([...skipped.keys()].filter((d) => !drivers.includes(d))).toEqual([])
  })

  test('launched and skipped are disjoint, and together are the whole set', () => {
    expect(launched.filter((d) => skipped.has(d))).toEqual([])
    expect(launched.length + skipped.size).toBe(drivers.length)
  })

  // A skip reason is the only thing standing between "we decided not to run
  // this" and "nobody noticed this stopped running". An empty or lazy one
  // ("slow", "flaky") is how the second becomes the first in hindsight.
  test('every skip reason is substantive and names its category', () => {
    const bad = [...skipped.entries()].filter(
      ([, reason]) => reason.length < 40 || !/^(api-cost|no-verdict|desktop-exclusive):/.test(reason)
    )
    expect(bad).toEqual([])
  })
})

// #145 — a skip the phase's own verdict has to carry, not just list.
//
// The hazard, in the words of the review that named it: a printed postscript
// "converts a failing phase assertion into optional operator behaviour and
// launders the main phase green". `gui-119` is quarantined as
// `desktop-exclusive` — a contract that CAN be checked, by a human, on an idle
// desktop — and until somebody does, the phase has not checked it. So the last
// line a reader skims may not read as an unqualified pass while one is
// outstanding.
//
// WHY ONLY `desktop-exclusive` COUNTS, since the other two categories are also
// unlaunched: a deficit a reader can close is a deficit, and one they cannot is
// wallpaper. `desktop-exclusive` closes with one command. `api-cost` needs a
// key, network and credits and is a standing cost decision; `no-verdict` has no
// contract to leave uncovered, because the driver computes no pass/fail at all.
// Counting all nine would put a number on the last line that nobody can ever
// drive to zero, which is how a warning becomes furniture.
describe('an uncovered contract is stated in the verdict, not beneath it (#145)', () => {
  // NOT named `uncovered` — that word is already taken in this file for drivers
  // with no source-level sidecar, which is a different claim entirely.
  const outstanding = manifest.uncoveredContracts()

  test('the uncovered set is exactly the desktop-exclusive skips', () => {
    const byCategory = [...manifest.DOM_SKIP.entries()].filter(([, r]) => r.startsWith('desktop-exclusive:'))
    expect(outstanding).toEqual(byCategory)
  })

  // The quarantine this ticket accepted. If somebody launches `gui-119` in the
  // batch, or reclassifies it, that is a real decision and it should have to
  // edit a test that says so out loud.
  test('gui-119 is the outstanding one, and it is not launched', () => {
    expect(outstanding.map(([d]) => d)).toContain('gui-119.mjs')
    expect(manifest.domPhaseDrivers()).not.toContain('gui-119.mjs')
  })

  // The hazard itself, as one assertion: no combination of "nothing failed" and
  // "something was never checked" is allowed to produce a green word.
  test('a run where nothing broke is INCOMPLETE, not PASS, while a contract is uncovered', () => {
    expect(manifest.phaseVerdict(0, 1)).toBe('INCOMPLETE')
    expect(manifest.phaseVerdict(0, 9)).toBe('INCOMPLETE')
  })

  // Precedence, and it is the honest way round: a contract that was checked and
  // broke outranks one that was not checked at all.
  test('a real failure outranks an uncovered contract', () => {
    expect(manifest.phaseVerdict(1, 1)).toBe('FAIL')
    expect(manifest.phaseVerdict(1, 0)).toBe('FAIL')
  })

  // And the deficit is closeable rather than decorative: running the
  // quarantined driver alone is what earns the clean word back.
  test('PASS requires both zero — it is reachable, and only that way', () => {
    expect(manifest.phaseVerdict(0, 0)).toBe('PASS')
  })
})

// Reported, never omitted. Each of these appears in the vitest run as a named
// skip, so `npm test` states which contracts it is NOT checking — and, since
// #135, where each one IS checked instead.
describe('drivers with no source-level sidecar (reported, not omitted)', () => {
  for (const d of uncovered) {
    const reason = manifest.DOM_SKIP.has(d)
      ? `NOT EXECUTED ANYWHERE — ${manifest.DOM_SKIP.get(d)}`
      : 'browser-level: executes in `npm run test:dom` (#135), not in this gate'
    test.skip(`${d} — ${reason}`, () => {})
  }
})
