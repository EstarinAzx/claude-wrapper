---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# The attachment encoding lands in #29, not #32

**Decision:** #29 was scoped as a pure prefactor — widen the send channel, send
an empty attachment list everywhere — and its acceptance criteria only demanded
the *empty* case. It shipped **both** branches anyway:

1. **Empty list → the content stays a plain string.** The core path, byte-identical
   to the string-only channel it replaced, pinned by
   `a text-only send keeps plain-string content` in `tests/engine.test.ts`.
2. **Non-empty → the full content-block encoding** spec #26 describes: one text
   block, then one base64 image block per image, with by-path attachments
   appended to the prompt text under an `Attached files:` heading. Tested.

Two consequences downstream:

- **#32 needs the composer and the policy module, not engine work.** The
  transport is done and covered.
- **The embeddable media-type allowlist lives in the transport type**, as
  `EMBEDDABLE_IMAGE_TYPES` in `src/shared/attachment-types.ts` (png/jpeg/gif/webp).
  #32's policy module should import it, not restate it — the spec asks for the
  limits to live in one place, and this is that place for the media-type rule.
  It is also load-bearing for types: `ImageMediaType` is exactly the union the
  API's image block wants, so the block is built with no cast.
- **`normalizeSendPayload` is the trust boundary in main**, replacing the old
  `String(text)` coercion on `chat:send`. It drops a malformed attachment rather
  than throwing, and collapses a non-object payload to text.

**Why:** "Widen the path" includes the last step of the path. Threading a
payload through the renderer and IPC and then dropping its attachments at the
engine would have left a data-loss shape in the code — unreachable today only
because the renderer hard-codes an empty list, which is exactly the kind of
guarantee that stops being true one ticket later. The encoding is ~15 lines and
the spec already fixed its exact form, so there was no design left to defer,
only the risk of #32 rediscovering it. The four-mock-sites landmine did **not**
fire here: #29 added no new `window.api` channel. #34 still trips it.

**Reversibility:** Easy to reverse in principle, pointless in practice — the
non-empty branch is covered by tests, and removing it just makes #32 rewrite it.
The plain-string branch is the one that must never move: the pin was
mutation-verified (forcing the array path red-lights it), so if that test ever
fails the bug is in `src/main/engine.ts` and never in the expectation.

## Related

- [[decisions]]
- [[2026-07-25-attachments-embed-images-paths-for-files]] — the parent spec's transport choice
- [[active-work]]
