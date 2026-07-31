import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeBackdrop, type Backdrop } from '../../shared/backdrop'

// Unversioned, unlike `zoom-level-v2`. That key is versioned because raising
// DEFAULT_ZOOM would otherwise be a no-op for anyone who had already run the
// app. Acrylic is the app's identity rather than a tuned number, so there is no
// default here waiting to be raised. Version it if that ever stops being true.
const STORAGE_KEY = 'backdrop'

const readStored = (): Backdrop =>
  normalizeBackdrop(window.localStorage.getItem(STORAGE_KEY))

export type BackdropControl = {
  backdrop: Backdrop
  set: (next: Backdrop) => void
}

// The window's backdrop material (#69), stored in the renderer beside the four
// preferences already here and pushed to main on mount and on every change —
// the pattern useZoom ships. Main owns the window, not the preference: nothing
// about this value has to be known at BrowserWindow construction time, because
// setBackgroundMaterial is runtime-settable.
export const useBackdrop = (): BackdropControl => {
  // Lazy initialiser, for the reason spelled out in useZoom: storage is read
  // ONCE, before anything observes the value, so a stored material beats the
  // default. Setting this from an effect paints and reports the default first.
  const [backdrop, setBackdrop] = useState(readStored)
  // The mount push must carry the value this hook opened with, not whatever a
  // later render holds — the effect runs once and must not close over a stale
  // or a re-read value.
  const initial = useRef(backdrop)

  const set = useCallback((next: Backdrop): void => {
    setBackdrop(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    window.api.setBackdrop(next)
  }, [])

  useEffect(() => {
    // Unconditional, though main constructs the window acrylic: the constructed
    // default and DEFAULT_BACKDROP are two separate declarations, and this is
    // what keeps them from drifting apart silently.
    window.api.setBackdrop(initial.current)
  }, [])

  return { backdrop, set }
}
