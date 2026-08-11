// The driver set, and the one place that says which drivers run where (#135).
//
// #132 put the drivers' SOURCE-LEVEL assertions into `npm test` and reported the
// rest as named skips. This file is the other half: it names the set itself, so
// the fast gate and the DOM phase cannot disagree about what "every driver"
// means. Both import from here — `tests/gui-source-assertions.test.ts` to prove
// nothing is silently omitted, `dom-phase.mjs` to decide what to launch.
//
// THE SPLIT, in one sentence: `npm test` runs the pure checks in milliseconds,
// `npm run test:dom` launches a real Electron window per driver and takes about
// twenty minutes. Neither covers the other, and the fast gate says so out loud.

import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const DRIVER_DIR = path.resolve(import.meta.dirname)
const APP_DIR = path.resolve(DRIVER_DIR, '../../..')

// A `.source.mjs` file is a sidecar, not a driver. Excluded from the driver list
// so a covered driver is never also counted as one of its own sidecars.
const isSidecar = (f) => f.endsWith('.source.mjs')

// The set is `gui-*.mjs`, which is #132's convention and not an accident of
// globbing. Five other `.mjs` files live in this directory and are deliberately
// NOT members, named here so their absence is a decision on the record rather
// than something nobody noticed:
//
//   driver.mjs   reads the two titlebar pills and screenshots. A hand tool for
//                "is it running", with no ticket and no criteria behind it.
//   inspect.mjs  the gauntlet's `inspect:` command. It does assert (each of the
//                seven surfaces is proven present and painted before capture,
//                and a shortfall exits non-zero), but it exists to PRODUCE the
//                captures a critic grades, and the phase would double its
//                runtime to re-prove what the next gauntlet wave proves anyway.
//                It takes a private profile like every driver (#147) even though
//                it is not one, because it normalises zoom and resizes the window
//                and a human runs it by hand; `tests/driver-profile.test.ts`
//                carries that as its own case.
//   inspect-workspace.mjs
//                #142. Not an executable at all — a module `inspect.mjs`
//                imports, holding the fixture workspace's fixed name and its
//                clean-if-stale rule. It runs in the FAST gate instead
//                (`tests/inspect-fixture-workspace.test.ts`), which is the
//                whole reason those three lines live outside the driver: the
//                driver cannot be imported without launching Electron.
//   inspect-sessions.mjs
//                #148. Also not an executable — the sessions rail's fixture,
//                holding the row set and the age offsets that replace this
//                machine's real store in `sidebar.png` and `window-session.png`.
//                Outside the driver for the same reason as the file above, and
//                run by the fast gate in `tests/inspect-sessions-fixture.test.ts`
//                against the app's real `groupSessions`.
//   driver-profile.mjs
//                #147. Not an executable either — the module every driver spreads
//                into its `electron.launch({ args })` to get a private `userData`
//                directory. It is not a driver because it launches nothing and
//                asserts nothing; what it does is make isolation a property of
//                the launch rather than of whether an author remembered. The
//                convention it carries IS executed, by
//                `tests/driver-profile.test.ts` in the fast gate.
//
/** Every `gui-*.mjs` driver, sorted. The definition of "the driver set". */
export const listDrivers = () =>
  readdirSync(DRIVER_DIR)
    .filter((f) => f.startsWith('gui-') && f.endsWith('.mjs') && !isSidecar(f))
    .sort()

/** Every `gui-<n>.source.mjs` sidecar, sorted. */
export const listSidecars = () =>
  readdirSync(DRIVER_DIR)
    .filter((f) => f.startsWith('gui-') && isSidecar(f))
    .sort()

/** `gui-96.source.mjs` → `gui-96.mjs`. */
export const driverOf = (sidecar) => sidecar.replace(/\.source\.mjs$/, '.mjs')

// ── #141: loading the checks, in ONE place ────────────────────────────────
// The gate used to glob the sidecars here and then import them itself. That was
// two enumerations of "the check set", and this file exists precisely because
// two enumerations of a set drift. Now both readers call `loadChecks()`: the
// fast gate to turn the pure ones into tests, the DOM phase to execute the ones
// that declare a build requirement.

/**
 * Every sidecar's checks, flattened and tagged with where each came from.
 * `[{ sidecar, driver, check }]`, in sidecar order.
 */
