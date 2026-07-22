---
type: decision
project: claude-wrapper
updated: 2026-07-22
tags: [context, decisions, stack]
---

# Renderer stack: React + Vite + TypeScript 7.0.2

**Decision:** electron-vite scaffold, React renderer, TypeScript 7.0.2 (the native compiler — npm `latest` as of 2026-07-22, user requested latest). Rejected: vanilla TS, Svelte.
**Why:** Best ecosystem for streaming markdown (react-markdown), code highlighting, chat state. TS 7 explicitly requested.
**Reversibility:** easy

## Related

- [[decisions]] — index
- [[stack]]
