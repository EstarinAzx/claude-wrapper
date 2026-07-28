---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# Choosing a folder is not changing workspace

**Decision:** #48 added `session:choose-folder`, an IPC handler that opens the
directory dialog and **mutates nothing** — returning `{status:'cancelled'}` or
`{status:'selected', cwd}`. The sidebar's new "Open project" affordance calls it,
and only the `selected` branch runs `switchWorkspace` with `resumeId: null`. The
existing `session:pick-folder` was deliberately **not** reused.

**Why a second chooser instead of the one that already works.**
`session:pick-folder` chooses *and* performs the whole engine transition — close,
`cancelAll`, `setSessionCwd`, rebuild, clear resume, `warmUp` — while touching no
renderer state. It is a picker fused to a mutator. Calling it from the sidebar
would land a new cwd in main and leave the pane, the transcript, the docks and
the composer showing the old project: the exact stale-state bug #46's transaction
was built to prevent, reintroduced by the one ticket that finally exposes the
picker. The ticket names this as its sharpest failure mode, and it is sharp
precisely because *it works*: the cwd really does change.

**A chooser that mutates nothing is what makes a cancel free.** With the two
concerns split, the cancel branch has no mutation available to it — not because
the renderer remembers to skip one, but because the handler contains none. The
same property makes an untrusted or window-less call inert by construction, the
same way a malformed `switch-workspace` payload collapses to a rejection.

**No UI assertion can tell the two paths apart.** Both end with a new cwd in main
and a re-rendered sidebar. So the pin is on the call —
`expect(pickFolder).not.toHaveBeenCalled()` — not on any resulting DOM. This is
the house pattern: assert the mechanism, never a symptom with more than one
cause.

**Two widenings, not two functions.** `App.switchWorkspace` took `(id: string,
cwd)` and now takes `(id: string | null, cwd)`; `useChat.adoptSession` likewise
accepts `null`, meaning *adopt no session* — an empty pane with **no engine
call**. Both mirror `SwitchRequest.resumeId: string | null` exactly, so the row
path and the picker path run one reset. A second reset would drift from the first
the moment anything workspace-scoped joins App state, and that drift is invisible
until someone opens a folder and finds one stale panel.

**`newChat()` is the wrong way to clear the pane here** — the second instance of
the landmine [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]]
recorded for `openSession`. It sends `targetSession(null)`, and `chat:target`
closes and nulls the engine the transaction has just rebuilt and warmed; it is
also gated on the renderer's own `busy`, a second opinion that would silently
skip a reset main already answered `ok` to. An empty pane looks identical either
way, so this too is pinned on the call.

**The affordance is not busy-gated,** unlike the "New chat" button beside it.
`Engine.isBusy()` is the single source; disabling here would be a second busy
source *and* would make the `busy` refusal unreachable from the UI — the same
reasoning that keeps a foreign session row live mid-turn.

**Cost accepted:** two handlers now open the same dialog, and `pick-folder`
survives for `Welcome`'s first pick. Folding that last caller onto the chooser
would delete the mutating handler outright; it was left out of scope rather than
smuggled in, and is the obvious next cleanup.

**Reversibility:** High for the affordance, low for the split. Re-fusing choosing
to mutating is exactly the regression, and it will pass every test that looks at
the screen.

**Mutation-verified.** Eight mutations, each killing its target: route the picker
through `pickFolder` (9), drop `<InputBar key={cwd}>` (2), `newChat()` instead of
`adoptSession(null)` (1), load a transcript for a null id (2), reset regardless of
status (2), switch even on cancel (1), disable the affordance while busy (1),
drop `setPendingInsert(null)` (1). Driven live by `gui-48.mjs` into a real
`mkdtemp` folder: 0 of 100 rail rows local, dialog opened exactly once per click.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-28-the-workspace-switch-is-one-transaction-over-ports]] — supplies the
  transaction this chooser feeds, and the first-class `resumeId: null` case that
  makes an empty folder openable at all
- [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] — the reset this
  path reuses, and the `adoptSession` / `targetSession` landmine it hits again
