// Recon #120 — does this CLI expose /rewind, /effort and /bg at all?
//
// NOT a spike deliverable. This is vibe's boot recon: it decides whether three
// of the owner's asks are BUILD tickets or SPIKE tickets, before either is
// written. A18's rule (`build only if measured`) is what makes it necessary,
// and #78 is the precedent — it ran its measurement and built nothing.
//
//   node --experimental-strip-types scripts/recon-120-command-surface.mjs
//
// Sibling construction to spike-116: the app's REAL cli-path.ts and
// backend-mode.ts, so the binary and routing measured here cannot drift from
// what the app actually spawns.
//
// WHY THIS IS A CALL, NOT A GREP. #116's landmine is that a bundle grep reads
// NAMES and proves nothing. `supportedCommands()` is the CLI answering over the
// control protocol on a warm handle — the CLI's own enumeration of itself. That
// is evidence of the same kind #116 accepted.
//
// WHAT IT STILL CANNOT SETTLE, stated up front so the finding is not
// over-read. #117: a callable route is not an effective one. A command name
// appearing here proves the CLI ADVERTISES it; it does not prove that invoking
// it through this app's send path does anything useful. Presence therefore
// authorises a BUILD ticket to be written against a real command; ABSENCE is
// the stronger result, because it kills the ask outright.
//
// COSTS ZERO CLI TURNS. The prompt generator never yields; only control
// requests are sent. spike-105's economy.
//
// SCRUBBING. `supportedCommands()` returns the user's custom commands as well
// as built-ins, and a custom command name can carry personal or client
// information. The findings file records COUNTS, the SHAPE of an entry, and
// only names matching the narrow interest pattern below. No full listing is
// ever written to disk.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { query } from '@anthropic-ai/claude-agent-sdk'

const { resolveHostCli, toCliOptions } = await import('../src/main/cli-path.ts')
const { snapshotWispEnv, resolveSpawnEnv, initialMode } = await import(
  '../src/main/backend-mode.ts'
)

// fileURLToPath, never URL.pathname — this repo lives under a path with a space.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const findingsPath = new URL('./recon-120-findings.json', import.meta.url)

const hostCli = resolveHostCli(process.env['PATH'], process.platform)
const cliOptions = toCliOptions(hostCli)
const snapshot = snapshotWispEnv(process.env)
const mode = initialMode(snapshot)
const appEnv = resolveSpawnEnv(mode, snapshot)

// The three the owner named, plus the neighbours that would change what a
// remedy looks like if the exact name is absent but a sibling exists.
const INTEREST = /rewind|effort|^bg$|background|resume|compact|model|think/i

const out = {
  generatedAt: null,
  binary: hostCli ? 'host (cli-path.ts resolved)' : 'SDK-bundled (no host on PATH)',
  backendMode: mode,
  commands: {},
  models: {},
  verdict: {}
}

const openHandle = () =>
  query({
    prompt: (async function* () {
      // Never yields. The handle is what is being measured, not a conversation.
      await new Promise(() => {})
    })(),
    options: {
      cwd: repoRoot,
      includePartialMessages: true,
      env: appEnv,
      ...cliOptions
    }
  })

let q
try {
  q = openHandle()

  // --- Commands -----------------------------------------------------------
  const cmds = await q.supportedCommands()
  const list = Array.isArray(cmds) ? cmds : []

  // The shape is recorded rather than assumed: A8 established that only a COUNT
  // was ever written down here, so the entry shape is itself an open question.
  const sample = list[0]
  out.commands.count = list.length
  out.commands.entryShape =
    sample == null
      ? null
      : typeof sample === 'string'
        ? 'string'
        : `object{${Object.keys(sample).sort().join(',')}}`

  const nameOf = (c) =>
    typeof c === 'string' ? c : String(c?.name ?? c?.command ?? c?.id ?? '')

  const names = list.map(nameOf).filter(Boolean)
  out.commands.namesResolved = names.length

  // Only interest-matching names are written out. See SCRUBBING above.
  out.commands.matches = names.filter((n) => INTEREST.test(n)).sort()

  const has = (n) => names.some((x) => x.replace(/^\//, '').toLowerCase() === n)
  out.commands.present = {
    rewind: has('rewind'),
    effort: has('effort'),
    bg: has('bg')
  }

  // --- Models, for the /effort ask ---------------------------------------
  // If effort is a per-model attribute rather than a command, it shows up here.
  const models = await q.supportedModels()
  const mlist = Array.isArray(models) ? models : []
  out.models.count = mlist.length
  out.models.entryShape =
    mlist[0] == null
      ? null
      : typeof mlist[0] === 'string'
        ? 'string'
        : `object{${Object.keys(mlist[0]).sort().join(',')}}`
  // Does any model entry carry an effort-ish field at all?
  out.models.carriesEffortField = mlist.some(
    (m) => m && typeof m === 'object' && Object.keys(m).some((k) => /effort|think|reason/i.test(k))
  )
} catch (err) {
  out.error = `probe threw: ${String(err?.message ?? err).slice(0, 300)}`
} finally {
  try {
    await q?.interrupt?.()
  } catch {
    /* handle already gone */
  }
  try {
    q?.return?.()
  } catch {
    /* generator already closed */
  }
}

const p = out.commands.present ?? {}
out.verdict = {
  rewind: p.rewind
    ? 'ADVERTISED — a build ticket may be written against a real command. Effectiveness through this app’s send path is still UNMEASURED (#117).'
    : 'NOT ADVERTISED — the ask cannot be built as a wrapper for a CLI command.',
  effort: p.effort
    ? 'ADVERTISED — same caveat.'
    : 'NOT ADVERTISED — the ask cannot be built as a wrapper for a CLI command.',
  bg: p.bg
    ? 'ADVERTISED — same caveat. The owner reports it does not work, which is a SEPARATE question this probe does not answer.'
    : 'NOT ADVERTISED — consistent with the owner’s report that /bg does not work.',
  readsOnly:
    'This probe measures ADVERTISEMENT, never effectiveness. No prompt was sent and no turn was spent.'
}

out.generatedAt = new Date().toISOString()
writeFileSync(findingsPath, JSON.stringify(out, null, 2) + '\n')

console.log(JSON.stringify(out, null, 2))
