import { contextBridge, ipcRenderer } from 'electron'
import type { EngineEvent, PermissionDecision } from '../shared/engine-types'
import type { SessionMeta, TranscriptMessage } from '../shared/session-types'
import type { BackendInfo } from '../shared/backend-types'

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
