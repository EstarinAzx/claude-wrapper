---
type: decision
project: claude-wrapper
date: 2026-07-25
updated: 2026-07-25
tags: [context, decision]
---

# Attachments: images embed, files go by path, replay shows chips

**Decision:** Spec #26 sends pasted/picked **images** as base64 image content
blocks in the user message, and **everything else by absolute path** in the
prompt text for the agent to open with its own tools. `SDKUserMessage.message`
is an Anthropic `MessageParam`, so image and document blocks are legal — the
choice is deliberate, not a limitation. When there are **no** attachments the
content stays a plain string, byte-identical to today, pinned by a test at the
engine seam. Caps (≈5 MB per image, ≈10 per message, image media-type
allowlist) live in one pure policy module and are enforced renderer-side before
IPC. On replay the transcript parser emits attachment **markers** (kind, media
type, filename) and explicitly drops `source.data`, so resumed sessions show
chips while live messages show real thumbnails.

**Why:** The agent has Read/Grep and would open a file anyway; embedding a large
PDF spends context on a turn that may need one line of it. Images are the
opposite case — a tool round-trip plus a permission prompt before the model can
see a pasted screenshot is a bad feel for the most common use. The
chips-on-replay call is measured, not assumed: a single persisted screenshot in
the local transcript store was **263 KB** of base64, so forwarding payloads
would push megabytes over IPC on every session open and hold them in renderer
memory. The parser's existing text-only filter was already a silent data-loss
path — an attachment would have vanished on replay with no marker at all.

No capability gating by routed model: `wisp models <provider>` exposes ids
without capability data, so there is nothing to gate on; an image to a text-only
target fails at the API and surfaces through the engine's legible-error mapping.

**Reversibility:** Thumbnails-on-replay is a one-field change to the parser
marker if the size cost ever proves acceptable — re-measure first. The caps are
constants in one module. The transport split is the expensive one to reverse:
by-path files shape how prompts read to the agent, and moving to full embedding
later would change every attachment's contract.

## Related

- [[decisions]]
- [[happy-path]] — the PRD B flow
- [[active-work]]
