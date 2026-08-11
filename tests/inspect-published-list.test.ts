import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

// #149 - the surface list `inspect.mjs` publishes, pinned against the two
// documents that restate it.
//
// THE DEFECT THIS CLOSES. `inspect.mjs` captures a set of surfaces, and two
// other files tell a reader what that set is: `SKILL.md`, which documents the
// instrument, and `.gauntlet/bar/README.md`, which is the standard a gauntlet
// wave scopes itself against. #133 added the three right-hand docks and #137
// added the Welcome pane at the minimum window. Both updated the driver's own
// header, because that is the file being edited, and neither updated the two
// documents. The lists drifted to five against nine and nothing noticed for two
// tickets, because a list in prose does not run.
//
// The cost is not cosmetic. A surface that exists but is not published is a
// surface no wave scopes itself to, which lands in the same place as never
// having photographed it at all.
//
// WHY THE BAR README IS NOT GENERATED FROM `SURFACES`, which was the obvious fix
// and was rejected under cross-model review. Making the executable array the
// authority inverts the contract: deleting a driver entry would silently delete
// the bar obligation, and a quality standard that inherits omissions from the
// implementation it polices has stopped being a standard. So the bar keeps its
// OWN list, authored by a human, and this test asserts only that the two agree.
// Neither side may silently define the other - a surface leaving the code reds
// this file until a human deliberately removes it from the standard too.
//
// `SKILL.md` is a different case and is treated as one. It documents the
// instrument, so following the instrument is correct there; it is held to the
// same equality only because a document that describes a tool should describe
// the tool that exists.
//
// WHY THE REGIONS ARE DELIMITED rather than scanned whole. `.gauntlet/bar/`
// names plenty of PNGs that are not surfaces - five Linear references, the
// identity floor, the before-shot - so a file-wide scan for `*.png` would fold
// the references into the surface set. The markers make the published list an
// addressable thing rather than a guess about which paragraph counts.
//
// WHAT IT CANNOT CHECK, stated so the coverage is not overread: that a listed
// surface is reachable, that its selector resolves, that the capture is not
// blank, or that the prose around the list is true. Those need a live window and
// belong to the driver, which fails loudly on the first three. This is a
// name-level agreement check and nothing more.

const REPO = path.resolve(import.meta.dirname, '..')
const read = (rel: string): string => readFileSync(path.join(REPO, rel), 'utf8')

const INSPECT_PATH = '.claude/skills/run-desktop/inspect.mjs'
const SKILL_PATH = '.claude/skills/run-desktop/SKILL.md'
const BAR_PATH = '.gauntlet/bar/README.md'

const INSPECT = read(INSPECT_PATH)

// The array closes on a `]` at column zero. The nested `requires: [...]` arrays
// all close indented, so the non-greedy match cannot stop early inside one.
const surfaceNames = (): string[] => {
  const block = INSPECT.match(/const SURFACES = \[([\s\S]*?)\n\]/)?.[1]
  if (block === undefined) return []
  return [...block.matchAll(/name: '([a-z0-9-]+)'/g)].map((m) => m[1])
}

// The published list of a document, in the order it publishes it.
const publishedNames = (source: string): string[] | null => {
  const region = source.match(/<!-- surfaces:begin[\s\S]*?-->([\s\S]*?)<!-- surfaces:end -->/)?.[1]
  if (region === undefined) return null
  return [...region.matchAll(/([a-z0-9-]+)\.png/g)].map((m) => m[1])
}

const DOCUMENTS = [
  { label: 'the skill that documents the instrument', file: SKILL_PATH },
  { label: 'the bar the waves are graded against', file: BAR_PATH }
]

describe('the published surface list', () => {
  // The discrimination control. Every assertion below compares against this
  // list, so a parse that silently returned nothing would make the whole file
  // pass by agreeing that all three publish an empty set - which is exactly the
  // shape of failure this ticket is about. It fails first and it fails loudly.
  test('the driver still declares SURFACES the way this test reads it', () => {
    expect(
      surfaceNames().length,
      `${INSPECT_PATH} no longer exposes a SURFACES array of named entries`
    ).toBeGreaterThan(0)
  })

  for (const doc of DOCUMENTS) {
    describe(doc.file, () => {
      test('publishes its list inside the delimited region', () => {
        expect(
          publishedNames(read(doc.file)),
          `${doc.file} (${doc.label}) has no surfaces:begin / surfaces:end region`
        ).not.toBeNull()
      })

      // Set equality, reported as sorted lists so a failure names the surfaces
      // that drifted rather than only saying the two differ.
      test('names every surface the driver captures, and no others', () => {
        const published = publishedNames(read(doc.file)) ?? []
        expect([...published].sort()).toEqual([...surfaceNames()].sort())
      })

      // The wave order is the bar's own, and the driver's order is a capture
      // order constrained by cost (the docks come last because opening one
      // narrows `main.chat`). Requiring one to match the other would force an
      // unrelated constraint onto a human document, so only membership is held.
      test('may order its list freely', () => {
        expect(publishedNames(read(doc.file))?.length).toBe(surfaceNames().length)
      })
    })
  }

  // The count in `CAPTURED n/N` is the file total, so it is the surfaces plus
  // the two whole-window frames. Both documents quote it as a thing a reader
  // checks a run against, and both quoted `n/7` while the driver printed `n/11`.
  // Derived from the driver's own expression rather than hardcoded, so this
  // tracks a change to either term.
  test('both documents quote the file count the driver actually prints', () => {
    const extra = INSPECT.match(/const EXPECTED_FILES = SURFACES\.length \+ (\d+)/)?.[1]
    expect(extra, `${INSPECT_PATH} no longer derives EXPECTED_FILES the way this test reads it`)
      .toBeDefined()

    const expected = surfaceNames().length + Number(extra)
    for (const doc of DOCUMENTS) {
      expect(read(doc.file), `${doc.file} quotes a stale CAPTURED count`).toContain(
        `CAPTURED n/${expected}`
      )
    }
  })
})
