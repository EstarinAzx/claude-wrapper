import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, test } from 'vitest'
import { groupSessions } from '../src/shared/session-groups'
import type { SessionMeta } from '../src/shared/session-types'

// #148 — the sessions rail `inspect.mjs` photographs is a FIXTURE, so
// `sidebar.png` and `window-session.png` stop carrying this machine's real store.
//
// THE DEFECT THIS CLOSES. `inspect.mjs`'s header claims the whole instrument is
// fixture-driven, and the rail was the one surface where that was false. It reads
// `session:list`, which enumerates the real store, so the two captures containing
// it could never be byte-compared and #137 had to exclude them from its own
// acceptance. Measured off the committed evidence rather than argued: the rail's
// "N sessions outside this project" footer reads 950, 951, 952 and 953 in waves
// 2, 3, 4 and 5. That is the machine's real session count, and it only goes up.
//
// WHY THE OBVIOUS TEST IS THE WRONG ONE, and this is the trap the ticket carries
// a warning about. "Run the driver twice and byte-compare" PASSES ON UNFIXED
// CODE: two runs minutes apart on one machine see the same real store, so the
// files are trivially identical. #142's leg ran exactly that check, four times,
// and got a clean result on a rail that was still listing 953 real sessions. The
// instability is across machines and across time, so the surface's stability has
// to be argued from WHAT FEEDS IT.
//
// WHAT THIS FILE CHECKS, therefore: that the fixture is the rail's whole input,
// and that nothing in it is a function of the clock beyond the bucket it was
// chosen to sit in. It runs the app's REAL `groupSessions` over the fixture
// rather than restating what the rail should show, so a change to the grouping
// or scoping rules reds here instead of silently changing a capture.
//
// WHAT THIS CANNOT CHECK, stated so the coverage is not overread:
//
//   * that the stub actually installs in a running app. That needs the driver, a
//     built app and Electron. `inspect.mjs` reads the rail back and compares it
//     to this fixture before any capture, which is where that is proven, and the
//     last block below is only the drift guard that the driver still does it.
//   * that the two captures are now byte-identical across MACHINES. Nothing in a
//     single-machine gate can see that. What is checkable is that every input the
//     rail renders comes from this file, which is the premise that comparison
//     would rest on.

interface SessionsModule {
  FOREIGN_COUNT: number
  buildSessionsFixture: (opts: {
    sid: string
    title: string
    workspace: string
    now: number
  }) => { sessions: SessionMeta[]; inProject: number; outside: number }
  inProjectAgeMinutes: () => number[]
}

const REPO = path.resolve(import.meta.dirname, '..')
const DRIVER_DIR = path.join(REPO, '.claude/skills/run-desktop')

const { FOREIGN_COUNT, buildSessionsFixture, inProjectAgeMinutes } = (await import(
  pathToFileURL(path.join(DRIVER_DIR, 'inspect-sessions.mjs')).href
)) as SessionsModule

const INSPECT = readFileSync(path.join(DRIVER_DIR, 'inspect.mjs'), 'utf8')
const SIDEBAR = readFileSync(
  path.join(REPO, 'src/renderer/src/components/Sidebar.tsx'),
  'utf8'
)

// The seeded session's real inputs, as the driver passes them.
const SID = '11111111-2222-3333-4444-555555555555'
const TITLE = 'Why does the sessions rail go empty after I flip the backend pill?'
const WORKSPACE = 'C:\\Temp\\inspect-ws'
const NOW = 1_760_000_000_000

const build = () => buildSessionsFixture({ sid: SID, title: TITLE, workspace: WORKSPACE, now: NOW })

// The rail's own call, copied from `Sidebar.tsx`: default scope, no query, one
// page. Anything this test asserts about rows or counts goes through here rather
// than through arithmetic of its own.
const asRailSees = (sessions: SessionMeta[]) =>
  groupSessions(sessions, { limit: 100, cwd: WORKSPACE, scope: 'project' })

describe('the fixture is the whole of what the rail renders', () => {
  test('every row the rail shows is an in-project fixture row', () => {
    const { sessions, inProject } = build()

    const { groups, shown } = asRailSees(sessions)

    expect(shown).toBe(inProject)
    // One workspace means one group heading. More would mean a fixture row
    // carrying a cwd that does not fold to the opened workspace, which would
    // photograph as a second project nobody put there.
    expect(groups).toHaveLength(1)
    expect(groups[0].current, 'the fixture rows do not belong to the open workspace').toBe(true)
    expect(groups[0].label).toBe(WORKSPACE)
  })

  test('the footer count is exactly the foreign rows, and nothing else', () => {
    const { sessions, outside } = build()

    // `Sidebar.tsx` derives the footer as `sessions.length - matched`, so this is
    // the rail's expression rather than a restatement of it.
    const { matched } = asRailSees(sessions)

    expect(sessions.length - matched).toBe(outside)
    expect(outside).toBe(FOREIGN_COUNT)
  })

  test('the seeded session leads the rail, so the driver clicks the right row', () => {
    const { sessions } = build()

    const { groups } = asRailSees(sessions)
    const first = groups[0].sessions[0]

    // The driver finds its row by title prefix and opens it; a fixture row
    // sorting above it would not break the click, but the ACTIVE row in the
    // capture would not be the conversation the chat surface shows.
    expect(first.id).toBe(SID)
    expect(first.title).toBe(TITLE)
    expect(first.cwd).toBe(WORKSPACE)
  })

  test('the foreign rows are counted, never drawn', () => {
    const { sessions } = build()

    const drawn = asRailSees(sessions).groups.flatMap((g) => g.sessions)

    expect(drawn.some((s) => s.id.startsWith('inspect-foreign-'))).toBe(false)
  })
})

