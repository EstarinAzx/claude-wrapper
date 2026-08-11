import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #147 - every driver launches Electron against a profile of its own, and never
// against the one the human's app uses.
//
// THE DEFECT THIS CLOSES. `dom-phase.mjs` runs the drivers serially against what
// used to be a single shared `userData` directory. Window bounds are remembered
// across launches (#79) and flushed on close (#110), and the zoom factor is
// persisted per origin in `userData` as well as mirrored in the renderer's
// localStorage. `gui-136` had to pin both to make `setContentSize(640)` mean the
// 640css minimum its ticket names; it wrote them into the shared profile, and
// `gui-69` and `gui-70` then failed in the batch waiting for a composer that was
// off-screen. Both passed alone. Three full phase runs went into attributing it.
//
// WHY A TEST AND NOT JUST THE FIX, which is `driver-screenshot-dir.test.ts`'s
// argument one ticket later and for a sharper reason. There, a convention was
// unanimous in thirty-four files and drifted in four. Here the convention did
// not exist at all: `gui-136` isolated itself and no other driver did, which is
// precisely the opt-in state #147 says produced the ticket. A default that lives
// only in prose protects the drivers whose authors read the prose.
//
// THE HAZARD'S THREE PROPERTIES, which is why it is worth a gate rather than
// vigilance: it is SILENT AT THE SOURCE (the contaminating driver passes, only
// its neighbours red); it is INVISIBLE TO THE OBVIOUS CHECK (an adjacency test -
// run the suspect, then the victim - passed and was briefly taken as
// exoneration, because the effect accumulates through the intervening launches:
// the batch is the instrument and a pair is not); and it LOOKS EXACTLY LIKE
// `desktop-exclusive`, the easiest category in this repo to bury a real red in.
//
// THE TWO WAYS A DRIVER MAY LAUNCH, held apart because the same rule cannot
// cover both:
//
//   inline        `electron.launch({ args })` from playwright-core. Thirty-six
//                 drivers. The profile arrives as `...profileArgs()`, which
//                 `dom-phase.mjs` fills per driver and a manual run mints for
//                 itself.
//   probe spawner `spawn(electronBin, [..., PROBE])` with a `.cjs` that calls
//                 `app.setPath('userData', …)` before ready. Three drivers -
//                 gui-78, gui-79, gui-110 - whose subject IS what a profile
//                 carries between launches. They mint their own `mkdtemp`
//                 profile per run and always did, so they were never reading the
//                 machine's real one, and `--user-data-dir` would not reach
//                 their probe anyway.
//
// The triage expected that second group to need an opt-out - a shared but
// dedicated profile, exempt from the default. Cross-model review objected that
// an opt-out "preserves shared mutable state, so the default isolation does not
// eliminate the original cross-driver channel", which is correct and fatal to
// any design with a list. `scripts/spike-147-driver-profile-isolation.mjs`
// measured that no list is needed: `setPath('userData', X)` beats a
// `--user-data-dir` switch, so those three keep their own profile under any
// phase default. There is no opt-out here, and so no second `DOM_SKIP` for a
// future driver to be quietly added to.
//
// WHAT THIS CANNOT CHECK, stated so the coverage is not overread: that the
// switch actually moved `userData` at runtime (the spike measured that once, on
// this platform, and `dom-phase.mjs` re-checks it per run by fingerprinting the
// shared profile before and after each driver), that a driver does not write
// state somewhere else entirely, or that two drivers handed the same directory
// would not collide. This reads source text and nothing more.

const DRIVER_DIR = path.resolve(import.meta.dirname, '../.claude/skills/run-desktop')

type Driver = { file: string; src: string }

const drivers = (): Driver[] =>
  readdirSync(DRIVER_DIR)
    .filter((f) => f.startsWith('gui-') && f.endsWith('.mjs') && !f.endsWith('.source.mjs'))
    .sort()
    .map((file) => ({ file, src: readFileSync(path.join(DRIVER_DIR, file), 'utf8') }))

