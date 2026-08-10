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
    ? `Permissions: ${PERM_LABEL[mode]}. Click for ${PERM_LABEL[next]}.`
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
    ? 'Launched without Wisp routing, so this session is native only'
    : canFlip
      ? `Backend: ${label}. Click to switch.`
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

// ONE icon set for the three dock toggles: one grid, one stroke weight, one
// visual centre, and — the part that changed — one DRAWING MODE.
//
// The previous set unified the geometry and stopped there. Every glyph sat on a
// 14 grid in a 10px optical square at one 1.3 stroke, which is measurably one
// family, and it still did not read as one, because two of the three carried
// solid elements: the appearance disc was half filled and all three agent nodes
// were filled discs. Fill and outline are different weights of ink no amount of
// size matching reconciles, so the eye sorted them into "two heavy, one light"
// before it ever compared their boxes. The set is now outline throughout, which
// is why the solid escape hatch that used to live here is gone rather than
// merely unused.
//
// The grid moves 14 -> 16, which is a change of COORDINATE SPACE and not a fit
// correction. The 28px housing is NOT this surface's own: it is declared once,
// in titlebar.css, jointly with `.sidebar-toggle`, and the sessions rail's three
// glyphs still draw on 14 inside the identical box at ~10px optical extent —
// which is what these reach at 16. So the housing is not what differs and never
// asked for a wider grid. What the wider grid buys is room to draw the agent
// nodes hollow at r 1.7 and still land their connectors on the ring edge. The
// stroke stays 1.3, near the proportion Lucide draws at (2 on 24), and it is
// the reason those rings read as rings at this size rather than closing into
// dots.
//
// Everything is centred on (8,8) and drawn to a ~10px optical extent: the slash
// spans 10.0 vertically, the disc 9.9, the agent cluster 10.8 wide by 10.6 tall.
// The agent connectors start and end exactly 1.7 from their node centres, which
// is the node radius, so each line meets its ring on the edge instead of near it.
//
// MEASURED, AND THE FRAME IS NOW SETTLED BY DRAWING IT — see the note at the end
// of this block before reopening any of it. The set is one drawing mode and the
// three marks are still semantically unrelated, and the natural fix — a shared
// panel outline, since all three docks are right-hand panels — does not fit on
// this grid. The binding constraint is the agent cluster. Its ring is
// already at the floor: r 1.7 at stroke 1.3 leaves a 2.1 hole, and any smaller
// closes the ring into a dot, which is the mixed-ink failure this set just
// escaped. Holding that floor the cluster needs 8.34 wide by 9.1 tall of path
// extent — two stacked rings at 4.7 inked apiece plus one visible pixel between
// them, and a left ring far enough out to keep the same clearance. Against it:
//
//   FULL FRAME — DRAWN AND PHOTOGRAPHED, wave 5, and it fails twice. It is the
//   only candidate whose arithmetic ever cleared, at 0.85 clearance per side,
//   and the note at the end of this block records what 0.85 actually renders
//   as. It also costs the very thing that killed the bare rule below: fitting
//   the cluster inside the frame's 12.1 interior caps its ring centres 5.7
//   apart horizontally and 2.85 vertically, so every connector runs 2.97 —
//   SHORTER than the 3.01 that made the bare rule unacceptable. The two were
//   judged on different grounds and turn out to share one failure mode.
//   Adding the divider that would make it mean "right-hand panel" only takes
//   more, and was never reached.
//
//   THREE-SIDED BRACKET — the arms must run 2.5 to read as arms rather than as
//   cap blobs at this stroke, which reserves everything right of 10.35 and
//   leaves the mark 7.2 of horizontal path extent against the 8.34 floor.
//
//   BARE RIGHT-HAND RULE — the only one that draws, and it costs twice. The
//   cluster shrinks to 8.9 wide, which shortens each connector from 4.83 to
//   3.01, a 2.3:1 lozenge at stroke 1.3 — so the one glyph whose meaning IS
//   the connection stops showing it. Worse, it puts a vertical hairline at
//   x 19 / 49 / 79 of the rendered strip, which lands the real .titlebar-sep
//   at 103 inside the same 30 / 30 / 24 series. The group boundary that
//   titlebar.css bought with its 15 / 9 gutter split dissolves into a rule
//   rhythm, and a lone vertical is an edge rather than an outline anyway.
//
// THE FRAME WAS DRAWN AT 0.85 AND PHOTOGRAPHED. Three waves argued this from
// arithmetic and reached opposite verdicts, because the whole result turns on a
// clearance convention no derivation ever stated. Stated, then answered by
// looking:
//
//   Interior clear inside a frame drawn to the bleed is 12.1. The cluster's
//   vertical floor is 9.1 of path extent, which is 10.4 once its own 1.3 stroke
//   is inked. That leaves 1.7 of total clearance — 0.85 per side — between the
//   frame's inner edge and the mark's ink.
//
// 0.85 IS NOT A TIGHTNESS JUDGEMENT, which is why arguing it never converged.
// This svg is 16 units rendered at 16px at zoom 1, so one unit is one device
// pixel: 0.85 clearance is 0.85 of a pixel between two 1.3px strokes that are
// not pixel aligned. Measured off the real render, where the ground reads 14 and
// a full stroke reads ~150, the clearance pixel reads 30-32 on both sides of the
// disc and on the cluster's left ring — while a gap that genuinely resolves,
// inside that same disc and all round the slash, reads 14. The frame and the
// mark do not sit 0.85 apart. They fuse into one smudged double line holding
// about 12% of the available contrast. Both readers were arguing taste about a
// number that never had the resolution to be a taste question.
//
// It fails a second time in a state no derivation looked at. Under `--on` the
// frame is a 13.4 stroked rounded rect centred in the 28px rounded-rect mint
// tint — two nested rounded rectangles 7.3px apart, and the inner one turns mint
// and becomes the loudest mark in the titlebar.
//
// WHAT WOULD UNLOCK IT, with the number attached so the next wave need not hunt
// for it: the clearance has to buy one clean background pixel, so it wants about
// 2.0 per side rather than 0.85. Interior 10.4 + 4.0 = 14.4 puts the grid near
// 19-20, which renders these glyphs at 18-20px inside the 28px housing against
// today's ~10. That housing is declared jointly with the rail's FIVE — Refresh,
// Open project, New chat and Collapse in the expanded head, Expand in the
// collapsed rail — and not with the three 14-grid glyphs named further up this
// block, which are a subset of them. Growing the housing moves all eight
// tenants of that rule, so it is not this surface's call to make alone. The
// bracket and the bare-rule verdicts survive re-derivation; only their
// intermediate numbers were off.
const glyph = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true
} as const

