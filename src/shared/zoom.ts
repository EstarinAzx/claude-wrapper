// Pure zoom-level math for the renderer's Ctrl/Cmd +/-/0 shortcuts. The level is
// an Electron webContents zoom factor (1 = 100%); the default starts slightly
// zoomed in per the product ask. Every transition is clamped to a sane range and
// rounded to 2dp so repeated stepping never drifts on float error. Corrupt input
// (NaN from bad localStorage / IPC) falls back to the default — this is the
// trust-boundary guard the main-side handler reuses.

export const DEFAULT_ZOOM = 1.1
export const MIN_ZOOM = 0.7
export const MAX_ZOOM = 2.0
export const ZOOM_STEP = 0.1

export type ZoomAction = 'in' | 'out' | 'reset'

export const clampZoom = (level: number): number => {
  if (!Number.isFinite(level)) return DEFAULT_ZOOM
  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level))
  return Math.round(clamped * 100) / 100
}

export const nextZoom = (current: number, action: ZoomAction): number => {
  if (action === 'reset') return DEFAULT_ZOOM
  const stepped = action === 'in' ? current + ZOOM_STEP : current - ZOOM_STEP
  return clampZoom(stepped)
}