// The call site's `args` line, not the whole file - `driver-screenshot-dir`'s
// rule, and it is not hypothetical here: `gui-78.mjs` spends a paragraph
// explaining why it deliberately does NOT use Playwright, and a file-wide scan
// for `electron.launch(` reads that prose as a call and accuses it of launching
// against the real profile. Every inline call site in this set is one line and
// ends with the `'.'` that names the app.
const ARGS = /^\s*args: \[.*'\.'\],$/m
const argsLine = (d: Driver) => ARGS.exec(d.src)?.[0] ?? null
const inline = (d: Driver) => argsLine(d) !== null
const probeSpawner = (d: Driver) => /spawn\(\s*electronBin/.test(d.src)

describe('driver profile isolation (#147)', () => {
  // The discrimination control, for the reason driver-screenshot-dir.test.ts
  // gives: every assertion below iterates a filtered list, so a parse that
  // silently matched nothing would pass by finding no driver to accuse. The
  // floors sit well under the real counts so retiring a driver does not red an
  // unrelated ticket.
  test('the drivers still launch Electron the two ways this test reads', () => {
    const all = drivers()
    expect(all.length, `no drivers found under ${DRIVER_DIR} - the parse, not the drivers, is what broke`).toBeGreaterThan(30)
    expect(all.filter(inline).length, 'no inline electron.launch call sites found - the parse broke').toBeGreaterThan(30)
    expect(all.filter(probeSpawner).length, 'no probe-spawning drivers found - the parse broke').toBeGreaterThan(2)
    expect(
      all.filter((d) => !inline(d) && !probeSpawner(d)).map((d) => d.file),
      'these drivers launch Electron in neither known way, so no rule below applies to them'
    ).toEqual([])
  })

  test('every driver that launches Electron inline is handed a private profile', () => {
    const bare = drivers()
      .filter(inline)
      .filter((d) => !argsLine(d)!.includes('...profileArgs()'))
      .map((d) => d.file)

    expect(
      bare,
      `these drivers launch against the machine's real userData, so whatever they pin outlives them: ${bare.join(', ')}`
    ).toEqual([])
  })

  test('and gets it from the one module that decides where profiles live', () => {
    const unsourced = drivers()
      .filter((d) => d.src.includes('profileArgs'))
      .filter((d) => !/import \{[^}]*profileArgs[^}]*\} from '\.\/driver-profile\.mjs'/.test(d.src))
      .map((d) => d.file)

    expect(unsourced, `these drivers name profileArgs without importing it: ${unsourced.join(', ')}`).toEqual([])
  })

  // The rule that keeps the mechanism single. A driver rolling its own switch
  // would be isolated and would also be invisible to `dom-phase.mjs`, which
  // hands out the directories and removes them afterwards - so its profile would
  // survive the run, which is half of what this ticket is about.
  test('no driver hand-rolls its own --user-data-dir', () => {
    const rogue = drivers()
      .filter(inline)
      .filter((d) => argsLine(d)!.includes('--user-data-dir'))
      .map((d) => d.file)

    expect(
      rogue,
      `these drivers set --user-data-dir directly instead of spreading profileArgs(): ${rogue.join(', ')}`
    ).toEqual([])
  })

  // `inspect.mjs` is not in the driver set (it produces the gauntlet's captures
  // rather than asserting), so no rule above reaches it - and it launches
  // Electron against the same profile every driver used to, whenever a human or
  // a gauntlet wave invokes it. #147's own ticket lists it as a candidate, and
  // the file itself used to carry a comment deferring the fix here. Held as its
  // own test rather than folded into `drivers()` because the counts and the
  // probe rule above are statements about the driver set specifically.
  test('inspect.mjs launches against a private profile too', () => {
    const src = readFileSync(path.join(DRIVER_DIR, 'inspect.mjs'), 'utf8')
    const line = ARGS.exec(src)?.[0] ?? null

    expect(line, 'inspect.mjs no longer has an args line this test can read - the parse is what broke').not.toBeNull()
    expect(
      line,
      'inspect.mjs launches against the real userData, so a capture run leaves its normalised zoom and resized window behind'
    ).toContain('...profileArgs()')
  })

  test("every probe-spawning driver's probe sets its own userData before ready", () => {
    const deaf = drivers()
      .filter(probeSpawner)
      .filter((d) => {
        const probe = path.join(DRIVER_DIR, d.file.replace(/\.mjs$/, '-probe.cjs'))
        let src: string
        try {
          src = readFileSync(probe, 'utf8')
        } catch {
          return true
        }
        return !/app\.setPath\('userData'/.test(src)
      })
      .map((d) => d.file)

    expect(
      deaf,
      `these drivers spawn Electron with a probe that never claims a profile, so they run against the real one: ${deaf.join(', ')}`
    ).toEqual([])
  })
})
