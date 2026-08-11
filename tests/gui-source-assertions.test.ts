import fs from 'node:fs'
import os from 'node:os'
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
// #141 adds ONE opt-in exception to the purity clause, and only that one: a
// check may carry `needsBuild: { artifact, covers }` and read a build artifact.
// This gate does not run those — it does not build, and a clean checkout has no
// `out/` — so it reports each as a named skip and the DOM phase executes it
// against a build proved newer than `covers`. The block near the bottom of this
// file is where that split is asserted rather than assumed.
//
// THE SPLIT, stated here so nobody assumes the fast gate covers everything:
// this file runs the PURE half in milliseconds. The browser half needs a live
// Electron window and runs in `npm run test:dom` (`dom-phase.mjs`), which takes
// about twenty minutes and launches one real app per driver. Neither covers the
// other. What this file CAN do cheaply — and does, at the bottom — is assert
// that every driver is accounted for in that phase: launched, or skipped for a
// stated reason. A suite that quietly runs half its checks is the exact failure
// both tickets exist to close, so the accounting is itself a test.

interface BuildRequirement {
  artifact: string
  covers: string[]
}

interface SourceCheck {
  name: string
  needsBuild?: BuildRequirement
  run: () => { ok: boolean; detail: unknown }
}

interface LoadedCheck {
  sidecar: string
  driver: string
  check: SourceCheck
}

interface BuildStatus {
  ok: boolean
  reason: 'fresh' | 'missing' | 'stale'
  artifact: string
  stale: string[]
}

