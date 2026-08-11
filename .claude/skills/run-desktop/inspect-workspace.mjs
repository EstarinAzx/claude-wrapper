// #142 — the fixture workspace `inspect.mjs` opens, with a FIXED directory name.
//
// This is three lines of code and a paragraph of reasoning, which is the ratio
// the ticket has: the fix is obvious and the failure mode of the obvious fix is
// not.
//
// WHY THE NAME IS FIXED. The app renders `.session-title` as `basename(cwd)`,
// and this directory IS that cwd. Under `fs.mkdtempSync` its six random
// characters changed every run, so `titlebar.png` compressed differently every
// run while its box and its text length stayed constant — the one captured
// surface that could never be byte-compared, and the only one that moved.
// Measured across seven runs of the unmodified driver: every other surface
// byte-identical, this one spanning 8980 to 9538 bytes. #137 already ran this
// exact change and recorded that it made the file byte-identical, so the remedy
// is measured rather than proposed.
//
// WHY IT CLEANS INSTEAD OF REFUSING, which is the part that is not obvious. A
// fixed name trades randomness for a collision — that is precisely what
// `mkdtemp` was buying — and the tempting response is to refuse when the
// directory is already there. That is wrong: this instrument is unattended, and
// a run that dies between `mkdirSync` and `cleanup()` leaves residue behind. A
// refusal would turn that residue into a deterministic failure of every
// subsequent run, with no message a reader could act on and no reason to look in
// a temp directory nobody told them about. So a stale directory is REMOVED and
// the removal is ANNOUNCED through the caller's own reporter, which is why the
// report is a parameter rather than a `console.log` in here: the driver states
// it in the vocabulary it uses for every other observation, and a reader of the
// run's output sees the cleanup happen.
//
// The report fires ONLY when something was actually removed. A version that
// removed and re-created unconditionally would be simpler and would announce a
// cleanup on every run, at which point the announcement carries no information
// and a genuinely stale directory — the symptom of a crashed previous run — is
// indistinguishable from the ordinary case.
//
// THE CEILING, stated because it is real and this ticket knowingly accepts it:
// TWO CONCURRENT RUNS FIGHT. `mkdtemp` made concurrent runs safe and a fixed
// name cannot; there is no lock here and adding one was not asked for. The
// second run's `prepareWorkspace` deletes the first run's workspace out from
// under it, and the first run's `cleanup()` then deletes the second's. Both
// produce garbage rather than an error, which is the honest cost of a diffable
// capture. Run this instrument one at a time.
//
// Only the workspace is pinned. The CLI store directory beside it in
// `inspect.mjs` keeps its random suffix and should: nothing renders it, so it is
// not a source of pixel drift, and its randomness still keeps two runs' seeded
// transcripts apart.

import fs from 'node:fs'
import path from 'node:path'

/**
 * The rendered basename. Lowercase letters and a hyphen only — every character
 * of this string is photographed, so anything derived at runtime puts the drift
 * straight back.
 */
export const WORKSPACE_NAME = 'inspect-ws'

/**
 * Return the fixture workspace directory inside `root`, created and empty.
 *
 * Never throws on an existing directory: it is cleaned and `report` is called
 * with `{ dir, action }`. `report` is not called when there was nothing to
 * clean.
 */
export const prepareWorkspace = (root, report = () => {}) => {
  const dir = path.join(root, WORKSPACE_NAME)
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
    report({ dir, action: 'cleaned stale directory from a previous run' })
  }
  fs.mkdirSync(dir, { recursive: true })
  return dir
}
