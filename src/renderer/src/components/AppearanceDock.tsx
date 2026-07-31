import { MAX_ZOOM, MIN_ZOOM, type ZoomAction } from '../../../shared/zoom'

// Appearance dock (#66): the third member of the right-dock union, structural
// twin of the agents and commands docks — same right slot, same titlebar
// toggle, same folder gate; App enforces that opening one closes the others.
//
// Two things are deliberately unlike its siblings. It is FIXED WIDTH: no drag
// grip, no persisted width, because three controls are not a list to be sized.
// And it holds NO DRAFT STATE — no Save, no Apply, no dirty flag. That one is
// load-bearing rather than stylistic: `switchWorkspace` clears `openDock`, so
// this panel closes itself on an unrelated action, and a Save button behind a
// self-closing panel is silent data loss. Every control commits on change.
//
// This ticket ships one control; theme and backdrop land in the same body.
const AppearanceDock = ({
  level,
  onStep,
  onClose
}: {
  level: number
  onStep: (action: ZoomAction) => void
  onClose: () => void
}) => (
  <aside className="agents-dock appearance-dock" aria-label="Appearance">
    <div className="agents-dock-head">
      <span className="agents-dock-title">Appearance</span>
      <button
        type="button"
        className="sidebar-toggle"
        aria-label="Close appearance panel"
        onClick={onClose}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M3 3l6 6M9 3l-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
    <div className="appearance-body">
      <div className="appearance-field">
        <span className="appearance-label" id="appearance-zoom-label">
          Zoom
        </span>
        {/* Minus / readout / plus, stepping through the same helper the
            keyboard shortcuts use. No reset button — stepping reaches the
            default — and no slider or select, either of which would invent a
            value list the stepping logic does not have. */}
        <div
          className="appearance-stepper"
          role="group"
          aria-labelledby="appearance-zoom-label"
        >
          <button
            type="button"
            className="appearance-step"
            aria-label="Zoom out"
            disabled={level <= MIN_ZOOM}
            onClick={() => onStep('out')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <line
                x1="1.5"
                y1="5"
                x2="8.5"
                y2="5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {/* Live region: the shortcuts move this too, so a keyboard user who
              never opens the panel is not the only one told what happened. */}
          <span className="appearance-readout" role="status">
            {Math.round(level * 100)}%
          </span>
          <button
            type="button"
            className="appearance-step"
            aria-label="Zoom in"
            disabled={level >= MAX_ZOOM}
            onClick={() => onStep('in')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <line
                x1="1.5"
                y1="5"
                x2="8.5"
                y2="5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="5"
                y1="1.5"
                x2="5"
                y2="8.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </aside>
)

export default AppearanceDock
