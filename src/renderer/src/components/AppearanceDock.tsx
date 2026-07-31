import type { KeyboardEvent } from 'react'
import { MAX_ZOOM, MIN_ZOOM, type ZoomAction } from '../../../shared/zoom'
import { BACKDROPS, type Backdrop } from '../../../shared/backdrop'
import { THEMES, type Theme } from '../../../shared/theme'

// Arrow-key movement, shared by the panel's two pick-one controls: forward on
// Right/Down, back on Left/Up, wrapping at both ends. Returns null for every
// other key so the caller can leave the event alone.
const nextInRing = <T,>(ring: readonly T[], current: T, key: string): T | null => {
  const forward = key === 'ArrowRight' || key === 'ArrowDown'
  const back = key === 'ArrowLeft' || key === 'ArrowUp'
  if (!forward && !back) return null
  const i = ring.indexOf(current)
  return ring[(i + (forward ? 1 : ring.length - 1)) % ring.length] as T
}

// The name each palette shows (#70). Keyed by Theme and rendered by mapping over
// THEMES, the shape BACKDROP_COPY established: "exactly four options" is then a
// type constraint rather than a counted assertion — a fifth palette without a
// name is a compile error, and a name for a palette that is not offered renders
// nowhere. No descriptions: a theme states its case by being applied, which is
// instant, whereas a backdrop's trade is invisible until you click away.
const THEME_NAMES: Record<Theme, string> = {
  frost: 'Frost',
  ember: 'Ember',
  moss: 'Moss',
  slate: 'Slate'
}

// A listbox rather than a radiogroup, unlike its sibling below. Not a style
// choice: a dock-wide pin reads every radio in this panel as a backdrop, and a
// second radiogroup here would break it. Single-select is what both roles mean,
// so the pin keeps its meaning and this control keeps correct semantics.
//
// Each swatch carries `data-theme`, which is the same attribute the document
// element wears — so the block in themes.css applies to the swatch too and it
// paints itself in its own palette's accent. That is why no theme colour is
// duplicated here or in appearance.css. It must read `var(--color-mint)` and
// not the short `--mint` alias: the alias resolved once, up at :root.
const ThemeChoices = ({
  value,
  onPick
}: {
  value: Theme
  onPick: (next: Theme) => void
}) => {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    const next = nextInRing(THEMES, value, e.key)
    if (!next) return
    e.preventDefault()
    onPick(next)
    e.currentTarget.parentElement
      ?.querySelector<HTMLElement>(`[data-option-theme="${next}"]`)
      ?.focus()
  }

  return (
    <div className="appearance-choices" role="listbox" aria-labelledby="appearance-theme-label">
      {THEMES.map((name) => (
        <button
          key={name}
          type="button"
          role="option"
          data-option-theme={name}
          className="appearance-choice appearance-choice--theme"
          aria-selected={value === name}
          tabIndex={value === name ? 0 : -1}
          onClick={() => onPick(name)}
          onKeyDown={onKeyDown}
        >
          <span className="appearance-choice-name">{THEME_NAMES[name]}</span>
          <span className="appearance-swatch" data-theme={name} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

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
    const next = nextInRing(BACKDROPS, value, e.key)
    if (!next) return
    e.preventDefault()
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
  theme,
  onPickTheme,
  backdrop,
  onPickBackdrop,
  level,
  onStep,
  onClose
}: {
  theme: Theme
  onPickTheme: (next: Theme) => void
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
      {/* Stacked for the same reason as Backdrop below — four named rows do not
          sit beside a label in a fixed-width panel. Each row shows the palette
          it selects, so the choice is legible before it is made. */}
      <div className="appearance-field appearance-field--stacked">
        <span className="appearance-label" id="appearance-theme-label">
          Theme
        </span>
        <ThemeChoices value={theme} onPick={onPickTheme} />
      </div>
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
