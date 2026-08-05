import { expect, vi } from 'vitest'
import { act } from '@testing-library/react'
import { createPermissionBroker } from '../src/main/permission-broker'
import type {
  EngineEvent,
  PermissionDecision,
  PermissionMode,
  RewindResult
} from '../src/shared/engine-types'
import type { BackendInfo } from '../src/shared/backend-types'
import type { ModelInfo, ModelOption } from '../src/shared/model-types'
import type { EffortLevel } from '../src/shared/effort'
import type { SendPayload } from '../src/shared/attachment-types'
import type { Candidate } from '../src/shared/attachment-policy'
import type { SlashCommandInfo } from '../src/shared/command-types'
import type { Bounds } from '../src/shared/window-bounds'
import type { BackgroundTask } from '../src/shared/background-tasks'
import type {
  DeleteStatus,
  FolderChoice,
  SwitchRequest,
  SwitchResult
} from '../src/shared/session-types'

// Mirrors what the CLI's supportedModels() actually returns — its own `value`
// as the id, its own `displayName` as the label. Kept faithful on purpose: the
// old fixture was four invented family tokens, which is exactly the shape the
// app no longer produces, and a fixture that disagrees with the CLI is how the
// hardcoded list survived unnoticed in the first place.
const CLI_MODELS: ModelOption[] = [
  { id: 'default', label: 'Default (recommended)' },
  { id: 'opus[1m]', label: 'Opus (1M context)' },
  { id: 'claude-fable-5[1m]', label: 'Fable' },
  { id: 'sonnet', label: 'Sonnet' },
  { id: 'sonnet[1m]', label: 'Sonnet 5 (1M context)' },
  { id: 'haiku', label: 'Haiku' },
  { id: 'claude-wisp-terra', label: 'terra — gpt-5.6-terra' }
]

// Test-side stand-in for preload+main plumbing: the scripted engine seam.
// Tests drive `emit` as the fake engine's event stream; permission responses
// settle through the real main-process broker.
// The project the harness "picks". Session fixtures must carry it as their
// `cwd` to count as in-project: the rail is global now (#45) and a row from
// another project is deliberately inert.
export const FOLDER = 'D:\\projects\\demo'

// #129 — every send now carries the id the CLI will store the message under, so
// every payload assertion in this suite names it.
//
// A MATCHER RATHER THAN `expect.any(String)`, and the difference is the point:
// the id is minted fresh per send so its VALUE cannot be pinned, but its SHAPE
// can, and the shape is what `normalizeSendPayload` refuses a message's rewind
// control for getting wrong. `any(String)` would keep these assertions green
// against a build that shipped `uuid: ''`.
//
// Written into each expected object rather than folded into a looser
// `objectContaining` so the assertions stay EXACT — an unexpected fourth field
// on the send channel must still fail them, which is what they were for.
export const SENT_UUID = expect.stringMatching(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
)

