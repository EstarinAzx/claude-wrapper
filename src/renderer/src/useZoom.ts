import { useEffect } from 'react'
import { clampZoom, nextZoom, DEFAULT_ZOOM, type ZoomAction } from '../../shared/zoom'

// Versioned: the previous key holds every existing install's copy of the OLD
// default, and a stored level always wins over the default. Without the bump,
// raising DEFAULT_ZOOM would be a no-op for anyone who had already run the app.
// Bump again on the next default change; a hand-set level survives within a
// version, which is the whole point of persisting it.
const STORAGE_KEY = 'zoom-level-v2'

const readStored = (): number => {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return clampZoom(raw === null ? DEFAULT_ZOOM : Number(raw))
}

// Applies the persisted (or default ~1.1) zoom on mount and wires Ctrl/Cmd
// +/-/0 to step it live. We own only the level number + its persistence; the
// main process scales the whole renderer via webContents zoom. `=`/`-` are the
// unshifted keys (the physical +/- keys), `+`/`_` their shifted twins.
export const useZoom = (): void => {
  useEffect(() => {
    let level = readStored()
    const apply = (next: number): void => {
      level = next
      window.localStorage.setItem(STORAGE_KEY, String(level))
      window.api.setZoom(level)
    }
    apply(level) // on mount: default or restored

    const onKey = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return
      const action: ZoomAction | null =
        e.key === '+' || e.key === '='
          ? 'in'
          : e.key === '-' || e.key === '_'
            ? 'out'
            : e.key === '0'
              ? 'reset'
              : null
      if (!action) return
      e.preventDefault()
      apply(nextZoom(level, action))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
