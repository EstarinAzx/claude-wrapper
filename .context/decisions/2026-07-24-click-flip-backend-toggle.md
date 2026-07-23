---
type: decision
project: claude-wrapper
updated: 2026-07-24
tags: [context, decisions, backend, ipc, renderer]
---

# Click-to-flip backend toggle: reuse the switch teardown + broadcast, fresh chat

**Decision (#19, closes spec #16):** Clicking the titlebar pill flips the
backend. The pill (already a read-only indicator from #18) becomes a `<button>`;
the renderer computes the opposite mode and sends it over a **new guarded
one-way channel `backend:set-mode`**. The main handler validates the enum,
**refuses `wisped` when the launch env carried no wisp routing** (native-lock),
sets the mode via `setBackendMode`, then runs the **exact `chat:target`
teardown** — `engine?.close()` + `permissionBroker.cancelAll()` + `engine =
null` — and additionally sets `pendingResume = null` so the flip lands in a
**fresh chat**, not a resume. It then **broadcasts** the resolved
`{mode, wispedAvailable}` on `backend:changed`; `App` subscribes on mount (next
to the one-shot `backendMode()` read) and updates the pill from the broadcast.
The renderer flip handler also calls the existing `newChat()` to clear the pane
locally. The lazy `chat:send` (`if (!engine) engine = makeEngine()`) rebuilds the
engine on the next turn, so `getSpawnEnv` resolves the **new** mode's env with no
extra plumbing. The pill is `disabled` while `busy` (reuses #14's mid-stream
block) and when wisped is unavailable.

**Why:** The flip's teardown requirement is *identical* to a session switch —
kill the live engine, cancel pending permissions, drop the query so the next
turn rebuilds. Reusing `chat:target`'s exact sequence (plus a `pendingResume`
clear) means no new teardown path to keep correct, and it inherits the
[[2026-07-23-resume-via-target-close-rebuild]] rebuild-on-next-turn guarantee for
free. Making the pill authoritative from a **broadcast** (not the click's local
optimism) is what makes the native-lock no-op correct: a rejected flip simply
never broadcasts, so the pill stays put. Mode stays in-memory only, consistent
with [[2026-07-23-permission-inherits-host]] and the launch-env intent model from
#17 — a flip is a session-scoped override, not persisted state.

**Reversibility:** Small seam. The write channel is one `ipcMain.on` + two
preload methods; the pill's interactivity is gated by `canFlip = wispedAvailable
&& !busy && !!onFlip`, so dropping the toggle back to read-only is deleting
`onFlip`/`busy` props. If a flip should ever *preserve* the conversation (resume
into the other backend rather than start fresh), drop the `pendingResume = null`
line — but that reopens the retarget-on-live-engine ceiling
([[2026-07-23-resume-via-target-close-rebuild]]), which is why fresh-chat is the
default.

## Related

- [[decisions]] — index
- [[2026-07-23-resume-via-target-close-rebuild]] — the teardown this flip reuses
- [[2026-07-23-busy-switch-block-not-detach]] — the #14 busy-block the pill reuses
- [[2026-07-23-permission-inherits-host]] — in-memory, no-persistence precedent
- Spec #16 + tickets #17 (env resolver) → #18 (read-only pill) → #19 (this)
