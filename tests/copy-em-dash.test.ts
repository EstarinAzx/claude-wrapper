// @vitest-environment node
//
// The suite runs in jsdom by default, and esbuild refuses to load there: it
// asserts `new TextEncoder().encode('') instanceof Uint8Array`, which jsdom's
// TextEncoder fails because it comes from a different realm. This file touches
// no DOM, so it opts out of jsdom rather than working around the shim.

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { transformSync } from 'esbuild'
import { describe, expect, test } from 'vitest'

// #134 — DESIGN.md's "no em dashes in copy" ban, enforced instead of remembered.
//
// The ban is listed under "Bans in force" and was broken in fifteen shipped
// strings across the titlebar, the composer, the sessions rail, the tool card
// and the two rewind refusals. Nothing failed, because nothing looked: the ban
// lived in prose, and prose does not run.
//
// WHY THIS COMPILES THE FILE INSTEAD OF READING IT. A plain grep for the
// character finds ~767 hits in `src/`, and nearly all are comments — this repo
// comments heavily, in em dashes. A line filter ("skip lines starting with //")
// is guesswork: it misses a dash inside a multi-line template and mis-classifies
// a wrapped comment. So the check hands the file to esbuild, the bundler this
// project already builds with, and searches its OUTPUT. esbuild drops
// non-legal comments and keeps every string, template span and JSX text, which
// is precisely the line between "a developer wrote this to another developer"
// and "a user can read this". The classification is the compiler's, not a
// regex's. `charset: 'utf8'` matters: the default escapes non-ASCII, and a dash
// spelled `—` in the output would slip past a search for the character.
//
// SCOPE, and why it is all of `src/` rather than "the renderer". Deciding
// whether a given string is user-visible is a judgement this file would have to
// re-make for every string ever added, and it would eventually be wrong. Every
// em dash in a `src/` literal today is copy, so the rule is simply that none
// belongs there: stronger than the ticket asked for, and it needs no classifier.
//
// Out of scope, deliberately: comments and JSDoc (the ban is on copy the user
// reads), `docs/`, `scripts/` (probes and spikes print to a developer's
// terminal), and `tests/` (describe blocks are not shipped).

const REPO = path.resolve(import.meta.dirname, '..')
const SRC = path.join(REPO, 'src')
const EM_DASH = '—'

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })

const compile = (source: string, loader: 'ts' | 'tsx'): string =>
  transformSync(source, {
    loader,
    charset: 'utf8',
    // The one option that strips EVERY comment. A plain transform keeps the
    // ones sitting inside an object literal — `src/preload/index.ts` alone has
    // seven, and they would be reported as copy. This is the cheapest of the
    // three minify flags: it rewrites no syntax and renames nothing, so a
    // string reaches the search exactly as it was written.
    minifyWhitespace: true
  }).code

/** Each em dash left in compiled output, quoted in place, with its file. */
const offenders = (): string[] =>
  sourceFiles(SRC)
    .flatMap((file) => {
      const code = compile(readFileSync(file, 'utf8'), file.endsWith('.tsx') ? 'tsx' : 'ts')
      const found: string[] = []
      for (let at = code.indexOf(EM_DASH); at !== -1; at = code.indexOf(EM_DASH, at + 1)) {
        // Minified output is a handful of very long lines, so the whole line is
        // useless in a failure message. A window around the dash is greppable.
        const window = code.slice(Math.max(0, at - 60), at + 60)
        found.push(`${path.relative(REPO, file)}: …${window}…`)
      }
      return found
    })
    .sort()

describe('DESIGN.md bans em dashes in copy (#134)', () => {
  test('no string, template span or JSX text in src/ contains one', () => {
    expect(offenders()).toEqual([])
  })

  // A check that cannot fail is not a check, and this one rests entirely on
  // what esbuild keeps and what it throws away. These pin that contract, so an
  // esbuild upgrade that started preserving comments is caught here rather than
  // by a suite that quietly passes.
  const dashes = (source: string): number => (compile(source, 'tsx').match(new RegExp(EM_DASH, 'g')) ?? []).length

  test('the scan sees a dash in a string, a template span and JSX text', () => {
    expect(
      dashes(
        [
          `const a = 'plain ${EM_DASH} string'`,
          'const b = `Backend: ${label} ' + EM_DASH + ' click to switch`',
          `const C = () => <p>jsx ${EM_DASH} text</p>`
        ].join('\n')
      )
    ).toBe(3)
  })

  test('and sees none in a line, block or object-literal comment', () => {
    // The third is the one that caught this check out: a plain transform keeps
    // comments attached to object properties, and they are not copy.
    expect(
      dashes(
        [
          `// a line comment ${EM_DASH} dash`,
          `/* a block comment ${EM_DASH} dash */`,
          `const api = {`,
          `  // an object-literal comment ${EM_DASH} dash`,
          `  a: 'clean'`,
          `}`
        ].join('\n')
      )
    ).toBe(0)
  })
})
