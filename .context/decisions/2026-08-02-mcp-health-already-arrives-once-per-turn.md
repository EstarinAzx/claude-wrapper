---
type: decision
project: claude-wrapper
date: 2026-08-02
updated: 2026-08-02
tags: [context, decision]
---

# MCP health already arrives, once per turn

**#88, measurement only — no `src/` change.** Measured live on host CLI
**2.1.220 / SDK 0.3.220**, backend `wisped`, by
`scripts/spike-88-mcp-status.mjs` — three configs × two turns, findings in
`scripts/spike-88-findings.json`.

**Finding: every question came back positive, and the feature is cheaper than
#86 assumed.** The MCP data is non-empty, it already reaches the app on *every
turn*, a failing server is visible in it, and the richer on-demand call works
between turns — including before the first turn has ever run.

This is the opposite outcome to #87. There the measurement **closed** the
feature; here it opens it and removes the constraint that looked hardest.

## What was measured

| Question | Result |
|---|---|
| **Q1** — is `init.mcp_servers` ever non-empty? | **yes.** 4 servers measured, 3 of them app-visible (see the cwd caveat) |
| **Q1b** — how often does `init` arrive? | **once per TURN**, not once per session. 2 inits / 2 turns, every config |
| **Q2** — is there a push-style MCP status message? | **no.** The only mcp-shaped key on any message, at any depth, is `$.mcp_servers` on `system:init` |
| **Q2b** — can the status change at all? | **yes — exercised, not assumed.** See the lever below |
| **Q3** — does `mcpServerStatus()` work through a handle built the app's way? | **yes, at all four poll points**, in 0–13ms |
| **Q3b** — does it work before the first turn? | **yes — and before any `init` message has arrived at all** |
| **Q4** — does a failing server show up? | **yes.** `status: 'failed'` with `error: "MCP error -32000: Connection closed"` |
| **Q4b** — is the failure visible on the cheap `init` path too? | **yes**, with `status: 'failed'` |

## The thing that changes the build

**`engine.ts:461-465` is already being handed this, every turn, and throws it
away.** It reads `src.model` off the `init` message and discards the other 15
declared fields, `mcp_servers` among them. So the cheapest possible version of
this feature is a second field read in a branch that already exists — no new
port, no polling, no timer.

That is only true because **`init` fires per turn**, which nobody had checked.
#86 reasoned that MCP health "is a between-turn signal" and therefore needs the
injected-port shape. It does not, for the refresh case: the next turn re-states
it. The port is only needed to refresh **while idle**.

**The two paths carry different amounts, and that is the real trade:**

| | `init.mcp_servers` | `mcpServerStatus()` |
|---|---|---|
| cost | free, already arriving | control round-trip, 0–13ms |
| fields | `name`, `status` — **2 keys, exhaustive** | `name`, `status`, `config`, `error`, `scope`, `serverInfo`, `tools` |
| says a server failed | **yes** | yes |
| says **why** it failed | **no** | yes — `error` |
| available before turn 1 | no | **yes** |

So: `init` is enough to render a red dot. Only the on-demand call can say what
went wrong, and only it can say anything at all before the session's first turn.

## The negative that was nearly vacuous

Configs 1 and 2 both report that the status did not change across four polls.
**On its own that result is worth nothing** — nothing happened to those servers,
so a status that never moved is indistinguishable from one that *cannot* move.
That is the #27/#81 trap and this repo's standing rule: an absence is only a
measurement if the path was exercised.

So config 3 pulls a lever between turns. **It took two tries, and the first one
is a landmine worth keeping:**

- **`toggleMcpServer('spike88_ok', false)` returned ok and changed nothing.**
  Status stayed `connected` on the next poll and on the next turn's init. But
  the method **returns `void`** — it reports nothing about whether the worker
  honoured it — so "returned ok, nothing moved" has two readings a caller cannot
  separate: the status is frozen, or the toggle was a no-op on an sdk-type
  server. **A lever whose own effect is unverifiable cannot test anything.**

- **`setMcpServers` settled it, because it reports its own effect.** It returns
  `{ added, removed, errors }` (`sdk.d.ts:1135-1148`), so the lever is confirmed
  pulled *before* the status is consulted:
  `{"added":["spike88_broken"],"removed":["spike88_ok"],"errors":{"spike88_broken":"MCP error -32000: Connection closed"}}`.
  The poll then dropped 2 servers → 1, and the next turn's init dropped it too.

**`mcpServerStatus()` is therefore live, not a frozen snapshot** — the answer
tracks reality between turns, with no turn required to refresh it. Source
confirms the SDK side does not memoize: `mcpServerStatus()` is
`(await this.request({subtype:"mcp_status"})).response.mcpServers`, a fresh
control request every call.

`setMcpServers` was also the **safe** lever, and that is why it was chosen over
toggling a real server: it affects only *dynamically-added* servers and
explicitly leaves settings-file servers alone, so nothing the spike does can
disturb the machine's real MCP config.

## Caveat on the count, recorded rather than assumed

The spike runs in a temp cwd, and **cwd selects the project MCP scope**. The
temp dir sits under `C:\`, and `~/.claude.json` carries an `mcpServers` entry
keyed `"C:/"` — which arrived in the results as `caveman-shrink` with
**`scope: "local"`**, measured, not inferred. The other three report
`scope: "user"`.

So the shipped app, running on `D:\`, sees **3** servers here, not 4. This does
not move Q1 — non-empty either way — but the measured count is one higher than
the app's. The first draft of the findings file asserted the two cwds were
equivalent; that was wrong and was corrected against the measurement.

## Landmines

- **`toggleMcpServer` returns `void` and its effect is unverifiable.** It
  returned ok for an sdk-type server and changed nothing observable. Do not
  build a control on it without checking the status afterwards.
- **`init` fires once per turn, not once per session.** Any reasoning that
  treats it as a one-shot session snapshot — including #86's — is wrong.
- **An `McpServerStatus` carries `config`, and a stdio config carries `env`.**
  That is where an MCP server's API keys live. The findings file records
  `config`'s key set and `type` only, never its values, and records `error`
  verbatim only for servers the spike itself injected.
- **`disabled` is a status, and it is the common one here** — 3 of 4 servers on
  this machine. A panel that renders only `connected` / `failed` will show
  almost nothing.
- **`scope` is reported per server** (`user` / `local` / `dynamic`) and is how
  the cwd deviation above was caught. It is not in the `init` payload.

## Still out of scope, unchanged

**No UI.** #86's structural block holds: no new titlebar control is permitted,
every dock opens from a titlebar toggle, so which existing dock would host this
is an open owner call. This measurement makes the data cheap; it does not make
a surface reachable.

The settings-parse half remains without a referent — owner call 5 in #86.

## Related

- [[2026-08-02-the-thinking-block-arrives-empty]] — #87, the sibling spike, and
  the harness this one was copied from
- [[2026-08-01-a-level-is-replaced-not-accumulated]] — #83, the injected-port
  shape #86 assumed this feature would need
- [[2026-08-01-the-spawner-is-one-hop-off-task-started]] — #84, the same
  measure-then-ship pattern, and the same falsified premise
