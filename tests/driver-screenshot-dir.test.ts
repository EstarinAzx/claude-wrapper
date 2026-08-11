import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #146 - every driver writes its captures where it is told to, and never into
// the repository.
//
// THE DEFECT THIS CLOSES. `dom-phase.mjs` hands each driver its own output
// directory through `SCREENSHOT_DIR`. Thirty-four drivers read it. Four -
// gui-119, gui-122, gui-123, gui-124 - hardcoded `scripts/gui-<n>-shots/`
// instead, and those directories were tracked. So one `npm run test:dom` left
// the working tree holding rewritten binaries, and the next agent to run
// `git add -A` committed PNG churn it never looked at. #135 worked around it
// with `git checkout -- scripts/` and wrote the workaround into the skill as a
// gotcha, which is a note, not a fix.
//
// WHY A TEST AND NOT JUST THE FIX. The convention was already unanimous in
// thirty-four files and still drifted in four, because a convention that
// nothing executes is a style preference. This is the cheapest thing that
// notices. It is the same lesson as #149 one level up: there, a list restated
// in prose rotted against the code; here, a line copied between files rotted
// against its own intent.
//
// TWO DISTINCT DEFECTS, HELD SEPARATELY, because closing only the first leaves
// the ticket half-done in a way that reads as finished:
//
//   1. A driver that ignores `SCREENSHOT_DIR` scatters a phase run's captures
//      across fixed paths, so the per-driver isolation the phase sets up does
//      not exist for it.
//   2. A driver whose fallback points inside the repository still dirties the
//      tree on every manual run. Honouring the variable and defaulting into
//      `scripts/` would pass (1) and reintroduce the exact churn this ticket
//      is about.
//
// WHAT IT CANNOT CHECK, stated so the coverage is not overread: that a driver
// actually writes to the directory it computed, that it cleans up after
// itself, or that two drivers sharing the default directory do not overwrite
// each other's files by name. Those need the drivers to run. This reads source
// text and nothing more.

const DRIVER_DIR = path.resolve(import.meta.dirname, '../.claude/skills/run-desktop')

// The declaration only, not the whole file: `gui-119` legitimately joins
// APP_DIR elsewhere to find `electron.exe`, and a file-wide scan would call
// that a screenshot path.
const declarations = (): { file: string; decl: string }[] =>
  readdirSync(DRIVER_DIR)
    .filter((f) => f.endsWith('.mjs'))
    .map((file) => ({
      file,
      decl: readFileSync(path.join(DRIVER_DIR, file), 'utf8').match(/^const SHOT_DIR = .*$/m)?.[0]
    }))
    .filter((d): d is { file: string; decl: string } => d.decl !== undefined)

describe('driver screenshot destinations', () => {
  // The discrimination control. Every assertion below iterates this list, so a
  // parse that silently returned nothing would make the file pass by finding no
  // driver to accuse - the shape of vacuous green this repo has already been
  // bitten by once. The floor is deliberately well under the real count so
  // retiring a driver does not red an unrelated ticket.
  test('the drivers still declare SHOT_DIR the way this test reads it', () => {
    expect(
      declarations().length,
      `no SHOT_DIR declarations found under ${DRIVER_DIR} - the parse, not the drivers, is what broke`
    ).toBeGreaterThan(30)
  })

  test('every driver honours SCREENSHOT_DIR', () => {
    const deaf = declarations()
      .filter((d) => !d.decl.includes('process.env.SCREENSHOT_DIR'))
      .map((d) => d.file)

    expect(
      deaf,
      `these drivers ignore the directory dom-phase.mjs hands them: ${deaf.join(', ')}`
    ).toEqual([])
  })

  test('no driver defaults its captures into the repository', () => {
    const inTree = declarations()
      .filter((d) => /APP_DIR|__dirname|import\.meta\.dirname/.test(d.decl))
      .map((d) => d.file)

    expect(
      inTree,
      `these drivers write captures inside the repo by default, so a manual run dirties the tree: ${inTree.join(', ')}`
    ).toEqual([])
  })
})
