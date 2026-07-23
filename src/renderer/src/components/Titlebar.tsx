import type { BackendInfo, BackendMode } from '../../../shared/backend-types'

const basename = (p: string): string => p.split(/[\\/]/).filter(Boolean).pop() ?? p

const BackendPill = ({
  backend,
  busy,
  onFlip
}: {
  backend: BackendInfo
  busy: boolean
  onFlip?: (target: BackendMode) => void
}) => {
  const wisped = backend.mode === 'wisped'
  const label = wisped ? 'Wisped' : 'Native'
  const target: BackendMode = wisped ? 'native' : 'wisped'
  // Flippable only when the launch env carried wisp routing (else native-locked)
  // and no turn is streaming (mid-stream switch is blocked, per #14).
  const canFlip = backend.wispedAvailable && !busy && !!onFlip
  const title = !backend.wispedAvailable
    ? 'Launched without Wisp routing — native only'
    : canFlip
      ? `Backend: ${label} — click to switch`
      : `Backend: ${label}`
  return (
    <button
      type="button"
      className={`backend-pill${wisped ? ' backend-pill--wisped' : ''}`}
      aria-label="Backend mode"
      title={title}
      disabled={!canFlip}
      onClick={() => onFlip?.(target)}
    >
      {label}
    </button>
  )
}

const Titlebar = ({
  cwd,
  backend,
  busy = false,
  onFlip
}: {
  cwd: string | null
  backend: BackendInfo | null
  busy?: boolean
  onFlip?: (target: BackendMode) => void
}) => (
  <header className="titlebar">
    <div className="titlebar-left">
      <span className="logo-mark" aria-hidden="true" />
      <span className="app-name">Claude Wrapper</span>
      {backend && <BackendPill backend={backend} busy={busy} onFlip={onFlip} />}
    </div>
    <div className="titlebar-center">
      {cwd ? (
        <span className="session-title" title={cwd}>
          {basename(cwd)}
        </span>
      ) : (
        <span className="session-title">New session</span>
      )}
    </div>
    <div className="titlebar-right">
      <button
        type="button"
        className="win-btn"
        aria-label="Minimize"
        onClick={() => window.api.minimize()}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>
      <button
        type="button"
        className="win-btn"
        aria-label="Maximize"
        onClick={() => window.api.toggleMaximize()}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <rect
            x="1"
            y="1"
            width="8"
            height="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </button>
      <button
        type="button"
        className="win-btn win-btn-close"
        aria-label="Close"
        onClick={() => window.api.close()}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>
    </div>
  </header>
)

export default Titlebar
