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
// the border was drawn on. Neither exists: every option now carries the same
// resting --tint-2 inset shell, matching Commands' target-weight boundary rather
// than a container edge at --border, while selection adds the mint wash beneath
// it. The shell is anatomy, not state; selection still reads through the wash,
// mint name, and mint mark.
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
// ALL THREE ARE NOW CUT TO 10.4 OF OPTICAL EXTENT, which closes a question this
// note recorded as open.
//
// They were drawn at 8.8 (sheets), 9.3 (lens) and 9.4 (chip), fixed against the
// 12-grid range as it stood — 7.4 to 9.4, the agents dock's list and map glyphs
// at the top of it. That range then moved: the seven marks wearing the SHARED
// 28px housing (the rail's two chevrons and the five dock-head buttons) were cut
// to the 14 grid's 10.4, the derivation being on the map glyph in AgentsDock.
// These three are NOT housing tenants — they head a section, they are not a
// button — so that pass correctly left them alone, and asked here whether a
// section mark should track the housing family or hold its own smaller rung.
//
// It should track the family, and the reason is what the mark now has to do
// rather than what it is attached to. The section header gave up its hairline
// this pass (appearance.css argues why), so the mark is the only non-text thing
// left in a header and it carries the whole of that header's presence. A mark
// asked to do more, drawn smaller than every other mark in the same 248px
// column, is the wrong way round. The housing was never the reason for 10.4
// anyway — 10.4 is what the 14 grid's plus lands on, and the housing pass
// adopted it as the app's one glyph envelope, not as a property of buttons.
//
// The cut is the same one the seven took: path extent 9 across the larger
// dimension, spanning 1.5 to 10.5, inking 0.8 to 11.2 for 10.4, and leaving 0.8
// of clear ground inside the viewBox so nothing clips. GEOMETRY ONLY — width,
// height, viewBox and strokeWidth are untouched on all three, because a
// mechanical sweep enforces 1:1 viewBox-to-pixel across every dock icon and
// because 1.4 is the grid's stroke rather than this glyph's. Each mark carries
// its own derivation below, including what the unscaled stroke did to its
// internal clearances — the stroke staying 1.4 while the drawing grows is the
// one thing a uniform scale does not handle, and it is where these three would
// have clipped or collided if taken carelessly.
//
// Ink areas were 41.4px^2 (chip), 35.7 (sheets) and 33.4 (lens), rasterised at
// actual size. They are now roughly 45.8, 43.4 and 38.0 — ESTIMATED by scaling
// stroke length at unchanged stroke width, not re-rasterised. Extent is the
// number the family is cut to and the number to trust; these are recorded so
// the earlier figures are not read as current.
//
// They are section IDENTITY rather than decoration, which is why each one is
// the group's own subject and not a generic bullet: Theme is a colour chip,
// Backdrop two stacked sheets, Zoom a lens. Painted one rung ABOVE the word
// beside them (--text-muted against --text-faint) because the mark is what
// differs between the three headers and the word only confirms it.

// A chip: the ring is the swatch, the dot the colour in it.
//
// The ring grew from r4 to r4.5 and that is the whole edit. It is already
// centred on the grid, so the extent falls straight out: a diameter of 9 spans
// 6 - 4.5 = 1.5 to 6 + 4.5 = 10.5, and the 1.4 stroke bleeds 0.7 each way for
// ink from 0.8 to 11.2 — extent 10.4, clear ground 0.8. r4 gave 8 + 1.4 = 9.4.
//
// THE DOT DELIBERATELY DID NOT GROW. 1.4 is this codebase's one filled-circle
// radius — the map glyph's three nodes are 1.4 in the same dock at the same
// stroke — so scaling it here would invent a second. The consequence is a
// clearance that improves rather than tightens: the ring's inner edge moved out
// from r3.3 to 4.5 - 0.7 = 3.8, so the gap between it and the dot's edge goes
// 1.9px to 2.4px, against the 1.2px minimum the map glyph established for this
// grid. A chip with slightly more field around its colour is also the truer
// drawing of the thing.
const ThemeMark = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <circle
      cx="6"
      cy="6"
      r="4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <circle cx="6" cy="6" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

