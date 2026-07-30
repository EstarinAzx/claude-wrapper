import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'
import type { SwitchStatus } from '../src/shared/session-types'

// #47 — the renderer half of the workspace transition. Selecting a session from
// another project runs main's transaction; ONLY on `ok` does every piece of
// workspace-shaped renderer state drop at once. The sharpest failure mode is a
// PARTIAL reset — project B's sidebar beside project A's conversation — so the
// tests below assert each piece separately rather than one bundled "it reset".

const THERE = 'D:\\projects\\other'

const COMMANDS = [{ name: 'preset', description: 'Load a preset', argumentHint: '' }]

const IMAGE = { name: 'shot.png', mediaType: 'image/png', data: 'AAAA' }

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
  // The rail opens scoped to the open workspace, and every test in this file is
  // about reaching a session OUTSIDE it. Seeding the pref the scope toggle
  // writes keeps each test asserting the transition it is named for rather than
  // re-testing the rail's default; the toggle itself is covered in sidebar.test.
  window.localStorage.setItem('sidebar-scope', 'all')
  harness.api.listSessions.mockResolvedValue([
    { id: 'here', title: 'Here chat', lastUpdated: 2000, cwd: FOLDER },
    { id: 'far', title: 'Far chat', lastUpdated: 1000, cwd: THERE },
    { id: 'nowhere', title: 'Homeless chat', lastUpdated: 500 }
  ])
  // Distinct per session: "the messages reset" is only provable if the target's
  // transcript is distinguishable from the one it replaced.
  harness.api.loadTranscript.mockImplementation(async (id: string) => [
    { role: 'user' as const, text: id === 'far' ? 'the far conversation' : 'the here conversation' }
  ])
  harness.api.listCommands.mockResolvedValue(COMMANDS)
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
  await screen.findByText('Far chat')
}

const composer = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLTextAreaElement

const rowButton = (label: string): HTMLButtonElement =>
  screen.getByText(label).closest('button') as HTMLButtonElement

// Scoped to the tray: a replayed user message renders `.attachment-chip` too.
const trayChips = (): Element[] =>
  Array.from(document.querySelectorAll('.attachment-tray .attachment-chip'))

const popover = (): Element | null => document.querySelector('.command-popover')

const refusal = (): string | null =>
  document.querySelector('.switch-refusal')?.textContent ?? null

const openProject = (): string | null =>
  document.querySelector('.session-title')?.getAttribute('title') ?? null

// Every renderer state the ticket names, read back from the DOM. `pendingInsert`
// and `openSubagent` have no markup of their own: the composer value is the only
// thing the pending insert renders, and the drawer is the only thing openSubagent
// renders, so both are covered by `draft` and `drawer`.
const snapshot = (): Record<string, unknown> => ({
  transcript: document.querySelector('.chat-column')?.textContent ?? null,
  activeRow: document.querySelector('[aria-current="true"]')?.textContent ?? null,
  project: openProject(),
  dock: screen.queryByRole('complementary', { name: 'Agents' })
    ? 'agents'
    : screen.queryByRole('complementary', { name: 'Commands' })
      ? 'commands'
      : null,
  drawer: screen.queryByRole('dialog')?.getAttribute('aria-label') ?? null,
  draft: composer().value,
  tray: trayChips().map((c) => c.textContent),
  popover: popover()?.textContent ?? null
})

