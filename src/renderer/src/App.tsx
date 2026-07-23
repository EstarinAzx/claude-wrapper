import { useState } from 'react'
import Titlebar from './components/Titlebar'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import InputBar from './components/InputBar'
import Welcome from './components/Welcome'
import { useChat } from './useChat'

const App = () => {
  const [cwd, setCwd] = useState<string | null>(null)
  const { messages, busy, send, stop, respondToPermission, replay } = useChat()

  const pickFolder = async (): Promise<void> => {
    const folder = await window.api.pickFolder()
    if (folder) setCwd(folder)
  }

  const openSession = async (id: string): Promise<void> => {
    replay(await window.api.loadTranscript(id))
  }

  return (
    <div className="app">
      <Titlebar cwd={cwd} />
      {cwd ? (
        <div className="workspace">
          <Sidebar cwd={cwd} onOpen={openSession} />
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