interface Manifest {
  DOM_SKIP: Map<string, string>
  listDrivers: () => string[]
  listSidecars: () => string[]
  driverOf: (sidecar: string) => string
  domPhaseDrivers: () => string[]
  uncoveredContracts: () => [string, string][]
  phaseVerdict: (badCount: number, uncoveredCount: number) => 'PASS' | 'FAIL' | 'INCOMPLETE'
  loadChecks: () => Promise<LoadedCheck[]>
  buildRequiringChecks: () => Promise<LoadedCheck[]>
  buildRequirementStatus: (req: BuildRequirement, mtimeOf?: (p: string) => number | null) => BuildStatus
  latestMtime: (abs: string) => number | null
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

// Top-level await: the checks must be loaded before `describe` can name them,
// and vitest test files are ESM. Loaded THROUGH the manifest rather than by a
// second glob-and-import here — the same reason the driver list comes from
// there. Two enumerations of "the check set" is how the gate and the DOM phase
// would come to disagree about which checks exist.
const loaded = await manifest.loadChecks()

const covered = new Set(sidecars.map(driverOf))
const uncovered = drivers.filter((d) => !covered.has(d))

// #141 — a check may DECLARE that it reads a build artifact. `npm test` does not
// build, so this gate cannot honestly run those: on a clean checkout there is no
// `out/` at all, and gating on one would red for a reason that has nothing to do
// with the contract. They run in the DOM phase, which does require a build. The
// split is reported below rather than assumed, and the accounting that the phase
// really runs them is itself a test.
const pure = loaded.filter((c) => !c.check.needsBuild)
const needBuild = loaded.filter((c) => c.check.needsBuild)

for (const sidecar of sidecars) {
  const mine = pure.filter((c) => c.sidecar === sidecar)
  // A sidecar whose every check declares a build requirement contributes no
  // gate test at all — it is reported in the skip block below instead of
  // producing an empty, falsely reassuring describe.
  if (mine.length === 0) continue
  describe(`${driverOf(sidecar)} (source-level)`, () => {
    for (const { check: c } of mine) {
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

// #141 — a check that reads `out/`, declared rather than left out.
//
// #132 shipped the sidecar convention with `run()` specified PURE: no browser,
// no Electron, no `out/` artifact. That left two driver assertions homeless,
// because their subject IS the build output — `gui-75` §0 greps the built main
// bundle for `setAppUserModelId` (Electron exposes no getter, so there is
// nothing to read back at runtime, and on Windows an unpackaged app without an
// identity shows no toast and reports NO error), and `gui-93` reads the built
// stylesheet. They were reported as named skips and executed nowhere.
//
// THE SHAPE, and it is the deliberate part: the gate does NOT grow a build step.
// Building inside `npm test` taxes every run for two assertions, and a separate
// `test:built` script nobody is forced to run rebuilds the exact hole #132
// exists to close, one level up. Instead a check DECLARES what it needs:
//
//   { name, needsBuild: { artifact, covers }, run() }
//
// and the two runners read that declaration in opposite directions — this gate
// skips it by name and says where it runs, the DOM phase (which already
// requires `npm run build`) executes it. `gui-93` needed none of this: its
// built-CSS assertion is inline in the driver, and the driver is launched by
// the phase, so that half was already covered and is not duplicated here.
//
// AND THE PART WITHOUT WHICH THE REST IS THEATRE: a declared requirement must
// not be satisfiable by a STALE `out/`. A grep against last week's bundle
// passes just as happily as one against the current build, so the artifact has
// to be at least as new as every source it claims to cover. That comparator is
// pure, lives in the manifest, and is red-verified below against fake mtimes —
// deliberately, because a rule about staleness that only runs when the tree
// happens to be stale is a rule nobody ever sees work.
describe('a declared build requirement is executed, and cannot be satisfied by a stale build (#141)', () => {
  const req = { artifact: 'out/main/index.js', covers: ['src/main'] }
  const at = (m: Record<string, number>) => (p: string) => (p in m ? m[p] : null)

  test('an artifact newer than everything it covers is fresh', () => {
    const s = manifest.buildRequirementStatus(req, at({ 'out/main/index.js': 2000, 'src/main': 1000 }))
    expect(s).toEqual({ ok: true, reason: 'fresh', artifact: 'out/main/index.js', stale: [] })
  })

  // The whole point of the field. Edit a source, forget to rebuild, and the
  // grep still passes against the old bundle — silently, which is the worst
  // kind of green this repo keeps finding.
  test('a source newer than the artifact is STALE, and the source is named', () => {
    const s = manifest.buildRequirementStatus(req, at({ 'out/main/index.js': 1000, 'src/main': 2000 }))
    expect(s.ok).toBe(false)
    expect(s.reason).toBe('stale')
    expect(s.stale).toEqual(['src/main'])
  })

  // Built in the same tick as the last edit is not stale. `>` and not `>=`,
  // because a coarse filesystem clock would otherwise report every fresh build
  // as stale and the check would be switched off within a week.
  test('an artifact exactly as new as its sources is fresh, not stale', () => {
    const s = manifest.buildRequirementStatus(req, at({ 'out/main/index.js': 1000, 'src/main': 1000 }))
    expect(s.ok).toBe(true)
  })

  test('a missing artifact is `missing`, distinct from stale', () => {
    const s = manifest.buildRequirementStatus(req, at({ 'src/main': 1000 }))
    expect(s.ok).toBe(false)
    expect(s.reason).toBe('missing')
  })

  // A `covers` entry that does not exist cannot make anything stale — it is a
  // typo or a deleted directory, and treating it as "newer" would red every
  // run with no way to tell why.
  test('a covered path that does not exist is ignored, not treated as newer', () => {
    const s = manifest.buildRequirementStatus(req, at({ 'out/main/index.js': 1000 }))
    expect(s.ok).toBe(true)
  })

  // `latestMtime` is what makes `covers: ['src/main']` mean the whole TREE
  // rather than one file. A flat read would miss a sibling module the bundle
  // also contains, which is most of them.
  //
  // Built on a fixture with a stamped mtime rather than on `src/main`, and that
  // is a correction rather than a preference: the first version of this test
  // compared two real paths in the repo and PASSED with the recursion deleted.
  // A directory's own mtime moves when entries are added or removed, not when a
  // file inside is edited, so on any given checkout it can happen to be new
  // enough for a loose comparison — the test measured the checkout, not the
  // walk. Stamping one nested file to a fixed far-future time makes the answer
  // exact and makes deleting the recursion impossible to miss.
  test('latestMtime walks NESTED files, not just the directory own mtime', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'latest-mtime-'))
    try {
      fs.mkdirSync(path.join(root, 'nested'))
      const deep = path.join(root, 'nested/deep.ts')
      fs.writeFileSync(deep, 'x')
      // 2100-01-01, comfortably past any real directory mtime, so the assertion
      // is an equality rather than a comparison that a slow clock could flip.
      const FIXED = 4102444800000
      fs.utimesSync(deep, FIXED / 1000, FIXED / 1000)
      expect(manifest.latestMtime(root)).toBe(FIXED)
      expect(manifest.latestMtime(deep)).toBe(FIXED)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  test('latestMtime answers null for a path that is not there', () => {
    expect(manifest.latestMtime(path.join(REPO, 'src/main/does-not-exist.ts'))).toBeNull()
  })

  // The accounting, same discipline as the driver set above: the phase's own
  // list of build-requiring checks is the one this gate skipped, so a check
  // cannot fall between the two runners.
  test('every check this gate skipped for a build requirement is one the DOM phase runs', async () => {
    const phase = await manifest.buildRequiringChecks()
    expect(phase.map((c) => `${c.driver} › ${c.check.name}`).sort()).toEqual(
      needBuild.map((c) => `${c.driver} › ${c.check.name}`).sort()
    )
  })

  test('a declared requirement names both an artifact and what it covers', () => {
    for (const { check } of needBuild) {
      expect(check.needsBuild!.artifact, check.name).toBeTruthy()
      expect(check.needsBuild!.covers.length, check.name).toBeGreaterThan(0)
    }
  })

  // The one that exists today, pinned the way `gui-119` is: growing this set is
  // a real decision about what the fast gate stops covering, and it should have
  // to edit a test that says so out loud.
  test('gui-75 §0 is the declared build requirement, and this gate does not run it', () => {
    expect(needBuild.map((c) => c.driver)).toEqual(['gui-75.mjs'])
    expect(pure.map((c) => c.driver)).not.toContain('gui-75.mjs')
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

describe('checks this gate declines to run for a stated build requirement (#141)', () => {
  for (const { driver, check } of needBuild) {
    test.skip(
      `${driver} › ${check.name} — build-artifact: reads ${check.needsBuild!.artifact}, ` +
        `executed by \`npm run test:dom\` against a build proven newer than ${check.needsBuild!.covers.join(', ')}`,
      () => {}
    )
  }
})

// #141 opened a gap that did not exist before it: `gui-75` is the FIRST driver
// to have a sidecar AND sit in `DOM_SKIP`. Every earlier sidecar belonged to a
// driver the phase launches, so "has a sidecar" and "is executed somewhere"
// were the same claim and nothing had to distinguish them.
//
// They are now different claims, and the block above this one would quietly
// stop mentioning `gui-75` — it lists drivers with NO sidecar, and `gui-75` has
// one. Its browser half is still executed nowhere. Under #145's rule that a
// deficit belongs where the reader is looking rather than in a footnote, it
// gets its own named skip instead of disappearing into a green.
describe('drivers whose sidecar runs but whose own assertions do not (reported, not omitted)', () => {
  const partial = sidecars.map(driverOf).filter((d) => manifest.DOM_SKIP.has(d))
  for (const d of partial) {
    test.skip(
      `${d} — its sidecar's checks run, but the driver itself is NOT launched anywhere: ${manifest.DOM_SKIP.get(d)}`,
      () => {}
    )
  }

  // Not a formality: if this set ever empties by accident — someone deletes a
  // sidecar, or un-skips a driver — the skips above vanish silently, which is
  // the exact shape of omission this whole file exists to make loud.
  test('the partially-covered set is exactly gui-75, which is where #141 put it', () => {
    expect(partial).toEqual(['gui-75.mjs'])
  })
})
