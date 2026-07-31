import { useCallback, useEffect, useState } from 'react'
import { normalizeTheme, type Theme } from '../../shared/theme'

// Unversioned, like `backdrop` and unlike `zoom-level-v2`. That key is versioned
// because raising DEFAULT_ZOOM would otherwise be a no-op for anyone who had
// already run the app. Frost is the app's identity rather than a tuned number,
// so there is no default here waiting to be raised.
const STORAGE_KEY = 'theme'

const readStored = (): Theme => normalizeTheme(window.localStorage.getItem(STORAGE_KEY))

export type ThemeControl = {
  theme: Theme
  set: (next: Theme) => void
}

// The palette (#70), stored in the renderer beside the preferences already here.
// Unlike zoom and backdrop this one fires NO IPC at all: the effect is a data
// attribute on documentElement, which is renderer-side start to finish, so the
// main process never learns the app changed colour.
export const useTheme = (): ThemeControl => {
  // Lazy initialiser, and it is load-bearing exactly as it is in useZoom and
  // useBackdrop. Setting this from an effect instead would leave every display
  // pin green — the panel would still open on the stored theme — while the
  // window painted Frost first and swapped a frame later. A preference with
  // both a REPORT and an EFFECT can self-heal in the report and stay broken in
  // the effect, so the pins are on the attribute, not on the panel.
  const [theme, setTheme] = useState(readStored)

  // Applying it IS an effect rather than a render-time write, because
  // documentElement is outside React's tree; keeping it here also means the
  // attribute follows the state on every path, not only through `set`.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const set = useCallback((next: Theme): void => {
    setTheme(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  return { theme, set }
}
