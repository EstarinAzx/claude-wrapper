import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFile, stat } from 'node:fs/promises'
import { createEngine } from './engine'
import {
  initBackendMode,
  getSpawnEnv,
  getBackendMode,
  setBackendMode,
  isWispedAvailable
} from './backend-mode'
import { getPermissionMode, setPermissionMode, toPermissionOptions } from './permission-mode'
import { getModelMode, setModelMode, toModelOptions } from './model-mode'
import { clampZoom } from '../shared/zoom'
import { normalizeSendPayload } from '../shared/attachment-types'
import {
  MAX_IMAGE_BYTES,
  isEmbeddable,
  mediaTypeForPath,
  type Candidate
} from '../shared/attachment-policy'
import { isTrustedRendererUrl } from './navigation'
import { createPermissionBroker } from './permission-broker'
import { getSessionCwd, setSessionCwd } from './session'
import { resetSessionIndex, resolveResumeTarget } from './session-index'
import {
  switchWorkspace as runSwitchWorkspace,
  type SwitchRequest,
  type SwitchResult
} from './switch-workspace'
import type { FolderChoice } from '../shared/session-types'
import { listSessions, readTranscript, titleHint } from './session-store'
import { listSubagents, readSubagentTranscript } from './subagent-store'
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
    () => getSpawnEnv(process.env),
    () => toPermissionOptions(getPermissionMode()),
    () => toModelOptions(getModelMode())
  )

// The atomic workspace transition (#46), bound to this process's real engine,
// permission broker and cwd. Reached from the renderer over
// `session:switch-workspace` (#47).
export const switchWorkspace = (req: SwitchRequest): Promise<SwitchResult> =>
  runSwitchWorkspace(
    {
      // Authoritative busy check. Until now the safety policy existed only as
      // disabled renderer buttons, while every other transition tore the engine
      // down unconditionally.
      isBusy: () => engine?.isBusy() ?? false,
      closeEngine: () => {
        engine?.close()
      },
      cancelPermissions: () => permissionBroker.cancelAll(),
      setCwd: setSessionCwd,
      rebuildEngine: () => {
        engine = makeEngine()
      },
      setResume: (id) => {
        pendingResume = id
      },
      warmUp: () => {
        engine?.warmUp()
      },
      resolveTarget: (id, cwd) => resolveResumeTarget(id, cwd)
    },
    req
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
  // Eager warm-up (#39): the command list exists before the first send. Inert
  // on failure by the engine's contract — a user who never opens the dock
  // cannot tell this ran.
  engine.warmUp()
  return filePaths[0]
})

// Choose a project folder and change NOTHING (#48). Deliberately a sibling of
// `session:pick-folder` rather than a reuse of it: that handler chooses AND
// performs the engine transition while touching no renderer state, which is
// exactly the stale-pane bug the switch transaction exists to prevent. Here the
// renderer decides what a chosen folder means and runs one atomic switch; a
// cancel — including an untrusted or window-less call — reaches no mutation at
// all, because there is none in this handler to reach.
ipcMain.handle('session:choose-folder', async (event): Promise<FolderChoice> => {
  if (!isTrustedIpc(event)) return { status: 'cancelled' }
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return { status: 'cancelled' }
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  })
  if (canceled || filePaths.length === 0) return { status: 'cancelled' }
  return { status: 'selected', cwd: filePaths[0] }
})

// Live read of the CLI's command list for the Commands dock. No cache anywhere
// — the SDK's supportedCommands() tracks the CLI's own commands_changed pushes.
// [] with no engine or no live query: the dock's honest empty state.
ipcMain.handle('commands:list', async (event) => {
  if (!isTrustedIpc(event)) return []
  return engine?.listCommands() ?? []
})

ipcMain.handle('session:list', async (event) => {
  if (!isTrustedIpc(event)) return []
  // A list refresh is the moment the store may have gained or lost sessions, so
  // drop the storage index here; the next lookup rebuilds it from real names.
  resetSessionIndex()
  return listSessions()
})

// Guarded write: resume a session that may live in ANOTHER project. The whole
// transition (busy check → validate → close → rebuild → target → warm up) is
// the transaction above; this handler is only the trust boundary. A payload
// that isn't a request shape collapses to `{cwd: null, resumeId: null}`, which
// the transaction rejects as `missing-cwd` — a rejection mutates nothing, so an
// untrusted or malformed call is inert by construction.
ipcMain.handle('session:switch-workspace', async (event, req: unknown): Promise<SwitchResult> => {
  if (!isTrustedIpc(event)) return { status: 'missing-cwd' }
  const { cwd, resumeId } = (req ?? {}) as Partial<SwitchRequest>
  return switchWorkspace({
    cwd: typeof cwd === 'string' ? cwd : null,
    resumeId: typeof resumeId === 'string' && resumeId ? resumeId : null
  })
})

ipcMain.handle('session:transcript', async (event, id: string) => {
  if (!isTrustedIpc(event)) return []
  return readTranscript(getSessionCwd(), String(id))
})

// One row's enriched label (#49). The row supplies its OWN project rather than
// inheriting the open workspace: the rail is global, so the session being asked
// about usually lives somewhere else, and that cwd is the duplicate-id tie-break
// hint — never a path to build. Absent cwd is fine; the index still resolves the
// id by enumeration.
ipcMain.handle('session:title-hint', async (event, id: unknown, cwd: unknown) => {
  if (!isTrustedIpc(event)) return null
  return titleHint(String(id), typeof cwd === 'string' && cwd ? cwd : null)
})

