import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'node:path'
import { createEngine } from './engine'
import { getSessionCwd, setSessionCwd } from './session'
import type { Engine } from '../shared/engine-types'

let engine: Engine | null = null

function createWindow(): void {
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
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.on('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.minimize()
})

ipcMain.on('window:toggle-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})

ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.close()
})

ipcMain.handle('session:pick-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return null
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })
  if (canceled || filePaths.length === 0) return null
  setSessionCwd(filePaths[0])
  engine = createEngine(getSessionCwd)
  return filePaths[0]
})

ipcMain.on('chat:send', (event, text: string) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!engine) {
    engine = createEngine(getSessionCwd)
  }
  void engine.runTurn(String(text), (e) => {
    win?.webContents.send('chat:event', e)
  })
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => app.quit())
