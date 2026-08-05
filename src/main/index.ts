import { app, BrowserWindow, dialog, ipcMain, Notification, screen, shell } from 'electron'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { createEngine } from './engine'
import {
  initBackendMode,
  getSpawnEnv,
  getBackendMode,
  setBackendMode,
  isWispedAvailable
} from './backend-mode'
import { getPermissionMode, setPermissionMode, toPermissionOptions } from './permission-mode'
import {
  getModelMode,
  setModelMode,
  toModelOptions,
  setReportedModel,
  getDisplayModel
} from './model-mode'
import { getEffortMode, toEffortOptions, applyEffortPick } from './effort-mode'
import { resolveHostCli, toCliOptions } from './cli-path'
import { clampZoom } from '../shared/zoom'
import { normalizeBackdrop } from '../shared/backdrop'
import { clampBounds, isBounds } from '../shared/window-bounds'
import { normalizeSendPayload } from '../shared/attachment-types'
import {
  MAX_IMAGE_BYTES,
  isEmbeddable,
  mediaTypeForPath,
  type Candidate
} from '../shared/attachment-policy'
import { isTrustedRendererUrl } from './navigation'
import { makeBoundsReporter } from './bounds-reporter'
import { createPermissionBroker } from './permission-broker'
import { getSessionCwd, setSessionCwd } from './session'
import { resetSessionIndex, resolveResumeTarget } from './session-index'
import { watchSession } from './session-watcher'
import {
  switchWorkspace as runSwitchWorkspace,
  type SwitchRequest,
  type SwitchResult
} from './switch-workspace'
import { announceTurn, isLooking, type AnnouncePorts } from './turn-announce'
import type { DeleteStatus, FolderChoice } from '../shared/session-types'
import { deleteSession, listSessions, readTranscript, titleHint } from './session-store'
import { guardedDelete } from './delete-guard'
import { guardedSend } from './send-guard'
import { listSubagents, readSubagentTranscript } from './subagent-store'
import { listWorkspaceFiles, type WorkspaceFilePorts } from './workspace-files'
import { createBackdropKeeper, type BackdropKeeper } from './backdrop-keeper'
import { listBackgroundSessions } from './agent-view'
import { ensureListEngine, type ListEnginePorts } from './list-engine'
import type { PermissionDecision } from '../shared/engine-types'

let engine: ReturnType<typeof createEngine> | null = null
// Created with the window, because its port closes over that window and there is
// no read-back to recover the material from (#117).
let backdropKeeper: BackdropKeeper | null = null
let pendingResume: string | null = null
const permissionBroker = createPermissionBroker()

// The real filesystem behind `files:list` (#118). Injected rather than imported
// inside the module so the walk's containment can be tested by asserting these
// ports were never REACHED for an escaping entry — a result-only suite would
// pass against a version that returned it and let the renderer filter.
const workspaceFilePorts: WorkspaceFilePorts = {
  readDir: async (dir) =>
    (await readdir(dir, { withFileTypes: true })).map((e) => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      isSymbolicLink: e.isSymbolicLink()
    })),
  realPath: (target) => realpath(target),
  readIgnore: (file) => readFile(file, 'utf8').catch(() => null)
}
const rendererFile = join(__dirname, '../renderer/index.html')
const rendererUrl = pathToFileURL(rendererFile).href

// Snapshot the launch env once; the initial backend mode matches how the app
// was launched (wisp env present → wisped, else native).
initBackendMode(process.env)

// #75: an unpackaged Windows app that has not claimed an identity gets NO toast
// and NO error — the notification simply does not appear. This app is
// dev-run-only, so it is exactly that case, and this line is a precondition of
// the feature rather than polish. Called once at boot, before any Notification
// can exist. Windows-only by documentation, hence the guard: the other two
// platforms are out of scope beyond "does not crash".
const APP_USER_MODEL_ID = 'com.estarinazx.claude-wrapper'
if (process.platform === 'win32') app.setAppUserModelId(APP_USER_MODEL_ID)

