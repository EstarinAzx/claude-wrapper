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
}

export interface ModelInfo {
  models: ModelOption[]
  current: string | null
}
