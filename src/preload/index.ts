import { contextBridge, ipcRenderer } from 'electron'
import type { EngineEvent, PermissionDecision, PermissionMode } from '../shared/engine-types'
import type {
  DeleteStatus,
  FolderChoice,
  SessionMeta,
  SwitchRequest,
  SwitchResult,
  TranscriptMessage
} from '../shared/session-types'
import type { BackendInfo, BackendMode } from '../shared/backend-types'
import type { Backdrop } from '../shared/backdrop'
import type { Bounds } from '../shared/window-bounds'
import type { ModelInfo } from '../shared/model-types'
import type { EffortLevel } from '../shared/effort'
import type { SlashCommandInfo } from '../shared/command-types'
import type { SubagentInfo } from '../shared/subagent-types'
import type { BackgroundTask } from '../shared/background-tasks'
import type { BackgroundSession } from '../shared/background-session-types'
import type { SendPayload } from '../shared/attachment-types'
import type { Candidate } from '../shared/attachment-policy'

const api = {
  minimize: (): void => ipcRenderer.send('window:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('window:toggle-maximize'),
  close: (): void => ipcRenderer.send('window:close'),
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('session:pick-folder'),
  chooseFolder: (): Promise<FolderChoice> => ipcRenderer.invoke('session:choose-folder'),
  pickFiles: (): Promise<Candidate[]> => ipcRenderer.invoke('attachments:pick'),
  // `null` is a FAILED read on both of these (#60), never "nothing there" — the
  // empty array still means the store honestly holds nothing. A pass-through:
  // main types the distinction, the renderer renders it.
  listSessions: (): Promise<SessionMeta[] | null> => ipcRenderer.invoke('session:list'),
  loadTranscript: (id: string): Promise<TranscriptMessage[] | null> =>
    ipcRenderer.invoke('session:transcript', id),
  titleHint: (id: string, cwd: string | null): Promise<string | null> =>
    ipcRenderer.invoke('session:title-hint', id, cwd),
  listSubagents: (sessionId: string): Promise<SubagentInfo[] | null> =>
    ipcRenderer.invoke('subagents:list', sessionId),
  subagentTranscript: (
    sessionId: string,
    parentToolUseId: string
  ): Promise<TranscriptMessage[]> =>
    ipcRenderer.invoke('subagents:transcript', sessionId, parentToolUseId),
  // #91: the workspace's LIVE BACKGROUND SESSIONS — the CLI's agent view, a
  // different thing from `listSubagents` above (subagents inside ONE session)
  // and from `onBackgroundTasks` below (jobs inside ONE session). Pull-only and
  // deliberately expensive-by-the-call: one CLI process per look, ~893ms (#90).
  // Nothing may call this on a timer. `null` = the look failed; `[]` = nothing
  // is running here, which is a real answer.
  listBackgroundSessions: (): Promise<BackgroundSession[] | null> =>
    ipcRenderer.invoke('background-sessions:list'),
  switchWorkspace: (req: SwitchRequest): Promise<SwitchResult> =>
    ipcRenderer.invoke('session:switch-workspace', req),
  // Destructive and irreversible (#68). Two outcomes only: a store that no
  // longer holds the session is `ok`, everything else is `failed`.
  deleteSession: (id: string): Promise<DeleteStatus> =>
    ipcRenderer.invoke('session:delete', id),
  targetSession: (id: string | null): void => ipcRenderer.send('chat:target', id),
  currentSessionId: (): Promise<string | null> => ipcRenderer.invoke('chat:session-id'),
  backendMode: (): Promise<BackendInfo> => ipcRenderer.invoke('backend:mode'),
  setBackendMode: (mode: BackendMode): void => ipcRenderer.send('backend:set-mode', mode),
  onBackendChanged: (cb: (info: BackendInfo) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, info: BackendInfo): void => cb(info)
    ipcRenderer.on('backend:changed', listener)
    return () => {
      ipcRenderer.removeListener('backend:changed', listener)
    }
  },
  permissionMode: (): Promise<PermissionMode> => ipcRenderer.invoke('permission:mode'),
  setPermissionMode: (mode: PermissionMode): void =>
    ipcRenderer.send('permission:set-mode', mode),
  onPermissionChanged: (cb: (mode: PermissionMode) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, mode: PermissionMode): void => cb(mode)
    ipcRenderer.on('permission:changed', listener)
    return () => {
      ipcRenderer.removeListener('permission:changed', listener)
    }
  },
  listCommands: (): Promise<SlashCommandInfo[]> => ipcRenderer.invoke('commands:list'),
  // #118 — the open workspace's referenceable files, as workspace-relative
  // POSIX paths. Typing assistance ONLY: `@path` in prompt text is already
  // resolved by the CLI (#116 measured it), so nothing here touches the send
  // path. `[]` is the honest answer for "no workspace open" as well as for an
  // empty one — the composer exists before a folder is picked.
  listWorkspaceFiles: (): Promise<string[]> => ipcRenderer.invoke('files:list'),
  listModels: (): Promise<ModelInfo> => ipcRenderer.invoke('model:list'),
  setModel: (model: string | null): void => ipcRenderer.send('model:set', model),
  onModelChanged: (cb: (model: string | null) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, model: string | null): void => cb(model)
    ipcRenderer.on('model:changed', listener)
    return () => {
      ipcRenderer.removeListener('model:changed', listener)
    }
  },
  // #124 — the effort pick. No `listEffort`: the current value rides
  // `listModels` above, because which levels the control may offer is read off
  // the model rows in that same payload.
  setEffort: (effort: EffortLevel | null): void => ipcRenderer.send('effort:set', effort),
  onEffortChanged: (cb: (effort: EffortLevel | null) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, effort: EffortLevel | null): void =>
      cb(effort)
    ipcRenderer.on('effort:changed', listener)
    return () => {
      ipcRenderer.removeListener('effort:changed', listener)
    }
  },
  // Live-tail (#57): a signal out, a signal in. `null` stops watching. The
  // transcript itself keeps travelling over loadTranscript — nothing about the
  // payload of a session changes shape here.
  watchSession: (id: string | null): void => ipcRenderer.send('session:watch', id),
  onSessionChanged: (cb: (id: string) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, id: string): void => cb(id)
    ipcRenderer.on('session:changed', listener)
    return () => {
      ipcRenderer.removeListener('session:changed', listener)
    }
  },
  setZoom: (level: number): void => ipcRenderer.send('zoom:set', level),
  // One-way, like zoom (#69): the renderer owns the stored preference, main
  // owns the window it applies to. Pushed on mount and on every change.
  setBackdrop: (material: Backdrop): void => ipcRenderer.send('backdrop:set', material),
  // #79 — the first preference that travels BOTH ways, because it is the first
  // one the user changes by dragging the window rather than by using a control.
  // Out on mount (`null` = nothing stored, and main gates `show()` on this
  // message arriving either way), and back in whenever main reports a settled
  // move or resize.
  setWindowBounds: (bounds: Bounds | null): void => ipcRenderer.send('bounds:set', bounds),
  onWindowBoundsChanged: (cb: (bounds: Bounds) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, bounds: Bounds): void => cb(bounds)
    ipcRenderer.on('bounds:changed', listener)
    return () => {
      ipcRenderer.removeListener('bounds:changed', listener)
    }
  },
  sendPrompt: (payload: SendPayload): void => ipcRenderer.send('chat:send', payload),
  stopTurn: (): void => ipcRenderer.send('chat:stop'),
  respondToPermission: (toolUseId: string, decision: PermissionDecision): void => {
    ipcRenderer.send('chat:permission-response', toolUseId, decision)
  },
  // #73: the engine went terminal — the CLI died under us, as opposed to a
  // per-turn failure. Payload-free: the error text already arrives on
  // `chat:event`, and the only thing missing there is which kind it was.
  onEngineTerminal: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on('engine:terminal', listener)
    return () => {
      ipcRenderer.removeListener('engine:terminal', listener)
    }
  },
  // #83: the CLI's live background-task set, pushed whenever membership changes
  // and reset to `[]` whenever main rebuilds the engine. REPLACE semantics —
  // swap the set for each payload; pairing starts with finishes is what lets a
  // dropped message wedge a stale "running" row.
  onBackgroundTasks: (cb: (tasks: BackgroundTask[]) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, tasks: BackgroundTask[]): void =>
      cb(tasks)
    ipcRenderer.on('tasks:changed', listener)
    return () => {
      ipcRenderer.removeListener('tasks:changed', listener)
    }
  },
  onSubagent: (
    cb: (event: Extract<EngineEvent, { type: 'subagent' }>) => void
  ): (() => void) => {
    const listener = (
      _e: Electron.IpcRendererEvent,
      event: Extract<EngineEvent, { type: 'subagent' }>
    ): void => cb(event)
    ipcRenderer.on('subagent:changed', listener)
    return () => {
      ipcRenderer.removeListener('subagent:changed', listener)
    }
  },
  onChatEvent: (cb: (e: EngineEvent) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, ev: EngineEvent): void => cb(ev)
    ipcRenderer.on('chat:event', listener)
    return () => {
      ipcRenderer.removeListener('chat:event', listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
