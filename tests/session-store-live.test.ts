import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// The behavioural pin for `includeProgrammatic`, and the ONLY place it can live.
//
// tests/session-store.test.ts mocks both the SDK module and node:fs/promises, so
// the flag's EFFECT is unobservable there at any strength — the strongest thing
// expressible against a mock is the argument, and the argument is a no-op today
// (`true` is the SDK's own default). So this file mocks nothing and asserts the
// outcome against a real store: a transcript this app could have written is
// listable. See
// .context/decisions/2026-07-30-the-app-must-be-able-to-list-its-own-sessions.md
//
// The SDK decides "programmatic" by scanning the raw JSONL for `entrypoint`
// against {sdk-cli, sdk-ts, sdk-py}. This app writes `sdk-ts`, which is why
// `false` made it blind to its own conversations. The two fixtures below differ
// in exactly that field and nothing else, so a regression can only be the flag.

import { listSessions } from '../src/main/session-store'

const SDK_TS = '11111111-1111-4111-8111-111111111111'
const CLI = '22222222-2222-4222-8222-222222222222'
const CWD = 'D:\\projects\\demo'

let root: string
let saved: string | undefined

// Modelled on a real transcript line (keys verified against a live store file):
// `fc` drops a session whose FIRST line is sidechain-flagged, and drops any
// session with no extractable title, so both have to be genuine here or the
// fixture would be filtered for a reason that has nothing to do with the flag.
const line = (id: string, entrypoint: string, text: string): string =>
  JSON.stringify({
    type: 'user',
    entrypoint,
    isSidechain: false,
    sessionId: id,
    cwd: CWD,
    userType: 'external',
    version: '2.1.220',
    uuid: `${id}-u1`,
    parentUuid: null,
    timestamp: new Date(0).toISOString(),
    message: { role: 'user', content: text }
  })

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'cw-store-'))
  // Saved and restored rather than merely set: a leaked CLAUDE_CONFIG_DIR would
  // point every later suite in this worker at a deleted directory.
  saved = process.env.CLAUDE_CONFIG_DIR
  process.env.CLAUDE_CONFIG_DIR = root

  // The store's folder name is a lossy encoding and is NEVER decoded back into a
  // path (session-index.ts) — the cwd on the rows comes from the file contents,
  // so any folder name will do here.
  const project = join(root, 'projects', 'D--projects-demo')
  await mkdir(project, { recursive: true })
  await writeFile(join(project, `${SDK_TS}.jsonl`), line(SDK_TS, 'sdk-ts', 'wrapper chat') + '\n')
  await writeFile(join(project, `${CLI}.jsonl`), line(CLI, 'cli', 'terminal chat') + '\n')
})

afterEach(async () => {
  if (saved === undefined) delete process.env.CLAUDE_CONFIG_DIR
  else process.env.CLAUDE_CONFIG_DIR = saved
  await rm(root, { recursive: true, force: true })
})

describe('listSessions against a real store', () => {
  // THE regression test. Mutate session-store.ts back to
  // `includeProgrammatic: false` and only this assertion goes red: the sdk-ts
  // row vanishes while the cli row stays, which is exactly the bug the user hit
  // (a fresh project whose only sessions were the app's own read as empty).
  test('lists a session this app authored, not just terminal ones', async () => {
    const ids = (await listSessions())?.map((s) => s.id) ?? []

    expect(ids).toContain(SDK_TS)
    expect(ids).toContain(CLI)
  })

  test('carries the cwd from the transcript, so the rail can scope to it', async () => {
    const found = (await listSessions())?.find((s) => s.id === SDK_TS)

    expect(found?.cwd).toBe(CWD)
  })
})
