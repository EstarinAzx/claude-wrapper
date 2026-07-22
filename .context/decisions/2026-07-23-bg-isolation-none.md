---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decision]
---

# Background-session worktree isolation disabled

**Decision:** `.claude/settings.json` sets `worktree.bgIsolation: "none"` so background relay legs edit the shared checkout directly.

**Why:** The relay chain is serial by construction (N=1, leg-fenced) and its landing flow needs the shared checkout: ticket branch off main, squash-merge back, `.context/` handoff commits on main. Worktree isolation blocks every file edit in a background session and cannot check out main while the primary copy holds it, so each leg would need shell-level workarounds anyway. Guard's own error message documents this opt-out.

**Reversibility:** Trivial — delete the key from `.claude/settings.json`. Revisit if parallel background jobs ever run against this repo.

## Related

- [[decisions]]
