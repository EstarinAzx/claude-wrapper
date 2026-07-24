// Pure sidebar-width math for the drag-to-resize rail. The width is a pixel
// count applied as the sidebar's inline width; the default matches the old
// fixed CSS width, and every transition is clamped to a usable range so a drag
// can't shrink the rail to nothing or swallow the chat pane. Corrupt input
// (NaN from bad localStorage) falls back to the default — the trust-boundary
// guard, same shape as clampZoom.

export const DEFAULT_SIDEBAR_WIDTH = 248
export const MIN_SIDEBAR_WIDTH = 180
export const MAX_SIDEBAR_WIDTH = 480

export const clampSidebarWidth = (px: number): number => {
  if (!Number.isFinite(px)) return DEFAULT_SIDEBAR_WIDTH
  return Math.round(Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, px)))
}
