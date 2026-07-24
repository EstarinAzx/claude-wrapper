---
type: active-work
project: claude-wrapper
updated: 2026-07-24
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-24, interactive wrap-up (post spec-#20 + grok hotfix)_
_At commit: f94f1a2 on main_

## Current focus

**Spec #20 delivered and CLOSED.** All four tracer slices landed on main, one
squash commit per ticket, each gate-green — drained one ticket per `ticket-loop`
relay leg (legs 1–4, unattended-bypass):

- **#21 Zoom / bigger UI** → `d400918`
- **#22 Resizable sidebar** → `7b296fa` (+ `29816d0`: resize-handle hover uses `--mint`)
- **#23 Model picker (input box)** → `c802ecb` (+ **`f94f1a2`** grok-alias hotfix, below)
- **#24 Subagent working-list + read-only viewer** → `76349e6`

No open `ready-for-agent` tickets remain. Closed specs: #9 (#10–#14), #16
(#17–#19), #20 (#21–#24). #1 (MVP umbrella, unlabelled) is out of scope.

## Done this session (interactive, post-relay-chain)

### #24 subagent viewer — live-eyeballed ✓ (`76349e6`)
Task cards grow a live `.subagent-row` (type + running/done/failed); clicking
opens a read-only `SubagentDrawer` slide-over reusing `<Chat>`. Engine buckets
`parent_tool_use_id`-tagged messages into a `subagent` event, drops them from the
main transcript (no leak), drains in-flight ones to `failed` on abort/error/close.
`subagent-store` reads the transcript tree on demand; correlation
**`agent-<id>.meta.json` `toolUseId` === live `parent_tool_use_id`**. Guarded IPC
`subagents:list` / `subagents:transcript`; `window.api` added to all four mocks.
Live eyeball (Wisped/Bypass) via a `run-desktop` companion driver confirmed the
row renders and the drawer loads — proving the **Wisp bridge forwards
`parent_tool_use_id`** (the one thing unverifiable unattended). Gate: 214/214.

### grok-alias hang HOTFIX ✓ (`f94f1a2`)
Picking a Wisp **alias** in the model pill (e.g. grok) hung the turn forever.
Root cause (live-confirmed): `parseAliases` set the option `id` to the **resolved
model id** (`grok-4.5`), so `options.model=grok-4.5` — but the Wisp bridge routes
by **name** (families + aliases), never a raw model id. Proof: `claude-wisp -p …
--model grok` → responds; `--model grok-4.5` → hangs. Fix: option `id` = alias
name. Verified in-app (picked grok → real response). Reverses the #23 build's
"route by resolved id" guess. See
[[2026-07-24-wisp-alias-routes-by-name]].

## Known issues / not-our-bug

- **Subagents refusing upstream (RESOLVED — not a wrapper bug).** Task subagents
  were seen refusing with 0 tool uses on both opus and sonnet routes
  (`[Response truncated: refusal]`) — diagnosed as the Wisp bridge / CLI harness,
  not claude-wrapper (the wrapper faithfully streams + displays it, and #24
  correctly shows the refusal). Owner then ran grok subagents fine via a `/slot`
  rebind (haiku→grok snapshot/bind/revert) — `GROK_SLOT_OK` / `WROTE_OK` /
  `DELETED_OK`. Subagent deploy is confirmed working; no tracker issue filed.

## Pick up here

**Next task — markdown tables don't render (small, ~1 file).** The assistant
chat renders markdown via `src/renderer/src/components/Chat.tsx:95`
`<ReactMarkdown rehypePlugins={[rehypeHighlight]}>` with **no `remarkPlugins`**,
and `remark-gfm` is **not** a dependency. react-markdown v10 needs `remark-gfm`
for GFM **tables** (also strikethrough / task-lists / autolinks), so a model
emitting a `| … | … |` table shows as raw inline pipes (owner hit this). Fix: add
`remark-gfm` dep + `remarkPlugins={[remarkGfm]}`. Fixes the **subagent drawer**
too (it reuses `<Chat>`). Add a `chat.test.tsx` case that a table renders as a
`<table>`. Owner also floated "or a snippet block" — proper table rendering is
the cleaner call, decide at build.

Beyond that, **queue is empty** — new product work needs a fresh spec
(`/preset init` → to-spec → to-tickets). Owner-pick, not agent auto-pick.

## Deferred (own future specs)

From #24 scope: historical subagent browsing (surface subagents on a loaded past
session), nested subagents (agents spawned by agents, beyond top level), a
dedicated right-hand Agents panel, full live token-by-token subagent streaming
(`forwardSubagentText`). Older: spatial agents-view, live-tail external sessions,
N-concurrent engines, fork-on-resume, global project switcher. Busy-switch could
graduate from *block* to *detach-with-notice* ([[2026-07-23-busy-switch-block-not-detach]]).

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. New model-routing work must send names. See
  [[2026-07-24-wisp-alias-routes-by-name]].
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `tests/sidebar.test.tsx`,
  `tests/session.test.tsx`, `tests/shell.test.tsx`. Guard every IPC with
  `isTrustedIpc`.
- **Subagent correlation:** live `parent_tool_use_id` ↔ persisted `agentId` via
  `agent-<id>.meta.json` `toolUseId`. `subagent-store` reads the tree directly
  (SDK `getSubagentMessages`/`listSubagents` don't expose the meta sidecar);
  `parseTranscript(raw, { includeSidechain: true })` for a subagent's own file.
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind `@theme`
  + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-ui-polish-model-picker-subagent-viewer]] ·
  [[2026-07-24-in-app-permission-mode-toggle]]
