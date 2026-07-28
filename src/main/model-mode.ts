// In-app model override. Like permission-mode, a plain in-memory session choice:
// null until the user picks (→ the CLI default, no options.model), reset each
// launch.
//
// The pickable list is NOT built here. It is read live from the CLI, via
// engine.listModels() → the SDK's supportedModels(). A list this module
// maintained by hand could not notice when the CLI's own list moved, and it did
// not: the app offered four hardcoded family tokens while the CLI advertised
// fourteen rows, and one of the four ('fable') was not even among the CLI's
// values. Nothing here may reintroduce a hardcoded model name — that is the
// whole point of #53, and a new constant would recreate the bug exactly.
//
// options.model — the id sent is the CLI's own `value` for the row it came from
// ('opus[1m]', 'claude-wisp-terra'), copied verbatim. No translation.
//
// On the Wisp bridge specifically — LIVE-CONFIRMED 2026-07-28, and this
// CORRECTS the note this file carried since #23. The CLI expands a Claude
// FAMILY token locally, before the request ever leaves, so the bridge never
// sees it:
//   --model opus  →  init.model = claude-opus-5   (the CLI's table, not Wisp's)
// while an id the CLI does not recognise passes straight through, and there the
// bridge does resolve it:
//   --model claude-wisp-grok  →  routed by Wisp
// The old note had this backwards for the four families: it claimed the bridge
// resolved family names per request. It resolves the ALIASES; the CLI shadows
// the FAMILIES. The practical consequence is that a stale CLI alias table
// cannot be corrected by rebinding a Wisp family — only by upgrading the CLI,
// which is what actually moved `opus` from Opus 4.8 to Opus 5.

// --- Process-wide state (mirrors permission-mode). In-memory, no persistence.

let currentModel: string | null = null

export const getModelMode = (): string | null => currentModel

export const setModelMode = (model: string | null): void => {
  currentModel = model
}

/** Map the current model to SDK query options. null → no options.model (CLI
 *  default); a string → { model }. */
export const toModelOptions = (model: string | null): Record<string, unknown> =>
  model ? { model } : {}
