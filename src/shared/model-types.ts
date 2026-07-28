// The model the wrapped Claude Code runs a turn against. Wire type shared by the
// main-side model-mode store, the preload bridge, and the renderer input-box
// pill. `id` is the exact string handed to the SDK as options.model — it is the
// CLI's own `value` for that row, copied verbatim, never translated. `label` is
// the CLI's `displayName`. `current` is null until the user picks — the CLI
// default.
//
// There is deliberately no grouping field. The CLI does not group its models,
// and the previous family/alias split existed only because this app built the
// list itself. It builds nothing now.

export interface ModelOption {
  id: string
  label: string
  // The CLI's `resolvedModel` for this row — the canonical wire id its `value`
  // stands for ('opus[1m]' → 'claude-opus-5[1m]'). Carried ONLY so a model the
  // CLI reports can be matched back to the row that covers it. It is never sent
  // as options.model; see modelLabel below and model-mode.ts.
  resolvedModel?: string
}

export interface ModelInfo {
  models: ModelOption[]
  current: string | null
}

// A model id can reach the pill by two different routes, and they are not the
// same string. A PICK gives the row's own value ('haiku'); the CLI REPORTING
// what it is running gives a resolved id ('claude-haiku-4-5-20251001'). Without
// this the pill reads out the raw id, which is accurate and unreadable.
//
// The context suffix has to be tolerated rather than matched: for one and the
// same session the CLI announces 'claude-opus-5[1m]' on init and
// 'claude-opus-5' on the assistant message, so an exact-only match labels the
// first and not the second. Base-matching can be ambiguous — 'claude-sonnet-5'
// covers both the 'sonnet' and 'sonnet[1m]' rows — which is why it is the LAST
// resort and the exact matches are tried first.
const base = (s: string): string => s.replace(/\[[^\]]*\]$/, '')

export const modelLabel = (models: ModelOption[], current: string | null): string => {
  if (current === null) return 'Default'
  const hit =
    models.find((o) => o.id === current) ??
    models.find((o) => o.resolvedModel === current) ??
    models.find((o) => o.resolvedModel !== undefined && base(o.resolvedModel) === base(current))
  // Falling back to the raw id is deliberate: a model we cannot name is still a
  // model the user should see, and silently showing 'Default' would be a lie.
  return hit?.label ?? current
}
