---
type: decision
project: claude-wrapper
date: 2026-08-06
ticket: 129
commit: e164d6c
tags: [context, decision, rewind, checkpointing, probe-discipline]
---

# The id is minted where the bubble is, and the CLI's store is keyed by directory

## The decision

A file rewind addresses a **user message**, so something has to choose that
message's id. #129 mints it in the **renderer**, at the moment the bubble is
created, and carries it out on `SendPayload.uuid`.

The alternative — engine or main mints it — is the one that looks tidier and is
worse. `useChat.send` appends the user bubble *before* `sendPrompt`, so an id
chosen downstream has to be routed back and matched to a message already on
screen. That is a new event, a new correlation, and a new way to address the
wrong row. Nothing is bought with it: the renderer is the caller of the rewind
too, and the CLI refuses an id it has no checkpoint for either way (it
**throws** — see below).

What the id crossing IPC does buy is a trust boundary, and it is taken rather
than waved through. `normalizeSendPayload` **drops** a malformed uuid instead of
coercing it, which is #69's compare-never-coerce rule again — and it is also
what narrows a plain `string` to the SDK's template-literal `UUID` type
**without a cast**. That is the deciding argument for the guard existing at all:
`as MessageUuid` at two call sites would type the value as checked while nothing
had checked it.

`enableFileCheckpointing: true` is stated **unconditionally** in the query
options rather than injected as a getter beside `getModelOptions` /
`getEffortOptions`. It binds at query construction like those do, but there is no
pick to follow — the app always wants checkpoints — and a getter would imply a
control that could turn it off mid-conversation and appear to work.

## What the measurement changed about the shape

`scripts/spike-129-rewind-resume.mjs`, 2 turns. #127 had proved the **raw wire
route** on a **fresh** query; this app is neither.

- **The DECLARED method works.** `q.rewindFiles(id, {dryRun})` (sdk.d.ts:2488),
  called from this app's exact option shape, returned the file to its pre-turn
  contents. A declared type is not a callable route (#115), so this was probed by
  calling — and because it holds, the build uses the typed method rather than the
  dispatcher underneath it.
- **Rewind survives a RESUME.** The SDK's source carries a caveat for the
  store-backed case and nothing had exercised one. It is not an edge case here:
  reopening a session is how this app continues a conversation.
- **A rebuilt query recognises the PREVIOUS query's message id.** This question
  was not in the ticket and nobody had noticed it. Main discards the engine on a
  model pick, a permission cycle and a backend flip, while the pane keeps its
  messages — so a control attached to a message routinely outlives the query that
  sent it. A "no" would have forced the control to withdraw itself on every
  rebuild. It cost no turn: it rides the resumed handle, and its discrimination
  is #127's three-way comparison applied to **uuids** instead of subtypes (the
  prior id answered differently from an unknown one on the same handle).

**The runtime cost of checkpointing is recorded UNSCORED**, with the arm timings
present and a verdict saying they do not answer it. Turn wall time is dominated
by model latency; separating a file snapshot from that needs a fixed local
workload with no model in the loop. Shipping it off was never an option — the
alternative is a control that cannot work — so the honest record is the number's
absence, not a number nobody could defend.

## The landmine this leg paid again

**The spike's first run was wrong, and only half of it said so.**

Phase B minted a fresh temp directory to resume into. **The CLI's session store
is keyed by PROJECT DIRECTORY**, so the resume died with `No conversation found
with session ID` — the id was perfect and the lookup was in the wrong place.

Phase B scored `UNSCORED` correctly: its positive control (did the turn change
the file?) caught it. **Phase C had no such gate**, read the same dead handle,
and answered a confident **"NO — a rewind control must be WITHDRAWN when the
engine is rebuilt."** Believed, that would have shipped a control that
disappeared on every model pick, for a reason that was never true.

So: *an instrument that fails its own setup reports it as the phenomenon* —
sixth time on this record — and the specific correction is that **a gate on one
phase does not protect the phase that reuses its handle**. Phase C is now
explicitly gated on phase B having scored, and the guard's own text says why it
exists.

The transferable pair:

- **A resume needs the workspace as much as the id.** Any harness resuming a
  session must run in the directory the session belongs to.
- **Every phase that consumes another phase's handle needs that phase's verdict
  as a precondition**, not just its return value.

## What the app does NOT claim

**Rewind restores FILES.** The route's name, its response shape and every
measurement behind it are about the disk. The control never says "undo", and a
test asserts that vocabulary rather than a comment promising it — a user reading
it as "take back what I said" would be wrong about both halves at once. It does
not reopen #123's refill decision: the pane is still a projection of the CLI's
own transcript.

**Refusals never reject.** The ordinary refusal is a **THROW** — an id with no
checkpoint answers `No file checkpoint found for this message.` by rejecting —
while checkpointing-off answers `canRewind: false` in the body. Two mechanisms,
one user-visible fact, folded into one `RewindResult` that carries the CLI's own
text unrewritten. It is called from an `ipcMain.handle`, where an escaping
rejection becomes a modal error dialog over the app.

**Replayed messages carry no control.** Not caution about the route — the
measurements say it would work — but their uuid is not in hand in the renderer.
Filed for the owner rather than built, because extending it is a feature choice.

## Verification

31 tests, **eight mutations, eight distinct correctly-attributed reds**, and the
unmutated control green. One mutation first reported `ANCHOR NOT FOUND` because
a multi-line anchor missed this repo's CRLF; it was **re-run rather than counted
as caught** — an unapplied mutation is indistinguishable from a passing test.

`.claude/skills/run-desktop/gui-129.mjs` is the only evidence for the ticket's
first acceptance criterion, and it costs one CLI turn by necessity: gui-123's
zero-turn trick (removing main's `chat:send` listener) would leave the CLI with
no checkpoint, and the correct refusal would read as a product failure. On
`file://` it confirms the turn changed the file, the control reads **opacity 0
at rest and 1 under a settled hover** off the built stylesheet against a
discrimination control, the **dry run left the file mutated**, the second
gesture put it back, and the conversation was untouched. Red-verified by
removing the checkpointing option and rebuilding — it fails cleanly, leaks no
Electron process, and surfaces `File rewinding is not enabled.`, which is
**acceptance criterion 3 measured end to end for free**.

## Related

- [[2026-08-06-the-address-is-carried-and-ignored-and-the-rewind-was-one-flag-away]] — #127, which filed this
- [[2026-08-05-the-pane-is-a-projection-so-the-edit-is-a-refill]] — #123, which this does not reopen
- [[pick-up]] · [[active-work]] · [[overview]]