// Toggles the right-hand Commands dock — same right-slot family as the agents
// toggle; App keeps the two docks mutually exclusive.
const CommandsToggle = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
  <button
    type="button"
    className={`agents-toggle${open ? ' agents-toggle--on' : ''}`}
    aria-label="Commands panel"
    aria-pressed={open}
    title={open ? 'Hide the Commands panel' : 'Show the Commands panel'}
    onClick={onToggle}
  >
    <svg {...glyph}>
      <line x1="10.3" y1="3" x2="5.7" y2="13" />
    </svg>
  </button>
)

// Toggles the right-hand Appearance dock (#66) — third member of the same
// right-slot family; App keeps all three docks mutually exclusive. A bisected
// disc: the one glyph that reads as "how this looks" without borrowing the gear
// that would promise settings this panel deliberately does not hold. It used to
// fill one half to say the same thing, which is the more literal drawing of
// contrast and also the reason the set read as mixed weights; the diameter says
// it in the family's own mode.
const AppearanceToggle = ({ open, onToggle }: { open: boolean; onToggle: () => void }) => (
  <button
    type="button"
    className={`agents-toggle${open ? ' agents-toggle--on' : ''}`}
    aria-label="Appearance panel"
    aria-pressed={open}
    title={open ? 'Hide the Appearance panel' : 'Show the Appearance panel'}
    onClick={onToggle}
  >
    <svg {...glyph}>
      <circle cx="8" cy="8" r="4.95" />
      <line x1="8" y1="3.05" x2="8" y2="12.95" />
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
    title={open ? 'Hide the Agents panel' : 'Show the Agents panel'}
    onClick={onToggle}
  >
    <svg {...glyph}>
      <circle cx="4.3" cy="8" r="1.7" />
      <circle cx="11.7" cy="4.4" r="1.7" />
      <circle cx="11.7" cy="11.6" r="1.7" />
      <line x1="5.83" y1="7.26" x2="10.17" y2="5.14" />
      <line x1="5.83" y1="8.74" x2="10.17" y2="10.86" />
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
      {onToggleAgents || onToggleCommands || onToggleAppearance ? (
        <>
          <div className="titlebar-actions">
            {onToggleCommands ? (
              <CommandsToggle open={commandsOpen} onToggle={onToggleCommands} />
            ) : null}
            {onToggleAgents ? <AgentsToggle open={agentsOpen} onToggle={onToggleAgents} /> : null}
            {onToggleAppearance ? (
              <AppearanceToggle open={appearanceOpen} onToggle={onToggleAppearance} />
            ) : null}
          </div>
          <span className="titlebar-sep" aria-hidden="true" />
        </>
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
