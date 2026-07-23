import { contextBridge, ipcRenderer } from 'electron'
import type { EngineEvent, PermissionDecision } from '../shared/engine-types'

const api = {
  minimize: (): void => ipcRenderer.send('window:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('window:toggle-maximize'),
  close: (): void => ipcRenderer.send('window:close'),
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('session:pick-folder'),
  sendPrompt: (text: string): void => ipcRenderer.send('chat:send', text),
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
