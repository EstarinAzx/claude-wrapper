---
type: decision
date: 2026-08-05
project: claude-wrapper
tags: [context, decision, cli, spike, effort, measurement]
---

# The CLI's command surface is enumerable, and two asks died on it

## Decision

`supportedCommands()` on a warm handle returns **names**, not just a count. The
entry shape is `object{argumentHint, description, name}`. Measured at **121
commands** on this host binary in `wisped` mode, at zero CLI turns.

A8 had recorded only the count (`"supportedCommandsCount": 121` in
`scripts/spike-116-findings.json`), so every earlier question about *which*
commands exist was answered by speculation. It no longer has to be.

Three results from one probe (`scripts/recon-120-command-surface.mjs`):

- **`/effort` is advertised** — `"Set effort level for model usage"`, argument
  hint `<low|medium|high|xhigh|max|ultracode|auto>`.
- **`/rewind` is absent.**
- **`/bg` is absent** — which is very likely why the owner reported it "doesn't
  work". `.context/flows.md` already recorded that `/bg` is one of three ways to
  **open the CLI's agent view**, a whole-terminal takeover, rather than a
  command that backgrounds anything.

And the model list carries effort metadata directly: `supportsEffort`,
`supportedEffortLevels`, `supportsAdaptiveThinking`, `supportsAutoMode`,
`supportsFastMode`. **14 of 15** models set `supportsEffort: true`;
`supportedEffortLevels` union is `["low","medium","high","xhigh","max"]`.

## Why this is a call and not a grep

#116's landmine is that a bundle grep reads names and proves nothing.
`supportedCommands()` is not that: it is the CLI **enumerating itself** over the
control protocol, which is the evidence kind #116 accepted after its own first
run got the headline answer wrong by name-matching.

## What it cannot settle, stated so it is not over-read

It measures **advertisement**, never **effectiveness** — #117's rule, that a
callable route is not an effective one, is untouched by this. A present name
authorises a build ticket to be *written* against a real command; it does not
prove invoking it through this app's send path does anything.

**Absence is the stronger result.** A name missing from the CLI's own
enumeration kills the "wrap the CLI command" shape outright, which is what
happened to `/rewind` and `/bg`. It does not prove no *other* route exists —
that is #127's question, and it must be probed by calling.

## The effort mismatch, which decided a control's shape

The command advertises **seven** argument values. The SDK's own type carries
**five**:

```
sdk.d.ts:553   export declare type EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
sdk.d.ts:1664  effort?: EffortLevel;        // on the Options type at :1322
```

`ultracode` and `auto` are in neither `EffortLevel` nor any model's
`supportedEffortLevels`. They are **modes, not points on an ordered scale**, so
a linear slider cannot represent them without inventing a position. The control
therefore has five positions, and that is the SDK's decision rather than a
design preference.

Because `effort` rides `Options`, it binds at query **CONSTRUCTION** — #73's
rule, established when `resume` did the same and `ensureQuery` returned early
ever after. A setter that only stores the value will appear to work and change
nothing; changing effort must discard and rebuild the engine exactly as
`model:set` already does.

## Consequence

Spec #120 ships **six build slices and one spike**. Spec #115, working the same
funnel without this measurement, shipped two spikes and no features. The
difference is one zero-turn probe that the main thread ran itself rather than
asking an agent what the CLI supports — neither agent could have supplied it,
and both would have speculated if asked.

## Reversibility

**Easy, and it should be re-run rather than trusted.** The probe is one file,
costs no turns, and imports the app's real `cli-path.ts` and `backend-mode.ts`
so it cannot drift onto a different binary. Re-run it after any CLI upgrade that
makes a command-surface claim doubtful — the counts and the presence flags are
facts about the installed binary, not about this app.

## Related

- [[2026-08-05-a-declared-wire-type-is-not-a-callable-route]]
- [[2026-08-05-a-denial-the-runtime-never-consults-is-not-a-denial]]
- [[2026-08-05-an-accepted-call-is-not-a-supported-route]]
- [[2026-07-27-slash-commands-are-a-dumb-pipe]]
- [[decisions]] · [[pick-up]] · [[active-work]]
