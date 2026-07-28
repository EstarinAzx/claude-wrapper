---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# A workspace reset is a remount, not a state sweep — and the renderer never re-decides busy

**Decision:** #47 wired the renderer to #46's transaction over a new
`session:switch-workspace` channel. Selecting a session from another project
sends `{cwd, resumeId}` and, **only on `ok`**, drops every piece of
workspace-shaped renderer state in one commit. The composer is **keyed on
`cwd`**, so the switch remounts it rather than clearing it field by field.

**Why a remount and not a sweep.** The ticket's criterion 3 named the trap:
"reset all renderer state" is not satisfied by resetting App-level state alone.
Three things live inside `InputBar` and nowhere else — the draft, the attachment
tray, and the autocomplete popover (its fetched list plus its dismissed flag).
Lifting them into App to clear them would put composer state above the message
list and re-render the transcript on every keystroke; adding an imperative reset
handle would be three more things to remember at every future call site.
`key={cwd}` is one line and is exhaustive by construction: anything a future
ticket adds to the composer is workspace-scoped for free.

**What App still clears explicitly,** because it is genuinely App state: `cwd`,
`useChat` (messages + `activeSessionId` + live agents), `openDock`,
`pendingInsert`, `openSubagent`. `pendingInsert` is the subtle one and must be
cleared **in the same commit as the cwd change**: `InputBar` applies a pending
insert *on mount*, so a surviving one refills the new project's composer with the
old project's slash command. Mutation-verified — that is the leak a "the composer
is empty" assertion alone would not catch, since a stale insert produces text
where a plain leak produces the old draft.

**`adoptSession` vs `openSession`.** `useChat` gained `adoptSession(id)`: replay a
transcript and make it active, with **no** `targetSession` call. `openSession` is
now `adoptSession` + `targetSession`. The distinction is load-bearing, not
cosmetic: the transaction has already run close → rebuild → setResume → warmUp,
and `chat:target` closes the engine and nulls it — so calling the in-project
resume path on top of a switch tears down the engine that was just built and
undoes the warm-up. A pin asserts `targetSession` is never called on the switch
path.

**A foreign row is not gated on the renderer's `busy` flag** (local rows still
are, per [[2026-07-23-busy-switch-block-not-detach]]). Two reasons, and the
second is the one that decides it:

- `Engine.isBusy()` is the single source of truth and the transaction already
  consults it. A `disabled={busy}` in the rail is a second opinion that can
  disagree with the engine actually running.
- Disabling the row makes the `busy` **refusal unreachable from the UI**. The
  ticket requires that refusal to be surfaced; a control that can never produce
  it turns criterion 5 into dead code.

So a mid-turn click on a foreign row is answered by main and the pane says why.

**Refusals are one inline `role="status"` line above the composer** — not a
toast, not a modal, not a new dependency, and deliberately **not a chat
message**. A rejection changed nothing, and writing it into the transcript would
make the transcript claim otherwise. The three refusals are phrased distinctly
(a generic "could not switch" would hide the busy case, which is the only one the
user can act on). Backend mode, permission mode and model are global
preferences, not workspace state, and survive untouched — asserted both by the
pills and by their setters never being called.

**Reversibility:** Low for the seam, moderate for the copy. Un-keying the
composer silently re-opens the exact leak this ticket exists to close; the four
tests that die are the only thing standing between a switch and a stale draft
from another project. Re-disabling foreign rows reverts #45's block and takes the
busy refusal with it.

**Mutation-verified.** Ten mutations, each killing exactly its target: drop
`key={cwd}` (4), apply the reset regardless of status (7), drop `setCwd` (5),
re-disable foreign rows (17), route foreign rows to `onOpen` (15),
`adoptSession` → `openSession` (1), drop `setPendingInsert(null)` (2), drop
`setOpenDock(null)` (1), drop `setOpenSubagent(null)` (1), drop `setRefusal(null)`
(1). Live GUI drive `gui-47.mjs` (committed) passes every criterion against the
real store, including a real cross-project switch and a real `missing-cwd`
refusal; `busy` is logged as SKIPPED there rather than passing silently, since
driving it needs a real streaming turn.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] — the
  transaction this consumes; its `Engine.isBusy()` is why the renderer refuses to
  re-derive busy
- [[2026-07-28-the-session-list-is-global-scoping-is-a-render-concern]] — rendered
  the foreign rows inert; this is the ticket that reverses that by name
- [[2026-07-23-busy-switch-block-not-detach]] — block, not detach; the refusal is
  what "block" looks like once the row is live
- [[2026-07-28-composer-height-is-css-not-state]] — the other composer state that
  a remount resets for free, since height was never in React
