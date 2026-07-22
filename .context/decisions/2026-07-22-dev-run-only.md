---
type: decision
project: claude-wrapper
updated: 2026-07-22
tags: [context, decisions, distribution]
---

# Dev-run only, no packaging

**Decision:** App launches via `npm run dev`. No installer, no code signing, no auto-update. electron-builder can bolt on later.
**Why:** Personal tool on one machine; packaging is pure overhead now.
**Reversibility:** easy

## Related

- [[decisions]] — index
