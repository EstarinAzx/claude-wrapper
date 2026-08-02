---
type: decision
project: claude-wrapper
date: 2026-08-02
updated: 2026-08-02
tags: [context, decision]
---

# The thinking block arrives, and it is empty

**#87, measurement only — no `src/` change.** Measured live on host CLI
**2.1.220 / SDK 0.3.220**, backend `wisped`, model `claude-opus-5[1m]`, by
`scripts/spike-87-thinking.mjs` — five configs × two turns, findings in
`scripts/spike-87-findings.json`.

**Finding:** a `thinking` content block **does** reach the app, on the app's own
options, with no thinking config set at all. Its `thinking` field is an **empty
string** in every config measured. Only `signature` is populated (756–952 chars).

So the premise behind "stream extended thinking as a collapsed strip" was
answered the wrong way round from how it was posed. #87 asked whether a block
arrives, expecting arrival to be the hard part. It arrives. **There is simply
nothing in it to render.**

## What was measured

Five configs, each a **fresh `query()`** — not five turns of one query. `thinking`
and `maxThinkingTokens` are construction-time options, and this codebase already
paid for that distinction once: #73's `resume` binds when the query is
constructed and `ensureQuery` returns early ever after. Comparing configs across
turns of a single query would have measured the first config five times.

Each config ran a reasoning-inducing prompt and a trivial control, because a turn
that does no thinking cannot distinguish "never arrives" from "nothing to say" —
the #27/#81 trap.

| Question | Result |
|---|---|
| **Q1** — does a `thinking` block appear with no config set? | **yes** — whole block on the `assistant` message, and `content_block_start` with `content_block.type === 'thinking'` in the stream |
| **Q1b** — does it carry text? | **no. 0 chars, every config.** `signature` 756–952 chars |
| **Q1c** — is the result discriminating? | **yes** — 5 blocks on the reasoning prompt, **0** on the trivial control |
| **Q2** — whole block, deltas, or both? | **both, but the deltas carry no text.** The thinking block emits **only `signature_delta`**. No `thinking_delta` ever appeared |
| **Q2b** — does `includePartialMessages: false` change it? | only the streaming half — the whole block still arrives |
| **Q3** — does `system` / `thinking_tokens` land? | **no**, zero across all five configs |
| **Q4** — do `maxThinkingTokens` / `thinking: adaptive` / `display: 'summarized'` change any of it? | **no.** All four configs identical in shape |
| **redacted_thinking** | never seen |

`display: 'summarized'` was tested although #87 does not name it. It is the
confound that would have made every other config a false negative: `ThinkingConfig`
carries `display?: 'summarized' | 'omitted'` (`sdk.d.ts:6916,6938`) and the CLI
takes a matching `--thinking-display`. Had display defaulted to `omitted`, "no
text arrived" would have been a fact about the display mode rather than about the
app. Asking for it explicitly is what makes the emptiness falsifiable.

## The one hypothesis that was wrong, and why checking mattered

The delta census first read as: the thinking block streams `text_delta`, and
`engine.ts:499-510` matches `content_block_delta` + `text_delta` **without
looking at which block the delta belongs to** — so thinking text would already be
leaking into rendered assistant text, a live defect rather than a missing feature.

Correlating deltas to their `content_block_start` **index** killed it. The
thinking block is index 0 and emits only `signature_delta`; the `text_delta`s
belong to a separate `text` block at index 1. **No thinking text is leaking.**
The census recorded delta types but not indices, which is what let the wrong
reading survive as long as it did — a type census answers "what shapes exist",
never "what belongs to what".

## What this does to the feature

**A collapsed thinking strip has nothing to display.** Feature A is not blocked
on reachability and not blocked on the UI question #86 parked — it is blocked on
content. Nothing renderable arrives, under any option the SDK exposes.

Two things could still change that, and neither is an app change:

1. **The backend.** This is the `wisped` path — a gateway could forward the
   signature and strip the text. **The native path is unmeasurable on this
   machine:** with the wisp vars stripped by the app's own `resolveSpawnEnv`,
   the host CLI answers `Not logged in · Please run /login`. Recorded as
   `scripts/spike-87-findings-native.json`, which self-declares
   `erroredTurns: 2` beside its zeros so it cannot be misread as a negative.
   **Closing this needs a human `/login`, not a code change.**
2. **A model or CLI that emits thinking text.** The signature proves a thinking
   block was genuinely produced upstream; only its content is absent here.

## Landmines this run hit

- **`result.subtype` is `'success'` on a failed turn.** The first native control
  returned `subtype: 'success'` twice while every assistant message was the
  synthetic text `Invalid API key`. **`is_error` is the field that says so**, and
  without it a config that never reached a model reports a clean zero and reads
  exactly like a real negative. The census now records `is_error` and the report
  prints `!! N ERRORED TURN(S) — this config measured nothing`.
- **Unsetting `ANTHROPIC_BASE_URL` by hand is not native mode.** It leaves
  `ANTHROPIC_API_KEY` in place, so the CLI takes the gateway's key to the real
  endpoint. `backend-mode.ts` strips **three** `WISP_KEYS`. The spike imports
  `resolveSpawnEnv` for the same reason it imports `cli-path.ts` — a copy drifts
  and quietly measures something else.
- **Evidence split.** #81 wrote everything to a temp dir outside the repo and lost
  its answer three times; #87 asked for evidence in the repo. A raw JSONL carries
  session ids and file contents and the repo is pushed, so: raw stream stays in
  the temp dir, and a **scrubbed** findings file — type census, key sets, counts,
  char *lengths*, zero message text — is committed. Verified by a scan for any
  string field over 60 chars.

See [[2026-08-01-the-spawner-is-one-hop-off-task-started]] for the same
measure-then-ship shape, and #86 for the two constraints that independently block
the UI half.
