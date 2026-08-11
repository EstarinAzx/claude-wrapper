// #148 — the sessions rail's fixture, and the reason it is a module rather than
// three more constants inside `inspect.mjs`.
//
// The driver launches Electron at import, so nothing inside it can be run by the
// fast gate. Everything in this file is a CLAIM ABOUT DETERMINISM, and a claim of
// that kind is exactly what source text cannot honestly check: "these ages render
// a stable label" is not a property you can grep for. #142 moved
// `inspect-workspace.mjs` out for the same reason and
// `tests/inspect-sessions-fixture.test.ts` runs this one against the app's REAL
// grouping function.
//
// WHAT WAS WRONG. `inspect.mjs`'s header claims the whole instrument is
// fixture-driven. The sessions rail was the one surface where that was false: it
// listed this machine's real store through `session:list`, so `sidebar.png` and
// `window-session.png` were the only two captures that could never be
// byte-compared, and #137 had to exclude them from its own acceptance.
//
// Measured off the five committed wave captures rather than argued: the rail's
// foreign-session footer reads 950, 951, 952 and 953 in waves 2, 3, 4 and 5. That
// number is this machine's real session count and it only ever goes up. It is
// also the ONLY real-store value that reaches the pixels — the ~100 rows the
// ticket found in `aside.sidebar`'s innerHTML sit below a 658px fold and never
// photograph, which is why the ticket's "two captures contain real session
// titles" was corrected down at triage.
//
// WHY OFFSETS AND NOT TIMESTAMPS. The rail renders a RELATIVE age (`relTime` in
// `Sidebar.tsx`), so a fixed epoch value renders a different string every day and
// fixes nothing. Each row below is therefore an offset from run time, chosen to
// sit well inside its bucket: `relTime` buckets at 60s, 60m, 24h and 7d, and an
// age landing near an edge would tick to the next label part-way through a slow
// run. The test asserts the margin mechanically and re-reads those four
// boundaries out of `Sidebar.tsx`, so a change to the formatter reds here rather
// than surfacing as a capture nobody can diff.
//
// WHY FIVE ROWS AND NOT ONE. The seeded session alone would render a rail of one
// row, which is what the captures show today only because the real store happens
// to hold one session for a fresh temp workspace. A fixture replacing a real list
// must not leave the surface LESS representative than what it replaced: the rail
// is photographed to be judged on row rhythm, and one row shows a critic nothing
// about rhythm — the same argument this instrument already makes for the chat
// transcript being two turns and two tool cards rather than a single "hello".
//
// These titles are PHOTOGRAPHED, so they follow the product's copy rules the way
// the transcript and commands fixtures do: no em dashes, and no title so long it
// is only ever seen truncated.

const MINUTE = 60_000

// Foreign rows exist only so the rail's "N sessions outside this project" footer
// renders. Under the rail's default `project` scope `groupSessions` filters them
// out BEFORE grouping, so their titles and paths never enter the DOM at all —
// they are counted, not drawn. They are still written as obviously synthetic
// values, because that is what keeps the fixture safe if a run ever captures the
// rail at `all` scope.
export const FOREIGN_COUNT = 12

// Ages in minutes, newest first. The seeded row leads, which is also where the
// rail sorts it (`matched.sort((a, b) => b.lastUpdated - a.lastUpdated)`).
//
// Every value has at least 20 minutes of headroom before its label ticks up,
// which is the only direction it can move — the offsets are stamped once at
// script start and the capture happens later:
//   90m   -> "1h"   (bucket [60m, 120m),    30m of headroom)
//   200m  -> "3h"   (bucket [180m, 240m),   40m)
//   450m  -> "7h"   (bucket [420m, 480m),   30m)
//   3600m -> "2d"   (bucket [2880m, 4320m), 720m)
//   7920m -> "5d"   (bucket [7200m, 8640m), 720m)
//
// The seeded row is deliberately NOT "now". A zero offset renders "now" for
// exactly 60 seconds, which is the one label a slow run can change under itself,
// and the whole point of this file is that nothing on this surface moves.
const IN_PROJECT = [
  { slug: 'seeded', ageMinutes: 90, title: null },
  {
    slug: '7c1d4a90',
    ageMinutes: 200,
    title: 'Rewriting the tool card so a long Read result truncates instead of pushing the composer off screen'
  },
  {
    slug: '2f83be15',
    ageMinutes: 450,
    title: 'Add the queued send flag to the draft rather than a copy of it'
  },
  {
    slug: '9a5e07c3',
    ageMinutes: 3600,
    title: 'Why does the Agents dock blank while it refreshes?'
  },
  {
    slug: 'd4b62f88',
    ageMinutes: 7920,
    title: 'Window bounds are remembered but a close inside the debounce loses them'
  }
]

/**
 * The list installed over `session:list` in main.
 *
 * @param {{ sid: string, title: string, workspace: string, now: number }} opts
 *   `sid` and `title` are the seeded session's — its row is the one the driver
 *   clicks to open the chat, so it must carry the real id and the real workspace
 *   or the click opens nothing. `now` is passed in rather than read here so the
 *   whole fixture is a pure function of its inputs and the test can drive it.
 * @returns {{ sessions: object[], inProject: number, outside: number }}
 */
export const buildSessionsFixture = ({ sid, title, workspace, now }) => {
  const sessions = IN_PROJECT.map((row) => ({
    id: row.slug === 'seeded' ? sid : `inspect-${row.slug}`,
    title: row.title ?? title,
    lastUpdated: now - row.ageMinutes * MINUTE,
    cwd: workspace
  }))

  for (let i = 0; i < FOREIGN_COUNT; i++) {
    sessions.push({
      id: `inspect-foreign-${i}`,
      title: `Fixture session ${i + 1} in another project`,
      // Never rendered under `project` scope, and synthetic if it ever is.
      cwd: `/inspect/fixture/project-${i % 4}`,
      lastUpdated: now - (i + 1) * 37 * MINUTE
    })
  }

  return { sessions, inProject: IN_PROJECT.length, outside: FOREIGN_COUNT }
}

/** The ages this fixture claims are stable, in minutes. Read by the test. */
export const inProjectAgeMinutes = () => IN_PROJECT.map((r) => r.ageMinutes)
