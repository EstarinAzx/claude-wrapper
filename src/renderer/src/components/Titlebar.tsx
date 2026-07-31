import type { BackendInfo, BackendMode } from '../../../shared/backend-types'
import type { PermissionMode } from '../../../shared/engine-types'

const basename = (p: string): string => p.split(/[\\/]/).filter(Boolean).pop() ?? p

const PERM_LABEL: Record<PermissionMode, string> = {
  bypassPermissions: 'Bypass',
  acceptEdits: 'Accept Edits',
  default: 'Ask'
}
// Click cycles Bypass → Accept Edits → Ask → Bypass.
const PERM_NEXT: Record<PermissionMode, PermissionMode> = {
  bypassPermissions: 'acceptEdits',
  acceptEdits: 'default',
  default: 'bypassPermissions'
}

const PermissionPill = ({
  mode,
  busy,
  onCycle
}: {
  mode: PermissionMode
  busy: boolean
  onCycle?: (next: PermissionMode) => void
}) => {
  const bypass = mode === 'bypassPermissions'
  const canCycle = !busy && !!onCycle
  const next = PERM_NEXT[mode]
  const title = canCycle
    ? `Permissions: ${PERM_LABEL[mode]} — click for ${PERM_LABEL[next]}`
    : `Permissions: ${PERM_LABEL[mode]}`
  return (
    <button
      type="button"
      className={`perm-pill${bypass ? ' perm-pill--bypass' : ''}`}
      aria-label="Permission mode"
      title={title}
      disabled={!canCycle}
      onClick={() => onCycle?.(next)}
    >
      {PERM_LABEL[mode]}
    </button>
  )
}

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

// Toggles the right-hand Commands dock — same right-slot family as the agents
// toggle; App keeps the two docks mutually exclusive.
const CommandsToggle = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
  <button
    type="button"
    className={`agents-toggle${open ? ' agents-toggle--on' : ''}`}
    aria-label="Commands panel"
    aria-pressed={open}
    title={open ? 'Commands panel — click to hide' : 'Commands panel — click to show'}
    onClick={onToggle}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <line x1="8.8" y1="3" x2="5.2" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  </button>
)

// Toggles the right-hand Appearance dock (#66) — third member of the same
// right-slot family; App keeps all three docks mutually exclusive. A half-filled
// disc: the one glyph that reads as "how this looks" without borrowing the gear
// that would promise settings this panel deliberately does not hold.
const AppearanceToggle = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
  <button
    type="button"
    className={`agents-toggle${open ? ' agents-toggle--on' : ''}`}
    aria-label="Appearance panel"
    aria-pressed={open}
    title={open ? 'Appearance panel — click to hide' : 'Appearance panel — click to show'}
    onClick={onToggle}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 2a5 5 0 0 1 0 10z" fill="currentColor" />
    </svg>
  </button>
)

// Toggles the right-hand Agents dock. Sits with the window controls rather than
// the left-hand state pills because it governs what the right side of the
// workspace shows, not what the next turn runs against — a hairline separates it
// so it is never mistaken for a window button.
const AgentsToggle = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
  <button
    type="button"
    className={`agents-toggle${open ? ' agents-toggle--on' : ''}`}
    aria-label="Agents panel"
    aria-pressed={open}
    title={open ? 'Agents panel — click to hide' : 'Agents panel — click to show'}
    onClick={onToggle}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <line x1="3.6" y1="7" x2="9.4" y2="4" stroke="currentColor" strokeWidth="1.2" />
      <line x1="3.6" y1="7" x2="9.4" y2="10" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="2.7" cy="7" r="1.4" fill="currentColor" />
      <circle cx="10.3" cy="3.7" r="1.4" fill="currentColor" />
      <circle cx="10.3" cy="10.3" r="1.4" fill="currentColor" />
    </svg>
  </button>
)

const Titlebar = ({
  cwd,
  backend,
  permission,
  busy = false,
  agentsOpen = false,
  commandsOpen = false,
  appearanceOpen = false,
  onFlip,
  onCyclePermission,
  onToggleAgents,
  onToggleCommands,
  onToggleAppearance
}: {
  cwd: string | null
  backend: BackendInfo | null
  permission?: PermissionMode | null
  busy?: boolean
  agentsOpen?: boolean
  commandsOpen?: boolean
  appearanceOpen?: boolean
  onFlip?: (target: BackendMode) => void
  onCyclePermission?: (next: PermissionMode) => void
  // Absent until a project folder is open — there is no workspace to dock to
  // before that, so the controls simply are not rendered.
  //
  // Three ordinary prop pairs, deliberately not refactored into one generic
  // dock-toggle pair: that touches every titlebar test for no behavioural gain.
  onToggleAgents?: () => void
  onToggleCommands?: () => void
  onToggleAppearance?: () => void
}) => (
  <header className="titlebar">
    <div className="titlebar-left">
      <span className="logo-mark" aria-hidden="true" />
      <span className="app-name">Claude Wrapper</span>
      {backend && <BackendPill backend={backend} busy={busy} onFlip={onFlip} />}
      {permission && (
        <PermissionPill mode={permission} busy={busy} onCycle={onCyclePermission} />
      )}
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
      {onToggleCommands ? (
        <CommandsToggle open={commandsOpen} onToggle={onToggleCommands} />
      ) : null}
      {onToggleAgents ? <AgentsToggle open={agentsOpen} onToggle={onToggleAgents} /> : null}
      {onToggleAppearance ? (
        <AppearanceToggle open={appearanceOpen} onToggle={onToggleAppearance} />
      ) : null}
      {onToggleAgents || onToggleCommands || onToggleAppearance ? (
        <span className="titlebar-sep" aria-hidden="true" />
      ) : null}
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
