import { useEffect, useState } from 'react'
import type { BackendInfo, BackendMode } from '../../shared/backend-types'
import type { PermissionMode } from '../../shared/engine-types'
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
  const {
    messages,
    busy,
    activeSessionId,
    liveAgents,
    send,
    stop,
    respondToPermission,
    openSession,
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
          <Sidebar cwd={cwd} activeId={activeSessionId} busy={busy} onOpen={openSession} onNewChat={newChat} />
          <div className="main-col">
            <Chat
              messages={messages}
              busy={busy}
              onPermission={respondToPermission}
              onOpenSubagent={(parentToolUseId, agentType) =>
                setOpenSubagent({ parentToolUseId, agentType })
              }
            />
            <InputBar
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