// The announcer's ports (#75), bound to the window the turn belongs to. Focus is
// read live off that window: the renderer does not own it, and the user alt-tabs
// mid-turn, so a value captured at turn start is the wrong one by construction.
const announcePorts = (win: BrowserWindow): AnnouncePorts => ({
  // `isLooking`, not `win.isFocused()` — a minimised window reports itself
  // focused on Windows, which is measured in turn-announce.ts.
  isFocused: () => isLooking(win),
  notify: ({ title, body }) => {
    const notification = new Notification({ title, body })
    // Coming back is the point of being told. `show()` restores a minimised
    // window on Windows; `focus()` covers the merely-buried case.
    notification.on('click', () => {
      win.show()
      win.focus()
    })
    notification.show()
  },
  flash: () => win.flashFrame(true)
})

// Which Claude Code binary to run, resolved ONCE at boot. The host install is
// preferred so the app tracks whatever Claude Code the user has rather than the
// version frozen in the lockfile — that drift is what made `opus` mean Opus 4.8
// in #53. null (no host install) → the SDK's bundled CLI, unchanged behaviour.
//
// Resolved at boot rather than per spawn on purpose: a PATH that changes
// mid-session would otherwise swap the binary under a running conversation.
const hostCli = resolveHostCli(process.env['PATH'], process.platform)

const makeEngine = (): ReturnType<typeof createEngine> =>
  createEngine(
    getSessionCwd,
    ({ toolUseId, signal }) => permissionBroker.request({ toolUseId, signal }),
    undefined,
    {
      getEnv: () => getSpawnEnv(process.env),
      getPermissionOptions: () => toPermissionOptions(getPermissionMode()),
      getModelOptions: () => toModelOptions(getModelMode()),
      // #124 — options.effort for the active pick. Same shape as the model
      // getter above and read at the same moment, because both bind at query
      // construction.
      getEffortOptions: () => toEffortOptions(getEffortMode()),
      // #52: the CLI is the authority on what it is running. `/model` changes it
      // without the pill being touched, so the pill has to follow the CLI rather
      // than only its own last click. Display only — this never becomes
      // options.model (see model-mode.ts).
      onModelReport: (model) => {
        if (!setReportedModel(model)) return
        for (const win of BrowserWindow.getAllWindows()) {
          win.webContents.send('model:changed', getDisplayModel())
        }
      },
      getCliOptions: () => toCliOptions(hostCli),
      // #73: the CLI died under us and this engine is terminal. Broadcast like
      // the model report above — and for the same reason it is not an
      // EngineEvent: a stream dying BETWEEN turns has no active turn to emit
      // into, which is precisely when the renderer most needs to know before a
      // prompt is spent on a dead engine.
      //
      // Carries no payload. The error TEXT already travels as an EngineEvent;
      // all that is missing downstream is which KIND of error it was, and that
      // is one bit.
      onTerminal: () => {
        for (const win of BrowserWindow.getAllWindows()) {
          win.webContents.send('engine:terminal')
        }
      },
      // #83: the CLI's live background-task set. Third out-of-band port, and the
      // one with the hardest measurement behind it — #81 timed a level landing
      // 3.3s past `result`, so an EngineEvent would be dropped in the ordinary
      // case rather than an edge one.
      //
      // Carries the WHOLE set every time, because the CLI's message does. The
      // renderer replaces its set rather than pairing bookends, so a dropped
      // message can never wedge a finished task on screen. `[]` also arrives here
      // from the engine's own close(), which is the per-process reset.
      onBackgroundTasks: (tasks) => {
        for (const win of BrowserWindow.getAllWindows()) {
          win.webContents.send('tasks:changed', tasks)
        }
      },
      onSubagent: (event) => {
        for (const win of BrowserWindow.getAllWindows()) {
          win.webContents.send('subagent:changed', event)
        }
      }
    }
  )

