import { useEffect, useState } from 'react'
import type { BackendInfo } from '../../shared/backend-types'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import InputBar from './components/InputBar'
import Welcome from './components/Welcome'
import { useChat } from './useChat'

const App = () => {
  const [cwd, setCwd] = useState<string | null>(null)
  const [backend, setBackend] = useState<BackendInfo | null>(null)
  const { messages, busy, activeSessionId, send, stop, respondToPermission, openSession, newChat } =
    useChat()

  // Launch mode is fixed for the process life, so read it once.
  useEffect(() => {
    void window.api.backendMode().then(setBackend)
  }, [])

  const pickFolder = async (): Promise<void> => {
    const folder = await window.api.pickFolder()
    if (folder) setCwd(folder)
  }

  return (
    <div className="app">
      <Titlebar cwd={cwd} backend={backend} />
      {cwd ? (
        <div className="workspace">
          <Sidebar cwd={cwd} activeId={activeSessionId} busy={busy} onOpen={openSession} onNewChat={newChat} />
          <div className="main-col">
            <Chat
              messages={messages}
              busy={busy}
              onPermission={respondToPermission}
            />
            <InputBar busy={busy} onSend={send} onStop={stop} />
          </div>
        </div>
      ) : (
        <Welcome onPick={pickFolder} />
      )}
    </div>
  )
}

export default App
