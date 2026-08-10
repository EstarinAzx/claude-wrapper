import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #137 — the link between `inspect.mjs` and the Welcome pane it now photographs
// a SECOND time, at the enforced minimum window size.
//
// The hole this closes is the one the ticket opens with. The Welcome hero's
// layout rests on a height budget argued entirely in a `chat.css` comment:
// content plus padding against the pane a 480px-tall window leaves. Nothing ever
// took a picture of it, and a one-pixel error at the root of that sum (49px
// charged for a 48px titlebar) once survived a full review cycle because every
// dependent figure was wrong by the same one. Arithmetic that nothing photographs
// is arithmetic nobody can check.
//
// Same shape as `inspect-docks.test.ts`, and for the same reason: nothing in the
// gate runs `inspect.mjs`, so every constant inside it is a piece of somebody
// else's contract that the owner does not know it owes. These read both files as
// text and assert the two halves still name each other. They deliberately do NOT
// import `inspect.mjs` — that module launches Electron at import time.
//
// What they cannot check, stated so the coverage is not overread: that the
// resize happens, that the hero fits, that the headroom matches the comment.
// Those need a live window and belong to the driver, which fails loudly on all
// three and prints the measured sum next to the claimed one.

const REPO = path.resolve(import.meta.dirname, '..')
const read = (rel: string): string => readFileSync(path.join(REPO, rel), 'utf8')

const INSPECT = read('.claude/skills/run-desktop/inspect.mjs')
const MAIN = read('src/main/index.ts')
const WELCOME = read('src/renderer/src/components/Welcome.tsx')

// The published name of the second capture. Addressed by filename in
// `.gauntlet/bar/` and by any wave that scopes itself to one surface, exactly
// like the dock captures, so a rename is a break for a reader who never opens
// this file.
const MIN_CAPTURE = 'welcome-min-window'

describe('inspect.mjs photographs the Welcome pane at the minimum window', () => {
  test('the minimum capture keeps its published filename, distinct from the standard one', () => {
    expect(INSPECT).toContain(`name: '${MIN_CAPTURE}'`)
    expect(INSPECT).toContain(`name: 'welcome'`)
  })

  // The whole point of the capture is the size, so the size may not be a second
  // copy of a number that lives in `src/main/index.ts`. Electron enforces the
  // minimum itself and will report it, so the driver asks the window instead of
  // restating it: raise the app's minimum and the capture follows, with no
  // silent drift into photographing a size the app no longer permits.
  test('the driver asks the window for its minimum rather than restating it', () => {
    const minWidth = MAIN.match(/minWidth:\s*(\d+)/)?.[1]
    const minHeight = MAIN.match(/minHeight:\s*(\d+)/)?.[1]
    expect(minWidth, 'index.ts no longer declares minWidth the way this test reads it').toBeTruthy()
    expect(
      minHeight,
      'index.ts no longer declares minHeight the way this test reads it'
    ).toBeTruthy()

    expect(INSPECT).toContain('getMinimumSize()')
    expect(INSPECT).not.toContain(`${minWidth}`)
    expect(INSPECT).not.toContain(`${minHeight}`)
  })

  // AC3 wants the WHOLE hero in frame — mark, heading, supporting line, action —
  // which is a stronger content check than the standard Welcome capture makes
  // (it requires only the title and the button). Pinned at both ends so renaming
  // a class reds here rather than quietly emptying the capture.
  test('the minimum capture requires every part of the hero, at both ends', () => {
    for (const cls of ['.welcome-mark', '.welcome-title', '.welcome-hint', '.pick-folder-btn']) {
      expect(INSPECT, `the driver does not require ${cls}`).toContain(`['${cls}',`)
      expect(WELCOME, `Welcome.tsx no longer carries ${cls}`).toContain(
        `className="${cls.slice(1)}"`
      )
    }
  })

  // AC2 — every other surface in the run must be untouched by this capture, and
  // the resize is what could touch them. The restore has to come AFTER the
  // minimum capture; deleting it would leave the six session surfaces and both
  // dock frames photographed at 640x480.
  test('the standard capture size is restored after the minimum capture', () => {
    const captured = INSPECT.indexOf(`name: '${MIN_CAPTURE}'`)
    const restored = INSPECT.lastIndexOf('WANT_WIDTH')
    expect(captured, 'the minimum capture is missing').toBeGreaterThan(-1)
    expect(
      restored,
      'nothing restores WANT_WIDTH after the minimum capture, so later surfaces are photographed at the wrong size'
    ).toBeGreaterThan(captured)
  })
})
