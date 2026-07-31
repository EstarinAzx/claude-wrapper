---
type: decision
project: claude-wrapper
updated: 2026-07-31
tags: [context, decision, main, notifications]
---

# An unwatched turn end is main's to announce — and "unwatched" is not `isFocused()`

**Decision:** #75 announces a turn that reaches a terminal outcome while nobody
is looking, with a native notification plus a taskbar flash. Three things carry
it, and only the first was in the ticket:

1. **No new IPC channel.** `chat:send` already holds both halves — the event
   stream and the `BrowserWindow` — so the question "did a turn just end while
   nobody was looking?" is answered locally in main.
2. **`turn-aborted` is silent, by design.** `turn-end` and `error` announce.
3. **"Nobody is looking" is `isFocused() && !isMinimized()`, not `isFocused()`**,
   because the one-liner the ticket prescribed is measurably wrong on this
   platform.

## Why main, and why no channel

The renderer does not own the window's focus and cannot answer the question. The
alternative shape — renderer notices the turn ended, asks main whether it is
focused, asks main to notify — is two round trips to reach a decision main can
make with two local reads. It would also have dragged in the four-mock-sites +
`preload/index.d.ts` landmine for a channel that buys nothing.

`shouldAnnounce` is pure and lives in `src/shared/` for the usual reason: the
electron entry cannot be imported under vitest, so the six-case table would
otherwise be pinned nowhere. `announceTurn` sits in `src/main/` over injected
ports, the same shape as `switch-workspace.ts`, so the call COUNT and the
ARGUMENTS are assertable without a window.

## Why `turn-aborted` says nothing

The user pressed Stop a second ago. A toast for an action the user has just
taken is noise, and noise is how a notification feature gets turned off. An
`error`, by contrast, announces on the same footing as a success: a failed turn
is *more* urgent to know about, not less.

The record is **silent** on notifications — nothing in `.context/`, `PRODUCT.md`
or `DESIGN.md` constrains or encourages them — so this table is a chosen design,
not a citation, and it is labelled as such in the source.

## The measured part: a minimised window reports itself focused

The ticket said "`win.isFocused()` is the check". Probed on Electron 43 /
Windows 11 before it was written, and it is not:

| action | `win.isFocused()` | `webContents.isFocused()` | `blur` event |
|---|---|---|---|
| `win.blur()` | **true** | true | never fires |
| `win.minimize()` | **true** | false | never fires |
| `win.hide()` | false | false | fires |

So a **minimised** window — the plainest form of "I walked away" — reports
itself focused, and the prescribed one-liner would have stayed silent in exactly
the case the feature exists for. `isLooking(win)` asserts the obvious thing the
OS does not: a minimised window is not being looked at, whatever it says about
activation.

This is the project's standing lesson applied to an instrument rather than to a
symptom — **measure the stated cause before building on it** (#71's gutter,
#72's drag region, #68's Windows handle). It also decided the driver: `gui-75`
minimises rather than blurs, because a driver built on `win.blur()` would have
sat at a premise failure forever, and unlike `hide()` a minimised window keeps
the taskbar button the flash has to land on.

## Windows swallows a toast with no identity

`app.setAppUserModelId` is a precondition, not polish. An unpackaged Electron
app that has not claimed an identity gets **no toast and no error** — the
notification simply does not appear. This app is dev-run-only, so it is exactly
that case. Electron exposes no getter for the value, so `gui-75` checks the
shipped bundle statically and says so in its output rather than implying it
observed the toast.

## What the driver can and cannot say

It proves the app told Windows: one `Notification.prototype.show` with this
outcome's copy and a click listener, one `flashFrame(true)`, a `flashFrame(false)`
on refocus, and zero of everything for a focused turn and for Stop. It cannot
prove a toast was painted — that is Action Center over an app identity, and a
capture of an automated window is not evidence. It says so next to its own PASS,
the same way `gui-69` does about acrylic.

The patch is on `Notification.prototype.show`, not on the `Notification` class:
the built main bundle captures the constructor when it loads, so replacing the
class afterwards can record nothing while the app happily notifies. `show()` is
also the stronger claim — a Notification constructed and never shown is not an
announcement.

## The asymmetry left in on purpose

`announceTurn` guards the notification with `outcome !== 'turn-aborted'` a
second time, because that is what lets `ANNOUNCE_COPY` exclude the silent row by
type (a fourth outcome cannot ship without copy). Measured consequence: deleting
the abort guard from `shouldAnnounce` and re-running `gui-75` gives
`newNotifications: 0, newFlashes: 1` — the flash leaks, the toast does not, and
the driver still reddens. Kept, because the asymmetry fails toward the quieter
half. The table in `shouldAnnounce` remains the one that is unit-tested.

## Verified

- Three vitest mutations, each killing a distinct set: removing the focus guard
  (4 tests), removing the abort guard (2), moving the focus read ahead of the
  terminal-event guard (1).
- Driver red-first with the wiring removed (`0 notifications` on the unfocused
  turn), then red for each absence separately — focus guard removed reddens the
  focused turn only, abort guard removed reddens Stop only. Both silences are
  independently guarded, which a single "everything reddens" mutation would not
  have shown.

## Related

- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — the other thing main
  knows that the renderer needs, and the same out-of-band shape
- [[2026-07-31-a-preference-lives-where-it-is-read]] — why a "notifications off"
  toggle, if ever wanted, is a renderer-stored preference in the Appearance dock
- [[2026-07-31-a-driver-establishes-its-premise]] — why every phase here checks
  that the window really was minimised before believing a zero