// Fill EVERY piece of state a switch is supposed to drop, so a partial reset is
// visible rather than merely plausible. A pane that was already empty would let
// half an implementation pass.
const dirtyEverything = async (): Promise<void> => {
  fireEvent.click(rowButton('Here chat'))
  await screen.findByText('the here conversation')

  // a live Task card with its subagent drawer open
  fireEvent.change(composer(), { target: { value: 'go delegate' } })
  fireEvent.keyDown(composer(), { key: 'Enter' })
  harness.emit({
    type: 'tool-use',
    id: 'task-1',
    name: 'Task',
    input: { subagent_type: 'Explore', description: 'look around' }
  })
  harness.emit({ type: 'subagent', parentToolUseId: 'task-1', status: 'running' })
  fireEvent.click(document.querySelector('.subagent-row') as Element)
  await screen.findByRole('dialog')
  harness.emit({ type: 'turn-end' })

  // a pending composer insert from the commands dock, then the agents dock open
  fireEvent.click(screen.getByRole('button', { name: 'Commands panel' }))
  fireEvent.click(await screen.findByText('/preset'))
  fireEvent.click(screen.getByRole('button', { name: 'Agents panel' }))

  // an attachment in the tray
  harness.api.pickFiles.mockResolvedValue([IMAGE])
  fireEvent.click(screen.getByRole('button', { name: 'Attach files' }))
  await waitFor(() => expect(trayChips()).toHaveLength(1))

  // a draft that is simultaneously an open autocomplete popover
  fireEvent.change(composer(), { target: { value: '/pre' } })
  await waitFor(() => expect(popover()).toBeTruthy())
}

describe('wiring a foreign session row to switchWorkspace (#47)', () => {
  test("the row hands main the session's own project and id", async () => {
    await startSession()

    fireEvent.click(rowButton('Far chat'))

    expect(harness.api.switchWorkspace).toHaveBeenCalledWith({
      cwd: THERE,
      resumeId: 'far'
    })
  })

  test('a session with no recorded project is selectable and refused as missing-cwd', async () => {
    harness.api.switchWorkspace.mockResolvedValue({ status: 'missing-cwd' })
    await startSession()

    const row = rowButton('Homeless chat')
    expect(row.disabled).toBe(false)
    fireEvent.click(row)

    expect(harness.api.switchWorkspace).toHaveBeenCalledWith({ cwd: null, resumeId: 'nowhere' })
    await waitFor(() => expect(refusal()).toBeTruthy())
    expect(openProject()).toBe(FOLDER)
  })

  test('ok moves the workspace and replays the target without a second engine teardown', async () => {
    await startSession()

    fireEvent.click(rowButton('Far chat'))

    await screen.findByText('the far conversation')
    expect(openProject()).toBe(THERE)
    expect(harness.api.loadTranscript).toHaveBeenCalledWith('far')
    // The transaction already closed, rebuilt, targeted and warmed the engine.
    // `targetSession` would close that fresh engine and undo the warm-up, so the
    // in-project resume path must NOT run on top of a switch.
    expect(harness.api.targetSession).not.toHaveBeenCalled()
    expect(refusal()).toBeNull()
  })

  test('ok resets the messages', async () => {
    await startSession()
    await dirtyEverything()

    fireEvent.click(rowButton('Far chat'))

    await screen.findByText('the far conversation')
    expect(screen.queryByText('the here conversation')).toBeNull()
    expect(screen.queryByText('go delegate')).toBeNull()
  })

  test('ok resets the composer draft', async () => {
    await startSession()
    await dirtyEverything()
    expect(composer().value).toBe('/pre')

    fireEvent.click(rowButton('Far chat'))

    await waitFor(() => expect(composer().value).toBe(''))
  })

  test('ok resets the attachment tray', async () => {
    await startSession()
    await dirtyEverything()
    expect(trayChips()).toHaveLength(1)

    fireEvent.click(rowButton('Far chat'))

    await waitFor(() => expect(trayChips()).toHaveLength(0))
  })

  test('ok closes an open autocomplete popover', async () => {
    await startSession()
    await dirtyEverything()
    expect(popover()).toBeTruthy()

    fireEvent.click(rowButton('Far chat'))

    await waitFor(() => expect(popover()).toBeNull())
  })

  test('ok closes the open dock and the subagent drawer', async () => {
    await startSession()
    await dirtyEverything()

    fireEvent.click(rowButton('Far chat'))

    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: 'Agents' })).toBeNull()
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  // The pending insert is applied ON MOUNT, and the switch remounts the
  // composer — so a pending insert that survives the switch refills the new
  // project's composer with the old project's command. Nothing else in this
  // file distinguishes "cleared" from "leaked": the draft assertion above would
  // also pass if the composer were refilled from a stale insert.
  test('ok drops the pending composer insert instead of re-applying it on remount', async () => {
    await startSession()
    fireEvent.click(screen.getByRole('button', { name: 'Commands panel' }))
    fireEvent.click(await screen.findByText('/preset'))
    expect(composer().value).toBe('/preset ')

    fireEvent.click(rowButton('Far chat'))

    await screen.findByText('the far conversation')
    expect(composer().value).toBe('')
  })

  test('backend mode, permission mode and model survive an ok switch', async () => {
    await startSession()
    harness.emitBackend({ mode: 'wisped', wispedAvailable: true })
    harness.emitPermission('acceptEdits')
    harness.emitModel('opus')
    const pills = (): string[] => [
      screen.getByLabelText('Backend mode').textContent ?? '',
      screen.getByLabelText('Permission mode').textContent ?? '',
      screen.getByLabelText('Model').textContent ?? ''
    ]
    const before = pills()

    fireEvent.click(rowButton('Far chat'))

    await screen.findByText('the far conversation')
    expect(pills()).toEqual(before)
    // They are global preferences, not workspace state: a switch must not even
    // ask main to re-apply them.
    expect(harness.api.setBackendMode).not.toHaveBeenCalled()
    expect(harness.api.setPermissionMode).not.toHaveBeenCalled()
    expect(harness.api.setModel).not.toHaveBeenCalled()
  })
})

