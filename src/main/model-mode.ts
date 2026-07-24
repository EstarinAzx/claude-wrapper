// In-app model override. Like permission-mode, a plain in-memory session choice:
// null until the user picks (→ the CLI default, no options.model), reset each
// launch. The list the pill shows is mode-aware and sourced live from the Wisp
// router — never a background process or hook, just a one-shot `wisp routing
// --json` shelled on demand (the app's first and only child_process use, kept
// here behind an injectable fetch so the pure list logic stays unit-testable).
//
// Build-check outcome (options.model routing) — NOT live-probed (an unattended
// relay leg; the live turn probe was declined). Derived from deterministic CLI
// evidence: `wisp routing` rows are exactly the four families, and the session
// bridge rewrites ONLY the family tokens (opus/sonnet/haiku/fable) per request.
// So a family id routes through the bridge; an alias name does not (it is not a
// family). We therefore route an alias by its RESOLVED model id (target.model,
// e.g. grok-4.5) — the string the Wisp BYOK gateway itself knows from `wisp
// routing --json`. If a future live check shows resolved-model ids don't route,
// the fallback is a family REBIND (slot skill) — out of scope for a per-chat
// pill because it mutates global routing (and would hijack other sessions).

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { BackendMode } from '../shared/backend-types'
import type { ModelInfo, ModelOption } from '../shared/model-types'

const execFileP = promisify(execFile)

// The four Claude families — the only tokens the Wisp bridge rewrites, and the
// whole Native list. Constant; their live targets don't matter to the picker
// (the id sent as options.model is the family name itself).
const FAMILIES = ['opus', 'sonnet', 'haiku', 'fable'] as const

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

const familyOptions: ModelOption[] = FAMILIES.map((f) => ({
  id: f,
  label: cap(f),
  group: 'family'
}))

/** Parse `wisp routing --json` into alias options. Tolerant: any shape drift or
 *  parse error yields no aliases (the families still stand). */
export const parseAliases = (routingJson: string): ModelOption[] => {
  try {
    const data: unknown = JSON.parse(routingJson)
    const aliases = (data as { aliases?: unknown })?.aliases
    if (!Array.isArray(aliases)) return []
    return aliases
      .map((a): ModelOption | null => {
        const name = (a as { name?: unknown })?.name
        const model = (a as { target?: { model?: unknown } })?.target?.model
        if (typeof name !== 'string' || typeof model !== 'string') return null
        return { id: model, label: name, group: 'alias' }
      })
      .filter((o): o is ModelOption => o !== null)
  } catch {
    return []
  }
}

/** Build the pill list for a mode: families always; aliases only when wisped and
 *  the routing JSON parsed. */
export const buildModelList = (
  mode: BackendMode,
  routingJson: string | null
): ModelOption[] => {
  const aliases = mode === 'wisped' && routingJson ? parseAliases(routingJson) : []
  return [...familyOptions, ...aliases]
}

export type FetchRouting = () => Promise<string | null>

// Shell `wisp routing --json` once, on demand. shell:true so Windows resolves
// the `wisp` shim (.cmd) on PATH; the command is fully static (no user input),
// so there is no injection surface. Any failure (wisp absent, timeout) → null →
// families-only, so the picker degrades gracefully on a plain machine.
const defaultFetchRouting: FetchRouting = async () => {
  try {
    const { stdout } = await execFileP('wisp', ['routing', '--json'], {
      timeout: 4000,
      windowsHide: true,
      shell: true
    })
    return stdout
  } catch {
    return null
  }
}

/** The model list + current selection for the given backend mode. Only shells
 *  wisp in wisped mode (Native is the constant four families). */
export const listModels = async (
  mode: BackendMode,
  fetchRouting: FetchRouting = defaultFetchRouting
): Promise<ModelInfo> => {
  const routingJson = mode === 'wisped' ? await fetchRouting() : null
  return { models: buildModelList(mode, routingJson), current: currentModel }
}

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
