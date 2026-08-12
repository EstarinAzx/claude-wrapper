import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'
import { resetEnrichedTitles } from '../src/renderer/src/enriched-titles'
import type { SessionMeta } from '../src/shared/session-types'

// #49 — lazy title enrichment. 65 of 490 rows are titled with a bare slash
// command (`/clear`, `/model`, `/preset pick-up`) and are mutually
// indistinguishable in the list; those rows get a label derived from the first
// real prompt in their transcript.
//
// The ticket's named sharpest failure mode is enriching everything "for
// consistency", which walks all 490 transcripts and silently reinstates the cost
// #43 deleted. A green suite cannot see that — the list still renders, just
// slowly, exactly where it was slow before. So the assertions here are on the
// MECHANISM: which rows caused a transcript read, and how many times. A count is
// the only thing that separates lazy from eager after the fact.

// Sidebar's page size. An off-page row is rendered by nothing, so it must ask
// for nothing — the difference between "one screenful" and "the whole store".
const PAGE = 100

let harness: ReturnType<typeof fakeChatApi>

const filler = (n: number): SessionMeta[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `filler-${i}`,
    title: `Ordinary session ${i}`,
    lastUpdated: 4000 - i,
    cwd: FOLDER
  }))

const setup = (sessions: SessionMeta[]): void => {
  harness.api.listSessions.mockResolvedValue(sessions)
}

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
}

const idsAsked = (): string[] =>
  harness.api.titleHint.mock.calls.map((call: unknown[]) => call[0] as string)

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
  // Module-level cache: without this, the first test in the file decides every
  // later test's labels and call counts.
  resetEnrichedTitles()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('lazy title enrichment', () => {
  // THE pin for this ticket. Three rows, three different expectations, one
  // counter: the qualifying row asks exactly once, and the two that must never
  // ask are one that does not qualify and one that was never rendered.
  test('only a rendered row with a bare command title reads a transcript', async () => {
    setup([
      { id: 'cmd', title: '/clear', lastUpdated: 5000, cwd: FOLDER },
      { id: 'prose', title: 'Fix the parser', lastUpdated: 4500, cwd: FOLDER },
      ...filler(PAGE - 2),
      { id: 'offpage', title: '/model', lastUpdated: 1, cwd: FOLDER }
    ])
    harness.api.titleHint.mockResolvedValue('wire the sessions rail')
    await startSession()

    // Awaited via the mechanism rather than the rendered label (#153). Reading
    // the DOM here made a 100-row page's enrichment round trip — hint resolve,
    // React commit, then a text query across the page — all fit inside Testing
    // Library's 1000ms `asyncUtilTimeout`, and full-suite contention outran it
    // in 4 of 7 measured runs. This assertion waits on strictly less: only that
    // the read was requested. Per the file header that is also the test's
    // actual subject, which rows asked and how many times.
    //
    // `waitFor` shares that same 1000ms default, so the explicit timeout is
    // what keeps the residual race closed rather than merely narrowed. It is
    // bounded at BOTH ends. Above 1000ms for headroom against the observed
    // contention (one run reported `environment 1346s` against a 193s wall
    // clock); below vitest's 5000ms `testTimeout`, which this repo does not
    // override, because a wait allowed to reach the test-level cap loses the
    // diagnostic — the failure degrades from this assertion naming the call it
    // wanted into a bare 'Test timed out' pointing at the test declaration.
    // Mutation-verified in both directions.
    //
    // Nothing is given up: the label reaching the row is pinned by 'the
    // enriched label is what the row shows and filters on', and a
    // re-render-triggered second read by 'remounting the rail does not read the
    // transcript again'.
    await waitFor(() => expect(harness.api.titleHint).toHaveBeenCalledWith('cmd', FOLDER), {
      timeout: 3000
    })

    expect(idsAsked()).toEqual(['cmd'])
    expect(harness.api.titleHint).toHaveBeenCalledTimes(1)
    // The off-page row qualifies on its title and is still never asked about:
    // the page cap, not the predicate, is what keeps this off the whole store.
    expect(screen.queryByText('/model')).toBe(null)
  })

  // "Read once" has to survive the list re-rendering, which it does constantly —
  // on focus, on filter, on workspace change. Collapsing unmounts every row;
  // re-rendering App from scratch unmounts the sidebar itself.
  test('remounting the rail does not read the transcript again', async () => {
    setup([{ id: 'cmd', title: '/preset pick-up', lastUpdated: 5000, cwd: FOLDER }])
    harness.api.titleHint.mockResolvedValue('drain the ticket queue')
    await startSession()
    await screen.findByText('drain the ticket queue')

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sessions' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Expand sessions' }))
    await screen.findByText('drain the ticket queue')

    cleanup()
    await startSession()
    await screen.findByText('drain the ticket queue')

    expect(harness.api.titleHint).toHaveBeenCalledTimes(1)
  })

  // A row that can never improve must not be retried, or a lazy read turns back
  // into the whole-store scan one remount at a time.
  test('a session with no substantive prompt is asked once and keeps its title', async () => {
    setup([{ id: 'cmd', title: '/clear', lastUpdated: 5000, cwd: FOLDER }])
    harness.api.titleHint.mockResolvedValue(null)
    await startSession()
    await screen.findByText('/clear')
    await waitFor(() => expect(harness.api.titleHint).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sessions' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Expand sessions' }))
    await screen.findByText('/clear')

    expect(harness.api.titleHint).toHaveBeenCalledTimes(1)
  })

  // The 28 informative titles that merely begin with a command read fine already
  // and must be left completely alone — not enriched, not even asked about.
  test('a command title carrying real prose is never asked about', async () => {
    setup([
      {
        id: 'prose-cmd',
        title: '/relay N=1 read and follow .claude/relay-leg.md',
        lastUpdated: 5000,
        cwd: FOLDER
      }
    ])
    await startSession()
    await screen.findByText('/relay N=1 read and follow .claude/relay-leg.md')

    expect(harness.api.titleHint).not.toHaveBeenCalled()
  })

  test('the enriched label is what the row shows and filters on', async () => {
    setup([
      { id: 'cmd', title: '/clear', lastUpdated: 5000, cwd: FOLDER },
      { id: 'other', title: 'Ordinary session', lastUpdated: 4000, cwd: FOLDER }
    ])
    harness.api.titleHint.mockResolvedValue('wire the sessions rail')
    await startSession()
    await screen.findByText('wire the sessions rail')

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter sessions' }), {
      target: { value: 'wire' }
    })

    expect(screen.getByText('wire the sessions rail')).toBeTruthy()
    expect(screen.queryByText('Ordinary session')).toBe(null)
  })

  // Filtering must never be what triggers a read: matching an unrendered row on
  // a label it does not have yet would mean deriving one for every row in the
  // store on the first keystroke.
  test('filtering never asks for a label', async () => {
    setup([
      ...filler(PAGE),
      { id: 'offpage', title: '/clear', lastUpdated: 1, cwd: FOLDER }
    ])
    harness.api.titleHint.mockResolvedValue('wire the sessions rail')
    await startSession()
    await screen.findByText('Ordinary session 0')

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter sessions' }), {
      target: { value: 'wire' }
    })

    // The off-page row's would-be label matches the query; it is still not read,
    // and so it does not appear.
    await waitFor(() => expect(screen.queryByText('Ordinary session 0')).toBe(null))
    expect(harness.api.titleHint).not.toHaveBeenCalled()
  })
})
