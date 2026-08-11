import type { KeyboardEvent, ReactNode } from 'react'
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

// The panel's ONE selection mark, worn by both pick-one controls so Theme and
// Backdrop read as a single control family instead of two sets of labelled
// boxes. It ends the option's title line in both, at the same inset, so the
// marks line up down the whole dock across the two groups.
//
// Geometry is the docks' existing icon vocabulary, not a new one: a 12x12
// viewBox painted at 12x12 (1:1, like every other icon in the three docks),
// `strokeWidth="1.4"`, `fill="none"`, `stroke="currentColor"`, round caps. The
// path itself is the check already drawn in Chat.tsx's copy button, reused
// rather than redrawn — only its stroke changes, from that surface's 1.6 to the
// 1.4 every dock icon carries.
//
// The slot is rendered on EVERY option and the glyph only on the selected one.
// Two reasons, and both are load-bearing: reserving the 12px keeps the theme
// swatches in one column and the row's right edge still as the selection
// moves, and drawing nothing on the rest is the restraint DESIGN.md's colour
// strategy asks for — the mint wash and the mint name already say "selected",
// so a mark on every row would be four glyphs saying nothing.
//
// This sentence used to name a mint BORDER as a third signal, and a card that
// the border was drawn on. Neither exists: the option is a bare row on the
// shared shell now, it owns no edges, and appearance.css carries both the
// arithmetic for what the wash replaced and the reason a mint edge cannot come
// back. Two signals, not three.
//
// `aria-hidden` because it is decorative twice over: `aria-selected` and
// `aria-checked` are what actually announce the state.
const SelectionMark = ({ on }: { on: boolean }) => (
  <span className="appearance-choice-mark" aria-hidden="true">
    {on ? (
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path
          d="M2.4 6.3l2.4 2.5 4.8-5.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : null}
  </span>
)

// ── section marks ─────────────────────────────────────────────────────────
//
// One per group, and the reason the three groups stop being interchangeable.
// Geometry is the docks' EXISTING 12-grid vocabulary, not a new one: a 12x12
// viewBox painted at 12x12 (1:1, like every other dock icon), `strokeWidth`
// 1.4, `fill="none"`, `stroke="currentColor"`, round caps, and a filled accent
// only ever as a circle — the same construction AgentsDock's map glyph already
// uses for its three nodes.
//
// Judged by rasterising at actual size and by ink area: chip 41.4px^2, sheets
// 35.7, lens 33.4. Optical extent runs 8.8 to 9.4px.
//
// Both of those were fixed against the 12-grid range as it stood — 7.4 to 9.4,
// the agents dock's list and map glyphs at the top of it — and that range has
// since moved. The seven marks that wear the SHARED 28px housing (the rail's
// two chevrons and the five dock-head buttons) were cut to the 14 grid's 10.4
// optical extent; the derivation is on the map glyph in AgentsDock. These three
// marks are NOT on that housing — they head a section, they are not a button —
// so they were left exactly as they were, and they now read a rung below the
// close in this dock's own head rather than level with it. Whether a section
// mark should track the housing family or hold its own smaller rung is a live
// question and not one this pass answered.
//
// They are section IDENTITY rather than decoration, which is why each one is
// the group's own subject and not a generic bullet: Theme is a colour chip,
// Backdrop two stacked sheets, Zoom a lens. Painted one rung ABOVE the word
// beside them (--text-muted against --text-faint) because the mark is what
// differs between the three headers and the word only confirms it.

// A chip: the ring is the swatch, the dot the colour in it. Clearance between
// the dot's edge (r 1.4) and the ring's inner edge (r 3.3) is 1.9px, above the
// 1.2px minimum the map glyph established for this grid.
const ThemeMark = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <circle
      cx="6"
      cy="6"
      r="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <circle cx="6" cy="6" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

// Two sheets seen edge-on — the window's material sitting over what is behind
// it. Straight segments only, no curve: the diamond is 7.4 wide by 4.2 tall,
// and the tightest approach between the two shapes is 2.78 units, from the
// chevron's left cap perpendicular to the diamond's lower-left edge. At a 1.4
// stroke that leaves 1.38px of clear ground, above the 1.2px the map glyph
// established as the minimum that survives at 12px.
const BackdropMark = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M6 2.3L9.7 4.4 6 6.5 2.3 4.4z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.3 7.6L6 9.7 9.7 7.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// A lens. Its handle starts at 7.7,7.7 — inside the ring's outer stroke edge at
// 7.89 — so the two read as one object rather than a circle beside a tick.
const ZoomMark = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <circle
      cx="5.2"
      cy="5.2"
      r="3.1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <line
      x1="7.7"
      y1="7.7"
      x2="10"
      y2="10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
)

// The panel's ONE section header, worn by all three groups.
//
// What it replaces is the reason it exists: three labels floating in the same
// 13px the option names are set in, over three stacks of identically rounded
// boxes. Nothing said where Theme ended and Backdrop began except a 16px gap,
// and nothing distinguished one group from another except the word.
//
// So the header does three things at once and they are one move, not three: the
// mark gives the section an identity, the word drops to the micro-caps rung the
// dock's own title already uses so it stops competing with the option names it
// heads, and the rule runs the header out to the panel's edge so the group
// below reads as its content rather than as the next four boxes down. On the
// one section that carries `trailing`, the rule runs into that control instead
// of to the edge, and there is no group below for it to introduce.
//
// `id` stays on the WORD, because that is the string both pick-one controls
// point `aria-labelledby` at. `text-transform` does not touch the DOM text, so
// the accessible name is still "Theme" and not "THEME".
//
// `trailing` is the one seam: a section whose whole control fits at the END of
// its header puts it there instead of below. Only Zoom takes it, and the reason
// it exists is silhouette — see the zoom note in appearance.css. The two lists
// pass nothing and render exactly what they rendered before, so the header is
// still one component and not two.
//
// The header is a `span`, so anything handed to `trailing` must be phrasing
// content. Buttons and spans are; a div is not.
const Section = ({
  id,
  title,
  mark,
  trailing,
  children
}: {
  id: string
  title: string
  mark: ReactNode
  trailing?: ReactNode
  children?: ReactNode
}) => (
  <div className="appearance-field">
    <span className="appearance-head">
      <span className="appearance-head-mark" aria-hidden="true">
        {mark}
      </span>
      <span className="appearance-label" id={id}>
        {title}
      </span>
      <span className="appearance-rule" aria-hidden="true" />
      {trailing}
    </span>
    {children}
  </div>
)

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
          <span className="appearance-choice-line">
            <span className="appearance-choice-name">{THEME_NAMES[name]}</span>
            <span className="appearance-swatch" data-theme={name} aria-hidden="true" />
            <SelectionMark on={value === name} />
          </span>
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
            <span className="appearance-choice-line">
              <span className="appearance-choice-name">{label}</span>
              <SelectionMark on={value === material} />
            </span>
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
        {/* Kept byte-identical to the close in AgentsDock and CommandsDock —
            one mark on three surfaces. 1.5 to 10.5 is 9 of path plus the grid's
            1.4 stroke: the 10.4 optical extent the 14-grid plus lands on, where
            3-to-9 inked 7.4. Derivation is on the map glyph in AgentsDock. This
            is the dock HEAD's button and not one of the section marks below,
            which are not on the shared housing and did not move. */}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M1.5 1.5l9 9M10.5 1.5l-9 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
    <div className="appearance-body">
      {/* Each row shows the palette it selects, so the choice is legible before
          it is made. */}
      <Section id="appearance-theme-label" title="Theme" mark={ThemeMark}>
        <ThemeChoices value={theme} onPick={onPickTheme} />
      </Section>
      <Section id="appearance-backdrop-label" title="Backdrop" mark={BackdropMark}>
        <BackdropChoices value={backdrop} onPick={onPickBackdrop} />
      </Section>
      {/* Zoom takes the same header as the other two — it did not before, and
          that stays. What changes is where its control sits: ON the header,
          flush right, sized to itself, instead of filling the column below it.

          The reason is silhouette, not taste. Zoom is the only one of the three
          that is not a LIST — one value, two steps — and while its stepper
          filled the column, all three sections resolved to the same object at a
          glance: a bordered, 8px-rounded, full-width shell. Three identical
          shapes holding three unrelated kinds of content is the thing a reader
          scanning this dock actually meets, and the content differences do not
          survive it.

          Not a return to the pre-header layout: that row carried no mark, no
          rule and a 999px pill hung off the edge. Only the strip's POSITION
          moved; every part the header pass added is still here.

          Minus / readout / plus, stepping through the same helper the keyboard
          shortcuts use. No reset button — stepping reaches the default — and no
          slider or select, either of which would invent a value list the
          stepping logic does not have.

          A `span` rather than a `div` because it is now inside the header span
          and a div is not phrasing content. Nothing else about it changed: same
          class, same role, same label, same two buttons. */}
      <Section
        id="appearance-zoom-label"
        title="Zoom"
        mark={ZoomMark}
        trailing={
          <span
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
          </span>
        }
      />
    </div>
  </aside>
)

export default AppearanceDock
