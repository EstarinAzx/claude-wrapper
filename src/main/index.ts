import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createEngine } from './engine'
import {
  initBackendMode,
  getSpawnEnv,
  getBackendMode,
  setBackendMode,
  isWispedAvailable
} from './backend-mode'
import { isTrustedRendererUrl } from './navigation'
import { createPermissionBroker } from './permission-broker'
import { getSessionCwd, setSessionCwd } from './session'
import { listSessions, readTranscript } from './session-store'
import type { PermissionDecision } from '../shared/engine-types'

let engine: ReturnType<typeof createEngine> | null = null
let pendingResume: string | null = null
const permissionBroker = createPermissionBroker()
const rendererFile = join(__dirname, '../renderer/index.html')
const rendererUrl = pathToFileURL(rendererFile).href

// Snapshot the launch env once; the initial backend mode matches how the app
// was launched (wisp env present → wisped, else native).
initBackendMode(process.env)

const makeEngine = (): ReturnType<typeof createEngine> =>
  createEngine(
    getSessionCwd,
    ({ toolUseId, signal }) => permissionBroker.request({ toolUseId, signal }),
    undefined,
    () => getSpawnEnv(process.env)
  )

const isTrustedIpc = (
  event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent
): boolean =>
  event.senderFrame === event.sender.mainFrame &&
  isTrustedRendererUrl(
    event.senderFrame?.url ?? event.sender.getURL(),
    process.env['ELECTRON_RENDERER_URL'],
    rendererUrl
  )

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 640,
    minHeight: 480,
    show: false,
    titleBarStyle: 'hidden',
    backgroundMaterial: 'acrylic',
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })
  const blockExternalNavigation = (event: Electron.Event, url: string): void => {
    if (isTrustedRendererUrl(url, process.env['ELECTRON_RENDERER_URL'], rendererUrl)) {
      return
    }
    event.preventDefault()
    void shell.openExternal(url)
  }
  win.webContents.on('will-navigate', blockExternalNavigation)
  win.webContents.on('will-redirect', blockExternalNavigation)

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(rendererFile)
  }
}

ipcMain.on('window:minimize', (event) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.minimize()
})

ipcMain.on('window:toggle-maximize', (event) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})

ipcMain.on('window:close', (event) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.close()
})

ipcMain.handle('session:pick-folder', async (event) => {
  if (!isTrustedIpc(event)) return null
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return null
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })
  if (canceled || filePaths.length === 0) return null
  engine?.close()
  permissionBroker.cancelAll()
  setSessionCwd(filePaths[0])
  engine = makeEngine()
  pendingResume = null
  return filePaths[0]
})

ipcMain.handle('session:list', async (event) => {
  if (!isTrustedIpc(event)) return []
  return listSessions(getSessionCwd())
})

ipcMain.handle('session:transcript', async (event, id: string) => {
  if (!isTrustedIpc(event)) return []
  return readTranscript(getSessionCwd(), String(id))
})

ipcMain.on('chat:target', (event, id: unknown) => {
  if (!isTrustedIpc(event)) return
  engine?.close()
  permissionBroker.cancelAll()
  engine = null
  pendingResume = typeof id === 'string' && id ? id : null
})

ipcMain.handle('chat:session-id', (event) => {
  if (!isTrustedIpc(event)) return null
  return engine?.sessionId() ?? null
})

// Read-only: the renderer pill asks which backend the app launched against.
// Carries the mode enum + availability flag only — never the proxy secret.
ipcMain.handle('backend:mode', (event) => {
  if (!isTrustedIpc(event)) return { mode: 'native', wispedAvailable: false }
  return { mode: getBackendMode(), wispedAvailable: isWispedAvailable() }
})

// Guarded write: flip the backend the next turn spawns against. Carries only the
// target mode enum. Reuses the chat:target teardown (close the engine, cancel
// pending permissions, null the engine) and additionally drops the resume target
// so the flip lands in a FRESH chat, not a resume of the prior conversation. The
// lazy chat:send rebuilds the engine with the new mode's spawn env. Locked to
// native when the launch env carried no wisp routing. Broadcasts the resolved
// mode back so the pill + renderer re-render.
ipcMain.on('backend:set-mode', (event, mode: unknown) => {
  if (!isTrustedIpc(event)) return
  if (mode !== 'native' && mode !== 'wisped') return
  if (mode === 'wisped' && !isWispedAvailable()) return
  setBackendMode(mode)
  engine?.close()
  permissionBroker.cancelAll()
  engine = null
  pendingResume = null
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.webContents.send('backend:changed', {
    mode: getBackendMode(),
    wispedAvailable: isWispedAvailable()
  })
})

ipcMain.on('chat:send', (event, text: string) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!engine) {
    engine = makeEngine()
  }
  void engine.runTurn(
    String(text),
    (e) => {
      win?.webContents.send('chat:event', e)
    },
    pendingResume ?? undefined
  )
})

ipcMain.on(
  'chat:permission-response',
  (event, toolUseId: string, decision: PermissionDecision) => {
    if (!isTrustedIpc(event)) return
    permissionBroker.respond(String(toolUseId), decision)
  }
)

ipcMain.on('chat:stop', (event) => {
  if (!isTrustedIpc(event)) return
  engine?.interrupt()
  permissionBroker.cancelAll()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => app.quit())
