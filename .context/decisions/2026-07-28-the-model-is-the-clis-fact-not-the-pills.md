---
type: decision
project: claude-wrapper
date: 2026-07-28
tickets: [52, 53]
tags: [context, decision, model]
---

# The model is the CLI's fact, not the pill's

## Context

Owner bug report: the pill showed `terra` after `/model opus[1m]` had switched
the CLI, and picking "Opus" ran Opus 4.8. Two symptoms, one habit — **the app
was stating the model instead of asking for it.**

The pill's value was written only by its own IPC, and its menu came from a
hardcoded `FAMILIES = ['opus','sonnet','haiku','fable']` plus a
`wisp routing --json` shell-out. Both are the app asserting something the CLI
owns.

## Decision

**Every model fact comes from the CLI.**

- The **list** is `supportedModels()`, read live per open, no cache — the same
  contract `listCommands()` already had.
- The **current model** is what the CLI reports, on `init` and on each assistant
  message.
- The app keeps exactly one model fact of its own: the user's **pick**, which is
  the only thing that becomes `options.model`.

## Why the pick and the report must stay separate

They are different strings for the same session. A pick is the row's own value
(`opus[1m]`); a report is a resolved id (`claude-opus-5`). Feeding a resolved id
back as `options.model` is the #23 hang — and it would not fail where the
assignment happened, it would fail on the next engine rebuild.

So: `picked` feeds `options.model`, `reported` is display only, display is
`reported ?? picked`. Merging them is the single easiest way to reintroduce #23,
and one test exists purely to kill that merge.

## Consequences

- The app's **only** `child_process` use is gone with `parseAliases`.
- `ModelOption.group` is gone; the family/alias split only ever existed because
  the app built the list.
- `resolvedModel` rides on each row for **labelling only** — matching a reported
  id back to the row that covers it. Never sent as `options.model`.
- The menu is now whatever the CLI advertises: fourteen rows, gaining the 1M
  variants, Fable, and the wisp aliases with real names.
- With no live query the menu is empty rather than showing four families. The
  engine is warmed at folder-pick, so empty now means genuinely wrong.

## What this could not fix, and what did

The CLI expands a Claude **family** token locally, before the request leaves.
Wisp's map has `opus → claude-opus-5`, but Wisp never sees the token — it gets
an already-resolved id and passes it through. This **corrects the note carried
in `model-mode.ts` since #23**: the bridge resolves the *aliases*; the CLI
shadows the *families*.

Consequence: a stale CLI alias table cannot be corrected by rebinding a Wisp
family. Only upgrading the CLI does it — the bundled CLI at 2.1.217 said `opus`
meant Opus 4.8, and 2.1.220 says Opus 5. Two of fourteen rows moved; nothing in
the app was responsible for either value.

## The general lesson

A hand-maintained mirror of someone else's list cannot notice the original
moving, and this one didn't — for as long as the bundled CLI said so. That is
why two tests pin the **absence** of a list-building surface in `model-mode.ts`:
a re-added constant would fail no behavioural test. It would just be quietly
wrong again.

## Related

- [[active-work]] · [[pick-up]] · [[overview]]
- [[2026-07-28-session-metadata-is-the-sdks-job]] — same shape: stop deriving
  what the SDK already states.