export const loadChecks = async () => {
  const out = []
  for (const f of listSidecars()) {
    const mod = await import(pathToFileURL(path.join(DRIVER_DIR, f)).href)
    for (const check of mod.checks) out.push({ sidecar: f, driver: driverOf(f), check })
  }
  return out
}

/**
 * The checks that declare `needsBuild` — the ones the fast gate reports as
 * named skips and the DOM phase runs. The same shape as `domPhaseDrivers()`
 * one level down: a named set both runners agree on rather than each deciding.
 */
export const buildRequiringChecks = async () => (await loadChecks()).filter((c) => c.check.needsBuild)

/**
 * The newest mtime at `abs`: the file's own, or the newest anywhere beneath it
 * when `abs` is a directory. `null` when nothing is there.
 *
 * Recursive because a bundle is built from a TREE. `covers: ['src/main']` has
 * to mean every module the bundle contains — pinning one entry file would let
 * an edit to any sibling pass as fresh, which is most of the tree.
 */
export const latestMtime = (abs) => {
  let st
  try {
    st = statSync(abs)
  } catch {
    return null
  }
  if (!st.isDirectory()) return st.mtimeMs
  let newest = st.mtimeMs
  for (const e of readdirSync(abs)) {
    const m = latestMtime(path.join(abs, e))
    if (m !== null && m > newest) newest = m
  }
  return newest
}

/**
 * Is a declared build requirement satisfied — `{ artifact, covers }`, both
 * repo-relative — and if not, why?
 *
 * THE POINT, because without this the declaration is decoration: a grep against
 * a stale `out/` passes exactly as happily as one against the current build. So
 * the artifact has to be at least as new as every source it claims to cover,
 * and a check whose build predates its sources FAILS rather than passing
 * quietly on yesterday's bytes.
 *
 * `mtimeOf` is injectable so the rule itself is testable without a build —
 * a staleness rule that can only be exercised when the tree happens to be stale
 * is one nobody ever watches work.
 *
 * `>` and not `>=`: a build produced in the same filesystem tick as the last
 * edit is fresh. A coarse clock would otherwise call every good build stale,
 * and a check that reds on correct input gets switched off.
 *
 * A `covers` path that does not exist is IGNORED rather than treated as newer.
 * It is a typo or a deleted directory, and failing on it would red every run
 * with nothing to act on.
 */
export const buildRequirementStatus = (req, mtimeOf = (p) => latestMtime(path.join(APP_DIR, p))) => {
  const artifactMs = mtimeOf(req.artifact)
  if (artifactMs === null) return { ok: false, reason: 'missing', artifact: req.artifact, stale: [] }
  const stale = req.covers.filter((c) => {
    const m = mtimeOf(c)
    return m !== null && m > artifactMs
  })
  return { ok: stale.length === 0, reason: stale.length ? 'stale' : 'fresh', artifact: req.artifact, stale }
}