// The one engine-discard funnel outside the switch transaction. Five IPC paths
// throw the engine away (folder pick, session target, backend flip, permission
// cycle, model pick) and each must do the same things in the same order: close
// the engine — which is what fires the per-process background-task reset, see
// engine.ts — cancel any pending permission requests, and drop the handle so
// the next send rebuilds lazily. The only thing that differs per path is what
// the NEXT conversation resumes, so that travels as the argument: an id to
// keep the conversation, null to start fresh. Hand-copying these lines to each
// site is the "must join the ok branch by hand" failure class this codebase
// keeps re-learning; the switch transaction sequences its own teardown through
// its ports because it validates between the steps.
const discardEngine = (resume: string | null): void => {
  engine?.close()
  permissionBroker.cancelAll()
  engine = null
  pendingResume = resume
}

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
      // The resume target travels INTO the warm-up: it binds when the query is
      // constructed, and the warm-up is the construction. Warming up bare left
      // the rebuilt engine on a fresh session while the pane looked right.
      warmUp: (resume) => {
        engine?.warmUp(resume ?? undefined)
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

// #79's half of the show gate, and the reason it is a module-level `let`: this
// app has exactly ONE window (`createWindow` is called once, on ready), so a
// map keyed by window would be ceremony around a single slot. The `bounds:set`
// handler below calls this to say "the renderer has spoken"; `createWindow`
// owns what that means.
let releaseShowGate: (() => void) | null = null

// How long the window waits for the renderer's bounds before showing anyway.
// The fallback is what stops a renderer that never mounts — a crash, a blank
// page — from leaving the user with no window at all. Measured (gui-79): the
// push lands 300-400ms after construction, so this is roughly 4x headroom.
const BOUNDS_GATE_TIMEOUT_MS = 1500

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
      // #74: the renderer is the process most exposed to hostile input here —
      // it renders arbitrary model output through react-markdown and shows tool
      // results read from arbitrary files. `sandbox: false` is the price of a
      // preload that needs Node, and this one does not: the BUILT bundle
      // contains exactly one require, `require("electron")`. Nothing was bought
      // with it, so nothing is lost by dropping it.
      //
      // Not a reversal — no ADR ever argued the flag; it was a default that was
      // never revisited. The IPC trust boundary (`isTrustedIpc`) is unchanged;
      // this moves the PROCESS boundary, not that one. gui-74 measures the
      // effect rather than the flag, and it must launch without
      // `--no-sandbox` — that command line would erase what it asserts.
      sandbox: true
    }
  })

  // #79 — the window is shown once BOTH of these hold: Chromium says it has
  // something to paint, and the renderer has told us where the window goes.
  //
  // The gate that [[2026-07-31-a-preference-lives-where-it-is-read]] declined
  // for zoom/backdrop is affordable HERE, and the amendment says why: that gate
  // was specified as "the renderer's first preference push", which is a race
  // between two independent messages and covers a third preference that crosses
  // no boundary at all. Bounds are ONE named message with one meaning, so
  // "settled" is a fact rather than a guess.
  //
  // It is also not optional. Without it the window is shown at the constructed
  // default and then MOVED and RESIZED by the window manager while on screen —
  // measured, not assumed (gui-79).
  let readyToShow = false
  let boundsSettled = false
  const showWhenSettled = (): void => {
    if (readyToShow && boundsSettled && !win.isDestroyed()) win.show()
  }
  win.once('ready-to-show', () => {
    readyToShow = true
    showWhenSettled()
  })
  releaseShowGate = () => {
    boundsSettled = true
    showWhenSettled()
  }
  // The renderer may never mount. A window that is never shown is a worse
  // failure than one shown at the default size, so the wait is bounded.
  const gateTimer = setTimeout(releaseShowGate, BOUNDS_GATE_TIMEOUT_MS)
  win.once('show', () => clearTimeout(gateTimer))

  // #79 — bounds change in MAIN, so main is what reports them; debounced,
  // because the obvious version writes localStorage on every pixel of a drag.
  // The debounce, the `getNormalBounds()` choice and #110's flush all live in
  // `bounds-reporter.ts`, which is where they can be unit-tested.
  const boundsReporter = makeBoundsReporter(win, (bounds) =>
    win.webContents.send('bounds:changed', bounds)
  )
  win.on('resize', boundsReporter.report)
  win.on('move', boundsReporter.report)
  // #110 — `close`, not `closed`. A report still owed at this moment has no
  // later to run in, and by `closed` the `webContents` is gone to send through.
  win.on('close', boundsReporter.flush)
  win.on('closed', () => {
    boundsReporter.cancel()
    clearTimeout(gateTimer)
    releaseShowGate = null
  })

  // #75: a flashing taskbar button keeps flashing until it is told to stop, so
  // the moment the user comes back is the moment to clear it. Unconditional —
  // clearing a flash that was never set is a no-op.
  win.on('focus', () => win.flashFrame(false))

  // #119 — acrylic goes flat the moment the window loses focus, which is Win11
  // DWM behaviour and which #117 found no supported Electron route to change.
  // Re-asserting the material on blur re-engages the blur-behind, measured and
  // reproduced in `scripts/probe-acrylic-reapply.mjs` (948 focused / 118
  // unfocused / 924 unfocused-and-re-asserted, still 924 at +15s). The keeper
  // holds the value because there is no read-back to ask the window for it.
  backdropKeeper = createBackdropKeeper({
    // Guarded, and not defensively-for-its-own-sake: this runs from an EVENT
    // HANDLER, so anything it throws is an uncaught exception in main — which
    // Electron surfaces as a modal "A JavaScript error occurred in the main
    // process" dialog over the user's app. A window can be torn down between
    // the blur firing and this running, and `setBackgroundMaterial` on a
    // destroyed window throws. Observed live: an unguarded blur handler
    // (injected by a probe, not this one) produced exactly that dialog.
    apply: (material) => {
      if (win.isDestroyed()) return
      try {
        win.setBackgroundMaterial(material)
      } catch {
        // A material we could not apply is a cosmetic loss. A modal error
        // dialog over the app is not.
      }
    }
  })
  win.on('blur', () => backdropKeeper?.reassert())
  // Refocusing makes anything still queued pointless — DWM re-engages the blur
  // itself for the focused window — and dropping it keeps a churned focus from
  // ending in a pile of late writes.
  win.on('focus', () => backdropKeeper?.cancel())

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
  discardEngine(null)
  setSessionCwd(filePaths[0])
  engine = makeEngine()
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

