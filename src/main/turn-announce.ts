import { ANNOUNCE_COPY, shouldAnnounce, turnOutcome } from '../shared/announce'
import type { EngineEvent } from '../shared/engine-types'

// The turn-end announcement (#75), as a reaction over injected ports.
//
// It lives apart from `index.ts` for the same reason `switch-workspace.ts` does:
// the electron entry cannot be imported under vitest, and the thing worth
// pinning here is that the decision is CONSULTED and ACTED ON — the call count
// and the arguments — not merely that something happened.
//
// No new IPC channel: main already holds both halves inside `chat:send` (the
// event stream and the BrowserWindow), so the question "did a turn just end
// while nobody was looking?" is answered locally. The renderer does not own the
// window's focus and must not be asked about it.

export interface AnnouncePorts {
  /** Focused RIGHT NOW — called at turn end, never captured at turn start. */
  isFocused(): boolean
  notify(copy: { title: string; body: string }): void
  flash(): void
}

/** The two window reads that decide whether anyone is looking. */
export interface FocusReadable {
  isFocused(): boolean
  isMinimized(): boolean
}

// "Nobody is looking" is NOT `isFocused()` alone, and the difference was
// measured on this platform rather than assumed. Electron 43 / Windows 11:
//
//   win.blur()     → isFocused() stays TRUE, no 'blur' event
//   win.minimize() → isFocused() stays TRUE, webContents.isFocused() goes false
//   win.hide()     → isFocused() finally false, 'blur' fires
//
// So a minimised window — the plainest form of "I walked away" — reports itself
// focused, and the obvious one-liner would stay silent in exactly the case the
// feature exists for. A minimised window is not being looked at whatever the OS
// says about activation, so that is asserted here rather than trusted.
export const isLooking = (win: FocusReadable): boolean => win.isFocused() && !win.isMinimized()

export const announceTurn = (ports: AnnouncePorts, e: EngineEvent): void => {
  const outcome = turnOutcome(e)
  // Mid-turn events leave without touching a port — including `isFocused`,
  // which would otherwise be hit once per text delta.
  if (outcome === null) return

  const { notify, flash } = shouldAnnounce({ outcome, focused: ports.isFocused() })

  // The `turn-aborted` half of this condition is what lets ANNOUNCE_COPY
  // exclude that outcome BY TYPE, so a fourth outcome cannot ship without
  // someone writing copy for it.
  //
  // It is also, measured rather than assumed, a SECOND runtime guard on the
  // silent row. Removing the abort guard from `shouldAnnounce` and running
  // gui-75 gives `newNotifications: 0, newFlashes: 1` — the flash leaks and the
  // toast does not. Kept deliberately: the asymmetry fails toward the quieter
  // half, and the driver still reddens. Do not read it as dead code and delete
  // it, and do not "tidy" the silent row's decision into this line — the table
  // in `shouldAnnounce` is the one that is unit-tested.
  if (notify && outcome !== 'turn-aborted') ports.notify(ANNOUNCE_COPY[outcome])
  if (flash) ports.flash()
}
