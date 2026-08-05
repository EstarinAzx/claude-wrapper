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

import type { EffortLevel } from './effort'

export interface ModelOption {
  id: string
  label: string
  // The CLI's `resolvedModel` for this row — the canonical wire id its `value`
  // stands for ('opus[1m]' → 'claude-opus-5[1m]'). Carried ONLY so a model the
  // CLI reports can be matched back to the row that covers it. It is never sent
  // as options.model; see modelLabel below and model-mode.ts.
  resolvedModel?: string
  // #124 — the CLI's own answer to "does this model take an effort level, and
  // which ones". Carried per row rather than collapsed to a union, because the
  // union is exactly the lie the effort control must not tell: recon measured
  // 14 of 15 rows supporting effort, so one row does not. Absent fields mean
  // the CLI did not say; see `effortLevelsFor`.
  supportsEffort?: boolean
  supportedEffortLevels?: EffortLevel[]
}

export interface ModelInfo {
  models: ModelOption[]
  current: string | null
  // #124 — the current effort pick, riding this read rather than a second IPC
  // channel. It belongs here because the two are answered by the same question:
  // which levels are offered depends on the model row, so a consumer that has
  // one always wants the other.
  effort?: EffortLevel | null
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

// The row a current model id stands for, or undefined for the CLI default and
// for an id no row covers. Extracted from modelLabel for #124: the effort
// control needs the SAME row this matching finds, and a second copy of these
// three fallbacks would drift from this one the first time either moved.
export const findModel = (
  models: ModelOption[],
  current: string | null
): ModelOption | undefined => {
  if (current === null) return undefined
  return (
    models.find((o) => o.id === current) ??
    models.find((o) => o.resolvedModel === current) ??
    models.find((o) => o.resolvedModel !== undefined && base(o.resolvedModel) === base(current))
  )
}

export const modelLabel = (models: ModelOption[], current: string | null): string => {
  if (current === null) return 'Default'
  // Falling back to the raw id is deliberate: a model we cannot name is still a
  // model the user should see, and silently showing 'Default' would be a lie.
  return findModel(models, current)?.label ?? current
}
