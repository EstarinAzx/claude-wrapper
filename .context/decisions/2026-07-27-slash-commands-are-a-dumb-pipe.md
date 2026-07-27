---
type: decision
project: claude-wrapper
date: 2026-07-27
updated: 2026-07-27
tags: [context, decision]
---

# Slash commands are a dumb pipe — the wrapper renders, the CLI resolves

**Decision:** PRD C (#36) adds no notion of "slash command" to the wrapper. A
typed `/command` is sent as ordinary prompt text through the existing send path;
the renderer never parses the leading `/`, never validates the name, and never
holds a list of what is valid. The CLI owns resolution — built-ins, project
commands, plugin commands, dynamically-discovered skills, and aliases. The
wrapper's entire job is to render the results and help the user type the name.

Six decisions fall out of that one and are binding on #37–#40:

1. **Two dropped system families come back.** `engine.ts`'s message handler
   processes only the task lifecycle and discards every other `system` message.
   Local command output and informational banners are in the discarded set — that
   single gap is the whole of the original bug.
2. **One new message role, not two.** Command output becomes a `command` role:
   markdown, **no avatar**, because the avatar would attribute CLI text to Claude.
   Informational banners reuse the existing `notice` role; the SDK's four levels
   collapse to that one treatment and the transcript-mode-only level is dropped
   rather than rendered.
3. **The command list is never cached.** `supportedCommands()` tracks the CLI's
   own `commands_changed` pushes internally, so a re-fetch is always fresh
   (`sdk.d.ts:2904`). No cache, no push channel, no `commands_changed` branch
   anywhere — the dock fetches on open and forgets on close, like the model pill.
4. **The query is built eagerly at folder-pick.** It is currently constructed on
   the first send, so nothing can be asked before a message exists. Warm-up must
   be **inert on failure** — the close path sets `terminalError`, which fails
   every later send, so a tripped warm-up would hand the user a dead composer
   having typed nothing.
5. **Insertion crosses into the composer by prop, not by lifted state** — a
   `{text, nonce}` pending-insert. Lifting the composer's text to `App` would
   re-render the whole message list per keystroke; the nonce is load-bearing
   because clicking the same row twice must fire twice.
6. **Enter interception is conditional and narrow.** Autocomplete intercepts
   Enter *only* while its popover is open with a row highlighted; every other
   state falls through to submit. Backwards, this breaks sending — worse than
   having no autocomplete — so it is the mutation-verified pin of #40.

**Why:** Reimplementing command resolution in the renderer creates a second
source of truth that goes stale the moment a skill is added mid-session. The SDK
ships `commands_changed` *specifically because the list is not static*, so a
client-side validator would have to chase that push just to say "no such command"
slightly sooner than the CLI would.

Real data settled it rather than taste. A census of 80 transcripts in the native
store found `local_command` ×29 and `informational` ×2, and one of the two
informational records reads **`"Unknown command: /mdoel. Did you mean /model?"`**
at `level: "warning"` — the CLI already produces a better typo message than we
would have written, arriving on exactly the path decision 2 routes to `notice`.

Two facts corrected assumptions held at the start of the grill:

- **Custom commands already reach the CLI.** `settingSources` is unset in the
  engine's options, which the SDK documents as loading *all* sources (CLI
  default). Command resolution needed no change; only rendering did.
- **The persisted subtype is not the streamed subtype.** On disk the records are
  `system`/`local_command`; the SDK's streaming type is `local_command_output`.
  The live handler keys on one name, the parser on the other. Neither may be
  assumed to be the other, and the live shape is still **unobserved** — #37 opens
  with a capture before any branch is written, because jsdom reports green
  against a branch keyed on a subtype that never arrives.

One landmine was chased and cleared: `terminal_reason` is an optional field on
`SDKResultSuccess` (`sdk.d.ts:4277`), not a separate message. A local command
that bypasses the model loop still emits `result`/`success`, so the turn ends and
the composer re-arms with no special handling.

Deferred deliberately: replaying command *output* (the persisted subtype carries
two unrelated content shapes and the stdout one was frequently empty — replaying
empty ghosts is worse than replaying nothing) and the multiline composer (its
decisions are orthogonal to autocomplete). The **blob fix is not** deferred: a
slash-command invocation persists as a user message whose plain-string content is
`<command-name>` markup, and `parseTranscript` takes plain strings verbatim, so
every already-existing session that used one renders raw markup today. That is
#38, and it is independent of everything else.

**Reversibility:** High for the render decisions — a role is one branch in
`Chat.tsx` and one in the engine, and the pull-only list can gain a cache later
without changing its contract. Lower for the dumb pipe itself: once the renderer
stays ignorant of commands, every later feature is built assuming the CLI answers
for them, and reversing would mean re-deriving resolution the wrapper
deliberately never learned. Nothing here is expensive to unwind because none of
it has shipped — #36's tickets are unstarted.

## Related

- [[decisions]] · [[active-work]] · [[happy-path]] · [[pick-up]]
- [[2026-07-24-wisp-alias-routes-by-name]] — the `fable` rebind the peer-review
  automation for these tickets depends on
