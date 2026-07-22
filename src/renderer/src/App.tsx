import Titlebar from './components/Titlebar'
import Chat from './components/Chat'
import InputBar from './components/InputBar'

export default function App() {
  return (
    <div className="app">
      <Titlebar />
      <Chat />
      <InputBar />
    </div>
  )
}
