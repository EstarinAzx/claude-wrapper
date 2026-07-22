const basename = (p: string): string => p.split(/[\\/]/).filter(Boolean).pop() ?? p

export default function Titlebar({ cwd }: { cwd: string | null }) {
  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <span className="logo-mark" aria-hidden="true" />
        <span className="app-name">Claude Wrapper</span>
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
}