// Drivers the DOM phase does NOT launch, each with the reason it cannot be
// launched unattended. Every entry here is a contract nobody is checking, so the
// reason has to be a fact about the driver rather than a preference — "slow" is
// not a reason (the whole phase is slow), and neither is "it was red".
//
// Two reasons exist, and they are genuinely different:
//
//   api-cost   the driver drives one or more REAL CLI turns. That needs an API
//              key, network and credits, and the result depends on a model's
//              output. A phase that spends money per run is a phase that gets
//              switched off.
//   no-verdict the driver computes no pass/fail at all. Its exit code carries no
//              information, so running it would add a green that measures
//              nothing — worse than a skip, because a skip is legible.
//   desktop-exclusive
//              the driver's witness IS the desktop foreground — real focus
//              transitions, and a screen capture of the window rectangle — which
//              a batch cannot hand it while other apps are opening and closing.
//              This one is the easiest to abuse, so it carries the highest bar:
//              an entry here needs the driver PASSING alone and failing in the
//              batch, measured, not a red somebody got tired of.
//
// A driver that merely SPAWNS the CLI without starting a turn (gui-91's
// `claude agents --json`, gui-124's `model:list`) is NOT listed: those cost
// nothing, and on a machine with no `claude` on PATH the driver's own assertion
// reds with that explanation. That is a real failure, not a skip.
export const DOM_SKIP = new Map([
  [
    'gui-48.mjs',
    'api-cost: drives one real CLI turn — a refusal is only a refusal if the turn it refused against actually ran'
  ],
  ['gui-52.mjs', 'api-cost: drives a real CLI turn, because the model pill moves on the NEXT turn rather than on the pick'],
  ['gui-73.mjs', 'api-cost: drives three real CLI turns (plant a number, resume it, continue it through a rebuilt engine)'],
  ['gui-74.mjs', 'api-cost: drives one real CLI turn through the contextBridge under `sandbox: true`'],
  [
    'gui-75.mjs',
    'api-cost: drives real turns ending minimised, blurred and focused, to prove the notification fires exactly once and only when unseen'
  ],
  ['gui-80.mjs', 'api-cost: drives two real CLI turns and budgets ten minutes for them'],
  ['gui-129.mjs', 'api-cost: drives one real CLI turn, because there is nothing to rewind until a turn has edited a file'],
  [
    // Measured on 2026-08-11 rather than assumed, because "it went red in the
    // batch" is not a reason and this category would be the easy place to hide
    // one. Standalone: `BLURCALLS ["acrylic","acrylic","acrylic"]`, stress 8/8,
    // PASS — twice, once bare and once through this very harness with `--only`.
    // In the full run, immediately after two other Electron apps had launched
    // and closed: zero blur calls and 7/8. The keeper is wired; what the batch
    // takes away is the foreground. Run it alone:
    //   npm run test:dom -- --only gui-119.mjs
    'gui-119.mjs',
    'desktop-exclusive: both witnesses are the real desktop — a genuine focus loss, and a PowerShell CopyFromScreen of the window rectangle. Passes alone (blur calls x3, stress 8/8) and fails in the batch (zero calls, 7/8), so what a batch run measures is the foreground, not the keeper'
  ],
  [
    'gui-scope-zoom-pill.mjs',
    'no-verdict: logs pill metrics and screenshots and never computes a pass/fail, so its exit code would report a green that measured nothing'
  ]
])

/** Drivers the DOM phase launches: the whole set minus the accounted skips. */
export const domPhaseDrivers = () => listDrivers().filter((d) => !DOM_SKIP.has(d))

// ── #145: the skips the phase's VERDICT has to carry, not merely list ─────
// The quarantine was accepted for `gui-119`, and the objection that came with
// the acceptance is the part that shapes this: a printed postscript "converts a
// failing phase assertion into optional operator behaviour and launders the main
// phase green". Listing the skip below a `DOM PHASE PASS` is exactly that
// postscript. So the deficit moves INTO the verdict line.
//
// ONLY `desktop-exclusive` COUNTS, and the distinction is not squeamishness
// about the other two — it is whether a reader can act:
//
//   desktop-exclusive  a contract that CAN be checked, by a human, with one
//                      command on an idle desktop. Until somebody runs it, the
//                      phase has not checked it, and the reader can close it.
//   api-cost           a standing decision about money, a key and a network, not
//                      an oversight anybody clears by remembering.
//   no-verdict         no contract to leave uncovered — the driver computes no
//                      pass/fail, which is why it is not launched.
//
// Counting all nine would print a number on the last line that nobody can ever
// drive to zero, and a warning nobody can clear becomes furniture. This one is
// closeable, which is the only reason it is worth interrupting a green for.
const UNCOVERED_CATEGORY = 'desktop-exclusive:'

/**
 * Skips that represent a contract a human can still go and check.
 * `[driver, reason]` pairs, in `DOM_SKIP` order.
 */
export const uncoveredContracts = () => [...DOM_SKIP.entries()].filter(([, r]) => r.startsWith(UNCOVERED_CATEGORY))

/**
 * The phase's own verdict word, given what failed and what was never checked.
 *
 * Lives here rather than in `dom-phase.mjs` for the reason #142 and #148 both
 * hit: that file spawns drivers at import, so the fast gate cannot execute a
 * line of it. A rule the gate cannot run is a rule that goes quietly wrong —
 * which is the whole subject of the phase this rule belongs to.
 *
 * The precedence is deliberate: a contract that WAS checked and broke outranks
 * one that was never checked, because the first is a defect and the second is
 * an errand.
 */
export const phaseVerdict = (badCount, uncoveredCount) =>
  badCount > 0 ? 'FAIL' : uncoveredCount > 0 ? 'INCOMPLETE' : 'PASS'
