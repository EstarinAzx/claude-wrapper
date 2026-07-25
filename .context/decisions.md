---
type: decisions-index
project: claude-wrapper
updated: 2026-07-25
tags: [context, decisions]
---

# Decisions

Settled questions. One file per decision in `decisions/`. Newest first.

<!-- one line per entry, newest at top -->
- [[2026-07-25-agent-tree-edge-is-the-sidecar]] — #31 nests from the sidecar's `parentAgentId` alone and declines the live `taskToParent` / `Agent`-block edge (accepted lag: a nested agent reads top-level until its sidecar lands); the pure `agent-layout` module is what #33's map must reuse, `spawnDepth` is not tree depth, the DOM stays flat-with-a-depth, and an orphan or a cycle member degrades to a root rather than disappearing
- [[2026-07-25-live-rows-two-sources-one-event]] — #30 widened the single `subagent` event instead of adding a second: `task_started` and the old `parent_tool_use_id` bucketing upsert the same key (fallback survives), the `taskToParent` map doubles as the `local_bash` filter and is #31's hook for nesting, absent-not-zero is enforced in engine + merge + render (both halves mutation-verified), and elapsed is the CLI's `duration_ms` with no local clock
- [[2026-07-25-send-payload-encoding-lands-in-the-prefactor]] — #29 shipped the full attachment encoding, not just the empty-list pipe: #32 needs the composer and policy module but no engine work, the embeddable media-type allowlist lives in `attachment-types.ts` as `EMBEDDABLE_IMAGE_TYPES`, and `normalizeSendPayload` is the new trust boundary on `chat:send`
- [[2026-07-25-agents-dock-disk-contract]] — #28 pins what #30's live merge inherits: `listSubagents` returns `null` for "could not read" vs `[]` for "none spawned" (ENOENT is the discriminator), absent sidecar fields stay absent rather than zero-filled, and no new IPC channel was needed; plus the drawer now takes the looked-at session as a prop because a rail-opened session has no engine to ask
- [[2026-07-25-sidecar-model-is-family-not-resolved]] — a sidecar's `model` records the family word asked for (`haiku`), not what served the turn (`xai/grok-4.5`) — corrects spec #25's Further Notes; measured coverage across 28 real sidecars: `model` on 18, `parentAgentId` on none
- [[2026-07-25-task-messages-confirmed-live-shape]] — spike #27 confirms the CLI emits all three task messages (#30 keeps full scope); plus the runtime shape that constrains it — `task_notification` is the real completion signal, `task_updated` is terminal-only, `local_bash` tasks share the stream, and nested agents are invisible to `parent_tool_use_id`
- [[2026-07-25-attachments-embed-images-paths-for-files]] — spec #26: images embed as base64 blocks, non-images go by absolute path for the agent to Read; text-only sends stay a plain string (pinned); caps in one pure policy module; replay shows chips because one persisted screenshot measured 263 KB of base64
- [[2026-07-25-agents-surface-task-messages-not-text-forwarding]] — spec #25: Agents panel feeds on SDK `task_started`/`task_progress`/`task_updated` (spike #27 gates it) instead of `forwardSubagentText`; one panel with list ⇄ map, disk+live merge, nesting via on-disk `parentAgentId`, deterministic SVG map
- [[2026-07-24-wisp-alias-routes-by-name]] — model pill sends the Wisp alias/family **name** as `options.model`, never the resolved model id (a resolved id hangs the turn); reverses #23's untested "route by resolved id" guess, fixed in `f94f1a2`
- [[2026-07-24-ui-polish-model-picker-subagent-viewer]] — batch spec (4 slices, quick-wins-first): Electron zoom (persist), resizable sidebar (localStorage — first UI-pref persistence), input-box model picker (dynamic `wisp routing --json`, mode-aware, keep-conversation), subagent viewer (hybrid: live heartbeat list + disk `getSubagentMessages` preview, Task-card drawer, live+flat)
- [[2026-07-24-in-app-permission-mode-toggle]] — owner-requested: titlebar pill cycles Bypass→Accept Edits→Ask, pins `permissionMode` into SDK options (bypass adds the danger flag); **default bypass** (auto-run all tools); rebuild-but-resume keeps the conversation; **supersedes** `permission-inherits-host`
- [[2026-07-24-click-flip-backend-toggle]] — #19 (closes spec #16): pill→button flips backend via guarded `backend:set-mode`; reuses `chat:target` teardown + clears resume (fresh chat); main broadcasts `backend:changed`; native-locked when wisp unavailable; disabled while `busy`
- [[2026-07-23-busy-switch-block-not-detach]] — #14 resolves the mid-stream caveat by *blocking* (rows + New chat disabled while `busy`), not graceful detach; refresh = focus + manual button + stale-drop req-id
- [[2026-07-23-resume-via-target-close-rebuild]] — resume/switch = `chat:target` close()s + rebuilds engine with `resume`; renderer owns `activeSessionId`; id read via accessor; mid-stream teardown caveat handed to #14
- [[2026-07-23-transcript-parser-pure-renderer-summarises]] — replay = pure main `parseTranscript` → shared `TranscriptMessage`; renderer summarises tool results; replay is read-only
- [[2026-07-23-session-id-accessor-not-event]] — engine surfaces `session_id` via `sessionId()` accessor (not a new EngineEvent); `runTurn` gains `resume`
- [[2026-07-23-tailwind4-tokens]] — Tailwind 4 adopted; OKLCH tokens in `@theme`, preflight off, legacy `:root` aliases
- [[2026-07-23-permission-inherits-host]] — wrapper inherits host Claude Code permissions by design (no Allow/Deny card under host bypassPermissions)
- [[2026-07-23-persistent-glass-deferred]] — acrylic-on-blur flip left as Win11 default; persistence deferred (native-dep vs Mica trade-off)
- [[2026-07-23-engine-terminal-on-stream-death]] — dead streaming query is terminal; recovery = new engine via folder pick
- [[2026-07-23-engine-per-turn-resume]] — engine MVP per-turn query+resume; streaming input deferred to #6/#7 (superseded by #6: streaming input landed)
- [[2026-07-23-bg-isolation-none]] — background legs edit the shared checkout (worktree.bgIsolation none)
- [[2026-07-22-glassy-acrylic-visual]] — glassy/acrylic visual identity (Win11 acrylic + glassmorphism)
- [[2026-07-22-dev-run-only]] — npm run dev only, no installer
- [[2026-07-22-react-vite-ts7]] — React + Vite + TypeScript 7.0.2 renderer
- [[2026-07-22-mvp-bare-core]] — v1 = folder picker + chat + tools + permissions + stop
- [[2026-07-22-cli-login-auth]] — reuse existing Claude Code CLI login, no API key
- [[2026-07-22-agent-sdk-engine]] — Claude Agent SDK in main process, not raw CLI spawn
- [[2026-07-22-custom-chat-ui-headless-engine]] — custom chat UI, not terminal embed

## Related

- [[overview]]
