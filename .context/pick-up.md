---
type: pick-up
project: claude-wrapper
updated: 2026-07-25
tags: [context, pick-up]
---

# Pick up

Start: read `.context/overview.md` + `active-work.md`.

**Last session (interactive):** full `/preset init` funnel — no production code
touched. main is at **`1ac81bc`** plus this wrap-up's `.context/` commit. Two
specs and nine tracer tickets were published; a `/relay` chain
(`.claude/relay-leg.md`, N=1) is draining them unattended.

- **Specs:** #25 Agents surface · #26 Attachments — both `ready-for-agent`, disjoint.
- **Tickets #27–#35**, native GitHub `blocked_by` edges verified.

## Next task — #27, then the frontier

```
#27 spike ──┐
            ├──> #30 live rows
#28 dock ───┴──> #31 nesting ──> #33 map

#29 prefactor ──> #32 paste ──┬──> #34 paperclip
                              └──> #35 replay chips
```

Unblocked now: **#27, #28, #29** — take #27 first (it decides #30's scope).
Frontier query for every later firing: oldest open `ready-for-agent` issue with
`issue_dependencies_summary.blocked_by == 0`. Full ticket table in
[[active-work]].

**#27 is a spike, not a feature.** It runs a real turn that spawns a Task and
records which `task_*` system messages the installed CLI actually emits. Its
deliverable is a **comment on #25**, and the working tree must be clean at the
end — all instrumentation removed. If it disconfirms, #30 re-scopes to the
existing `parent_tool_use_id` inference and loses only the live token /
tool-count / last-tool fields; nothing else in either spec is affected.

## Landmines (still live)

- **Wisp `options.model` = alias/family NAME, never a resolved model id** (hangs
  otherwise) — [[2026-07-24-wisp-alias-routes-by-name]].
- **Never run bare `wisp snapshot`** — it snapshots every row, and a held
  `haiku` snapshot blocks the next `/slot` rebind. Always name the family;
  recover with `wisp snapshot revert <family>`. The retired
  `~/.claude/slot/lease-*.json` files are gone — the snapshot store is the only
  recovery record.
- **New `window.api` channel → add to ALL FOUR mock sites** (`chat-harness.ts` +
  inline in `sidebar`/`session`/`shell` tests) or App-render tests throw. Guard
  every IPC with `isTrustedIpc`. **#28, #29 and #34 all trip this.**
- **#29 touches the core prompt path.** Its guard is a test asserting a
  text-only send still produces plain-string content. If that test fails, the
  fix is the code, never the expectation.
- **Don't re-derive these** (established 2026-07-25, details in [[active-work]]):
  sidecars carry `description`/`model`/`spawnDepth`/`parentAgentId` and
  `parseMeta` drops four of them; nesting is 1-in-185 so design for a flat fan;
  one persisted screenshot is 263 KB of base64; `SDKUserMessage.message` is a
  `MessageParam`, so image blocks are legal.
- **Subagent viewer:** correlate live `parent_tool_use_id` ↔ persisted `agentId`
  via `agent-<id>.meta.json` `toolUseId`; `parseTranscript(raw, {
  includeSidechain: true })` for a subagent's own (all-sidechain) file. `<Chat>`
  is reused read-only in the drawer — a replayed subagent tool card has no
  `subagent` field, so no nested drawer (flat one level, by design).
- Native store `~/.claude/projects/<enc-cwd>/…` (`encodeCwd`); resume ceiling
  (query built once, retarget = close + rebuild); `sessionId()` accessor (no
  `session-id` event); Tailwind `@theme` tokens (preflight off, accent
  `--color-mint`); engine legible-error copy is char-pinned by `engine.test.ts`.
- Fresh `npm install` may skip Electron postinstall → `node
  node_modules/electron/install.js`. Pins: `vite ^7`, `@vitejs/plugin-react ^5`,
  `typescript 7.0.2`.

## GUI check
`node .claude/skills/run-desktop/driver.mjs [--cycle]` — reads the titlebar pills
+ screenshots the built app (needs `npm run build` + `npm i --no-save
playwright-core`). To eyeball a real turn / subagent, stub `dialog.showOpenDialog`
via Playwright `app.evaluate`, pick a folder, then drive the input. **#27 needs
exactly this** to get a real Task-spawning turn under observation.
