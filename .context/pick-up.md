---
type: pick-up
project: claude-wrapper
updated: 2026-07-23
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last leg landed:** #6 (Permission allow/deny round-trip) — squash-merged to main as `5206ee1`, ticket closed with breadcrumb.

**Next ticket:** #7 — Stop button + legible failure (only unblocked `ready-for-agent`; #8 Frost Mono polish is blocked by #7).

**Landmines:**
- Engine already keeps the live streaming `Query` (`currentQuery`, `src/main/engine.ts`) — wire Stop through `Query.interrupt()` (streaming-input mode only, already active). Do NOT use `close()` for Stop: `close()` is terminal by design ([[2026-07-23-engine-terminal-on-stream-death]]); Stop must leave the session usable for the next turn.
- `runTurn` rejects overlap ("A turn is already running") and holds one `turnResolve`; an interrupt must still end the active turn cleanly (SDK emits a result after interrupt — verify what subtype and map it to a legible chat state, not a raw error).
- Pending permission during Stop: resolve via `permissionBroker` (abort signal → deny) so `canUseTool` never stays parked.
- Renderer permission state is on the tool message; terminal errors already cancel unresolved cards — reuse that path, don't add a second cancel mechanism.
- All privileged IPC handlers require `isTrustedIpc`; add the interrupt channel behind the same check.
- Real-SDK manual run still pending (see Open questions in `active-work.md`).
- Fresh `npm install` may skip Electron's postinstall: `npm run dev` fails with "Error: Electron uninstall". Fix: `node node_modules/electron/install.js`.
- `vite` stays `^7`, `@vitejs/plugin-react` `^5`, TypeScript pinned exact `7.0.2` — don't bump any of them.
