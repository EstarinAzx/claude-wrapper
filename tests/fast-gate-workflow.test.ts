import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #150 - the CI workflow's coverage boundary, pinned as text.
//
// THE DEFECT THIS CLOSES. This repo's real instrument is the DOM phase, and no
// hosted runner can run it: Electron needs a display, two drivers spawn the real
// `claude` CLI, and `gui-119` needs a genuine desktop foreground. So CI covers
// the headless half and nothing else. Cross-model review refuted the first draft
// of this split on exactly that point - "that creates a green-looking workflow
// which still cannot enforce the claimed gate" - and the accepted reading is
// that a green check over a repo whose real instrument runs nowhere is WORSE
// than no check, because it converts a known gap into an assumed cover.
//
// That makes the boundary load-bearing rather than decorative, and a boundary
// stated only in prose is one edit away from gone. Someone adds `npm run
// test:dom` to the workflow to "get the drivers covered", it reds on a runner
// with no desktop, they add `continue-on-error`, and the check is green while
// measuring nothing. Or the exclusion notice is dropped as clutter and the check
// name starts reading as whole-repo coverage. Neither edit looks wrong in a
// diff. Both are caught here in milliseconds.
//
// WHY THE SET AND NOT THE ORDER. The defect shape is a command being ADDED or
// REMOVED, not reordered. Pinning the order would red on a harmless reshuffle
// and teach the next reader to edit the assertion rather than think about it.
//
// WHY THE `test:dom` BAN SPANS EVERY WORKFLOW, not just this one. A second
// workflow file changes what a green tick on this repo means just as much as an
// extra step in this one. Adding new workflows stays allowed; claiming the DOM
// phase from any of them does not.
//
// WHAT IT CANNOT CHECK, stated so the coverage is not overread: that the
// workflow is valid YAML GitHub will accept, that the runner image has what
// these commands need, that the pinned action versions resolve, or that the
// three commands pass there. Those need a real push and a real run, and nothing
// has ever been pushed from this checkout. This is a text-level agreement check
// between the workflow, the skill doc, and the claim both of them make.

const REPO = path.resolve(import.meta.dirname, '..')
const read = (rel: string): string => readFileSync(path.join(REPO, rel), 'utf8')

const WORKFLOW_DIR = '.github/workflows'
const WORKFLOW_PATH = `${WORKFLOW_DIR}/fast-gate.yml`
const SKILL_PATH = '.claude/skills/run-desktop/SKILL.md'

const WORKFLOW = read(WORKFLOW_PATH)
const SKILL = read(SKILL_PATH)

// Only step-level one-line commands: `      - run: <cmd>`. The job-summary step
// uses a `        run: |` block whose body is echo text mentioning these same
// command names, and folding that in would make every assertion below vacuous.
const stepCommands = (): string[] =>
  [...WORKFLOW.matchAll(/^ {6}- run: (.+)$/gm)].map((m) => m[1].trim())

// `npm ci` installs; it is not part of the gate the record names.
const GATE = ['npm run build', 'npm run typecheck', 'npm test']

describe('#150 fast-gate workflow', () => {
  test('runs exactly the three gate commands, plus the install', () => {
    const commands = stepCommands()
    expect(commands).toContain('npm ci')
    expect(commands.filter((c) => c !== 'npm ci').sort()).toEqual([...GATE].sort())
  })

  test('runs on push', () => {
    expect(WORKFLOW).toMatch(/^on: push$/m)
  })

  test('is named for what it covers, not for the repo', () => {
    expect(WORKFLOW).toMatch(/^name: fast-gate$/m)
  })

  test('the job name carries the exclusion, because that is what the checks list shows', () => {
    const jobName = WORKFLOW.match(/^ {4}name: (.+)$/m)?.[1] ?? ''
    expect(jobName).toMatch(/DOM phase/)
    expect(jobName).toMatch(/NOT/)
  })

  test('a run summary states the exclusion even when the gate is red', () => {
    // `always()` matters: a failed gate is when the coverage is most likely to
    // be over-read.
    expect(WORKFLOW).toMatch(/if: always\(\)/)
    expect(WORKFLOW).toMatch(/Did NOT run.*test:dom/)
  })

  test('no workflow claims to run the DOM phase', () => {
    const offenders = readdirSync(path.join(REPO, WORKFLOW_DIR))
      .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
      .filter((f) =>
        [...read(`${WORKFLOW_DIR}/${f}`).matchAll(/^ *-? *run: (.+)$/gm)].some((m) =>
          m[1].includes('test:dom')
        )
      )
    expect(offenders).toEqual([])
  })
})

describe('#150 SKILL.md states the same boundary', () => {
  test('names the workflow and calls the phase a local win32 step', () => {
    expect(SKILL).toContain('fast-gate')
    expect(SKILL).toMatch(/local win32 step/)
  })

  test('says CI does not run the phase, next to the phase command', () => {
    const commandBlock = SKILL.indexOf('npm run test:dom -- --list')
    const claim = SKILL.indexOf('CI does not run any of this')
    expect(commandBlock).toBeGreaterThan(-1)
    expect(claim).toBeGreaterThan(commandBlock)
    // "Next to" is the ticket's word. Keep it within the same screenful rather
    // than merely somewhere in a 350-line document.
    expect(claim - commandBlock).toBeLessThan(400)
  })

  test('#144 is named as still open, so this does not read as the forcing mechanism', () => {
    expect(SKILL).toMatch(/#144/)
  })
})
