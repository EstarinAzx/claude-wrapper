import type { KeyboardEvent } from 'react'
import { MAX_ZOOM, MIN_ZOOM, type ZoomAction } from '../../../shared/zoom'
import { BACKDROPS, type Backdrop } from '../../../shared/backdrop'

// The copy the panel shows for each material (#69). Keyed by Backdrop and
// rendered by mapping over BACKDROPS, so the offered set and the whitelist
// cannot drift: a new material without copy is a type error, and copy for a
// material that is not offered renders nowhere.
//
// The request behind this feature was for "persistent acrylic", and that is NOT
// what ships — literal blur-behind that survives losing focus needs a native
// window-composition dependency this project has rejected twice. Mica is
// persistent WITHOUT being acrylic. So the word "persistent" is banned from
// this copy (pinned by a test), and each option states its own trade instead.
const BACKDROP_COPY: Record<Backdrop, { label: string; description: string }> = {
  acrylic: {
    label: 'Acrylic',
    description:
      'Blurs what’s behind the window; Windows flattens it when the window loses focus.'
  },
  mica: {
    label: 'Mica',
    description: 'A steady tint from your wallpaper; doesn’t blur, doesn’t flatten.'
  }
}

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
// Pick-one-of-two, as a radiogroup of buttons rather than radio inputs or a
// select: a dock-wide pin asserts the panel renders neither, and the app's own
// idiom for a choice is a button anyway. Roving tabindex — one tab stop for the
// group, arrows move inside it — and selection follows focus, which is what a
// radiogroup is expected to do. Both options are always mounted, so the focus
// call lands on a live element before React re-renders.
const BackdropChoices = ({
  value,
  onPick
}: {
  value: Backdrop
  onPick: (next: Backdrop) => void
}) => {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown'
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
    if (!forward && !back) return
    e.preventDefault()
    const i = BACKDROPS.indexOf(value)
    const next = BACKDROPS[(i + (forward ? 1 : BACKDROPS.length - 1)) % BACKDROPS.length]
    onPick(next)
    e.currentTarget.parentElement
      ?.querySelector<HTMLElement>(`[data-backdrop="${next}"]`)
      ?.focus()
  }

  return (
    <div
      className="appearance-choices"
      role="radiogroup"
      aria-labelledby="appearance-backdrop-label"
    >
      {BACKDROPS.map((material) => {
        const { label, description } = BACKDROP_COPY[material]
        const descId = `appearance-backdrop-${material}-desc`
        return (
          <button
            key={material}
            type="button"
            role="radio"
            data-backdrop={material}
            className="appearance-choice"
            aria-checked={value === material}
            aria-label={label}
            aria-describedby={descId}
            tabIndex={value === material ? 0 : -1}
            onClick={() => onPick(material)}
            onKeyDown={onKeyDown}
          >
            <span className="appearance-choice-name">{label}</span>
            <span className="appearance-choice-desc" id={descId}>
              {description}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Theme (#70) lands above Backdrop, in the order the spec lists them.
const AppearanceDock = ({
  backdrop,
  onPickBackdrop,
  level,
  onStep,
  onClose
}: {
  backdrop: Backdrop
  onPickBackdrop: (next: Backdrop) => void
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
      {/* Stacked rather than label-left/control-right: each option carries a
          sentence of trade, and the panel is fixed-width. */}
      <div className="appearance-field appearance-field--stacked">
        <span className="appearance-label" id="appearance-backdrop-label">
          Backdrop
        </span>
        <BackdropChoices value={backdrop} onPick={onPickBackdrop} />
      </div>
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
