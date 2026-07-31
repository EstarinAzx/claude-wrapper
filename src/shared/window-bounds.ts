// The window's remembered size and position (#79), and the two pure functions
// that stand between a stored value and `win.setBounds`.
//
// This preference is the FIRST in the app that genuinely wants an answer before
// the window is on screen — backdrop and zoom are runtime-settable, so they can
// arrive late and merely cost a frame. That is a structural difference, and it
// is the one sentence #79 amends in [[2026-07-31-a-preference-lives-where-it-is-read]].
// It is NOT a reason for a main-side store: the ADR's conclusion survives, and
// the bounds still live in renderer localStorage and arrive over IPC, exactly
// as `backgroundMaterial` does.
//
// `isBounds` is the trust boundary, the same job `normalizeBackdrop` and
// `clampZoom` do for their channels. `clampBounds` is a SAFETY property rather
// than a validation one — see below.

export type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

// The one thing this module needs from an Electron `Display`. Narrower than the
// real type on purpose: the clamp is tested without a window, and `workArea`
// (not `bounds`) is the right rectangle because it excludes the taskbar.
export type DisplayLike = {
  workArea: Bounds
}

// Compared, never coerced — the rule `normalizeBackdrop` sets. `Number('100')`
// is 100, so a coercing guard would accept a JSON blob of strings from a
// hand-edited localStorage and hand it to the window.
//
// Position may be negative (the monitor to the LEFT of the primary has negative
// coordinates, and that is a normal place to keep a window); extent may not be
// zero or negative, which is not a window at all. Anything below the window's
// own `minWidth`/`minHeight` is left to Electron, which enforces those itself.
export const isBounds = (value: unknown): value is Bounds => {
  if (typeof value !== 'object' || value === null) return false
  const b = value as Record<string, unknown>
  const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)
  return (
    finite(b['x']) &&
    finite(b['y']) &&
    finite(b['width']) &&
    finite(b['height']) &&
    b['width'] > 0 &&
    b['height'] > 0
  )
}

const overlapArea = (a: Bounds, b: Bounds): number => {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

// The display the window is most ON, or the primary if it is on none of them —
// which is exactly the "that monitor is gone" case.
const pickWorkArea = (bounds: Bounds, displays: readonly DisplayLike[]): Bounds | null => {
  if (displays.length === 0) return null
  let best = displays[0]!
  let bestArea = 0
  for (const display of displays) {
    const area = overlapArea(bounds, display.workArea)
    if (area > bestArea) {
      best = display
      bestArea = area
    }
  }
  return best.workArea
}

// Restore a stored rectangle onto the CURRENT display layout.
//
// A stored position is a promise about a layout that may not exist any more:
// undock a laptop, unplug a monitor, drop the resolution, and the window comes
// back entirely off screen with no way to reach it — strictly worse than not
// remembering at all. So the rule is one line: the window ends up fully inside
// some real work area, at its stored size where that fits.
//
// Valid bounds must pass through unchanged. A clamp that quietly nudged every
// launch would still satisfy every "it is on screen afterwards" assertion while
// making the feature pointless, so that identity case is pinned in the table.
//
// The display list is read by the CALLER at the moment of applying, never
// cached at boot — a monitor can be unplugged while the app is running.
export const clampBounds = (bounds: Bounds, displays: readonly DisplayLike[]): Bounds => {
  const area = pickWorkArea(bounds, displays)
  if (!area) return { ...bounds }

  const width = Math.min(bounds.width, area.width)
  const height = Math.min(bounds.height, area.height)
  return {
    x: Math.min(Math.max(bounds.x, area.x), area.x + area.width - width),
    y: Math.min(Math.max(bounds.y, area.y), area.y + area.height - height),
    width,
    height
  }
}