describe('a refused workspace switch changes nothing (#47)', () => {
  const REJECTIONS: Array<Exclude<SwitchStatus, 'ok'>> = ['busy', 'not-found', 'missing-cwd']

  test.each(REJECTIONS)('%s leaves every piece of renderer state untouched', async (status) => {
    await startSession()
    await dirtyEverything()
    harness.api.switchWorkspace.mockResolvedValue({ status })
    const before = snapshot()

    fireEvent.click(rowButton('Far chat'))

    await waitFor(() => expect(refusal()).toBeTruthy())
    expect(snapshot()).toEqual(before)
    // `here` was targeted legitimately by the local resume in dirtyEverything;
    // what a refusal must not do is reach the refused session at all.
    expect(harness.api.loadTranscript).not.toHaveBeenCalledWith('far')
    expect(harness.api.targetSession).not.toHaveBeenCalledWith('far')
  })

  test('each rejection is phrased distinctly — a generic message would hide the busy case', async () => {
    const seen = new Set<string>()
    for (const status of REJECTIONS) {
      harness.api.switchWorkspace.mockResolvedValue({ status })
      await startSession()
      fireEvent.click(rowButton('Far chat'))
      await waitFor(() => expect(refusal()).toBeTruthy())
      seen.add(refusal() as string)
      cleanup()
    }
    expect(seen.size).toBe(REJECTIONS.length)
  })

  // Busy is only reachable because a foreign row stays live mid-turn. Disabling
  // it would be a second busy source in the renderer AND would make the refusal
  // the transaction returns unreachable.
  test('a foreign row stays live while a turn streams, and main answers busy', async () => {
    harness.api.switchWorkspace.mockResolvedValue({ status: 'busy' })
    await startSession()
    fireEvent.change(composer(), { target: { value: 'hello' } })
    fireEvent.keyDown(composer(), { key: 'Enter' })

    expect(rowButton('Here chat').disabled).toBe(true)
    const far = rowButton('Far chat')
    expect(far.disabled).toBe(false)

    fireEvent.click(far)

    await waitFor(() => expect(refusal()).toBeTruthy())
    expect(openProject()).toBe(FOLDER)
    // Still streaming into the ORIGINAL conversation.
    harness.emit({ type: 'text-delta', text: 'streamed answer' })
    expect(await screen.findByText('streamed answer')).toBeTruthy()
  })

  test('the refusal clears when the next selection is accepted', async () => {
    harness.api.switchWorkspace.mockResolvedValue({ status: 'not-found' })
    await startSession()
    fireEvent.click(rowButton('Far chat'))
    await waitFor(() => expect(refusal()).toBeTruthy())

    harness.api.switchWorkspace.mockResolvedValue({ status: 'ok' })
    fireEvent.click(rowButton('Far chat'))

    await screen.findByText('the far conversation')
    expect(refusal()).toBeNull()
  })
})
