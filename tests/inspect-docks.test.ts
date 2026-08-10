import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #133 — the link between `inspect.mjs` and the three right-hand docks it now
// photographs, pinned at BOTH ENDS.
//
// The hole this closes is the one #132 measured and this ticket widens. Nothing
// in the gate runs `inspect.mjs`: it needs a build, an Electron window and about
// forty seconds, so it is driven by a human or by a gauntlet wave and by nothing
// else. That makes every selector inside it a piece of the renderer's contract
// that the renderer does not know it owes. Rename `aria-label="Agents panel"` in
// `Titlebar.tsx` and the app is still correct, the suite is still green, and the
// instrument quietly stops reaching a third of the window's chrome — which is
// the exact drift #133 exists to end, reappearing one layer up.
//
// So this reads BOTH files as text and asserts the two halves still name each
// other. It deliberately does NOT import `inspect.mjs`: that module launches
// Electron at import time, and a unit test must not.
//
// WHAT WAS ALREADY COVERED, measured by mutating the renderer rather than by
// grepping for the attribute — the grep said "pinned nowhere" and the mutation
// refuted it, which is worth recording because the grep is the obvious check and
// it is wrong here. BOTH halves are already pinned renderer-side. The toggles go
// through `getByRole('button', { name: 'Agents panel' })`, and the asides through
// `getByRole('complementary', { name: 'Commands' })` in `commands-dock.test.tsx`
// and `appearance-dock.test.tsx`. Neither pin contains the literal string
// `aria-label="Commands"`, which is exactly why searching for it finds nothing
// and concludes the wrong thing: an accessible-name query pins the label without
// ever spelling it as an attribute.
//
// So this file adds exactly ONE thing, and it is not the existence of a label:
// the DRIVER's copy of these strings is asserted to match the renderer's.
// Renaming a dock reds six existing tests, those tests get updated alongside the
// component, the suite goes green again, and `inspect.mjs` is left holding a name
// nothing answers to. A working app, a green gate, and a blind instrument.
//
// What it cannot check, stated so the coverage is not overread: that the toggle
// opens the dock, that the dock renders, that the capture is not blank. Those
// need a live window and belong to the driver itself, which fails loudly on all
// three (see `openDock` and `capture`).

const REPO = path.resolve(import.meta.dirname, '..')
const read = (rel: string): string => readFileSync(path.join(REPO, rel), 'utf8')

const INSPECT = read('.claude/skills/run-desktop/inspect.mjs')
const TITLEBAR = read('src/renderer/src/components/Titlebar.tsx')

// name — the aside's aria-label, which is what `inspect.mjs` selects on and the
// only attribute that separates three asides all wearing `agents-dock`.
// toggle — the titlebar control's aria-label, which is what it clicks.
const DOCKS = [
  { name: 'Agents', toggle: 'Agents panel', component: 'AgentsDock.tsx', file: 'agents-dock.png' },
  { name: 'Commands', toggle: 'Commands panel', component: 'CommandsDock.tsx', file: 'commands-dock.png' },
  {
    name: 'Appearance',
    toggle: 'Appearance panel',
    component: 'AppearanceDock.tsx',
    file: 'appearance-dock.png'
  }
]

describe('inspect.mjs reaches the three right-hand docks', () => {
  for (const dock of DOCKS) {
    describe(dock.name, () => {
      test('the driver selects the aside by its aria-label', () => {
        expect(INSPECT).toContain(`aside[aria-label="${dock.name}"]`)
      })

      test('the dock component still carries that aria-label', () => {
        expect(read(`src/renderer/src/components/${dock.component}`)).toContain(
          `aria-label="${dock.name}"`
        )
      })

      test('the driver clicks a titlebar control that still exists', () => {
        expect(INSPECT).toContain(`open: '${dock.toggle}'`)
        expect(TITLEBAR).toContain(`aria-label="${dock.toggle}"`)
      })
    })
  }

  // The three asides all wear `agents-dock`, so a class-based selector would
  // match whichever dock happened to be open and file it under the wrong name.
  // This is the assertion that keeps the driver off that road: it may not select
  // a dock by that class. Cheap, and it pins the reason the selectors look the
  // way they do rather than leaving it in a comment nobody re-reads.
  test('no dock is selected by the class all three share', () => {
    expect(INSPECT).not.toMatch(/selector:\s*'[^']*\.agents-dock/)
  })

  // The zoom key is the third string the driver borrows from the renderer, and
  // the only one whose owner has already announced it will change: `useZoom`
  // versions it precisely so a new default can win over every stored level, and
  // its comment says "Bump again on the next default change". When that happens
  // the driver would go on seeding a key nothing reads, the app would mount at
  // the new default, and the Appearance capture would quietly print a percentage
  // that disagrees with the window again — the exact defect the seed exists to
  // remove, returning silently. This is the pin that makes the bump loud.
  test('the driver seeds the zoom key useZoom actually reads', () => {
    const useZoom = read('src/renderer/src/useZoom.ts')
    const key = useZoom.match(/const STORAGE_KEY = '([^']+)'/)?.[1]
    expect(key, 'useZoom.ts no longer declares STORAGE_KEY the way this test reads it').toBeTruthy()
    expect(INSPECT).toContain(`window.localStorage.setItem('${key}', '1')`)
  })

  // The captures are addressed by filename in `.gauntlet/bar/` and in any wave
  // that scopes itself to one surface, so a rename is a break for a reader who
  // never opens this file. Derived from the surface name in the driver, so this
  // holds the two together rather than restating the list.
  test('each dock capture keeps its published filename', () => {
    for (const dock of DOCKS) {
      expect(INSPECT).toContain(`name: '${dock.file.replace(/\.png$/, '')}'`)
    }
  })
})