export const fakeChatApi = (folder = FOLDER) => {
  const prompts: SendPayload[] = []
  const permissionResponses: Array<{ toolUseId: string; decision: PermissionDecision }> =
    []
  const broker = createPermissionBroker()
  const listeners = new Set<(e: EngineEvent) => void>()
  const backendListeners = new Set<(info: BackendInfo) => void>()
  const permListeners = new Set<(mode: PermissionMode) => void>()
  const modelListeners = new Set<(model: string | null) => void>()
  const effortListeners = new Set<(effort: EffortLevel | null) => void>()
  const sessionChangedListeners = new Set<(id: string) => void>()
  const terminalListeners = new Set<() => void>()
  const taskListeners = new Set<(t: BackgroundTask[]) => void>()
  const subagentListeners = new Set<(e: Extract<EngineEvent, { type: 'subagent' }>) => void>()
  const api = {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
    pickFolder: vi.fn<() => Promise<string | null>>().mockResolvedValue(folder),
    // Defaults to cancelled: a test that means to choose a folder says so, and
    // one that never touches the picker cannot accidentally move workspace.
    chooseFolder: vi
      .fn<() => Promise<FolderChoice>>()
      .mockResolvedValue({ status: 'cancelled' }),
    pickFiles: vi.fn<() => Promise<Candidate[]>>().mockResolvedValue([]),
    listSessions: vi.fn().mockResolvedValue([]),
    loadTranscript: vi.fn().mockResolvedValue([]),
    // Only rows with a bare slash-command title ever reach this (#49); the
    // default answer is "nothing better to show", so a fixture keeps its title.
    titleHint: vi.fn<(id: string, cwd: string | null) => Promise<string | null>>()
      .mockResolvedValue(null),
    listSubagents: vi.fn().mockResolvedValue([]),
    listBackgroundSessions: vi.fn().mockResolvedValue([]),
    subagentTranscript: vi.fn().mockResolvedValue([]),
    switchWorkspace: vi
      .fn<(req: SwitchRequest) => Promise<SwitchResult>>()
      .mockResolvedValue({ status: 'ok' }),
    // Succeeds by default: a test about a FAILED delete scripts the failure, and
    // one that never deletes cannot be surprised by a refusal it did not ask for.
    deleteSession: vi.fn<(id: string) => Promise<DeleteStatus>>().mockResolvedValue('ok'),
    targetSession: vi.fn(),
    currentSessionId: vi.fn<() => Promise<string | null>>().mockResolvedValue(null),
    backendMode: vi.fn().mockResolvedValue({ mode: 'native', wispedAvailable: false }),
    setBackendMode: vi.fn(),
    setZoom: vi.fn(),
    setBackdrop: vi.fn(),
    setWindowBounds: vi.fn(),
    // Typed with the real callback rather than as a bare `vi.fn(() => ...)`:
    // #79's boundary test reaches into `mock.calls[0][0]` to deliver a report
    // the way main delivers one, and a zero-arg mock makes that an empty tuple.
    onWindowBoundsChanged: vi.fn((_cb: (bounds: Bounds) => void) => () => {}),
    sendPrompt: (payload: SendPayload): void => {
      prompts.push(payload)
    },
    stopTurn: vi.fn(),
    respondToPermission: (toolUseId: string, decision: PermissionDecision): void => {
      permissionResponses.push({ toolUseId, decision })
      broker.respond(toolUseId, decision)
    },
    onChatEvent: (cb: (e: EngineEvent) => void): (() => void) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    // #73: the engine went terminal. Driven by `emitTerminal()` below — the
    // signal is payload-free, so the fixture is just the subscription.
    onEngineTerminal: (cb: () => void): (() => void) => {
      terminalListeners.add(cb)
      return () => terminalListeners.delete(cb)
    },
    // #83: the CLI's live background-task set. Driven by `emitBackgroundTasks()`
    // below, which delivers a whole set the way main does — the payload IS the
    // membership, so a fixture that appended would be testing the wrong contract.
    onBackgroundTasks: (cb: (tasks: BackgroundTask[]) => void): (() => void) => {
      taskListeners.add(cb)
      return () => taskListeners.delete(cb)
    },
    onSubagent: (
      cb: (event: Extract<EngineEvent, { type: 'subagent' }>) => void
    ): (() => void) => {
      subagentListeners.add(cb)
      return () => subagentListeners.delete(cb)
    },
    onBackendChanged: (cb: (info: BackendInfo) => void): (() => void) => {
      backendListeners.add(cb)
      return () => backendListeners.delete(cb)
    },
    permissionMode: vi
      .fn<() => Promise<PermissionMode>>()
      .mockResolvedValue('bypassPermissions'),
    setPermissionMode: vi.fn(),
    onPermissionChanged: (cb: (mode: PermissionMode) => void): (() => void) => {
      permListeners.add(cb)
      return () => permListeners.delete(cb)
    },
    listCommands: vi
      .fn<() => Promise<SlashCommandInfo[]>>()
      .mockResolvedValue([]),
    // #118 — the `@` file list. Empty by default so no existing test grows a
    // popover it never asked for; the at-mentions suite sets its own.
    listWorkspaceFiles: vi.fn<() => Promise<string[]>>().mockResolvedValue([]),
    listModels: vi
      .fn<() => Promise<ModelInfo>>()
      .mockResolvedValue({ models: CLI_MODELS, current: null, effort: null }),
    setModel: vi.fn(),
    onModelChanged: (cb: (model: string | null) => void): (() => void) => {
      modelListeners.add(cb)
      return () => modelListeners.delete(cb)
    },
    // #124 — the effort pick. No `listEffort` to stub: the value rides
    // listModels above, exactly as it does over the real bridge.
    setEffort: vi.fn(),
    onEffortChanged: (cb: (effort: EffortLevel | null) => void): (() => void) => {
      effortListeners.add(cb)
      return () => effortListeners.delete(cb)
    },
    // Live-tail (#57): a signal in, a signal out. Never transcript bytes — the
    // transcript still travels over loadTranscript.
    watchSession: vi.fn<(id: string | null) => void>(),
    onSessionChanged: (cb: (id: string) => void): (() => void) => {
      sessionChangedListeners.add(cb)
      return () => sessionChangedListeners.delete(cb)
    },
    // #129. The default REFUSES, so no suite that merely renders a sent message
    // can accidentally exercise a destructive path — a test that wants the
    // rewind to work says so by replacing this mock.
    rewindFiles: vi.fn<(userMessageId: string, dryRun: boolean) => Promise<RewindResult>>(
      async () => ({
        canRewind: false,
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
        error: 'File rewinding is not enabled.'
      })
    )
  }
  const emit = (e: EngineEvent): void => {
    act(() => {
      listeners.forEach((l) => l(e))
    })
  }
  const emitBackend = (info: BackendInfo): void => {
    act(() => {
      backendListeners.forEach((l) => l(info))
    })
  }
  const emitPermission = (mode: PermissionMode): void => {
    act(() => {
      permListeners.forEach((l) => l(mode))
    })
  }
  const emitModel = (model: string | null): void => {
    act(() => {
      modelListeners.forEach((l) => l(model))
    })
  }
  const emitEffort = (effort: EffortLevel | null): void => {
    act(() => {
      effortListeners.forEach((l) => l(effort))
    })
  }
  const emitSessionChanged = (id: string): void => {
    act(() => {
      sessionChangedListeners.forEach((l) => l(id))
    })
  }
  const emitTerminal = (): void => {
    act(() => {
      terminalListeners.forEach((l) => l())
    })
  }
  const emitBackgroundTasks = (tasks: BackgroundTask[]): void => {
    act(() => {
      taskListeners.forEach((l) => l(tasks))
    })
  }
  const emitSubagent = (event: Extract<EngineEvent, { type: 'subagent' }>): void => {
    act(() => {
      subagentListeners.forEach((listener) => listener(event))
    })
  }
  const waitForPermission = (toolUseId: string): Promise<PermissionDecision> =>
    broker.request({ toolUseId, signal: new AbortController().signal })
  return {
    api,
    prompts,
    permissionResponses,
    emit,
    emitBackend,
    emitPermission,
    emitModel,
    emitEffort,
    emitSessionChanged,
    emitTerminal,
    emitBackgroundTasks,
    emitSubagent,
    waitForPermission
  }
}
