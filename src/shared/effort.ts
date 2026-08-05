// The reasoning-effort scale (#124), and the trust boundary the main-side
// handler reuses — the same shape as `normalizeBackdrop` and `clampZoom`.
//
// TWO DIFFERENT QUESTIONS, and conflating them is the bug this file exists to
// prevent:
//
//   WHICH VALUES EXIST AT ALL — the SDK's own union. `sdk.d.ts:553` declares
//   `EffortLevel = 'low' | 'medium' | 'high' | 'xhigh' | 'max'`, and
//   `sdk.d.ts:1248` types `ModelInfo.supportedEffortLevels` as an array of
//   exactly those five. A sixth value is outside the SDK's contract, so it is
//   not a point on this scale no matter who advertises it.
//
//   WHICH OF THEM THIS MODEL OFFERS — the CLI's answer, per model row, read
//   live off `supportedEffortLevels`. This is #53's rule and it is why the
//   control's positions are NOT this array: recon measured 14 of 15 rows
//   reporting `supportsEffort: true`, which means one of them reports false,
//   and a control that offered five positions to that model would be lying.
//
// So the array below is the SCALE (its membership and, just as importantly, its
// ORDER — effort is ordinal, and `sdk.d.ts:551` documents it as ascending),
// while the CLI decides which points on it a given model actually has. Nothing
// here may grow into a hand-maintained list of what a model supports; that is
// the failure #53 fixed for the model list.
//
// `ultracode` and `auto` are deliberately absent. They appear in `/effort`'s
// argument hint but in neither the SDK's `EffortLevel` nor any row's
// `supportedEffortLevels` — `sdk.d.ts:6319` shows `ultracode` is a session
// SETTINGS flag ("xhigh effort plus standing dynamic-workflow orchestration"),
// i.e. a mode, not a point on an ordered scale. Inventing a position for either
// is the guess this repo forbids; it is recorded as an owner call in
// `.claude/vibe.md`.

export const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const

export type EffortLevel = (typeof EFFORT_LEVELS)[number]

// Compared, never coerced — `src/shared/backdrop.ts`'s rule, and for the same
// reason: this guards an IPC payload, and `String(value)` would admit anything
// with a convenient `toString`. Unlike `normalizeBackdrop` this REJECTS rather
// than defaulting, because there is no safe default to fall back to: absent
// `options.effort` is the CLI's own choice, and silently substituting a level
// the caller did not ask for would be a change nobody could see.
export const isEffortLevel = (value: unknown): value is EffortLevel =>
  EFFORT_LEVELS.includes(value as EffortLevel)

// Put a CLI-advertised subset back on the scale's own order, dropping anything
// outside it. Filtering EFFORT_LEVELS (rather than sorting the input) does both
// jobs in one pass and cannot produce a position the boundary would later
// refuse — a control offering a value `isEffortLevel` rejects would be a dead
// position, which is worse than not offering it.
export const orderEffortLevels = (levels: readonly string[]): EffortLevel[] =>
  EFFORT_LEVELS.filter((level) => levels.includes(level))

// What the control may offer for one model row. Structurally typed rather than
// importing ModelOption, so this file stays a leaf — `model-types.ts` imports
// from here, never the other way round.
//
// The no-row case is the CLI DEFAULT (nothing picked yet) or a reported id no
// row matched, and it yields the full scale on purpose. Nothing is known to be
// unsupported there, the union across the CLI's rows is all five, and the CLI
// silently downgrades a level a model cannot honour (`sdk.d.ts:186` — "after
// any silent downgrade for the selected model"). Refusing the control until a
// row matches would leave it dead on every fresh launch, which is a different
// dishonesty rather than a smaller one.
export const effortLevelsFor = (
  row?: { supportsEffort?: boolean; supportedEffortLevels?: readonly string[] } | null
): EffortLevel[] => {
  if (!row) return [...EFFORT_LEVELS]
  // The one measured exception. `false` explicitly, not falsy: an absent field
  // is "the CLI did not say", which is the full-scale case below.
  if (row.supportsEffort === false) return []
  if (!row.supportedEffortLevels) return [...EFFORT_LEVELS]
  return orderEffortLevels(row.supportedEffortLevels)
}
