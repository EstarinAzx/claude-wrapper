import { useEffect, useRef, useState } from 'react'
import { isBounds, type Bounds } from '../../shared/window-bounds'

// Versioned, following `zoom-level-v2` rather than `backdrop`. Bounds are a
// SHAPE — four named numbers — and a shape can change; `backdrop` is an
// identity value with nothing to migrate. Bump this key rather than writing a
// migration if the shape ever grows (maximised state is the obvious candidate,
// and is deliberately out of scope for #79).
const STORAGE_KEY = 'window-bounds-v1'

// `null` means "nothing stored" and is a legitimate answer, not a failure. It
// still gets PUSHED — see the mount effect.
const readStored = (): Bounds | null => {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    // Compared, never coerced, on this side too: localStorage is as much a
    // stranger as IPC is, and a hand-edited entry must land on the default
    // rather than travel to `setBounds`.
    return isBounds(parsed) ? parsed : null
  } catch {
    // Corrupt JSON — a partially written entry, or a hand edit. Opening at the
    // constructed default is the correct recovery.
    return null
  }
}

// Remember the window's size and position (#79).
//
// The asymmetry versus `useZoom`/`useBackdrop` is the whole reason this hook
// needs TWO channels rather than one: those preferences are CHANGED in the
// renderer and applied by main, while bounds are changed in MAIN — the user
// drags the window — and merely stored here. So one channel carries the stored
// value out at mount, and a second carries main's debounced report back in.
//
// Nothing renders the bounds, so nothing is kept in React state after the first
// read: a `setState` on every reported drag would re-render the whole app for a
// value no component displays. The lazy `useState` initialiser below is doing
// its one recorded job — reading storage ONCE, before the mount effect runs.
export const useWindowBounds = (): void => {
  // The trap recorded three times over (`useZoom`, `useBackdrop`, `useTheme`):
  // set this from an effect instead and the FIRST push carries `null`, so main
  // is told there is nothing stored, opens at the constructed default, and the
  // feature is silently dead while every renderer-side assertion still passes.
  const [initial] = useState(readStored)
  // The mount push must carry the value this hook opened with — the effect runs
  // once and must not close over a later re-read.
  const initialRef = useRef(initial)

  useEffect(() => {
    // UNCONDITIONAL, including when nothing is stored. Main gates showing the
    // window on this message, so `null` is the signal that means "nothing to
    // apply, you may show now" — skipping it on a first-ever launch would make
    // every new install wait out the timeout fallback instead.
    window.api.setWindowBounds(initialRef.current)

    return window.api.onWindowBoundsChanged((bounds) => {
      // Main is the only sender, but the payload is still checked: this is the
      // value that will be handed back to `setBounds` on the next launch, and a
      // bad write here is a bad restore forever.
      if (!isBounds(bounds)) return
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bounds))
    })
  }, [])
}
