// In-app reasoning-effort override (#124). Mirrors `model-mode.ts` exactly:
// a plain in-memory session choice, null until the user picks (→ no
// options.effort, the CLI's own default), reset each launch.
//
// ONE field, not two — and that asymmetry with model-mode is deliberate. The
// pill has to follow the CLI because `/model` changes the model without the
// pill being touched, so model-mode keeps a separate `reported` value. There is
// no equivalent report for effort: the CLI announces its model on every `init`
// and assistant message, and announces nothing about effort. `/effort` typed
// into the composer therefore CANNOT be tracked here, and a `reported` field
// would be a permanently-null lie. The control shows the pick, which is the
// only fact this process has.
//
// The scale itself is NOT built here. It is `src/shared/effort.ts`'s, which is
// the SDK's own union — and which levels a given model offers is the CLI's
// answer, read live off the model rows. Nothing in this file may grow into a
// list of what a model supports; that is the #53 failure.

import { isEffortLevel, type EffortLevel } from '../shared/effort'

let pickedEffort: EffortLevel | null = null

/** The user's pick — what options.effort is built from. */
export const getEffortMode = (): EffortLevel | null => pickedEffort

/** Record a pick. null → back to the CLI default. */
export const setEffortMode = (effort: EffortLevel | null): void => {
  pickedEffort = effort
}

/** Map the current pick to SDK query options. null → no options.effort (CLI
 *  default); a level → { effort }. Same shape as `toModelOptions`. */
export const toEffortOptions = (effort: EffortLevel | null): Record<string, unknown> =>
  effort ? { effort } : {}

// WHY PORTS — the same reason `list-engine.ts` gives. Everything the `effort:set`
// handler touches lives in `index.ts` module state, which vitest cannot import,
// and the two halves that fail SILENTLY are exactly the ones that must be
// pinned: that a hostile payload never reaches the engine at all, and that the
// resume target is read BEFORE the discard. Inlining these lines in the handler
// would leave both unpinnable.
export type EffortPorts = {
  // The live engine's session id, or null once discarded. Read BEFORE the
  // discard — see below.
  sessionId: () => string | null
  // What the last discarding writer said the next conversation is.
  pendingResume: () => string | null
  discardEngine: (resume: string | null) => void
  broadcast: (effort: EffortLevel | null) => void
}

// The whole `effort:set` transaction. Returns whether the payload was accepted,
// so the caller can pin the rejection rather than infer it from silence.
//
// REJECT, never coerce. `model:set` returns early on a bad payload and this does
// the same: an effort level the SDK does not declare must not reach
// `Options.effort`, and defaulting it would apply a level the user never chose.
//
// THE SHARP EDGE — `effort` rides `Options` (`sdk.d.ts:1664`, the same object
// `model` and `resume` live on), and Options bind at query CONSTRUCTION (#73:
// `ensureQuery` returns early ever after). Storing the pick therefore changes
// nothing on its own; the engine must be thrown away so the next send rebuilds
// with it. And the resume target has to be read while the engine still exists —
// `sessionId()` is unreachable once the handle is dropped, and this is the path
// that KEEPS the conversation, exactly like `model:set` and
// `permission:set-mode`.
export const applyEffortPick = (value: unknown, ports: EffortPorts): boolean => {
  if (value !== null && !isEffortLevel(value)) return false
  setEffortMode(value)
  const resume = ports.sessionId() ?? ports.pendingResume()
  ports.discardEngine(resume)
  ports.broadcast(getEffortMode())
  return true
}
