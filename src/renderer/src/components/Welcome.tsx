export default function Welcome({ onPick }: { onPick: () => void }) {
  return (
    <main className="welcome">
      <span className="welcome-mark" aria-hidden="true" />
      <h1 className="welcome-title">Start a session</h1>
      <p className="welcome-hint">Pick a project folder for Claude to work in.</p>
      <button type="button" className="pick-folder-btn" onClick={onPick}>
        Pick a project folder
      </button>
    </main>
  )
}
