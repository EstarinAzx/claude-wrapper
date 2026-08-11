// gui-75, section 0 — the Windows app identity, read from the BUILT bundle.
//
// THE CONVENTION, and this file is the first instance of its #141 half: a
// driver `gui-<n>.mjs` contributes assertions through a sibling
// `gui-<n>.source.mjs` exporting `checks: { name, run() }[]`. #132 specified
// `run()` PURE — no browser, no Electron, no `out/` artifact, no network, no
// clock — and that specification is what left this assertion homeless, because
// its subject IS the build output.
//
// #141 adds one optional field rather than relaxing the rule:
//
//   needsBuild: { artifact, covers }
//
// A check carrying it is still pure in every other sense; it simply reads a
// build artifact. `tests/gui-source-assertions.test.ts` reports it as a NAMED
// SKIP with its reason instead of running it — `npm test` does not build, and a
// clean checkout has no `out/` at all, so gating on one would red for a reason
// that has nothing to do with the contract. `dom-phase.mjs` runs it, because
// that phase already refuses to start without a build.
//
// `covers` is what stops the declaration being decoration: the phase proves
// `artifact` is at least as new as everything under `covers` before believing
// the result. A grep against last week's bundle passes exactly as happily as
// one against the current build, and that is the failure this field exists to
// make impossible.
//
// WHY THE BUNDLE AND NOT THE SOURCE. Electron exposes no `getAppUserModelId`,
// so there is nothing to read back from the running app — a driver cannot
// assert this the way it asserts everything else in gui-75. And the regression
// it catches is specifically someone deleting the call because "the
// notification code does not use it": on Windows it does, silently. An
// unpackaged app without an identity shows NO toast and reports NO error, so
// every other assertion in gui-75 can pass while the user sees nothing.
//
// A source-level pin on `src/main/index.ts` would run everywhere and cost
// nothing, and it was considered and rejected as the WEAKER claim: it cannot
// see a bundler dropping the call, which is half of what "still in the shipped
// bundle" means.

import path from 'node:path'
import fs from 'node:fs'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const BUNDLE = 'out/main/index.js'

export const checks = [
  {
    name: 'criterion 0: the built main bundle still calls setAppUserModelId (BUILD ARTIFACT grep)',
    // Repo-relative on both sides, so the runner can resolve them itself and
    // report them to a reader who has no idea where this file lives.
    //
    // `covers` is the whole of `src/main` rather than `index.ts` alone: the
    // main bundle is built from that tree, and naming the entry file only would
    // let an edit to any sibling module count as a fresh build.
    needsBuild: { artifact: BUNDLE, covers: ['src/main'] },
    run() {
      const abs = path.join(APP_DIR, BUNDLE)
      const built = fs.existsSync(abs)
      const text = built ? fs.readFileSync(abs, 'utf8') : ''
      return {
        ok: built && text.includes('setAppUserModelId'),
        detail: {
          staticCheck: true,
          bundle: BUNDLE,
          built,
          hasIdentity: built ? text.includes('setAppUserModelId') : null,
          why: built
            ? 'the built main bundle never calls setAppUserModelId — on Windows an unpackaged app without an identity shows NO toast and reports NO error, so every assertion in gui-75 can pass while the user sees nothing'
            : `${BUNDLE} is missing — run \`npm run build\` first`
        }
      }
    }
  }
]
