// The model the wrapped Claude Code runs a turn against. Wire type shared by the
// main-side model-mode store, the preload bridge, and the renderer input-box
// pill. `id` is the exact string handed to the SDK as options.model; `label` is
// what the user sees. `current` is null until the user picks — the CLI default.

export type ModelGroup = 'family' | 'alias'

export interface ModelOption {
  id: string
  label: string
  group: ModelGroup
}

export interface ModelInfo {
  models: ModelOption[]
  current: string | null
}
