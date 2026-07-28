import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import App from '../src/renderer/src/App'
import { fakeChatApi, FOLDER } from './chat-harness'

// #48 — the folder picker, reachable after the first pick. A new or empty
// project has no session to resume into, so session discovery alone can never
// reach it; the sidebar affordance is the way in. It runs the SAME transaction a
// foreign session row runs (#46/#47), only with `resumeId: null`.
//
// The ticket's named sharpest failure mode is reaching for `pickFolder`, which
// already exists and already changes main's cwd — and leaves every piece of
// renderer state stale while doing it. Nothing about a green pane distinguishes
// the two paths after the fact, so the assertions below are on the MECHANISM:
// which IPC was called, with what, and which ones were not called at all.

const NEW_FOLDER = 'D:\\projects\\fresh'

const COMMANDS = [{ name: 'preset', description: 'Load a preset', argumentHint: '' }]

const IMAGE = { name: 'shot.png', mediaType: 'image/png', data: 'AAAA' }

let harness: ReturnType<typeof fakeChatApi>

beforeEach(() => {
  harness = fakeChatApi()
  ;(window as Window & { api: unknown }).api = harness.api
  harness.api.listSessions.mockResolvedValue([
    { id: 'here', title: 'Here chat', lastUpdated: 2000, cwd: FOLDER }
  ])
  harness.api.loadTranscript.mockResolvedValue([
    { role: 'user' as const, text: 'the here conversation' }
  ])
  harness.api.listCommands.mockResolvedValue(COMMANDS)
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const composer = (): HTMLTextAreaElement =>
  screen.getByPlaceholderText('Message Claude…') as HTMLTextAreaElement

const openProjectBtn = (): HTMLButtonElement =>
  screen.getByRole('button', { name: 'Open project' }) as HTMLButtonElement

const trayChips = (): Element[] =>
  Array.from(document.querySelectorAll('.attachment-tray .attachment-chip'))

const popover = (): Element | null => document.querySelector('.command-popover')

const refusal = (): string | null =>
  document.querySelector('.switch-refusal')?.textContent ?? null

const openProject = (): string | null =>
  document.querySelector('.session-title')?.getAttribute('title') ?? null

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

const startSession = async (): Promise<void> => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Pick a project folder' }))
  await screen.findByText('demo')
  await screen.findByText('Here chat')
}

// Fill every piece of state the switch is supposed to drop, so a partial reset
// is visible rather than merely plausible.
const dirtyEverything = async (): Promise<void> => {
  fireEvent.click(screen.getByText('Here chat').closest('button') as HTMLButtonElement)
  await screen.findByText('the here conversation')

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

  fireEvent.click(screen.getByRole('button', { name: 'Commands panel' }))
  fireEvent.click(await screen.findByText('/preset'))
  fireEvent.click(screen.getByRole('button', { name: 'Agents panel' }))

  harness.api.pickFiles.mockResolvedValue([IMAGE])
  fireEvent.click(screen.getByRole('button', { name: 'Attach files' }))
  await waitFor(() => expect(trayChips()).toHaveLength(1))

  fireEvent.change(composer(), { target: { value: '/pre' } })
  await waitFor(() => expect(popover()).toBeTruthy())
}

describe('the folder picker is reachable after the first pick (#48)', () => {
  test('the sidebar header carries the affordance, beside "New chat"', async () => {
    await startSession()

    const actions = document.querySelector('.sidebar-head-actions') as HTMLElement
    const labels = Array.from(actions.querySelectorAll('button')).map((b) =>
      b.getAttribute('aria-label')
    )
    expect(labels).toContain('Open project')
    // Adjacent to "New chat", and inside the sessions rail — not a new chrome
    // region and not the titlebar, which holds global preferences only.
    expect(Math.abs(labels.indexOf('Open project') - labels.indexOf('New chat'))).toBe(1)
    expect(screen.queryByRole('button', { name: 'Pick a project folder' })).toBeNull()
  })

  test('choosing a folder switches the workspace with a null resumeId', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    await startSession()

    fireEvent.click(openProjectBtn())

    await waitFor(() =>
      expect(harness.api.switchWorkspace).toHaveBeenCalledWith({
        cwd: NEW_FOLDER,
        resumeId: null
      })
    )
    await waitFor(() => expect(openProject()).toBe(NEW_FOLDER))
    expect(refusal()).toBeNull()
  })

  // The whole reason a chooser-only IPC exists. `pickFolder` would ALSO land a
  // new cwd in main and ALSO leave the pane looking switched — so no assertion
  // about the resulting UI can tell the two apart. Only the call can.
  test('it never reaches for the mutating pickFolder', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    await startSession()
    harness.api.pickFolder.mockClear()

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(harness.api.switchWorkspace).toHaveBeenCalled())
    expect(harness.api.pickFolder).not.toHaveBeenCalled()
  })

  // An empty folder has no session, so there is nothing to replay. A transcript
  // read here would mean the null case was being routed through the resume path.
  test('a null resumeId adopts no session and reads no transcript', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    await startSession()
    harness.api.loadTranscript.mockClear()

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(openProject()).toBe(NEW_FOLDER))
    expect(harness.api.loadTranscript).not.toHaveBeenCalled()
    expect(document.querySelector('[aria-current="true"]')).toBeNull()
  })

  // `newChat()` is the obvious way to clear the pane and the wrong one: it sends
  // `targetSession(null)`, which closes and nulls the engine the transaction has
  // just rebuilt and warmed. An empty pane looks identical either way.
  test('ok never calls targetSession — the transaction already warmed the engine', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    await startSession()
    harness.api.targetSession.mockClear()

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(openProject()).toBe(NEW_FOLDER))
    expect(harness.api.targetSession).not.toHaveBeenCalled()
  })

  test('ok performs the full renderer reset', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    await startSession()
    await dirtyEverything()

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(openProject()).toBe(NEW_FOLDER))
    // the conversation
    expect(screen.queryByText('the here conversation')).toBeNull()
    expect(screen.queryByText('go delegate')).toBeNull()
    // the composer: draft, tray and autocomplete all live inside it, and only
    // the `key={cwd}` remount takes all three
    await waitFor(() => expect(composer().value).toBe(''))
    expect(trayChips()).toHaveLength(0)
    expect(popover()).toBeNull()
    // the docks and the drawer
    expect(screen.queryByRole('complementary', { name: 'Agents' })).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  // The pending insert is applied ON MOUNT and the switch remounts the composer,
  // so a survivor refills the NEW project's composer with the old project's
  // command. The empty-draft assertion above would pass either way.
  test('ok drops the pending composer insert instead of re-applying it on remount', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    await startSession()
    fireEvent.click(screen.getByRole('button', { name: 'Commands panel' }))
    fireEvent.click(await screen.findByText('/preset'))
    expect(composer().value).toBe('/preset ')

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(openProject()).toBe(NEW_FOLDER))
    expect(composer().value).toBe('')
  })

  test('backend mode, permission mode and model survive the switch', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
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

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(openProject()).toBe(NEW_FOLDER))
    expect(pills()).toEqual(before)
    expect(harness.api.setBackendMode).not.toHaveBeenCalled()
    expect(harness.api.setPermissionMode).not.toHaveBeenCalled()
    expect(harness.api.setModel).not.toHaveBeenCalled()
  })
})

