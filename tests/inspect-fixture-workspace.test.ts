import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

// #142 — the fixture workspace `inspect.mjs` opens has a FIXED directory name,
// so `titlebar.png` stops moving between runs.
//
// THE DEFECT THIS CLOSES. `Titlebar.tsx` renders `.session-title` as
// `basename(cwd)`, and the fixture workspace was `fs.mkdtempSync(...)`, whose
// six random characters differ every run. The box never moved and the text
// length never moved, so nothing looked wrong; only the glyphs changed, and a
// PNG of different glyphs compresses to a different size. Measured across seven
// runs: every other surface byte-identical, `titlebar.png` 8980 / 9015 / 9035 /
// 9083 / 9084 / 9190 / 9538. A byte-diff of that file could never be evidence,
// and a gauntlet wave comparing it across waves reads instrument noise as a
// change in the UI — the same class of trap `flatControl` documents.
//
// WHY THIS TEST IMPORTS RATHER THAN READS. The other three `inspect-*.test.ts`
// files assert against `inspect.mjs` as TEXT and say why: that module launches
// Electron at import time. That still holds, and the last test below is a text
// assertion for exactly that reason. But the constraint this ticket carries is
// behavioural, not textual — *do not refuse to run when the directory already
// exists; clean it when stale, and only then* — and "never refuses" is not a
// property source text can honestly check. Grepping for the absence of a
// `process.exit` proves nothing about a form nobody thought to grep for. So the
// three lines that decide it live in `inspect-workspace.mjs`, which imports
// nothing from Electron, and the checks below RUN them.
//
// WHY THE REFUSAL WOULD HAVE BEEN WRONG, since it is the obvious reading of
// "fixed name" and was rejected in review: a fixed name trades randomness for a
// collision, and refusing on collision converts crash residue — a directory a
// previous run died holding — into a deterministic failure on every subsequent
// run. The instrument would then be broken until a human deleted a temp
// directory they were never told about.
//
// WHAT THIS CANNOT CHECK, stated so the coverage is not overread:
//
//   * that `titlebar.png` is actually byte-stable. That needs the driver, a
//     built app and repeated runs; one comparison would only show the fixture
//     helped once, not that every volatile input is pinned. The ticket's
//     acceptance is repeated runs and it was verified that way.
//   * that two CONCURRENT runs do not fight over the directory. They do, and
//     there is no lock — see the ceiling recorded in `inspect-workspace.mjs`.
//     `mkdtemp` bought that isolation and this ticket deliberately spends it.

interface WorkspaceModule {
  WORKSPACE_NAME: string
  prepareWorkspace: (
    root: string,
    report?: (m: { dir: string; action: string }) => void
  ) => string
}

const REPO = path.resolve(import.meta.dirname, '..')
const DRIVER_DIR = path.join(REPO, '.claude/skills/run-desktop')

// Dynamic import of a file URL, the mechanic `gui-source-assertions.test.ts`
// already uses: the module is `.mjs` and this file is typechecked by
// `tsconfig.web.json`, which has no `allowJs`.
const { WORKSPACE_NAME, prepareWorkspace } = (await import(
  pathToFileURL(path.join(DRIVER_DIR, 'inspect-workspace.mjs')).href
)) as WorkspaceModule

const INSPECT = readFileSync(path.join(DRIVER_DIR, 'inspect.mjs'), 'utf8')

let root = ''
beforeEach(() => {
  // The TEST's root is random on purpose. What #142 pins is the name of the
  // directory inside it, which is the only part the app ever renders.
  root = mkdtempSync(path.join(os.tmpdir(), 'inspect-ws-test-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('the inspect fixture workspace has a stable name', () => {
  test('it creates a directory whose name carries no random suffix', () => {
    const dir = prepareWorkspace(root)

    expect(existsSync(dir), `prepareWorkspace returned ${dir}, which does not exist`).toBe(true)
    expect(path.basename(dir)).toBe(WORKSPACE_NAME)
    // The defect in one assertion: mkdtemp's six characters are what moved the
    // pixels, so the rendered basename must contain nothing the caller did not
    // choose.
    expect(path.basename(dir)).toMatch(/^[a-z-]+$/)
  })

  test('the name is identical across runs, which is the whole point', () => {
    const first = prepareWorkspace(root)
    const second = prepareWorkspace(root)

    expect(second).toBe(first)
  })
})

describe('a directory that is already there is cleaned, never refused', () => {
  // The constraint from cross-model review, and the reason this is not a
  // one-liner. A second call is exactly the shape of crash residue: a directory
  // this instrument left behind and must be able to reuse.
  test('a second call does not throw', () => {
    prepareWorkspace(root)

    expect(() => prepareWorkspace(root)).not.toThrow()
  })

  test('residue from a previous run is gone, not inherited', () => {
    const dir = prepareWorkspace(root)
    writeFileSync(path.join(dir, 'left-behind.jsonl'), 'residue')
    mkdirSync(path.join(dir, 'stale-subdir'), { recursive: true })

    const again = prepareWorkspace(root)

    expect(again).toBe(dir)
    // An inherited file is not cosmetic here: the workspace is what the app
    // opens, and a stale transcript or sidecar in it would be photographed.
    expect(readdirSync(again)).toEqual([])
  })

  test('the cleanup is reported, so it is visible rather than silent', () => {
    prepareWorkspace(root)

    const seen: { dir: string; action: string }[] = []
    const dir = prepareWorkspace(root, (m) => seen.push(m))

    expect(seen, 'a stale directory was removed and nothing said so').toHaveLength(1)
    expect(seen[0].dir).toBe(dir)
    expect(seen[0].action).toBeTruthy()
  })

  // "Clean it when stale, AND ONLY THEN." The report is how a reader tells the
  // two cases apart, so a version that removed and re-created unconditionally
  // would announce a cleanup on every single run and the signal would mean
  // nothing.
  test('nothing is reported when there was no stale directory', () => {
    const seen: { dir: string; action: string }[] = []
    prepareWorkspace(root, (m) => seen.push(m))

    expect(seen, 'a first run announced a cleanup it did not perform').toEqual([])
  })
})

describe('inspect.mjs uses it', () => {
  // The drift guard. Everything above would stay green with `inspect.mjs` still
  // calling `mkdtempSync`, and the module would be dead code passing its own
  // tests — the failure mode #132's sidecar convention exists to prevent, where
  // the gated copy and the driven copy are not the same copy.
  test('the driver takes its workspace from the shared module', () => {
    expect(INSPECT, 'inspect.mjs no longer declares WORKSPACE the way this test reads it').toMatch(
      /^const WORKSPACE = /m
    )
    expect(INSPECT).toContain('prepareWorkspace')
  })

  test('the driver no longer mkdtemps the workspace it photographs', () => {
    const decl = INSPECT.match(/^const WORKSPACE = .*$/m)?.[0] ?? ''

    expect(decl, `inspect.mjs still randomises the rendered workspace name: ${decl}`).not.toContain(
      'mkdtemp'
    )
  })
})
