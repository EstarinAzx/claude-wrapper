---
type: decision
project: claude-wrapper
updated: 2026-07-23
tags: [context, decision]
---

# Wrapper inherits the host's Claude Code permission settings (by design)

> **SUPERSEDED 2026-07-24 by [[2026-07-24-in-app-permission-mode-toggle]].** The
> owner asked for a first-class in-app permission-mode toggle (default
> `bypassPermissions`); the engine now pins `permissionMode` into query options.
> The "do not fix this" below no longer applies — that reversal is now the
> chosen path. Kept for history.

**Decision:** The engine (`src/main/engine.ts`) passes only `{ cwd, includePartialMessages, canUseTool }` to the SDK `query()` — no `permissionMode`, no `settingSources` restriction. So the wrapped agent inherits the host machine's Claude Code config: `settings.json` permission mode, allow-rules, CLAUDE.md, hooks, skills. This is **intended**, not a defect.

**Why:** It is a wrapper — Claude Code runs underneath. It should behave like the user's Claude Code, permissions and all. During the 2026-07-23 real-SDK manual run, no Allow/Deny card ever fired (even for Bash) because the host `~/.claude/settings.json` sets `"defaultMode": "bypassPermissions"` (+ `skipDangerousModePermissionPrompt`, `skipAutoPermissionPrompt`); the SDK therefore skips `canUseTool` entirely. The app's permission card + `permission-request` event + Allow/Deny renderer (all still present and test-pinned) fire only when the *host* policy would prompt. Same mechanism explains the caveman/CLAUDE.md tone bleeding into the wrapped agent's replies.

**Do not "fix" this** by pinning `permissionMode`/`settingSources` to isolate the wrapper — that was floated during the run and explicitly rejected by the owner.

**Reversibility:** If a clean-room agent is ever wanted (own permission UX, ignore host config), set `settingSources: []` and an explicit `permissionMode` in `ensureQuery`. Not planned.

## Related

- [[decisions]]
- [[2026-07-22-cli-login-auth]]