describe('nothing in the fixture comes from the machine that runs it', () => {
  // The leak half of the ticket. The rail is the only surface that ever carried
  // real data, and the two committed captures that show it carry a real session
  // count in their pixels.
  test('every cwd is either the opened workspace or an obviously synthetic path', () => {
    const { sessions } = build()

    for (const s of sessions) {
      const synthetic = s.cwd === WORKSPACE || s.cwd?.startsWith('/inspect/fixture/')
      expect(synthetic, `a fixture row carries an unexplained cwd: ${s.cwd}`).toBe(true)
    }
  })

  test('every row is a pure function of the four inputs the driver passes', () => {
    // Two builds with the same inputs must be identical. A row reading the clock,
    // the environment or the real store for itself would not be.
    expect(build()).toEqual(build())
  })
})

describe('the ages render a label that does not tick mid-run', () => {
  // `relTime` in `Sidebar.tsx` buckets a relative age at 60 seconds, 60 minutes,
  // 24 hours and 7 days. These four boundaries are restated rather than imported
  // — the function is module-local to the component — so the block below re-reads
  // them out of the source and reds if the formatter ever changes.
  // Expressed in MINUTES, which is the unit the fixture states its offsets in.
  // `relTime` works in seconds; converting its four boundaries once here is what
  // keeps the arithmetic below readable, and the last test re-reads them.
  const ONE_MINUTE = 1
  const ONE_HOUR = 60
  const ONE_DAY = 24 * ONE_HOUR

  // How long until the rendered string changes. Only the UPPER edge matters: the
  // fixture's `now` is stamped once at script start and the capture happens
  // later, so a row's rendered age only ever grows.
  const minutesUntilLabelChanges = (ageMinutes: number): number => {
    if (ageMinutes < ONE_MINUTE) return ONE_MINUTE - ageMinutes
    if (ageMinutes < ONE_HOUR) return Math.floor(ageMinutes) + 1 - ageMinutes
    if (ageMinutes < ONE_DAY) return (Math.floor(ageMinutes / ONE_HOUR) + 1) * ONE_HOUR - ageMinutes
    return (Math.floor(ageMinutes / ONE_DAY) + 1) * ONE_DAY - ageMinutes
  }

  // A full run is about a minute. Twenty is the margin the fixture claims.
  const MARGIN_MINUTES = 20

  test('every in-project age has headroom before its label ticks', () => {
    for (const age of inProjectAgeMinutes()) {
      expect(
        minutesUntilLabelChanges(age),
        `an age of ${age}m sits too close to its bucket edge, so a slow run would photograph a different label`
      ).toBeGreaterThanOrEqual(MARGIN_MINUTES)
    }
  })

  test('no in-project row renders as "now", which is a 60 second bucket', () => {
    // The one label a slow run can change under itself. The rail used to show it
    // on the seeded row because that row's age came from a file written seconds
    // earlier.
    for (const age of inProjectAgeMinutes()) {
      expect(age, 'a fixture row is inside the 60 second "now" bucket').toBeGreaterThanOrEqual(1)
    }
  })

  test('the buckets this fixture is built around are still the ones the app uses', () => {
    const relTime = SIDEBAR.match(/const relTime[\s\S]*?\n}/)?.[0] ?? ''

    expect(relTime, 'relTime is no longer declared the way this test finds it').not.toBe('')
    for (const boundary of ['s < 60', 'm < 60', 'h < 24', 'd < 7']) {
      expect(
        relTime,
        `relTime no longer buckets at ${boundary}, so the fixture's age offsets need re-choosing`
      ).toContain(boundary)
    }
  })
})

describe('inspect.mjs uses it', () => {
  // The drift guard, same role as `inspect-fixture-workspace.test.ts`'s last
  // block: everything above stays green with the driver never installing a stub,
  // and the module would be dead code passing its own tests.
  test('the driver builds its rail from the shared module', () => {
    expect(INSPECT).toContain('inspect-sessions.mjs')
    expect(INSPECT).toContain('buildSessionsFixture')
  })

  test('the driver replaces both of the rail lists in main', () => {
    // Two lists, two sources of real data. Stubbing only the stored transcripts
    // would leave the CLI's live agent view answering for the machine, and would
    // keep a ~893ms CLI process in a run that advertises spending none.
    for (const channel of ['session:list', 'background-sessions:list']) {
      expect(INSPECT, `inspect.mjs no longer replaces ${channel}`).toContain(
        `ipcMain.removeHandler('${channel}')`
      )
      expect(INSPECT).toContain(`ipcMain.handle('${channel}'`)
    }
  })

  test('the driver pins the rail scope it counts the foreign rows under', () => {
    // `sidebar-scope` persists like the zoom level and the dock width. Left
    // unpinned, a profile where someone once clicked "All projects" renders every
    // foreign fixture row instead of counting them.
    expect(INSPECT).toContain("window.localStorage.setItem('sidebar-scope', 'project')")
  })

  test('the driver proves the rail is fixture-fed before photographing it', () => {
    // The assertion the ticket turns on. Without it a stub that failed to install
    // photographs real session data with every other check green.
    expect(INSPECT).toContain('.session-row-btn')
    expect(INSPECT).toContain('sidebar-foot-count')
    expect(INSPECT).toContain('bg-session-row')
  })
})
