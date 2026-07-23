---
type: decision
project: claude-wrapper
updated: 2026-07-24
tags: [context, decisions, permissions, ipc, renderer, security]
---

# In-app permission-mode toggle, default bypassPermissions (reverses inherit-host)

**Decision (owner-requested, 2026-07-24):** The wrapper now pins
`permissionMode` into the SDK query options via an **in-app toggle**, instead of
silently inheriting the host's mode. A second titlebar pill cycles
**Bypass → Accept Edits → Ask → Bypass**; the renderer sends the target over a
guarded one-way `permission:set-mode`. The main store (`src/main/permission-mode.ts`)
holds the mode in memory (no persistence) and maps it to options via the pure
`toPermissionOptions` — `bypassPermissions` additionally emits
`allowDangerouslySkipPermissions: true` (SDK requires it). The engine gains a
fifth injected getter `getPermissionOptions` (mirrors `getEnv`) spread into the
query options; `canUseTool` stays wired, so the Allow/Deny card still fires
whenever the *mode* asks (Accept Edits for non-edits, Ask for everything).
**Default is `bypassPermissions`** per the owner — the app auto-runs every tool
with no confirmation until a stricter mode is picked.

**Why this reverses [[2026-07-23-permission-inherits-host]]:** that decision left
`permissionMode`/`settingSources` unset so the wrapper mirrored host settings.
In practice the SDK's programmatic `query()` did not surface the host
`bypassPermissions` reliably, so the user hit Allow/Deny cards with no in-app way
to change them. The owner explicitly asked to make the mode a first-class in-app
choice (and default it to bypass), which is exactly the "clean-room / own
permission UX" reversal that the old doc named as the escape hatch. The old
decision's "do not fix this" no longer holds — it is superseded here.

**Conversation is preserved on change (unlike a backend flip).** `permissionMode`
binds at query construction, so changing it must rebuild the engine
(`close()` + null). But the write handler first captures `engine.sessionId()`
into `pendingResume`, so the next turn **resumes the same session** with the new
mode — the chat is *not* reset. A backend flip clears resume (fresh chat) because
the backend changes context; a permission change does not, so it keeps going. The
pill is disabled while `busy` (reuses the #14 block), so a change never lands
mid-stream.

**Security posture:** default bypass means the wrapped agent executes every tool
call — Bash (writes, deletes, network), file edits — with zero confirmation for
the whole session. This is the owner's deliberate choice for their own machine.
The Bypass pill carries a **danger tint** (error hue) so the live-fire mode is
never ambiguous; Accept Edits / Ask are neutral. There is no per-tool allowlist
layer in the app — mode is all-or-by-category.

**Reversibility:** To restore host-inherit, stop injecting `getPermissionOptions`
in `makeEngine` (engine default is empty → SDK default) and optionally add
`settingSources: ['user','project','local']` so host `settings.json` loads. To
change the default, edit the initial value in `permission-mode.ts`. To expose
more modes (`plan`/`dontAsk`/`auto`), widen the `PermissionMode` union + the
validate list in the `permission:set-mode` handler + `PERM_LABEL`/`PERM_NEXT`.

## Related

- [[decisions]] — index
- [[2026-07-23-permission-inherits-host]] — **superseded** by this
- [[2026-07-24-click-flip-backend-toggle]] — the pill/IPC/broadcast pattern reused here
- [[2026-07-23-resume-via-target-close-rebuild]] — the resume-on-rebuild the change relies on
- [[2026-07-23-busy-switch-block-not-detach]] — the #14 busy-block the pill reuses
