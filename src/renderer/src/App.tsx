import { useState } from 'react'
import Titlebar from './components/Titlebar'
import Chat from './components/Chat'
import InputBar from './components/InputBar'
import Welcome from './components/Welcome'

export default function App() {
  const [cwd, setCwd] = useState<string | null>(null)

  const pickFolder = async (): Promise<void> => {
    const folder = await window.api.pickFolder()
    if (folder) setCwd(folder)
  }

  return (
    <div className="app">
      <Titlebar cwd={cwd} />
      {cwd ? (
        <>
          <Chat />
          <InputBar />
        </>
      ) : (
        <Welcome onPick={pickFolder} />
      )}
    </div>
  )
}
