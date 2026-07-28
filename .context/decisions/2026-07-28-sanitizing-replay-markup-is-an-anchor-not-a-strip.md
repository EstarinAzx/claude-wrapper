---
type: decision
project: claude-wrapper
date: 2026-07-28
updated: 2026-07-28
tags: [context, decision]
---

# Sanitizing replay markup is an anchor, not a strip

**Decision:** #50 replaces `unwrapCommandInvocation` with `sanitizeUserText` in
`src/main/transcript.ts` — one classifier that dispatches on the **leading tag of
the trimmed message** and returns either the text to display or `null` to drop
the message entirely.

| Leading tag | Replay shows |
|---|---|
| `<command-message>` / `<command-name>` | `/name args` — both persisted orders |
| `<bash-input>` | `! command` |
| `<local-command-stdout>` | body, ANSI stripped |
| `<bash-stdout>` | stdout + stderr, empty half omitted |
| `<local-command-caveat>` · `<task-notification>` · `<system-reminder>` | dropped |

**Why an anchor and not a strip.** The obvious implementation — regex the tags
out wherever they appear — is wrong, and the store proves it. Measured on
2026-07-28 across 923 transcript files and 3359 plain-string user messages, every
markup kind occupies a **whole message**: nothing follows a `<command-name>`
block in **442 of 442**, and a caveat is alone in **419 of 419**. Meanwhile real
sessions contain pasted terminal logs, adversarial-review prompts and quoted
diagnoses that *mention* the markup as prose. Those are genuine user content. A
mid-string strip eats them; the leading-tag anchor cannot. This is the same
discipline as #38's original `startsWith` guard, generalized rather than relaxed.

**Why the scope is eight tags and not the three that were reported.**
`<command-name>`-first (442) is not an edge case — it is *more* common than the
one shape the parser already handled (312), and `<task-notification>` (100),
`<system-reminder>` (28) and the `<bash-*>` pair (12) are the same defect reached
by the same table. Fixing three of eight would have booked a second ticket for
nothing. Total raw markup before: **1258 of 3359 messages, 37%**.

**Why output is stripped of ANSI but typed text is not.** `<local-command-stdout>`
and `<bash-stdout>` are terminal streams and carry escapes (186 messages did).
Command arguments and `<bash-input>` are things a human typed. The fixture that
enforces the split is real: a recorded argument is `fable[1m]`, whose brackets are
**literal text**, not an escape — an indiscriminate strip corrupts it. The pattern
matches general CSI rather than the SGR (`…m`) forms the store happens to contain.

**Why `CSI` is built with `String.fromCharCode(27)`.** Neither a literal ESC byte
nor a `\u` escape survives contact with tooling reliably: the raw character is
invisible in an editor and a stray copy-paste deletes it without a trace, and the
escape was repeatedly normalized *into* the raw byte in transit while this was
being written. The source file now contains zero raw ESC bytes, in production and
in tests, and that is checkable.

**Why dropping is safe.** `TranscriptMessage` is `user | assistant | tool` — there
is no meta role, so each kind either drops or stays user text. Adding a role would
touch the shared types, the renderer and all four `window.api` mock sites for
messages nobody typed. A message that sanitizes to empty is dropped rather than
rendered as a blank bubble.

**Verification.** Every fixture is copied off disk, never invented. Nine mutations
were run and each was killed by its own test — notably `startsWith` → `includes`,
which is killed **only** by the pasted-log pin, making that pin the mechanism
assertion for the anchor. Sweeping the real store through the real parser
afterwards: of **2972** user messages reaching replay, **7** still contain the
markup, all of them prose quoting it, **0** leading with a tag, and **0** carrying
ANSI. Suite 560 → 575 across 45 files.

**A harness trap worth carrying.** The mutation runner first reported four
survivors. The cause was not the code: its anchors used `\n` against **CRLF**
source and matched nothing. A bad anchor and an uncaught mutation are
indistinguishable in the output — always assert the anchor matched exactly once
before believing a survivor.

**Reversibility:** High. `sanitizeUserText` is one pure function at one call site;
reverting restores the old single-shape unwrap. The measured shape census is the
expensive half and stays valid even if the mechanism changes.

## Related

- [[decisions]] · [[active-work]] · [[pick-up]]
- [[2026-07-28-lazy-enrichment-is-a-mount-not-a-scan]] — #49 measured the same two
  invocation shapes on the *title* path; this is that finding applied to replay
- [[2026-07-28-session-metadata-is-the-sdks-job]] — #43 removed raw markup from
  titles by moving to the SDK's `summary`; replay was always the other half
- [[2026-07-27-slash-commands-are-a-dumb-pipe]] — the wrapper never learns what a
  slash command is, which is why this markup reaches it at all