// File picker returns policy Candidates rather than bare paths: an embeddable
// image must carry its bytes to be embedded, and the read is capped so a huge
// image simply falls through to the by-path route the policy module already has.
ipcMain.handle('attachments:pick', async (event): Promise<Candidate[]> => {
  if (!isTrustedIpc(event)) return []
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return []
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections']
  })
  if (canceled || filePaths.length === 0) return []

  return Promise.all(
    filePaths.map(async (filePath): Promise<Candidate> => {
      const mediaType = mediaTypeForPath(filePath)
      const candidate: Candidate = {
        name: basename(filePath),
        mediaType,
        path: filePath
      }
      if (!isEmbeddable(mediaType)) return candidate
      // Stat before read so a 500 MB file is never loaded just to be rejected.
      // One unreadable file still returns as a path Candidate — don't fail the pick.
      try {
        const info = await stat(filePath)
        if (info.size > MAX_IMAGE_BYTES) return candidate
        candidate.data = await readFile(filePath, { encoding: 'base64' })
      } catch {
        // Leave data absent; the path route still works.
      }
      return candidate
    })
  )
})

// Read-only: the subagent drawer asks for a session's spawned subagents,
// correlated to the Task tool_use ids the renderer holds from live cards. Reads
// the persisted transcript tree on demand — no watching. Returns null when the
// agent directory could not be read (distinct from [] meaning none spawned).
ipcMain.handle('subagents:list', async (event, sessionId: unknown) => {
  if (!isTrustedIpc(event)) return []
  return listSubagents(getSessionCwd(), String(sessionId))
})

// Read-only: load one subagent's full conversation for the drawer, resolved by
// the parent Task tool_use id. Lenient [] when not yet on disk.
ipcMain.handle(
  'subagents:transcript',
  async (event, sessionId: unknown, parentToolUseId: unknown) => {
    if (!isTrustedIpc(event)) return []
    return readSubagentTranscript(getSessionCwd(), String(sessionId), String(parentToolUseId))
  }
)

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

// Read-only: the renderer pill asks the current in-app permission mode.
ipcMain.handle('permission:mode', (event) => {
  if (!isTrustedIpc(event)) return 'default'
  return getPermissionMode()
})

// Guarded write: change how the next turn's tool calls are approved
// (bypassPermissions / acceptEdits / default). Rebuilds the engine so the new
// mode binds at query construction — but PRESERVES the conversation by resuming
// the current session id, unlike a backend flip which starts fresh. The pill is
// disabled while a turn streams (renderer), so this never lands mid-stream.
// Broadcasts the resolved mode so the pill re-renders.
ipcMain.on('permission:set-mode', (event, mode: unknown) => {
  if (!isTrustedIpc(event)) return
  if (mode !== 'bypassPermissions' && mode !== 'acceptEdits' && mode !== 'default') return
  setPermissionMode(mode)
  const resume = engine?.sessionId() ?? pendingResume
  engine?.close()
  permissionBroker.cancelAll()
  engine = null
  pendingResume = resume
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.webContents.send('permission:changed', getPermissionMode())
})

// Read-only: the input-box model pill asks for the pickable models. Straight
// from the CLI (supportedModels), like commands:list above — no hardcoded list,
// no `wisp routing` shell-out, and no backend-mode argument: the CLI already
// knows whether it is wisped, so the list is mode-aware for free.
ipcMain.handle('model:list', async (event) => {
  if (!isTrustedIpc(event)) return { models: [], current: null }
  return { models: (await engine?.listModels()) ?? [], current: getModelMode() }
})

// Guarded write: pick the model the next turn runs against (a model id, or null
// for the CLI default). Like the permission pill, rebuilds the engine but
// RESUMES the current session so the conversation is kept. The pill is disabled
// while a turn streams (renderer), so this never lands mid-stream. Broadcasts
// the resolved model so the pill re-renders.
ipcMain.on('model:set', (event, model: unknown) => {
  if (!isTrustedIpc(event)) return
  if (model !== null && (typeof model !== 'string' || model.length === 0 || model.length > 80)) {
    return
  }
  setModelMode(model)
  const resume = engine?.sessionId() ?? pendingResume
  engine?.close()
  permissionBroker.cancelAll()
  engine = null
  pendingResume = resume
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.webContents.send('model:changed', getModelMode())
})

// Guarded write: the renderer owns the zoom-level number (persisted in its own
// localStorage) and pushes it here to scale the whole page via webContents zoom.
// clampZoom is the trust boundary — a garbage IPC payload can't drive an absurd
// factor; Number(undefined/NaN) collapses to the default.
ipcMain.on('zoom:set', (event, level: unknown) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.webContents.setZoomFactor(clampZoom(Number(level)))
})

// The channel carries a payload (prompt text + attachments), not a bare string.
// normalizeSendPayload is the trust boundary that String(text) used to be.
ipcMain.on('chat:send', (event, payload: unknown) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!engine) {
    engine = makeEngine()
  }
  void engine.runTurn(
    normalizeSendPayload(payload),
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
