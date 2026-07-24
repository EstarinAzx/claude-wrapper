---
type: active-work
project: claude-wrapper
updated: 2026-07-24
tags: [context, active-work]
---

# Active Work

_Last updated: 2026-07-24, interactive wrap-up (markdown-tables fix)_
_At commit: fd178b1 on main (+ uncommitted markdown-tables fix, committing now)_

## Current focus

**Queue is empty.** The last standalone task — markdown tables rendering as raw
text — is done (below). Spec #20 and its four slices are closed and on main. No
open `ready-for-agent` tickets remain. New product work needs a fresh spec
(`/preset init` → to-spec → to-tickets) — **owner-pick, not agent auto-pick**.

Closed specs: #9 (#10–#14), #16 (#17–#19), #20 (#21–#24). #1 (MVP umbrella,
unlabelled) is out of scope.

## Done this session (interactive)

### markdown tables render as raw text — FIXED ✓
`Chat.tsx` rendered assistant markdown with `<ReactMarkdown
rehypePlugins={[rehypeHighlight]}>` and **no `remarkPlugins`**, and `remark-gfm`
was not a dependency — so react-markdown v10 showed a `| … | … |` table as raw
inline pipes (owner hit this live). Fix: added `remark-gfm@^4.0.1` dep +
`remarkPlugins={[remarkGfm]}`. Same `<Chat>` is reused read-only in the
**subagent drawer**, so that gets GFM (tables / strikethrough / task-lists /
autolinks) too. New `tests/chat.test.tsx` case asserts a table markdown renders a
`<table>` with 2 `<td>`, not raw pipes. Gate green: typecheck · **215/215** test ·
build. (No decision entry — fix was pre-diagnosed in last session's note; this
session only executed it.)

## Known issues / not-our-bug

- **Subagents refusing upstream (RESOLVED — not a wrapper bug).** Task subagents
  were seen refusing with 0 tool uses (`[Response truncated: refusal]`) —
  diagnosed as the Wisp bridge / CLI harness, not claude-wrapper. Owner then ran
  grok subagents fine via a `/slot` rebind. Subagent deploy confirmed working; no
  tracker issue filed.

## Pick up here

**No queued task.** Start a fresh spec for the next product increment
(`/preset init`). Owner picks from the deferred list below or a new idea.

## Deferred (own future specs)

From #24 scope: historical subagent browsing (surface subagents on a loaded past
session), nested subagents (agents spawned by agents, beyond top level), a
dedicated right-hand Agents panel, full live token-by-token subagent streaming
(`forwardSubagentText`). Older: spatial agents-view, live-tail external sessions,
N-concurrent engines, fork-on-resume, global project switcher. Busy-switch could
graduate from *block* to *detach-with-notice*
([[2026-07-23-busy-switch-block-not-detach]]).

## Landmines (carried forward)

- **Wisp `options.model` = the alias/family NAME, never a resolved model id** — a
  resolved id hangs the turn. New model-routing work must send names. See
  [[2026-07-24-wisp-alias-routes-by-name]].
- **New `window.api` channel → add to ALL FOUR mock sites** or App-render tests
  throw: `tests/chat-harness.ts` + inline mocks in `tests/sidebar.test.tsx`,
  `tests/session.test.tsx`, `tests/shell.test.tsx`. Guard every IPC with
  `isTrustedIpc`.
- **Subagent correlation:** live `parent_tool_use_id` ↔ persisted `agentId` via
  `agent-<id>.meta.json` `toolUseId`. `subagent-store` reads the tree directly;
  `parseTranscript(raw, { includeSidechain: true })` for a subagent's own file.
  `<Chat>` reused read-only in the drawer — replayed subagent tool card has no
  `subagent` field, so no nested drawer (flat one level, by design).
- Resume ceiling + `sessionId()` accessor + native-store facts + Tailwind `@theme`
  + engine legible-error pins — unchanged, see [[pick-up]].

## Related

- [[overview]] · [[decisions]] · [[pick-up]] · [[stack]] · [[happy-path]]
- [[2026-07-24-wisp-alias-routes-by-name]] ·
  [[2026-07-24-ui-polish-model-picker-subagent-viewer]] ·
  [[2026-07-24-in-app-permission-mode-toggle]]