describe('a cancelled folder pick is a true no-op (#48)', () => {
  test('cancelling calls switchWorkspace zero times and mutates nothing', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'cancelled' })
    await startSession()
    await dirtyEverything()
    const before = snapshot()

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(harness.api.chooseFolder).toHaveBeenCalledOnce())
    expect(harness.api.switchWorkspace).not.toHaveBeenCalled()
    expect(snapshot()).toEqual(before)
    // Not even a refusal: nothing was refused, the user simply changed their
    // mind. A message here would be noise on a deliberate cancel.
    expect(refusal()).toBeNull()
  })
})

describe('a refused folder switch changes nothing (#48)', () => {
  test('busy leaves every piece of renderer state untouched', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    harness.api.switchWorkspace.mockResolvedValue({ status: 'busy' })
    await startSession()
    await dirtyEverything()
    const before = snapshot()

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(refusal()).toBeTruthy())
    expect(snapshot()).toEqual(before)
    expect(openProject()).toBe(FOLDER)
  })

  // Busy is only reachable because the affordance stays live mid-turn. Disabling
  // it — as "New chat" beside it is disabled — would be a second busy source in
  // the renderer AND would make the refusal the transaction returns unreachable.
  test('the affordance stays live while a turn streams, and main answers busy', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    harness.api.switchWorkspace.mockResolvedValue({ status: 'busy' })
    await startSession()
    fireEvent.change(composer(), { target: { value: 'hello' } })
    fireEvent.keyDown(composer(), { key: 'Enter' })

    expect(screen.getByRole('button', { name: 'New chat' }).hasAttribute('disabled')).toBe(true)
    expect(openProjectBtn().disabled).toBe(false)

    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(refusal()).toBeTruthy())
    expect(openProject()).toBe(FOLDER)
    // Still streaming into the ORIGINAL conversation.
    harness.emit({ type: 'text-delta', text: 'streamed answer' })
    expect(await screen.findByText('streamed answer')).toBeTruthy()
  })

  test('the refusal clears when the next pick is accepted', async () => {
    harness.api.chooseFolder.mockResolvedValue({ status: 'selected', cwd: NEW_FOLDER })
    harness.api.switchWorkspace.mockResolvedValue({ status: 'busy' })
    await startSession()
    fireEvent.click(openProjectBtn())
    await waitFor(() => expect(refusal()).toBeTruthy())

    harness.api.switchWorkspace.mockResolvedValue({ status: 'ok' })
    fireEvent.click(openProjectBtn())

    await waitFor(() => expect(openProject()).toBe(NEW_FOLDER))
    expect(refusal()).toBeNull()
  })
})