// #112 — the two LIST reads below are the only consumers that need a live query
// without a send, so they are the ones that pay for rebuilding it. Bound here
// rather than inside `ensureListEngine` because everything it reads is this
// module's state; the function itself is in `list-engine.ts` so the resume
// threading can be pinned, which vitest cannot do through this entry.
//
// `discardEngine` above is deliberately unchanged: it stays the cheap discard,
// and this is the lazy rebuild.
const listEnginePorts: ListEnginePorts<ReturnType<typeof createEngine>> = {
  live: () => engine,
  make: makeEngine,
  set: (rebuilt) => {
    engine = rebuilt
  },
  // The resume target travels INTO the warm-up, exactly as it does in the switch
  // transaction: it binds when the query is constructed, and the warm-up is the
  // construction.
  warmUp: (rebuilt, resume) => rebuilt.warmUp(resume),
  resume: () => pendingResume
}

// Live read of the CLI's command list for the Commands dock. No cache anywhere
// — the SDK's supportedCommands() tracks the CLI's own commands_changed pushes.
// The engine is rebuilt here when a pill click discarded it (#112); [] still
// means the query answered nothing, which is the dock's honest empty state.
ipcMain.handle('commands:list', async (event) => {
  if (!isTrustedIpc(event)) return []
  return ensureListEngine(listEnginePorts).listCommands()
})

