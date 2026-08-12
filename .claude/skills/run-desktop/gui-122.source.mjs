// gui-122, source-level half — the one criterion in #154 that is a property of
// this driver's TEXT rather than of the running app.
//
// THE CONVENTION (#132): a driver `gui-<n>.mjs` contributes its source-level
// assertions by shipping this sibling, whose named export `checks` is an array of
// `{ name, run() }` with `run()` pure — no browser, no Electron, no `out/` build
// artifact, no network, no clock. `tests/gui-source-assertions.test.ts` globs for
// `*.source.mjs` and turns every entry into a real gate test, so this file needs
// no wiring anywhere; the driver imports the same array, so the gated copy cannot
// drift from the driven one.
//
// WHY THE FAST GATE HAS TO HOLD THIS ONE, and it is the whole argument for the
// file existing. #154's defect was a Tab traversal bounded by the constant 60,
// ported from the one #143 removed from `gui-123`. Reintroducing that constant
// does NOT red the DOM phase — and on this repo it now cannot, which is a
// stronger claim than the one `gui-123.source.mjs` was written under.
//
// #143 measured the traversal against a rail whose length was decided by a scope
// toggle persisted in the profile EVERY driver shared: 0 rows and 17 focusables at
// "This project", 100 rows and 218 focusables at "All projects", with the control
// landing on press 16 and press 218 respectively. So a hardcoded 60 was red only
// on a machine where somebody had left the toggle flipped — rare, silent, and
// real.
//
// #147 then closed that channel. `driver-profile.mjs` hands each driver process a
// `--user-data-dir` freshly made by `mkdtemp`, and `dom-phase.mjs` mints its own
// root per run, so the `localStorage` holding `sidebar-scope` is empty at every
// launch and `Sidebar.tsx` falls back to `project`. The rail is therefore empty on
// EVERY run of the phase, on every machine — which means a reverted constant is
// not merely unlikely to red there, it is invisible there by construction.
//
// That is the same shape as `tests/driver-screenshot-dir.test.ts`: a driver
// property whose violation is silent at runtime and obvious in the source. It
// gets the same treatment, a text check in the gate that runs every time.
//
// WHAT THIS DOES NOT CLAIM. A derived bound is not evidence the control is
// reachable; only the traversal in `gui-122.mjs` can say that, and only against a
// rail it established itself. These checks say two things: the driver still walks
// the document with Tab, and the number of presses it is willing to spend was
// counted off that document rather than guessed.

import path from 'node:path'
import fs from 'node:fs'

const DRIVER = path.join(import.meta.dirname, 'gui-122.mjs')

// Duplicated from `gui-123.source.mjs` rather than shared, deliberately. A common
// helper would have to live in a new module beside the drivers, and this
// directory's file inventory is itself checked (`drivers.manifest.mjs` distinguishes
// drivers, sidecars and the non-driver `.mjs` files); importing across sidecars
// instead would make deleting `gui-123` break `gui-122`'s gate check. Twenty lines
// of pure text-scanning is the cheaper of the three.
//
// Full-line comments only. The prose above and in the driver necessarily quotes the
// numbers these checks ban — "bounded by the constant 60" is a sentence about the
// defect, not the defect — and a matcher that read comments would red on the
// explanation of why it exists. Trailing `//` after code is left alone because
// stripping it needs a string/regex-aware parse to avoid eating a `//` inside a
// literal, and no `for` header in this driver carries one.
const stripLineComments = (src) =>
  src
    .split(/\r?\n/)
    .filter((l) => !/^\s*\/\//.test(l))
    .join('\n')

/** Every `for (...)` header in the driver, comments removed. */
const forHeaders = (src) => {
  const out = []
  const re = /\bfor\s*\(/g
  let m
  while ((m = re.exec(src)) !== null) {
    // Brace-free scan to the matching `)`, so a header containing `(` — a call in
    // the condition, say — is not truncated into a header that looks clean.
    let depth = 1
    let i = m.index + m[0].length
    for (; i < src.length && depth > 0; i++) {
      if (src[i] === '(') depth++
      else if (src[i] === ')') depth--
    }
    out.push(src.slice(m.index, i))
  }
  return out
}

const source = () => stripLineComments(fs.readFileSync(DRIVER, 'utf8'))

export const checks = [
  {
    name: 'criterion (#154): no Tab traversal in this driver is bounded by a hardcoded number (SOURCE)',
    run() {
      // `< 60`, `<= 60`. An identifier bound (`< budget`) is what passes, because
      // an identifier is the only shape that can have been computed from the
      // document the traversal is about to walk.
      const literal = forHeaders(source()).filter((h) => /<=?\s*\d/.test(h))
      return {
        ok: literal.length === 0,
        detail: {
          hardcoded: literal.map((h) => h.replace(/\s+/g, ' ').slice(0, 120)),
          want: 'a bound derived from a count taken off the live document, e.g. `i < budget`',
          why: 'a constant budget is a guess about a document this driver can count; #143 is what the guess cost, and after #147 the DOM phase can no longer catch the guess at all'
        }
      }
    }
  },
  {
    // THE CHECK ABOVE PASSES VACUOUSLY IF THE TRAVERSAL IS DELETED, and this repo
    // has met that shape often enough to name it — a quarantine the verdict does
    // not carry is a green (#145), a check nobody runs is not a check (#146).
    // "No hardcoded bound" is satisfied perfectly by a driver that no longer walks
    // the document at all, and the criterion above would go on reporting `ok` while
    // the keyboard claim it guards had quietly left the file.
    //
    // Not written for `gui-123`, which carries the same vacuity. Porting it there
    // is a separate change to a driver this ticket does not own.
    name: 'criterion (#154): the Tab traversal this bound guards is still in the driver (SOURCE)',
    run() {
      const src = source()
      const presses = (src.match(/keyboard\.press\(\s*['"`]Tab['"`]\s*\)/g) ?? []).length
      // The loop is what makes it a traversal rather than a single press, so both
      // halves are required: a `for` header bounded by an identifier, and a Tab
      // press somewhere in the file.
      const derived = forHeaders(src).filter((h) => /<=?\s*[A-Za-z_$]/.test(h))
      return {
        ok: presses > 0 && derived.length > 0,
        detail: {
          tabPresses: presses,
          derivedBoundHeaders: derived.map((h) => h.replace(/\s+/g, ' ').slice(0, 120)),
          want: 'at least one `keyboard.press(\'Tab\')` and at least one `for` header bounded by a counted identifier',
          why: 'the criterion above is satisfied by a driver that walks nothing, so on its own it would report ok while the keyboard reach claim had left the file'
        }
      }
    }
  }
]
