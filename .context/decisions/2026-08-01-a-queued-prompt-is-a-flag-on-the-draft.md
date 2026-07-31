---
type: decision
project: claude-wrapper
updated: 2026-08-01
tags: [context, decisions, renderer, composer]
---

# A queued prompt is a flag on the draft, and the flush condition is positive

**Decision (#80, `1855910`):** The composer stays live while a turn streams —
textarea, paperclip and paste — and Enter during a turn **commits the draft**
instead of dropping it. The commitment is a **boolean flag on the existing
draft**, not a copy of the text, and it lives in `InputBar`. The flush condition
is stated **positively** as `turn-end` **with a live engine**, decided by a pure
twelve-row table in `src/shared/queued-send.ts` (`decideQueue` → `flush` |
`unqueue` | `none`). Every non-flush row **unqueues**: it releases the commitment
and leaves the text in the composer. `useChat` grows `lastTurn`
(`{ outcome, nonce }`) recording how a turn ended; `Engine.isBusy()` remains the
app's only reading of whether one is running, and `useChat.send`'s busy guard is
untouched — the queue sits above it.

**Why the flag rather than a stored payload.** One choice answers four of the
ticket's four open questions at once. Cardinality is **one by construction**
rather than by a cap. "Replace or append" **dissolves** — what fires is whatever
is in the box when the turn ends, so a queued prompt is WYSIWYG and editing it is
just typing. Cancelling **costs nothing**, because the text never went anywhere.
And a workspace switch resets it **for free**: `<InputBar key={cwd}>` is already
the whole composer reset, so the queue rides along with the draft and the tray. A
payload held in `App`/`useChat` would have had to join the `ok` branch of
`switchWorkspace` by hand — the `pendingInsert` bug class verbatim, whose failure
mode is a queued prompt firing into the *next* project.

**Why the condition is positive.** All three terminal outcomes (`turn-end`,
`error`, `turn-aborted`) clear `busy`. A "flush once no longer busy"
implementation therefore resends the moment the user presses **Stop** — spending
a prompt on a turn they just killed — and can throw the prompt at an engine that
has gone terminal (#73), where it buys an error bubble and loses the text.
Exactly **one** of the twelve outcome × queue × engine combinations sends.

**Why unqueue keeps the text.** It makes every non-flush row lossless, which is
what lets **Stop remain the button under the user's cursor** while a prompt is
queued. That matters because the ticket's sharpest UI problem is that the send
button *becomes* Stop while busy, so a user reaching for a button gets the
destructive one. With an unqueue that keeps the draft, that misfire costs the
running turn — which Stop always cost — and not the paragraph they just typed.

**Why this does not compete with the Stop escape hatch.**
[[2026-07-23-busy-switch-block-not-detach]] records Stop as the app's answer to
"the user wants to act mid-turn". It still is, and the two now compose rather
than duplicate: Stop **discards the running answer** to make room for the next
prompt, whereas queueing **keeps both**. With a prompt queued, Stop ends the turn
*and* releases the commitment, in one press, without eating the draft.

**Why the attachment tray went live too.** Attachments travel with a queued
prompt, and they only can if the tray accepts them while busy. A composer that
took words but refused images would queue a prompt with half of it missing. The
attachment policy still runs at admit time and the IPC boundary still re-checks
at send, so nothing about the trust boundary moved.

**Evidence.** The table is pinned row by row and asserted positively
(`toBe('unqueue')`, never `not.toBe('flush')`), which is what makes the two
negatives mutation-visible rather than absence-shaped — this repo's ledger
records absence assertions as the ones most likely to pass vacuously. Verified by
mutation in five directions: flushing on any outcome reddens the Stop and error
rows; ignoring `engineDead` reddens the terminal row; dropping the empty-queue
guard reddens seven; the wiring mutation reddens the three no-send cases; and a
commitment left standing after its own flush reddens the exactly-once pair. That
last mutation **found a hole in the test rather than in the code** — a bare
send-count stayed green because the flush had emptied the composer, so the real
defect is spending the *next* draft without the user committing it.

`gui-80.mjs` counts the side effect itself, with a **second
`ipcMain.on('chat:send')` listener added in main** beside the real one: in jsdom a
double flush is swallowed by `useChat.send`'s busy guard and leaves no trace, so
one send and two are indistinguishable from the DOM. It drives both halves
against a real CLI — a prompt queued behind a finished turn sends exactly once,
and a prompt queued behind a **stopped** turn does not send at all while its text
stays in the composer — and it was red-verified: with the flush condition
weakened it reports three sends, the stopped prompt gone to the CLI, and the
composer emptied.

**Reversibility:** Easy, and the seam is small. The table is a pure module with
one caller; the flag is one `useState` in `InputBar`; `lastTurn` is additive on
`useChat`. To go back to a dead composer, restore `disabled={busy}` on the
textarea plus the two `if (busy) return` guards and delete the effect. To grow a
real multi-prompt queue (explicitly Out of Scope), the flag becomes a list and
the "what fires is what is in the box" property is what you give up — that is a
rewrite of the design's central idea, not an extension of it.

## Related

- [[decisions]] — index
- [[2026-07-23-busy-switch-block-not-detach]] — the mechanism this answers rather than competes with
- [[2026-07-31-a-terminal-death-is-a-signal-not-an-event]] — #73, the terminal engine the flush must never spend a prompt on
- [[2026-07-28-a-workspace-reset-is-a-remount-not-a-state-sweep]] — why the queue lives in `InputBar`
- [[2026-07-31-an-unwatched-turn-end-is-mains-to-announce]] — #75, the other pure terminal-outcome table this one is modelled on
- [[active-work]] · [[overview]]