// Two sheets seen edge-on — the window's material sitting over what is behind
// it. Straight segments only, no curve.
//
// A UNIFORM SCALE ABOUT THE GRID CENTRE, k = 9 / 7.4 = 1.21622. The old drawing
// spanned 2.3 to 9.7 on both axes — 7.4 square, ink 8.8 — and it was already
// centred on (6,6), so one factor takes every coordinate to the 1.5-to-10.5
// span the family is cut to. 3.7 x k is exactly 4.5, which is why both extremes
// land on whole tenths: 2.3 -> 1.5, 9.7 -> 10.5. The interior points follow at
// 4.4 -> 4.05, 6.5 -> 6.61, 7.6 -> 7.95. Extent 9 + 1.4 = 10.4, clear ground
// 0.8. The diamond goes 7.4 x 4.2 to 9 x 5.11 — 1.761 against 1.762, the same
// shape and not a restretched one.
//
// THE STROKE DID NOT SCALE AND THAT IS WHY THIS ONE IS SAFE. The tightest
// approach between the two shapes is the perpendicular from the chevron's left
// cap to the diamond's lower-left edge, and it is a distance between
// CENTRELINES: it was 2.783 units, and a k of 1.21622 takes it to 3.390. Clear
// ground is that minus one whole stroke — the two half-strokes facing each
// other — so 2.783 - 1.4 = 1.383px becomes 3.390 - 1.4 = 1.990px. It nearly
// doubled. A drawing that grows at a fixed stroke opens its own gaps, which is
// the general reason this cut is safe on a two-shape glyph and the specific
// reason no coordinate here needed hand-nudging away from the scale. 1.2px is
// the minimum the map glyph established as surviving at 12px.
const BackdropMark = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M6 1.5L10.5 4.05 6 6.61 1.5 4.05z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M1.5 7.95L6 10.5 10.5 7.95"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// A lens. Its handle starts inside the ring's outer stroke edge, so the two read
// as one object rather than a circle beside a tick.
//
// SCALE PLUS RECENTRE, unlike its two neighbours: this drawing was not centred
// on the grid. The circle reached 2.1 and the handle reached 10, so the path
// bbox ran 2.1 to 10 on both axes — 7.9 across, ink 9.3, sitting on a centre of
// 6.05 rather than 6. So p' = 6 + (p - 6.05) x k with k = 9 / 7.9 = 1.13924,
// which both grows it and pulls it back onto the grid: centre 5.2 -> 5.03,
// radius 3.1 -> 3.53, handle end 10 -> 10.5. The circle's near edge lands on
// 5.03 - 3.53 = 1.50 and the handle's far end on 10.50, so the path extent is
// 9.00 on both axes, inking 0.8 to 11.2 for 10.4 with 0.8 of clear ground.
//
// THE HANDLE'S START IS HAND-SET AND IS THE ONE COORDINATE THAT REFUSED THE
// SCALE. What holds this glyph together is that the handle begins INSIDE the
// ring's outer stroke edge; the burial is a distance between one point and one
// stroke edge, so the unscaled 1.4 corrupts it in a way it did not corrupt the
// two-shape clearance next door. Measured radially: the ring's outer edge was
// 3.1 + 0.7 = 3.8 from its centre and the start sat at 2.5 x sqrt2 = 3.536,
// buried 0.264. Scaling the drawing but not the stroke moves the edge to 3.53 +
// 0.7 = 4.23 and a scaled start (7.88) to 4.03 — burial 0.199, a THIRD of it
// lost, and the join is what the eye reads first at 12px. Scaling the
// relationship instead of the coordinate gives the target: 0.264 x 1.13924 =
// 0.301, which is where a true similarity of the whole ink would have put it.
// 7.81 lands 2.78 x sqrt2 = 3.932 out, buried 4.23 - 3.932 = 0.298. The 0.003
// short is two-decimal rounding on cx and r, not slack. 0.30 is also exactly
// the burial the map glyph's stem carries into its node — the tightest in the
// family, so this is the family's number and not a local one.
const ZoomMark = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <circle
      cx="5.03"
      cy="5.03"
      r="3.53"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <line
      x1="7.81"
      y1="7.81"
      x2="10.5"
      y2="10.5"
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
// So the header does two things at once and they are one move, not two: the
// mark gives the section an identity, and the word drops to the micro-caps rung
// the dock's own title already uses so it stops competing with the option names
// it heads.
//
// IT DID THREE THINGS UNTIL THIS PASS. The third was a hairline — a
// `span.appearance-rule` after the word, running out to the panel's edge — and
// it is deleted rather than hidden. Two reasons, and the second is why it could
// not simply be toned down. It was the dock's second organisational grammar:
// the agents and commands lists SEPARATE their rows with 2px of ground and
// nothing else, so a reader crossing the three right-hand docks met
// grouping-by-space twice and grouping-by-ruled-band once. And a rule is the
// loudest available way to say "separate", which is the wrong volume for the
// boundary between Theme and Backdrop inside one 248px panel — it was the last
// thing here reading like a generic settings scaffold.
//
// THE WORD "SEPARATE" IS NOW CARRYING WEIGHT IT DID NOT HAVE TO BEFORE, and the
// sentence above said "nothing but 2px of ground" until this note was corrected.
// In the same wave that deleted this hairline, `.command-row-btn` (rails.css)
// took a resting --tint-2 shell, so a command row is no longer bare. That does
// not cost this deletion its argument — it sharpens it. That shell BOUNDS a hit
// target on a list with no state to paint; it does not divide one row from the
// next, which is still done by the 2px gap alone in all three docks. The rule
// deleted here did the opposite: it drew a line BETWEEN things and bounded
// nothing. So the count stands as written — no dock separates with a rule — and
// what a later pass must not do is read the commands shell as permission to put
// this hairline back. rails.css's boundary note derives the distinction, and its
// two-boundary-answers paragraph ranks the weights it turns on.
//
// What replaces it is spacing, and the ratio is derived in appearance.css's
// sections note: 24px above a header against 4px below it, which is 35.9 to
// 15.9 once half-leading is counted. The 4px is the sessions rail's own
// interval between a group heading and its first row, so the grammar this
// header now speaks is one the app already had.
//
// Deleting the element had one consequence worth naming here, since it is
// invisible from the markup: the rule carried `flex: 1 1 auto` and was
// therefore what held `trailing` flush right. `.appearance-label` takes that
// declaration now. Without it the zoom stepper would sit against the word.
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
            is the dock HEAD's button, which took that cut as a tenant of the
            shared 28px housing. The three section marks below are NOT housing
            tenants and were left behind by it; they have since been cut to the
            same 10.4 on their own reasoning — see the section-marks note — so
            every mark in this dock now shares one envelope, reached by two
            different routes. */}
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

          Not a return to the pre-header layout: that row carried no mark at
          all, and a 999px pill hung off the edge rather than this 8px strip.
          Only the strip's POSITION moved.

          That discriminator used to include "no rule", and it no longer
          discriminates — this header has dropped its hairline too, for the
          reason in the Section note above. What still tells the two apart is
          the mark and the strip's radius, and what holds this control flush
          right is now `.appearance-label`'s flex rather than the rule's.

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
