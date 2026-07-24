import { contextBridge, ipcRenderer } from 'electron'
import type { EngineEvent, PermissionDecision, PermissionMode } from '../shared/engine-types'
import type { SessionMeta, TranscriptMessage } from '../shared/session-types'
import type { BackendInfo, BackendMode } from '../shared/backend-types'
import type { ModelInfo } from '../shared/model-types'

const api = {
  minimize: (): void => ipcRenderer.send('window:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('window:toggle-maximize'),
  close: (): void => ipcRenderer.send('window:close'),
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('session:pick-folder'),
  listSessions: (): Promise<SessionMeta[]> => ipcRenderer.invoke('session:list'),
  loadTranscript: (id: string): Promise<TranscriptMessage[]> =>
    ipcRenderer.invoke('session:transcript', id),
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
  listModels: (): Promise<ModelInfo> => ipcRenderer.invoke('model:list'),
  setModel: (model: string | null): void => ipcRenderer.send('model:set', model),
  onModelChanged: (cb: (model: string | null) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, model: string | null): void => cb(model)
    ipcRenderer.on('model:changed', listener)
    return () => {
      ipcRenderer.removeListener('model:changed', listener)
    }
  },
  setZoom: (level: number): void => ipcRenderer.send('zoom:set', level),
  sendPrompt: (text: string): void => ipcRenderer.send('chat:send', text),
  stopTurn: (): void => ipcRenderer.send('chat:stop'),
  respondToPermission: (toolUseId: string, decision: PermissionDecision): void => {
    ipcRenderer.send('chat:permission-response', toolUseId, decision)
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
