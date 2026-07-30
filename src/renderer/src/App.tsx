import { useEffect, useState } from 'react'
import type { BackendInfo, BackendMode } from '../../shared/backend-types'
import type { PermissionMode } from '../../shared/engine-types'
import type { SwitchStatus } from '../../shared/session-types'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import InputBar from './components/InputBar'
import Welcome from './components/Welcome'
import SubagentDrawer from './components/SubagentDrawer'
import AgentsDock from './components/AgentsDock'
import CommandsDock from './components/CommandsDock'
import { useChat } from './useChat'
import { useZoom } from './useZoom'

// Why a workspace switch was refused. The three rejections are the main
// process's, not the renderer's — it never second-guesses them, it phrases them.
const SWITCH_REFUSAL: Record<Exclude<SwitchStatus, 'ok'>, string> = {
  busy: 'Finish or stop the current turn before switching project.',
  'not-found': 'That session is no longer in the store.',
  'missing-cwd': 'That session records no project folder, so it cannot be resumed.'
}

const App = () => {
  const [cwd, setCwd] = useState<string | null>(null)
  const [backend, setBackend] = useState<BackendInfo | null>(null)
  const [permission, setPermission] = useState<PermissionMode | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [openSubagent, setOpenSubagent] = useState<{
    parentToolUseId: string
    agentType: string
  } | null>(null)
  // ONE right-dock slot: agents or commands, never both. Stacking the two
  // squeezes the chat column past usability, so opening one closes the other.
  const [openDock, setOpenDock] = useState<'agents' | 'commands' | null>(null)
  // Pending composer insert from the commands dock. The nonce is load-bearing:
  // clicking the same row twice must fire twice, and an unchanged prop would
  // not re-trigger. A prop (not lifted composer state) so the message list is
  // not re-rendered per keystroke.
  const [pendingInsert, setPendingInsert] = useState<{
    text: string
    nonce: number
  } | null>(null)
  // A refused workspace switch, in words. Inline and non-blocking: a rejection
  // changed nothing, so it must not enter the transcript or steal focus.
  const [refusal, setRefusal] = useState<string | null>(null)
  const {
    messages,
    busy,
    activeSessionId,
    liveAgents,
    transcriptFailed,
    retryTranscript,
    send,
    stop,
    respondToPermission,
    openSession,
    adoptSession,
    newChat
  } = useChat()
  useZoom()

  // Read the launch mode once, then track flips the main side broadcasts.
  useEffect(() => {
    void window.api.backendMode().then(setBackend)
    return window.api.onBackendChanged(setBackend)
  }, [])

  // Read the current permission mode once, then track changes the main broadcasts.
  useEffect(() => {
    void window.api.permissionMode().then(setPermission)
    return window.api.onPermissionChanged(setPermission)
  }, [])

  // Read the current model once (for the pill label), then track picks the main
  // broadcasts. The pickable list itself is fetched on demand when the pill opens.
  useEffect(() => {
    void window.api.listModels().then((info) => setModel(info.current))
    return window.api.onModelChanged(setModel)
  }, [])

  const pickFolder = async (): Promise<void> => {
    const folder = await window.api.pickFolder()
    if (folder) setCwd(folder)
  }

  // Resume a session that lives in another project. Main owns the decision —
  // including whether a turn is in flight, which it asks the engine, not us.
  // On `ok` every piece of workspace-shaped renderer state is dropped together,
  // because a half-reset pane is exactly the "project B's sidebar beside
  // project A's conversation" failure this ticket exists to prevent. Backend
  // mode, permission mode and model are NOT workspace state and stay put.
  //
  // `id` is nullable (#48): a folder chosen from the picker has no session to
  // resume into, so it opens the workspace with an empty pane. Widened rather
  // than duplicated — a second reset would drift from this one the moment
  // anything workspace-scoped is added to App state.
  const switchWorkspace = async (id: string | null, target: string | null): Promise<void> => {
    setRefusal(null)
    const { status } = await window.api.switchWorkspace({ cwd: target, resumeId: id })
    if (status !== 'ok') {
      setRefusal(SWITCH_REFUSAL[status])
      return
    }
    setCwd(target)
    setOpenDock(null)
    // Cleared in the same commit as the cwd change: that change remounts the
    // composer, and InputBar applies a pending insert ON MOUNT — so a surviving
    // one would refill the new project's composer with the old project's command.
    setPendingInsert(null)
    setOpenSubagent(null)
    await adoptSession(id)
  }

  // Reach a project that has no session to resume into — a new or empty folder,
  // which session discovery alone can never find. The chooser mutates nothing,
  // so a cancel returns here having changed no engine, no cwd and no pane; only
  // `selected` runs the transition, and it runs the SAME one a foreign row does.
  //
  // Never `window.api.pickFolder()`: that one changes main's cwd and rebuilds
  // the engine while leaving every piece of renderer state stale — the exact bug
  // the transaction was built to prevent, and the reason a chooser-only sibling
  // exists at all.
  //
  // ponytail: re-choosing the folder already open leaves the composer's draft
  // and tray alone (the `key={cwd}` remount needs cwd to actually change). Not
  // worth a switch counter — nothing crosses projects in that case, which is the
  // leak the reset is for.
  const chooseWorkspace = async (): Promise<void> => {
    const choice = await window.api.chooseFolder()
    if (choice.status !== 'selected') return
    await switchWorkspace(null, choice.cwd)
  }

  // Flip the backend: main tears down the engine + clears the resume target and
  // broadcasts the new mode (→ pill); clear the pane locally so it's a fresh chat.
  const flipBackend = (target: BackendMode): void => {
    window.api.setBackendMode(target)
    newChat()
  }

  // Cycle the permission mode: main rebuilds the engine but resumes the current
  // conversation and broadcasts the new mode (→ pill). No chat reset — unlike a
  // backend flip, changing how tools are approved keeps the conversation.
  const cyclePermission = (next: PermissionMode): void => {
    window.api.setPermissionMode(next)
  }

  // Pick a model: main rebuilds the engine but resumes the conversation (like the
  // permission pill) and broadcasts the new model (→ pill). Optimistic local set
  // so the label updates before the broadcast lands.
  const pickModel = (next: string | null): void => {
    setModel(next)
    window.api.setModel(next)
  }

  return (
    <div className="app">
      <Titlebar
        cwd={cwd}
        backend={backend}
        permission={permission}
        busy={busy}
        agentsOpen={openDock === 'agents'}
        commandsOpen={openDock === 'commands'}
        onFlip={flipBackend}
        onCyclePermission={cyclePermission}
        onToggleAgents={cwd ? () => setOpenDock((d) => (d === 'agents' ? null : 'agents')) : undefined}
        onToggleCommands={
          cwd ? () => setOpenDock((d) => (d === 'commands' ? null : 'commands')) : undefined
        }
      />
      {cwd ? (
        <div className="workspace">
          <Sidebar
            cwd={cwd}
            activeId={activeSessionId}
            busy={busy}
            onOpen={(id) => {
              setRefusal(null)
              void openSession(id)
            }}
            onSwitch={switchWorkspace}
            onChooseFolder={chooseWorkspace}
            onNewChat={() => {
              setRefusal(null)
              newChat()
            }}
          />
          <div className="main-col">
            <Chat
              messages={messages}
              busy={busy}
              onPermission={respondToPermission}
              onOpenSubagent={(parentToolUseId, agentType) =>
                setOpenSubagent({ parentToolUseId, agentType })
              }
            />
            {/* A transcript that would not READ (#60). Sits under the pane
                rather than inside it because the pane is now empty by
                definition — and an empty pane with no explanation is exactly
                the "corrupt session looks like an empty one" state. Unlike the
                empty pane it carries a way out. */}
            {transcriptFailed ? (
              <p className="switch-refusal" role="status">
                Could not read this conversation.{' '}
                <button
                  type="button"
                  className="switch-refusal-retry"
                  aria-label="Retry loading this conversation"
                  onClick={retryTranscript}
                >
                  Retry
                </button>
              </p>
            ) : null}
            {refusal ? (
              <p className="switch-refusal" role="status">
                {refusal}
              </p>
            ) : null}
            {/* Keyed on the workspace: a switch remounts the composer, which is
                the only reset that also takes the draft, the attachment tray
                and the autocomplete state. Resetting App state alone leaves all
                three behind — the criterion most likely to pass a green suite
                while being unmet. */}
            <InputBar
              key={cwd}
              busy={busy}
              model={model}
              pendingInsert={pendingInsert}
              onSend={send}
              onStop={stop}
              onPickModel={pickModel}
            />
          </div>
          {openDock === 'agents' ? (
            <AgentsDock
              sessionId={activeSessionId}
              liveAgents={liveAgents}
              onOpenAgent={(parentToolUseId, agentType) =>
                setOpenSubagent({ parentToolUseId, agentType })
              }
              onClose={() => setOpenDock(null)}
            />
          ) : null}
          {openDock === 'commands' ? (
            <CommandsDock
              onInsert={(name) =>
                setPendingInsert((p) => ({ text: `/${name} `, nonce: (p?.nonce ?? 0) + 1 }))
              }
              onClose={() => setOpenDock(null)}
            />
          ) : null}
          {openSubagent ? (
            <SubagentDrawer
              parentToolUseId={openSubagent.parentToolUseId}
              agentType={openSubagent.agentType}
              sessionId={activeSessionId}
              onClose={() => setOpenSubagent(null)}
            />
          ) : null}
        </div>
      ) : (
        <Welcome onPick={pickFolder} />
      )}
    </div>
  )
}

export default App
