import { useCallback, useEffect, useRef, useState } from 'react'
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

// What the hook hands back: the current level to display, and the one way to
// change it. Both the keyboard shortcuts and the Appearance panel's stepper go
// through `step`, so the readout can never disagree with the window.
export type ZoomControl = {
  level: number
  step: (action: ZoomAction) => void
}

// Applies the persisted (or default ~1.25) zoom on mount and wires Ctrl/Cmd
// +/-/0 to step it live. We own only the level number + its persistence; the
// main process scales the whole renderer via webContents zoom. `=`/`-` are the
// unshifted keys (the physical +/- keys), `+`/`_` their shifted twins.
export const useZoom = (): ZoomControl => {
  // #66 lifted the level out of the mount effect's `let` so a readout can show
  // it. The lazy initialiser is what keeps the first-mount persist intact:
  // `readStored()` still runs ONCE, before anything observes the level, so a
  // stored level beats the default exactly as it did inside the closure. An
  // effect-set initial state would paint the default first and is the
  // regression this shape exists to avoid.
  const [level, setLevel] = useState(readStored)
  // The keydown listener binds once and must read the CURRENT level. State
  // alone would freeze it at the mount value, so the ref is the listener's
  // copy and `level` is the render's.
  const levelRef = useRef(level)

  const apply = useCallback((next: number): void => {
    levelRef.current = next
    setLevel(next)
    window.localStorage.setItem(STORAGE_KEY, String(next))
    window.api.setZoom(next)
  }, [])

  const step = useCallback(
    (action: ZoomAction): void => {
      apply(nextZoom(levelRef.current, action))
    },
    [apply]
  )

  useEffect(() => {
    apply(levelRef.current) // on mount: default or restored

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
      step(action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [apply, step])

  return { level, step }
}