// The `@` file list (#118). Read-only, and the ONLY thing that crosses is a
// list of workspace-relative POSIX paths — main resolves nothing and the
// renderer never learns an absolute path, so a renderer bug cannot turn a
// suggestion into a filesystem reach. Escape rejection happens inside
// `listWorkspaceFiles`, at discovery, so an out-of-workspace candidate is never
// reached rather than merely absent here.
//
// No workspace open is `[]`, not an error: the composer exists before a folder
// is picked, and an empty list is the honest answer for "nothing to reference".
ipcMain.handle('files:list', async (event): Promise<string[]> => {
  if (!isTrustedIpc(event)) return []
  const cwd = getSessionCwd()
  if (!cwd) return []
  return listWorkspaceFiles(workspaceFilePorts, cwd)
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

// Guarded write, and the only destructive one in the app: permanently remove a
// session from the store (#68). No trash, no undo — the rail's two-step confirm
// is the whole safety net, so this handler must not soften anything.
//
// The id is whitelisted to a non-empty string rather than coerced with
// String(id) like the read channels above: those answer a lenient empty value on
// garbage, but here a coerced "undefined" would be handed to a delete. The SDK
// validates it is a UUID before touching disk; this is the boundary's own check,
// not a second opinion on that.
//
// Carries the busy check, and this is NOT the "second busy source" an earlier
// version of this comment rejected (#107). That reasoning assumed the rail's
// `disabled={active && busy}` already covered the in-flight session — but
// `active` compares against the renderer's `activeSessionId`, which is written
// only at turn-end. Through the whole FIRST turn of a fresh conversation the
// renderer holds null, the row is an ordinary non-active one, and its trash
// button is live; the delete then unlinks a transcript the CLI is appending to
// and everything written before it is gone. Main has held that id since `init`,
// so it is the only place the decision can be made at all, and the two cannot
// disagree. The rail's control stays a visible affordance, not the authority.
// Deleting a FOREIGN session mid-turn stays allowed — see delete-guard.ts.
ipcMain.handle('session:delete', async (event, id: unknown): Promise<DeleteStatus> => {
  if (!isTrustedIpc(event)) return 'failed'
  if (typeof id !== 'string' || !id) return 'failed'
  return guardedDelete(
    {
      isBusy: () => engine?.isBusy() ?? false,
      runningId: () => engine?.sessionId() ?? null,
      remove: deleteSession
    },
    id
  )
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

// Read-only: the sessions rail asks for the workspace's LIVE BACKGROUND
// SESSIONS — the CLI's agent view, not this app's Agents dock and not the
// background TASKS inside the open session (three meanings, see agent-view.ts).
//
// Costs one CLI process per call, ~893ms (#90), so it is `handle` and never a
// push: main has no timer here and must never grow one. Every call in the app
// is a user action or a workspace change.
//
// `null` is a FAILED look, distinct from `[]` meaning nothing is running — the
// same nullable contract `session:list` speaks (#60). An untrusted sender gets
// `null` rather than `[]`, because a refused call has not measured an empty
// workspace.
ipcMain.handle('background-sessions:list', async (event) => {
  if (!isTrustedIpc(event)) return null
  return listBackgroundSessions(getSessionCwd())
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

// Guarded write: watch one session's transcript for external writes, or `null`
// to stop (#57). Only a signal crosses in either direction — the transcript
// keeps travelling over `session:transcript`. The renderer decides whether a
// signal means anything (eligibility, busy); main just reports the file moved.
ipcMain.on('session:watch', (event, id: unknown) => {
  if (!isTrustedIpc(event)) return
  const sessionId = typeof id === 'string' && id ? id : null
  const sender = event.sender
  void watchSession(sessionId, (changed) => {
    if (sender.isDestroyed()) return
    sender.send('session:changed', changed)
  })
})

ipcMain.on('chat:target', (event, id: unknown) => {
  if (!isTrustedIpc(event)) return
  discardEngine(typeof id === 'string' && id ? id : null)
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
// target mode enum. Discards with a null resume — the flip lands in a FRESH
// chat, not a resume of the prior conversation. The lazy chat:send rebuilds the
// engine with the new mode's spawn env. Locked to native when the launch env
// carried no wisp routing. Broadcasts the resolved mode back so the pill +
// renderer re-render.
ipcMain.on('backend:set-mode', (event, mode: unknown) => {
  if (!isTrustedIpc(event)) return
  if (mode !== 'native' && mode !== 'wisped') return
  if (mode === 'wisped' && !isWispedAvailable()) return
  setBackendMode(mode)
  discardEngine(null)
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
  // The resume target is read BEFORE the discard — sessionId() is unreachable
  // once the handle is dropped, and this is the path that keeps the conversation.
  discardEngine(engine?.sessionId() ?? pendingResume)
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.webContents.send('permission:changed', getPermissionMode())
})

// Read-only: the input-box model pill asks for the pickable models. Straight
// from the CLI (supportedModels), like commands:list above — no hardcoded list,
// no `wisp routing` shell-out, and no backend-mode argument: the CLI already
// knows whether it is wisped, so the list is mode-aware for free.
ipcMain.handle('model:list', async (event) => {
  if (!isTrustedIpc(event)) return { models: [], current: null }
  // Rebuilt lazily when a pill click discarded the handle (#112) — the same
  // treatment as commands:list, and for the same reason: `current` comes from
  // model-mode.ts, so an empty list here was invisible behind a correct pill.
  return {
    models: await ensureListEngine(listEnginePorts).listModels(),
    current: getDisplayModel(),
    // #124 — the effort pick rides this read rather than a second channel. The
    // two are one question: which levels the control may offer comes off the
    // model rows above, so a consumer holding one always wants the other.
    effort: getEffortMode()
  }
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
  // Same as permission:set-mode above: resume read before the discard, so the
  // model pick keeps the conversation.
  discardEngine(engine?.sessionId() ?? pendingResume)
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.webContents.send('model:changed', getDisplayModel())
})

// Guarded write: pick the reasoning effort the next turn runs at (one of the
// SDK's five levels, or null for the CLI default). Like the model pill it
// rebuilds the engine and RESUMES the current session, because `effort` rides
// `Options` (sdk.d.ts:1664) and Options bind at query construction — storing the
// pick alone would look like it worked and change nothing. The control is
// disabled while a turn streams (renderer), so this never lands mid-stream.
//
// The transaction itself lives in `effort-mode.ts` behind ports, not here: what
// has to be pinned is that a hostile payload never reaches the engine and that
// the resume target is read BEFORE the discard, and neither is testable in this
// file (vitest cannot import it). Same reasoning as `list-engine.ts`.
ipcMain.on('effort:set', (event, effort: unknown) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  applyEffortPick(effort, {
    sessionId: () => engine?.sessionId() ?? null,
    pendingResume: () => pendingResume,
    discardEngine,
    broadcast: (level) => win?.webContents.send('effort:changed', level)
  })
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

// Same shape as zoom (#69): the renderer stores the preference, main applies it
// to the live window. `setBackgroundMaterial` is runtime-settable, which is the
// fact that let this preference stay in localStorage with the other four — no
// value has to be known at BrowserWindow construction time. normalizeBackdrop
// is the trust boundary; the window is never handed a material we do not offer.
// No platform branch: the API is Windows-only and so is this app.
ipcMain.on('backdrop:set', (event, material: unknown) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return
  // Through the keeper, never straight at the window: #117 measured that there
  // is no read-back on this API, so the blur handler below has no way to learn
  // the material except from here.
  backdropKeeper?.set(normalizeBackdrop(material))
})

// #79 — the renderer's stored bounds arriving on mount. Two jobs, and they are
// deliberately separate:
//
//   APPLY, only if the payload validates. `isBounds` compares and never
//   coerces, so a hand-edited localStorage entry cannot drive `setBounds`.
//
//   RELEASE THE SHOW GATE, whatever the payload was. `null` (nothing stored)
//   and a corrupt entry are both complete answers — the renderer has spoken and
//   the window can be shown. Releasing only on a VALID payload would leave
//   every first-ever launch waiting out the timeout instead.
//
// An untrusted sender does neither: it returns above, and the window falls back
// to the timeout exactly as if the renderer had never spoken.
//
// The display list is read HERE, at apply time, never cached at boot — a
// monitor can be unplugged while the app is running, and a stale list is how a
// window gets restored onto a display that is no longer there.
ipcMain.on('bounds:set', (event, bounds: unknown) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win && isBounds(bounds)) {
    win.setBounds(clampBounds(bounds, screen.getAllDisplays()))
  }
  releaseShowGate?.()
})

// The channel carries a payload (prompt text + attachments), not a bare string.
// normalizeSendPayload is the trust boundary that String(text) used to be.
ipcMain.on('chat:send', (event, payload: unknown) => {
  if (!isTrustedIpc(event)) return
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!engine) {
    engine = makeEngine()
  }
  const live = engine
  // #113: refused HERE, before `startTurn` builds the callback below. `runTurn`
  // rejects a second turn too, but it can only do so by CALLING that callback —
  // which forwards to the renderer, which reads any error as turn-terminal and
  // stops calling itself busy while the first turn is still streaming.
  guardedSend(
    {
      isBusy: () => live.isBusy(),
      startTurn: (sendPayload) => {
        // Bound once per turn, not once per event: this callback runs on every
        // text delta. The ports still read focus LIVE — `isFocused` closes over
        // the window rather than over a value — so hoisting costs the
        // announcement nothing.
        const announce = win ? announcePorts(win) : null
        void live.runTurn(
          sendPayload,
          (e) => {
            win?.webContents.send('chat:event', e)
            // #75: the same event stream, read for a second question — did this
            // turn just end while nobody was looking? Main answers it locally;
            // no channel is added and the renderer is never consulted about
            // window focus.
            if (announce) announceTurn(announce, e)
          },
          pendingResume ?? undefined
        )
      }
    },
    normalizeSendPayload(payload)
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
