import { contextBridge, ipcRenderer } from 'electron'

const api = {
  minimize: (): void => ipcRenderer.send('window:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('window:toggle-maximize'),
  close: (): void => ipcRenderer.send('window:close')
}

contextBridge.exposeInMainWorld('api', api)
